import type { NextRequest } from "next/server";
import { distanceKm, isInServiceArea } from "@/lib/geo";
import { SERVICE_AREA } from "@/lib/config";

type AddressComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

type GooglePlace = {
  id?: string;
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  addressComponents?: AddressComponent[];
};

function component(place: GooglePlace, type: string): string {
  const match = place.addressComponents?.find((c) => c.types?.includes(type));
  return match?.longText ?? "";
}

/** Full address, coordinates and the pickup-area check for a chosen suggestion. */
export async function GET(request: NextRequest) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return Response.json({ error: "Address lookup is not set up." }, { status: 501 });
  }

  const placeId = (request.nextUrl.searchParams.get("id") ?? "").slice(0, 300);
  const session = (request.nextUrl.searchParams.get("session") ?? "").slice(0, 64);
  if (!/^[A-Za-z0-9_-]+$/.test(placeId)) {
    return Response.json({ error: "Unknown address." }, { status: 400 });
  }

  const url = new URL(`https://places.googleapis.com/v1/places/${placeId}`);
  if (session) url.searchParams.set("sessionToken", session);

  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "id,formattedAddress,location,addressComponents",
    },
  });
  if (!res.ok) {
    console.error("places details failed", res.status, await res.text());
    return Response.json({ error: "Address lookup failed." }, { status: 502 });
  }

  const place = (await res.json()) as GooglePlace;
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  if (typeof lat !== "number" || typeof lng !== "number") {
    return Response.json({ error: "We couldn't locate that address." }, { status: 422 });
  }

  const hasStreetNumber = Boolean(component(place, "street_number"));
  const city =
    component(place, "locality") ||
    component(place, "sublocality") ||
    component(place, "administrative_area_level_3");

  return Response.json({
    placeId: place.id ?? placeId,
    // Drop the trailing ", Canada" to keep driver lists short.
    address: (place.formattedAddress ?? "").replace(/, Canada$/, ""),
    city,
    postalCode: component(place, "postal_code"),
    lat,
    lng,
    hasStreetNumber,
    inArea: isInServiceArea({ lat, lng }),
    distanceKm: Math.round(distanceKm(SERVICE_AREA.center, { lat, lng }) * 10) / 10,
  });
}
