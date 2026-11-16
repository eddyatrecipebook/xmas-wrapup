import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Password-protects /admin with the browser's built-in sign-in box.
 * Set ADMIN_PASSWORD (and optionally ADMIN_USER, default "admin") in Vercel.
 */
export function proxy(request: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return new NextResponse("The admin area is not set up yet.", { status: 503 });
  }
  const expectedUser = process.env.ADMIN_USER ?? "admin";

  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const split = decoded.indexOf(":");
      const user = decoded.slice(0, split);
      const pass = decoded.slice(split + 1);
      if (split > -1 && user === expectedUser && pass === password) {
        return NextResponse.next();
      }
    } catch {
      // Malformed header: fall through to the sign-in prompt.
    }
  }

  return new NextResponse("Sign in to continue.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Xmas Tree Wrap-Up admin"' },
  });
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
