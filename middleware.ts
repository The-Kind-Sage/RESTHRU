import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

const publicAdminPaths = ["/admin/login"];
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

  // Admin routes
  if (pathname.startsWith("/admin") && !publicAdminPaths.includes(pathname)) {
    if (!session) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role !== "ADMIN") {
      const loginUrl = new URL("/dashboard/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Dashboard routes
  if (pathname.startsWith("/dashboard") && !publicDashboardPaths.includes(pathname)) {
    if (!session) {
      const loginUrl = new URL("/dashboard/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
