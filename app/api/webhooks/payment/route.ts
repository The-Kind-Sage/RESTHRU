import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * POST /api/webhooks/payment
 *
 * Called by payment gateways (eSewa, Khalti, Fonepay) to confirm a transaction.
 * Expects JSON body:
 *   { ref: string, transactionId: string, method: string, amount: number, status: "SUCCESS" | "FAILED" }
 *
 * The `ref` field must match the `reference` column on a pending Payment row.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ref, transactionId, method, amount, status } = body;

    if (!ref || !transactionId || !method || !amount || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const payment = await prisma.payment.findFirst({
      where: { reference: ref },
      include: { bill: { select: { restaurantId: true } } },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found for ref" }, { status: 404 });
    }

    if (payment.verified) {
      return NextResponse.json({ message: "Already verified" }, { status: 200 });
    }

    if (status !== "SUCCESS") {
      return NextResponse.json({ message: "Transaction not successful" }, { status: 200 });
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { verified: true, verifiedAt: new Date() },
    });

    await prisma.activityLog.create({
      data: {
        restaurantId: payment.bill.restaurantId,
        userId: "webhook",
        actionType: "PAYMENT_VERIFIED",
        entityType: "Payment",
        entityId: payment.id,
        description: `Payment ${payment.id} auto-verified via webhook (${method}, txn: ${transactionId})`,
      },
    });

    return NextResponse.json({ message: "Verified", paymentId: payment.id });
  } catch (err: any) {
    console.error("Payment webhook error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
