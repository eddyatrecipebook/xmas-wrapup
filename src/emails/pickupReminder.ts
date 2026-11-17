import { EVENT } from "@/lib/config";
import {
  COLOR,
  type BuiltEmail,
  type EmailOptions,
  type EmailTree,
  addressLine,
  card,
  esc,
  eyebrow,
  heading,
  lede,
  link,
  mailto,
  renderEmail,
  steps,
  subheading,
  textFooter,
  treeList,
  treeListText,
} from "./layout";
import { confirmationNumber } from "./confirmation";

export type PickupReminderEmailData = {
  firstName: string;
  /** Only the trees still on the list (not cancelled ones). */
  trees: EmailTree[];
  registrationId: string;
};

function helpRow(title: string, body: string, action: string, last = false): string {
  return `
  <tr>
    <td class="line" style="padding:${last ? "14px 0 0" : "0 0 14px"};${last ? "" : `border-bottom:1px solid ${COLOR.line};`}">
      <p class="ink" style="margin:0;font-size:17px;line-height:1.4;font-weight:700;color:${COLOR.ink};">${title}</p>
      <p class="soft" style="margin:3px 0 0;font-size:16px;line-height:1.5;color:${COLOR.soft};">${body}</p>
      <p style="margin:6px 0 0;font-size:16px;line-height:1.5;">${action}</p>
    </td>
  </tr>`;
}

/** Sent the day before pickup day. The wording assumes it goes out that day. */
export function pickupReminderEmail(
  data: PickupReminderEmailData,
  options: EmailOptions = {},
): BuiltEmail {
  const assetBase = (options.assetBase ?? EVENT.siteUrl).replace(/\/$/, "");
  const count = data.trees.length;
  const one = count === 1;
  const name = data.firstName.trim();
  const number = confirmationNumber(data.registrationId);
  const reference = `Confirmation number: ${number}\n\n`;

  const subject = `Tomorrow: have your tree${one ? "" : "s"} at the curb by 7 AM`;
  const preheader = one
    ? `We're collecting from ${addressLine(data.trees[0])} between 7 AM and midnight.`
    : `We're collecting your ${count} trees between 7 AM and midnight.`;

  const hero = card(
    `
    <img src="${assetBase}/email/icon-curb.png" width="168" height="90" alt="A decorated tree, then a bare tree lying at the curb" style="display:block;width:168px;height:90px;border-radius:18px;margin:0 0 20px;">
    ${eyebrow(`Tomorrow · ${EVENT.pickupDateShort}`, true)}
    <div style="height:10px;line-height:10px;font-size:0;">&nbsp;</div>
    ${heading(one ? "Your tree pickup is tomorrow" : "Your tree pickups are tomorrow", true)}
    ${lede(`${name ? `Hi ${esc(name)}, our` : "Our"} volunteers are on the road from 7 AM. Tonight is a good time to get your tree${one ? "" : "s"} ready.`, true)}
  `,
    "deep",
  );

  const checklist = card(`
    ${subheading("Tonight's checklist")}
    ${steps([
      `<strong>Take everything off the tree.</strong> All decorations, lights and tinsel need to come off.`,
      `<strong>Put it at the curb</strong> tonight, or by 7 AM tomorrow at the latest.`,
      `<strong>Relax.</strong> We&rsquo;ll collect it between 7 AM and midnight.`,
    ])}
  `);

  const where = card(`
    ${subheading("Where we're collecting")}
    ${treeList(data.trees)}
  `);

  const help = card(`
    ${subheading("If plans change")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${helpRow(
        "Tree still at the curb after midnight?",
        "Let us know and we&rsquo;ll come back for it on Sunday.",
        link("Report a missed tree", mailto("Report a missed tree", reference)),
      )}
      ${helpRow(
        "Don't need the pickup any more?",
        "Tell us and we&rsquo;ll save our volunteers a trip.",
        link("Cancel my pickup", mailto("Cancel my pickup", reference)),
        true,
      )}
    </table>
  `);

  const thanks = `
<tr>
  <td style="padding:6px 6px 14px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td valign="middle" width="44" style="width:44px;"><img src="${assetBase}/email/icon-heart.png" width="44" height="44" alt="" style="display:block;width:44px;height:44px;border-radius:12px;"></td>
        <td class="ink" valign="middle" style="padding-left:12px;font-size:16px;line-height:1.4;font-weight:700;color:${COLOR.ink};">Thank you for supporting the ${esc(EVENT.charityName)}.</td>
      </tr>
    </table>
  </td>
</tr>`;

  const html = renderEmail({
    subject,
    preheader,
    assetBase,
    body: hero + checklist + where + help + thanks,
  });

  const text = [
    `${name ? `Hi ${name}, your` : "Your"} tree pickup${one ? " is" : "s are"} tomorrow, ${EVENT.pickupDateLong}.`,
    "",
    "TONIGHT'S CHECKLIST",
    "1. Take everything off the tree. All decorations, lights and tinsel need to come off.",
    "2. Put it at the curb tonight, or by 7 AM tomorrow at the latest.",
    "3. Relax. We'll collect it between 7 AM and midnight.",
    "",
    "WHERE WE'RE COLLECTING",
    treeListText(data.trees),
    "",
    "IF PLANS CHANGE",
    `Tree still at the curb after midnight? Email ${EVENT.contactEmail} and we'll come back for it on Sunday.`,
    `Don't need the pickup any more? Email ${EVENT.contactEmail} and we'll save our volunteers a trip.`,
    `Your confirmation number is ${number}.`,
    "",
    `Thank you for supporting the ${EVENT.charityName}.`,
    "",
    textFooter(),
  ].join("\n");

  return { subject, preheader, html, text };
}
