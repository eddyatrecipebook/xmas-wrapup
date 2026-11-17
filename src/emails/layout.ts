import { EVENT } from "@/lib/config";

/**
 * Shared frame and building blocks for the emails we send donors.
 *
 * Email apps ignore most modern CSS, so everything here is tables with the
 * styles written on each element. The class names only exist so the dark
 * colours in the <style> block can take over in apps that support them.
 */

export type EmailTree = {
  address: string;
  unit?: string | null;
  city?: string | null;
  note?: string | null;
};

export type BuiltEmail = {
  subject: string;
  /** The grey preview line shown next to the subject in the inbox. */
  preheader: string;
  html: string;
  text: string;
};

export type EmailOptions = {
  /** Where the images are loaded from. Defaults to the live site. */
  assetBase?: string;
};

export const COLOR = {
  page: "#f2f7f4",
  card: "#ffffff",
  ink: "#231f20",
  soft: "#3a4541",
  muted: "#4a5651",
  line: "#c9d9d2",
  green: "#007951",
  greenDeep: "#0a4d36",
  greenMid: "#3f7e60",
  mint: "#dde8e4",
  yellow: "#feda46",
} as const;

export const FONT =
  "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatMoney(dollars: number): string {
  return dollars.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

export function treeCountLabel(count: number): string {
  return count === 1 ? "1 tree" : `${count} trees`;
}

/** "Jan" and "9", for the little calendar tile. */
export function pickupMonthAndDay(): { month: string; day: string } {
  const [month = "", day = ""] = (EVENT.pickupDateCompact.split(", ")[1] ?? "").split(" ");
  return { month, day };
}

/** One line for an address, adding the community when it isn't already there. */
export function addressLine(tree: EmailTree): string {
  const address = tree.address.trim();
  const city = tree.city?.trim();
  if (city && !address.toLowerCase().includes(city.toLowerCase())) {
    return `${address}, ${city}`;
  }
  return address;
}

export function mailto(subject?: string, body?: string, to: string = EVENT.contactEmail): string {
  const query = [
    subject ? `subject=${encodeURIComponent(subject)}` : "",
    body ? `body=${encodeURIComponent(body)}` : "",
  ]
    .filter(Boolean)
    .join("&");
  return `mailto:${to}${query ? `?${query}` : ""}`;
}

/* ---------- Building blocks ---------- */

/** A rounded panel. `deep` is the dark green one used for the reminder. */
export function card(inner: string, tone: "white" | "deep" = "white"): string {
  const background = tone === "deep" ? COLOR.greenDeep : COLOR.card;
  const className = tone === "deep" ? "pad" : "card pad";
  return `
<tr>
  <td class="${className}" bgcolor="${background}" style="background:${background};border-radius:20px;padding:28px;">
    ${inner}
  </td>
</tr>
<tr><td height="14" style="height:14px;font-size:0;line-height:0;">&nbsp;</td></tr>`;
}

export function eyebrow(text: string, onDark = false): string {
  const color = onDark ? COLOR.yellow : COLOR.green;
  return `<p class="${onDark ? "" : "accent"}" style="margin:0;font-size:13px;line-height:1.4;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${color};">${esc(text)}</p>`;
}

/** Pass an array to put each part on its own line. */
export function heading(text: string | string[], onDark = false): string {
  const color = onDark ? "#ffffff" : COLOR.ink;
  const lines = (Array.isArray(text) ? text : [text]).map(esc).join("<br>");
  return `<h1 class="${onDark ? "" : "ink "}h1" style="margin:0;font-size:32px;line-height:1.1;letter-spacing:-0.02em;font-weight:700;color:${color};">${lines}</h1>`;
}

export function subheading(text: string): string {
  return `<h2 class="ink" style="margin:0 0 14px;font-size:21px;line-height:1.2;font-weight:700;color:${COLOR.ink};">${esc(text)}</h2>`;
}

/** `html` is trusted markup; escape any donor-typed text before passing it in. */
export function lede(html: string, onDark = false): string {
  const color = onDark ? "#e3efe9" : COLOR.soft;
  return `<p class="${onDark ? "" : "soft"}" style="margin:10px 0 0;font-size:18px;line-height:1.5;color:${color};">${html}</p>`;
}

export function paragraph(html: string, size = 16): string {
  return `<p class="soft" style="margin:0;font-size:${size}px;line-height:1.5;color:${COLOR.soft};">${html}</p>`;
}

export function link(label: string, href: string): string {
  return `<a class="accent" href="${esc(href)}" style="color:${COLOR.green};font-weight:700;text-decoration:underline;">${esc(label)}</a>`;
}

