import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";

// Payment gateways must sign each webhook with HMAC-SHA256 over the raw request
// body using the shared PAYMENT_WEBHOOK_SECRET, sent as a hex digest in the
// x-webhook-signature header (a leading "sha256=" is tolerated). Without this,
// anyone able to POST to this URL could mark arbitrary payments as verified.
const SIGNATURE_HEADER = "x-webhook-signature";

function verifySignature(rawBody: string, provided: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const providedHex = provided.startsWith("sha256=") ? provided.slice(7) : provided;
  const a = Buffer.from(providedHex, "utf8");
  const b = Buffer.from(expected, "utf8");
  // timingSafeEqual throws on length mismatch, so length-check first.
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

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
    const secret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (!secret) {
      // Fail closed: a payment-verification endpoint must never accept unsigned
      // calls, so if the secret isn't configured we cannot authenticate anyone.
      console.error("PAYMENT_WEBHOOK_SECRET is not set; rejecting payment webhook.");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
    }

    // HMAC is computed over the exact bytes received, so read the raw text
    // before parsing — JSON.parse + re-stringify would change the bytes.
    const rawBody = await request.text();
    const provided = request.headers.get(SIGNATURE_HEADER) || "";
    if (!provided || !verifySignature(rawBody, provided, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
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
