import { connection } from "next/server";
import { EVENT } from "@/lib/config";
import { getSpotsLeft } from "@/lib/spots";

const NOTE = `We're collecting ${EVENT.capacity} trees this year. When the spots are gone, registration closes.`;

/** Live "X of 500 pickup spots left" panel on the home page. */
export async function SpotsCounter() {
  // Always read at request time so the number is never a stale build-time value.
  await connection();
  const left = await getSpotsLeft();

  if (left === null) {
    return (
      <div className="spots">
        <p className="spots__line">
          <span className="spots__number">{EVENT.capacity}</span>
          <span>pickup spots this year</span>
        </p>
        <p className="spots__note">
          When the spots are gone, registration closes.
        </p>
      </div>
    );
  }

  if (left === 0) {
    return (
      <div className="spots">
        <p className="spots__line">
          <span>All {EVENT.capacity} pickup spots are booked</span>
        </p>
        <div className="spots__bar" aria-hidden="true">
          <div className="spots__fill" style={{ width: "100%" }} />
        </div>
        <p className="spots__note">
          Join the waitlist and we&apos;ll email you if we can add more.
        </p>
      </div>
    );
  }

  const taken = EVENT.capacity - left;
  const pct = Math.min(100, Math.max(0, (taken / EVENT.capacity) * 100));
  return (
    <div className="spots">
      <p className="spots__line">
        <span className="spots__number">{left}</span>
        <span>of {EVENT.capacity} pickup spots left</span>
      </p>
      <div
        className="spots__bar"
        role="img"
        aria-label={`${taken} of ${EVENT.capacity} pickup spots are booked`}
      >
        <div className="spots__fill" style={{ width: `${pct.toFixed(1)}%` }} />
      </div>
      <p className="spots__note">{NOTE}</p>
    </div>
  );
}

export function SpotsCounterFallback() {
  return (
    <div className="spots spots--loading" aria-hidden="true">
      <p className="spots__line">
        <span className="spots__number">000</span>
        <span>of {EVENT.capacity} pickup spots left</span>
      </p>
      <div className="spots__bar" />
      <p className="spots__note">{NOTE}</p>
    </div>
  );
}

/** Heading for the closing call to action; falls back when there is no count. */
export async function SpotsHeadline() {
  await connection();
  const left = await getSpotsLeft();
  if (left === null) return <>Book your pickup spot</>;
  if (left === 0) return <>All {EVENT.capacity} pickup spots are booked</>;
  return (
    <>
      {left} pickup {left === 1 ? "spot" : "spots"} left
    </>
  );
}

/** Small chip used in the registration header. */
export function spotsChipLabel(left: number | null): string | null {
  if (left === null) return null;
  return `${left} of ${EVENT.capacity} spots left`;
}
