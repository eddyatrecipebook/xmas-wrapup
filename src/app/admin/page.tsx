import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { getPaidPickups } from "@/lib/admin";
import { EVENT, formatDollars } from "@/lib/config";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false },
};

async function Pickups() {
  await connection();
  const rows = await getPaidPickups();

  if (!rows) {
    return <p>The database isn&apos;t connected yet.</p>;
  }

  const active = rows.filter((r) => r.treeStatus !== "cancelled");
  const registrations = new Map(rows.map((r) => [r.registrationId, r.registrationTotal]));
  const raised = [...registrations.values()].reduce((sum, v) => sum + v, 0);
  const average = active.length ? raised / active.length : 0;

  return (
    <>
      <div className="admin__stats">
        <span>
          {active.length} of {EVENT.capacity} trees booked
        </span>
        <span>{formatDollars(Math.round(raised))} raised</span>
        <span>{formatDollars(Math.round(average * 100) / 100)} average per tree</span>
        <a href="/admin/export">Download CSV for Dispatch</a>
      </div>
      <div className="admin__table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Unit</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Note</th>
              <th>Donation</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.treeId}>
                <td>
                  {r.firstName} {r.lastName}
                </td>
                <td>{r.address}</td>
                <td>{r.unit}</td>
                <td>{r.phone}</td>
                <td>{r.email}</td>
                <td>{r.note}</td>
                <td>{formatDollars(r.donationPerTree)}</td>
                <td>{r.treeStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function AdminPage() {
  return (
    <main className="admin">
      <h1>Pickup list</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <Pickups />
      </Suspense>
    </main>
  );
}
