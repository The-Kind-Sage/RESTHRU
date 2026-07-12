// Single source of truth for the JWT signing secret, imported by both
// lib/auth.ts (session mint/verify) and proxy.ts (edge auth gate) so the two
// can never drift onto different secrets.
//
// Previously both files fell back to a hardcoded "fallback-secret" string —
// meaning that if JWT_SECRET was ever missing in production, anyone who read
// the source could forge an admin session cookie. Now: production without a
// real secret refuses to boot (fail closed); development warns loudly but
// keeps working. Evaluated once at module load — zero per-request cost.

const raw = process.env.JWT_SECRET;

if (!raw) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET environment variable must be set in production — refusing to start with a forgeable session secret."
    );
  }
  console.warn(
    "[auth] JWT_SECRET is not set — using an insecure development-only fallback. Set JWT_SECRET in .env."
  );
}

export const jwtSecret = new TextEncoder().encode(
  raw || "dev-only-insecure-secret"
);
