"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { EVENT, formatDollars } from "@/lib/config";
import { isValidEmail, phoneDigits, type TreeInput } from "@/lib/checkout";
import { AddressField, newTree, type TreeDraft } from "./AddressField";

type Errors = Record<string, string>;

type Payload = {
  trees: TreeInput[];
  amountPerTree: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  smsOptIn: boolean;
};

const CHECK_FIELDS = "Please check the highlighted fields above.";

const noopSubscribe = () => () => {};

/** False on the server and during the first paint, true once the page is interactive. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function RegisterForm({
  placesEnabled,
  stripeKey,
}: {
  placesEnabled: boolean;
  stripeKey: string | null;
}) {
  const [trees, setTrees] = useState<TreeDraft[]>(() => [newTree()]);
  const [picked, setPicked] = useState<number>(EVENT.defaultPreset);
  const [custom, setCustom] = useState(false);
  const [customText, setCustomText] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const formRef = useRef<HTMLFormElement>(null);
  // Anything typed before the page is interactive would be lost, so the form
  // only accepts input once it is ready.
  const hydrated = useHydrated();

  const stripePromise = useMemo(
    () => (stripeKey ? loadStripe(stripeKey) : null),
    [stripeKey],
  );

  const customAmount = Number.parseInt(customText, 10) || 0;
  const amount = custom ? customAmount : picked;
  const amountValid = amount >= EVENT.minDonation && amount <= EVENT.maxDonation;
  const count = trees.length;
  const total = amount * count;
  const receipt = amountValid && total >= EVENT.receiptThreshold;

  function updateTree(index: number, patch: Partial<TreeDraft>) {
    setTrees((current) =>
      current.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    );
    setErrors((current) => {
      if (!current[`tree-${index}`]) return current;
      const next = { ...current };
      delete next[`tree-${index}`];
      return next;
    });
  }

  function clearError(name: string) {
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  /** Checks the whole form. Returns what to send, or null after showing errors. */
  function validate(): Payload | null {
    const next: Errors = {};

    trees.forEach((t, i) => {
      const verified = t.lat !== undefined && t.lng !== undefined;
      if (t.area === "out") {
        next[`tree-${i}`] = "This address is outside our pickup area.";
      } else if (verified) {
        // Chosen from the suggestions and inside the area.
      } else if (t.query.trim().length < 5) {
        next[`tree-${i}`] = "Please enter the pickup address.";
      } else if (placesEnabled && !t.city) {
        next[`tree-${i}`] = "Please pick the address from the list.";
      } else if (!t.city) {
        next[`tree-${i}`] = "Please choose the community.";
      }
    });

    if (!amountValid) {
      next.amount =
        amount > EVENT.maxDonation
          ? `For a gift over ${formatDollars(EVENT.maxDonation)}, please email ${EVENT.contactEmail}.`
          : `The minimum donation is $${EVENT.minDonation} per tree.`;
    }
    if (!firstName.trim()) next.firstName = "Please enter your first name.";
    if (!lastName.trim()) next.lastName = "Please enter your last name.";
    if (!isValidEmail(email.trim())) next.email = "Please enter a valid email address.";
    if (phoneDigits(phone).length < 10) next.phone = "Please enter a 10-digit mobile number.";

    setErrors(next);
    if (Object.keys(next).length > 0) {
      // Bring the first problem into view.
      requestAnimationFrame(() => {
        formRef.current
          ?.querySelector(".input--error, .field__error, .notice")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return null;
    }

    return {
      trees: trees.map((t) => ({
        address: t.query.trim(),
        unit: t.unit.trim(),
        note: t.note.trim(),
        city: t.city,
        postalCode: t.postalCode.trim(),
        lat: t.lat,
        lng: t.lng,
        placeId: t.placeId,
      })),
      amountPerTree: amount,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      smsOptIn,
    };
  }

  const summaryLine =
    count === 1
      ? `1 tree · ${EVENT.pickupDateCompact}`
      : `${count} trees × ${formatDollars(amount)}`;
  const summaryNote = !amountValid
    ? `Choose a donation of $${EVENT.minDonation} or more per tree.`
    : receipt
      ? "Includes a tax receipt from the London Food Bank."
      : "100% of proceeds support the London Food Bank.";

  return (
    <form
      ref={formRef}
      noValidate
      inert={!hydrated}
      onSubmit={(e) => e.preventDefault()}
      style={{ display: "contents" }}
    >
      <div className="flow__title">
        <h1>Book your tree pickup</h1>
        <p>{EVENT.pickupDateLong} · between 7 AM and midnight</p>
      </div>

      <section className="card" aria-labelledby="step-address">
        <h2 id="step-address">1. Where is your tree?</h2>
        {trees.map((tree, i) => (
          <div key={tree.key} className={i === 0 ? undefined : "tree-extra"} style={i === 0 ? { display: "contents" } : undefined}>
            {i > 0 && (
              <div className="tree-extra__head">
                <span>Tree {i + 1}</span>
                <button
                  type="button"
                  className="text-button text-button--danger"
                  onClick={() => {
                    setTrees((current) => current.filter((_, idx) => idx !== i));
                    setErrors({});
                  }}
                >
                  Remove
                </button>
              </div>
            )}
            <AddressField
              tree={tree}
              index={i}
              placesEnabled={placesEnabled}
              error={errors[`tree-${i}`]}
              onChange={(patch) => updateTree(i, patch)}
            />
            <div className="field-row field-row--unit">
              <label className="field">
                <span className="field__label">
                  Unit <span className="field__optional">(optional)</span>
                </span>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. 12"
                  value={tree.unit}
                  onChange={(e) => updateTree(i, { unit: e.target.value })}
                />
              </label>
              <label className="field">
                <span className="field__label">
                  Note for our drivers{" "}
                  <span className="field__optional">(optional)</span>
                </span>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. corner lot, tree on side street"
                  value={tree.note}
                  onChange={(e) => updateTree(i, { note: e.target.value })}
                />
              </label>
            </div>
          </div>
        ))}
        {count < EVENT.maxTreesPerOrder && (
          <button
            type="button"
            className="add-tree"
            onClick={() => setTrees((current) => [...current, newTree()])}
          >
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            <span>Add a tree at another address</span>
          </button>
        )}
      </section>

      <section className="card" aria-labelledby="step-donation">
        <div>
          <h2 id="step-donation">
            {count === 1
              ? "2. Choose your donation"
              : "2. Choose your donation per tree"}
          </h2>
          <p className="card__sub">
            100% of proceeds support the London Food Bank.
          </p>
        </div>
        <div className="tiles">
          {EVENT.presets.map((value) => (
            <button
              key={value}
              type="button"
              className="tile"
              aria-pressed={!custom && picked === value}
              onClick={() => {
                setPicked(value);
                setCustom(false);
                clearError("amount");
              }}
            >
              {value >= EVENT.receiptThreshold && (
                <span className="tile__badge">Tax receipt</span>
              )}
              <span className="tile__amount">{formatDollars(value)}</span>
            </button>
          ))}
        </div>
        {!custom ? (
          <button
            type="button"
            className="text-button"
            style={{ alignSelf: "flex-start" }}
            onClick={() => {
              setCustom(true);
              setCustomText("");
            }}
          >
            Enter a different amount
          </button>
        ) : (
          <div className="field">
            <label className="field__label" htmlFor="custom-amount">
              Your amount
            </label>
            <div className="amount-input">
              <span aria-hidden="true">$</span>
              <input
                id="custom-amount"
                type="text"
                inputMode="numeric"
                autoFocus
                placeholder={`${EVENT.minDonation} or more`}
                value={customText}
                onChange={(e) => {
                  setCustomText(e.target.value.replace(/[^0-9]/g, "").slice(0, 5));
                  clearError("amount");
                }}
              />
            </div>
            {(errors.amount || (customText !== "" && customAmount < EVENT.minDonation)) && (
              <p className="field__error">
                {errors.amount ?? `The minimum donation is $${EVENT.minDonation} per tree.`}
              </p>
            )}
          </div>
        )}
        <p className="field__hint">
          Minimum donation ${EVENT.minDonation} per tree. Gifts of $
          {EVENT.receiptThreshold} or more receive a tax receipt.
        </p>
      </section>

      <section className="card" aria-labelledby="step-details">
        <h2 id="step-details">3. Your details</h2>
        <div className="field-row">
          <div className="field">
            <label className="field__label" htmlFor="first-name">
              First name
            </label>
            <input
              id="first-name"
              className={`input${errors.firstName ? " input--error" : ""}`}
              type="text"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                clearError("firstName");
              }}
            />
            {errors.firstName && <p className="field__error">{errors.firstName}</p>}
          </div>
          <div className="field">
            <label className="field__label" htmlFor="last-name">
              Last name
            </label>
            <input
              id="last-name"
              className={`input${errors.lastName ? " input--error" : ""}`}
              type="text"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                clearError("lastName");
              }}
            />
            {errors.lastName && <p className="field__error">{errors.lastName}</p>}
          </div>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className={`input${errors.email ? " input--error" : ""}`}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError("email");
            }}
          />
          {errors.email && <p className="field__error">{errors.email}</p>}
        </div>
        <div className="field">
          <label className="field__label" htmlFor="phone">
            Mobile number
          </label>
          <input
            id="phone"
            className={`input${errors.phone ? " input--error" : ""}`}
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              clearError("phone");
            }}
          />
          {errors.phone && <p className="field__error">{errors.phone}</p>}
        </div>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={smsOptIn}
            onChange={(e) => setSmsOptIn(e.target.checked)}
          />
          <span>Text me a one-time reminder the day before my pickup date.</span>
        </label>
      </section>

      <section className="card" aria-labelledby="step-pay">
        <h2 id="step-pay">4. Donate and confirm</h2>
        <div className="summary">
          <div className="summary__row">
            <span>{summaryLine}</span>
            <span className="summary__total">
              {amountValid ? formatDollars(total) : "$0"}
            </span>
          </div>
          <span className="summary__note">{summaryNote}</span>
        </div>
        {stripePromise ? (
          <Elements
            stripe={stripePromise}
            options={{
              mode: "payment",
              // Stripe needs a positive amount even before one is chosen.
              amount: (amountValid ? total : EVENT.minDonation) * 100,
              currency: EVENT.currency,
              // Cards only, which also covers Apple Pay and Google Pay.
              allowedPaymentMethodTypes: ["card"],
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#007951",
                  colorText: "#231f20",
                  colorDanger: "#a3182a",
                  borderRadius: "12px",
                  fontFamily: "DM Sans, system-ui, sans-serif",
                  fontSizeBase: "16px",
                },
              },
              fonts: [
                {
                  cssSrc:
                    "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap",
                },
              ],
            }}
          >
            <PaySection
              validate={validate}
              ready={amountValid}
              label={
                amountValid
                  ? `Donate ${formatDollars(total)} and book pickup`
                  : "Choose a donation to continue"
              }
            />
          </Elements>
        ) : (
          <div className="notice" role="status">
            <strong>Online payment isn&apos;t switched on yet.</strong> Check
            back soon, or email{" "}
            <a href={`mailto:${EVENT.contactEmail}`}>{EVENT.contactEmail}</a>.
          </div>
        )}
      </section>
    </form>
  );
}

