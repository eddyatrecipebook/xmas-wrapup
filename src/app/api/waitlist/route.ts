import { isValidEmail } from "@/lib/checkout";
import { getAdminClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const supabase = getAdminClient();
  if (!supabase) {
    return Response.json(
      { error: "The waitlist isn't switched on yet. Please check back soon." },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Please enter your email." }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 200) : "";
  const address =
    typeof body.address === "string" ? body.address.trim().slice(0, 240) : "";
  if (!isValidEmail(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const { error } = await supabase
    .from("waitlist")
    .insert({ email, address: address || null });
  // 23505 = this email is already on the list, which is fine.
  if (error && error.code !== "23505") {
    console.error("waitlist insert failed", error.message);
    return Response.json(
      { error: "We couldn't add you just now. Please try again." },
      { status: 500 },
    );
  }

  return Response.json({ ok: true });
}
