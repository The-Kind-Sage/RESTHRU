"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import QRCode from "qrcode";

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
    const payload = JSON.stringify({
      merchant: bill.restaurant.name,
      method: data.method,
      amount: data.amount,
      bill: bill.billNumber,
      ref,
    });

    const qrDataUrl = await QRCode.toDataURL(payload, {
      width: 300,
      margin: 2,
      color: { dark: "#000", light: "#fff" },
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
