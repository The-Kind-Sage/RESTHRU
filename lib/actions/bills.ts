"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "./logs";
import { verifyManagerApproval } from "@/lib/manager-approval";
import { splitVatInclusive, NEPAL_VAT_RATE } from "@/lib/vat";
import { fiscalYearBs } from "@/lib/nepali-date";

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
    // All four lookups are independent — one round-trip instead of four.
    const [order, existing, lastBill, restaurant] = await Promise.all([
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
      prisma.restaurant.findUnique({
        where: { id: session.restaurantId },
        select: { vatRegistered: true, taxPercentage: true },
      }),
    ]);
    if (!order) return { error: "Order not found" };
    if (existing) return { data: existing };
    const lastNum = parseInt(lastBill?.billNumber?.replace(/\D/g, "") ?? "", 10);
    const nextNum = isNaN(lastNum) ? 1 : lastNum + 1;

    // Menu-inclusive total (courts bar adding VAT on top). For a VAT-registered
    // restaurant the 13% VAT component is back-calculated from this gross for the
    // tax invoice; otherwise the whole amount is the taxable base (VAT = 0).
    const total = order.subtotal + order.serviceCharge - order.discountAmount;
    const { taxable, vat } = restaurant?.vatRegistered
      ? splitVatInclusive(total, restaurant.taxPercentage || NEPAL_VAT_RATE)
      : { taxable: total, vat: 0 };

    const bill = await prisma.bill.create({
      data: {
        restaurantId: session.restaurantId,
        orderId: order.id,
        billNumber: `B-${nextNum.toString().padStart(5, "0")}`,
        subtotal: order.subtotal,
        taxableAmount: taxable,
        taxAmount: vat,
        serviceCharge: order.serviceCharge,
        totalAmount: total,
        amountPaid: 0,
        change: 0,
        status: "PENDING",
        fiscalYear: fiscalYearBs(new Date()),
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
      // An issued (fully-paid) invoice is hard-locked — no further payments; a
      // reversal must go through a credit note.
      if (bill.status === "PAID" || bill.isLocked) {
        return { error: "This invoice is already settled and locked. Issue a credit note to reverse it." };
      }

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
      const fullyPaid = totalPayments >= bill.totalAmount;

      const updated = await tx.bill.update({
        where: { id: bill.id },
        data: {
          amountPaid: totalPayments,
          paymentMethod: paymentMethod === "SPLIT" ? "SPLIT" : paymentMethod,
          change,
          status: fullyPaid ? "PAID" : "PENDING",
          settledAt: fullyPaid ? new Date() : undefined,
          // Lock the invoice the moment it is fully settled / issued.
          isLocked: fullyPaid ? true : undefined,
          fiscalYear: fullyPaid && !bill.fiscalYear ? fiscalYearBs(new Date()) : undefined,
        },
        include: { payments: true, order: { include: { items: true } } },
      });
      if (fullyPaid) {
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

      // A distinct "completed" entry lands in the owner's logs the moment a bill
      // is settled in full, alongside the per-payment records.
      if (fullyPaid) {
        await logActivity(session, {
          actionType: "BILL_COMPLETED",
          entityType: "Bill",
          entityId: bill.id,
          description: `Bill ${bill.billNumber} completed — total ${bill.totalAmount} paid in full via ${paymentMethod}`,
        });
      }

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
    // Menu-inclusive total minus discount; re-derive the VAT split from the new
    // gross for VAT bills (a non-zero taxAmount marks the bill as VAT-registered).
    const newTotal = bill.subtotal + bill.serviceCharge - clamped;
    const isVat = bill.taxAmount > 0;
    const { taxable, vat } = isVat
      ? splitVatInclusive(newTotal, NEPAL_VAT_RATE)
      : { taxable: newTotal, vat: 0 };

    const updated = await prisma.bill.update({
      where: { id: billId },
      data: {
        discountAmount: clamped,
        totalAmount: newTotal,
        taxableAmount: taxable,
        taxAmount: vat,
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
    // Menu-inclusive total minus coupon; re-derive the VAT split for VAT bills.
    const newTotal = bill.subtotal + bill.serviceCharge - clampedDiscount;
    const isVat = bill.taxAmount > 0;
    const { taxable, vat } = isVat
      ? splitVatInclusive(newTotal, NEPAL_VAT_RATE)
      : { taxable: newTotal, vat: 0 };

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
          taxableAmount: taxable,
          taxAmount: vat,
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

/** Roles allowed to void a bill on their own authority, without a separate
 *  manager/owner signing off. Reception is included so a receptionist can void
 *  directly — every void is still written to the activity log for the owner. */
const SELF_VOID_ROLES = ["RECEPTIONIST", "MANAGER", "RESTAURANT_OWNER", "ADMIN", "SUPER_ADMIN"];

/**
 * Voids a bill and records it to the activity log so the owner can always see
 * who voided what and why.
 *
 * Reception (and managers/owners) may void directly — no separate approval is
 * required. Callers that still want a supervisor to sign off can pass
 * `approverUsername`/`approverPassword`; when supplied those credentials are
 * verified and the approver is recorded as the authorizer. Either way a
 * `BILL_VOID` entry is logged against the acting user.
 */
export async function voidBill(data: {
  billId: string;
  reason: string;
  approverUsername?: string;
  approverPassword?: string;
}) {
  const session = await getSession();
  if (!session?.restaurantId || !session?.id) return { error: "Not authenticated" };
  if (!data.reason?.trim()) return { error: "A void reason is required" };

  const wantsApproval = !!(data.approverUsername?.trim() && data.approverPassword);

  try {
    // Decide who is authorizing this void before touching the bill.
    let voidedById = session.id;
    let approvalNote = "self-authorized";

    if (wantsApproval) {
      const approval = await verifyManagerApproval(
        session.restaurantId,
        data.approverUsername!.trim(),
        data.approverPassword!
      );
      if (!approval.ok) return { error: approval.error };
      voidedById = approval.approverId;
      approvalNote = `approved by ${approval.approverName}`;
    } else if (!SELF_VOID_ROLES.includes(session.role)) {
      return { error: "You are not allowed to void a bill. Ask a manager or owner to approve." };
    }

    const bill = await prisma.bill.findFirst({
      where: { id: data.billId, restaurantId: session.restaurantId },
    });
    if (!bill) return { error: "Bill not found" };
    if (bill.voidedAt) return { error: "Bill is already voided" };
    // An issued (fully-paid) invoice is hard-locked and cannot be voided — Nepal
    // VAT rules require reversing it with a credit note instead (gov.md §6).
    // Only un-issued drafts (PENDING/HELD) can still be voided/cancelled.
    if (bill.status === "PAID" || bill.isLocked) {
      return { error: "This invoice is issued and locked. Reverse it by issuing a credit note instead of voiding." };
    }

    const updated = await prisma.bill.update({
      where: { id: bill.id },
      data: {
        status: "VOID",
        voidedBy: voidedById,
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
        description: `Bill ${bill.billNumber} (total ${bill.totalAmount}) voided by ${session.username} (${approvalNote}): ${data.reason.trim()}`,
      },
    });

    return { data: updated };
  } catch (err: any) {
    return { error: err?.message || "Failed to void bill" };
  }
}
