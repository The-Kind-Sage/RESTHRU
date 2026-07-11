"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * Shift.staffId points at the HR roster (Staff), not the logged-in dashboard
 * User — there's no login for Staff records today. Opening a shift means
 * picking who's actually working the register from the roster, similar to a
 * PIN clock-in on a real POS. The dashboard User that performed the action is
 * still the one authenticated by session/getSession() for authorization.
 */

export async function getShiftableStaff() {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const staff = await prisma.staff.findMany({
      where: { restaurantId: session.restaurantId, isActive: true },
      orderBy: { firstName: "asc" },
      select: { id: true, firstName: true, lastName: true, role: true },
    });
    return { data: staff };
  } catch (err: any) {
    return { error: err?.message || "Failed to load staff" };
  }
}

export async function getActiveShifts() {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const shifts = await prisma.shift.findMany({
      where: { restaurantId: session.restaurantId, status: "OPEN" },
      include: { staff: { select: { firstName: true, lastName: true, role: true } } },
      orderBy: { openedAt: "desc" },
    });
    return { data: shifts };
  } catch (err: any) {
    return { error: err?.message || "Failed to load active shifts" };
  }
}

export async function openShift(data: { staffId: string; openingFloat: number; notes?: string }) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };
  if (data.openingFloat < 0) return { error: "Opening float cannot be negative" };

  try {
    const staff = await prisma.staff.findFirst({
      where: { id: data.staffId, restaurantId: session.restaurantId },
    });
    if (!staff) return { error: "Staff member not found" };

    const existing = await prisma.shift.findFirst({
      where: { staffId: data.staffId, status: "OPEN" },
    });
    if (existing) return { error: `${staff.firstName} already has an open shift` };

    const shift = await prisma.shift.create({
      data: {
        restaurantId: session.restaurantId,
        staffId: data.staffId,
        openingFloat: data.openingFloat,
        notes: data.notes || null,
        status: "OPEN",
      },
      include: { staff: { select: { firstName: true, lastName: true, role: true } } },
    });

    await prisma.activityLog.create({
      data: {
        restaurantId: session.restaurantId,
        userId: session.id,
        actionType: "SHIFT_OPEN",
        entityType: "Shift",
        entityId: shift.id,
        description: `Shift opened for ${staff.firstName} ${staff.lastName} with float ${data.openingFloat}`,
      },
    });

    return { data: shift };
  } catch (err: any) {
    return { error: err?.message || "Failed to open shift" };
  }
}

/** Aggregates sales/payments recorded restaurant-wide during a shift's open window. */
export async function getShiftSummary(shiftId: string) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const shift = await prisma.shift.findFirst({
      where: { id: shiftId, restaurantId: session.restaurantId },
      include: { staff: { select: { firstName: true, lastName: true, role: true } } },
    });
    if (!shift) return { error: "Shift not found" };

    const windowEnd = shift.closedAt ?? new Date();
    const payments = await prisma.payment.findMany({
      where: {
        bill: { restaurantId: session.restaurantId },
        createdAt: { gte: shift.openedAt, lte: windowEnd },
      },
      include: { bill: { select: { billNumber: true, status: true, voidedAt: true } } },
    });

    const validPayments = payments.filter((p) => !p.bill.voidedAt);
    const byMethod: Record<string, number> = {};
    for (const p of validPayments) {
      byMethod[p.method] = (byMethod[p.method] || 0) + p.amount;
    }
    const grossSales = validPayments.reduce((s, p) => s + p.amount, 0);
    const cashTotal = byMethod["CASH"] || 0;

    const billCount = new Set(validPayments.map((p) => p.billId)).size;
    const voidedBillCount = await prisma.bill.count({
      where: {
        restaurantId: session.restaurantId,
        voidedAt: { gte: shift.openedAt, lte: windowEnd },
      },
    });

    const expectedCash = shift.openingFloat + cashTotal;

    return {
      data: {
        shift,
        grossSales,
        byMethod,
        cashTotal,
        billCount,
        voidedBillCount,
        avgTicket: billCount > 0 ? grossSales / billCount : 0,
        expectedCash,
      },
    };
  } catch (err: any) {
    return { error: err?.message || "Failed to build shift summary" };
  }
}

export async function closeShift(data: { shiftId: string; closingCashDeclared: number; notes?: string }) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };
  if (data.closingCashDeclared < 0) return { error: "Declared cash cannot be negative" };

  try {
    const shift = await prisma.shift.findFirst({
      where: { id: data.shiftId, restaurantId: session.restaurantId },
    });
    if (!shift) return { error: "Shift not found" };
    if (shift.status !== "OPEN") return { error: "Shift is already closed" };

    const summary = await getShiftSummary(data.shiftId);
    if ("error" in summary) return summary;
    const expectedCash = summary.data.expectedCash;
    const discrepancy = data.closingCashDeclared - expectedCash;

    const updated = await prisma.shift.update({
      where: { id: shift.id },
      data: {
        closingCashDeclared: data.closingCashDeclared,
        expectedCash,
        discrepancy,
        status: "CLOSED",
        closedAt: new Date(),
        notes: data.notes ?? shift.notes,
      },
      include: { staff: { select: { firstName: true, lastName: true, role: true } } },
    });

    await prisma.activityLog.create({
      data: {
        restaurantId: session.restaurantId,
        userId: session.id,
        actionType: "SHIFT_CLOSE",
        entityType: "Shift",
        entityId: shift.id,
        description: `Shift closed. Expected ${expectedCash.toFixed(2)}, declared ${data.closingCashDeclared.toFixed(2)}, discrepancy ${discrepancy.toFixed(2)}`,
      },
    });

    return { data: updated };
  } catch (err: any) {
    return { error: err?.message || "Failed to close shift" };
  }
}

export async function getShiftHistory(limit = 30) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const shifts = await prisma.shift.findMany({
      where: { restaurantId: session.restaurantId, status: "CLOSED" },
      include: { staff: { select: { firstName: true, lastName: true, role: true } } },
      orderBy: { closedAt: "desc" },
      take: limit,
    });
    return { data: shifts };
  } catch (err: any) {
    return { error: err?.message || "Failed to load shift history" };
  }
}
