import { EVENT, formatDollars } from "@/lib/config";
import {
  COLOR,
  type BuiltEmail,
  type EmailOptions,
  type EmailTree,
  button,
  card,
  esc,
  formatMoney,
  heading,
  lede,
  link,
  mailto,
  paragraph,
  pickupDateStrip,
  renderEmail,
  steps,
  subheading,
  textFooter,
  treeCountLabel,
  treeList,
  treeListText,
} from "./layout";

export type ConfirmationEmailData = {
  firstName: string;
  trees: EmailTree[];
  /** Dollars. */
  amountPerTree: number;
  /** Dollars. */
  total: number;
  paidAt: Date;
  /** The registration id. A short form is shown as the confirmation number. */
  registrationId: string;
  /** Optional, e.g. "Visa ending in 4242". */
  paymentMethod?: string;
};

export function confirmationNumber(registrationId: string): string {
  return registrationId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function row(label: string, value: string, strong = false): string {
  const size = strong ? 18 : 16;
  const weight = strong ? 700 : 400;
  return `
  <tr>
    <td class="${strong ? "ink" : "soft"}" valign="top" style="padding:6px 12px 6px 0;font-size:${size}px;line-height:1.4;font-weight:${weight};color:${strong ? COLOR.ink : COLOR.soft};">${label}</td>
    <td class="ink" valign="top" align="right" style="padding:6px 0;font-size:${size}px;line-height:1.4;font-weight:${strong ? 700 : 500};color:${COLOR.ink};white-space:nowrap;">${value}</td>
  </tr>`;
}

/** Sent as soon as the payment clears: thank-you, pickup details and donation summary. */
export function confirmationEmail(
  data: ConfirmationEmailData,
  options: EmailOptions = {},
): BuiltEmail {
  const assetBase = (options.assetBase ?? EVENT.siteUrl).replace(/\/$/, "");
  const count = data.trees.length;
  const trees = treeCountLabel(count);
  const total = formatDollars(data.total);
  const number = confirmationNumber(data.registrationId);
  const receipted = data.total >= EVENT.receiptThreshold;
  const paidOn = data.paidAt.toLocaleDateString("en-CA", {
    timeZone: "America/Toronto",
    dateStyle: "long",
  });
  const name = data.firstName.trim();

  const subject = `You're booked: tree pickup on ${EVENT.pickupDateShort}`;
  const preheader = `Thank you! Your ${total} donation is in, and ${trees === "1 tree" ? "your tree is" : `your ${trees} are`} on our list.`;

  const receiptNote = receipted
    ? `Your gift qualifies for a tax receipt from the ${EVENT.charityName}, which is sent separately. This email isn't an official receipt.`
    : `Donations of $${EVENT.receiptThreshold} or more receive a tax receipt from the ${EVENT.charityName}. Smaller donations aren't receipted, because ${EVENT.name} is a third-party fundraiser.`;

  const cancelHref = mailto("Change or cancel my pickup", `Confirmation number: ${number}\n\n`);
  const shareHref = mailto(
    `Christmas tree pickup for the ${EVENT.charityName}`,
    `I just booked my tree pickup with ${EVENT.name}. Donate $${EVENT.minDonation} or more and volunteers collect your real tree from the curb on ${EVENT.pickupDateShort}. 100% of proceeds support the ${EVENT.charityName}, and there are only ${EVENT.capacity} spots.\n\n${EVENT.siteUrl}`,
    "",
  );

  const hero = card(`
    <img src="${assetBase}/email/check.png" width="56" height="56" alt="" style="display:block;width:56px;height:56px;margin:0 0 18px;">
    ${heading(["You're booked.", name ? `Thank you, ${name}!` : "Thank you!"])}
    ${lede(`Your ${esc(total)} donation is on its way to the ${esc(EVENT.charityName)}, and we have ${trees} on our list for ${esc(EVENT.pickupDateShort)}.`)}
    <div style="height:22px;line-height:22px;font-size:0;">&nbsp;</div>
    ${pickupDateStrip()}
  `);

  const where = card(`
    ${subheading("Where we're collecting")}
    ${treeList(data.trees)}
    <div style="height:16px;line-height:16px;font-size:0;">&nbsp;</div>
    ${paragraph(`Something not right, or need to cancel? ${link("Email us", cancelHref)} and we'll sort it out.`, 15)}
  `);

  const next = card(`
    ${subheading("What to do before pickup day")}
    ${steps([
      "Remove all decorations, lights and tinsel from your tree.",
      `Put it at the curb by 7 AM on ${esc(EVENT.pickupDateShort)}, or the night before.`,
      "We&rsquo;ll collect it between 7 AM and midnight.",
    ])}
    <div style="height:14px;line-height:14px;font-size:0;">&nbsp;</div>
    ${paragraph("We&rsquo;ll send a reminder the day before.", 15)}
  `);

  const donation = card(`
    ${subheading("Your donation")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${row(`${count === 1 ? "1 tree pickup" : `${count} tree pickups`} &times; ${esc(formatDollars(data.amountPerTree))}`, esc(formatMoney(data.total)))}
      <tr><td colspan="2" class="line" style="padding:6px 0 0;border-bottom:1px solid ${COLOR.line};font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td colspan="2" style="height:6px;font-size:0;line-height:0;">&nbsp;</td></tr>
      ${row("Total donated", `${esc(formatMoney(data.total))} <span class="soft" style="font-size:13px;font-weight:500;color:${COLOR.soft};">CAD</span>`, true)}
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;">
      <tr>
        <td class="soft" style="font-size:15px;line-height:1.6;color:${COLOR.soft};">
          Paid ${esc(paidOn)}${data.paymentMethod ? ` &middot; ${esc(data.paymentMethod)}` : ""}<br>
          Confirmation number <span class="ink" style="font-weight:700;color:${COLOR.ink};letter-spacing:0.04em;">${esc(number)}</span>
        </td>
      </tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="well" bgcolor="${COLOR.page}" style="background:${COLOR.page};border-radius:14px;margin-top:16px;">
      <tr>
        <td class="soft" style="padding:14px 16px;font-size:15px;line-height:1.5;color:${COLOR.soft};">
          <span class="ink" style="font-weight:700;color:${COLOR.ink};">${receipted ? "Tax receipt on the way." : "About tax receipts."}</span>
          ${esc(receiptNote)}
        </td>
      </tr>
    </table>
  `);

  const share = card(`
    <p class="ink" style="margin:0;font-size:18px;line-height:1.3;font-weight:700;color:${COLOR.ink};">Know a neighbour with a real tree?</p>
    <p class="soft" style="margin:6px 0 16px;font-size:16px;line-height:1.5;color:${COLOR.soft};">We&rsquo;re only collecting ${EVENT.capacity} trees this year. Pass it on before the spots are gone.</p>
    ${button("Tell a neighbour", shareHref, "outline")}
  `);

  const html = renderEmail({
    subject,
    preheader,
    assetBase,
    body: hero + where + next + donation + share,
  });

  const text = [
    name ? `You're booked. Thank you, ${name}!` : "You're booked. Thank you!",
    "",
    `Your ${total} donation is on its way to the ${EVENT.charityName}, and we have ${trees} on our list for ${EVENT.pickupDateShort}.`,
    "",
    "PICKUP",
    `${EVENT.pickupDateLong}, between 7 AM and midnight`,
    treeListText(data.trees),
    "",
    "WHAT TO DO BEFORE PICKUP DAY",
    "1. Remove all decorations, lights and tinsel from your tree.",
    `2. Put it at the curb by 7 AM on ${EVENT.pickupDateShort}, or the night before.`,
    "3. We'll collect it between 7 AM and midnight.",
    "We'll send a reminder the day before.",
    "",
    "YOUR DONATION",
    `${count === 1 ? "1 tree pickup" : `${count} tree pickups`} x ${formatDollars(data.amountPerTree)}: ${formatMoney(data.total)}`,
    `Total donated: ${formatMoney(data.total)} CAD`,
    `Paid ${paidOn}${data.paymentMethod ? ` · ${data.paymentMethod}` : ""}`,
    `Confirmation number ${number}`,
    receiptNote,
    "",
    `Need to change or cancel your pickup? Email ${EVENT.contactEmail} with your confirmation number.`,
    "",
    `Know a neighbour with a real tree? We're only collecting ${EVENT.capacity} trees this year: ${EVENT.siteUrl}`,
    "",
    textFooter(),
  ].join("\n");

  return { subject, preheader, html, text };
}
