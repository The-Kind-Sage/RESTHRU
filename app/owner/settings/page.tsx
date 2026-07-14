'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Bell, Loader2, Plus, Trash2, Upload, Percent, AlertTriangle } from 'lucide-react';
import { uploadImage } from '@/lib/upload';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';
import {
  getRestaurant, getSettingsData, getActiveSubscription,
  updateRestaurant, upsertSettings, updateRestaurantDirect, updateCoverPhoto, setUserPassword, cancelSubscription,
  getAvailablePlans, subscribeToPlan,
} from '@/lib/actions/settings';
import {
  getTaxRates, createTaxRate, updateTaxRate, deleteTaxRate,
} from '@/lib/actions/tax';

interface RestaurantData {
  name: string;
  address: string;
  phone: string;
  email: string;
  cover_url: string;
  pan_number: string;
  vat_registered: boolean;
  vat_number: string;
  operating_hours: Record<string, { open: string; close: string; enabled: boolean }>;
  language: string;
  currency: string;
  timezone: string;
}

interface SettingsData {
  vat_rate: number;
  bill_footer_message: string;
  vat_on_receipt: boolean;
  esewa_config: { merchant_id: string; secret: string; enabled: boolean };
  khalti_config: { api_key: string; secret: string; enabled: boolean };
  fonepay_config: { merchant_id: string; secret: string; enabled: boolean };
  notification_preferences: {
    order_sound: boolean;
    order_popup: boolean;
    stock_email: boolean;
    stock_inapp: boolean;
    bill_sound: boolean;
    bill_inapp: boolean;
    daily_email: boolean;
    daily_email_time: string;
  };
  printer_config: Array<{ name: string; type: string; ip: string }>;
}

