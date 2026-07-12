import prisma from "@/lib/prisma";
import {
  type ResourceKey,
  type PlanType,
  type LimitReached,
  PLAN_LIMITS,
  RESOURCE_META,
  normalizePlanType,
  limitFor,
  suggestUpgrade,
} from "@/lib/plan-limits";

// Server-side plan enforcement. NOT a "use server" action file — these are
// plain helpers imported BY the create actions, so they run inside the same
// request with no extra round-trip.

/**
 * Resolve a restaurant's current plan type from its active subscription.
 * A restaurant with no active subscription is treated as FREE — the safe,
 * most-restrictive default. One indexed query; only runs on create attempts
 * (never on reads), so it adds nothing to hot paths.
 */
export async function getPlanType(restaurantId: string): Promise<PlanType> {
  const sub = await prisma.subscription.findFirst({
    where: { restaurantId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { plan: { select: { type: true } } },
  });
  return normalizePlanType(sub?.plan?.type);
}

async function countResource(restaurantId: string, resource: ResourceKey): Promise<number> {
  switch (resource) {
    case "tables":
      return prisma.restaurantTable.count({ where: { restaurantId } });
    case "staff":
      return prisma.staff.count({ where: { restaurantId } });
    case "menuItems":
      return prisma.menuItem.count({ where: { restaurantId } });
  }
}

/**
 * Returns a LimitReached payload if creating one more `resource` would exceed
 * the restaurant's plan cap, or null if there's room. Callers should block the
 * create and return `{ error, limitReached }` when this is non-null.
 */
export async function checkResourceLimit(
  restaurantId: string,
  resource: ResourceKey
): Promise<LimitReached | null> {
  const planType = await getPlanType(restaurantId);
  const cap = limitFor(planType, resource);

  // Unlimited tier (Infinity) — nothing to enforce, and we must never build a
  // payload with a non-finite number in it.
  if (!Number.isFinite(cap)) return null;

  const current = await countResource(restaurantId, resource);
  if (current < cap) return null;

  const suggestedPlan = suggestUpgrade(planType, resource);
  const suggestedCap = limitFor(suggestedPlan, resource);

  return {
    resource,
    current,
    limit: cap,
    currentPlan: planType,
    currentPlanLabel: PLAN_LIMITS[planType].label,
    suggestedPlan,
    suggestedPlanLabel: PLAN_LIMITS[suggestedPlan].label,
    suggestedLimit: Number.isFinite(suggestedCap) ? suggestedCap : null,
  };
}

/** Human-readable rejection message, e.g. for a toast fallback / logs. */
export function limitMessage(info: LimitReached): string {
  const meta = RESOURCE_META[info.resource];
  return `Your ${info.currentPlanLabel} plan allows up to ${info.limit} ${meta.nounPlural}. Upgrade to ${info.suggestedPlanLabel} to add more.`;
}
