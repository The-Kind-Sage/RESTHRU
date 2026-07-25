"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { toBsNumeric } from "@/lib/nepali-date";
import { amountInWords } from "@/lib/amount-in-words";

// Resolves everything needed to print a legally-formatted invoice (gov.md §3):
// seller PAN/VAT, buyer, itemised lines, VAT breakdown, BS+AD date, amount in
// words. Computed server-side so the print client stays a pure formatter and the
// seller's PAN/VAT (not in the client auth store) is authoritative.
export type InvoicePrintData = {
  isVatInvoice: boolean;
  title: string;
  seller: { name: string; address: string; phone: string; pan: string | null; vat: string | null };
  buyer: { name: string | null; pan: string | null; table: string | null };
  billNumber: string;
  dateAd: string;
  dateBs: string;
  items: Array<{ name: string; qty: number; price: number; total: number }>;
  subtotal: number;
  serviceCharge: number;
  discountAmount: number;
  taxableAmount: number;
  vatAmount: number;
  vatRate: number;
  totalAmount: number;
  amountPaid: number;
  change: number;
  paymentMethod: string;
  amountInWords: string;
  voided: boolean;
};

export async function getInvoicePrintData(
  billId: string
): Promise<{ data: InvoicePrintData } | { error: string }> {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const [bill, restaurant] = await Promise.all([
      prisma.bill.findFirst({
        where: { id: billId, restaurantId: session.restaurantId },
        include: {
          order: { include: { items: true, table: { select: { tableNumber: true } } } },
        },
      }),
      prisma.restaurant.findUnique({
        where: { id: session.restaurantId },
        select: {
          name: true, street: true, city: true, phoneNumber: true,
          panNumber: true, vatNumber: true, vatRegistered: true, taxPercentage: true,
        },
      }),
    ]);
    if (!bill) return { error: "Bill not found" };

    const isVat = !!restaurant?.vatRegistered;
    const dateSource = bill.settledAt ?? bill.billDate ?? bill.createdAt;
    const address = [restaurant?.street, restaurant?.city].filter(Boolean).join(", ");

    const items = (bill.order?.items || [])
      .filter((i) => i.status !== "CANCELLED")
      .map((i) => ({
        name: i.menuItemName,
        qty: i.quantity,
        price: i.pricePerUnit,
        total: i.pricePerUnit * i.quantity,
      }));

    return {
      data: {
        isVatInvoice: isVat,
        title: isVat ? "Tax Invoice / कर बीजक" : "Invoice",
        seller: {
          name: restaurant?.name || "Restaurant",
          address,
          phone: restaurant?.phoneNumber || "",
          pan: restaurant?.panNumber || null,
          vat: isVat ? restaurant?.vatNumber || null : null,
        },
        buyer: {
          name: bill.customerName || bill.order?.customerName || null,
          pan: bill.customerPan || null,
          table: bill.order?.table ? `Table ${bill.order.table.tableNumber}` : null,
        },
        billNumber: bill.billNumber,
        dateAd: dateSource.toISOString().replace("T", " ").slice(0, 16),
        dateBs: toBsNumeric(dateSource),
        items,
        subtotal: bill.subtotal,
        serviceCharge: bill.serviceCharge,
        discountAmount: bill.discountAmount,
        taxableAmount: bill.taxableAmount,
        vatAmount: bill.taxAmount,
        vatRate: restaurant?.taxPercentage || 13,
        totalAmount: bill.totalAmount,
        amountPaid: bill.amountPaid,
        change: bill.change,
        paymentMethod: bill.paymentMethod,
        amountInWords: amountInWords(bill.totalAmount),
        voided: bill.status === "VOID" || !!bill.voidedAt,
      },
    };
  } catch (err: any) {
    return { error: err?.message || "Failed to build invoice" };
  }
}