interface SubscriptionData {
  plan_id: string;
  plan_name: string;
  price: number;
  status: string;
  current_period_end: string | null;
  features: string[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DEFAULT_HOURS = Object.fromEntries(
  DAYS.map((day) => [day, { open: '07:00', close: '22:00', enabled: true }])
);
const DEFAULT_NOTIF = {
  order_sound: true,
  order_popup: true,
  stock_email: true,
  stock_inapp: true,
  bill_sound: true,
  bill_inapp: true,
  daily_email: true,
  daily_email_time: '09:00',
};

export default function SettingsPage() {
  const { restaurant: authRestaurant, user } = useAuthStore();
  const restaurantId = authRestaurant?.id;

  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPwd, setIsSavingPwd] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [taxRates, setTaxRates] = useState<any[]>([]);
  const [showNewTaxRate, setShowNewTaxRate] = useState(false);
  const [newTaxRate, setNewTaxRate] = useState({ name: "VAT", rate: "13", type: "VAT", isDefault: true, appliesToItemTypes: "" });
  const [creatingTaxRate, setCreatingTaxRate] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [showTabConfirm, setShowTabConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showSubscribeConfirm, setShowSubscribeConfirm] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<any>(null);

  const [restaurant, setRestaurant] = useState<RestaurantData>({
    name: '',
    address: '',
    phone: '',
    email: '',
    cover_url: '',
    pan_number: '',
    vat_registered: false,
    vat_number: '',
    operating_hours: DEFAULT_HOURS,
    language: 'en',
    currency: 'NPR',
    timezone: 'Asia/Kathmandu',
  });

  const [settings, setSettings] = useState<SettingsData>({
    vat_rate: 13,
    bill_footer_message: '',
    vat_on_receipt: true,
    esewa_config: { merchant_id: '', secret: '', enabled: false },
    khalti_config: { api_key: '', secret: '', enabled: false },
    fonepay_config: { merchant_id: '', secret: '', enabled: false },
    notification_preferences: DEFAULT_NOTIF,
    printer_config: [],
  });

  const loadData = useCallback(async () => {
    if (!restaurantId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [restRes, setRes, subRes, plansRes] = await Promise.all([
        getRestaurant(restaurantId),
        getSettingsData(restaurantId),
        getActiveSubscription(restaurantId),
        getAvailablePlans(),
      ]);

      if (restRes.data) {
        const r = restRes.data as any;
        const rawH = r.operatingHours ?? {};
        const hours = Object.fromEntries(
          DAYS.map((day) => [day, rawH[day] ?? rawH[day.toLowerCase()] ?? { open: '07:00', close: '22:00', enabled: true }])
        );
        setRestaurant({
          name: r.name ?? '',
          address: r.street ?? '',
          phone: r.phoneNumber ?? '',
          email: r.email ?? '',
          cover_url: r.bannerImageUrl ?? '',
          pan_number: r.panNumber ?? '',
          vat_registered: r.vatRegistered ?? false,
          vat_number: r.vatNumber ?? '',
          operating_hours: hours,
          language: r.language ?? 'en',
          currency: r.currency ?? 'NPR',
          timezone: r.timezone ?? 'Asia/Kathmandu',
        });
        if (r.bannerImageUrl) setCoverPreview(r.bannerImageUrl);
      }

      if (setRes.data) {
        const s = setRes.data;
        const parsedSettings = {
          vat_rate: s.vat_rate ?? 13,
          bill_footer_message: s.bill_footer_message ?? '',
          vat_on_receipt: s.vat_on_receipt ?? true,
          esewa_config: s.esewa_config ?? { merchant_id: '', secret: '', enabled: false },
          khalti_config: s.khalti_config ?? { api_key: '', secret: '', enabled: false },
          fonepay_config: s.fonepay_config ?? { merchant_id: '', secret: '', enabled: false },
          notification_preferences: s.notification_preferences ?? DEFAULT_NOTIF,
          printer_config: s.printer_config ?? [],
        };
        setSettings(parsedSettings);
      }

      if (subRes.data) {
        const s = subRes.data as any;
        setSubscription({
          plan_id: s.planId ?? '',
          plan_name: s.plan?.name ?? 'Free',
          price: s.plan?.monthlyPrice ?? 0,
          status: s.status ?? 'active',
          current_period_end: s.endDate ?? null,
          features: s.plan?.features ?? [],
        });
      }

      if (plansRes.data) {
        setAvailablePlans(plansRes.data);
      }

      setIsDirty(false);

      const taxRes = await getTaxRates();
      if ("data" in taxRes && taxRes.data) setTaxRates(taxRes.data);
    } catch (error) {
      console.error('Settings load:', error);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveGeneral = async () => {
    if (!restaurantId) return;
    setIsSaving(true);
    const result = await updateRestaurant(restaurantId, {
      name: restaurant.name,
      street: restaurant.address,
      phoneNumber: restaurant.phone,
      email: restaurant.email,
      currency: restaurant.currency,
      timezone: restaurant.timezone,
    });
    setIsSaving(false);
    if (result.error) { toast.error(result.error); return; }
    setIsDirty(false);
    toast.success('General settings saved');
  };

  const saveBilling = async () => {
    if (!restaurantId) return;
    setIsSaving(true);
    const result = await upsertSettings(restaurantId, {
      vat_rate: settings.vat_rate,
      bill_footer_message: settings.bill_footer_message,
      vat_on_receipt: settings.vat_on_receipt,
    });
    if (result.error) { toast.error(result.error); setIsSaving(false); return; }
    setIsDirty(false);
    toast.success('Billing settings saved');
    setIsSaving(false);
  };

  const savePayments = async () => {
    if (!restaurantId) return;
    setIsSaving(true);
    const result = await upsertSettings(restaurantId, {
      esewa_config: settings.esewa_config,
      khalti_config: settings.khalti_config,
      fonepay_config: settings.fonepay_config,
    });
    if (result.error) { toast.error(result.error); setIsSaving(false); return; }
    setIsDirty(false);
    toast.success('Payment settings saved');
    setIsSaving(false);
  };

  const savePrinters = async () => {
    if (!restaurantId) return;
    setIsSaving(true);
    const result = await upsertSettings(restaurantId, {
      printer_config: settings.printer_config,
    });
    if (result.error) { toast.error(result.error); setIsSaving(false); return; }
    setIsDirty(false);
    toast.success('Printer settings saved');
    setIsSaving(false);
  };

  const saveNotifications = async () => {
    if (!restaurantId) return;
    setIsSaving(true);
    const result = await upsertSettings(restaurantId, {
      notification_preferences: settings.notification_preferences,
    });
    if (result.error) { toast.error(result.error); setIsSaving(false); return; }
    setIsDirty(false);
    toast.success('Notification settings saved');
    setIsSaving(false);
  };

  const changePassword = async () => {
    if (!newPwd) {
      toast.error('Enter a new password');
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error('Passwords do not match');
      return;
    }
    setIsSavingPwd(true);
    const result = await setUserPassword(user?.id || '', newPwd);
    setIsSavingPwd(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Password updated');
    setNewPwd('');
    setConfirmPwd('');
  };

  const handleCoverUpload = async (file: File) => {
    setIsUploadingCover(true);
    const url = await uploadImage(file, 'covers');
    if (url) {
      const result = await updateCoverPhoto(restaurantId!, url);
      if (!result.error) {
        setRestaurant((prev) => ({ ...prev, cover_url: url }));
        toast.success('Cover uploaded');
      } else {
        toast.error('Cover upload failed');
      }
    } else {
      toast.error('Cover upload failed');
    }
    setIsUploadingCover(false);
  };

  const setHours = (day: string, field: 'open' | 'close' | 'enabled', value: string | boolean) => {
    setIsDirty(true);
    setRestaurant((prev) => ({
      ...prev,
      operating_hours: { ...prev.operating_hours, [day]: { ...prev.operating_hours[day], [field]: value } },
    }));
  };

  const setNotif = (key: string, value: boolean | string) => {
    setIsDirty(true);
    setSettings((prev) => ({
      ...prev,
      notification_preferences: { ...prev.notification_preferences, [key]: value },
    }));
  };

  const SaveBtn = ({ onClick }: { onClick: () => void }) => (
    <Button onClick={onClick} disabled={isSaving} className="w-full md:w-auto">
      {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Save Changes'}
    </Button>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="mb-2 h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-8">
          <div className="w-56 space-y-2">{Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} className="h-10 w-full rounded-lg" />)}</div>
          <div className="flex-1 space-y-4">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-14 w-full rounded-lg" />)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your restaurant configuration and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => {
        if (isDirty && v !== activeTab) {
          setPendingTab(v);
          setShowTabConfirm(true);
        } else {
          setActiveTab(v);
        }
      }} className="flex gap-6 lg:gap-8">
        <TabsList className="sticky top-4 flex h-fit w-full flex-col space-y-0.5 self-start bg-transparent p-0 lg:w-56">
          {[
            { value: 'general', label: 'General' },
            { value: 'billing', label: 'Billing & Tax' },
            { value: 'payments', label: 'Payments' },
            { value: 'printers', label: 'Printers' },
            { value: 'notifications', label: 'Notifications' },
            { value: 'subscription', label: 'Subscription' },
            { value: 'security', label: 'Security' },
          ].map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="w-full justify-start rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 data-[state=active]:bg-primary data-[state=active]:text-white">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1">
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Information</CardTitle>
                <CardDescription>Update your restaurant details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2"><Label>Restaurant Name</Label><Input value={restaurant.name} onChange={(event) => { setIsDirty(true); setRestaurant((prev) => ({ ...prev, name: event.target.value })); }} placeholder="Enter restaurant name" /></div>
                <div className="space-y-2">
                  <Label>Cover Photo</Label>
                  <label className="block w-full cursor-pointer overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-primary">
                    {coverPreview ? (
                      <div className="relative">
                        <img src={coverPreview} alt="Cover" className="h-40 w-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
                          <p className="text-sm font-medium text-white">Click to change</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 bg-muted/50 p-8">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{isUploadingCover ? 'Uploading…' : 'Recommended: 1200×400px'}</p>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        setCoverPreview(URL.createObjectURL(file));
                        handleCoverUpload(file);
                      }
                    }} />
                  </label>
                </div>
                <Separator />
                <div className="space-y-2"><Label>Address</Label><Input value={restaurant.address} onChange={(event) => { setIsDirty(true); setRestaurant((prev) => ({ ...prev, address: event.target.value })); }} placeholder="Street address" /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={restaurant.phone} onChange={(event) => { setIsDirty(true); setRestaurant((prev) => ({ ...prev, phone: event.target.value })); }} placeholder="+977-9XXXXXXXXX" /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={restaurant.email} onChange={(event) => { setIsDirty(true); setRestaurant((prev) => ({ ...prev, email: event.target.value })); }} placeholder="restaurant@example.com" /></div>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold">Operating Hours</h3>
                  {DAYS.map((day) => (
                    <div key={day} className="flex items-center gap-4">
                      <div className="w-24"><p className="text-sm font-medium">{day}</p></div>
                      <div className="flex flex-1 items-center gap-2">
                        <Input type="time" className="w-32" value={restaurant.operating_hours[day]?.open ?? '07:00'} onChange={(event) => setHours(day, 'open', event.target.value)} />
                        <span className="text-muted-foreground">to</span>
                        <Input type="time" className="w-32" value={restaurant.operating_hours[day]?.close ?? '22:00'} onChange={(event) => setHours(day, 'close', event.target.value)} />
                      </div>
                      <Switch checked={restaurant.operating_hours[day]?.enabled ?? true} onCheckedChange={(value) => setHours(day, 'enabled', value)} />
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <div className="flex gap-4">
                      {[{ value: 'en', label: 'English' }, { value: 'ne', label: 'Nepali' }].map((option) => (
                        <label key={option.value} className="flex cursor-pointer items-center gap-2">
                          <input type="radio" name="language" checked={restaurant.language === option.value} onChange={() => { setIsDirty(true); setRestaurant((prev) => ({ ...prev, language: option.value })); }} />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2"><Label>Currency</Label><Input value={restaurant.currency} onChange={(event) => { setIsDirty(true); setRestaurant((prev) => ({ ...prev, currency: event.target.value })); }} placeholder="NPR" />
                    <p className="text-xs text-muted-foreground mt-1">Currently-locked currency. Contact support to change your billing currency.</p>
                  </div>
                </div>
                <div className="space-y-2"><Label>Timezone</Label><Input value={restaurant.timezone} onChange={(event) => { setIsDirty(true); setRestaurant((prev) => ({ ...prev, timezone: event.target.value })); }} placeholder="Asia/Kathmandu" /></div>
                <SaveBtn onClick={saveGeneral} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tax Information</CardTitle>
                <CardDescription>Configure tax and billing details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2"><Label>PAN Number</Label><Input value={restaurant.pan_number} onChange={(event) => { setIsDirty(true); setRestaurant((prev) => ({ ...prev, pan_number: event.target.value })); }} placeholder="Enter PAN number" /></div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div><p className="font-medium">VAT Registered</p><p className="text-sm text-muted-foreground">Is your restaurant VAT registered?</p></div>
                  <Switch checked={restaurant.vat_registered} onCheckedChange={(value) => { setIsDirty(true); setRestaurant((prev) => ({ ...prev, vat_registered: value })); }} />
                </div>
                {restaurant.vat_registered && <div className="space-y-2"><Label>VAT Registration Number</Label><Input value={restaurant.vat_number} onChange={(event) => { setIsDirty(true); setRestaurant((prev) => ({ ...prev, vat_number: event.target.value })); }} placeholder="Enter VAT number" /></div>}
                <div className="space-y-2"><Label>Default Tax Rate (%)</Label><Input type="number" value={settings.vat_rate} onChange={(event) => { setIsDirty(true); setSettings((prev) => ({ ...prev, vat_rate: parseFloat(event.target.value) || 0 })); }} placeholder="13" />
                  <p className="text-xs text-muted-foreground">Fallback rate used when no specific tax rate applies. Add specific rates below.</p>
                </div>
                <div className="space-y-2"><Label>Bill Footer Message</Label><textarea className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Thank you for your visit!" value={settings.bill_footer_message} onChange={(event) => { setIsDirty(true); setSettings((prev) => ({ ...prev, bill_footer_message: event.target.value })); }} /></div>
                <Separator />
                <div className="space-y-3"><h3 className="font-semibold">Receipt Preview</h3><div className="mx-auto w-full max-w-sm space-y-1 rounded-lg border bg-muted/30 p-4 font-mono text-xs"><p className="text-center font-bold">{restaurant.name || 'Your Restaurant'}</p>{restaurant.address && <p className="text-center text-[10px]">{restaurant.address}</p>}<div className="my-2 border-b" /><p className="text-center text-[10px] italic text-muted-foreground">Items will appear here</p><div className="my-2 border-b" />{restaurant.vat_registered && settings.vat_on_receipt && <p className="flex justify-between"><span>VAT ({settings.vat_rate}%):</span><span>—</span></p>}<div className="my-2 border-b" />{settings.bill_footer_message && <p className="text-center text-[10px]">{settings.bill_footer_message}</p>}</div></div>
                <div className="flex items-center justify-between"><Label>Enable VAT on Receipt</Label><Switch checked={settings.vat_on_receipt} onCheckedChange={(value) => { setIsDirty(true); setSettings((prev) => ({ ...prev, vat_on_receipt: value })); }} /></div>
                <SaveBtn onClick={saveBilling} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Percent className="w-4 h-4" /> Tax Rates</CardTitle>
                <CardDescription>Manage tax rates for different item categories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {taxRates.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No tax rates configured. Add one below.</p>
                    <p className="text-xs text-muted-foreground mt-1">The system will fall back to the restaurant's default tax rate (currently {settings.vat_rate}%).</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {taxRates.map((tr: any) => (
                      <div key={tr.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{tr.name}</span>
                            <span className="text-sm font-mono">{tr.rate}%</span>
                            <span className="text-xs text-muted-foreground">{tr.type}</span>
                            {tr.isDefault && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Default</span>}
                          </div>
                          {tr.appliesToItemTypes.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5">Applies to: {tr.appliesToItemTypes.join(", ")}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Switch
                            checked={tr.isActive}
                            onCheckedChange={async (v) => {
                              await updateTaxRate(tr.id, { isActive: v });
                              const res = await getTaxRates();
                              if ("data" in res && res.data) setTaxRates(res.data);
                              toast.success(v ? "Tax rate activated" : "Tax rate deactivated");
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 text-destructive"
                            onClick={async () => {
                              if (tr.isDefault) { toast.error("Cannot delete default tax rate"); return; }
                              const res = await deleteTaxRate(tr.id);
                              if ("error" in res) { toast.error(res.error); return; }
                              const r2 = await getTaxRates();
                              if ("data" in r2 && r2.data) setTaxRates(r2.data);
                              toast.success("Tax rate deleted");
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Separator />

                {showNewTaxRate ? (
                  <div className="space-y-3 p-3 bg-muted/20 rounded">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Name</Label>
                        <Input value={newTaxRate.name} onChange={(e) => setNewTaxRate({ ...newTaxRate, name: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Rate (%)</Label>
                        <Input type="number" value={newTaxRate.rate} onChange={(e) => setNewTaxRate({ ...newTaxRate, rate: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newTaxRate.type} onChange={(e) => setNewTaxRate({ ...newTaxRate, type: e.target.value })}>
                          <option value="VAT">VAT</option>
                          <option value="GST">GST</option>
                          <option value="SERVICE">Service Charge</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Applies to (comma-separated item types)</Label>
                        <Input value={newTaxRate.appliesToItemTypes} onChange={(e) => setNewTaxRate({ ...newTaxRate, appliesToItemTypes: e.target.value })} placeholder="e.g. FOOD, BEVERAGE" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newTaxRate.isDefault}
                        onCheckedChange={(v) => setNewTaxRate({ ...newTaxRate, isDefault: v })}
                      />
                      <Label className="text-xs">Set as default</Label>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => setShowNewTaxRate(false)}>Cancel</Button>
                      <Button size="sm" disabled={creatingTaxRate} onClick={async () => {
                        if (!newTaxRate.name || !newTaxRate.rate) { toast.error("Name and rate required"); return; }
                        setCreatingTaxRate(true);
                        const items = newTaxRate.appliesToItemTypes.split(",").map(s => s.trim()).filter(Boolean);
                        const result = await createTaxRate({
                          name: newTaxRate.name,
                          rate: parseFloat(newTaxRate.rate),
                          type: newTaxRate.type,
                          isDefault: newTaxRate.isDefault,
                          appliesToItemTypes: items.length > 0 ? items : undefined,
                        });
                        setCreatingTaxRate(false);
                        if ("error" in result) { toast.error(result.error); return; }
                        toast.success("Tax rate created");
                        setShowNewTaxRate(false);
                        setNewTaxRate({ name: "VAT", rate: "13", type: "VAT", isDefault: false, appliesToItemTypes: "" });
                        const res = await getTaxRates();
                        if ("data" in res && res.data) setTaxRates(res.data);
                      }}>
                        {creatingTaxRate ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null} Create
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setShowNewTaxRate(true)}>
                    <Plus className="w-3 h-3 mr-1" /> Add Tax Rate
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Payment Gateways</CardTitle><CardDescription>Configure payment integrations</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 rounded-lg border p-4"><div className="flex items-center justify-between"><div><h3 className="font-semibold">eSewa</h3><p className="text-sm text-muted-foreground">Enable eSewa payments</p></div><Switch checked={settings.esewa_config.enabled} onCheckedChange={(value) => { setIsDirty(true); setSettings((prev) => ({ ...prev, esewa_config: { ...prev.esewa_config, enabled: value } })); }} /></div>{settings.esewa_config.enabled && <><Separator /><div className="space-y-3"><div className="space-y-2"><Label>Merchant ID</Label><Input value={settings.esewa_config.merchant_id} onChange={(event) => { setIsDirty(true); setSettings((prev) => ({ ...prev, esewa_config: { ...prev.esewa_config, merchant_id: event.target.value } })); }} placeholder="Enter merchant ID" /></div><div className="space-y-2"><Label>Secret Key</Label><Input type="password" value={settings.esewa_config.secret} onChange={(event) => { setIsDirty(true); setSettings((prev) => ({ ...prev, esewa_config: { ...prev.esewa_config, secret: event.target.value } })); }} placeholder="Enter secret key" /></div></div></>}</div>
                <div className="space-y-4 rounded-lg border p-4"><div className="flex items-center justify-between"><div><h3 className="font-semibold">Khalti</h3><p className="text-sm text-muted-foreground">Enable Khalti payments</p></div><Switch checked={settings.khalti_config.enabled} onCheckedChange={(value) => { setIsDirty(true); setSettings((prev) => ({ ...prev, khalti_config: { ...prev.khalti_config, enabled: value } })); }} /></div>{settings.khalti_config.enabled && <><Separator /><div className="space-y-3"><div className="space-y-2"><Label>API Key</Label><Input value={settings.khalti_config.api_key} onChange={(event) => { setIsDirty(true); setSettings((prev) => ({ ...prev, khalti_config: { ...prev.khalti_config, api_key: event.target.value } })); }} placeholder="Enter API key" /></div><div className="space-y-2"><Label>Secret Key</Label><Input type="password" value={settings.khalti_config.secret} onChange={(event) => { setIsDirty(true); setSettings((prev) => ({ ...prev, khalti_config: { ...prev.khalti_config, secret: event.target.value } })); }} placeholder="Enter secret key" /></div></div></>}</div>
                <div className="space-y-4 rounded-lg border p-4"><div className="flex items-center justify-between"><div><h3 className="font-semibold">Fonepay</h3><p className="text-sm text-muted-foreground">Enable Fonepay payments</p></div><Switch checked={settings.fonepay_config.enabled} onCheckedChange={(value) => { setIsDirty(true); setSettings((prev) => ({ ...prev, fonepay_config: { ...prev.fonepay_config, enabled: value } })); }} /></div>{settings.fonepay_config.enabled && <><Separator /><div className="space-y-3"><div className="space-y-2"><Label>Merchant ID</Label><Input value={settings.fonepay_config.merchant_id} onChange={(event) => { setIsDirty(true); setSettings((prev) => ({ ...prev, fonepay_config: { ...prev.fonepay_config, merchant_id: event.target.value } })); }} placeholder="Enter merchant ID" /></div><div className="space-y-2"><Label>Secret Key</Label><Input type="password" value={settings.fonepay_config.secret} onChange={(event) => { setIsDirty(true); setSettings((prev) => ({ ...prev, fonepay_config: { ...prev.fonepay_config, secret: event.target.value } })); }} placeholder="Enter secret key" /></div></div></>}</div>
                <div className="space-y-4 rounded-lg border p-4 opacity-60"><div className="flex items-center justify-between"><div><h3 className="font-semibold">Cash Payment</h3><p className="text-sm text-muted-foreground">Always enabled</p></div><Switch disabled checked /></div></div>
                <SaveBtn onClick={savePayments} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="printers" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Printer Configuration</CardTitle><CardDescription>Manage receipt and kitchen printers</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                {settings.printer_config.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">No printers configured yet.</p> : <div className="space-y-3">{settings.printer_config.map((printer, index) => <div key={`${printer.name}-${index}`} className="flex items-center justify-between rounded-lg border p-4"><div className="flex-1 space-y-2"><Input value={printer.name} onChange={(event) => { setIsDirty(true); setSettings((prev) => ({ ...prev, printer_config: prev.printer_config.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) })); }} placeholder="Printer name" /><Input className="font-mono text-xs" value={printer.ip} onChange={(event) => { setIsDirty(true); setSettings((prev) => ({ ...prev, printer_config: prev.printer_config.map((item, itemIndex) => itemIndex === index ? { ...item, ip: event.target.value } : item) })); }} placeholder="192.168.1.xxx" /></div><Button variant="ghost" size="sm" onClick={() => setSettings((prev) => ({ ...prev, printer_config: prev.printer_config.filter((_, itemIndex) => itemIndex !== index) }))}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>)}</div>}
                <Button variant="outline" className="w-full gap-2" onClick={() => setSettings((prev) => ({ ...prev, printer_config: [...prev.printer_config, { name: `Printer ${prev.printer_config.length + 1}`, type: 'ESC/POS', ip: '192.168.1.' }] }))}><Plus className="h-4 w-4" /> Add Printer</Button>
                <SaveBtn onClick={savePrinters} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Notification Settings</CardTitle><CardDescription>Configure how you receive alerts</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                {[
                  { title: 'New Order Alert', keys: [{ id: 'order_sound', label: 'Sound' }, { id: 'order_popup', label: 'Popup Notification' }] },
                  { title: 'Low Stock Alerts', keys: [{ id: 'stock_email', label: 'Email' }, { id: 'stock_inapp', label: 'In-App' }] },
                  { title: 'Bill Request Alerts', keys: [{ id: 'bill_sound', label: 'Sound' }, { id: 'bill_inapp', label: 'In-App' }] },
                ].map((section) => (
                  <div key={section.title} className="space-y-3 rounded-lg border p-4">
                    <h3 className="flex items-center gap-2 font-semibold"><Bell className="h-4 w-4" />{section.title}</h3>
                    {section.keys.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <Label>{item.label}</Label>
                        <Switch checked={(settings.notification_preferences as any)[item.id] ?? true} onCheckedChange={(value) => setNotif(item.id, value)} />
                      </div>
                    ))}
                  </div>
                ))}
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between"><h3 className="font-semibold">Daily Summary Email</h3><Switch checked={settings.notification_preferences.daily_email} onCheckedChange={(value) => setNotif('daily_email', value)} /></div>
                  {settings.notification_preferences.daily_email && <div className="space-y-2"><Label>Delivery Time</Label><Input type="time" className="w-36" value={settings.notification_preferences.daily_email_time} onChange={(event) => setNotif('daily_email_time', event.target.value)} /></div>}
                </div>
                <SaveBtn onClick={saveNotifications} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-6">
            {/* Current Plan */}
            {subscription ? (
              <Card className="border-primary/20 bg-gradient-to-br from-primary-light to-emerald-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">{subscription.plan_name} Plan</CardTitle>
                      <CardDescription>Your current subscription</CardDescription>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      subscription.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {subscription.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-3xl font-bold">
                      {subscription.price === 0 ? 'Free' : `NPR ${subscription.price.toLocaleString()}`}
                    </p>
                    {subscription.price > 0 && <p className="text-muted-foreground">/month</p>}
                  </div>
                  {subscription.current_period_end && (
                    <p className="text-sm text-muted-foreground">
                      Renews on: <span className="font-semibold text-foreground">
                        {new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </p>
                  )}
                  {subscription.features.length > 0 && (
                    <div>
                      <h4 className="mb-2 font-semibold text-sm">Included Features:</h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
                        {subscription.features.map((feature, index) => (
                          <li key={`${feature}-${index}`} className="flex gap-2">
                            <span className="text-primary">✓</span>{feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="mb-4 text-muted-foreground">No active subscription. Choose a plan below to get started.</p>
                </CardContent>
              </Card>
            )}

            {/* Available Plans */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Available Plans</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {availablePlans.map((plan) => {
                  const isCurrent = subscription?.plan_id === plan.id;
                  const features = Array.isArray(plan.features) ? plan.features : [];
                  return (
                    <Card
                      key={plan.id}
                      className={`relative flex flex-col ${
                        isCurrent
                          ? 'border-primary ring-2 ring-primary/20'
                          : plan.isPopular
                          ? 'border-primary/50'
                          : ''
                      }`}
                    >
                      {plan.isPopular && !isCurrent && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Popular
                          </span>
                        </div>
                      )}
                      {isCurrent && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Current Plan
                          </span>
                        </div>
                      )}
                      <CardHeader className="text-center pt-8">
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <div className="mt-2">
                          <span className="text-3xl font-bold">
                            {plan.monthlyPrice === 0 ? 'Free' : `NPR ${plan.monthlyPrice?.toLocaleString()}`}
                          </span>
                          {plan.monthlyPrice > 0 && (
                            <span className="text-muted-foreground text-sm">/month</span>
                          )}
                        </div>
                        {plan.annualPrice > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            NPR {plan.annualPrice?.toLocaleString()}/year (save 20%)
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col">
                        <ul className="space-y-2 text-sm flex-1">
                          {features.map((feature: string, i: number) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-primary mt-0.5">✓</span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <Button
                          className="mt-4 w-full"
                          variant={isCurrent ? 'outline' : 'default'}
                          disabled={isCurrent || isSubscribing}
                          onClick={() => {
                            setPendingPlan(plan);
                            setShowSubscribeConfirm(true);
                          }}
                        >
                          {isCurrent ? 'Current Plan' : subscription ? 'Switch Plan' : 'Subscribe'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Danger Zone */}
            {subscription && (
              <div className="space-y-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <h3 className="font-semibold text-destructive">Danger Zone</h3>
                <p className="text-sm text-muted-foreground">Cancel your subscription. Your data will be retained for 30 days.</p>
                <Button variant="destructive" onClick={() => setShowCancelConfirm(true)}>
                  Cancel Subscription
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ══ SECURITY ═════════════════════════════════════════════════ */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Enter new password" />
                </div>
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Confirm new password" />
                </div>
                <Button onClick={changePassword} disabled={isSavingPwd} className="w-full md:w-auto">
                  {isSavingPwd ? 'Updating…' : 'Change Password'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
      {/* Unsaved changes confirmation */}
      <AlertDialog open={showTabConfirm} onOpenChange={setShowTabConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Unsaved Changes
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Switching tabs will discard them. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay on this tab</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowTabConfirm(false);
              setIsDirty(false);
              if (pendingTab) setActiveTab(pendingTab);
            }}>
              Discard & Switch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel subscription confirmation */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Cancel Subscription?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your data will be retained for 30 days after cancellation.
              After that, all data associated with your subscription will be permanently deleted.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              disabled={isCancelling}
              onClick={async () => {
                if (!restaurantId) return;
                setIsCancelling(true);
                const result = await cancelSubscription(restaurantId);
                setIsCancelling(false);
                setShowCancelConfirm(false);
                if (result.error) { toast.error(result.error); return; }
                toast.success('Subscription cancelled');
                loadData();
              }}
            >
              {isCancelling ? 'Cancelling...' : 'Yes, Cancel Subscription'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Subscribe / Upgrade confirmation */}
      <AlertDialog open={showSubscribeConfirm} onOpenChange={setShowSubscribeConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {pendingPlan && subscription && pendingPlan.monthlyPrice > subscription.price
                ? 'Upgrade Plan?'
                : pendingPlan && subscription && pendingPlan.monthlyPrice < subscription.price
                ? 'Downgrade Plan?'
                : 'Subscribe to Plan?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingPlan && pendingPlan.monthlyPrice === 0
                ? 'Switch to the Free plan. Your current subscription will be cancelled immediately.'
                : pendingPlan && subscription && pendingPlan.monthlyPrice < subscription.price
                ? `Downgrading to ${pendingPlan.name} will take effect at the end of your current billing period. Some features may be restricted.`
                : pendingPlan
                ? `Subscribe to the ${pendingPlan.name} plan for NPR ${pendingPlan.monthlyPrice?.toLocaleString()}/month. Your subscription will be active for 1 year.`
                : 'Proceed with this plan?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingPlan(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubscribing}
              onClick={async () => {
                if (!restaurantId || !pendingPlan) return;
                setIsSubscribing(true);
                const result = await subscribeToPlan(restaurantId, pendingPlan.id);
                setIsSubscribing(false);
                setShowSubscribeConfirm(false);
                setPendingPlan(null);
                if (result.error) { toast.error(result.error); return; }
                toast.success(`Subscribed to ${pendingPlan.name} plan!`);
                loadData();
              }}
            >
              {isSubscribing ? 'Processing...' : pendingPlan?.monthlyPrice === 0 ? 'Switch to Free' : 'Confirm Subscribe'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
