import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FlowShell } from "@/components/FlowShell";
import { EVENT, formatDollars } from "@/lib/config";
import { markRegistrationPaid } from "@/lib/registrations";
import { getStripe } from "@/lib/stripe";
import { getAdminClient } from "@/lib/supabase";
import { ShareButton } from "./ShareButton";

export const metadata: Metadata = {
  title: "You're booked",
  robots: { index: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function Problem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card done">
      <h1>{title}</h1>
      <p className="done__lede">{children}</p>
      <Link href="/register" className="btn btn--small">
        Back to registration
      </Link>
    </section>
  );
}

async function Result({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const intentId = first(params.payment_intent);
  const stripe = getStripe();

  if (!stripe || !/^pi_[A-Za-z0-9]+$/.test(intentId)) {
    return (
      <Problem title="We couldn't find that payment">
        If you completed a donation, your confirmation email has your pickup
        details. Otherwise, you can start again.
      </Problem>
    );
  }

  let intent;
  try {
    intent = await stripe.paymentIntents.retrieve(intentId);
  } catch {
    return (
      <Problem title="We couldn't find that payment">
        If you completed a donation, your confirmation email has your pickup
        details. Otherwise, you can start again.
      </Problem>
    );
  }

  if (intent.status === "processing") {
    return (
      <section className="card done">
        <h1>Your payment is processing</h1>
        <p className="done__lede">
          This can take a minute. Your pickup spot is held, and we&apos;ll
          confirm it by email as soon as the payment clears.
        </p>
      </section>
    );
  }

  if (intent.status !== "succeeded") {
    return (
      <Problem title="The payment didn't go through">
        You haven&apos;t been charged. Please try again with the same or a
        different payment method.
      </Problem>
    );
  }

  // Record the payment here as well as in the webhook, whichever lands first.
  const registrationId = intent.metadata?.registration_id;
  const supabase = getAdminClient();
  if (supabase && registrationId) {
    await markRegistrationPaid(supabase, registrationId, intent.id);
  }

  const trees = Number.parseInt(intent.metadata?.tree_count ?? "1", 10) || 1;
  const total = intent.amount / 100;
  const treeWord = trees === 1 ? "1 tree" : `${trees} trees`;

  return (
    <section className="card done" style={{ padding: "28px 20px", gap: 18 }}>
      <span className="done-mark" aria-hidden="true">
        <svg
          width="34"
          height="34"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
      <div>
        <h1>You&apos;re booked. Thank you!</h1>
        <p className="done__lede">
          Your {formatDollars(total)} donation is on its way to the London Food
          Bank, and we have {treeWord} on our list for {EVENT.pickupDateShort}.
        </p>
      </div>
      <ol className="next-steps">
        <li>Remove all decorations, lights and tinsel from your tree.</li>
        <li>
          Put it at the curb by 7 AM on {EVENT.pickupDateShort}, or the night
          before.
        </li>
        <li>We&apos;ll collect it between 7 AM and midnight.</li>
      </ol>
      <div className="share-box">
        <p>Know a neighbour with a real tree?</p>
        <p style={{ fontSize: 15, color: "var(--ink-soft)" }}>
          We&apos;re only collecting {EVENT.capacity} trees this year. Pass it
          on before the spots are gone.
        </p>
        <ShareButton />
      </div>
      <Link href="/register" style={{ alignSelf: "center", fontWeight: 700 }}>
        Register another tree
      </Link>
    </section>
  );
}

export default function CompletePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <FlowShell>
      <Suspense
        fallback={
          <section className="card done">
            <h1>Confirming your donation…</h1>
          </section>
        }
      >
        <Result searchParams={searchParams} />
      </Suspense>
    </FlowShell>
  );
}