export function button(label: string, href: string, variant: "solid" | "outline" = "solid"): string {
  const solid = variant === "solid";
  const cell = solid
    ? `bgcolor="${COLOR.green}" style="background:${COLOR.green};border-radius:999px;"`
    : `class="outline" style="border:2px solid ${COLOR.green};border-radius:999px;"`;
  const text = solid ? "#ffffff" : COLOR.greenDeep;
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td ${cell}>
      <a class="${solid ? "" : "outline-text"}" href="${esc(href)}" style="display:inline-block;padding:${solid ? 15 : 13}px 28px;font-family:${FONT};font-size:17px;line-height:1.2;font-weight:700;color:${text};text-decoration:none;border-radius:999px;">${esc(label)}</a>
    </td>
  </tr>
</table>`;
}

/** The numbered list from the site's confirmation page. Items are trusted markup. */
export function steps(items: string[]): string {
  const rows = items
    .map((item, i) => {
      const border = i === items.length - 1 ? "" : `border-bottom:1px solid ${COLOR.line};`;
      return `
  <tr>
    <td class="accent line" width="30" valign="top" style="width:30px;padding:14px 0;${border}font-size:17px;line-height:1.45;font-weight:700;color:${COLOR.green};">${i + 1}</td>
    <td class="ink line" valign="top" style="padding:14px 0;${border}font-size:17px;line-height:1.45;color:${COLOR.ink};">${item}</td>
  </tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="rule" style="border-top:2px solid ${COLOR.ink};">${rows}
</table>`;
}

/** Pickup date and window, with a calendar tile built from the event settings. */
export function pickupDateStrip(): string {
  const { month, day } = pickupMonthAndDay();
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="well" bgcolor="${COLOR.page}" style="background:${COLOR.page};border-radius:14px;">
  <tr>
    <td width="62" valign="middle" style="width:62px;padding:14px 0 14px 14px;">
      <table role="presentation" width="62" cellpadding="0" cellspacing="0" border="0" style="width:62px;">
        <tr>
          <td align="center" bgcolor="${COLOR.greenMid}" style="background:${COLOR.greenMid};border-radius:12px 12px 0 0;padding:5px 0 4px;font-size:12px;line-height:1.2;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#ffffff;">${esc(month)}</td>
        </tr>
        <tr>
          <td class="tile tile-text" align="center" bgcolor="#ffffff" style="background:#ffffff;border-radius:0 0 12px 12px;padding:5px 0 7px;font-size:28px;line-height:1;font-weight:700;color:${COLOR.greenDeep};">${esc(day)}</td>
        </tr>
      </table>
    </td>
    <td valign="middle" style="padding:14px 16px;">
      <p class="ink" style="margin:0;font-size:18px;line-height:1.3;font-weight:700;color:${COLOR.ink};">${esc(EVENT.pickupDateLong)}</p>
      <p class="soft" style="margin:3px 0 0;font-size:15px;line-height:1.4;color:${COLOR.soft};">Curbside pickup between 7 AM and midnight</p>
    </td>
  </tr>
</table>`;
}

