'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, Trash2, Plus, Bell, Loader2 } from 'lucide-react';
import { uploadImage } from '@/lib/upload';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';

// ─── Types ──────────────────────────────────────────────────────────────────
interface RestaurantData {
  name: string; address: string; phone: string; email: string;
  logo_url: string; cover_url: string; pan_number: string;
  vat_registered: boolean; vat_number: string;
  operating_hours: Record<string, { open: string; close: string; enabled: boolean }>;
  language: string; currency: string; timezone: string;
}
interface SettingsData {
  vat_rate: number; bill_footer_message: string; vat_on_receipt: boolean;
  esewa_config:   { merchant_id: string; secret: string; enabled: boolean };
  khalti_config:  { api_key: string;     secret: string; enabled: boolean };
  fonepay_config: { merchant_id: string; secret: string; enabled: boolean };
  notification_preferences: {
    order_sound: boolean; order_popup: boolean;
    stock_email: boolean; stock_inapp: boolean;
    bill_sound:  boolean; bill_inapp:  boolean;
    daily_email: boolean; daily_email_time: string;
  };
  printer_config: Array<{ name: string; type: string; ip: string }>;
}
interface SubscriptionData {
  plan_name: string; price: number; status: string;
  current_period_end: string | null; features: string[];
}

// ─── Constants ───────────────────────────────────────────────────────────────
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DEFAULT_HOURS = Object.fromEntries(
  DAYS.map(d => [d, { open: '07:00', close: '22:00', enabled: true }])
);
const DEFAULT_NOTIF = {
  order_sound: true,  order_popup: true,
  stock_email: true,  stock_inapp: true,
  bill_sound:  true,  bill_inapp:  true,
  daily_email: true,  daily_email_time: '09:00',
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { restaurant: authRestaurant } = useAuthStore();
  const restaurantId = authRestaurant?.id;

  const [activeTab,     setActiveTab]     = useState('general');
  const [isLoading,     setIsLoading]     = useState(true);
  const [isSaving,      setIsSaving]      = useState(false);
  const [isSavingPwd,   setIsSavingPwd]   = useState(false);
  const [isUploadingLogo,  setIsUploadingLogo]  = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [logoPreview,  setLogoPreview]  = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [newPwd,     setNewPwd]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);

  const [restaurant, setRestaurant] = useState<RestaurantData>({
    name: '', address: '', phone: '', email: '',
    logo_url: '', cover_url: '', pan_number: '',
    vat_registered: false, vat_number: '',
    operating_hours: DEFAULT_HOURS,
    language: 'en', currency: 'NPR', timezone: 'Asia/Kathmandu',
  });

  const [settings, setSettings] = useState<SettingsData>({
    vat_rate: 13, bill_footer_message: '', vat_on_receipt: true,
    esewa_config:   { merchant_id: '', secret: '', enabled: false },
    khalti_config:  { api_key: '',     secret: '', enabled: false },
    fonepay_config: { merchant_id: '', secret: '', enabled: false },
    notification_preferences: DEFAULT_NOTIF,
    printer_config: [],
  });

  // ─── Load data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!supabase || !restaurantId) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const [restRes, setRes, subRes] = await Promise.all([
        supabase.from('restaurants').select('*').eq('id', restaurantId).single(),
        supabase.from('restaurant_settings').select('*').eq('restaurant_id', restaurantId).single(),
        supabase.from('subscriptions')
          .select('*, plans(name, price, features)')
          .eq('restaurant_id', restaurantId).eq('status', 'active')
          .order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);

      if (restRes.data) {
        const r = restRes.data;
        const rawH = r.operating_hours ?? {};
        const hours = Object.fromEntries(
          DAYS.map(d => [d, rawH[d] ?? rawH[d.toLowerCase()] ?? { open: '07:00', close: '22:00', enabled: true }])
        );
        setRestaurant({
          name: r.name ?? '', address: r.address ?? '', phone: r.phone ?? '',
          email: r.email ?? '', logo_url: r.logo_url ?? '', cover_url: r.cover_url ?? '',
          pan_number: r.pan_number ?? '', vat_registered: r.vat_registered ?? false,
          vat_number: r.vat_number ?? '', operating_hours: hours,
          language: r.language ?? 'en', currency: r.currency ?? 'NPR',
          timezone: r.timezone ?? 'Asia/Kathmandu',
        });
        if (r.logo_url)  setLogoPreview(r.logo_url);
        if (r.cover_url) setCoverPreview(r.cover_url);
      }

      if (setRes.data) {
        const s = setRes.data;
        setSettings({
          vat_rate: s.vat_rate ?? 13,
          bill_footer_message: s.bill_footer_message ?? '',
          vat_on_receipt: s.vat_on_receipt ?? true,
          esewa_config:   s.esewa_config   ?? { merchant_id: '', secret: '', enabled: false },
          khalti_config:  s.khalti_config  ?? { api_key: '',    secret: '', enabled: false },
          fonepay_config: s.fonepay_config ?? { merchant_id: '', secret: '', enabled: false },
          notification_preferences: s.notification_preferences ?? DEFAULT_NOTIF,
          printer_config: s.printer_config ?? [],
        });
      }

      if (subRes.data) {
        const s = subRes.data as any;
        setSubscription({
          plan_name: s.plans?.name ?? 'Free', price: s.plans?.price ?? 0,
          status: s.status ?? 'active', current_period_end: s.current_period_end ?? null,
          features: s.plans?.features ?? [],
        });
      }
    } catch (e) { console.error('Settings load:', e); }
    finally { setIsLoading(false); }
  }, [restaurantId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Save helpers ──────────────────────────────────────────────────────────
  const upsert = async (patch: object) => {
    if (!supabase || !restaurantId) return false;
    const { error } = await supabase.from('restaurant_settings')
      .upsert({ restaurant_id: restaurantId, ...patch }, { onConflict: 'restaurant_id' });
    if (error) { toast.error(error.message); return false; }
    return true;
  };

  const saveGeneral = async () => {
    if (!supabase || !restaurantId) return;
    setIsSaving(true);
    const { error } = await supabase.from('restaurants').update({
      name: restaurant.name, address: restaurant.address, phone: restaurant.phone,
      email: restaurant.email, pan_number: restaurant.pan_number,
      vat_registered: restaurant.vat_registered, vat_number: restaurant.vat_number,
      operating_hours: restaurant.operating_hours, language: restaurant.language,
    }).eq('id', restaurantId);
    setIsSaving(false);
    error ? toast.error(error.message) : toast.success('General settings saved');
  };

  const saveBilling = async () => {
    setIsSaving(true);
    if (await upsert({ vat_rate: settings.vat_rate, bill_footer_message: settings.bill_footer_message, vat_on_receipt: settings.vat_on_receipt }))
      toast.success('Billing settings saved');
    setIsSaving(false);
  };

  const savePayments = async () => {
    setIsSaving(true);
    if (await upsert({ esewa_config: settings.esewa_config, khalti_config: settings.khalti_config, fonepay_config: settings.fonepay_config }))
      toast.success('Payment settings saved');
    setIsSaving(false);
  };

  const savePrinters = async () => {
    setIsSaving(true);
    if (await upsert({ printer_config: settings.printer_config })) toast.success('Printer settings saved');
    setIsSaving(false);
  };

  const saveNotifications = async () => {
    setIsSaving(true);
    if (await upsert({ notification_preferences: settings.notification_preferences }))
      toast.success('Notification settings saved');
    setIsSaving(false);
  };

  const changePassword = async () => {
    if (!supabase) return;
    if (!newPwd) { toast.error('Enter a new password'); return; }
    if (newPwd !== confirmPwd) { toast.error('Passwords do not match'); return; }
    setIsSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setIsSavingPwd(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Password updated'); setNewPwd(''); setConfirmPwd('');
  };

  // ─── Image uploads ─────────────────────────────────────────────────────────
  const handleLogoUpload = async (file: File) => {
    setIsUploadingLogo(true);
    const url = await uploadImage(file, 'logos');
    if (url && supabase) {
      await supabase.from('restaurants').update({ logo_url: url }).eq('id', restaurantId!);
      setRestaurant(p => ({ ...p, logo_url: url }));
      toast.success('Logo uploaded');
    } else toast.error('Logo upload failed');
    setIsUploadingLogo(false);
  };

  const handleCoverUpload = async (file: File) => {
    setIsUploadingCover(true);
    const url = await uploadImage(file, 'covers');
    if (url && supabase) {
      await supabase.from('restaurants').update({ cover_url: url }).eq('id', restaurantId!);
      setRestaurant(p => ({ ...p, cover_url: url }));
      toast.success('Cover uploaded');
    } else toast.error('Cover upload failed');
    setIsUploadingCover(false);
  };

  // ─── Small helpers ─────────────────────────────────────────────────────────
  const setHours = (day: string, field: 'open' | 'close' | 'enabled', val: string | boolean) =>
    setRestaurant(p => ({
      ...p, operating_hours: { ...p.operating_hours, [day]: { ...p.operating_hours[day], [field]: val } },
    }));

  const setNotif = (key: string, val: boolean | string) =>
    setSettings(p => ({ ...p, notification_preferences: { ...p.notification_preferences, [key]: val } }));

  const SaveBtn = ({ onClick }: { onClick: () => void }) => (
    <Button onClick={onClick} disabled={isSaving} className="w-full md:w-auto">
      {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : 'Save Changes'}
    </Button>
  );

  // ─── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="space-y-6">
      <div><Skeleton className="h-8 w-32 mb-2" /><Skeleton className="h-4 w-64" /></div>
      <div className="flex gap-8">
        <div className="space-y-2 w-56">{Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
        <div className="flex-1 space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
      </div>
    </div>
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your restaurant configuration and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex gap-6 lg:gap-8">
        {/* ── Sidebar nav ── */}
        <TabsList className="flex flex-col h-fit w-full lg:w-56 bg-transparent p-0 space-y-0.5 self-start sticky top-4">
          {[
            { v: 'general',       l: 'General' },
            { v: 'billing',       l: 'Billing & Tax' },
            { v: 'payments',      l: 'Payments' },
            { v: 'printers',      l: 'Printers' },
            { v: 'notifications', l: 'Notifications' },
            { v: 'subscription',  l: 'Subscription' },
            { v: 'security',      l: 'Security' },
          ].map(t => (
            <TabsTrigger key={t.v} value={t.v}
              className="justify-start w-full rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-white hover:bg-muted/60 transition-colors">
              {t.l}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1">

          {/* ══ GENERAL ══════════════════════════════════════════════════ */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Restaurant Information</CardTitle><CardDescription>Update your restaurant details</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Restaurant Name</Label>
                  <Input value={restaurant.name} onChange={e => setRestaurant(p => ({ ...p, name: e.target.value }))} placeholder="Enter restaurant name" />
                </div>
                {/* Logo */}
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4">
                    <label className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50 cursor-pointer hover:border-primary transition-colors overflow-hidden">
                      {logoPreview ? <img src={logoPreview} alt="Logo" className="h-full w-full object-cover rounded-lg" /> : <Upload className="h-6 w-6 text-muted-foreground" />}
                      <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setLogoPreview(URL.createObjectURL(f)); handleLogoUpload(f); } }} />
                    </label>
                    <p className="text-sm text-muted-foreground">{isUploadingLogo ? 'Uploading…' : 'Recommended: 200×200px'}</p>
                  </div>
                </div>
                {/* Cover */}
                <div className="space-y-2">
                  <Label>Cover Photo</Label>
                  <label className="block w-full rounded-lg border-2 border-dashed border-muted-foreground/25 cursor-pointer hover:border-primary transition-colors overflow-hidden">
                    {coverPreview
                      ? <div className="relative"><img src={coverPreview} alt="Cover" className="w-full h-40 object-cover" /><div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"><p className="text-white text-sm font-medium">Click to change</p></div></div>
                      : <div className="p-8 flex flex-col items-center gap-2 bg-muted/50"><Upload className="h-8 w-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">{isUploadingCover ? 'Uploading…' : 'Recommended: 1200×400px'}</p></div>}
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setCoverPreview(URL.createObjectURL(f)); handleCoverUpload(f); } }} />
                  </label>
                </div>
                <Separator />
                <div className="space-y-2"><Label>Address</Label><Input value={restaurant.address} onChange={e => setRestaurant(p => ({ ...p, address: e.target.value }))} placeholder="Street address" /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={restaurant.phone} onChange={e => setRestaurant(p => ({ ...p, phone: e.target.value }))} placeholder="+977-9XXXXXXXXX" /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={restaurant.email} onChange={e => setRestaurant(p => ({ ...p, email: e.target.value }))} placeholder="restaurant@example.com" /></div>
                <Separator />
                {/* Operating hours */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Operating Hours</h3>
                  {DAYS.map(day => (
                    <div key={day} className="flex items-center gap-4">
                      <div className="w-24"><p className="text-sm font-medium">{day}</p></div>
                      <div className="flex items-center gap-2 flex-1">
                        <Input type="time" className="w-32" value={restaurant.operating_hours[day]?.open ?? '07:00'} onChange={e => setHours(day, 'open', e.target.value)} />
                        <span className="text-muted-foreground">to</span>
                        <Input type="time" className="w-32" value={restaurant.operating_hours[day]?.close ?? '22:00'} onChange={e => setHours(day, 'close', e.target.value)} />
                      </div>
                      <Switch checked={restaurant.operating_hours[day]?.enabled ?? true} onCheckedChange={v => setHours(day, 'enabled', v)} />
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <div className="flex gap-4">
                      {[{ val: 'en', lbl: 'English' }, { val: 'ne', lbl: 'Nepali' }].map(l => (
                        <label key={l.val} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="language" checked={restaurant.language === l.val} onChange={() => setRestaurant(p => ({ ...p, language: l.val }))} />
                          <span className="text-sm">{l.lbl}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2"><Label>Currency</Label><Input disabled value={restaurant.currency} /></div>
                </div>
                <div className="space-y-2"><Label>Timezone</Label><Input disabled value={restaurant.timezone} /></div>
                <SaveBtn onClick={saveGeneral} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══ BILLING ══════════════════════════════════════════════════ */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Tax Information</CardTitle><CardDescription>Configure tax and billing details</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>PAN Number</Label>
                  <Input value={restaurant.pan_number} onChange={e => setRestaurant(p => ({ ...p, pan_number: e.target.value }))} placeholder="Enter PAN number" />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div><p className="font-medium">VAT Registered</p><p className="text-sm text-muted-foreground">Is your restaurant VAT registered?</p></div>
                  <Switch checked={restaurant.vat_registered} onCheckedChange={v => setRestaurant(p => ({ ...p, vat_registered: v }))} />
                </div>
                {restaurant.vat_registered && (
                  <div className="space-y-2">
                    <Label>VAT Registration Number</Label>
                    <Input value={restaurant.vat_number} onChange={e => setRestaurant(p => ({ ...p, vat_number: e.target.value }))} placeholder="Enter VAT number" />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Tax Rate (%)</Label>
                  <Input type="number" value={settings.vat_rate} onChange={e => setSettings(p => ({ ...p, vat_rate: parseFloat(e.target.value) || 0 }))} placeholder="13" />
                </div>
                <div className="space-y-2">
                  <Label>Bill Footer Message</Label>
                  <textarea className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Thank you for your visit!" value={settings.bill_footer_message}
                    onChange={e => setSettings(p => ({ ...p, bill_footer_message: e.target.value }))} />
                </div>
                <Separator />
                {/* Live receipt preview */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Receipt Preview</h3>
                  <div className="w-full max-w-sm mx-auto p-4 border rounded-lg bg-muted/30 font-mono text-xs space-y-1">
                    <p className="text-center font-bold">{restaurant.name || 'Your Restaurant'}</p>
                    {restaurant.address && <p className="text-center text-[10px]">{restaurant.address}</p>}
                    <div className="border-b my-2" />
                    <p className="text-center text-[10px] text-muted-foreground italic">Items will appear here</p>
                    <div className="border-b my-2" />
                    {restaurant.vat_registered && settings.vat_on_receipt && (
                      <p className="flex justify-between"><span>VAT ({settings.vat_rate}%):</span><span>—</span></p>
                    )}
                    <div className="border-b my-2" />
                    {settings.bill_footer_message && <p className="text-center text-[10px]">{settings.bill_footer_message}</p>}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Enable VAT on Receipt</Label>
                  <Switch checked={settings.vat_on_receipt} onCheckedChange={v => setSettings(p => ({ ...p, vat_on_receipt: v }))} />
                </div>
                <SaveBtn onClick={saveBilling} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══ PAYMENTS ═════════════════════════════════════════════════ */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Payment Gateways</CardTitle><CardDescription>Configure payment integrations</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                {/* eSewa */}
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div><h3 className="font-semibold">eSewa</h3><p className="text-sm text-muted-foreground">Enable eSewa payments</p></div>
                    <Switch checked={settings.esewa_config.enabled} onCheckedChange={v => setSettings(p => ({ ...p, esewa_config: { ...p.esewa_config, enabled: v } }))} />
                  </div>
                  {settings.esewa_config.enabled && (<><Separator />
                    <div className="space-y-3">
                      <div className="space-y-2"><Label>Merchant ID</Label><Input value={settings.esewa_config.merchant_id} onChange={e => setSettings(p => ({ ...p, esewa_config: { ...p.esewa_config, merchant_id: e.target.value } }))} placeholder="Enter merchant ID" /></div>
                      <div className="space-y-2"><Label>Secret Key</Label><Input type="password" value={settings.esewa_config.secret} onChange={e => setSettings(p => ({ ...p, esewa_config: { ...p.esewa_config, secret: e.target.value } }))} placeholder="Enter secret key" /></div>
                    </div></>)}
                </div>
                {/* Khalti */}
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div><h3 className="font-semibold">Khalti</h3><p className="text-sm text-muted-foreground">Enable Khalti payments</p></div>
                    <Switch checked={settings.khalti_config.enabled} onCheckedChange={v => setSettings(p => ({ ...p, khalti_config: { ...p.khalti_config, enabled: v } }))} />
                  </div>
                  {settings.khalti_config.enabled && (<><Separator />
                    <div className="space-y-3">
                      <div className="space-y-2"><Label>API Key</Label><Input value={settings.khalti_config.api_key} onChange={e => setSettings(p => ({ ...p, khalti_config: { ...p.khalti_config, api_key: e.target.value } }))} placeholder="Enter API key" /></div>
                      <div className="space-y-2"><Label>Secret Key</Label><Input type="password" value={settings.khalti_config.secret} onChange={e => setSettings(p => ({ ...p, khalti_config: { ...p.khalti_config, secret: e.target.value } }))} placeholder="Enter secret key" /></div>
                    </div></>)}
                </div>
                {/* Fonepay */}
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div><h3 className="font-semibold">Fonepay</h3><p className="text-sm text-muted-foreground">Enable Fonepay payments</p></div>
                    <Switch checked={settings.fonepay_config.enabled} onCheckedChange={v => setSettings(p => ({ ...p, fonepay_config: { ...p.fonepay_config, enabled: v } }))} />
                  </div>
                  {settings.fonepay_config.enabled && (<><Separator />
                    <div className="space-y-3">
                      <div className="space-y-2"><Label>Merchant ID</Label><Input value={settings.fonepay_config.merchant_id} onChange={e => setSettings(p => ({ ...p, fonepay_config: { ...p.fonepay_config, merchant_id: e.target.value } }))} placeholder="Enter merchant ID" /></div>
                      <div className="space-y-2"><Label>Secret Key</Label><Input type="password" value={settings.fonepay_config.secret} onChange={e => setSettings(p => ({ ...p, fonepay_config: { ...p.fonepay_config, secret: e.target.value } }))} placeholder="Enter secret key" /></div>
                    </div></>)}
                </div>
                {/* Cash always on */}
                <div className="space-y-4 rounded-lg border p-4 opacity-60">
                  <div className="flex items-center justify-between">
                    <div><h3 className="font-semibold">Cash Payment</h3><p className="text-sm text-muted-foreground">Always enabled</p></div>
                    <Switch disabled checked />
                  </div>
                </div>
                <SaveBtn onClick={savePayments} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══ PRINTERS ═════════════════════════════════════════════════ */}
          <TabsContent value="printers" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Printer Configuration</CardTitle><CardDescription>Manage receipt and kitchen printers</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                {settings.printer_config.length === 0
                  ? <p className="text-sm text-muted-foreground py-4 text-center">No printers configured yet.</p>
                  : <div className="space-y-3">
                      {settings.printer_config.map((p, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <Input className="font-semibold border-0 p-0 h-auto text-sm focus-visible:ring-0" value={p.name}
                              onChange={e => setSettings(s => ({ ...s, printer_config: s.printer_config.map((x, j) => j === i ? { ...x, name: e.target.value } : x) }))} />
                            <Input className="text-xs text-muted-foreground border-0 p-0 h-auto focus-visible:ring-0" value={p.ip}
                              onChange={e => setSettings(s => ({ ...s, printer_config: s.printer_config.map((x, j) => j === i ? { ...x, ip: e.target.value } : x) }))} placeholder="192.168.1.xxx" />
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setSettings(s => ({ ...s, printer_config: s.printer_config.filter((_, j) => j !== i) }))}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>}
                <Button variant="outline" className="w-full gap-2"
                  onClick={() => setSettings(p => ({ ...p, printer_config: [...p.printer_config, { name: `Printer ${p.printer_config.length + 1}`, type: 'ESC/POS', ip: '192.168.1.' }] }))}>
                  <Plus className="h-4 w-4" /> Add Printer
                </Button>
                <SaveBtn onClick={savePrinters} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══ NOTIFICATIONS ════════════════════════════════════════════ */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Notification Settings</CardTitle><CardDescription>Configure how you receive alerts</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                {[
                  { title: 'New Order Alert',    keys: [{ id: 'order_sound', label: 'Sound' }, { id: 'order_popup', label: 'Popup Notification' }] },
                  { title: 'Low Stock Alerts',   keys: [{ id: 'stock_email', label: 'Email' }, { id: 'stock_inapp', label: 'In-App' }] },
                  { title: 'Bill Request Alerts',keys: [{ id: 'bill_sound',  label: 'Sound' }, { id: 'bill_inapp',  label: 'In-App' }] },
                ].map(sec => (
                  <div key={sec.title} className="space-y-3 rounded-lg border p-4">
                    <h3 className="font-semibold flex items-center gap-2"><Bell className="h-4 w-4" />{sec.title}</h3>
                    {sec.keys.map(k => (
                      <div key={k.id} className="flex items-center justify-between">
                        <Label>{k.label}</Label>
                        <Switch checked={(settings.notification_preferences as any)[k.id] ?? true} onCheckedChange={v => setNotif(k.id, v)} />
                      </div>
                    ))}
                  </div>
                ))}
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Daily Summary Email</h3>
                    <Switch checked={settings.notification_preferences.daily_email} onCheckedChange={v => setNotif('daily_email', v)} />
                  </div>
                  {settings.notification_preferences.daily_email && (
                    <div className="space-y-2">
                      <Label>Delivery Time</Label>
                      <Input type="time" className="w-36" value={settings.notification_preferences.daily_email_time} onChange={e => setNotif('daily_email_time', e.target.value)} />
                    </div>
                  )}
                </div>
                <SaveBtn onClick={saveNotifications} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══ SUBSCRIPTION ═════════════════════════════════════════════ */}
          <TabsContent value="subscription" className="space-y-6">
            {subscription ? (
              <Card className="border-primary/20 bg-gradient-to-br from-primary-light to-emerald-50">
                <CardHeader>
                  <CardTitle className="text-2xl">{subscription.plan_name} Plan</CardTitle>
                  <CardDescription>Your current subscription</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-3xl font-bold">{subscription.price === 0 ? 'Free' : `NPR ${subscription.price.toLocaleString()}`}</p>
                    {subscription.price > 0 && <p className="text-muted-foreground">/month</p>}
                  </div>
                  {subscription.current_period_end && (
                    <p className="text-sm text-muted-foreground">
                      Next billing date: <span className="font-semibold text-foreground">{new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </p>
                  )}
                  {subscription.features.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Included Features:</h4>
                      <ul className="space-y-2 text-sm">
                        {subscription.features.map((f: string, i: number) => (
                          <li key={i} className="flex gap-2"><span className="text-primary">✓</span>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">No active subscription found.</p>
                  <Button>View Plans</Button>
                </CardContent>
              </Card>
            )}
            <div className="space-y-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <h3 className="font-semibold text-destructive">Danger Zone</h3>
              <p className="text-sm text-muted-foreground">Cancel your subscription. Your data will be retained for 30 days.</p>
              <Button variant="destructive">Cancel Subscription</Button>
            </div>
          </TabsContent>
