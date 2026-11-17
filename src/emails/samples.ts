import type { BuiltEmail, EmailOptions } from "./layout";
import { confirmationEmail } from "./confirmation";
import { pickupReminderEmail } from "./pickupReminder";

/**
 * Made-up donors for looking at the emails in /admin/emails. Each email has a
 * simple case (one tree) and a busy one (two trees, a unit, a driver note).
 */

const ONE_TREE = [{ address: "184 Wortley Rd, London, ON N6C 3P7", city: "London" }];

const TWO_TREES = [
  {
    address: "184 Wortley Rd, London, ON N6C 3P7",
    city: "London",
    note: "Corner lot. The tree will be on the Elmwood Ave side.",
  },
  { address: "52 Askin St", unit: "3", city: "London" },
];

export const EMAIL_PREVIEWS = {
  confirmation: {
    title: "Donation confirmation",
    when: "Sent as soon as the payment clears.",
    samples: {
      "one-tree": (options: EmailOptions) =>
        confirmationEmail(
          {
            firstName: "Maya",
            trees: ONE_TREE,
            amountPerTree: 30,
            total: 30,
            paidAt: new Date("2026-12-28T15:20:00Z"),
            registrationId: "3f9a2c1b-7d44-4e0a-9b1f-5c2e8a6d0f13",
            paymentMethod: "Visa ending in 4242",
          },
          options,
        ),
      "two-trees": (options: EmailOptions) =>
        confirmationEmail(
          {
            firstName: "Maya",
            trees: TWO_TREES,
            amountPerTree: 50,
            total: 100,
            paidAt: new Date("2026-12-28T15:20:00Z"),
            registrationId: "3f9a2c1b-7d44-4e0a-9b1f-5c2e8a6d0f13",
            paymentMethod: "Apple Pay",
          },
          options,
        ),
    },
  },
  reminder: {
    title: "Pickup reminder",
    when: "Sent the day before pickup day.",
    samples: {
      "one-tree": (options: EmailOptions) =>
        pickupReminderEmail(
          {
            firstName: "Maya",
            trees: ONE_TREE,
            registrationId: "3f9a2c1b-7d44-4e0a-9b1f-5c2e8a6d0f13",
          },
          options,
        ),
      "two-trees": (options: EmailOptions) =>
        pickupReminderEmail(
          {
            firstName: "Maya",
            trees: TWO_TREES,
            registrationId: "3f9a2c1b-7d44-4e0a-9b1f-5c2e8a6d0f13",
          },
          options,
        ),
    },
  },
} satisfies Record<
  string,
  {
    title: string;
    when: string;
    samples: Record<string, (options: EmailOptions) => BuiltEmail>;
  }
>;

export type EmailPreviewName = keyof typeof EMAIL_PREVIEWS;

export function buildPreview(
  template: string,
  sample: string,
  options: EmailOptions = {},
): BuiltEmail | null {
  if (!Object.hasOwn(EMAIL_PREVIEWS, template)) return null;
  const samples: Record<string, (options: EmailOptions) => BuiltEmail> =
    EMAIL_PREVIEWS[template as EmailPreviewName].samples;
  const build = Object.hasOwn(samples, sample) ? samples[sample] : samples["one-tree"];
  return build(options);
}
