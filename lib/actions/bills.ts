"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "./logs";
import { verifyManagerApproval } from "@/lib/manager-approval";

export async function getPendingBills() {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const bills = await prisma.bill.findMany({
      where: {
        restaurantId: session.restaurantId,
        status: { in: ["PENDING", "HELD"] },
      },
      include: {
        order: { include: { items: true, table: { select: { tableNumber: true } } } },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return { data: bills };
  } catch (err: any) {
    return { error: err?.message || "Failed to fetch pending bills" };
  }
}

export async function getBill(billId: string) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const bill = await prisma.bill.findFirst({
      where: { id: billId, restaurantId: session.restaurantId },
      include: {
        order: { include: { items: true, table: { select: { tableNumber: true } } } },
        payments: true,
      },
    });
    if (!bill) return { error: "Bill not found" };
    return { data: bill };
  } catch (err: any) {
    return { error: err?.message || "Failed to fetch bill" };
  }
}

export async function createBillDraft(orderId: string) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    // All three lookups are independent — one round-trip instead of three.
    const [order, existing, lastBill] = await Promise.all([
      prisma.order.findFirst({
        where: { id: orderId, restaurantId: session.restaurantId },
      }),
      prisma.bill.findFirst({
        where: { orderId, status: { in: ["PENDING", "HELD"] } },
      }),
      prisma.bill.findFirst({
        where: { restaurantId: session.restaurantId },
        orderBy: { createdAt: "desc" },
        select: { billNumber: true },
      }),
    ]);
    if (!order) return { error: "Order not found" };
    if (existing) return { data: existing };
    const lastNum = parseInt(lastBill?.billNumber?.replace(/\D/g, "") ?? "", 10);
    const nextNum = isNaN(lastNum) ? 1 : lastNum + 1;

    const bill = await prisma.bill.create({
      data: {
        restaurantId: session.restaurantId,
        orderId: order.id,
        billNumber: `B-${nextNum.toString().padStart(5, "0")}`,
        subtotal: order.subtotal,
        // No VAT — recompute the total from menu prices instead of copying the
        // order's stored total, so even older orders with tax baked in bill clean.
        taxAmount: 0,
        serviceCharge: order.serviceCharge,
        totalAmount: order.subtotal + order.serviceCharge - order.discountAmount,
        amountPaid: 0,
        change: 0,
        status: "PENDING",
        createdBy: session.id,
      },
      include: {
        order: { include: { items: true, table: { select: { tableNumber: true } } } },
        payments: true,
      },
    });

    await logActivity(session, {
      actionType: "BILL_DRAFT",
      entityType: "Bill",
      entityId: bill.id,
      description: `Bill draft created for order ${orderId}`,
    });

    return { data: bill };
  } catch (err: any) {
    return { error: err?.message || "Failed to create bill draft" };
  }
}

export async function recordPayment(data: {
  billId: string;
  method: string;
  amount: number;
  reference?: string;
}) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    return await prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findUnique({
        where: { id: data.billId },
        include: { payments: true },
      });
      if (!bill) return { error: "Bill not found" };

      await tx.payment.create({
        data: {
          billId: bill.id,
          method: data.method,
          amount: data.amount,
          reference: data.reference || null,
        },
      });

      const totalPayments = bill.payments.reduce((s, p) => s + p.amount, 0) + data.amount;
      const allMethods = bill.payments.map((p) => p.method).concat(data.method);
      const distinctMethods = Array.from(new Set(allMethods));
      const paymentMethod = distinctMethods.length > 1 ? "SPLIT" : distinctMethods[0];
      const change = Math.max(0, totalPayments - bill.totalAmount);

      const updated = await tx.bill.update({
        where: { id: bill.id },
        data: {
          amountPaid: totalPayments,
          paymentMethod: paymentMethod === "SPLIT" ? "SPLIT" : paymentMethod,
          change,
          status: totalPayments >= bill.totalAmount ? "PAID" : "PENDING",
          settledAt: totalPayments >= bill.totalAmount ? new Date() : undefined,
        },
        include: { payments: true, order: { include: { items: true } } },
      });

      if (totalPayments >= bill.totalAmount) {
        await tx.order.update({
          where: { id: bill.orderId },
          data: {
            status: "SERVED",
            completedAt: new Date(),
          },
        });
      }

      await logActivity(session, {
        actionType: "PAYMENT_RECORD",
        entityType: "Payment",
        entityId: data.billId,
        description: `Payment of ${data.amount} recorded via ${data.method}`,
      });

      return { data: updated };
    });
  } catch (err: any) {
    return { error: err?.message || "Failed to record payment" };
  }
}

export async function holdBill(billId: string) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const bill = await prisma.bill.findFirst({
      where: { id: billId, restaurantId: session.restaurantId },
    });
    if (!bill) return { error: "Bill not found" };

    const updated = await prisma.bill.update({
      where: { id: billId },
      data: { status: "HELD" },
    });

    await logActivity(session, {
      actionType: "BILL_HOLD",
      entityType: "Bill",
      entityId: billId,
      description: `Bill put on hold`,
    });

    return { data: updated };
  } catch (err: any) {
    return { error: err?.message || "Failed to hold bill" };
  }
}

