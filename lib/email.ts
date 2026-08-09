export const SUPPORT_EMAIL = "support.optictrader@gmail.com";

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function getBaseUrl() {
  if (process.env.RAILWAY_PUBLIC_DOMAIN) return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  if (process.env.APP_URL) return process.env.APP_URL;
  return "http://localhost:3000";
}

async function sendEmail(to: string, subject: string, html: string, replyTo: string = SUPPORT_EMAIL) {
  if (!process.env.RESEND_API_KEY) return { sent: false, reason: "not configured" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "OpticTrader <onboarding@resend.dev>",
        to,
        subject,
        html,
        reply_to: replyTo,
      }),
    });
    if (!res.ok) return { sent: false, reason: await res.text() };
    return { sent: true };
  } catch (err: any) {
    return { sent: false, reason: err.message || "request failed" };
  }
}

function emailShell({ heading, bodyHtml, ctaLabel, ctaUrl }: { heading: string; bodyHtml: string; ctaLabel?: string; ctaUrl?: string }) {
  return `
<div style="background:#eef0fb;padding:32px 16px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;">
    <tr>
      <td style="background:#5f5ef5;border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
        <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">◎ OpticTrader</span>
      </td>
    </tr>
    <tr>
      <td style="background:#ffffff;padding:32px;border-radius:0 0 12px 12px;">
        <h1 style="margin:0 0 16px;font-size:18px;font-weight:700;color:#1a1730;">${heading}</h1>
        <div style="font-size:15px;line-height:1.65;color:#3a3654;">${bodyHtml}</div>
        ${
          ctaLabel && ctaUrl
            ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 4px;">
                <tr>
                  <td style="background:#5f5ef5;border-radius:8px;">
                    <a href="${ctaUrl}" style="display:inline-block;padding:12px 26px;color:#ffffff;font-weight:700;text-decoration:none;font-size:14px;">${ctaLabel}</a>
                  </td>
                </tr>
              </table>`
            : ""
        }
      </td>
    </tr>
    <tr>
      <td style="padding:20px 8px 0;text-align:center;color:#8b87a3;font-size:12px;">
        The OpticTrader team
      </td>
    </tr>
  </table>
</div>`;
}

export function sendVerificationEmail(to: string, displayName: string, code: string) {
  return sendEmail(
    to,
    `${code} is your OpticTrader verification code`,
    emailShell({
      heading: `One quick step, ${displayName}`,
      bodyHtml: `<p>Enter this code to confirm your email and start your 5-day free trial:</p>
        <p style="text-align:center;margin:20px 0;">
          <span style="display:inline-block;background:#eef0fb;color:#1a1730;font-size:28px;font-weight:700;letter-spacing:0.15em;padding:14px 28px;border-radius:10px;">${code}</span>
        </p>
        <p>This code expires in 15 minutes. If you didn't sign up for OpticTrader, you can ignore this email.</p>`,
    })
  );
}

export function sendWelcomeEmail(to: string, displayName: string) {
  const baseUrl = getBaseUrl();
  return sendEmail(
    to,
    "Welcome to OpticTrader — your 5-day trial has started",
    emailShell({
      heading: `Welcome, ${displayName} 👋`,
      bodyHtml: `<p>Your OpticTrader journal is ready to go. Here's what's waiting for you:</p>
        <ul style="margin:0 0 8px;padding-left:20px;">
          <li>A journal built for setups, emotions, and rules — not just PnL</li>
          <li>An AI Coach that learns your actual trading patterns</li>
          <li>A win/loss calendar to track your streaks</li>
        </ul>
        <p>Your free trial runs for 5 days — no card required.</p>`,
      ctaLabel: "Open your journal",
      ctaUrl: `${baseUrl}/journal`,
    })
  );
}

export function sendTrialEndingEmail(to: string, displayName: string, daysLeft: number) {
  const baseUrl = getBaseUrl();
  const soon = daysLeft <= 1 ? "ends today" : `ends in ${daysLeft} days`;
  return sendEmail(
    to,
    daysLeft <= 1 ? "Your OpticTrader trial ends today" : `Your OpticTrader trial ends in ${daysLeft} days`,
    emailShell({
      heading: `Hey ${displayName}, your trial ${soon}`,
      bodyHtml: `<p>You've had a taste of what OpticTrader can do — the journal, the calendar, the AI Coach that actually knows your history.</p>
        <p>Keep the momentum going by checking out a plan that fits how often you trade.</p>`,
      ctaLabel: "See pricing",
      ctaUrl: `${baseUrl}/pricing`,
    })
  );
}

export function sendMonthlyWelcomeEmail(to: string, displayName: string) {
  const baseUrl = getBaseUrl();
  return sendEmail(
    to,
    "You're on OpticTrader Monthly 🎉",
    emailShell({
      heading: `You're in, ${displayName} 🎉`,
      bodyHtml: `<p>Thanks for subscribing to OpticTrader Monthly. You've got full access to your journal, dashboard, calendar, AI Coach, and Friends.</p>
        <p>Your AI Coach allowance renews every month — use it to review your setups, catch discipline slips, and spot the patterns that actually make you money.</p>`,
      ctaLabel: "Open your journal",
      ctaUrl: `${baseUrl}/journal`,
    })
  );
}

export function sendLifetimeWelcomeEmail(to: string, displayName: string) {
  const baseUrl = getBaseUrl();
  return sendEmail(
    to,
    "Welcome to OpticTrader Lifetime 🚀",
    emailShell({
      heading: `You're in for good, ${displayName} 🚀`,
      bodyHtml: `<p>Thanks for grabbing Lifetime access. Everything is unlocked, forever — unlimited AI Coach messages, every feature we ship from here on, no more bills.</p>
        <p>Welcome to the inner circle.</p>`,
      ctaLabel: "Open your journal",
      ctaUrl: `${baseUrl}/journal`,
    })
  );
}

export function sendPasswordResetEmail(to: string, displayName: string, resetUrl: string) {
  return sendEmail(
    to,
    "Reset your OpticTrader password",
    emailShell({
      heading: "Reset your password",
      bodyHtml: `<p>Hi ${displayName},</p><p>Someone requested a password reset for your account. Click below to set a new one — this link expires in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email — your password won't change.</p>`,
      ctaLabel: "Reset your password",
      ctaUrl: resetUrl,
    })
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

export function sendSupportNotification(name: string, fromEmail: string, message: string) {
  return sendEmail(
    SUPPORT_EMAIL,
    `New support message from ${name}`,
    emailShell({
      heading: "New support message",
      bodyHtml: `<p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(fromEmail)})</p>
        <p style="white-space:pre-wrap;">${escapeHtml(message)}</p>`,
    }),
    fromEmail
  );
}

export function sendChurnEmail(to: string, displayName: string) {
  const baseUrl = getBaseUrl();
  return sendEmail(
    to,
    "Why'd you leave us?",
    emailShell({
      heading: `We noticed you left, ${displayName}`,
      bodyHtml: `<p>Your OpticTrader subscription ended. We'd love to know what didn't work — just reply to this email and tell us.</p>
        <p>Your journal data is still safe if you ever want to come back.</p>`,
      ctaLabel: "See what's changed",
      ctaUrl: `${baseUrl}/pricing`,
    })
  );
}
