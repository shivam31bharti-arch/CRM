// Route protection middleware for dashboard pages without Node-only dependencies.
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(req: NextRequest) {
  const isAuthRoute = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register");
  const isApiAuthRoute = req.nextUrl.pathname.startsWith("/api/auth");
  const isProtectedPage = !isAuthRoute && !isApiAuthRoute && !req.nextUrl.pathname.startsWith("/_next");
  const token = await getToken({
    req,
    secret:
      process.env.AUTH_SECRET ??
      process.env.NEXTAUTH_SECRET ??
      (process.env.NODE_ENV === "development" ? "local-development-auth-secret-change-me" : undefined)
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
