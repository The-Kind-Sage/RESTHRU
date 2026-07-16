import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { jwtSecret as secret } from "@/lib/jwt-secret";
import {
  SESSION_PORTALS,
  portalForPath,
  portalForRole,
  sessionCookieName,
  type SessionPortal,
} from "@/lib/constants";

export type SessionUser = {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
  restaurantId?: string | null;
};

const BASE_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
} as const;

// Which portal does the current request belong to? proxy.ts stamps every
// matched request with x-pathname; outside the four portals (home page,
// /login, /register) this returns null.
async function portalFromRequest(): Promise<SessionPortal | null> {
  const pathname = (await headers()).get("x-pathname");
  return portalForPath(pathname);
}

type CookieStore = Awaited<ReturnType<typeof cookies>>;

// Read and verify one portal's cookie. A token is only honored in the portal
// its role belongs to, so a cookie copied under another portal's name is
// rejected.
async function readPortalSession(
  cookieStore: CookieStore,
  portal: SessionPortal
): Promise<SessionUser | null> {
  const token = cookieStore.get(sessionCookieName(portal))?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    const user = payload as unknown as SessionUser;
    return portalForRole(user.role) === portal ? user : null;
  } catch {
    return null;
  }
}

// Each portal (superadmin, owner, reception, waiter) has its own cookie so the
// same browser can hold all four sessions at once — logging in or out of one
// never touches the others.
export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName(portalForRole(user.role)), token, {
    ...BASE_COOKIE,
    maxAge: 60 * 60 * 24 * 7,
  });

  // Drop the pre-split shared cookie if the browser still carries one.
  if (cookieStore.get("session")) {
    cookieStore.set("session", "", { ...BASE_COOKIE, maxAge: 0 });
  }
}

export async function getSession(portal?: SessionPortal): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const resolved = portal ?? (await portalFromRequest());
  if (resolved) return readPortalSession(cookieStore, resolved);

  // Outside any portal (home page, /login): return the first valid session in
  // priority order so shared UI like the navbar still knows who's signed in.
  for (const p of SESSION_PORTALS) {
    const session = await readPortalSession(cookieStore, p);
    if (session) return session;
  }
  return null;
}

export async function clearSession(portal?: SessionPortal) {
  const cookieStore = await cookies();
  const expire = (name: string) =>
    cookieStore.set(name, "", { ...BASE_COOKIE, maxAge: 0 });

  const resolved = portal ?? (await portalFromRequest());
  if (resolved) {
    expire(sessionCookieName(resolved));
  } else {
    // No portal context — clear only the session getSession() would have
    // returned, so a stray logout can't wipe every portal at once.
    for (const p of SESSION_PORTALS) {
      if (await readPortalSession(cookieStore, p)) {
        expire(sessionCookieName(p));
        break;
      }
    }
  }

  // Legacy shared cookie from before the per-portal split.
  if (cookieStore.get("session")) expire("session");
}

export async function verifySession(): Promise<SessionUser | null> {
  return getSession();
}
