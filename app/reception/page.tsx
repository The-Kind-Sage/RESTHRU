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
  Crown,
  AlertTriangle,
  Shield,
  Star,
  Heart,
  Info,
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
import { formatCurrency, formatTime, formatDate, formatDateTime } from "@/lib/format";
import BillReceiptDialog from "@/components/receipt/BillReceiptDialog";
import { createBillDraft, getBill } from "@/lib/actions/bills";
import { getCustomerByPhone } from "@/lib/actions/crm";
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

const SPACE_BG: Record<string, string> = {
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
  const [billReceipt, setBillReceipt] = useState<{ open: boolean; items: any[]; bill: any; orderId?: string; tableName?: string }>({ open: false, items: [], bill: null });
  const [showVipAlert, setShowVipAlert] = useState(false);
  const [vipAlert, setVipAlert] = useState<{ type: "vip" | "allergy"; message: string; details: string } | null>(null);
  const [showCustomerProfile, setShowCustomerProfile] = useState(false);
  const [checkInCustomer, setCheckInCustomer] = useState<any>(null);

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

  const [seatDialogEntry, setSeatDialogEntry] = useState<any>(null);
  const [seatDialogTable, setSeatDialogTable] = useState<string>("");

  const handleCheckIn = async (reservation: any) => {
    // Fetch customer profile for VIP/allergy alerts
    const customerRes = await getCustomerByPhone(reservation.customerPhone);
    if (!("error" in customerRes) && customerRes.data) {
      const customer = customerRes.data;
      // Check for VIP or allergy alerts
      if (customer.tags?.includes("VIP")) {
        setVipAlert({
          type: "vip",
          message: `⭐ VIP Guest: ${customer.name}`,
          details: customer.tags?.filter((t: string) => t !== "VIP").join(", ") || "VIP customer",
        });
        setShowVipAlert(true);
      }
      if (customer.allergens?.length > 0) {
        setVipAlert({
          type: "allergy",
          message: `⚠️ Allergy Alert: ${customer.name}`,
          details: `Allergens: ${customer.allergens.join(", ")}`,
        });
        setShowVipAlert(true);
      }
      // Show full profile
      setCheckInCustomer(customer);
      setShowCustomerProfile(true);
    }
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

  const handleShowBill = async (table: any) => {
    const order = activeOrders.find((o: any) => o.tableId === table.id);
    if (!order) { toast.error("No active order for this table"); return; }
    let billData: any = order.bills?.find((b: any) => b.status !== "VOID");
    try {
      if (billData) {
        const res = await getBill(billData.id);
        if ("error" in res) { toast.error(res.error); return; }
        billData = res.data;
      } else {
        const res = await createBillDraft(order.id);
        if ("error" in res) { toast.error(res.error); return; }
        billData = res.data;
        toast.success("Bill generated");
      }
    } catch { toast.error("Failed to process bill"); return; }
    const items = (billData.order?.items || order.items || []).map((i: any) => ({
      name: i.menuItemName,
      qty: i.quantity,
      price: i.pricePerUnit,
      total: i.pricePerUnit * i.quantity,
    }));
    setBillReceipt({
      open: true,
      items,
      bill: billData,
      orderId: order.orderId,
      tableName: table.name || `T${table.tableNumber}`,
    });
  };

  const availableTables = useMemo(
    () => tables.filter((t: any) => t.status === "AVAILABLE"),
    [tables]
  );

  const spaces = useMemo(() => {
    const f = new Set(tables.map((t: any) => t.space));
    return Array.from(f) as string[];
  }, [tables]);

  const tablesBySpace = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const t of tables) {
      if (!map[t.space]) map[t.space] = [];
      map[t.space].push(t);
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
            <TabsTrigger value="space" className="gap-1">
              <Table2 className="w-4 h-4" /> Space & Walk-in
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

          {/* ── Tab 2: Space & Walk-in ── */}
          <TabsContent value="space" className="space-y-4">
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

            {/* Space plan */}
            <div className="space-y-4">
              {spaces.map((space) => (
                <Card key={space}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{space}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                      {(tablesBySpace[space] || []).map((table: any) => (
                        <div
                          key={table.id}
                          className={`p-2 rounded-lg border text-center ${
                            table.status === "AVAILABLE" ? "cursor-pointer hover:shadow-md" : ""
                          } transition-shadow ${
                            SPACE_BG[table.status] || "bg-muted/20"
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
                          {["OCCUPIED", "BILL_REQUESTED"].includes(table.status) && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="mt-1.5 h-6 text-[10px] px-2 w-full gap-1"
                              onClick={(e) => { e.stopPropagation(); handleShowBill(table); }}
                            >
                              Bill
                            </Button>
                          )}
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

      <BillReceiptDialog
        open={billReceipt.open}
        onOpenChange={(o) => setBillReceipt((prev) => ({ ...prev, open: o }))}
        items={billReceipt.items}
        bill={billReceipt.bill}
        orderId={billReceipt.orderId}
        tableName={billReceipt.tableName}
      />

      {/* VIP / Allergy Alert */}
      <Dialog open={showVipAlert} onOpenChange={setShowVipAlert}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {vipAlert?.type === "vip" ? (
                <Crown className="w-5 h-5 text-yellow-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              )}
              {vipAlert?.type === "vip" ? "VIP Guest Alert" : "Allergy Alert"}
            </DialogTitle>
            <DialogDescription>
              {vipAlert?.type === "vip" 
                ? "This guest has VIP status. Provide exceptional service."
                : "This guest has food allergies. Notify kitchen immediately."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className={`p-3 rounded-lg border ${
              vipAlert?.type === "vip" 
                ? "bg-yellow-50 border-yellow-200 text-yellow-900" 
                : "bg-red-50 border-red-200 text-red-900"
            }`}>
              <p className="font-semibold">{vipAlert?.message}</p>
              <p className="text-sm mt-1">{vipAlert?.details}</p>
            </div>
            {checkInCustomer && (
              <div className="p-3 rounded-lg border bg-muted/30">
                <p className="text-xs text-muted-foreground">Customer Profile</p>
                <p className="font-medium">{checkInCustomer.name}</p>
                <p className="text-sm text-muted-foreground">{checkInCustomer.phone}</p>
                {checkInCustomer.visitCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {checkInCustomer.visitCount} visits • {formatCurrency(checkInCustomer.totalSpent || 0)} total spend
                  </p>
                )}
                {checkInCustomer.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {checkInCustomer.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowVipAlert(false)}>Dismiss</Button>
            <Button onClick={() => { setShowVipAlert(false); setShowCustomerProfile(true); }}>
              View Full Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Profile Dialog */}
      <Dialog open={showCustomerProfile} onOpenChange={setShowCustomerProfile}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Profile</DialogTitle>
            <DialogDescription>
              {checkInCustomer?.name} • {checkInCustomer?.phone}
            </DialogDescription>
          </DialogHeader>
          {checkInCustomer && (
            <div className="space-y-6 py-2">
              {/* Header Card */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{checkInCustomer.name}</h3>
                      <p className="text-muted-foreground">{checkInCustomer.phone}</p>
                      {checkInCustomer.email && (
                        <p className="text-sm text-muted-foreground">{checkInCustomer.email}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {checkInCustomer.tags?.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="mr-1">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">{checkInCustomer.visitCount || 0}</p>
                      <p className="text-xs text-muted-foreground">Visits</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">{formatCurrency(checkInCustomer.totalSpent || 0)}</p>
                      <p className="text-xs text-muted-foreground">Total Spend</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">{checkInCustomer.loyaltyPoints || 0}</p>
                      <p className="text-xs text-muted-foreground">Loyalty Points</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Allergens & Preferences */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      Allergens & Dietary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {checkInCustomer.allergens?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {checkInCustomer.allergens.map((allergen: string) => (
                          <Badge key={allergen} variant="destructive" className="text-sm">{allergen}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No allergens recorded</p>
                    )}
                    {checkInCustomer.dietaryNotes && (
                      <p className="mt-2 text-sm"><strong>Notes:</strong> {checkInCustomer.dietaryNotes}</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-pink-500" />
                      Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {checkInCustomer.favoriteItems?.length > 0 && (
                        <>
                          <p className="font-medium">Favorite Items:</p>
                          <p className="text-muted-foreground">{checkInCustomer.favoriteItems.join(", ")}</p>
                        </>
                      )}
                      {checkInCustomer.preferences && Object.keys(checkInCustomer.preferences).length > 0 && (
                        <>
                          <p className="font-medium">Seating & Preferences:</p>
                          <ul className="text-muted-foreground space-y-1">
                            {Object.entries(checkInCustomer.preferences).map(([key, value]) => (
                              <li key={key} className="flex justify-between">
                                <span>{key}</span>
                                <span className="font-medium">{String(value)}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                      {!checkInCustomer.favoriteItems?.length && !Object.keys(checkInCustomer.preferences || {}).length && (
                        <p className="text-muted-foreground">No preferences recorded</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="orders" className="w-full">
                    <TabsList>
                      <TabsTrigger value="orders">Orders ({checkInCustomer.recentOrders?.length || 0})</TabsTrigger>
                      <TabsTrigger value="reservations">Reservations ({checkInCustomer.reservations?.length || 0})</TabsTrigger>
                      <TabsTrigger value="bills">Bills ({checkInCustomer.bills?.length || 0})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="orders">
                      <div className="space-y-2 mt-4">
                        {checkInCustomer.recentOrders?.length > 0 ? (
                          checkInCustomer.recentOrders.map((order: any) => (
                            <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                              <div>
                                <p className="font-medium">Order #{order.orderId}</p>
                                <p className="text-sm text-muted-foreground">
                                  {order.items?.map((i: any) => `${i.quantity}x ${i.menuItemName}`).join(", ")}
                                </p>
                                <p className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</p>
                              </div>
                              <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-muted-foreground py-8">No recent orders</p>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="reservations">
                      <div className="space-y-2 mt-4">
                        {checkInCustomer.reservations?.length > 0 ? (
                          checkInCustomer.reservations.map((res: any) => (
                            <div key={res.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                              <div>
                                <p className="font-medium">{formatDateTime(res.reservedFor)}</p>
                                <p className="text-sm text-muted-foreground">Party of {res.partySize} • {res.status}</p>
                              </div>
                              <Badge variant={res.vip ? "default" : "secondary"}>
                                {res.vip ? "VIP" : res.occasion || "Standard"}
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-muted-foreground py-8">No reservations</p>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="bills">
                      <div className="space-y-2 mt-4">
                        {checkInCustomer.bills?.length > 0 ? (
                          checkInCustomer.bills.map((bill: any) => (
                            <div key={bill.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                              <div>
                                <p className="font-medium">{bill.billNumber}</p>
                                <p className="text-sm text-muted-foreground">{formatDateTime(bill.billDate)} • {bill.status}</p>
                              </div>
                              <span className="font-semibold">{formatCurrency(bill.totalAmount)}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-muted-foreground py-8">No bills</p>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