/** Pickup addresses, each with its unit and the note the donor left for drivers. */
export function treeList(trees: EmailTree[]): string {
  const rows = trees
    .map((tree, i) => {
      const last = i === trees.length - 1;
      const label =
        trees.length > 1
          ? `<p class="accent" style="margin:0 0 4px;font-size:12px;line-height:1.4;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${COLOR.green};">Tree ${i + 1}</p>`
          : "";
      const unit = tree.unit?.trim()
        ? `<p class="soft" style="margin:2px 0 0;font-size:16px;line-height:1.45;color:${COLOR.soft};">Unit ${esc(tree.unit.trim())}</p>`
        : "";
      const note = tree.note?.trim()
        ? `<p class="soft" style="margin:6px 0 0;font-size:15px;line-height:1.45;color:${COLOR.soft};"><span class="ink" style="font-weight:700;color:${COLOR.ink};">Note for our drivers:</span> ${esc(tree.note.trim())}</p>`
        : "";
      return `
  <tr>
    <td class="line" style="padding:${i === 0 ? 0 : 14}px 0 ${last ? 0 : 14}px;${last ? "" : `border-bottom:1px solid ${COLOR.line};`}">
      ${label}
      <p class="ink" style="margin:0;font-size:17px;line-height:1.4;font-weight:700;color:${COLOR.ink};">${esc(addressLine(tree))}</p>
      ${unit}
      ${note}
    </td>
  </tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}
</table>`;
}

/** Plain-text version of the address list. */
export function treeListText(trees: EmailTree[]): string {
  return trees
    .map((tree, i) => {
      const lines = [`${trees.length > 1 ? `Tree ${i + 1}: ` : ""}${addressLine(tree)}`];
      if (tree.unit?.trim()) lines.push(`  Unit ${tree.unit.trim()}`);
      if (tree.note?.trim()) lines.push(`  Note for our drivers: ${tree.note.trim()}`);
      return lines.join("\n");
    })
    .join("\n");
}

export function textFooter(): string {
  return [
    "--",
    `${EVENT.name} · London, Ontario`,
    `100% of proceeds support the ${EVENT.charityName}.`,
    `Questions? ${EVENT.contactEmail}`,
    EVENT.siteUrl,
  ].join("\n");
}

/* ---------- The frame ---------- */

export function renderEmail({
  subject,
  preheader,
  body,
  assetBase = EVENT.siteUrl,
}: {
  subject: string;
  preheader: string;
  /** Table rows, usually a few card() calls. */
  body: string;
  assetBase?: string;
}): string {
  const assets = `${assetBase.replace(/\/$/, "")}/email`;
  const siteLabel = EVENT.siteUrl.replace(/^https?:\/\//, "");
  // Padding after the preview line keeps the email's first words out of it.
  const filler = "&#847;&zwnj;&nbsp;".repeat(60);

  return `<!doctype html>
<html lang="en-CA" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(subject)}</title>
<!--[if mso]>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
<style>table, td, h1, h2, p, a { font-family: 'Segoe UI', Arial, sans-serif !important; }</style>
<![endif]-->
<!--[if !mso]><!-->
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&amp;display=swap" rel="stylesheet">
<!--<![endif]-->
<style>
  :root { color-scheme: light dark; supported-color-schemes: light dark; }
  body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table { border-collapse: separate; mso-table-lspace: 0; mso-table-rspace: 0; }
  img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
  @media (max-width: 480px) {
    .outer { padding: 16px 10px 32px !important; }
    .pad { padding: 24px 20px !important; }
    .h1 { font-size: 29px !important; }
  }
  @media (prefers-color-scheme: dark) {
    .page { background: #0e1a16 !important; }
    .card { background: #17271f !important; }
    .well { background: #203329 !important; }
    .tile { background: #f2f7f4 !important; }
    .tile-text { color: #0a4d36 !important; }
    .ink { color: #f2f7f4 !important; }
    .soft { color: #c9d9d2 !important; }
    .muted { color: #a9bbb3 !important; }
    .accent { color: #5fd0a2 !important; }
    .line { border-color: #2e4339 !important; }
    .rule { border-color: #f2f7f4 !important; }
    .outline { border-color: #5fd0a2 !important; }
    .outline-text { color: #f2f7f4 !important; }
  }
</style>
</head>
<body class="page" style="margin:0;padding:0;background:${COLOR.page};">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${COLOR.page};mso-hide:all;">${esc(preheader)}${filler}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="page" bgcolor="${COLOR.page}" style="background:${COLOR.page};">
  <tr>
    <td class="outer" align="center" style="padding:24px 16px 40px;font-family:${FONT};">
      <!--[if mso]><table role="presentation" width="560" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;font-family:${FONT};">
        <tr>
          <td style="padding:0 4px 16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="middle" width="133" style="width:133px;">
                  <a href="${esc(EVENT.siteUrl)}" style="text-decoration:none;"><img src="${assets}/logo.png" width="133" height="48" alt="${esc(EVENT.name)}" style="display:block;width:133px;height:48px;font-family:${FONT};font-size:16px;font-weight:700;color:${COLOR.green};"></a>
                </td>
                <td class="muted" valign="middle" align="right" style="padding-left:12px;font-size:13px;line-height:1.35;color:${COLOR.muted};">In support of the<br><span class="ink" style="font-weight:700;color:${COLOR.ink};">${esc(EVENT.charityName)}</span></td>
              </tr>
            </table>
          </td>
        </tr>
${body}
        <tr>
          <td style="padding:10px 6px 0;">
            <p class="muted" style="margin:0;font-size:14px;line-height:1.55;color:${COLOR.muted};">
              <span class="ink" style="font-weight:700;color:${COLOR.ink};">${esc(EVENT.name)}</span> · London, Ontario<br>
              100% of proceeds support the ${esc(EVENT.charityName)}.
            </p>
            <p class="muted" style="margin:10px 0 0;font-size:14px;line-height:1.55;color:${COLOR.muted};">
              You&rsquo;re getting this email because you booked a tree pickup at
              <a class="muted" href="${esc(EVENT.siteUrl)}" style="color:${COLOR.muted};text-decoration:underline;">${esc(siteLabel)}</a>.
              Questions? Write to
              <a class="muted" href="${mailto()}" style="color:${COLOR.muted};text-decoration:underline;">${esc(EVENT.contactEmail)}</a>.
            </p>
          </td>
        </tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td>
  </tr>
</table>
</body>
</html>`;
}
