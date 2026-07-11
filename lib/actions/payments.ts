"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import QRCode from "qrcode";

/** Shared QR-code payload builder used by both the authenticated checkout flow and the public QR-ordering page. */
async function buildPaymentQRDataUrl(payload: {
  merchant: string;
  method: string;
  amount: number;
  bill: string;
  ref: string;
}) {
  return QRCode.toDataURL(JSON.stringify(payload), {
    width: 300,
    margin: 2,
    color: { dark: "#000", light: "#fff" },
  });
}

export async function generatePaymentQR(data: {
  billId: string;
  method: string;
  amount: number;
}) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const bill = await prisma.bill.findFirst({
      where: { id: data.billId, restaurantId: session.restaurantId },
      include: { restaurant: { select: { name: true } } },
    });
    if (!bill) return { error: "Bill not found" };

    const ref = `PAY-${bill.billNumber}-${Date.now()}`;
    const qrDataUrl = await buildPaymentQRDataUrl({
      merchant: bill.restaurant.name,
      method: data.method,
      amount: data.amount,
      bill: bill.billNumber,
      ref,
    });

    return { data: { qrDataUrl, ref } };
  } catch (err: any) {
    return { error: err?.message || "Failed to generate payment QR" };
  }
}

/**
 * Public (unauthenticated) counterpart of `generatePaymentQR`, for the customer QR
 * table-ordering page's "Request Bill" dialog. There's no `Bill` row yet at that
 * point (a Bill is only created when reception settles at `/reception/checkout`), so
 * this validates restaurantId/tableId directly instead of a billId, and encodes the
 * table's current order total rather than a bill number. Reuses the same
 * `buildPaymentQRDataUrl` QR-generation helper as the real, staff-side flow.
 */
export async function generatePublicPaymentQR(data: {
  restaurantId: string;
  tableId: string;
  method: string;
  amount: number;
}) {
  try {
    if (!data.restaurantId || !data.tableId) return { error: "Missing restaurant or table" };
    if (!["ESEWA", "KHALTI", "FONEPAY"].includes(data.method)) {
      return { error: "Unsupported payment method for QR" };
    }
    if (!(data.amount > 0)) return { error: "Invalid amount" };

    const restaurant = await prisma.restaurant.findFirst({
      where: { id: data.restaurantId, isActive: true },
      select: { name: true },
    });
    if (!restaurant) return { error: "Restaurant not found" };

    const table = await prisma.restaurantTable.findFirst({
      where: { id: data.tableId, restaurantId: data.restaurantId },
      select: { tableNumber: true },
    });
    if (!table) return { error: "Table not found for this restaurant" };

    const ref = `TBL-${table.tableNumber}-${Date.now()}`;
    const qrDataUrl = await buildPaymentQRDataUrl({
      merchant: restaurant.name,
      method: data.method,
      amount: data.amount,
      bill: `Table ${table.tableNumber}`,
      ref,
    });

    return { data: { qrDataUrl, ref } };
  } catch (err: any) {
    return { error: err?.message || "Failed to generate payment QR" };
  }
}

export async function verifyPayment(paymentId: string) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId },
      include: { bill: { select: { restaurantId: true } } },
    });
    if (!payment || payment.bill.restaurantId !== session.restaurantId) {
      return { error: "Payment not found" };
    }
    if (payment.verified) return { data: payment };

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: { verified: true, verifiedAt: new Date() },
    });

    await prisma.activityLog.create({
      data: {
        restaurantId: session.restaurantId,
        userId: session.id,
        actionType: "PAYMENT_VERIFIED",
        entityType: "Payment",
        entityId: paymentId,
        description: `Payment ${paymentId} (${payment.method}, ${payment.amount}) manually verified by ${session.username}`,
      },
    });

    return { data: updated };
  } catch (err: any) {
    return { error: err?.message || "Failed to verify payment" };
  }
}

export async function getPendingWalletPayments(billId: string) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const payments = await prisma.payment.findMany({
      where: {
        billId,
        method: { in: ["ESEWA", "KHALTI", "FONEPAY"] },
        verified: false,
      },
      orderBy: { createdAt: "desc" },
    });
    return { data: payments };
  } catch (err: any) {
    return { error: err?.message || "Failed to fetch pending wallet payments" };
  }
}
