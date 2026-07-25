'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Printer, Ban, Receipt, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { getInvoicePrintData } from '@/lib/actions/invoice';
import { issueCreditNote, getCreditNotesForBill, getCreditNotePrintData } from '@/lib/actions/credit-notes';
import { formatTaxInvoiceHTML, formatCreditNoteHTML, printReceipt as printHtml } from '@/lib/printing';
import { BILL_STATUS_COLORS } from '@/lib/constants';
import { Textarea } from '@/components/ui/textarea';
import { FileMinus } from 'lucide-react';

const STATUS_OPTIONS = ['ALL', 'PENDING', 'HELD', 'PAID', 'VOID'];
const PAGE_SIZE = 15;

// Reprints the IRD-format invoice (Tax Invoice / PAN bill) resolved server-side,
// so historic reprints carry PAN/VAT, the VAT breakdown, and the BS date.
async function printInvoice(bill: any) {
  const res = await getInvoicePrintData(bill.id);
  if ('error' in res || !res.data) {
    toast.error(('error' in res && res.error) || 'Could not build invoice');
    return;
  }
  printHtml(formatTaxInvoiceHTML(res.data));
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
  const [voidReason, setVoidReason] = useState('');
  const [voiding, setVoiding] = useState(false);
  const [cnOpen, setCnOpen] = useState(false);
  const [cnReason, setCnReason] = useState('');
  const [cnAmount, setCnAmount] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [cnList, setCnList] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async () => {
    setLoading(true);
    const result: any = await searchBills({ query: query || undefined, status, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined });
    if (result.data) setBills(result.data as any[]);
    setLoading(false);
    setPage(0);
  }, [query, status, dateFrom, dateTo]);

  const triggerSearch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(), 350);
  }, [search]);

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant?.id]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    triggerSearch();
  };

  const handleStatusChange = (val: string) => {
    setStatus(val);
    triggerSearch();
  };

  const handleDateFromChange = (val: string) => {
    setDateFrom(val);
    triggerSearch();
  };

  const handleDateToChange = (val: string) => {
    setDateTo(val);
    triggerSearch();
  };

  const paginatedBills = bills.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(bills.length / PAGE_SIZE));

  const closeVoid = () => {
    setVoidOpen(false);
    setVoidReason('');
  };

  const handleVoid = async () => {
    if (!selected || !voidReason.trim() || voiding) return;
    setVoiding(true);
    const result = await voidBill({ billId: selected.id, reason: voidReason.trim() });
    setVoiding(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Bill ${selected.billNumber} voided`);
    setVoidReason('');
    setVoidOpen(false);
    setSelected(null);
    search();
  };

  // Load any credit notes for the opened bill (audit visibility).
  useEffect(() => {
    if (!selected?.id) { setCnList([]); return; }
    let active = true;
    getCreditNotesForBill(selected.id).then((r) => {
      if (active && 'data' in r && r.data) setCnList(r.data);
    });
    return () => { active = false; };
  }, [selected?.id]);

  const isLocked = (b: any) => b && (b.status === 'PAID' || b.isLocked);
  const remainingCredit = (b: any) => Math.max(0, (b?.totalAmount ?? 0) - (b?.creditNoteTotal ?? 0));

  const openCreditNote = () => {
    setCnReason('');
    setCnAmount(String(remainingCredit(selected).toFixed(2)));
    setCnOpen(true);
  };
  const closeCreditNote = () => { setCnOpen(false); setCnReason(''); setCnAmount(''); };

  const handleIssueCreditNote = async () => {
    if (!selected || !cnReason.trim() || issuing) return;
    const amt = cnAmount.trim() === '' ? undefined : parseFloat(cnAmount);
    if (amt != null && (isNaN(amt) || amt <= 0)) { toast.error('Enter a valid credit amount'); return; }
    setIssuing(true);
    const result = await issueCreditNote({ billId: selected.id, reason: cnReason.trim(), amount: amt });
    setIssuing(false);
    if ('error' in result && result.error) { toast.error(result.error); return; }
    if ('data' in result && result.data) {
      toast.success(`Credit note ${result.data.creditNoteNumber} issued`);
      // Print it.
      const p = await getCreditNotePrintData(result.data.id);
      if ('data' in p && p.data) printHtml(formatCreditNoteHTML(p.data));
    }
    closeCreditNote();
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
                onChange={(e) => handleQueryChange(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Status</label>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">From</label>
            <Input type="date" value={dateFrom} onChange={(e) => handleDateFromChange(e.target.value)} className="w-40" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">To</label>
            <Input type="date" value={dateTo} onChange={(e) => handleDateToChange(e.target.value)} className="w-40" />
          </div>
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
            <div>
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
                {paginatedBills.map((bill) => (
                  <TableRow key={bill.id} className="cursor-pointer" onClick={() => setSelected(bill)}>
                    <TableCell className="font-medium">{bill.billNumber}</TableCell>
                    <TableCell className="text-xs">{formatDateTime(bill.billDate)}</TableCell>
                    <TableCell className="text-xs">
                      {bill.order?.table ? `Table ${bill.order.table.tableNumber}` : 'Takeaway'} · #{bill.order?.orderId}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(bill.totalAmount)}</TableCell>
                    <TableCell className="text-xs">{bill.paymentMethod}</TableCell>
                    <TableCell>
                      <Badge className={`border-0 ${BILL_STATUS_COLORS[bill.status] || ''}`}>{bill.status}</Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" onClick={() => printInvoice(bill)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">{bills.length} result{bills.length !== 1 ? 's' : ''}</p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
                <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            </div>
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
                <Badge className={`border-0 ${BILL_STATUS_COLORS[selected.status] || ''}`}>{selected.status}</Badge>
                <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                  {selected.order?.items?.filter((i: any) => i.status !== 'CANCELLED').map((item: any) => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.quantity}x {item.menuItemName}</span>
                      <span>{formatCurrency(item.pricePerUnit * item.quantity)}</span>
                    </div>
                  ))}
                  <Separator className="my-1" />
                  <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(selected.subtotal)}</span></div>
                  {selected.discountAmount > 0 && (
                    <div className="flex justify-between text-muted-foreground"><span>Discount</span><span>-{formatCurrency(selected.discountAmount)}</span></div>
                  )}
                  <div className="flex justify-between font-semibold"><span>Total</span><span>{formatCurrency(selected.totalAmount)}</span></div>
                  {selected.creditNoteTotal > 0 && (
                    <div className="flex justify-between text-destructive"><span>Credited</span><span>-{formatCurrency(selected.creditNoteTotal)}</span></div>
                  )}
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
                {cnList.length > 0 && (
                  <div className="space-y-1 text-sm">
                    <p className="text-xs font-medium text-muted-foreground">Credit notes</p>
                    {cnList.map((cn) => (
                      <div key={cn.id} className="flex items-center justify-between">
                        <button className="text-primary hover:underline" onClick={async () => { const p = await getCreditNotePrintData(cn.id); if ('data' in p && p.data) printHtml(formatCreditNoteHTML(p.data)); }}>
                          {cn.creditNoteNumber}
                        </button>
                        <span>-{formatCurrency(cn.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1 gap-1" onClick={() => printInvoice(selected)}>
                    <Printer className="h-4 w-4" /> Reprint
                  </Button>
                  {selected.status !== 'VOID' && isLocked(selected) && remainingCredit(selected) > 0 && (
                    <Button variant="outline" className="flex-1 gap-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={openCreditNote}>
                      <FileMinus className="h-4 w-4" /> Credit Note
                    </Button>
                  )}
                  {selected.status !== 'VOID' && !isLocked(selected) && (
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

      <Dialog open={voidOpen} onOpenChange={(o) => { if (!o) closeVoid(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Void {selected?.billNumber ?? 'bill'}</DialogTitle>
            <DialogDescription>
              This marks the bill as void and is recorded in the owner&apos;s activity log against your account. A reason is required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              autoFocus
              placeholder="Reason for voiding (e.g. wrong order, duplicate bill, customer walkout)"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeVoid} disabled={voiding}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="gap-1"
                disabled={!voidReason.trim() || voiding}
                onClick={handleVoid}
              >
                {voiding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                Void bill
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Credit note — the compliant reversal for an issued (locked) invoice */}
      <Dialog open={cnOpen} onOpenChange={(o) => { if (!o) closeCreditNote(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Credit note for {selected?.billNumber ?? 'invoice'}</DialogTitle>
            <DialogDescription>
              Issued invoices can&apos;t be edited or voided, so a credit note reverses them. It is numbered per fiscal year and logged.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Amount to credit (max {formatCurrency(remainingCredit(selected))})</label>
              <Input type="number" min="0" step="0.01" value={cnAmount} onChange={(e) => setCnAmount(e.target.value)} />
            </div>
            <Textarea
              placeholder="Reason (e.g. order returned, billing error, refund)"
              value={cnReason}
              onChange={(e) => setCnReason(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeCreditNote} disabled={issuing}>Cancel</Button>
              <Button
                className="gap-1"
                disabled={!cnReason.trim() || issuing}
                onClick={handleIssueCreditNote}
              >
                {issuing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileMinus className="h-4 w-4" />}
                Issue credit note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
