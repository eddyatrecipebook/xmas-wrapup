import { EVENT, SERVICE_AREA } from "./config";
import { isInServiceArea } from "./geo";

export type TreeInput = {
  address: string;
  unit?: string;
  note?: string;
  city?: string;
  postalCode?: string;
  lat?: number;
  lng?: number;
  placeId?: string;
};

export type CheckoutInput = {
  trees: TreeInput[];
  amountPerTree: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  smsOptIn: boolean;
  previousRegistrationId?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function finite(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}

export function phoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Checks everything the browser sent before any spot is reserved or any
 * payment is created. Returns the cleaned input, or a message for the donor.
 */
export function parseCheckout(
  body: unknown,
): { ok: true; input: CheckoutInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Something was missing from the form." };
  }
  const b = body as Record<string, unknown>;

  const rawTrees = Array.isArray(b.trees) ? b.trees : [];
  if (rawTrees.length < 1) {
    return { ok: false, error: "Please add a pickup address." };
  }
  if (rawTrees.length > EVENT.maxTreesPerOrder) {
    return {
      ok: false,
      error: `You can register up to ${EVENT.maxTreesPerOrder} trees at a time.`,
    };
  }

  const trees: TreeInput[] = [];
  for (const raw of rawTrees) {
    const t = (raw ?? {}) as Record<string, unknown>;
    const address = text(t.address, 240);
    if (address.length < 5) {
      return { ok: false, error: "Please enter a pickup address for each tree." };
    }
    const lat = finite(t.lat);
    const lng = finite(t.lng);
    const city = text(t.city, 80);
    if (lat !== undefined && lng !== undefined) {
      if (!isInServiceArea({ lat, lng })) {
        return {
          ok: false,
          error: `One of the addresses looks a little far outside London. Email ${EVENT.contactEmail} and we'll let you know if we can reach you.`,
        };
      }
    } else if (
      !SERVICE_AREA.communities.some(
        (c) => c.toLowerCase() === city.toLowerCase(),
      )
    ) {
      return {
        ok: false,
        error: `One of the addresses looks a little far outside London. Email ${EVENT.contactEmail} and we'll let you know if we can reach you.`,
      };
    }
    trees.push({
      address,
      unit: text(t.unit, 40),
      note: text(t.note, 300),
      city,
      postalCode: text(t.postalCode, 12),
      lat,
      lng,
      placeId: text(t.placeId, 200),
    });
  }

  const amountPerTree = finite(b.amountPerTree);
  if (
    amountPerTree === undefined ||
    !Number.isInteger(amountPerTree) ||
    amountPerTree < EVENT.minDonation
  ) {
    return {
      ok: false,
      error: `The minimum donation is $${EVENT.minDonation} per tree.`,
    };
  }
  if (amountPerTree > EVENT.maxDonation) {
    return {
      ok: false,
      error: `For a gift over $${EVENT.maxDonation}, please email ${EVENT.contactEmail}.`,
    };
  }

  const firstName = text(b.firstName, 80);
  const lastName = text(b.lastName, 80);
  const email = text(b.email, 200).toLowerCase();
  const phone = text(b.phone, 40);
  if (!firstName || !lastName) {
    return { ok: false, error: "Please enter your first and last name." };
  }
  if (!isValidEmail(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (phoneDigits(phone).length < 10) {
    return { ok: false, error: "Please enter a 10-digit mobile number." };
  }

  const previous = text(b.previousRegistrationId, 40);

  return {
    ok: true,
    input: {
      trees,
      amountPerTree,
      firstName,
      lastName,
      email,
      phone,
      smsOptIn: b.smsOptIn === true,
      previousRegistrationId: UUID_RE.test(previous) ? previous : undefined,
    },
  };
}
