'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Clock, Wallet, Plus, Loader2, AlertTriangle, CheckCircle2, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
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
import { toast } from 'sonner';
import {
  getShiftableStaff,
  getActiveShifts,
  openShift,
  closeShift,
  getShiftSummary,
  getShiftHistory,
} from '@/lib/actions/shifts';

function elapsed(from: string | Date) {
  const ms = Date.now() - new Date(from).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export default function ShiftsPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [activeShifts, setActiveShifts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [openingFloat, setOpeningFloat] = useState('');
  const [openNotes, setOpenNotes] = useState('');
  const [opening, setOpening] = useState(false);

  const [closeTarget, setCloseTarget] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [closingCash, setClosingCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [closing, setClosing] = useState(false);

  const [detailShiftId, setDetailShiftId] = useState<string | null>(null);
  const [detailSummary, setDetailSummary] = useState<any>(null);

  const refresh = useCallback(async () => {
    const [s, a, h] = await Promise.all([getShiftableStaff(), getActiveShifts(), getShiftHistory()]);
    const sResult = s as any; const aResult = a as any; const hResult = h as any;
    if (sResult.data) setStaff(sResult.data);
    if (aResult.data) setActiveShifts(aResult.data);
    if (hResult.data) setHistory(hResult.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleOpenShift = async () => {
    if (!selectedStaffId) {
      toast.error('Select a staff member');
      return;
    }
    const floatAmount = parseFloat(openingFloat);
    if (isNaN(floatAmount) || floatAmount < 0) {
      toast.error('Enter a valid opening float');
      return;
    }
    setOpening(true);
    const result = await openShift({ staffId: selectedStaffId, openingFloat: floatAmount, notes: openNotes || undefined });
    setOpening(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Shift opened');
    setOpenDialogOpen(false);
    setSelectedStaffId('');
    setOpeningFloat('');
    setOpenNotes('');
    refresh();
  };

  const openCloseDialog = async (shift: any) => {
    setCloseTarget(shift);
    setSummary(null);
    setClosingCash('');
    setCloseNotes('');
    const result = await getShiftSummary(shift.id);
    if ('data' in result) setSummary(result.data);
  };

  const handleCloseShift = async () => {
    const declared = parseFloat(closingCash);
    if (isNaN(declared) || declared < 0) {
      toast.error('Enter the counted cash amount');
      return;
    }
    setClosing(true);
    const closeResult: any = await closeShift({ shiftId: closeTarget.id, closingCashDeclared: declared, notes: closeNotes || undefined });
    setClosing(false);
    if (closeResult.error) {
      toast.error(closeResult.error);
      return;
    }
    const shift = closeResult.data;
    toast.success(
      shift.discrepancy === 0
        ? 'Shift closed — drawer balanced'
        : `Shift closed — discrepancy ${formatCurrency(shift.discrepancy)}`
    );
    setCloseTarget(null);
    refresh();
  };

  const viewDetails = async (shiftId: string) => {
    setDetailShiftId(shiftId);
    setDetailSummary(null);
    const result = await getShiftSummary(shiftId);
    if ('data' in result) setDetailSummary(result.data);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shift Management</h1>
          <p className="text-muted-foreground">Open/close registers, declare float, and reconcile cash</p>
        </div>
        <Button onClick={() => setOpenDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Open Shift
        </Button>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4" /> Active Shifts
        </h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : activeShifts.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              <Wallet className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No open shifts</p>
              <p className="text-sm mt-1">Open a shift to start taking payments with reconciliation.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeShifts.map((shift) => (
              <Card key={shift.id}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground">
                        {shift.staff.firstName} {shift.staff.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{shift.staff.role}</p>
                    </div>
                    <Badge className="bg-success/10 text-success border-0">Open</Badge>
                  </div>
                  <Separator />
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Opened</span>
                      <span>{formatDateTime(shift.openedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Elapsed</span>
                      <span>{elapsed(shift.openedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Opening float</span>
                      <span className="font-medium">{formatCurrency(shift.openingFloat)}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => openCloseDialog(shift)}>
                    Close & Reconcile
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <History className="h-4 w-4" /> Shift History
        </h2>
        <Card>
          <CardContent className="p-0">
            {history.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-sm">No closed shifts yet</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead>Opened</TableHead>
                    <TableHead>Closed</TableHead>
                    <TableHead className="text-right">Float</TableHead>
                    <TableHead className="text-right">Expected</TableHead>
                    <TableHead className="text-right">Declared</TableHead>
                    <TableHead className="text-right">Discrepancy</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((shift) => (
                    <TableRow key={shift.id}>
                      <TableCell>{shift.staff.firstName} {shift.staff.lastName}</TableCell>
                      <TableCell className="text-xs">{formatDateTime(shift.openedAt)}</TableCell>
                      <TableCell className="text-xs">{shift.closedAt ? formatDateTime(shift.closedAt) : '—'}</TableCell>
                      <TableCell className="text-right">{formatCurrency(shift.openingFloat)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(shift.expectedCash ?? 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(shift.closingCashDeclared ?? 0)}</TableCell>
                      <TableCell className="text-right">
                        <span className={shift.discrepancy ? (shift.discrepancy < 0 ? 'text-destructive' : 'text-warning') : 'text-success'}>
                          {formatCurrency(shift.discrepancy ?? 0)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => viewDetails(shift.id)}>Details</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Open shift dialog */}
      <Dialog open={openDialogOpen} onOpenChange={setOpenDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Open Shift</DialogTitle>
            <DialogDescription>Declare the starting cash float for this register.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Staff</Label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger><SelectValue placeholder="Who's on the register?" /></SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} — {s.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Opening float</Label>
              <Input type="number" min={0} value={openingFloat} onChange={(e) => setOpeningFloat(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea value={openNotes} onChange={(e) => setOpenNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleOpenShift} disabled={opening} className="gap-1">
              {opening ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Open Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close shift dialog */}
      <Dialog open={!!closeTarget} onOpenChange={(o) => !o && setCloseTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Close Shift — {closeTarget?.staff?.firstName} {closeTarget?.staff?.lastName}</DialogTitle>
            <DialogDescription>Count the drawer and enter the actual cash on hand.</DialogDescription>
          </DialogHeader>
          {!summary ? (
            <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Opening float</span><span>{formatCurrency(summary.shift.openingFloat)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Cash sales</span><span>{formatCurrency(summary.cashTotal)}</span></div>
                <Separator />
                <div className="flex justify-between font-semibold"><span>Expected cash</span><span>{formatCurrency(summary.expectedCash)}</span></div>
                <Separator />
                <div className="flex justify-between text-muted-foreground"><span>Gross sales (all methods)</span><span>{formatCurrency(summary.grossSales)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Bills settled</span><span>{summary.billCount}</span></div>
              </div>
              <div className="space-y-1.5">
                <Label>Counted cash in drawer</Label>
                <Input type="number" min={0} value={closingCash} onChange={(e) => setClosingCash(e.target.value)} placeholder="0.00" />
                {closingCash && !isNaN(parseFloat(closingCash)) && (
                  <p className={`text-xs ${parseFloat(closingCash) - summary.expectedCash === 0 ? 'text-success' : 'text-warning'} flex items-center gap-1`}>
                    {parseFloat(closingCash) - summary.expectedCash === 0 ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    Discrepancy: {formatCurrency(parseFloat(closingCash) - summary.expectedCash)}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Notes (optional)</Label>
                <Textarea value={closeNotes} onChange={(e) => setCloseNotes(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseTarget(null)}>Cancel</Button>
            <Button onClick={handleCloseShift} disabled={closing || !summary} className="gap-1">
              {closing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Close Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shift detail dialog */}
      <Dialog open={!!detailShiftId} onOpenChange={(o) => !o && setDetailShiftId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Shift Summary</DialogTitle>
          </DialogHeader>
          {!detailSummary ? (
            <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Staff</span><span>{detailSummary.shift.staff.firstName} {detailSummary.shift.staff.lastName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Gross sales</span><span className="font-semibold">{formatCurrency(detailSummary.grossSales)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Bills settled</span><span>{detailSummary.billCount}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Avg ticket</span><span>{formatCurrency(detailSummary.avgTicket)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Voided bills</span><span>{detailSummary.voidedBillCount}</span></div>
              <Separator />
              <p className="text-xs font-medium text-muted-foreground">By payment method</p>
              {Object.entries(detailSummary.byMethod).map(([method, amount]) => (
                <div key={method} className="flex justify-between">
                  <span className="text-muted-foreground">{method}</span>
                  <span>{formatCurrency(amount as number)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between"><span className="text-muted-foreground">Discrepancy</span>
                <span className={detailSummary.shift.discrepancy ? 'text-warning' : 'text-success'}>
                  {formatCurrency(detailSummary.shift.discrepancy ?? 0)}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
