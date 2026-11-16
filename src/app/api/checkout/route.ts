import { EVENT } from "@/lib/config";
import { parseCheckout } from "@/lib/checkout";
import { expireRegistration } from "@/lib/registrations";
import { getStripe } from "@/lib/stripe";
import { getAdminClient } from "@/lib/supabase";

/**
 * Called when the donor presses pay. Reserves the pickup spots, creates the
 * Stripe payment for the exact total, and hands the browser what it needs to
 * finish paying. Spots are released again if the payment is never completed.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const supabase = getAdminClient();
  if (!stripe || !supabase) {
    return Response.json(
      { error: "Online registration isn't switched on yet. Please check back soon." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Something was missing from the form." }, { status: 400 });
  }

  const parsed = parseCheckout(body);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }
  const input = parsed.input;

  // A retry after a declined card: release the earlier hold before making a new one.
  if (input.previousRegistrationId) {
    const { data: previous } = await supabase
      .from("registrations")
      .select("id, status, stripe_payment_intent_id")
      .eq("id", input.previousRegistrationId)
      .maybeSingle();
    if (previous && previous.status === "pending") {
      await expireRegistration(supabase, previous.id);
      if (previous.stripe_payment_intent_id) {
        try {
          await stripe.paymentIntents.cancel(previous.stripe_payment_intent_id);
        } catch {
          // Already cancelled or already paid; nothing to undo.
        }
      }
    }
  }

  const treeCount = input.trees.length;
  const amountCents = input.amountPerTree * 100;
  const totalCents = amountCents * treeCount;

  const { data: registrationId, error: reserveError } = await supabase.rpc(
    "reserve_registration",
    {
      payload: {
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        phone: input.phone,
        sms_opt_in: input.smsOptIn,
        amount_per_tree_cents: amountCents,
        trees: input.trees.map((t) => ({
          address: t.address,
          unit: t.unit ?? "",
          note: t.note ?? "",
          city: t.city ?? "",
          postal_code: t.postalCode ?? "",
          lat: t.lat ?? null,
          lng: t.lng ?? null,
          place_id: t.placeId ?? "",
          address_verified: t.lat !== undefined && t.lng !== undefined,
        })),
      },
    },
  );

  if (reserveError || typeof registrationId !== "string") {
    if (reserveError?.message.includes("SOLD_OUT")) {
      return Response.json(
        {
          error:
            treeCount > 1
              ? "Sorry, there aren't enough pickup spots left for that many trees."
              : "Sorry, the last pickup spots were just booked.",
          soldOut: true,
        },
        { status: 409 },
      );
    }
    console.error("reserve_registration failed", reserveError?.message);
    return Response.json(
      { error: "We couldn't save your registration. Please try again." },
      { status: 500 },
    );
  }

  try {
    const intent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: EVENT.currency,
      // Cards only, which also covers Apple Pay and Google Pay.
      allowed_payment_method_types: ["card"],
      receipt_email: input.email,
      description: `${EVENT.name} donation (${treeCount} tree pickup${treeCount === 1 ? "" : "s"})`,
      metadata: {
        registration_id: registrationId,
        tree_count: String(treeCount),
      },
    });

    const { error: linkError } = await supabase
      .from("registrations")
      .update({ stripe_payment_intent_id: intent.id })
      .eq("id", registrationId);
    if (linkError) throw new Error(linkError.message);

    return Response.json({
      clientSecret: intent.client_secret,
      registrationId,
    });
  } catch (err) {
    console.error("payment setup failed", err);
    await expireRegistration(supabase, registrationId);
    return Response.json(
      { error: "We couldn't start the payment. Please try again." },
      { status: 502 },
    );
  }
}
