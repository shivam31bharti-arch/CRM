// Route protection middleware for dashboard pages without Node-only dependencies.
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(req: NextRequest) {
  const isAuthRoute = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register");
  const isApiAuthRoute = req.nextUrl.pathname.startsWith("/api/auth");
  // Cron endpoint uses its own CRON_SECRET bearer token — skip JWT check.
  const isCronRoute = req.nextUrl.pathname.startsWith("/api/cron");
  const isProtectedPage = !isAuthRoute && !isApiAuthRoute && !isCronRoute && !req.nextUrl.pathname.startsWith("/_next");

  // [C-4] No hardcoded fallback — if the secret is missing the token will be null
  //       and every request will be redirected to login, preventing silent bypass.
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  });

  if (isProtectedPage && !token) {
    if (req.nextUrl.pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"]
};
