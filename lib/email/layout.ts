import { EMAIL_BRAND, siteUrl } from "./constants";

export type EmailLayoutOptions = {
  /** Visible inbox snippet (hidden in body) */
  preheader?: string;
  /** Inner card table rows (HTML string) */
  bodyRows: string;
  siteLink?: string;
};

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function hiddenPreheader(text: string): string {
  const pad = "&#847; ".repeat(12);
  return `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;font-size:1px;line-height:1px;">${text}${pad}</div>`;
}

/**
 * Table-based, inline-styled shell for transactional email (~600px).
 */
export function renderEmailLayout(options: EmailLayoutOptions): string {
  const preheader = options.preheader ?? "";
  const home = options.siteLink ?? siteUrl();

  const footer = `
    <tr>
      <td style="padding:28px 32px 36px;border-top:1px solid ${EMAIL_BRAND.border};" align="center">
        <p style="margin:0 0 10px;font-family:${FONT_STACK};font-size:13px;line-height:1.5;">
          <a href="${home}" style="color:${EMAIL_BRAND.cyan};text-decoration:none;font-weight:500;">graphmyanything.com</a>
        </p>
        <p style="margin:0;font-family:${FONT_STACK};font-size:12px;line-height:1.5;color:${EMAIL_BRAND.muted};">
          Reply to this email to unsubscribe from waitlist updates.
        </p>
      </td>
    </tr>`;

  const header = `
    <tr>
      <td align="center" style="padding:36px 32px 12px;">
        <a href="${home}" style="text-decoration:none;">
          <span style="font-family:${FONT_STACK};font-size:22px;font-weight:700;letter-spacing:-0.03em;color:${EMAIL_BRAND.text};">Graph</span><!--[if mso]><span style="color:#8b5cf6;">MyAnything</span><![endif]-->
          <!--[if !mso]><!-->
          <span style="font-family:${FONT_STACK};font-size:22px;font-weight:700;letter-spacing:-0.03em;color:${EMAIL_BRAND.violet};">My</span><span style="font-family:${FONT_STACK};font-size:22px;font-weight:700;letter-spacing:-0.03em;color:${EMAIL_BRAND.emerald};">Anything</span>
          <!--<![endif]-->
        </a>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:0 32px 8px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="140" align="center">
          <tr>
            <td height="3" style="height:3px;background:${EMAIL_BRAND.violet};border-radius:2px;font-size:0;line-height:0;" width="47">&nbsp;</td>
            <td height="3" style="height:3px;background:${EMAIL_BRAND.cyan};font-size:0;line-height:0;" width="47">&nbsp;</td>
            <td height="3" style="height:3px;background:${EMAIL_BRAND.emerald};border-radius:2px;font-size:0;line-height:0;" width="46">&nbsp;</td>
          </tr>
        </table>
      </td>
    </tr>`;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>GraphMyAnything</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    body { margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%; }
    table { border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0; }
    img { border:0;line-height:100%;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic; }
    a { text-decoration:none; }
    @media (prefers-color-scheme: dark) {
      .email-bg { background-color:${EMAIL_BRAND.background} !important; }
      .email-card { background-color:${EMAIL_BRAND.surface} !important; }
    }
  </style>
</head>
<body class="email-bg" style="margin:0;padding:0;background-color:${EMAIL_BRAND.background};">
  ${preheader ? hiddenPreheader(preheader) : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-bg" style="background-color:${EMAIL_BRAND.background};">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="email-card" style="max-width:600px;width:100%;background-color:${EMAIL_BRAND.surface};border:1px solid ${EMAIL_BRAND.border};border-radius:16px;overflow:hidden;">
          ${header}
          ${options.bodyRows}
          ${footer}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** VML-friendly gradient CTA for Outlook + modern clients */
export function renderBulletproofButton(
  href: string,
  label: string,
): string {
  if (!href) return "";
  return `
    <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin:24px auto 0;">
      <tr>
        <td align="center" style="border-radius:12px;background:${EMAIL_BRAND.violet};" bgcolor="${EMAIL_BRAND.violet}">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${href}" style="height:48px;v-text-anchor:middle;width:320px;" arcsize="20%" strokecolor="${EMAIL_BRAND.violet}" fillcolor="${EMAIL_BRAND.violet}">
            <w:anchorlock/>
            <center style="color:${EMAIL_BRAND.ink};font-family:sans-serif;font-size:15px;font-weight:bold;">${label}</center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <a href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-family:${FONT_STACK};font-size:15px;font-weight:600;line-height:1.2;color:${EMAIL_BRAND.ink};background:linear-gradient(90deg, ${EMAIL_BRAND.violet} 0%, ${EMAIL_BRAND.cyan} 55%, ${EMAIL_BRAND.emerald} 100%);border-radius:12px;text-decoration:none;mso-padding-alt:0;">
            ${label}
          </a>
          <!--<![endif]-->
        </td>
      </tr>
    </table>`;
}