export async function resumeHeldBill(billId: string) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const bill = await prisma.bill.findFirst({
      where: { id: billId, restaurantId: session.restaurantId },
    });
    if (!bill) return { error: "Bill not found" };

    const updated = await prisma.bill.update({
      where: { id: billId },
      data: { status: "PENDING" },
      include: {
        order: { include: { items: true, table: { select: { tableNumber: true } } } },
        payments: true,
      },
    });

    await logActivity(session, {
      actionType: "BILL_RESUME",
      entityType: "Bill",
      entityId: billId,
      description: `Bill resumed from hold`,
    });

    return { data: updated };
  } catch (err: any) {
    return { error: err?.message || "Failed to resume bill" };
  }
}

export async function popCashDrawer(shiftId?: string) {
  const session = await getSession();
  if (!session?.restaurantId || !session?.id) return { error: "Not authenticated" };

  try {
    await prisma.activityLog.create({
      data: {
        restaurantId: session.restaurantId,
        userId: session.id,
        actionType: "CASH_DRAWER_POP",
        entityType: "Shift",
        entityId: shiftId || "manual",
        description: `Cash drawer popped by ${session.id}`,
      },
    });
    return { data: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to log cash drawer pop" };
  }
}

export async function splitBill(data: {
  billId: string;
  splits: Array<{ label: string; items?: string[] }>;
}) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };
  if (data.splits.length < 2) return { error: "Need at least 2 splits" };

  try {
    const bill = await prisma.bill.findFirst({
      where: { id: data.billId, restaurantId: session.restaurantId },
      include: { order: { include: { items: true } } },
    });
    if (!bill) return { error: "Bill not found" };

    const order = bill.order;
    const items = order.items;
    const totalItemsValue = items.reduce((s, i) => s + i.pricePerUnit * i.quantity, 0);
    const n = data.splits.length;
    const equalShare = Math.floor((bill.totalAmount * 100) / n) / 100;
    const remainder = Math.round((bill.totalAmount - equalShare * n) * 100) / 100;

    const splitBills = data.splits.map((split, idx) => ({
      label: split.label,
      amount: idx === 0 ? equalShare + remainder : equalShare,
    }));

    await logActivity(session, {
      actionType: "BILL_SPLIT",
      entityType: "Bill",
      entityId: data.billId,
      description: `Bill split into ${data.splits.length} parts`,
    });

    return { data: { splits: splitBills, total: bill.totalAmount } };
  } catch (err: any) {
    return { error: err?.message || "Failed to split bill" };
  }
}

export async function getTopMenuItems(limit = 10) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const items = await prisma.menuItem.findMany({
      where: { restaurantId: session.restaurantId, isAvailable: true },
      orderBy: { displayOrder: "asc" },
      take: limit,
    });
    return { data: items };
  } catch (err: any) {
    return { error: err?.message || "Failed to fetch menu items" };
  }
}

/** Searchable/filterable invoice history — bill number, table/customer, status, date range. */
export async function searchBills(filters: {
  query?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const where: any = { restaurantId: session.restaurantId };

    if (filters.status && filters.status !== "ALL") {
      where.status = filters.status;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.billDate = {};
      if (filters.dateFrom) where.billDate.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.billDate.lte = new Date(filters.dateTo + "T23:59:59.999Z");
    }
    if (filters.query) {
      where.OR = [
        { billNumber: { contains: filters.query, mode: "insensitive" } },
        { order: { orderId: { contains: filters.query, mode: "insensitive" } } },
        { order: { customerName: { contains: filters.query, mode: "insensitive" } } },
        { order: { customerPhone: { contains: filters.query, mode: "insensitive" } } },
      ];
    }

    const bills = await prisma.bill.findMany({
      where,
      include: {
        order: { include: { items: true, table: { select: { tableNumber: true } } } },
        payments: true,
      },
      orderBy: { billDate: "desc" },
      take: filters.limit ?? 100,
    });
    return { data: bills };
  } catch (err: any) {
    return { error: err?.message || "Failed to search bills" };
  }
}

export async function applyDiscountToBill(billId: string, discountAmount: number, discountReason?: string) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const bill = await prisma.bill.findFirst({
      where: { id: billId, restaurantId: session.restaurantId },
    });
    if (!bill) return { error: "Bill not found" };
    if (bill.status !== "PENDING") return { error: "Can only discount a pending bill" };

    const clamped = Math.min(Math.max(discountAmount, 0), bill.subtotal);
    // No VAT — totals are plain menu prices (+ service charge) minus discount.
    const newTotal = bill.subtotal + bill.serviceCharge - clamped;

    const updated = await prisma.bill.update({
      where: { id: billId },
      data: {
        discountAmount: clamped,
        totalAmount: newTotal,
        status: newTotal <= 0 ? "PAID" : "PENDING",
        ...(discountReason ? { notes: discountReason } : {}),
      },
    });

    await logActivity(session, {
      actionType: "DISCOUNT_APPLY",
      entityType: "Bill",
      entityId: billId,
      description: `Discount of ${discountAmount} applied${discountReason ? ` (${discountReason})` : ""}`,
    });

    return { data: updated };
  } catch (err: any) {
    return { error: err?.message || "Failed to apply discount" };
  }
}

