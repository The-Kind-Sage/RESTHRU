import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

/** Roles allowed to authorize a void / comp / manager-gated action. */
const APPROVER_ROLES = ["RESTAURANT_OWNER", "ADMIN", "SUPER_ADMIN", "MANAGER"];

/**
 * Verifies a manager's or owner's username/password and confirms they may
 * approve an action for this restaurant. Used to gate voids and other actions a
 * regular cashier/waiter shouldn't be able to do unsupervised.
 *
 * The approver must belong to THIS restaurant, but ownership can be expressed
 * two ways: most staff (managers included) carry the restaurant on their
 * `User.restaurantId`, whereas an owner is often linked only through
 * `Restaurant.ownerId` with their own `User.restaurantId` left null (same reason
 * getRestaurantFromSession falls back to ownerId). We therefore resolve the
 * account first, then accept it if it's either linked to the restaurant or is
 * the restaurant's owner — so an owner can always authorize with their own
 * credentials, not just a manager.
 */
export async function verifyManagerApproval(
  restaurantId: string,
  username: string,
  password: string
): Promise<{ ok: true; approverId: string; approverName: string } | { ok: false; error: string }> {
  if (!username || !password) {
    return { ok: false, error: "Manager or owner username and password are required" };
  }

  // username and email are both globally unique, so this resolves at most one
  // account. Not scoped to the restaurant here — membership is checked below so
  // an owner whose User.restaurantId is null still matches.
  const approver = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email: username }],
      isActive: true,
    },
  });

  if (!approver || !approver.passwordHash) {
    return { ok: false, error: "Manager or owner not found" };
  }

  if (!APPROVER_ROLES.includes(approver.role)) {
    return { ok: false, error: "This user is not authorized to approve this action" };
  }

  // Must belong to THIS restaurant: linked via restaurantId, or its owner.
  let belongsToRestaurant = approver.restaurantId === restaurantId;
  if (!belongsToRestaurant) {
    const owned = await prisma.restaurant.findFirst({
      where: { id: restaurantId, ownerId: approver.id },
      select: { id: true },
    });
    belongsToRestaurant = !!owned;
  }
  if (!belongsToRestaurant) {
    return { ok: false, error: "This user is not authorized to approve for this restaurant" };
  }

  const valid = await bcrypt.compare(password, approver.passwordHash);
  if (!valid) {
    return { ok: false, error: "Incorrect password" };
  }

  return { ok: true, approverId: approver.id, approverName: `${approver.firstName} ${approver.lastName}`.trim() };
}

export function isApproverRole(role: string) {
  return APPROVER_ROLES.includes(role);
}