function PaySection({
  validate,
  ready,
  label,
}: {
  validate: () => Payload | null;
  ready: boolean;
  label: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasWallets, setHasWallets] = useState(false);
  const previousRegistration = useRef<string | null>(null);

  async function pay() {
    if (!stripe || !elements || busy) return;
    const payload = validate();
    if (!payload) {
      setError(CHECK_FIELDS);
      return;
    }
    setBusy(true);
    setError(null);

    // Let Stripe check the card or wallet details first.
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Please check your payment details.");
      setBusy(false);
      return;
    }

    let data: { clientSecret?: string; registrationId?: string; error?: string } | null = null;
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          previousRegistrationId: previousRegistration.current ?? undefined,
        }),
      });
      data = await res.json();
      if (!res.ok || !data?.clientSecret || !data.registrationId) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }
    } catch {
      setError("We couldn't reach the server. Please check your connection and try again.");
      setBusy(false);
      return;
    }

    previousRegistration.current = data.registrationId;

    // On success Stripe sends the donor to the confirmation page.
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret: data.clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/register/complete`,
      },
    });
    if (confirmError) {
      setError(confirmError.message ?? "The payment didn't go through. Please try again.");
    }
    setBusy(false);
  }

  return (
    <>
      <div style={hasWallets ? undefined : { display: "none" }}>
        <ExpressCheckoutElement
          options={{
            buttonHeight: 54,
            // Wallet row is for Apple Pay and Google Pay only.
            paymentMethods: { link: "never", amazonPay: "never", paypal: "never", klarna: "never" },
          }}
          onReady={({ availablePaymentMethods }) => {
            setHasWallets(
              Boolean(
                availablePaymentMethods &&
                  Object.values(availablePaymentMethods).some(Boolean),
              ),
            );
          }}
          onClick={(event) => {
            // Only open Apple Pay / Google Pay once the form above is complete.
            if (validate()) {
              setError(null);
              event.resolve();
            } else {
              setError(CHECK_FIELDS);
            }
          }}
          onConfirm={() => {
            void pay();
          }}
        />
      </div>
      {hasWallets && <div className="divider">or pay by card</div>}
      <PaymentElement
        options={{
          layout: "tabs",
          wallets: { applePay: "never", googlePay: "never" },
          // Donors are in and around London, Ontario.
          defaultValues: { billingDetails: { address: { country: "CA" } } },
        }}
      />
      {error && (
        <div className="notice notice--error" role="alert">
          {error}
        </div>
      )}
      <button
        type="button"
        className="btn btn--block"
        disabled={!stripe || !ready || busy}
        onClick={() => void pay()}
      >
        {busy ? "Processing…" : label}
      </button>
      <p className="fine-print">Payments are processed securely by Stripe.</p>
    </>
  );
}
