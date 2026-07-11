import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { DASHBOARD_AUTH_ROUTES } from "@/lib/constants";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

const publicSuperadminPaths = ["/superadmin/login"];
const publicDashboardPaths: readonly string[] = DASHBOARD_AUTH_ROUTES;

export async function middleware(request: NextRequest) {
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

  // Superadmin routes — gate for non-admin
  if (pathname.startsWith("/superadmin") && !publicSuperadminPaths.includes(pathname)) {
    if (!session) return toLogin("/superadmin/login");
    // role check already handled above
  }

  // Dashboard routes
  if (pathname.startsWith("/dashboard") && !publicDashboardPaths.includes(pathname)) {
    if (!session) return toLogin("/dashboard/login");
    if (role === "RECEPTIONIST") return NextResponse.redirect(new URL("/reception", request.url));
    if (role === "WAITER") return NextResponse.redirect(new URL("/order", request.url));
  }

  // Reception routes
  if (pathname.startsWith("/reception")) {
    if (!session) return toLogin("/dashboard/login");
    if (role === "WAITER") return NextResponse.redirect(new URL("/order", request.url));
  }

  // Order routes
  if (pathname.startsWith("/order")) {
    if (!session) return toLogin("/login");
    if (role === "RECEPTIONIST") return NextResponse.redirect(new URL("/reception", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/superadmin/:path*", "/dashboard/:path*", "/reception/:path*", "/reception", "/order/:path*", "/order"],
};
