import { connection } from "next/server";
import { getPaidPickups } from "@/lib/admin";
import { EVENT } from "@/lib/config";

function cell(value: string | number | boolean | null): string {
  let text = value === null ? "" : String(value);
  // Stop spreadsheet apps from treating donor-typed text as a formula.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/** CSV of every paid, non-cancelled pickup, ready to import into Dispatch. */
export async function GET() {
  await connection();
  const rows = await getPaidPickups();
  if (!rows) {
    return new Response("The database isn't connected yet.", { status: 503 });
  }

  const header = [
    "Address",
    "Unit",
    "City",
    "Postal Code",
    "Name",
    "Phone",
    "Email",
    "Notes",
    "Latitude",
    "Longitude",
    "Text Reminder",
    "Donation Per Tree",
    "Tax Receipt",
    "Registered At",
    "Registration ID",
  ];

  const lines = rows
    .filter((r) => r.treeStatus !== "cancelled")
    .map((r) =>
      [
        r.address,
        r.unit,
        r.city,
        r.postalCode,
        `${r.firstName} ${r.lastName}`,
        r.phone,
        r.email,
        r.note,
        r.lat,
        r.lng,
        r.smsOptIn ? "Yes" : "No",
        r.donationPerTree,
        r.registrationTotal >= EVENT.receiptThreshold ? "Yes" : "No",
        r.registeredAt,
        r.registrationId,
      ]
        .map(cell)
        .join(","),
    );

  const csv = [header.map(cell).join(","), ...lines].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="xmas-wrapup-pickups.csv"',
      "Cache-Control": "no-store",
    },
  });
}
