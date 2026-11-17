import { buildPreview } from "@/emails/samples";

/**
 * Shows one email exactly as it would be sent, filled in with a made-up donor.
 * Add ?sample=two-trees for the busier case, or ?format=text for the
 * plain-text version.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ template: string }> },
) {
  const { template } = await params;
  const url = new URL(request.url);
  const email = buildPreview(template, url.searchParams.get("sample") ?? "one-tree", {
    // Load the images from wherever this preview is running.
    assetBase: url.origin,
  });
  if (!email) {
    return new Response("No such email.", { status: 404 });
  }

  const asText = url.searchParams.get("format") === "text";
  return new Response(asText ? `Subject: ${email.subject}\n\n${email.text}` : email.html, {
    headers: {
      "Content-Type": `${asText ? "text/plain" : "text/html"}; charset=utf-8`,
      "Cache-Control": "no-store",
    },
  });
}
