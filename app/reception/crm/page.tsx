"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Users,
  Tag,
  Building2,
  Plus,
  Search,
  Loader2,
  X,
  Check,
  Phone,
  Mail,
  Star,
  RotateCcw,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import {
  getCustomers,
  searchCustomers,
  createCustomer,
  addLoyaltyPoints,
} from "@/lib/actions/crm";
import {
  getCoupons,
  createCoupon,
  toggleCoupon,
} from "@/lib/actions/crm";
import {
  getCorporateAccounts,
  createCorporateAccount,
  toggleCorporateAccount,
} from "@/lib/actions/crm";

export default function CrmPage() {
  const { restaurant } = useAuthStore();
  const restaurantId = restaurant?.id;

  const [customers, setCustomers] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [corpAccounts, setCorpAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [customerQuery, setCustomerQuery] = useState("");
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "", dietaryNotes: "" });
  const [creating, setCreating] = useState(false);

  const [showNewCoupon, setShowNewCoupon] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: "", discountType: "PERCENTAGE", discountValue: "", validFrom: "", validUntil: "", usageLimit: "" });
  const [creatingCoupon, setCreatingCoupon] = useState(false);

  const [showNewCorp, setShowNewCorp] = useState(false);
  const [newCorp, setNewCorp] = useState({ companyName: "", contactName: "", contactPhone: "", billingAddress: "" });
  const [creatingCorp, setCreatingCorp] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [loyaltyPointsToAdd, setLoyaltyPointsToAdd] = useState("");
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState("");
  const [addingPoints, setAddingPoints] = useState(false);
  const [redeemingPoints, setRedeemingPoints] = useState(false);
  const [toggleConfirmTarget, setToggleConfirmTarget] = useState<{ id: string; type: 'coupon' | 'corp'; isActive: boolean } | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    const [custRes, coupRes, corpRes] = await Promise.all([
      getCustomers(100),
      getCoupons(),
      getCorporateAccounts(),
    ]);
    if ("data" in custRes && custRes.data) setCustomers(custRes.data);
    if ("data" in coupRes && coupRes.data) setCoupons(coupRes.data);
    if ("data" in corpRes && corpRes.data) setCorpAccounts(corpRes.data);
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    refresh();
  }, [restaurantId, refresh]);

  const handleSearchCustomers = useCallback(async (q?: string) => {
    const query = q ?? customerQuery;
    if (!query) { refresh(); return; }
    const result: any = await searchCustomers(query);
    if ("data" in result && result.data) setCustomers(result.data);
  }, [customerQuery, refresh]);

  const triggerCustomerSearch = useCallback((q: string) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => handleSearchCustomers(q), 350);
  }, [handleSearchCustomers]);

  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) { toast.error("Name and phone required"); return; }
    setCreating(true);
    const result: any = await createCustomer(newCustomer);
    setCreating(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Customer created");
    setShowNewCustomer(false);
    setNewCustomer({ name: "", phone: "", email: "", dietaryNotes: "" });
    refresh();
  };

  const handleAddLoyaltyPoints = async () => {
    if (!selectedCustomer) return;
    const pts = parseInt(loyaltyPointsToAdd);
    if (isNaN(pts) || pts <= 0) { toast.error("Enter valid points"); return; }
    setAddingPoints(true);
    const result: any = await addLoyaltyPoints(selectedCustomer.id, pts);
    setAddingPoints(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success(`${pts} points added`);
    setSelectedCustomer((prev: any) => prev ? { ...prev, loyaltyPoints: prev.loyaltyPoints + pts } : prev);
    setLoyaltyPointsToAdd("");
  };

  const handleRedeemPoints = async () => {
    if (!selectedCustomer) return;
    const pts = parseInt(loyaltyPointsToRedeem);
    if (isNaN(pts) || pts <= 0) { toast.error("Enter valid points"); return; }
    if (pts > (selectedCustomer.loyaltyPoints || 0)) { toast.error("Not enough points"); return; }
    setRedeemingPoints(true);
    const result: any = await addLoyaltyPoints(selectedCustomer.id, -pts);
    setRedeemingPoints(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success(`${pts} points redeemed`);
    setSelectedCustomer((prev: any) => prev ? { ...prev, loyaltyPoints: prev.loyaltyPoints - pts } : prev);
    setLoyaltyPointsToRedeem("");
  };

  const handleCreateCoupon = async () => {
    if (!newCoupon.code || !newCoupon.discountValue || !newCoupon.validFrom || !newCoupon.validUntil) {
      toast.error("Code, value, and dates required"); return;
    }
    setCreatingCoupon(true);
    const result: any = await createCoupon({
      code: newCoupon.code,
      discountType: newCoupon.discountType,
      discountValue: parseFloat(newCoupon.discountValue),
      validFrom: newCoupon.validFrom,
      validUntil: newCoupon.validUntil,
      usageLimit: newCoupon.usageLimit ? parseInt(newCoupon.usageLimit) : undefined,
    });
    setCreatingCoupon(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Coupon created");
    setShowNewCoupon(false);
    setNewCoupon({ code: "", discountType: "PERCENTAGE", discountValue: "", validFrom: "", validUntil: "", usageLimit: "" });
    refresh();
  };

  const handleToggleCoupon = async (id: string) => {
    const result: any = await toggleCoupon(id);
    if (result.error) { toast.error(result.error); return; }
    refresh();
  };

  const confirmToggleCoupon = async () => {
    if (!toggleConfirmTarget || toggleConfirmTarget.type !== 'coupon') return;
    await handleToggleCoupon(toggleConfirmTarget.id);
    setToggleConfirmTarget(null);
  };

  const handleCreateCorp = async () => {
    if (!newCorp.companyName) { toast.error("Company name required"); return; }
    setCreatingCorp(true);
    const result: any = await createCorporateAccount(newCorp);
    setCreatingCorp(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Corporate account created");
    setShowNewCorp(false);
    setNewCorp({ companyName: "", contactName: "", contactPhone: "", billingAddress: "" });
    refresh();
  };

  const handleToggleCorp = async (id: string) => {
    const result: any = await toggleCorporateAccount(id);
    if (result.error) { toast.error(result.error); return; }
    refresh();
  };

  const confirmToggleCorp = async () => {
    if (!toggleConfirmTarget || toggleConfirmTarget.type !== 'corp') return;
    await handleToggleCorp(toggleConfirmTarget.id);
    setToggleConfirmTarget(null);
  };

  if (loading && customers.length === 0) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card sticky top-0 z-40">
        <div className="max-w-full px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">CRM & Discounts</h1>
            <Button variant="outline" size="sm" onClick={refresh}>
              <RotateCcw className="w-4 h-4 mr-1" /> Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue="customers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="customers" className="gap-1">
              <Users className="w-4 h-4" /> Customers ({customers.length})
            </TabsTrigger>
            <TabsTrigger value="coupons" className="gap-1">
              <Tag className="w-4 h-4" /> Coupons ({coupons.length})
            </TabsTrigger>
            <TabsTrigger value="corporate" className="gap-1">
              <Building2 className="w-4 h-4" /> Corporate Accounts ({corpAccounts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customers" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search by name or phone..."
                    value={customerQuery}
                    onChange={(e) => { setCustomerQuery(e.target.value); triggerCustomerSearch(e.target.value); }}
                  />
                </div>
              </div>
              <Button onClick={() => setShowNewCustomer(true)}>
                <Plus className="w-4 h-4 mr-1" /> New Customer
              </Button>
            </div>

            {showNewCustomer && (
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Input placeholder="Name *" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} />
                    <Input placeholder="Phone *" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
                    <Input placeholder="Email" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} />
                    <Input placeholder="Dietary notes" value={newCustomer.dietaryNotes} onChange={(e) => setNewCustomer({ ...newCustomer, dietaryNotes: e.target.value })} />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowNewCustomer(false)}>Cancel</Button>
                    <Button onClick={handleCreateCustomer} disabled={creating}>
                      {creating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Create
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-4">
                {customers.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">No customers found</p>
                ) : (
                  <ScrollArea className="max-h-[600px]">
                    <div className="space-y-2">
                      {customers.map((c: any) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer"
                          onClick={() => setSelectedCustomer(c)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{c.name}</span>
                              <Badge variant="outline" className="text-[10px] h-4">
                                {c.loyaltyPoints} pts
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</span>
                              {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</span>}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {selectedCustomer && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{selectedCustomer.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Phone:</span> {selectedCustomer.phone}</div>
                    <div><span className="text-muted-foreground">Email:</span> {selectedCustomer.email || "—"}</div>
                    <div><span className="text-muted-foreground">Dietary notes:</span> {selectedCustomer.dietaryNotes || "—"}</div>
                    <div><span className="text-muted-foreground">Member since:</span> {formatDate(selectedCustomer.createdAt)}</div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-1 flex items-center gap-1">
                      <Star className="w-4 h-4 text-warning" /> Loyalty Points: {selectedCustomer.loyaltyPoints}
                    </p>
                    <div className="flex gap-2 mb-2">
                      <Input
                        type="number"
                        placeholder="Points to add"
                        value={loyaltyPointsToAdd}
                        onChange={(e) => setLoyaltyPointsToAdd(e.target.value)}
                        className="w-36"
                      />
                      <Button size="sm" onClick={handleAddLoyaltyPoints} disabled={addingPoints}>
                        {addingPoints ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                        Add
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Points to redeem"
                        value={loyaltyPointsToRedeem}
                        onChange={(e) => setLoyaltyPointsToRedeem(e.target.value)}
                        className="w-36"
                      />
                      <Button size="sm" variant="outline" onClick={handleRedeemPoints} disabled={redeemingPoints}>
                        {redeemingPoints ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Minus className="w-4 h-4 mr-1" />}
                        Redeem
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="coupons" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{coupons.filter((c: any) => c.isActive).length} active coupons</p>
              <Button onClick={() => setShowNewCoupon(true)}>
                <Plus className="w-4 h-4 mr-1" /> New Coupon
              </Button>
            </div>

            {showNewCoupon && (
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input placeholder="Code *" value={newCoupon.code} onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })} />
                    <Select value={newCoupon.discountType} onValueChange={(v) => setNewCoupon({ ...newCoupon, discountType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                        <SelectItem value="FIXED">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" placeholder="Value *" value={newCoupon.discountValue} onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input type="date" placeholder="Valid from *" value={newCoupon.validFrom} onChange={(e) => setNewCoupon({ ...newCoupon, validFrom: e.target.value })} />
                    <Input type="date" placeholder="Valid until *" value={newCoupon.validUntil} onChange={(e) => setNewCoupon({ ...newCoupon, validUntil: e.target.value })} />
                    <Input type="number" placeholder="Usage limit" value={newCoupon.usageLimit} onChange={(e) => setNewCoupon({ ...newCoupon, usageLimit: e.target.value })} />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowNewCoupon(false)}>Cancel</Button>
                    <Button onClick={handleCreateCoupon} disabled={creatingCoupon}>
                      {creatingCoupon ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Create
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-4">
                {coupons.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">No coupons created</p>
                ) : (
                  <div className="space-y-2">
                    {coupons.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold">{c.code}</span>
                            <Badge className={c.isActive ? "bg-success" : "bg-muted"}>{c.isActive ? "Active" : "Inactive"}</Badge>
                            <Badge variant="outline">{c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : formatCurrency(c.discountValue)}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Valid: {formatDate(c.validFrom)} - {formatDate(c.validUntil)}
                            {c.usageLimit && ` · Used: ${c.usageCount}/${c.usageLimit}`}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => { if (!c.isActive) { handleToggleCoupon(c.id); } else { setToggleConfirmTarget({ id: c.id, type: 'coupon', isActive: c.isActive }); } }}>
                          {c.isActive ? <X className="w-3 h-3 text-destructive" /> : <Check className="w-3 h-3 text-success" />}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="corporate" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{corpAccounts.filter((a: any) => a.isActive).length} active accounts</p>
              <Button onClick={() => setShowNewCorp(true)}>
                <Plus className="w-4 h-4 mr-1" /> New Account
              </Button>
            </div>

            {showNewCorp && (
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input placeholder="Company name *" value={newCorp.companyName} onChange={(e) => setNewCorp({ ...newCorp, companyName: e.target.value })} />
                    <Input placeholder="Contact name" value={newCorp.contactName} onChange={(e) => setNewCorp({ ...newCorp, contactName: e.target.value })} />
                    <Input placeholder="Contact phone" value={newCorp.contactPhone} onChange={(e) => setNewCorp({ ...newCorp, contactPhone: e.target.value })} />
                    <Input placeholder="Billing address" value={newCorp.billingAddress} onChange={(e) => setNewCorp({ ...newCorp, billingAddress: e.target.value })} />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowNewCorp(false)}>Cancel</Button>
                    <Button onClick={handleCreateCorp} disabled={creatingCorp}>
                      {creatingCorp ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Create
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-4">
                {corpAccounts.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">No corporate accounts</p>
                ) : (
                  <div className="space-y-2">
                    {corpAccounts.map((a: any) => (
                      <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{a.companyName}</span>
                            <Badge className={a.isActive ? "bg-success" : "bg-muted"}>{a.isActive ? "Active" : "Inactive"}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {a.contactName && `${a.contactName} · `}{a.contactPhone}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => { if (!a.isActive) { handleToggleCorp(a.id); } else { setToggleConfirmTarget({ id: a.id, type: 'corp', isActive: a.isActive }); } }}>
                          {a.isActive ? <X className="w-3 h-3 text-destructive" /> : <Check className="w-3 h-3 text-success" />}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <AlertDialog open={!!toggleConfirmTarget} onOpenChange={(o) => !o && setToggleConfirmTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {toggleConfirmTarget?.type === 'coupon' ? 'coupon' : 'corporate account'}?</AlertDialogTitle>
            <AlertDialogDescription>This will mark it as inactive. You can re-activate it later.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={toggleConfirmTarget?.type === 'coupon' ? confirmToggleCoupon : confirmToggleCorp}>
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
