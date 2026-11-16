import { getAdminClient } from "./supabase";

export type PickupRow = {
  treeId: string;
  registrationId: string;
  registeredAt: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  smsOptIn: boolean;
  address: string;
  unit: string;
  city: string;
  postalCode: string;
  note: string;
  lat: number | null;
  lng: number | null;
  treeStatus: string;
  donationPerTree: number;
  registrationTotal: number;
};

type TreeRecord = {
  id: string;
  position: number;
  status: string;
  address: string;
  unit: string | null;
  city: string | null;
  postal_code: string | null;
  note: string | null;
  lat: number | null;
  lng: number | null;
  registrations: {
    id: string;
    created_at: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    sms_opt_in: boolean;
    amount_per_tree_cents: number;
    total_cents: number;
    status: string;
  } | null;
};

/** One row per tree for every paid registration, oldest first. */
export async function getPaidPickups(): Promise<PickupRow[] | null> {
  const supabase = getAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("trees")
    .select(
      "id, position, status, address, unit, city, postal_code, note, lat, lng, registrations!inner(id, created_at, first_name, last_name, email, phone, sms_opt_in, amount_per_tree_cents, total_cents, status)",
    )
    .eq("registrations.status", "paid")
    .limit(5000);

  if (error) {
    console.error("getPaidPickups failed", error.message);
    return null;
  }

  const rows = (data as unknown as TreeRecord[])
    .filter((t) => t.registrations)
    .map((t) => {
      const r = t.registrations!;
      return {
        treeId: t.id,
        registrationId: r.id,
        registeredAt: r.created_at,
        firstName: r.first_name,
        lastName: r.last_name,
        email: r.email,
        phone: r.phone,
        smsOptIn: r.sms_opt_in,
        address: t.address,
        unit: t.unit ?? "",
        city: t.city ?? "",
        postalCode: t.postal_code ?? "",
        note: t.note ?? "",
        lat: t.lat,
        lng: t.lng,
        treeStatus: t.status,
        donationPerTree: r.amount_per_tree_cents / 100,
        registrationTotal: r.total_cents / 100,
      };
    });

  rows.sort((a, b) => a.registeredAt.localeCompare(b.registeredAt));
  return rows;
}
