import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getWhopClient, planKeyForWhopPlanId } from "@/lib/whop";

function toDate(unixOrIso: string | number | null | undefined): Date | null {
  if (unixOrIso === null || unixOrIso === undefined) return null;
  if (typeof unixOrIso === "number") return new Date(unixOrIso * 1000);
  const asNum = Number(unixOrIso);
  if (!Number.isNaN(asNum) && String(asNum) === unixOrIso) return new Date(asNum * 1000);
  const d = new Date(unixOrIso);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function resolveOpticUserId(checkoutConfigurationId: string | null | undefined, metadata: any): Promise<string | null> {
  if (metadata && typeof metadata.optictrader_user_id === "string") return metadata.optictrader_user_id;
  if (!checkoutConfigurationId) return null;
  try {
    const client = getWhopClient();
    const config = await client.checkoutConfigurations.retrieve(checkoutConfigurationId);
    const meta = config.metadata as any;
    if (meta && typeof meta.optictrader_user_id === "string") return meta.optictrader_user_id;
  } catch (err) {
    console.error("Failed to retrieve checkout configuration for attribution", err);
  }
  return null;
}

// Whop's Invoice object carries no metadata — match the payer to our User via
// their Whop user id (once known) or their email (always present, unique in our DB).
async function resolveUserFromInvoice(invoice: any) {
  const whopUserId = invoice.user?.id as string | undefined;
  if (whopUserId) {
    const byWhopId = await prisma.user.findUnique({ where: { whopUserId } });
    if (byWhopId) return byWhopId;
  }
  const email = invoice.email_address as string | null | undefined;
  if (email) {
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) return byEmail;
  }
  return null;
}

function invoiceAmount(invoice: any): number {
  const items = Array.isArray(invoice.line_items) ? invoice.line_items : [];
  return items.reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0);
}

// Creator attribution lives on our own Referral row (set at signup via a ?ref= link,
// or created/updated here if the code was instead entered at checkout) — not on the
// invoice, which carries no metadata at all.
async function creditReferralConversion(creatorCodeValue: string | null | undefined, userId: string) {
  if (creatorCodeValue) {
    const creatorCode = await prisma.creatorCode.findUnique({ where: { code: creatorCodeValue.toUpperCase() } });
    if (creatorCode) {
      await prisma.referral
        .upsert({
          where: { referredUserId: userId },
          create: { referredUserId: userId, creatorCodeId: creatorCode.id, status: "converted", convertedAt: new Date() },
          update: { creatorCodeId: creatorCode.id, status: "converted", convertedAt: new Date() },
        })
        .catch(() => {});
      return;
    }
  }
  await prisma.referral
    .updateMany({
      where: { referredUserId: userId, status: "attributed" },
      data: { status: "converted", convertedAt: new Date() },
    })
    .catch(() => {});
}

