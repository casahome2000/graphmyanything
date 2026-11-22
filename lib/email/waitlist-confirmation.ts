import { EMAIL_BRAND, waitlistChartImageUrl } from "./constants";
import { renderBulletproofButton, renderEmailLayout } from "./layout";

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const WAITLIST_CONFIRMATION_SUBJECT =
  "You're in. — GraphMyAnything waitlist";

export type WaitlistEmailContent = {
  subject: string;
  text: string;
  html: string;
};

function featurePill(emoji: string, title: string, desc: string): string {
  return `
    <td width="33.33%" valign="top" style="padding:0 6px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${EMAIL_BRAND.surfaceElevated};border:1px solid ${EMAIL_BRAND.border};border-radius:12px;">
        <tr>
          <td style="padding:14px 10px;text-align:center;">
            <div style="font-size:18px;line-height:1;margin-bottom:8px;">${emoji}</div>
            <p style="margin:0 0 4px;font-family:${FONT_STACK};font-size:12px;font-weight:600;color:${EMAIL_BRAND.text};text-transform:uppercase;letter-spacing:0.06em;">${title}</p>
            <p style="margin:0;font-family:${FONT_STACK};font-size:11px;line-height:1.45;color:${EMAIL_BRAND.muted};">${desc}</p>
          </td>
        </tr>
      </table>
    </td>`;
}

export function buildWaitlistConfirmationEmail(options: {
  preorderUrl?: string;
}): WaitlistEmailContent {
  const preorderUrl = options.preorderUrl?.trim() ?? "";
  const chartUrl = waitlistChartImageUrl();

  const textPreorder = preorderUrl
    ? `\n\nClaim founding preorder (one-time $49, fully refundable until launch): ${preorderUrl}`
    : "";

  const text = `You're in.

Chart & metric memory for AI agents — track(), query(), and live chart URLs for the numbers your agents rely on.

What you'll get:
• track — Stream metrics from agents and cron
• query — Token-budgeted summaries & JSON
• chart — Permanent, updating chart URLs${textPreorder}

We'll email you at launch. Reply to this message to unsubscribe from waitlist updates.`;

  const cta = preorderUrl
    ? renderBulletproofButton(
        preorderUrl,
        "Claim founding preorder — $49",
      )
    : "";

  const preorderNote = preorderUrl
    ? `<p style="margin:12px 0 0;font-family:${FONT_STACK};font-size:13px;line-height:1.5;color:${EMAIL_BRAND.muted};text-align:center;">One-time $49, fully refundable until launch.</p>`
    : "";

  const bodyRows = `
    <tr>
      <td style="padding:8px 32px 0;">
        <h1 style="margin:0 0 12px;font-family:${FONT_STACK};font-size:28px;font-weight:700;letter-spacing:-0.03em;line-height:1.15;color:${EMAIL_BRAND.text};">You're in.</h1>
        <p style="margin:0;font-family:${FONT_STACK};font-size:16px;line-height:1.55;color:${EMAIL_BRAND.muted};">
          <strong style="color:${EMAIL_BRAND.text};font-weight:600;">Chart &amp; metric memory for AI agents</strong> — one call instead of throwaway plotting scripts.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:12px;overflow:hidden;border:1px solid ${EMAIL_BRAND.border};">
          <tr>
            <td style="padding:0;background:${EMAIL_BRAND.surfaceElevated};">
              <img src="${chartUrl}" width="536" height="168" alt="Rising MRR chart preview with $12.4k up 18 percent week over week" style="display:block;width:100%;max-width:536px;height:auto;border:0;" />
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 24px 0;">
        <p style="margin:0 0 12px;font-family:${FONT_STACK};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.14em;color:${EMAIL_BRAND.violet};text-align:center;">What you'll get</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            ${featurePill("◎", "track", "Metrics from agents &amp; cron")}
            ${featurePill("⌕", "query", "Budgeted insight")}
            ${featurePill("↗", "chart", "Live chart URLs")}
          </tr>
        </table>
      </td>
    </tr>
  <tr>
      <td style="padding:8px 32px 32px;">
        ${cta}
        ${preorderNote}
      </td>
    </tr>`;

  const html = renderEmailLayout({
    preheader: "You're on the waitlist — metric memory for AI agents.",
    bodyRows,
  });

  return { subject: WAITLIST_CONFIRMATION_SUBJECT, text, html };
}