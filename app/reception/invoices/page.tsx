'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Printer, Ban, Receipt, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { searchBills, voidBill } from '@/lib/actions/bills';
import ManagerApprovalDialog from '@/components/dashboard/manager-approval-dialog';

const STATUS_OPTIONS = ['ALL', 'PENDING', 'HELD', 'PAID', 'VOID'];

const statusColor: Record<string, string> = {
  PENDING: 'bg-warning/10 text-warning',
  HELD: 'bg-info/10 text-info',
  PAID: 'bg-success/10 text-success',
  VOID: 'bg-destructive/10 text-destructive',
};

function printReceipt(bill: any) {
  const win = window.open('', '_blank', 'width=380,height=600');
  if (!win) return;
  const itemsHtml = (bill.order?.items || [])
    .filter((i: any) => i.status !== 'CANCELLED')
    .map(
      (i: any) =>
        `<tr><td>${i.quantity}x ${i.menuItemName}</td><td style="text-align:right">${formatCurrency(i.pricePerUnit * i.quantity)}</td></tr>`
    )
    .join('');
  const paymentsHtml = (bill.payments || [])
    .map((p: any) => `<tr><td>${p.method}</td><td style="text-align:right">${formatCurrency(p.amount)}</td></tr>`)
    .join('');
  win.document.write(`
    <html>
      <head>
        <title>Bill ${bill.billNumber}</title>
        <style>
          body { font-family: monospace; padding: 16px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 2px 0; }
          h2, h3 { text-align: center; margin: 4px 0; }
          hr { border: none; border-top: 1px dashed #999; margin: 8px 0; }
          .total { font-weight: bold; font-size: 14px; }
        </style>
      </head>
      <body>
        <h2>Bill Receipt</h2>
        <h3>${bill.billNumber}</h3>
        <p style="text-align:center">${formatDateTime(bill.billDate)}</p>
        <hr />
        <table>${itemsHtml}</table>
        <hr />
        <table>
          <tr><td>Subtotal</td><td style="text-align:right">${formatCurrency(bill.subtotal)}</td></tr>
          <tr><td>Tax</td><td style="text-align:right">${formatCurrency(bill.taxAmount)}</td></tr>
          <tr><td>Service</td><td style="text-align:right">${formatCurrency(bill.serviceCharge)}</td></tr>
          ${bill.discountAmount ? `<tr><td>Discount</td><td style="text-align:right">-${formatCurrency(bill.discountAmount)}</td></tr>` : ''}
          <tr class="total"><td>Total</td><td style="text-align:right">${formatCurrency(bill.totalAmount)}</td></tr>
        </table>
        <hr />
        <table>${paymentsHtml}</table>
        <hr />
        <p style="text-align:center">Thank you!</p>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

export default function InvoicesPage() {
  const { restaurant } = useAuthStore();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [voidOpen, setVoidOpen] = useState(false);

  const search = useCallback(async () => {
    setLoading(true);
    const result: any = await searchBills({ query: query || undefined, status, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined });
    if (result.data) setBills(result.data as any[]);
    else if (Array.isArray(result)) setBills(result);
    setLoading(false);
  }, [query, status, dateFrom, dateTo]);

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant?.id]);

  const handleVoid = async (data: { reason: string; approverUsername: string; approverPassword: string }) => {
    const result = await voidBill({ billId: selected.id, ...data });
    if (result.error) return { error: result.error };
    toast.success(`Bill ${selected.billNumber} voided`);
    setSelected(null);
    search();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Invoice History</h1>
        <p className="text-muted-foreground">Search, reprint, and void past bills</p>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[220px] space-y-1.5">
            <label className="text-xs text-muted-foreground">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Bill #, order #, customer name/phone"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && search()}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">From</label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">To</label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
          </div>
          <Button onClick={search}>Search</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : bills.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Receipt className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No bills found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Table/Order</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => (
                  <TableRow key={bill.id} className="cursor-pointer" onClick={() => setSelected(bill)}>
                    <TableCell className="font-medium">{bill.billNumber}</TableCell>
                    <TableCell className="text-xs">{formatDateTime(bill.billDate)}</TableCell>
                    <TableCell className="text-xs">
                      {bill.order?.table ? `Table ${bill.order.table.tableNumber}` : 'Takeaway'} · #{bill.order?.orderId}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(bill.totalAmount)}</TableCell>
                    <TableCell className="text-xs">{bill.paymentMethod}</TableCell>
                    <TableCell>
                      <Badge className={`border-0 ${statusColor[bill.status] || ''}`}>{bill.status}</Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" onClick={() => printReceipt(bill)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected && !voidOpen} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.billNumber}</DialogTitle>
                <DialogDescription>
                  {selected.order?.table ? `Table ${selected.order.table.tableNumber}` : 'Takeaway'} · {formatDateTime(selected.billDate)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <Badge className={`border-0 ${statusColor[selected.status] || ''}`}>{selected.status}</Badge>
                <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                  {selected.order?.items?.filter((i: any) => i.status !== 'CANCELLED').map((item: any) => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.quantity}x {item.menuItemName}</span>
                      <span>{formatCurrency(item.pricePerUnit * item.quantity)}</span>
                    </div>
                  ))}
                  <Separator className="my-1" />
                  <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(selected.subtotal)}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>Tax</span><span>{formatCurrency(selected.taxAmount)}</span></div>
                  {selected.discountAmount > 0 && (
                    <div className="flex justify-between text-muted-foreground"><span>Discount</span><span>-{formatCurrency(selected.discountAmount)}</span></div>
                  )}
                  <div className="flex justify-between font-semibold"><span>Total</span><span>{formatCurrency(selected.totalAmount)}</span></div>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-xs font-medium text-muted-foreground">Payments</p>
                  {selected.payments?.map((p: any) => (
                    <div key={p.id} className="flex justify-between">
                      <span>{p.method}{p.reference ? ` (${p.reference})` : ''}</span>
                      <span>{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
                {selected.voidedAt && (
                  <p className="text-xs text-destructive">Voided {formatDateTime(selected.voidedAt)}: {selected.voidReason}</p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1 gap-1" onClick={() => printReceipt(selected)}>
                    <Printer className="h-4 w-4" /> Reprint
                  </Button>
                  {selected.status !== 'VOID' && (
                    <Button variant="outline" className="flex-1 gap-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setVoidOpen(true)}>
                      <Ban className="h-4 w-4" /> Void
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ManagerApprovalDialog
        open={voidOpen}
        onOpenChange={setVoidOpen}
        title={`Void ${selected?.billNumber ?? 'bill'}`}
        description="Voiding a bill requires a manager, owner, or admin to authorize with their own login."
        onConfirm={handleVoid}
      />
    </motion.div>
  );
}
