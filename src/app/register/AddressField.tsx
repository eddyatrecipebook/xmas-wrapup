"use client";

import { useEffect, useId, useRef, useState } from "react";
import { EVENT, SERVICE_AREA } from "@/lib/config";

export type TreeDraft = {
  key: string;
  /** What is typed in the address box. */
  query: string;
  /** Set once an address has been chosen from the suggestions. */
  placeId: string;
  lat?: number;
  lng?: number;
  city: string;
  postalCode: string;
  area: "unknown" | "in" | "out";
  unit: string;
  note: string;
};

export function newTree(): TreeDraft {
  return {
    key:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Math.random()),
    query: "",
    placeId: "",
    city: "",
    postalCode: "",
    area: "unknown",
    unit: "",
    note: "",
  };
}

type Suggestion = { placeId: string; label: string };

const OTHER = "Somewhere else";

function OutOfArea() {
  return (
    <div className="notice" role="status">
      <strong>This address looks a little far outside London.</strong> Email{" "}
      <a href={`mailto:${EVENT.contactEmail}`}>{EVENT.contactEmail}</a> and
      we&apos;ll let you know if we can reach you.
    </div>
  );
}

function Check() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#007951"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function AddressField({
  tree,
  index,
  placesEnabled,
  error,
  onChange,
}: {
  tree: TreeDraft;
  index: number;
  placesEnabled: boolean;
  error?: string;
  onChange: (patch: Partial<TreeDraft>) => void;
}) {
  const id = useId();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [lookupFailed, setLookupFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const session = useRef<string>("");

  const chosen = tree.placeId !== "";
  const query = tree.query;

  // Fetch suggestions a moment after the donor stops typing.
  useEffect(() => {
    if (!placesEnabled || chosen || query.trim().length < 3) {
      return;
    }
    if (!session.current) session.current = crypto.randomUUID();
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/places/autocomplete?q=${encodeURIComponent(query)}&session=${session.current}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { suggestions: Suggestion[] };
        setSuggestions(data.suggestions ?? []);
        setLookupFailed(false);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setLookupFailed(true);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [placesEnabled, chosen, query]);

  async function choose(suggestion: Suggestion) {
    setBusy(true);
    setSuggestions([]);
    try {
      const res = await fetch(
        `/api/places/details?id=${encodeURIComponent(suggestion.placeId)}&session=${session.current}`,
      );
      if (!res.ok) throw new Error(String(res.status));
      const d = (await res.json()) as {
        placeId: string;
        address: string;
        city: string;
        postalCode: string;
        lat: number;
        lng: number;
        inArea: boolean;
      };
      onChange({
        query: d.address || suggestion.label,
        placeId: d.placeId,
        lat: d.lat,
        lng: d.lng,
        city: d.city,
        postalCode: d.postalCode,
        area: d.inArea ? "in" : "out",
      });
    } catch {
      setLookupFailed(true);
    } finally {
      // A finished lookup ends the billing session; start a new one next time.
      session.current = "";
      setBusy(false);
    }
  }

  const label = index === 0 ? "Pickup address" : `Pickup address for tree ${index + 1}`;
  const showSuggestions = placesEnabled && !chosen && suggestions.length > 0 && query.trim().length >= 3;

  // Without the address service, or if it is down, fall back to typing the
  // address and choosing the community from a list.
  const manual = !placesEnabled || lookupFailed;

  if (manual) {
    return (
      <>
        <div className="field">
          <label className="field__label" htmlFor={`${id}-street`}>
            {label}
          </label>
          <input
            id={`${id}-street`}
            className={`input${error ? " input--error" : ""}`}
            type="text"
            autoComplete="address-line1"
            placeholder="Street number and name"
            value={tree.query}
            onChange={(e) => onChange({ query: e.target.value, placeId: "", lat: undefined, lng: undefined })}
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label className="field__label" htmlFor={`${id}-city`}>
              Community
            </label>
            <select
              id={`${id}-city`}
              className="input"
              value={tree.area === "out" ? OTHER : tree.city}
              onChange={(e) => {
                const value = e.target.value;
                if (value === OTHER) onChange({ city: "", area: "out" });
                else onChange({ city: value, area: value ? "in" : "unknown" });
              }}
            >
              <option value="">Choose one</option>
              {SERVICE_AREA.communities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value={OTHER}>{OTHER}</option>
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor={`${id}-postal`}>
              Postal code
            </label>
            <input
              id={`${id}-postal`}
              className="input"
              type="text"
              autoComplete="postal-code"
              value={tree.postalCode}
              onChange={(e) => onChange({ postalCode: e.target.value.toUpperCase().slice(0, 7) })}
            />
          </div>
        </div>
        {tree.area === "out" && <OutOfArea />}
        {error && tree.area !== "out" && <p className="field__error">{error}</p>}
      </>
    );
  }

  const stateClass = error
    ? " input--error"
    : tree.area === "in"
      ? " input--ok"
      : tree.area === "out"
        ? " input--warn"
        : "";

  return (
    <div className="field">
      <label className="field__label" htmlFor={`${id}-address`}>
        {label}
      </label>
      <input
        id={`${id}-address`}
        className={`input${stateClass}`}
        type="text"
        autoComplete="off"
        placeholder="Start typing your street address"
        value={tree.query}
        aria-describedby={`${id}-status`}
        onChange={(e) =>
          onChange({
            query: e.target.value,
            placeId: "",
            lat: undefined,
            lng: undefined,
            city: "",
            postalCode: "",
            area: "unknown",
          })
        }
      />
      {showSuggestions && (
        <ul className="suggestions" aria-label="Matching addresses">
          {suggestions.map((s) => (
            <li key={s.placeId}>
              <button type="button" onClick={() => choose(s)}>
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div id={`${id}-status`} aria-live="polite">
        {busy && <p className="field__hint">Checking that address…</p>}
        {!busy && tree.area === "in" && (
          <p className="area-ok">
            <Check />
            <span>Good news, you&apos;re in our pickup area.</span>
          </p>
        )}
        {!busy && tree.area === "out" && <OutOfArea />}
        {!busy && tree.area === "unknown" && !error && !showSuggestions && (
          <p className="field__hint">
            Pick your address from the list so our drivers can find you.
          </p>
        )}
        {error && tree.area !== "out" && <p className="field__error">{error}</p>}
      </div>
    </div>
  );
}
