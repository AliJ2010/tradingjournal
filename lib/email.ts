export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return { sent: false, reason: "not configured" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "Vantage <onboarding@resend.dev>",
        to,
        subject,
        html,
      }),
    });
    if (!res.ok) return { sent: false, reason: await res.text() };
    return { sent: true };
  } catch (err: any) {
    return { sent: false, reason: err.message || "request failed" };
  }
}

const footer = `<p style="color:#8d90ab;font-size:12px;margin-top:24px">— The Vantage team</p>`;

export function sendWelcomeEmail(to: string, displayName: string) {
  return sendEmail(
    to,
    "Welcome to Vantage — your 5-day trial has started",
    `<p>Hi ${displayName},</p><p>Your Vantage trading journal is ready to go. Your free trial runs for 5 days — no card required.</p><p>Happy trading.</p>${footer}`
  );
}

export function sendTrialEndingEmail(to: string, displayName: string, daysLeft: number) {
  return sendEmail(
    to,
    daysLeft <= 1 ? "Your Vantage trial ends today" : `Your Vantage trial ends in ${daysLeft} days`,
    `<p>Hi ${displayName},</p><p>Just a heads up — your free trial ${daysLeft <= 1 ? "ends today" : `ends in ${daysLeft} days`}. Keep the momentum going by upgrading whenever you're ready.</p>${footer}`
  );
}

export function sendMonthlyWelcomeEmail(to: string, displayName: string) {
  return sendEmail(
    to,
    "You're on Vantage Monthly 🎉",
    `<p>Hi ${displayName},</p><p>Thanks for subscribing to Vantage Monthly. You've got full access to your journal, dashboard, calendar, AI Coach, and Friends.</p>${footer}`
  );
}

export function sendLifetimeWelcomeEmail(to: string, displayName: string) {
  return sendEmail(
    to,
    "Welcome to Vantage Lifetime 🚀",
    `<p>Hi ${displayName},</p><p>You're in for good — thanks for grabbing Lifetime access. Every future feature is included, no more bills.</p>${footer}`
  );
}

export function sendChurnEmail(to: string, displayName: string) {
  return sendEmail(
    to,
    "Why'd you leave us?",
    `<p>Hi ${displayName},</p><p>We noticed your Vantage subscription ended. We'd love to know what didn't work for you — just reply to this email and let us know.</p><p>Your journal data is still safe if you ever want to come back.</p>${footer}`
  );
}
