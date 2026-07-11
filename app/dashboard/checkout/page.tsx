"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Banknote,
  Smartphone,
  CreditCard,
  Wallet,
  Plus,
  Minus,
  Pause,
  Play,
  Printer,
  Send,
  ShoppingBag,
  X,
  Loader2,
  Search,
  ChevronRight,
  DollarSign,
  RotateCcw,
  Tag,
  Building2,
  Percent,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/format";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import {
  getPendingBills,
  getBill,
  createBillDraft,
  recordPayment,
  holdBill,
  resumeHeldBill,
  popCashDrawer,
  splitBill,
  getTopMenuItems,
  applyDiscountToBill,
  applyCouponToBill,
  applyCorporateAccountToBill,
} from "@/lib/actions/bills";
import { getOrdersWithItems } from "@/lib/actions/dashboard";
import {
  getCorporateAccounts,
  searchCustomers,
  getCustomerByPhone,
} from "@/lib/actions/crm";
import {
  generatePaymentQR,
  verifyPayment,
  getPendingWalletPayments,
} from "@/lib/actions/payments";
import { formatReceiptHTML, printReceipt } from "@/lib/printing";
import ScannerInput from "@/components/dashboard/scanner-input";

const PAYMENT_METHODS = [
  { id: "CASH", label: "Cash", Icon: Banknote, color: "bg-emerald-600" },
  { id: "ESEWA", label: "eSewa", Icon: Smartphone, color: "bg-green-600" },
  { id: "KHALTI", label: "Khalti", Icon: Wallet, color: "bg-purple-600" },
  { id: "FONEPAY", label: "Fonepay", Icon: CreditCard, color: "bg-blue-600" },
];

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

type BillWithRelations = any;

