import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session-token";

// Optimistic gate: bounce signed-out visitors to /login. Pages and actions still call
// requireUser() themselves, which also re-checks the allow list.
export async function proxy(request: NextRequest) {
  const user = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (user) return NextResponse.next();
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    "/((?!login|sms-policy|api/auth|api/cron|_next|brand|icon.png|apple-icon.png|manifest.webmanifest|favicon.ico).*)",
  ],
};
