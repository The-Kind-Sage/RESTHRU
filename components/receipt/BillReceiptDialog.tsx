"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useAuthStore } from "@/store/auth-store";
import { formatReceiptHTML, printReceipt } from "@/lib/printing";

interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
  total: number;
}

interface BillData {
  billNumber?: string;
  subtotal: number;
  taxAmount?: number;
  serviceCharge?: number;
  discountAmount?: number;
  totalAmount: number;
  amountPaid?: number;
  change?: number;
  paymentMethod?: string;
  status?: string;
  createdAt?: string;
  settledAt?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ReceiptItem[];
  bill?: BillData;
  orderId?: string;
  tableName?: string;
}

export default function BillReceiptDialog({
  open,
  onOpenChange,
  items,
  bill,
  orderId,
  tableName,
}: Props) {
  const { restaurant } = useAuthStore();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [printLoading, setPrintLoading] = useState(false);

  const addrStr = restaurant?.address
    ? typeof restaurant.address === "string"
      ? restaurant.address
      : [restaurant.address.street, restaurant.address.city, restaurant.address.state]
          .filter(Boolean)
          .join(", ")
    : "";
  const phoneStr = (restaurant as any)?.phoneNumber || (restaurant as any)?.phone || "";

  const now = new Date();
  const dateStr = bill?.createdAt
    ? new Date(bill.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : now.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
  const timeStr = bill?.createdAt
    ? new Date(bill.createdAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

  const handlePrint = () => {
    setPrintLoading(true);
    const html = formatReceiptHTML({
      restaurantName: restaurant?.name || "Restaurant",
      address: addrStr,
      phone: phoneStr,
      billNumber: bill?.billNumber || orderId || "N/A",
      items,
      subtotal: bill?.subtotal ?? 0,
      taxAmount: bill?.taxAmount ?? 0,
      serviceCharge: bill?.serviceCharge,
      discountAmount: bill?.discountAmount,
      totalAmount: bill?.totalAmount ?? 0,
      amountPaid: bill?.amountPaid ?? 0,
      change: bill?.change ?? 0,
      paymentMethod: bill?.paymentMethod || "N/A",
      date: `${dateStr} ${timeStr}`,
    });
    printReceipt(html);
    setTimeout(() => setPrintLoading(false), 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 overflow-hidden rounded-2xl">
        <div className="bg-gradient-to-b from-primary/5 to-background p-6">
          {/* Receipt */}
          <div
            ref={receiptRef}
            className="bg-white rounded-xl shadow-lg p-5 mx-auto"
            style={{ maxWidth: "320px" }}
          >
            {/* Header */}
            <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                {restaurant?.name || "Restaurant"}
              </h2>
              {addrStr && (
                <p className="text-[11px] text-gray-500 mt-0.5">{addrStr}</p>
              )}
              {phoneStr && (
                <p className="text-[11px] text-gray-500">{phoneStr}</p>
              )}
            </div>

            {/* Bill Info */}
            <div className="flex justify-between text-[11px] text-gray-600 mb-3">
              <div>
                <p className="font-semibold text-gray-800">
                  Bill: {bill?.billNumber || orderId || "N/A"}
                </p>
                {tableName && <p>Table: {tableName}</p>}
              </div>
              <div className="text-right">
                <p>{dateStr}</p>
                <p>{timeStr}</p>
              </div>
            </div>

            {/* Items Header */}
            <div className="border-t border-b border-gray-200 py-1.5 mb-2">
              <div className="flex text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                <span className="flex-[2]">Item</span>
                <span className="flex-1 text-center">Qty</span>
                <span className="flex-1 text-right">Price</span>
                <span className="flex-1 text-right">Total</span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-1.5 mb-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex text-[11px] text-gray-700">
                  <span className="flex-[2] truncate">{item.name}</span>
                  <span className="flex-1 text-center">{item.qty}</span>
                  <span className="flex-1 text-right">{formatCurrency(item.price)}</span>
                  <span className="flex-1 text-right font-medium">{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t-2 border-dashed border-gray-300 pt-3 space-y-1">
              <div className="flex justify-between text-[11px] text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(bill?.subtotal ?? 0)}</span>
              </div>
              {(bill?.serviceCharge ?? 0) > 0 && (
                <div className="flex justify-between text-[11px] text-gray-600">
                  <span>Service Charge</span>
                  <span>{formatCurrency(bill?.serviceCharge ?? 0)}</span>
                </div>
              )}
              {(bill?.discountAmount ?? 0) > 0 && (
                <div className="flex justify-between text-[11px] text-red-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(bill?.discountAmount ?? 0)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-200">
                <span>Total</span>
                <span>{formatCurrency(bill?.totalAmount ?? 0)}</span>
              </div>
              {(bill?.amountPaid ?? 0) > 0 && (
                <>
                  <div className="flex justify-between text-[11px] text-gray-600">
                    <span>Paid ({bill?.paymentMethod || "N/A"})</span>
                    <span>{formatCurrency(bill?.amountPaid ?? 0)}</span>
                  </div>
                  {(bill?.change ?? 0) > 0 && (
                    <div className="flex justify-between text-[11px] text-gray-600">
                      <span>Change</span>
                      <span>{formatCurrency(bill?.change ?? 0)}</span>
                    </div>
                  )}
                </>
              )}
              {bill?.status === "PAID" && (
                <div className="text-center mt-2">
                  <span className="inline-block text-[10px] font-semibold text-green-700 bg-green-100 px-3 py-0.5 rounded-full">
                    PAID
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t-2 border-dashed border-gray-300 mt-4 pt-3 text-center">
              <p className="text-[10px] text-gray-500 italic">
                Thank you for your visit!
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handlePrint}
              disabled={printLoading}
            >
              {printLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              Print
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
