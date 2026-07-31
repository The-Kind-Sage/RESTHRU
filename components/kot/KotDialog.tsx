"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { prepareKot, type KotData } from "@/lib/actions/kot";
import { formatKOTHTML, printReceipt } from "@/lib/printing";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string | null;
  /** Stamps the docket as a reprint so the kitchen can tell copies apart. */
  reprint?: boolean;
}

/** "29 Jul 2026 10:22 PM" — the format the printed docket uses. */
export function formatKotDate(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${date} ${time}`;
}

export default function KotDialog({ open, onOpenChange, orderId, reprint }: Props) {
  const [kot, setKot] = useState<KotData | null>(null);
  const [loading, setLoading] = useState(false);
  const [printed, setPrinted] = useState(false);

  useEffect(() => {
    if (!open || !orderId) return;
    let cancelled = false;
    setLoading(true);
    setPrinted(false);
    setKot(null);
    prepareKot(orderId).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if ("error" in res && res.error) {
        toast.error(res.error);
        onOpenChange(false);
        return;
      }
      if (res.data) setKot(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, [open, orderId, onOpenChange]);

  const handlePrint = useCallback(() => {
    if (!kot) return;
    if (kot.items.length === 0) {
      toast.error("Nothing to send to the kitchen — all items are cancelled.");
      return;
    }
    const ok = printReceipt(
      formatKOTHTML({
        kotNumber: kot.kotNumber,
        tableLabel: kot.tableLabel,
        orderTypeLabel: kot.orderTypeLabel,
        waiterName: kot.waiterName,
        orderedAt: formatKotDate(kot.orderedAt),
        items: kot.items,
        reprint,
      })
    );
    if (!ok) {
      toast.error("Couldn't open the printer — check your browser's print settings.");
      return;
    }
    setPrinted(true);
  }, [kot, reprint]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <DialogTitle className="sr-only">Kitchen Order Ticket</DialogTitle>

        {loading || !kot ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="p-5">
            {/* Docket preview — mirrors the printed ticket exactly */}
            <div className="rounded-xl border p-4">
              <div className="relative">
                <h2 className="text-center text-xl font-bold">KOT {kot.kotNumber}</h2>
                <span className="absolute right-0 top-0 inline-flex items-center gap-1 rounded-md border border-primary/40 px-1.5 py-0.5 text-primary">
                  <Printer className="h-3.5 w-3.5" />
                  {printed && <Check className="h-3.5 w-3.5" />}
                </span>
              </div>
              <p className="text-center font-semibold mt-1">
                {kot.tableLabel ? `Table: ${kot.tableLabel}` : kot.orderTypeLabel}
              </p>

              <div className="mt-4 space-y-1 text-sm">
                <p>Type: {kot.orderTypeLabel}</p>
                <p>Order By: {kot.waiterName}</p>
                <p>Order At: {formatKotDate(kot.orderedAt)}</p>
              </div>

              <div className="my-3 border-t border-dashed" />

              <div className="flex text-sm font-semibold">
                <span className="w-9">S.N</span>
                <span className="flex-1">Dishes</span>
                <span className="text-right">QTY</span>
              </div>

              <div className="my-3 border-t border-dashed" />

              <div className="space-y-2 text-sm">
                {kot.items.length === 0 ? (
                  <p className="text-center text-muted-foreground py-2">
                    All items cancelled
                  </p>
                ) : (
                  kot.items.map((item, idx) => (
                    <div key={idx} className="flex">
                      <span className="w-9">{idx + 1}.</span>
                      <span className="flex-1">
                        {item.name}
                        {item.notes && (
                          <span className="block text-xs italic text-muted-foreground">
                            ** {item.notes}
                          </span>
                        )}
                      </span>
                      <span className="text-right">{item.qty}</span>
                    </div>
                  ))
                )}
                <div className="flex font-semibold pt-1">
                  <span className="flex-1">Total (Dishes/QTY)</span>
                  <span className="text-right">
                    {kot.totalDishes}/{kot.totalQty}
                  </span>
                </div>
              </div>

              <div className="my-3 border-t border-dashed" />

              <p className="text-center text-muted-foreground">Thank You!</p>
            </div>

            <div className="mt-4 flex gap-2">
              {/* Not every kitchen prints — some work straight off the screen,
                  so dismissing without printing has to be a first-class choice.
                  On a reprint there is nothing to "skip", so it reads Close. */}
              <Button
                variant="outline"
                className="flex-1"
                size="lg"
                onClick={() => onOpenChange(false)}
              >
                {reprint ? "Close" : "Skip"}
              </Button>
              <Button onClick={handlePrint} className="flex-1 gap-2" size="lg">
                <Printer className="h-4 w-4" /> Print KOT
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
