import { buildWaitlistConfirmationEmail } from "@/lib/email/waitlist-confirmation";

function parseFromAddress(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return (match?.[1] ?? from).trim();
}

/** Sends confirmation after a new signup. Never throws; logs on failure or missing config. */
export async function sendWaitlistConfirmationEmail(to: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.WAITLIST_FROM_EMAIL?.trim();
  if (!apiKey || !from) {
    console.info(
      "[waitlist] confirmation email skipped (RESEND_API_KEY or WAITLIST_FROM_EMAIL unset)",
    );
    return;
  }

  const preorderUrl = process.env.NEXT_PUBLIC_PREORDER_URL?.trim() ?? "";
  const { subject, text, html } = buildWaitlistConfirmationEmail({ preorderUrl });
  const replyTo = parseFromAddress(from);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
        html,
        reply_to: replyTo,
        headers: {
          "List-Unsubscribe": `<mailto:${replyTo}?subject=unsubscribe>`,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[waitlist] Resend API error:", res.status, body);
    }
  } catch (err) {
    console.error("[waitlist] Resend request failed:", err);
  }
}