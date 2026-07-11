import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  // This endpoint discloses which secrets are configured and a live user count,
  // and it sits outside the middleware matcher — so it must gate itself. Only
  // admins may see it; everyone else gets a 404 so its existence isn't revealed.
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const dbUrl = process.env.DATABASE_URL || "";
  const hostMatch = dbUrl.match(/@([^\/\?]+)/);
  const host = hostMatch ? hostMatch[1] : "unknown";

  const vars = {
    DATABASE_URL: dbUrl ? `SET (host: ${host})` : "NOT SET",
    DIRECT_URL: process.env.DIRECT_URL ? "SET" : "NOT SET",
    JWT_SECRET: process.env.JWT_SECRET ? "SET" : "NOT SET (using fallback)",
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "NOT SET",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "NOT SET",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "NOT SET",
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
  };

  let dbStatus = "untested";
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$connect();
    const userCount = await prisma.user.count();
    dbStatus = `connected, ${userCount} users`;
    await prisma.$disconnect();
  } catch (e) {
    dbStatus = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json({ env: vars, database: dbStatus });
}
