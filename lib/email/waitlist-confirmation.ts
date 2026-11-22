import {
  EMAIL_BRAND,
  type EmailAssetUrls,
  productionEmailAssetUrls,
} from "./constants";
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

function featureTile(
  assets: EmailAssetUrls,
  accent: string,
  iconKey: "iconTrack" | "iconQuery" | "iconChart",
  title: string,
  desc: string,
): string {
  const iconSrc = assets[iconKey];
  return `
    <td width="33.33%" valign="top" style="padding:0 5px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${EMAIL_BRAND.surfaceElevated};border:1px solid ${EMAIL_BRAND.border};border-radius:12px;box-shadow:0 0 24px ${accent}22;">
        <tr>
          <td height="3" style="height:3px;line-height:3px;font-size:0;background:${accent};border-radius:12px 12px 0 0;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding:16px 10px 14px;text-align:center;">
            <img src="${iconSrc}" width="64" height="64" alt="${title} feature" style="display:block;width:64px;height:64px;margin:0 auto 10px;border:0;" />
            <p style="margin:0 0 4px;font-family:${FONT_STACK};font-size:11px;font-weight:600;color:${EMAIL_BRAND.text};text-transform:uppercase;letter-spacing:0.08em;">${title}</p>
            <p style="margin:0;font-family:${FONT_STACK};font-size:11px;line-height:1.45;color:${EMAIL_BRAND.muted};">${desc}</p>
          </td>
        </tr>
      </table>
    </td>`;
}

function codeSnippetStrip(home: string): string {
  return `
    <tr>
      <td style="padding:20px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#08080e;border:1px solid ${EMAIL_BRAND.border};border-radius:10px;">
          <tr>
            <td style="padding:14px 16px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;line-height:1.6;color:${EMAIL_BRAND.muted};">
              <span style="color:${EMAIL_BRAND.violet};">gma</span><span style="color:rgba(255,255,255,0.45);">.</span><span style="color:${EMAIL_BRAND.cyan};">track</span><span style="color:rgba(255,255,255,0.45);">(</span><span style="color:${EMAIL_BRAND.emerald};">"stripe.mrr"</span><span style="color:rgba(255,255,255,0.45);">, </span><span style="color:#fcd34d;">12400</span><span style="color:rgba(255,255,255,0.45);">)</span>
              <span style="color:${EMAIL_BRAND.muted};"> → </span>
              <span style="color:${EMAIL_BRAND.cyan};">${home.replace(/^https?:\/\//, "")}/c/stripe.mrr</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

export function buildWaitlistConfirmationEmail(options: {
  preorderUrl?: string;
  assetUrls?: EmailAssetUrls;
  siteLink?: string;
}): WaitlistEmailContent {
  const preorderUrl = options.preorderUrl?.trim() ?? "";
  const assets = options.assetUrls ?? productionEmailAssetUrls();
  const home = options.siteLink ?? "https://graphmyanything.com";

  const textPreorder = preorderUrl
    ? `\n\nClaim founding preorder (one-time $49, fully refundable until launch): ${preorderUrl}`
    : "";

  const text = `You're in.

Chart & metric memory for AI agents — track(), query(), and live chart URLs for the numbers your agents rely on.

What you'll get:
• track() — Stream metrics from agents and cron
• query() — Token-budgeted summaries & JSON
• chart — Permanent, updating chart URLs${textPreorder}

We'll email you at launch. Reply to this message to unsubscribe from waitlist updates.`;

  const cta = preorderUrl
    ? renderBulletproofButton(preorderUrl, "Claim founding preorder — $49")
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
    ${codeSnippetStrip(home)}
    <tr>
      <td style="padding:24px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:14px;overflow:hidden;border:1px solid ${EMAIL_BRAND.border};box-shadow:0 0 32px rgba(139,92,246,0.15);">
          <tr>
            <td style="padding:0;background:#08080e;">
              <img src="${assets.chart}" width="560" height="200" alt="Rising MRR area chart with $12.4k and up 18 percent week over week" style="display:block;width:100%;max-width:560px;height:auto;border:0;" />
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 22px 0;">
        <p style="margin:0 0 12px;font-family:${FONT_STACK};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.14em;color:${EMAIL_BRAND.violet};text-align:center;">What you'll get</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            ${featureTile(assets, EMAIL_BRAND.violet, "iconTrack", "track", "Agents &amp; cron streams")}
            ${featureTile(assets, EMAIL_BRAND.cyan, "iconQuery", "query", "Budgeted insight")}
            ${featureTile(assets, EMAIL_BRAND.emerald, "iconChart", "chart", "Live chart URLs")}
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
    siteLink: home,
  });

  return { subject: WAITLIST_CONFIRMATION_SUBJECT, text, html };
}