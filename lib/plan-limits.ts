// ─────────────────────────────────────────────────────────────────────────
// Single source of truth for what each pack (plan) allows.
//
// This file is deliberately dependency-free (no prisma, no server-only APIs)
// so it can be imported from both server actions and client components. The
// numbers here MUST match the `plans` rows in the database — the DB is seeded
// from these same values, and lib/plan-guard.ts resolves a restaurant's plan
// *type* from its subscription and then looks its limits up here, so there is
// exactly one place to change a cap.
// ─────────────────────────────────────────────────────────────────────────

export type PlanType = "FREE" | "BASIC" | "PRO" | "ENTERPRISE";

// The countable resources a plan caps. Each maps to a `max*` field below.
export type ResourceKey = "tables" | "staff" | "menuItems";

// Boolean capabilities a plan unlocks. Numeric caps handle "how many"; these
// handle "can they at all". Gate a feature with hasFeature(planType, flag).
export type FeatureFlag =
  | "THERMAL_PRINTER" // print KOT / bills to a thermal printer
  | "ORDER_TRACKING" // live order status board
  | "STAFF_MANAGEMENT" // staff roster + roles
  | "VAT_BILLING" // IRD-compliant VAT invoices
  | "REALTIME_ANALYTICS" // live analytics dashboard
  | "MULTI_BRANCH" // more than one restaurant under one owner
  | "MULTIPLE_PAYMENTS" // eSewa / Khalti / Fonepay split payments
  | "API_ACCESS"; // programmatic API access

export interface PlanLimits {
  label: string;
  /** Sort order, low → high. Used to find the "next tier up" for upgrades. */
  rank: number;
  maxTables: number;
  maxStaff: number;
  maxMenuItems: number;
  maxRestaurants: number;
  features: FeatureFlag[];
}

// Sentinel meaning "no cap". Infinity never survives JSON, so it must never be
// sent to the client — the guard only ever builds an upgrade payload for a
// FINITE cap that was actually reached, so an unlimited tier can't trigger one.
export const UNLIMITED = Infinity;

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  FREE: {
    label: "Free",
    rank: 0,
    maxTables: 5,
    maxStaff: 10,
    maxMenuItems: 10,
    maxRestaurants: 1,
    features: [],
  },
  BASIC: {
    label: "Basic",
    rank: 1,
    maxTables: 20,
    maxStaff: 10,
    maxMenuItems: 50,
    maxRestaurants: 1,
    features: ["THERMAL_PRINTER", "ORDER_TRACKING", "STAFF_MANAGEMENT"],
  },
  PRO: {
    label: "Pro",
    rank: 2,
    maxTables: 50,
    maxStaff: 50,
    maxMenuItems: 200,
    maxRestaurants: 3,
    features: [
      "THERMAL_PRINTER",
      "ORDER_TRACKING",
      "STAFF_MANAGEMENT",
      "VAT_BILLING",
      "REALTIME_ANALYTICS",
      "MULTI_BRANCH",
      "MULTIPLE_PAYMENTS",
      "API_ACCESS",
    ],
  },
  ENTERPRISE: {
    label: "Enterprise",
    rank: 3,
    maxTables: UNLIMITED,
    maxStaff: UNLIMITED,
    maxMenuItems: UNLIMITED,
    maxRestaurants: UNLIMITED,
    features: [
      "THERMAL_PRINTER",
      "ORDER_TRACKING",
      "STAFF_MANAGEMENT",
      "VAT_BILLING",
      "REALTIME_ANALYTICS",
      "MULTI_BRANCH",
      "MULTIPLE_PAYMENTS",
      "API_ACCESS",
    ],
  },
};

// Plans ordered low → high tier.
export const PLAN_ORDER: PlanType[] = ["FREE", "BASIC", "PRO", "ENTERPRISE"];

// Maps a resource key to the plan field that caps it and a human noun/verb the
// upgrade popup uses to build its message.
export const RESOURCE_META: Record<
  ResourceKey,
  { limitField: keyof Pick<PlanLimits, "maxTables" | "maxStaff" | "maxMenuItems">; noun: string; nounPlural: string }
> = {
  tables: { limitField: "maxTables", noun: "table", nounPlural: "tables" },
  staff: { limitField: "maxStaff", noun: "staff member", nounPlural: "staff members" },
  menuItems: { limitField: "maxMenuItems", noun: "menu item", nounPlural: "menu items" },
};

/** Coerce an arbitrary plan string (DB `plan.type`, could be null) to a known type. */
export function normalizePlanType(raw: string | null | undefined): PlanType {
  const upper = (raw || "").toUpperCase();
  return (PLAN_ORDER as string[]).includes(upper) ? (upper as PlanType) : "FREE";
}

/** Does this plan include a given boolean capability? */
export function hasFeature(planType: PlanType, flag: FeatureFlag): boolean {
  return PLAN_LIMITS[planType].features.includes(flag);
}

/** The cap this plan places on a resource (may be UNLIMITED / Infinity). */
export function limitFor(planType: PlanType, resource: ResourceKey): number {
  return PLAN_LIMITS[planType][RESOURCE_META[resource].limitField];
}

/**
 * The lowest tier ABOVE `current` whose cap for `resource` is strictly higher
 * (or unlimited). Falls back to the highest plan if none is strictly higher.
 */
export function suggestUpgrade(current: PlanType, resource: ResourceKey): PlanType {
  const currentCap = limitFor(current, resource);
  const currentRank = PLAN_LIMITS[current].rank;
  const higher = PLAN_ORDER.filter((p) => PLAN_LIMITS[p].rank > currentRank).sort(
    (a, b) => PLAN_LIMITS[a].rank - PLAN_LIMITS[b].rank
  );
  for (const p of higher) {
    if (limitFor(p, resource) > currentCap) return p;
  }
  return PLAN_ORDER[PLAN_ORDER.length - 1];
}

// Payload returned by the server when a create is blocked by a plan cap, and
// consumed by the upgrade popup on the client. Only finite numbers here.
export interface LimitReached {
  resource: ResourceKey;
  current: number; // how many they already have (== the cap they hit)
  limit: number; // the cap on their current plan
  currentPlan: PlanType;
  currentPlanLabel: string;
  suggestedPlan: PlanType;
  suggestedPlanLabel: string;
  suggestedLimit: number | null; // the higher cap, or null if unlimited
}
