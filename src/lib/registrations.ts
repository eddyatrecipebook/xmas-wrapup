import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Marks a registration as paid once Stripe confirms the payment. Safe to call
 * more than once: the confirmation page and the Stripe webhook both call it.
 * A hold that ran out while the donor was paying is still honoured.
 */
export async function markRegistrationPaid(
  supabase: SupabaseClient,
  registrationId: string,
  paymentIntentId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("registrations")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", registrationId)
    .eq("stripe_payment_intent_id", paymentIntentId)
    .in("status", ["pending", "expired"])
    .select("id");
  if (error) {
    console.error("markRegistrationPaid failed", error.message);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

/** Releases the spots held by a checkout that was abandoned or replaced. */
export async function expireRegistration(
  supabase: SupabaseClient,
  registrationId: string,
): Promise<void> {
  const { error } = await supabase
    .from("registrations")
    .update({ status: "expired" })
    .eq("id", registrationId)
    .eq("status", "pending");
  if (error) console.error("expireRegistration failed", error.message);
}
