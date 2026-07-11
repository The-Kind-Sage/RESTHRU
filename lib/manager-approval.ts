import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

/** Roles allowed to authorize a void / comp / manager-gated action. */
const APPROVER_ROLES = ["OWNER", "ADMIN", "MANAGER"];

/**
 * Verifies a manager's username/password against the restaurant's own user
 * base and confirms they hold an approver role. Used to gate voids and other
 * actions a regular cashier/waiter shouldn't be able to do unsupervised.
 */
export async function verifyManagerApproval(
  restaurantId: string,
  username: string,
  password: string
): Promise<{ ok: true; approverId: string; approverName: string } | { ok: false; error: string }> {
  if (!username || !password) {
    return { ok: false, error: "Manager username and password are required" };
  }

  const manager = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email: username }],
      restaurantId,
      isActive: true,
    },
  });

  if (!manager || !manager.passwordHash) {
    return { ok: false, error: "Manager not found" };
  }

  if (!APPROVER_ROLES.includes(manager.role)) {
    return { ok: false, error: "This user is not authorized to approve this action" };
  }

  const valid = await bcrypt.compare(password, manager.passwordHash);
  if (!valid) {
    return { ok: false, error: "Incorrect manager password" };
  }

  return { ok: true, approverId: manager.id, approverName: `${manager.firstName} ${manager.lastName}`.trim() };
}

export function isApproverRole(role: string) {
  return APPROVER_ROLES.includes(role);
}
