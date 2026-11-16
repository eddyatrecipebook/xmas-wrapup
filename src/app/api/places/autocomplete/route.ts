import type { NextRequest } from "next/server";
import { SERVICE_AREA } from "@/lib/config";

type GoogleSuggestion = {
  placePrediction?: {
    placeId?: string;
    text?: { text?: string };
  };
};

/** Address suggestions as the donor types, biased toward London, Ontario. */
export async function GET(request: NextRequest) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return Response.json({ error: "Address lookup is not set up." }, { status: 501 });
  }

  const query = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 120);
  const session = (request.nextUrl.searchParams.get("session") ?? "").slice(0, 64);
  if (query.length < 3) {
    return Response.json({ suggestions: [] });
  }

  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
    },
    body: JSON.stringify({
      input: query,
      sessionToken: session || undefined,
      includedRegionCodes: ["ca"],
      languageCode: "en",
      locationBias: {
        circle: {
          center: {
            latitude: SERVICE_AREA.center.lat,
            longitude: SERVICE_AREA.center.lng,
          },
          radius: 40000,
        },
      },
    }),
  });

  if (!res.ok) {
    console.error("places autocomplete failed", res.status, await res.text());
    return Response.json({ error: "Address lookup failed." }, { status: 502 });
  }

  const data = (await res.json()) as { suggestions?: GoogleSuggestion[] };
  const suggestions = (data.suggestions ?? [])
    .map((s) => ({
      placeId: s.placePrediction?.placeId ?? "",
      label: s.placePrediction?.text?.text ?? "",
    }))
    .filter((s) => s.placeId && s.label)
    .slice(0, 5);

  return Response.json({ suggestions });
}
