/**
 * Branded email templates for TeachBraille.org
 * Matches the site's cream / gold / navy palette.
 *
 * NOTE: Email clients strip <style> blocks, so everything is inline.
 * Web fonts (Outfit, DM Serif Display) are loaded via a <link> tag
 * that works in Apple Mail, iOS Mail, and some Gmail — others
 * gracefully degrade to Georgia / sans-serif.
 */

/* ── helpers ── */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ── colour tokens (mirrored from globals.css) ── */
const C = {
  cream: '#FDF8F0',
  gold: '#D4A853',
  goldLight: '#F0DEB4',
  goldSoft: '#F7EDD5',
  navy: '#1B2A4A',
  navyDeep: '#141F35',
  slate: '#4A5568',
  sageDark: '#7A9B6D',
  white: '#FFFFFF',
} as const;

const FONT_HEADING = "'DM Serif Display', Georgia, 'Times New Roman', serif";
const FONT_BODY = "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

/* ── reusable fragments ── */

function shell(content: string) {
  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
  <title>TeachBraille.org</title>
</head>
<body style="margin:0;padding:0;background:${C.cream};-webkit-font-smoothing:antialiased;">
  <!-- outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};">
    <tr>
      <td align="center" style="padding:40px 16px 48px;">
        <!-- card -->
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:${C.white};border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(27,42,74,0.06);">
          ${content}
        </table>

        <!-- footer -->
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;margin-top:28px;">
          <tr>
            <td align="center" style="font-family:${FONT_BODY};font-size:13px;color:#999;line-height:1.6;">
              &copy; 2026 Delaney Costello, Teacher of the Visually Impaired<br />
              <a href="https://teachbraille.org" style="color:${C.gold};text-decoration:none;">teachbraille.org</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function header(headline: string, subtitle: string) {
  return `
  <!-- gold header bar -->
  <tr>
    <td style="background:${C.navy};padding:36px 40px 32px;text-align:center;">
      <p style="margin:0 0 16px;font-family:${FONT_BODY};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${C.goldLight};">TeachBraille.org</p>
      <h1 style="margin:0 0 8px;font-family:${FONT_HEADING};font-size:26px;font-weight:400;color:${C.white};line-height:1.3;">${headline}</h1>
      <p style="margin:0;font-family:${FONT_BODY};font-size:15px;color:${C.goldLight};font-weight:300;">${subtitle}</p>
    </td>
  </tr>`;
}

function detailRow(label: string, value: string) {
  return `
  <tr>
    <td style="padding:10px 0;font-family:${FONT_BODY};font-size:14px;color:${C.slate};border-bottom:1px solid ${C.goldSoft};white-space:nowrap;vertical-align:top;" width="110">
      <strong style="color:${C.navy};font-weight:600;">${label}</strong>
    </td>
    <td style="padding:10px 0 10px 12px;font-family:${FONT_BODY};font-size:14px;color:${C.slate};border-bottom:1px solid ${C.goldSoft};vertical-align:top;">
      ${value}
    </td>
  </tr>`;
}

