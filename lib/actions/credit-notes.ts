"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "./logs";
import { splitVatInclusive, roundMoney, NEPAL_VAT_RATE } from "@/lib/vat";
import { fiscalYearBs, toBsNumeric } from "@/lib/nepali-date";
import { amountInWords } from "@/lib/amount-in-words";

/**
 * Issues a credit note against an already-issued (locked) invoice — the compliant
 * way to reverse/refund a Nepali tax invoice, since the invoice itself can't be
 * edited or voided (gov.md §6). Numbered gap-free per BS fiscal year.
 */
export async function issueCreditNote(data: { billId: string; reason: string; amount?: number }) {
  const session = await getSession();
  if (!session?.restaurantId || !session?.id) return { error: "Not authenticated" };
  if (!data.reason?.trim()) return { error: "A reason is required for the credit note" };

  try {
    const bill = await prisma.bill.findFirst({
      where: { id: data.billId, restaurantId: session.restaurantId },
      include: { creditNotes: { select: { amount: true } } },
    });
    if (!bill) return { error: "Bill not found" };
    if (bill.status === "VOID") return { error: "This bill is voided; there is nothing to credit" };
    if (!(bill.status === "PAID" || bill.isLocked)) {
      return { error: "Only an issued (paid) invoice can be credited. Void an unpaid draft instead." };
    }

    const alreadyCredited = bill.creditNotes.reduce((s, c) => s + c.amount, 0);
    const remaining = roundMoney(bill.totalAmount - alreadyCredited);
    if (remaining <= 0) return { error: "This invoice is already fully credited" };

    const amount = data.amount != null
      ? roundMoney(Math.min(Math.max(data.amount, 0), remaining))
      : remaining;
    if (amount <= 0) return { error: "Credit amount must be greater than zero" };

    // Split the credited amount into taxable + VAT the same way the invoice was.
    const isVat = bill.taxAmount > 0;
    const { taxable, vat } = isVat
      ? splitVatInclusive(amount, NEPAL_VAT_RATE)
      : { taxable: amount, vat: 0 };

    const fy = fiscalYearBs(new Date());
    const fyCompact = fy.replace("/", "");
    const rid = session.restaurantId;

    // Retry on the (restaurantId, creditNoteNumber) unique constraint if two
    // credit notes are issued concurrently.
    let created;
    for (let attempt = 0; ; attempt++) {
      const last = await prisma.creditNote.findFirst({
        where: { restaurantId: rid, fiscalYear: fy },
        orderBy: { createdAt: "desc" },
        select: { creditNoteNumber: true },
      });
      const lastSeq = last ? parseInt(last.creditNoteNumber.replace(/^.*-/, ""), 10) : 0;
      const nextSeq = (isNaN(lastSeq) ? 0 : lastSeq) + 1 + attempt;
      const creditNoteNumber = `CN-${fyCompact}-${nextSeq.toString().padStart(5, "0")}`;

      try {
        created = await prisma.$transaction(async (tx) => {
          const cn = await tx.creditNote.create({
            data: {
              restaurantId: rid,
              billId: bill.id,
              creditNoteNumber,
              fiscalYear: fy,
              reason: data.reason.trim(),
              amount,
              taxableAmount: taxable,
              vatAmount: vat,
              createdBy: session.id!,
            },
          });
          await tx.bill.update({
            where: { id: bill.id },
            data: { creditNoteTotal: { increment: amount } },
          });
          return cn;
        });
        break;
      } catch (err: any) {
        if (err?.code === "P2002" && attempt < 5) continue;
        throw err;
      }
    }

    await logActivity(session, {
      actionType: "CREDIT_NOTE_ISSUE",
      entityType: "CreditNote",
      entityId: created.id,
      description: `Credit note ${created.creditNoteNumber} (${amount}) issued against invoice ${bill.billNumber} by ${session.username}: ${data.reason.trim()}`,
    });

    return { data: created };
  } catch (err: any) {
    return { error: err?.message || "Failed to issue credit note" };
  }
}

export async function getCreditNotesForBill(billId: string) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };
  try {
    const notes = await prisma.creditNote.findMany({
      where: { billId, restaurantId: session.restaurantId },
      orderBy: { createdAt: "desc" },
    });
    return { data: notes };
  } catch (err: any) {
    return { error: err?.message || "Failed to load credit notes" };
  }
}

export type CreditNotePrintData = {
  title: string;
  seller: { name: string; address: string; phone: string; pan: string | null; vat: string | null };
  buyer: { name: string | null; pan: string | null };
  creditNoteNumber: string;
  originalInvoice: string;
  dateAd: string;
  dateBs: string;
  reason: string;
  isVat: boolean;
  taxableAmount: number;
  vatAmount: number;
  amount: number;
  amountInWords: string;
};

export async function getCreditNotePrintData(
  creditNoteId: string
): Promise<{ data: CreditNotePrintData } | { error: string }> {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };
  try {
    const cn = await prisma.creditNote.findFirst({
      where: { id: creditNoteId, restaurantId: session.restaurantId },
      include: { bill: { select: { billNumber: true, customerName: true, customerPan: true, order: { select: { customerName: true } } } } },
    });
    if (!cn) return { error: "Credit note not found" };

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: session.restaurantId },
      select: { name: true, street: true, city: true, phoneNumber: true, panNumber: true, vatNumber: true, vatRegistered: true },
    });

    const isVat = cn.vatAmount > 0;
    return {
      data: {
        title: "Credit Note",
        seller: {
          name: restaurant?.name || "Restaurant",
          address: [restaurant?.street, restaurant?.city].filter(Boolean).join(", "),
          phone: restaurant?.phoneNumber || "",
          pan: restaurant?.panNumber || null,
          vat: restaurant?.vatRegistered ? restaurant?.vatNumber || null : null,
        },
        buyer: {
          name: cn.bill.customerName || cn.bill.order?.customerName || null,
          pan: cn.bill.customerPan || null,
        },
        creditNoteNumber: cn.creditNoteNumber,
        originalInvoice: cn.bill.billNumber,
        dateAd: cn.createdAt.toISOString().replace("T", " ").slice(0, 16),
        dateBs: toBsNumeric(cn.createdAt),
        reason: cn.reason,
        isVat,
        taxableAmount: cn.taxableAmount,
        vatAmount: cn.vatAmount,
        amount: cn.amount,
        amountInWords: amountInWords(cn.amount),
      },
    };
  } catch (err: any) {
    return { error: err?.message || "Failed to build credit note" };
  }
}
