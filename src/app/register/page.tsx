import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { FlowShell } from "@/components/FlowShell";
import { spotsChipLabel } from "@/components/SpotsCounter";
import { EVENT } from "@/lib/config";
import { getSpotsLeft } from "@/lib/spots";
import { RegisterForm } from "./RegisterForm";
import { Waitlist } from "./Waitlist";

export const metadata: Metadata = {
  title: "Book your tree pickup",
};

/** Shows the registration form, or the waitlist once every spot is booked. */
async function Gate() {
  // Always decided at request time, so a sold-out drive closes straight away.
  await connection();
  const left = await getSpotsLeft();

  if (left === 0) {
    return (
      <FlowShell
        chip={
          <span className="chip chip--dark">
            {EVENT.capacity} of {EVENT.capacity} booked
          </span>
        }
      >
        <Waitlist />
      </FlowShell>
    );
  }

  const label = spotsChipLabel(left);
  return (
    <FlowShell chip={label ? <span className="chip">{label}</span> : null}>
      <RegisterForm
        placesEnabled={Boolean(process.env.GOOGLE_MAPS_API_KEY)}
        stripeKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null}
      />
    </FlowShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <FlowShell>
          <div className="flow__title">
            <h1>Book your tree pickup</h1>
            <p>{EVENT.pickupDateLong} · between 7 AM and midnight</p>
          </div>
        </FlowShell>
      }
    >
      <Gate />
    </Suspense>
  );
}