function goldBanner(html: string) {
  return `
  <tr>
    <td style="padding:0 40px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.goldSoft};border:1px solid ${C.goldLight};border-radius:10px;">
        <tr>
          <td style="padding:16px 20px;font-family:${FONT_BODY};font-size:14px;color:${C.navy};line-height:1.6;">
            ${html}
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function ctaButton(label: string, url: string) {
  return `
  <tr>
    <td align="center" style="padding:28px 40px 0;">
      <a href="${url}" style="display:inline-block;background:${C.gold};color:${C.white};font-family:${FONT_BODY};font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:100px;letter-spacing:0.3px;">
        ${label}
      </a>
    </td>
  </tr>`;
}

function footer(extraNote?: string) {
  return `
  <!-- sign-off -->
  <tr>
    <td style="padding:28px 40px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="border-top:1px solid ${C.goldSoft};padding-top:24px;">
          ${extraNote ? `<p style="margin:0 0 16px;font-family:${FONT_BODY};font-size:13px;color:${C.slate};line-height:1.6;">${extraNote}</p>` : ''}
          <p style="margin:0;font-family:${FONT_BODY};font-size:14px;color:${C.navy};line-height:1.6;">
            Looking forward to learning together!
          </p>
          <p style="margin:8px 0 0;font-family:${FONT_BODY};font-size:14px;color:${C.navy};font-weight:500;">
            — Delaney Costello
          </p>
        </td></tr>
      </table>
    </td>
  </tr>
  <!-- contact -->
  <tr>
    <td align="center" style="padding:24px 40px 36px;">
      <p style="margin:0;font-family:${FONT_BODY};font-size:13px;color:${C.slate};line-height:1.6;">
        Questions? Reach out anytime at
        <a href="mailto:delaney@teachbraille.org" style="color:${C.gold};text-decoration:none;border-bottom:1px solid ${C.goldLight};">Delaney@TeachBraille.org</a>
      </p>
    </td>
  </tr>`;
}

/* ── public API ── */

export function customEmail(opts: { subject: string; body: string }) {
  const { subject, body } = opts;

  // Escape HTML entities then convert plain-text line breaks to HTML paragraphs
  const safe = escapeHtml(body);
  const htmlBody = safe
    .split(/\n{2,}/)
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-family:${FONT_BODY};font-size:15px;color:${C.slate};line-height:1.7;">${p.replace(/\n/g, '<br />')}</p>`
    )
    .join('');

  const content = `
  ${header(subject, 'TeachBraille.org')}
  <tr>
    <td style="padding:32px 40px 0;">
      ${htmlBody}
    </td>
  </tr>
  ${footer()}`;

  return shell(content);
}

export function enrollmentConfirmation(opts: {
  isDeposit: boolean;
  schedule: string;
}) {
  const { isDeposit, schedule } = opts;

  const headline = isDeposit
    ? 'Your $150 Deposit Is&nbsp;Confirmed!'
    : "You&rsquo;re All Set!";

  const subtitle = isDeposit
    ? 'Your spot in the Summer Braille Course is reserved.'
    : "You&rsquo;re fully enrolled in the Summer Braille Course.";

  const body = `
  ${header(headline, subtitle)}

  <!-- checkmark -->
  <tr>
    <td align="center" style="padding:32px 40px 0;">
      <div style="width:64px;height:64px;border-radius:50%;background:${C.sageDark};display:inline-block;line-height:64px;text-align:center;">
        <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" style="width:64px;height:64px;" arcsize="50%" fillcolor="${C.sageDark}" stroke="f"><v:textbox><![endif]-->
        <span style="font-size:28px;color:${C.white};">&#10003;</span>
        <!--[if mso]></v:textbox></v:roundrect><![endif]-->
      </div>
    </td>
  </tr>

  <!-- main copy -->
  <tr>
    <td style="padding:24px 40px 0;font-family:${FONT_BODY};font-size:15px;color:${C.slate};line-height:1.7;">
      ${isDeposit
        ? 'Thank you for reserving your spot! Your <strong style="color:' + C.navy + ';">$150 deposit</strong> has been received and your enrollment is&nbsp;confirmed.'
        : 'Your <strong style="color:' + C.navy + ';">$500 payment</strong> is confirmed &mdash; you&rsquo;re fully enrolled and ready to&nbsp;go!'}
    </td>
  </tr>

  ${isDeposit
    ? goldBanner(`<strong>Remaining balance of $350</strong> will be charged automatically on <strong>May&nbsp;1st</strong> to the card you&nbsp;used.`)
    : ''}

  <!-- course details table -->
  <tr>
    <td style="padding:${isDeposit ? '24px' : '28px'} 40px 0;">
      <h2 style="margin:0 0 16px;font-family:${FONT_HEADING};font-size:18px;font-weight:400;color:${C.navy};">Course Details</h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${detailRow('Schedule', schedule)}
        ${detailRow('Dates', 'June 8 &ndash; July 27, 2026')}
        ${detailRow('Sessions', '16 total &mdash; twice per week, 1&nbsp;hr&nbsp;each')}
        ${detailRow('Format', 'Fully remote via video call')}
      </table>
    </td>
  </tr>

  ${ctaButton('View Course Page', 'https://teachbraille.org/summer')}

  ${footer(isDeposit ? 'You&rsquo;ll receive a receipt from Stripe separately. No action is needed before June&nbsp;8 &mdash; we&rsquo;ll send a reminder with video call details closer to the start date.' : 'You&rsquo;ll receive a receipt from Stripe separately. We&rsquo;ll send a reminder with video call details closer to the start&nbsp;date.')}`;

  return shell(body);
}
