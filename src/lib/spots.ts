import { getPublicClient } from "./supabase";

/**
 * Pickup spots still available, read fresh from the database.
 * Returns null when the database is not connected or the read fails, so the
 * page can fall back to wording that does not show a number.
 */
export async function getSpotsLeft(): Promise<number | null> {
  const supabase = getPublicClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("spots_left");
  if (error || typeof data !== "number") {
    if (error) console.error("spots_left failed", error.message);
    return null;
  }
  return data;
}