export async function POST(req: NextRequest) {
  const bodyText = await req.text();
  const headers = Object.fromEntries(req.headers);

  let event: { id: string; type: string; data: any };
  try {
    event = getWhopClient().webhooks.unwrap(bodyText, { headers }) as any;
  } catch (err) {
    console.error("Whop webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await prisma.webhookEvent.create({ data: { eventId: event.id, eventType: event.type } });
  } catch {
    // Unique constraint violation -> already processed this exact event id.
    return NextResponse.json({ ok: true, deduped: true });
  }

  try {
    switch (event.type) {
      case "membership.activated": {
        const membership = event.data;
        const planKey = planKeyForWhopPlanId(membership.plan?.id);
        const optictraderUserId = await resolveOpticUserId(membership.checkout_configuration_id, membership.metadata);
        if (!planKey || !optictraderUserId) break;

        const user = await prisma.user.findUnique({ where: { id: optictraderUserId } });
        if (!user) break;

        const periodStart = toDate(membership.renewal_period_start);
        const periodEnd = toDate(membership.renewal_period_end);

        await prisma.$transaction([
          prisma.user.update({
            where: { id: user.id },
            data: {
              plan: planKey,
              whopMembershipId: membership.id,
              whopUserId: user.whopUserId ?? membership.user?.id ?? undefined,
              ...(planKey === "monthly" ? { aiPeriodStart: periodStart, aiPeriodEnd: periodEnd, aiMessagesUsed: 0 } : {}),
            },
          }),
          prisma.subscription.upsert({
            where: { whopMembershipId: membership.id },
            create: {
              userId: user.id,
              whopMembershipId: membership.id,
              whopPlanId: membership.plan?.id || "",
              status: membership.status,
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
              cancelAtPeriodEnd: Boolean(membership.cancel_at_period_end),
            },
            update: {
              status: membership.status,
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
              cancelAtPeriodEnd: Boolean(membership.cancel_at_period_end),
            },
          }),
        ]);

        await creditReferralConversion(membership.metadata?.creator_code as string | null | undefined, user.id);
        break;
      }

      case "membership.deactivated": {
        const membership = event.data;
        await prisma.subscription
          .update({ where: { whopMembershipId: membership.id }, data: { status: membership.status } })
          .catch(() => {});

        const sub = await prisma.subscription.findUnique({ where: { whopMembershipId: membership.id } });
        if (sub) {
          const user = await prisma.user.findUnique({ where: { id: sub.userId } });
          // Only downgrade if this was their current membership (avoids an old,
          // already-replaced membership deactivating retroactively flipping them back).
          if (user && user.whopMembershipId === membership.id) {
            await prisma.user.update({ where: { id: user.id }, data: { plan: "expired" } });
          }
        }
        break;
      }

      // Whop bills through Invoice objects, not a standalone "payment" webhook —
      // invoice.paid is the successful-charge signal (covers both the first charge
      // and every renewal). Invoices carry no metadata, so the payer is matched via
      // resolveUserFromInvoice (whopUserId once known, else email).
      case "invoice.paid": {
        const invoice = event.data;
        const user = await resolveUserFromInvoice(invoice);
        if (!user) break;

        const planKey = planKeyForWhopPlanId(invoice.current_plan?.id);
        const referral = await prisma.referral.findUnique({ where: { referredUserId: user.id } });

        await prisma.payment
          .upsert({
            where: { whopPaymentId: invoice.id },
            create: {
              userId: user.id,
              whopPaymentId: invoice.id,
              amount: invoiceAmount(invoice),
              currency: invoice.current_plan?.currency || "usd",
              planKey: planKey || "unknown",
              status: "succeeded",
              creatorCodeId: referral?.creatorCodeId ?? null,
            },
            update: { status: "succeeded" },
          })
          .catch(() => {});
        break;
      }

      // A renewal charge failed and the invoice is now overdue — Whop retries billing
      // on its own schedule. Access stays on until membership.deactivated actually
      // lands; we only log the failure here, never revoke on this alone.
      case "invoice.past_due": {
        const invoice = event.data;
        const user = await resolveUserFromInvoice(invoice);
        if (!user) break;
        const planKey = planKeyForWhopPlanId(invoice.current_plan?.id);
        await prisma.payment
          .upsert({
            where: { whopPaymentId: invoice.id },
            create: {
              userId: user.id,
              whopPaymentId: invoice.id,
              amount: invoiceAmount(invoice),
              currency: invoice.current_plan?.currency || "usd",
              planKey: planKey || "unknown",
              status: "failed",
            },
            update: { status: "failed" },
          })
          .catch(() => {});
        break;
      }

      // Whop's current event set has no dedicated refund/chargeback webhook — void or
      // uncollectible invoices just get logged for the audit trail. Revoking a paid
      // lifetime purchase on either of these alone risks a false-positive (e.g. an
      // unrelated draft invoice getting voided); handle actual refunds via /admin.
      case "invoice.voided":
      case "invoice.marked_uncollectible": {
        const invoice = event.data;
        const status = event.type === "invoice.voided" ? "voided" : "uncollectible";
        await prisma.payment.updateMany({ where: { whopPaymentId: invoice.id }, data: { status } }).catch(() => {});
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error(`Whop webhook handler failed for ${event.type}`, err);
    // Still 200 — we've recorded the event id, so Whop won't need to retry indefinitely
    // for a bug on our side; the WebhookEvent row + logs give us an audit trail to fix and reconcile.
  }

  return NextResponse.json({ ok: true });
}
