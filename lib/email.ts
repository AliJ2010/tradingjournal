export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendWelcomeEmail(to: string, displayName: string) {
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
        subject: "Welcome to Vantage — your 5-day trial has started",
        html: `<p>Hi ${displayName},</p><p>Your Vantage trading journal is ready to go. Your free trial runs for 5 days — no card required.</p><p>Happy trading.</p>`,
      }),
    });
    if (!res.ok) return { sent: false, reason: await res.text() };
    return { sent: true };
  } catch (err: any) {
    return { sent: false, reason: err.message || "request failed" };
  }
}
