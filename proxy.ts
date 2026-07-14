import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { DASHBOARD_AUTH_ROUTES, SUPERADMIN_AUTH_ROUTES, ORDER_AUTH_ROUTES } from "@/lib/constants";
import { jwtSecret as secret } from "@/lib/jwt-secret";

const publicSuperadminPaths: readonly string[] = SUPERADMIN_AUTH_ROUTES;
const publicDashboardPaths: readonly string[] = DASHBOARD_AUTH_ROUTES;
const publicOrderPaths: readonly string[] = ORDER_AUTH_ROUTES;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("session")?.value;

  let session: any = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret);
      session = payload;
    } catch {
      // invalid token
    }
  }

  // Helper: redirect to login preserving the original path
  const toLogin = (base: string) => {
    const loginUrl = new URL(base, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  };

  const role = session?.role;

  // SUPER_ADMIN / ADMIN can only access /superadmin
  if (role === "SUPER_ADMIN" || role === "ADMIN") {
    if (!pathname.startsWith("/superadmin")) {
      return NextResponse.redirect(new URL("/superadmin", request.url));
    }
  }

  // Superadmin routes — must be SUPER_ADMIN or ADMIN. The block above only
  // redirects admins AWAY from non-superadmin paths; it does NOT keep
  // non-admins OUT of /superadmin, so the role check must happen here too.
  if (pathname.startsWith("/superadmin") && !publicSuperadminPaths.includes(pathname)) {
    if (!session) return toLogin("/superadmin/login");
    if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
      // Authenticated but not an admin (e.g. a restaurant owner). Send them to
      // the admin login so they can sign in with an admin account — NOT to their
      // own /owner, which silently swallows the request and makes the admin
      // console look unreachable.
      return toLogin("/superadmin/login");
    }
  }

  // Owner dashboard routes
  if (pathname.startsWith("/owner") && !publicDashboardPaths.includes(pathname)) {
    if (!session) return toLogin("/owner/login");
    if (role === "RECEPTIONIST") return NextResponse.redirect(new URL("/reception", request.url));
    if (role === "WAITER") return NextResponse.redirect(new URL("/order", request.url));
  }

  // Reception routes — owner-only access in the console, so owner is redirected
  // to their own dashboard.
  if (pathname.startsWith("/reception")) {
    if (!session) return toLogin("/owner/login");
    if (role === "WAITER") return NextResponse.redirect(new URL("/order", request.url));
    if (role === "RESTAURANT_OWNER") return NextResponse.redirect(new URL("/owner", request.url));
  }

  // Order routes (waiter station). /order/login is public so an unauthenticated
  // waiter can reach it without redirect-looping.
  if (pathname.startsWith("/order") && !publicOrderPaths.includes(pathname)) {
    if (!session) return toLogin("/order/login");
    if (role === "RECEPTIONIST") return NextResponse.redirect(new URL("/reception", request.url));
    if (role === "RESTAURANT_OWNER") return NextResponse.redirect(new URL("/owner", request.url));
  }

  // Exposes the matched path to Server Components (e.g. app/dashboard/layout.tsx)
  // via headers(), so they can run their own belt-and-suspenders session check
  // without relying solely on this proxy having run.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/superadmin/:path*", "/owner/:path*", "/owner", "/reception/:path*", "/reception", "/order/:path*", "/order"],
};
