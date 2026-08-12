# Whop payments — manual setup guide

This is everything you need to click through in the Whop dashboard so the code that's already been built actually goes live. Do these in order. Nothing in the app will show real prices or accept real payments until you finish the "Env vars" section — until then, `/pricing` shows regular pricing, and `/checkout/*` shows "Billing isn't configured yet." instead of crashing, so it's safe to do this at your own pace.

## 1. Create your Whop company (if you haven't already)

1. Go to [whop.com/dashboard](https://whop.com/dashboard) and sign in / create an account.
2. If you don't already have a company, click **Create company** (top-left company switcher) and fill in the name (e.g. "OpticTrader").
3. Open **Settings → API Keys** (left sidebar). Click **Create API key**, name it something like `optictrader-prod`. Copy the key — this is `WHOP_API_KEY`.
4. Still in Settings, find your **Company ID** (starts with `biz_`) — this is `WHOP_COMPANY_ID`.

## 2. Create a product

1. Go to **Products** in the left sidebar → **Create product**.
2. Name it "OpticTrader Pro" (or similar). This one product will hold both plans below.

## 3. Create the Monthly plan

1. Inside the product, go to the **Pricing** tab → **Add plan**.
2. Type: **Renewal / Subscription**. Billing period: **30 days**.
3. Price: **$40.00 USD**.
4. Save it, then open the plan and copy its plan ID (starts with `plan_`) — this is `WHOP_MONTHLY_PLAN_ID`.

## 4. Create the Lifetime plan

1. Same product, **Add plan** again.
2. Type: **One-time purchase** (not a subscription — do not pick renewal here).
3. Price: **$250.00 USD**.
4. Save it, copy its plan ID — this is `WHOP_LIFETIME_PLAN_ID`.

## 5. Set up the launch discount (optional, first-month promo)

The app has its own "general discount code" system (`DiscountCode` in the database, managed from `/admin`) that's independent of Whop's promo codes — but for the discount to actually reduce the charge, it needs a real Whop promo code behind it.

1. In Whop, go to **Marketing → Promo codes** → **Create promo code**.
2. Code: `LAUNCH25` (or whatever you like — it's just internal, customers never type this one, it's applied automatically).
3. Discount: **25% off**.
4. Duration: since Whop requires a specific number of months rather than "forever," set it to a large number (e.g. `999`) so it effectively never expires on its own — you'll disable it manually from `/admin` when the launch window ends.
5. Scope it to the **Monthly** plan only (leave Lifetime unscoped, unless you want a launch price there too — if so, create a second promo code scoped to Lifetime and a second `DiscountCode` row for it in `/admin`).
6. Copy the promo code's ID (starts with `promo_`).
7. In OpticTrader, go to `/admin` → **Discount codes** → **Add**, code `LAUNCH25`, 25% off, plan: Monthly. This makes the discount show up automatically on `/pricing` — no customer action needed. (The Whop promo code ID isn't required in this form for the discount to display, but without it the actual Whop checkout won't discount the charge — see the note in step 6 below on wiring `whopPromoCodeId`.)

> Note: today the general-discount admin form doesn't have a field to paste the Whop promo code ID. If you want the launch discount to be enforced by Whop itself (not just displayed), ask me to add that field, or use a creator code instead (see below), whose admin flow already creates the Whop promo code for you with one click.

## 6. Enable affiliates (for creator codes)

1. Go to **Settings → Affiliates** (or **Marketing → Affiliates**, naming varies by dashboard version).
2. Turn affiliates **on** for your company/product.
3. Set a default/global affiliate commission percentage if Whop asks — this is just a fallback; each creator's actual commission is set per-creator in OpticTrader's `/admin`, not here.

## 7. Invite a creator (e.g. "John")

1. Still under **Affiliates**, click **Invite affiliate** (or **Add affiliate**).
2. Enter John's email. He'll get a Whop invite — he doesn't need his own product or company, just to accept the affiliate invite.
3. Once accepted, open his affiliate record and copy:
   - His **Affiliate ID** (starts with `aff_`) — this is `whopAffiliateId`.
   - His **Affiliate code** (a short string Whop generates, e.g. `JOHN`) — this is `whopAffiliateCode`.

## 8. Set up John in OpticTrader's admin

1. Log into OpticTrader with your admin account, go to `/admin` → **Creators / Affiliates**.
2. Find or create John's user account, then create his creator code, e.g. `JOHN25`.
3. Paste in his `whopAffiliateId` and `whopAffiliateCode` from step 7.
4. Under his code, click **Add plan rule** for Monthly:
   - Discount: 25%, type percent.
   - Commission: 20%, type percent.
   - Commission duration: **recurring (all payments)** if he should keep earning on renewals, or **first payment only** if it's a one-time bonus.
   - Check **Create Whop promo code** — this calls Whop's API for you and creates a promo code literally named `JOHN25`, scoped to the Monthly plan, and saves its ID. You don't need to go create it manually in Whop.
5. Repeat for Lifetime if John is allowed to promote it too (set its own discount/commission — don't assume it matches Monthly).
6. Back in Whop, open John's affiliate record and create an **Override** so his commission actually pays out at 20% (not just the global default): **Affiliates → John → Add override** → percentage `20`, applies to: **all payments** (recurring) or **first payment only**, scoped to the Monthly plan. This is the step that makes Whop actually pay him — the OpticTrader admin form records the same numbers for your own dashboards/analytics, but Whop's own override is what moves money.

## 9. Add the Whop IDs to OpticTrader's environment variables

In Railway (or wherever OpticTrader is hosted), add:

```
WHOP_API_KEY=<from step 1>
WHOP_WEBHOOK_SECRET=<from step 10 below>
WHOP_COMPANY_ID=<from step 1>
WHOP_MONTHLY_PLAN_ID=<from step 3>
WHOP_LIFETIME_PLAN_ID=<from step 4>
```

Nothing above works until all five are set — `/pricing` and `/checkout` silently no-op with a friendly error until then, so there's no rush/no risk in doing this last.

## 10. Create the webhook endpoint

1. In Whop, go to **Settings → Webhooks** → **Create webhook**.
2. URL: `https://<your-domain>/api/webhooks/whop` (e.g. `https://www.optictrader.me/api/webhooks/whop`).
3. Select these events (shown in the dashboard with underscores, delivered on the wire as dot-notation — same events either way):
   - `invoice_paid` — a charge succeeded (covers both the first payment and every renewal)
   - `invoice_past_due` — a renewal charge failed and Whop is retrying; access is **not** revoked on this alone
   - `invoice_voided`
   - `invoice_marked_uncollectible`
   - `membership_activated` — the one that actually grants premium access
   - `membership_deactivated` — the one that actually revokes it

   Note: Whop's current webhook catalog has no dedicated `payment.succeeded`/`refund.created`/`dispute.created`/`membership.cancel_at_period_end_changed` events for new webhook subscriptions (their SDK's type definitions still list them for backwards compatibility, but the live "Create webhook" dashboard doesn't offer them) — everything above is what OpticTrader's webhook handler (`app/api/webhooks/whop/route.ts`) is actually built against. Refunds/chargebacks currently have no dedicated webhook signal at all; if you need to revoke a refunded Lifetime purchase, do it manually from `/admin` for now.
4. Save, then copy the **signing secret** shown — this is `WHOP_WEBHOOK_SECRET` from step 9. To see the full secret (the table only shows it masked), click it once — this copies the full value to your clipboard even though the display stays truncated.

## 11. Apple Pay / Google Pay domain verification (optional)

If you want Apple Pay to show up in the embedded checkout, Whop may ask you to verify your domain (usually a file you upload to `/.well-known/`). Check **Settings → Payments** for a domain verification prompt — Google Pay/Link typically need no extra setup.

## 12. Test checklist

Do these in order once the env vars are live:

- [ ] **Basic checkout**: go to `/pricing`, pick Monthly, complete checkout with a real card (or Whop's test mode if your account has it). Confirm you land on `/checkout/success`, it shows "Confirming your payment…" briefly, then "Welcome to OpticTrader Pro" with the right plan/amount, and your account gets premium access within a few seconds without you doing anything manually.
- [ ] **Lifetime checkout**: same, but pick Lifetime — confirm it's a one-time charge (no recurring billing set up on the membership) and access is permanent (`plan: "lifetime"`).
- [ ] **Creator attribution**: visit `optictrader.me/pricing?ref=JOHN25` (or wherever John shares his link), sign up/log in, go to checkout — confirm the code is already applied and the price reflects his discount. Complete a real purchase.
- [ ] **Creator payout**: after that purchase, check Whop → Affiliates → John shows the sale and a commission owed/paid matching the override from step 8. Check `/creator` (logged in as John) shows the sale under "Sales" and the referral under "Referrals" with status `converted`.
- [ ] **Recurring renewal**: for a Monthly test subscription, either wait for a real renewal or use Whop's test-mode "simulate renewal" if available — confirm a new `payment.succeeded` webhook fires, `aiMessagesUsed` resets to 0, and (if via a creator code with recurring commission) John's affiliate override pays again.
- [ ] **Cancellation**: from `/account`, cancel a Monthly subscription. Confirm premium access continues until the paid period actually ends (check `Subscription.currentPeriodEnd`), then flips off automatically once Whop sends `membership.deactivated`.
- [ ] **Failed payment**: use a Whop test card that declines (if available) — confirm no premium access is granted and the checkout page shows a clear retryable error.
- [ ] **General discount, no commission**: apply the `LAUNCH25` code (no `?ref=`) — confirm the price drops but nothing shows up under any creator's referrals/commissions.

## Where each piece lives in the code (for your reference, not something you need to touch)

- `lib/whop.ts` — Whop SDK client + plan-ID lookups, reads the env vars above.
- `lib/pricing.ts` — resolves the one effective discount (creator code beats the general launch code; never both).
- `app/api/checkout/session/route.ts` — creates the Whop checkout, attaches your user ID + affiliate code server-side.
- `app/api/webhooks/whop/route.ts` — the only place that ever grants/revokes premium access; verifies Whop's signature and is idempotent (safe against duplicate deliveries).
- `lib/entitlements.ts` — `shouldEnforcePaywall()` only turns on once all five env vars above are set, so there's no lockout risk while you're mid-setup.
- `/admin` → Creators/Affiliates and Discount codes — where you manage codes day-to-day without touching code.
