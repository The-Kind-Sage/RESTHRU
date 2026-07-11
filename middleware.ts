import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

const publicAdminPaths = ["/superadmin/login"];
const publicDashboardPaths = ["/dashboard/login", "/dashboard/forgot-password", "/dashboard/password-reset"];

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

  // Superadmin routes
  if (pathname.startsWith("/superadmin") && !publicAdminPaths.includes(pathname)) {
    if (!session) {
      const loginUrl = new URL("/superadmin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
      const loginUrl = new URL("/dashboard/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Dashboard routes — block RECEPTIONIST, redirect to /reception
  if (pathname.startsWith("/dashboard") && !publicDashboardPaths.includes(pathname)) {
    if (!session) {
      const loginUrl = new URL("/dashboard/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role === "RECEPTIONIST") {
      return NextResponse.redirect(new URL("/reception", request.url));
    }
  }

  // Reception routes
  if (pathname.startsWith("/reception")) {
    if (!session) {
      const loginUrl = new URL("/dashboard/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role === "SUPER_ADMIN" || session.role === "ADMIN") {
      return NextResponse.redirect(new URL("/superadmin", request.url));
    }
    // Owners/MANAGER/STAFF/RECEPTIONIST all allowed through
  }

  // Staff-facing routes (waiter POS and kitchen display) need a session too
  if (pathname.startsWith("/order") || pathname.startsWith("/kitchen")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/superadmin/:path*", "/dashboard/:path*", "/reception/:path*", "/reception", "/order/:path*", "/order", "/kitchen/:path*", "/kitchen"],
};