export default function CheckoutPage() {
  const { restaurant } = useAuthStore();
  const restaurantId = restaurant?.id;

  const [pendingBills, setPendingBills] = useState<BillWithRelations[]>([]);
  const [unbilledOrders, setUnbilledOrders] = useState<any[]>([]);
  const [topItems, setTopItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBill, setActiveBill] = useState<BillWithRelations | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [amountReceived, setAmountReceived] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [isProcessing, setIsProcessing] = useState(false);
  const [splitCount, setSplitCount] = useState(2);
  const [showSplit, setShowSplit] = useState(false);
  const [splitResult, setSplitResult] = useState<{ label: string; amount: number }[] | null>(null);
  const [orderTypeFilter, setOrderTypeFilter] = useState<"all" | "DINE_IN" | "TAKEAWAY">("all");
  const [discountInput, setDiscountInput] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [corpAccounts, setCorpAccounts] = useState<any[]>([]);
  const [selectedCorpAccount, setSelectedCorpAccount] = useState<any>(null);
  const [customerPhone, setCustomerPhone] = useState("");
  const [foundCustomer, setFoundCustomer] = useState<any>(null);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showCoupon, setShowCoupon] = useState(false);
  const [showCorp, setShowCorp] = useState(false);
  const [paymentQR, setPaymentQR] = useState<{ qrDataUrl: string; ref: string } | null>(null);
  const [pendingWalletPayments, setPendingWalletPayments] = useState<any[]>([]);
  const [verifyingPaymentId, setVerifyingPaymentId] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  const refresh = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    const [billsRes, orders, itemsRes, corpRes] = await Promise.all([
      getPendingBills(),
      getOrdersWithItems(restaurantId, 50),
      getTopMenuItems(10),
      getCorporateAccounts(),
    ]);
    if ("data" in billsRes && billsRes.data) setPendingBills(billsRes.data);
    if (orders) setUnbilledOrders(orders);
    if ("data" in itemsRes && itemsRes.data) setTopItems(itemsRes.data);
    if ("data" in corpRes && corpRes.data) setCorpAccounts(corpRes.data);
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    refresh();
    const interval = setInterval(refresh, 15_000);
    return () => clearInterval(interval);
  }, [restaurantId, refresh]);

  const readyToBillOrders = useMemo(() => {
    return unbilledOrders.filter((o: any) => {
      if (!["READY", "SERVED"].includes(o.status)) return false;
      if (o.bills?.length > 0) return false;
      if (orderTypeFilter !== "all" && o.orderType !== orderTypeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const orderMatch = o.orderId?.toLowerCase().includes(q);
        const tableMatch = o.table?.tableNumber?.toString().includes(q);
        const nameMatch = o.customerName?.toLowerCase().includes(q);
        if (!orderMatch && !tableMatch && !nameMatch) return false;
      }
      return true;
    });
  }, [unbilledOrders, orderTypeFilter, searchQuery]);

  const heldBills = useMemo(
    () => pendingBills.filter((b: any) => b.status === "HELD"),
    [pendingBills]
  );

  const activePendingBills = useMemo(
    () => pendingBills.filter((b: any) => b.status === "PENDING"),
    [pendingBills]
  );

  const handleSelectOrder = async (order: any) => {
    const result = await createBillDraft(order.id);
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    if ("data" in result) setActiveBill(result.data);
    setAmountReceived("");
    setPayMethod("CASH");
    setShowSplit(false);
    setSplitResult(null);
  };

  const handleResumeHeld = async (bill: any) => {
    const result = await resumeHeldBill(bill.id);
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    if ("data" in result) setActiveBill(result.data);
    setAmountReceived("");
    setPayMethod("CASH");
    setShowSplit(false);
    setSplitResult(null);
    refresh();
  };

  const handleHold = async () => {
    if (!activeBill) return;
    const result = await holdBill(activeBill.id);
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Bill parked");
    setActiveBill(null);
    refresh();
  };

  const handleRecordPayment = async () => {
    if (!activeBill) return;
    const amount = parseFloat(amountReceived) || activeBill.totalAmount;
    if (amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setIsProcessing(true);
    const result = await recordPayment({
      billId: activeBill.id,
      method: payMethod,
      amount: Math.min(amount, activeBill.totalAmount - activeBill.amountPaid),
      reference: payMethod !== "CASH" ? `txn-${Date.now()}` : undefined,
    });
    setIsProcessing(false);

    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    if (!("data" in result)) return;

    const updatedBill: any = result.data;
    setActiveBill(updatedBill);

    if (updatedBill.status === "PAID") {
      toast.success(
        `Payment complete — change: ${formatCurrency(updatedBill.change)}`
      );
      setActiveBill(null);
      refresh();
    } else {
      toast.success(`Payment recorded (${formatCurrency(updatedBill.amountPaid)} of ${formatCurrency(updatedBill.totalAmount)})`);
    }
  };

  const handleQuickSettle = async () => {
    if (!activeBill) return;

    setIsProcessing(true);
    const result = await recordPayment({
      billId: activeBill.id,
      method: payMethod,
      amount: activeBill.totalAmount - activeBill.amountPaid,
      reference: payMethod !== "CASH" ? `txn-${Date.now()}` : undefined,
    });
    setIsProcessing(false);

    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    if (!("data" in result)) return;

    const updatedBill: any = result.data;
    if (updatedBill.status === "PAID") {
      toast.success(`Bill settled — ${formatCurrency(updatedBill.totalAmount)} (${payMethod})`);
      setActiveBill(null);
      refresh();
    } else {
      toast.success(`Partial payment recorded`);
      setActiveBill(result.data);
    }
  };

  const handleQuickAmount = (amount: number) => {
    setAmountReceived(amount.toString());
  };

  const handleCashDrawerPop = async () => {
    const result = await popCashDrawer();
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Cash drawer pop logged");
  };

  const handleSplit = async () => {
    if (!activeBill || splitCount < 2) return;
    const result = await splitBill({
      billId: activeBill.id,
      splits: Array.from({ length: splitCount }, (_, i) => ({
        label: `Split ${i + 1}`,
      })),
    }) as any;
    if (result.error) {
      toast.error(result.error);
      return;
    }
    if (result.data) setSplitResult(result.data.splits);
  };

  const handleAddItemToTakeaway = async (menuItem: any) => {
    toast.info(`${menuItem.name} added — express order coming soon`);
  };

  const handleApplyDiscount = async () => {
    if (!activeBill) return;
    const amt = parseFloat(discountInput);
    if (isNaN(amt) || amt <= 0) { toast.error("Enter a valid discount amount"); return; }
    const result: any = await applyDiscountToBill(activeBill.id, amt, discountReason || undefined);
    if (result.error) { toast.error(result.error); return; }
    setActiveBill((prev: any) => prev ? { ...prev, discountAmount: result.data.discountAmount, totalAmount: result.data.totalAmount } : prev);
    toast.success(`Discount of ${formatCurrency(amt)} applied`);
    setShowDiscount(false);
  };

  const handleApplyCoupon = async () => {
    if (!activeBill || !couponCode) return;
    const result: any = await applyCouponToBill(activeBill.id, couponCode);
    if (result.error) { toast.error(result.error); return; }
    setAppliedCoupon(result.data);
    setActiveBill((prev: any) => prev ? { ...prev, discountAmount: result.data.discount, totalAmount: result.data.bill.totalAmount } : prev);
    toast.success(`Coupon ${couponCode.toUpperCase()} applied — ${formatCurrency(result.data.discount)} off`);
    setShowCoupon(false);
  };

  const handleApplyCorporate = async (accountId: string) => {
    if (!activeBill) return;
    const result: any = await applyCorporateAccountToBill(activeBill.id, accountId);
    if (result.error) { toast.error(result.error); return; }
    setSelectedCorpAccount(corpAccounts.find((a: any) => a.id === accountId));
    toast.success("Corporate account assigned");
    setShowCorp(false);
  };

  const handleLookupCustomer = async () => {
    if (!customerPhone) return;
    const result: any = await getCustomerByPhone(customerPhone);
    if (result.error) { toast.error(result.error); return; }
    if (!result.data) { toast.error("Customer not found"); return; }
    setFoundCustomer(result.data);
    toast.success(`Found: ${result.data.name} (${result.data.loyaltyPoints} pts)`);
  };

  const handlePrintReceipt = () => {
    if (!activeBill) return;
    const items = (activeBill.order?.items || []).map((i: any) => ({
      name: i.menuItemName,
      qty: i.quantity,
      price: i.pricePerUnit,
      total: i.pricePerUnit * i.quantity,
    }));
    const html = formatReceiptHTML({
      restaurantName: restaurant?.name || "Restaurant",
      address: "",
      phone: "",
      billNumber: activeBill.billNumber,
      items,
      subtotal: activeBill.subtotal,
      taxAmount: activeBill.taxAmount,
      serviceCharge: activeBill.serviceCharge,
      discountAmount: activeBill.discountAmount,
      totalAmount: activeBill.totalAmount,
      amountPaid: activeBill.amountPaid,
      change: activeBill.change,
      paymentMethod: activeBill.paymentMethod,
      date: new Date().toLocaleString(),
    });
    printReceipt(html);
  };

  const handleScannerBarcode = (barcode: string) => {
    setSearchQuery(barcode);
    toast.info(`Scanned: ${barcode}`);
  };

  const handleGenerateQR = async () => {
    if (!activeBill) return;
    const due = remainingDue;
    if (due <= 0) { toast.error("No amount due"); return; }
    const result: any = await generatePaymentQR({ billId: activeBill.id, method: payMethod, amount: due });
    if (result.error) { toast.error(result.error); return; }
    setPaymentQR(result.data);
    setShowQR(true);
  };

  const handleManualVerify = async (paymentId: string) => {
    setVerifyingPaymentId(paymentId);
    const result: any = await verifyPayment(paymentId);
    setVerifyingPaymentId(null);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Payment verified");
    const billRes: any = await getBill(activeBill!.id);
    if (!("error" in billRes) && billRes.data) setActiveBill(billRes.data);
    refresh();
  };

  const handleRefreshWalletStatus = async () => {
    if (!activeBill) return;
    const result: any = await getPendingWalletPayments(activeBill.id);
    if (!("error" in result) && result.data) setPendingWalletPayments(result.data);
  };

  useEffect(() => {
    if (!activeBill) { setPaymentQR(null); setShowQR(false); setPendingWalletPayments([]); return; }
    handleRefreshWalletStatus();
    const interval = setInterval(handleRefreshWalletStatus, 8_000);
    return () => clearInterval(interval);
  }, [activeBill?.id]);

  const remainingDue = activeBill
    ? Math.max(0, activeBill.totalAmount - activeBill.amountPaid)
    : 0;

  const changeValue = amountReceived
    ? Math.max(0, parseFloat(amountReceived) - remainingDue)
    : 0;

  if (loading && pendingBills.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ScannerInput onScan={handleScannerBarcode} />
      <div className="border-b bg-card sticky top-0 z-40">
        <div className="max-w-full px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Cashier Checkout</h1>
              <Badge className="bg-primary text-primary-foreground text-base px-3 py-1">
                {readyToBillOrders.length + activePendingBills.length} Pending
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCashDrawerPop}>
                <DollarSign className="w-4 h-4 mr-1" /> Pop Drawer
              </Button>
              <Button variant="outline" size="sm" onClick={refresh}>
                <RotateCcw className="w-4 h-4 mr-1" /> Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Left: Order selection */}
          <div className="xl:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by order #, table, or customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-0 p-0 h-8 focus-visible:ring-0"
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Tabs
                  defaultValue="ready"
                  value={orderTypeFilter === "all" ? "ready" : orderTypeFilter}
                  onValueChange={(v) => setOrderTypeFilter(v as any)}
                >
                  <TabsList className="w-full">
                    <TabsTrigger value="ready" className="flex-1">Ready</TabsTrigger>
                    <TabsTrigger value="DINE_IN" className="flex-1">Dine-in</TabsTrigger>
                    <TabsTrigger value="TAKEAWAY" className="flex-1">Takeaway</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>

            {heldBills.length > 0 && (
              <Card>
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-sm flex items-center gap-1">
                            <Pause className="w-4 h-4" /> Parked Bills ({heldBills.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {heldBills.map((bill: any) => (
                    <div
                      key={bill.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer"
                      onClick={() => handleResumeHeld(bill)}
                    >
                      <div>
                        <p className="text-sm font-medium">{bill.billNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {bill.order?.table
                            ? `Table ${bill.order.table.tableNumber}`
                            : "Takeaway"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {formatCurrency(bill.totalAmount)}
                        </span>
                        <Button size="icon" variant="ghost" className="h-7 w-7">
                          <Play className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm">
                  Ready to Bill ({readyToBillOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <ScrollArea className="h-[400px]">
                  <AnimatePresence>
                    {readyToBillOrders.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No orders ready to bill
                      </p>
                    )}
                    {readyToBillOrders.map((order: any) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer mb-1"
                        onClick={() => handleSelectOrder(order)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">#{order.orderId}</p>
                            <Badge variant="outline" className="text-[10px] h-4">
                              {order.orderType === "DINE_IN" ? `T${order.table?.tableNumber}` : "TW"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {order.items?.slice(0, 2).map((i: any) => i.menuItemName).join(", ")}
                            {order.items?.length > 2 && ` +${order.items.length - 2}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <span className="text-sm font-semibold whitespace-nowrap">
                            {formatCurrency(order.totalAmount)}
                          </span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </ScrollArea>
              </CardContent>
            </Card>

            {orderTypeFilter !== "DINE_IN" && (
              <Card>
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-sm flex items-center gap-1">
                    <ShoppingBag className="w-4 h-4" /> Express Takeaway
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-1.5">
                    {topItems.map((item: any) => (
                      <Button
                        key={item.id}
                        variant="outline"
                        size="sm"
                        className="justify-between h-auto py-1.5 text-xs"
                        onClick={() => handleAddItemToTakeaway(item)}
                      >
                        <span className="truncate">{item.name}</span>
                        <span className="text-muted-foreground ml-1">
                          {formatCurrency(item.price)}
                        </span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Active checkout */}
          <div className="xl:col-span-2">
            {activeBill ? (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Bill summary */}
                <div className="lg:col-span-3 space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-base">
                            {activeBill.billNumber}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {activeBill.order?.table
                              ? `Table ${activeBill.order.table.tableNumber}`
                              : "Takeaway"}{" "}
                            · {activeBill.order?.orderType}
                            {" · "}
                            {activeBill.order?.items?.length || 0} items
                          </p>
                        </div>
                        <Badge
                          className={
                            activeBill.status === "PAID"
                              ? "bg-success"
                              : activeBill.status === "HELD"
                              ? "bg-warning"
                              : "bg-info"
                          }
                        >
                          {activeBill.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="max-h-[300px]">
                        <div className="space-y-2">
                          {activeBill.order?.items?.map((item: any) => (
                            <div
                              key={item.id}
                              className="flex justify-between text-sm py-1"
                            >
                              <span>
                                {item.quantity}x {item.menuItemName}
                              </span>
                              <span className="font-medium">
                                {formatCurrency(item.pricePerUnit * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <Separator className="my-3" />
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Subtotal</span>
                          <span>{formatCurrency(activeBill.subtotal)}</span>
                        </div>
                          <div className="flex justify-between text-muted-foreground">
                              <span>VAT</span>
                              <span>{formatCurrency(activeBill.taxAmount)}</span>
                            </div>
                        {activeBill.serviceCharge > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>Service Charge</span>
                            <span>{formatCurrency(activeBill.serviceCharge)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-semibold text-base">
                          <span>Total</span>
                          <span>{formatCurrency(activeBill.totalAmount)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bill splitting */}
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Split Bill</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSplit(!showSplit)}
                        >
                          {showSplit ? "Hide" : "Split"}
                        </Button>
                      </div>
                    </CardHeader>
                    {showSplit && (
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-2 mb-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSplitCount(Math.max(2, splitCount - 1))}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="font-semibold min-w-[2rem] text-center">
                            {splitCount}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSplitCount(Math.min(10, splitCount + 1))}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm text-muted-foreground ml-2">
                            equal split
                          </span>
                          <Button
                            size="sm"
                            onClick={handleSplit}
                            className="ml-auto"
                          >
                            Calculate
                          </Button>
                        </div>
                        {splitResult && (
                          <div className="space-y-1 bg-muted/50 p-3 rounded">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Split amounts ({splitResult.length} ways):
                            </p>
                            {splitResult.map((s, i) => (
                              <div
                                key={i}
                                className="flex justify-between text-sm"
                              >
                                <span>{s.label}</span>
                                <span className="font-medium">
                                  {formatCurrency(s.amount)}
                                </span>
                              </div>
                            ))}
                            <Separator className="my-1" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Total</span>
                              <span>
                                {formatCurrency(
                                  splitResult.reduce((s, r) => s + r.amount, 0)
                                )}
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>

                  {/* Discount, Coupon, Corporate */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Discounts & Billing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex gap-2">
                        <Button variant={showDiscount ? "default" : "outline"} size="sm" onClick={() => setShowDiscount(!showDiscount)} className="flex-1">
                          <Percent className="w-3 h-3 mr-1" /> Discount
                        </Button>
                        <Button variant={showCoupon ? "default" : "outline"} size="sm" onClick={() => setShowCoupon(!showCoupon)} className="flex-1">
                          <Tag className="w-3 h-3 mr-1" /> Coupon
                        </Button>
                        <Button variant={showCorp ? "default" : "outline"} size="sm" onClick={() => setShowCorp(!showCorp)} className="flex-1">
                          <Building2 className="w-3 h-3 mr-1" /> Corporate
                        </Button>
                      </div>

                      {showDiscount && (
                        <div className="space-y-2 p-2 bg-muted/30 rounded">
                          <Input type="number" placeholder="Discount amount" value={discountInput} onChange={(e) => setDiscountInput(e.target.value)} />
                          <Input placeholder="Reason (optional)" value={discountReason} onChange={(e) => setDiscountReason(e.target.value)} />
                          <Button size="sm" className="w-full" onClick={handleApplyDiscount}>Apply Discount</Button>
                        </div>
                      )}

                      {showCoupon && (
                        <div className="space-y-2 p-2 bg-muted/30 rounded">
                          <Input placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} />
                          <Button size="sm" className="w-full" onClick={handleApplyCoupon}>Apply Coupon</Button>
                          {appliedCoupon && (
                            <p className="text-xs text-success">Coupon {appliedCoupon.coupon}: {formatCurrency(appliedCoupon.discount)} off</p>
                          )}
                        </div>
                      )}

                      {showCorp && (
                        <div className="space-y-2 p-2 bg-muted/30 rounded">
                          <p className="text-xs text-muted-foreground">Select corporate account:</p>
                          <div className="flex flex-wrap gap-1">
                            {corpAccounts.filter((a: any) => a.isActive).map((a: any) => (
                              <Button key={a.id} variant="outline" size="sm" onClick={() => handleApplyCorporate(a.id)}>
                                {a.companyName}
                              </Button>
                            ))}
                            {corpAccounts.filter((a: any) => a.isActive).length === 0 && (
                              <p className="text-xs text-muted-foreground">No active corporate accounts</p>
                            )}
                          </div>
                          {selectedCorpAccount && (
                            <p className="text-xs text-success">Assigned: {selectedCorpAccount.companyName}</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Customer lookup */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-1">
                        <Users className="w-4 h-4" /> Customer
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Phone number"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                        <Button variant="outline" size="sm" onClick={handleLookupCustomer}>
                          <Search className="w-3 h-3" />
                        </Button>
                      </div>
                      {foundCustomer && (
                        <div className="mt-2 text-xs bg-muted/30 p-2 rounded space-y-0.5">
                          <p className="font-medium">{foundCustomer.name}</p>
                          <p className="text-muted-foreground">{foundCustomer.phone}</p>
                          <p className="text-primary">{foundCustomer.loyaltyPoints} loyalty points</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleHold}
                      disabled={activeBill.status === "PAID"}
                      className="flex-1"
                    >
                      <Pause className="w-4 h-4 mr-1" /> Park Bill
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={handlePrintReceipt}>
                      <Printer className="w-4 h-4 mr-1" /> Print
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Send className="w-4 h-4 mr-1" /> Send Digital
                    </Button>
                  </div>
                </div>

                {/* Payment entry */}
                <div className="lg:col-span-2 space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Payment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Method</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {PAYMENT_METHODS.map((pm) => {
                            const Icon = pm.Icon;
                            return (
                              <Button
                                key={pm.id}
                                variant={payMethod === pm.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPayMethod(pm.id)}
                                className={`justify-start gap-1.5 h-9 ${
                                  payMethod === pm.id ? pm.color : ""
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                                {pm.label}
                              </Button>
                            );
                          })}
                        </div>
                      </div>

                      {/* QR code for wallet payments */}
                      {payMethod !== "CASH" && payMethod !== "CORPORATE" && (
                        <div>
                          <div className="flex gap-2 mb-2">
                            <Button variant="outline" size="sm" className="flex-1" onClick={handleGenerateQR}>
                              <Smartphone className="w-3 h-3 mr-1" /> Generate QR
                            </Button>
                          </div>
                          {showQR && paymentQR && (
                            <div className="flex flex-col items-center p-3 bg-muted/30 rounded">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={paymentQR.qrDataUrl} alt="Payment QR" className="w-40 h-40" />
                              <p className="text-xs text-muted-foreground mt-1">Scan to pay {formatCurrency(remainingDue)} via {payMethod}</p>
                              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Ref: {paymentQR.ref}</p>
                            </div>
                          )}
                          {pendingWalletPayments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              <p className="text-xs text-muted-foreground">Pending wallet payments:</p>
                              {pendingWalletPayments.map((p: any) => (
                                <div key={p.id} className="flex items-center justify-between text-xs bg-muted/30 p-1.5 rounded">
                                  <span>{p.method} — {formatCurrency(p.amount)}</span>
                                  <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => handleManualVerify(p.id)} disabled={verifyingPaymentId === p.id}>
                                    {verifyingPaymentId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Verify"}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Amount received */}
                      {payMethod === "CASH" && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Amount Received
                          </p>
                          <Input
                            type="number"
                            placeholder={remainingDue.toFixed(2)}
                            value={amountReceived}
                            onChange={(e) => setAmountReceived(e.target.value)}
                            className="text-lg font-semibold"
                          />
                          {/* Quick amounts */}
                          <div className="flex gap-1.5 mt-2">
                            {QUICK_AMOUNTS.map((amt) => (
                              <Button
                                key={amt}
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuickAmount(amt)}
                                className="flex-1 text-xs"
                              >
                                {formatCurrency(amt)}
                              </Button>
                            ))}
                          </div>
                          {/* Change display */}
                          {changeValue > 0 && (
                            <div className="mt-2 p-2 bg-success/10 border border-success/20 rounded text-center">
                              <p className="text-xs text-muted-foreground">
                                Change to return
                              </p>
                              <p className="text-lg font-bold text-success">
                                {formatCurrency(changeValue)}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Running balance */}
                      <div className="space-y-1 bg-muted/50 p-3 rounded">
                        <div className="flex justify-between text-sm">
                          <span>Total</span>
                          <span>{formatCurrency(activeBill.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Paid</span>
                          <span>{formatCurrency(activeBill.amountPaid)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold text-base">
                          <span>Due</span>
                          <span
                            className={
                              remainingDue <= 0 ? "text-success" : "text-destructive"
                            }
                          >
                            {formatCurrency(remainingDue)}
                          </span>
                        </div>
                      </div>

                      {/* Payment history */}
                      {activeBill.payments?.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Tender History
                          </p>
                          <div className="space-y-1">
                            {activeBill.payments.map((p: any) => (
                              <div
                                key={p.id}
                                className="flex justify-between text-xs bg-muted/30 p-1.5 rounded"
                              >
                                <span>{p.method}</span>
                                <span className="font-medium">
                                  {formatCurrency(p.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="space-y-2">
                        {remainingDue > 0 && (
                          <Button
                            className="w-full gap-1"
                            disabled={isProcessing}
                            onClick={
                              payMethod === "CASH"
                                ? handleRecordPayment
                                : handleQuickSettle
                            }
                          >
                            {isProcessing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : null}
                            {payMethod === "CASH" && amountReceived
                              ? `Pay ${formatCurrency(Math.min(parseFloat(amountReceived) || remainingDue, remainingDue))}`
                              : `Pay ${formatCurrency(remainingDue)}`}
                          </Button>
                        )}
                        {remainingDue <= 0 && activeBill.status !== "PAID" && (
                          <Button
                            className="w-full gap-1"
                            disabled={isProcessing}
                            onClick={handleQuickSettle}
                          >
                            {isProcessing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : null}
                            Confirm Payment
                          </Button>
                        )}
                        {activeBill.status === "PAID" && (
                          <div className="text-center p-2 bg-success/10 rounded">
                            <p className="text-sm font-semibold text-success">
                              Payment Complete
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Change: {formatCurrency(activeBill.change)}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <Banknote className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h2 className="text-xl font-semibold text-muted-foreground mb-2">
                  No Active Checkout
                </h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  Select an order from the left panel to start billing.
                  Ready-to-bill orders appear automatically when their food
                  is marked "Served".
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
