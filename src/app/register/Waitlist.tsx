"use client";

import { useState } from "react";
import { EVENT } from "@/lib/config";

export function Waitlist() {
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "busy") return;
    setState("busy");
    setError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, address }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        setState("idle");
        return;
      }
      setState("done");
    } catch {
      setError("We couldn't reach the server. Please try again.");
      setState("idle");
    }
  }

  return (
    <>
      <div className="soldout__title">
        <h1>Every pickup spot is booked</h1>
        <p>
          Thank you, London. All {EVENT.capacity} trees for{" "}
          {EVENT.pickupDateShort} are spoken for.
        </p>
      </div>
      <div className="soldout__bar" aria-hidden="true" />

      <section className="card">
        {state === "done" ? (
          <div role="status">
            <h2>You&apos;re on the waitlist</h2>
            <p className="card__sub">
              We&apos;ll email you if we can add more pickups, and when next
              year&apos;s registration opens.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: "contents" }}>
            <div>
              <h2>Join the waitlist</h2>
              <p className="card__sub">
                If we can add volunteers and trucks, people on the waitlist
                hear first. You&apos;ll also get first notice when next
                year&apos;s registration opens.
              </p>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="waitlist-email">
                Email
              </label>
              <input
                id="waitlist-email"
                className="input"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="waitlist-address">
                Pickup address{" "}
                <span className="field__optional">(optional)</span>
              </label>
              <input
                id="waitlist-address"
                className="input"
                type="text"
                autoComplete="street-address"
                placeholder="Helps us plan extra routes"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            {error && (
              <div className="notice notice--error" role="alert">
                {error}
              </div>
            )}
            <button type="submit" className="btn btn--block" disabled={state === "busy"}>
              {state === "busy" ? "Adding you…" : "Join the waitlist"}
            </button>
          </form>
        )}
      </section>

      <p className="fine-print" style={{ fontSize: 14 }}>
        Already registered? Your pickup details are in your confirmation email.
        Questions:{" "}
        <a href={`mailto:${EVENT.contactEmail}`}>{EVENT.contactEmail}</a>
      </p>
    </>
  );
}
