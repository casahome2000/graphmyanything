const SUBJECT = "You're on the GraphMyAnything waitlist";

function parseFromAddress(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return (match?.[1] ?? from).trim();
}

function buildBodies(preorderUrl: string) {
  const preorderBlock = preorderUrl
    ? `\n\nFounding member preorder ($49/yr, refundable until launch): ${preorderUrl}`
    : "";

  const text = `Thanks for joining the GraphMyAnything waitlist.

GraphMyAnything is chart & metric memory for AI agents—one place for agents and cron jobs to track(), query(), and share live chart URLs for the numbers that matter.${preorderBlock}

We'll email you when we launch. Reply to this message to unsubscribe from waitlist updates.`;

  const preorderHtml = preorderUrl
    ? `<p style="margin:16px 0 0"><a href="${preorderUrl}" style="color:#22d3ee">Founding member preorder</a> — $49/yr, refundable until public launch.</p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:24px;background:#06060a;color:#f4f4f7;font-family:ui-sans-serif,system-ui,sans-serif;font-size:15px;line-height:1.55">
  <p style="margin:0 0 12px">Thanks for joining the <strong>GraphMyAnything</strong> waitlist.</p>
  <p style="margin:0;color:#8b8b9e">GraphMyAnything is chart &amp; metric memory for AI agents—track(), query(), and live chart URLs for the metrics your agents rely on.</p>
  ${preorderHtml}
  <p style="margin:20px 0 0;color:#8b8b9e;font-size:13px">We'll reach out at launch. Reply to this email to unsubscribe from waitlist updates.</p>
</body>
</html>`;

  return { text, html };
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
  const { text, html } = buildBodies(preorderUrl);
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
        subject: SUBJECT,
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