export async function applyCouponToBill(billId: string, couponCode: string) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const coupon = await prisma.coupon.findUnique({
      where: { restaurantId_code: { restaurantId: session.restaurantId, code: couponCode.toUpperCase() } },
    });
    if (!coupon) return { error: "Coupon not found" };
    if (!coupon.isActive) return { error: "Coupon is inactive" };

    const now = new Date();
    if (now < coupon.validFrom) return { error: "Coupon not yet valid" };
    if (now > coupon.validUntil) return { error: "Coupon has expired" };
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { error: "Coupon usage limit reached" };
    }

    const bill = await prisma.bill.findFirst({
      where: { id: billId, restaurantId: session.restaurantId },
    });
    if (!bill) return { error: "Bill not found" };
    if (bill.status !== "PENDING") return { error: "Can only apply coupon to a pending bill" };

    const discountValue = coupon.discountType === "PERCENTAGE"
      ? bill.subtotal * (coupon.discountValue / 100)
      : coupon.discountValue;

    const clampedDiscount = Math.min(discountValue, bill.subtotal);
    // No VAT — totals are plain menu prices (+ service charge) minus discount.
    const newTotal = bill.subtotal + bill.serviceCharge - clampedDiscount;

    return await prisma.$transaction(async (tx) => {
      await tx.coupon.update({
        where: { id: coupon.id },
        data: { usageCount: { increment: 1 } },
      });

      const updated = await tx.bill.update({
        where: { id: billId },
        data: {
          discountAmount: clampedDiscount,
          totalAmount: newTotal,
          notes: `Coupon: ${coupon.code} (${clampedDiscount})`,
        },
      });

      await logActivity(session, {
        actionType: "COUPON_APPLY",
        entityType: "Bill",
        entityId: billId,
        description: `Coupon "${couponCode}" applied to bill`,
      });

      return { data: { bill: updated, coupon: coupon.code, discount: clampedDiscount } };
    });
  } catch (err: any) {
    return { error: err?.message || "Failed to apply coupon" };
  }
}

export async function applyCorporateAccountToBill(billId: string, accountId: string) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const account = await prisma.corporateAccount.findFirst({
      where: { id: accountId, restaurantId: session.restaurantId, isActive: true },
    });
    if (!account) return { error: "Corporate account not found or inactive" };

    const bill = await prisma.bill.findFirst({
      where: { id: billId, restaurantId: session.restaurantId },
    });
    if (!bill) return { error: "Bill not found" };

    const updated = await prisma.bill.update({
      where: { id: billId },
      data: {
        paymentMethod: "CORPORATE",
        notes: bill.notes
          ? `${bill.notes} | Corporate: ${account.companyName}`
          : `Corporate: ${account.companyName}`,
      },
    });

    await prisma.activityLog.create({
      data: {
        restaurantId: session.restaurantId,
        userId: session.id,
        actionType: "CORPORATE_BILL",
        entityType: "Bill",
        entityId: bill.id,
        description: `Bill ${bill.billNumber} assigned to corporate account ${account.companyName}`,
      },
    });

    return { data: updated };
  } catch (err: any) {
    return { error: err?.message || "Failed to apply corporate account" };
  }
}

/** Voids a settled bill. Requires a manager/owner/admin to authorize with their own credentials. */
export async function voidBill(data: {
  billId: string;
  reason: string;
  approverUsername: string;
  approverPassword: string;
}) {
  const session = await getSession();
  if (!session?.restaurantId || !session?.id) return { error: "Not authenticated" };
  if (!data.reason?.trim()) return { error: "A void reason is required" };

  try {
    // bcrypt verification is the slow part — overlap it with the bill fetch.
    // Approval errors keep precedence so failed logins read the same as before.
    const [approval, bill] = await Promise.all([
      verifyManagerApproval(session.restaurantId, data.approverUsername, data.approverPassword),
      prisma.bill.findFirst({
        where: { id: data.billId, restaurantId: session.restaurantId },
      }),
    ]);
    if (!approval.ok) return { error: approval.error };
    if (!bill) return { error: "Bill not found" };
    if (bill.voidedAt) return { error: "Bill is already voided" };

    const updated = await prisma.bill.update({
      where: { id: bill.id },
      data: {
        status: "VOID",
        voidedBy: approval.approverId,
        voidReason: data.reason.trim(),
        voidedAt: new Date(),
      },
    });

    await prisma.activityLog.create({
      data: {
        restaurantId: session.restaurantId,
        userId: session.id,
        actionType: "BILL_VOID",
        entityType: "Bill",
        entityId: bill.id,
        description: `Bill ${bill.billNumber} voided by ${session.username} (approved by ${approval.approverName}): ${data.reason.trim()}`,
      },
    });

    return { data: updated };
  } catch (err: any) {
    return { error: err?.message || "Failed to void bill" };
  }
}
