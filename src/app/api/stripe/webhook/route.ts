import type Stripe from "stripe";
import { expireRegistration, markRegistrationPaid } from "@/lib/registrations";
import { getStripe } from "@/lib/stripe";
import { getAdminClient } from "@/lib/supabase";

/**
 * Stripe calls this when a payment finishes. It is the dependable record that
 * a donation went through, even if the donor closes the tab before the
 * confirmation page loads.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabase = getAdminClient();
  if (!stripe || !secret || !supabase) {
    return new Response("Not configured", { status: 503 });
  }

  const signature = request.headers.get("stripe-signature") ?? "";
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (
    event.type === "payment_intent.succeeded" ||
    event.type === "payment_intent.canceled"
  ) {
    const intent = event.data.object as Stripe.PaymentIntent;
    const registrationId = intent.metadata?.registration_id;
    if (registrationId) {
      if (event.type === "payment_intent.succeeded") {
        await markRegistrationPaid(supabase, registrationId, intent.id);
      } else {
        await expireRegistration(supabase, registrationId);
      }
    }
  }

  return Response.json({ received: true });
}
