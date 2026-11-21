import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only: proxy sees whether the refresh cookie exists, not whether it's valid.
// AuthGuard/GuestGuard confirm with /auth/me on the client. The real protection is the backend.
// refreshToken (7d) not accessToken (15m): an expired access token is refreshed client-side.
const GUEST_ONLY = ["/auth"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = req.cookies.has("refreshToken");
  const isGuestOnly = GUEST_ONLY.includes(pathname);

  if (isGuestOnly && hasSession) return NextResponse.redirect(new URL("/", req.url));
  if (!isGuestOnly && !hasSession) return NextResponse.redirect(new URL("/auth", req.url));
  return NextResponse.next();
}

export const config = {
  // every page except the /api proxy, Next internals and files with an extension (public/ assets)
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
