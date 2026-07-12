"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Users,
  Clock,
  Phone,
  Plus,
  X,
  Check,
  Bell,
  BellRing,
  ArrowRight,
  Loader2,
  Search,
  UserPlus,
  Table2,
  GitMerge,
  Split,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrency, formatTime, formatDate } from "@/lib/format";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import {
  getReservations,
  createReservation,
  checkInReservation,
  cancelReservation,
  getWaitlistEntries,
  addToWaitlist,
  notifyWaitlistEntry,
  seatWaitlistEntry,
  removeFromWaitlist,
  walkInAssignTable,
  getAvailableTables,
  getActiveOrdersForTableMerge,
  mergeTables,
  splitOrderItems,
} from "@/lib/actions/reception";

const FLOOR_BG: Record<string, string> = {
  AVAILABLE: "bg-success/20",
  OCCUPIED: "bg-warning/20",
  RESERVED: "bg-primary/20",
  BILL_REQUESTED: "bg-accent/20",
  MAINTENANCE: "bg-destructive/20",
};

export default function ReceptionPage() {
  const { restaurant } = useAuthStore();
  const restaurantId = restaurant?.id;

  const [reservations, setReservations] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  const refreshAll = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    const [resRes, tabRes, waitRes, ordRes] = await Promise.all([
      getReservations(selectedDate),
      getAvailableTables(),
      getWaitlistEntries(),
      getActiveOrdersForTableMerge(),
    ]);
    if ("data" in resRes && resRes.data) setReservations(resRes.data);
    if ("data" in tabRes && tabRes.data) setTables(tabRes.data);
    if ("data" in waitRes && waitRes.data) setWaitlist(waitRes.data);
    if ("data" in ordRes && ordRes.data) setActiveOrders(ordRes.data);
    setLoading(false);
  }, [restaurantId, selectedDate]);

  useEffect(() => {
    if (!restaurantId) return;
    refreshAll();
    const interval = setInterval(refreshAll, 15_000);
    return () => clearInterval(interval);
  }, [restaurantId, refreshAll]);

  /* ── Reservation state ── */
  const [showNewReservation, setShowNewReservation] = useState(false);
  const [newRes, setNewRes] = useState({ customerName: "", customerPhone: "", partySize: 2, reservedFor: "", notes: "" });
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateReservation = async () => {
    if (!newRes.customerName || !newRes.customerPhone || !newRes.reservedFor) {
      toast.error("Name, phone, and time are required");
      return;
    }
    setIsCreating(true);
    const result = await createReservation({
      customerName: newRes.customerName,
      customerPhone: newRes.customerPhone,
      partySize: newRes.partySize,
      reservedFor: `${selectedDate}T${newRes.reservedFor}`,
      notes: newRes.notes || undefined,
    }) as any;
    setIsCreating(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Reservation created");
    setShowNewReservation(false);
    setNewRes({ customerName: "", customerPhone: "", partySize: 2, reservedFor: "", notes: "" });
    refreshAll();
  };

  const handleCheckIn = async (reservation: any) => {
    const result = await checkInReservation(reservation.id) as any;
    if (result.error) { toast.error(result.error); return; }
    toast.success(`${reservation.customerName} checked in`);
    refreshAll();
  };

  const handleCancelReservation = async (reservation: any) => {
    const result = await cancelReservation(reservation.id) as any;
    if (result.error) { toast.error(result.error); return; }
    toast.success("Reservation cancelled");
    refreshAll();
  };

  /* ── Walk-in state ── */
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [walkInTable, setWalkInTable] = useState<any>(null);
  const [walkInData, setWalkInData] = useState({ customerName: "", customerPhone: "", guestCount: 2 });
  const [isWalkingIn, setIsWalkingIn] = useState(false);

  const handleWalkIn = async () => {
    if (!walkInTable) return;
    setIsWalkingIn(true);
    const result = await walkInAssignTable({
      tableId: walkInTable.id,
      guestCount: walkInData.guestCount,
      customerName: walkInData.customerName || undefined,
      customerPhone: walkInData.customerPhone || undefined,
    }) as any;
    setIsWalkingIn(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success(`Walk-in assigned to Table ${walkInTable.tableNumber}`);
    setShowWalkIn(false);
    setWalkInTable(null);
    setWalkInData({ customerName: "", customerPhone: "", guestCount: 2 });
    refreshAll();
  };

  /* ── Waitlist state ── */
  const [showAddWaitlist, setShowAddWaitlist] = useState(false);
  const [newWait, setNewWait] = useState({ customerName: "", customerPhone: "", partySize: 2, quotedWaitMinutes: 15 });
  const [isAddingWait, setIsAddingWait] = useState(false);

  const handleAddWaitlist = async () => {
    if (!newWait.customerName || !newWait.customerPhone) {
      toast.error("Name and phone are required");
      return;
    }
    setIsAddingWait(true);
    const result = await addToWaitlist({
      customerName: newWait.customerName,
      customerPhone: newWait.customerPhone,
      partySize: newWait.partySize,
      quotedWaitMinutes: newWait.quotedWaitMinutes,
    }) as any;
    setIsAddingWait(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Added to waitlist");
    setShowAddWaitlist(false);
    setNewWait({ customerName: "", customerPhone: "", partySize: 2, quotedWaitMinutes: 15 });
    refreshAll();
  };

  const handleNotifyWaitlist = async (entry: any) => {
    const result = await notifyWaitlistEntry(entry.id) as any;
    if (result.error) { toast.error(result.error); return; }
    toast.success(`${entry.customerName} notified`);
    refreshAll();
  };

  const [seatDialogEntry, setSeatDialogEntry] = useState<any>(null);
  const [seatDialogTable, setSeatDialogTable] = useState<string>("");

  const handleSeatWaitlist = async (entry: any, tableId: string) => {
    const table = tables.find((t: any) => t.id === tableId);
    if (!table) { toast.error("Selected table not found"); return; }
    const result = await seatWaitlistEntry(entry.id, tableId) as any;
    if (result.error) { toast.error(result.error); return; }
    toast.success(`${entry.customerName} seated at Table ${table.tableNumber}`);
    refreshAll();
  };

  const handleConfirmSeat = async () => {
    if (!seatDialogEntry || !seatDialogTable) return;
    await handleSeatWaitlist(seatDialogEntry, seatDialogTable);
    setSeatDialogEntry(null);
    setSeatDialogTable("");
  };

  const handleRemoveWaitlist = async (entry: any) => {
    const result = await removeFromWaitlist(entry.id) as any;
    if (result.error) { toast.error(result.error); return; }
    toast.success("Entry removed");
    refreshAll();
  };

  /* ── Merge state ── */
  const [selectedMergeOrders, setSelectedMergeOrders] = useState<string[]>([]);
  const [mergeTargetTable, setMergeTargetTable] = useState<string>("");
  const [isMerging, setIsMerging] = useState(false);

  const handleMerge = async () => {
    if (selectedMergeOrders.length < 2 || !mergeTargetTable) {
      toast.error("Select at least 2 source orders and a target table");
      return;
    }
    setIsMerging(true);
    const sourceTableIds = selectedMergeOrders
      .map((oid) => activeOrders.find((o: any) => o.id === oid)?.tableId)
      .filter(Boolean) as string[];
    const result = await mergeTables(sourceTableIds, mergeTargetTable) as any;
    setIsMerging(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Tables merged");
    setSelectedMergeOrders([]);
    setMergeTargetTable("");
    refreshAll();
  };

  /* ── Split state ── */
  const [splitSourceOrder, setSplitSourceOrder] = useState<string>("");
  const [splitItemIds, setSplitItemIds] = useState<string[]>([]);
  const [splitTargetTable, setSplitTargetTable] = useState<string>("");
  const [isSplitting, setIsSplitting] = useState(false);

  const handleSplit = async () => {
    if (!splitSourceOrder || splitItemIds.length === 0 || !splitTargetTable) {
      toast.error("Select source order, items, and target table");
      return;
    }
    setIsSplitting(true);
    const result = await splitOrderItems(splitSourceOrder, splitItemIds, splitTargetTable) as any;
    setIsSplitting(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Order split");
    setSplitSourceOrder("");
    setSplitItemIds([]);
    setSplitTargetTable("");
    refreshAll();
  };

  const availableTables = useMemo(
    () => tables.filter((t: any) => t.status === "AVAILABLE"),
    [tables]
  );

  const floors = useMemo(() => {
    const f = new Set(tables.map((t: any) => t.floor));
    return Array.from(f) as string[];
  }, [tables]);

  const tablesByFloor = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const t of tables) {
      if (!map[t.floor]) map[t.floor] = [];
      map[t.floor].push(t);
    }
    return map;
  }, [tables]);

  if (loading && reservations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card sticky top-0 z-40">
        <div className="max-w-full px-4 py-4">
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold">Reception</h1>
              <Badge className="bg-primary text-primary-foreground text-base px-3 py-1">
                {reservations.filter((r: any) => r.status === "BOOKED").length} Reservations
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={refreshAll}>
              <RotateCcw className="w-4 h-4 mr-1" /> Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue="reservations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="reservations" className="gap-1">
              <Calendar className="w-4 h-4" /> Reservations
            </TabsTrigger>
            <TabsTrigger value="floor" className="gap-1">
              <Table2 className="w-4 h-4" /> Floor & Walk-in
            </TabsTrigger>
            <TabsTrigger value="waitlist" className="gap-1">
              <Users className="w-4 h-4" /> Waitlist ({waitlist.length})
            </TabsTrigger>
            <TabsTrigger value="merge" className="gap-1">
              <GitMerge className="w-4 h-4" /> Merge / Split
            </TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Reservations ── */}
          <TabsContent value="reservations" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-48"
                />
              </div>
              <Button onClick={() => setShowNewReservation(true)}>
                <Plus className="w-4 h-4 mr-1" /> New Reservation
              </Button>
            </div>

            {/* New reservation form */}
            {showNewReservation && (
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <Input
                      placeholder="Customer name *"
                      value={newRes.customerName}
                      onChange={(e) => setNewRes({ ...newRes, customerName: e.target.value })}
                    />
                    <Input
                      placeholder="Phone *"
                      value={newRes.customerPhone}
                      onChange={(e) => setNewRes({ ...newRes, customerPhone: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Party size"
                      value={newRes.partySize}
                      min={1}
                      onChange={(e) => setNewRes({ ...newRes, partySize: parseInt(e.target.value) || 1 })}
                    />
                    <Input
                      type="time"
                      value={newRes.reservedFor}
                      onChange={(e) => setNewRes({ ...newRes, reservedFor: e.target.value })}
                    />
                    <Input
                      placeholder="Notes"
                      value={newRes.notes}
                      onChange={(e) => setNewRes({ ...newRes, notes: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowNewReservation(false)}>Cancel</Button>
                    <Button onClick={handleCreateReservation} disabled={isCreating}>
                      {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                      Create
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reservations list */}
            <Card>
              <CardContent className="pt-4">
                {reservations.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">No reservations for this date</p>
                ) : (
                  <ScrollArea className="max-h-[600px]">
                    <div className="space-y-2">
                      {reservations.map((res: any) => (
                        <div
                          key={res.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{res.customerName}</span>
                              <Badge
                                className={
                                  res.status === "BOOKED"
                                    ? "bg-info"
                                    : res.status === "CHECKED_IN"
                                    ? "bg-success"
                                    : res.status === "CANCELLED"
                                    ? "bg-destructive"
                                    : "bg-muted"
                                }
                              >
                                {res.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {res.customerPhone}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" /> {res.partySize}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {formatTime(res.reservedFor)}
                              </span>
                              {res.table && (
                                <span>Table {res.table.tableNumber}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            {res.status === "BOOKED" && (
                              <>
                                <Button size="sm" variant="default" onClick={() => handleCheckIn(res)}>
                                  <Check className="w-3 h-3 mr-1" /> Check In
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="text-destructive">
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Cancel Reservation</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to cancel {res.customerName}'s reservation?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Keep</AlertDialogCancel>
                                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleCancelReservation(res)}>
                                        Cancel Reservation
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab 2: Floor & Walk-in ── */}
          <TabsContent value="floor" className="space-y-4">
            <div className="flex items-center gap-2">
              <Button onClick={() => setShowWalkIn(true)}>
                <UserPlus className="w-4 h-4 mr-1" /> Walk-in Assignment
              </Button>
              <p className="text-sm text-muted-foreground">
                {availableTables.length} of {tables.length} tables available
              </p>
            </div>

            {/* Walk-in modal */}
            {showWalkIn && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Walk-in Assignment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Customer name"
                      value={walkInData.customerName}
                      onChange={(e) => setWalkInData({ ...walkInData, customerName: e.target.value })}
                    />
                    <Input
                      placeholder="Phone"
                      value={walkInData.customerPhone}
                      onChange={(e) => setWalkInData({ ...walkInData, customerPhone: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Guests"
                      value={walkInData.guestCount}
                      min={1}
                      className="w-24"
                      onChange={(e) => setWalkInData({ ...walkInData, guestCount: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Select a table:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {availableTables.map((t: any) => (
                        <Button
                          key={t.id}
                          variant={walkInTable?.id === t.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setWalkInTable(t)}
                        >
                          T{t.tableNumber} (Cap: {t.capacity})
                        </Button>
                      ))}
                      {availableTables.length === 0 && (
                        <p className="text-sm text-muted-foreground">No available tables</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => { setShowWalkIn(false); setWalkInTable(null); }}>Cancel</Button>
                    <Button onClick={handleWalkIn} disabled={!walkInTable || isWalkingIn}>
                      {isWalkingIn ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                      Assign Table
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Floor plan */}
            <div className="space-y-4">
              {floors.map((floor) => (
                <Card key={floor}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{floor}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                      {(tablesByFloor[floor] || []).map((table: any) => (
                        <div
                          key={table.id}
                          className={`p-2 rounded-lg border text-center cursor-pointer hover:shadow-md transition-shadow ${
                            FLOOR_BG[table.status] || "bg-muted/20"
                          }`}
                          onClick={() => {
                            if (table.status === "AVAILABLE") {
                              setWalkInTable(table);
                              setShowWalkIn(true);
                            }
                          }}
                        >
                          <p className="text-xs font-bold">{table.name || `T${table.tableNumber}`}</p>
                          <p className="text-[10px] text-muted-foreground">{table.status}</p>
                          <p className="text-[10px] text-muted-foreground">Cap: {table.capacity}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ── Tab 3: Waitlist ── */}
          <TabsContent value="waitlist" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {waitlist.filter((e: any) => e.status === "WAITING").length} waiting,
                {waitlist.filter((e: any) => e.status === "NOTIFIED").length} notified
              </p>
              <Button onClick={() => setShowAddWaitlist(true)}>
                <Plus className="w-4 h-4 mr-1" /> Add to Waitlist
              </Button>
            </div>

            {showAddWaitlist && (
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Input
                      placeholder="Customer name *"
                      value={newWait.customerName}
                      onChange={(e) => setNewWait({ ...newWait, customerName: e.target.value })}
                    />
                    <Input
                      placeholder="Phone *"
                      value={newWait.customerPhone}
                      onChange={(e) => setNewWait({ ...newWait, customerPhone: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Party size"
                      value={newWait.partySize}
                      min={1}
                      onChange={(e) => setNewWait({ ...newWait, partySize: parseInt(e.target.value) || 1 })}
                    />
                    <Input
                      type="number"
                      placeholder="Wait (min)"
                      value={newWait.quotedWaitMinutes}
                      min={0}
                      onChange={(e) => setNewWait({ ...newWait, quotedWaitMinutes: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowAddWaitlist(false)}>Cancel</Button>
                    <Button onClick={handleAddWaitlist} disabled={isAddingWait}>
                      {isAddingWait ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-4">
                {waitlist.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">No active waitlist entries</p>
                ) : (
                  <ScrollArea className="max-h-[500px]">
                    <div className="space-y-2">
                      <AnimatePresence>
                        {waitlist.map((entry: any) => (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{entry.customerName}</span>
                                <Badge
                                  className={
                                    entry.status === "WAITING"
                                      ? "bg-warning"
                                      : entry.status === "NOTIFIED"
                                      ? "bg-info"
                                      : "bg-muted"
                                  }
                                >
                                  {entry.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> {entry.customerPhone}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" /> {entry.partySize}
                                </span>
                                {entry.quotedWaitMinutes && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> ~{entry.quotedWaitMinutes} min
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              {entry.status === "WAITING" && (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => handleNotifyWaitlist(entry)}>
                                    <Bell className="w-3 h-3 mr-1" /> Notify
                                  </Button>
                                <Button size="sm" variant="default" onClick={() => { setSeatDialogEntry(entry); setSeatDialogTable(""); }}>
                                  <Check className="w-3 h-3 mr-1" /> Seat
                                </Button>
                              </>
                            )}
                            {entry.status === "NOTIFIED" && (
                              <Button size="sm" variant="default" onClick={() => { setSeatDialogEntry(entry); setSeatDialogTable(""); }}>
                                  <Check className="w-3 h-3 mr-1" /> Seat
                                </Button>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="ghost" className="text-destructive">
                                    <X className="w-3 h-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove Waitlist Entry</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to remove {entry.customerName} from the waitlist?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Keep</AlertDialogCancel>
                                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleRemoveWaitlist(entry)}>
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            <Dialog open={!!seatDialogEntry} onOpenChange={(open) => { if (!open) { setSeatDialogEntry(null); setSeatDialogTable(""); } }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Seat {seatDialogEntry?.customerName}</DialogTitle>
                  <DialogDescription>
                    Choose a table to seat this party of {seatDialogEntry?.partySize}.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-wrap gap-1.5 py-2">
                  {tables.filter((t: any) => t.status === "AVAILABLE" && t.capacity >= (seatDialogEntry?.partySize || 0)).map((t: any) => (
                    <Button
                      key={t.id}
                      variant={seatDialogTable === t.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSeatDialogTable(t.id)}
                    >
                      T{t.tableNumber} (Cap: {t.capacity})
                    </Button>
                  ))}
                  {tables.filter((t: any) => t.status === "AVAILABLE" && t.capacity >= (seatDialogEntry?.partySize || 0)).length === 0 && (
                    <p className="text-sm text-muted-foreground">No suitable tables available</p>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setSeatDialogEntry(null); setSeatDialogTable(""); }}>Cancel</Button>
                  <Button onClick={handleConfirmSeat} disabled={!seatDialogTable}>
                    <Check className="w-4 h-4 mr-1" /> Confirm Seat
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ── Tab 4: Merge / Split ── */}
          <TabsContent value="merge" className="space-y-6">
            {/* Merge */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-1">
                  <GitMerge className="w-4 h-4" /> Merge Tables
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Select source orders to merge:</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {activeOrders.map((o: any) => (
                      <label
                        key={o.id}
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer text-sm"
                      >
                        <Checkbox
                          checked={selectedMergeOrders.includes(o.id)}
                          onCheckedChange={() => {
                            setSelectedMergeOrders((prev) =>
                              prev.includes(o.id)
                                ? prev.filter((id) => id !== o.id)
                                : [...prev, o.id]
                            );
                          }}
                        />
                        <span>
                          #{o.orderId} — {o.table?.name || `T${o.table?.tableNumber}`}
                        </span>
                        <span className="text-muted-foreground ml-auto">
                          {formatCurrency(o.totalAmount)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Target table:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tables.map((t: any) => (
                      <Button
                        key={t.id}
                        variant={mergeTargetTable === t.id ? "default" : "outline"}
                        size="default"
                        onClick={() => setMergeTargetTable(t.id)}
                      >
                        T{t.tableNumber}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={handleMerge}
                  disabled={selectedMergeOrders.length < 2 || !mergeTargetTable || isMerging}
                >
                  {isMerging ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <GitMerge className="w-4 h-4 mr-1" />}
                  Merge Orders to Target Table
                </Button>
              </CardContent>
            </Card>

            {/* Split */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-1">
                  <Split className="w-4 h-4" /> Split Order
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Source order:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeOrders.map((o: any) => (
                      <Button
                        key={o.id}
                        variant={splitSourceOrder === o.id ? "default" : "outline"}
                        size="default"
                        onClick={() => { setSplitSourceOrder(o.id); setSplitItemIds([]); }}
                      >
                        #{o.orderId} — {o.table?.name || `T${o.table?.tableNumber}`}
                      </Button>
                    ))}
                  </div>
                </div>
                {splitSourceOrder && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Select items to split out:</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {activeOrders
                        .find((o: any) => o.id === splitSourceOrder)
                        ?.items?.map((item: any) => (
                          <label
                            key={item.id}
                            className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer text-sm"
                          >
                            <Checkbox
                              checked={splitItemIds.includes(item.id)}
                              onCheckedChange={() => {
                                setSplitItemIds((prev) =>
                                  prev.includes(item.id)
                                    ? prev.filter((id) => id !== item.id)
                                    : [...prev, item.id]
                                );
                              }}
                            />
                            <span>
                              {item.quantity}x {item.menuItemName}
                            </span>
                            <span className="text-muted-foreground ml-auto">
                              {formatCurrency(item.pricePerUnit * item.quantity)}
                            </span>
                          </label>
                        ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Target table:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tables.map((t: any) => (
                      <Button
                        key={t.id}
                        variant={splitTargetTable === t.id ? "default" : "outline"}
                        size="default"
                        onClick={() => setSplitTargetTable(t.id)}
                      >
                        T{t.tableNumber}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={handleSplit}
                  disabled={!splitSourceOrder || splitItemIds.length === 0 || !splitTargetTable || isSplitting}
                >
                  {isSplitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Split className="w-4 h-4 mr-1" />}
                  Split Items to Target Table
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
