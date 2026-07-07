import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const vars = {
    DATABASE_URL: process.env.DATABASE_URL ? `SET (port: ${process.env.DATABASE_URL.match(/:(\d+)\//)?.[1] || "?"})` : "NOT SET",
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
