// Everything that changes from year to year lives here.

export const EVENT = {
  name: "Xmas Tree Wrap-Up",
  pickupDateLong: "Saturday, January 9, 2027",
  pickupDateShort: "Saturday, January 9",
  pickupDateCompact: "Sat, Jan 9",
  capacity: 500,
  currency: "cad",
  /** Lowest donation accepted per tree, in dollars. */
  minDonation: 15,
  /** Highest donation accepted per tree, in dollars. */
  maxDonation: 5000,
  /** One-tap amounts shown on the donation tiles, in dollars. */
  presets: [20, 30, 50, 75, 100, 150],
  defaultPreset: 30,
  /** Total gifts at or above this amount (dollars) get a tax receipt. */
  receiptThreshold: 75,
  maxTreesPerOrder: 5,
  contactEmail: "info@xmaswrapup.ca",
  /** Where the site is published. Emails link here and load their images from here. */
  siteUrl: "https://xmaswrapup.ca",
  charityName: "London Food Bank",
} as const;

export const SERVICE_AREA = {
  /** Downtown London, Ontario. */
  center: { lat: 42.9849, lng: -81.2453 },
  /** Addresses farther than this from the centre get the "email us" message. */
  radiusKm: Number(process.env.SERVICE_RADIUS_KM ?? 21),
  /** Offered in the address form when address autocomplete is not set up. */
  communities: [
    "London",
    "Arva",
    "Delaware",
    "Dorchester",
    "Ilderton",
    "Kilworth",
    "Komoka",
  ],
} as const;

export function formatDollars(amount: number): string {
  return `$${amount.toLocaleString("en-CA")}`;
}
