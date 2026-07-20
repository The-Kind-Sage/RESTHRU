'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Trash2, Printer, Bell, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';
import { getSettingsData, upsertSettings } from '@/lib/actions/settings';
import Link from 'next/link';

const DEFAULT_NOTIF = {
  order_sound: true,
  order_popup: true,
  stock_email: false,
  stock_inapp: true,
  bill_sound: true,
  bill_inapp: true,
};

export default function ReceptionSettingsPage() {
  const { restaurant } = useAuthStore();
  const restaurantId = restaurant?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [printerConfig, setPrinterConfig] = useState<Array<{ name: string; type: string; ip: string }>>([]);
  const [notifPrefs, setNotifPrefs] = useState(DEFAULT_NOTIF);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;
    (async () => {
      setLoading(true);
      const res = await getSettingsData(restaurantId);
      if ("data" in res && res.data) {
        const s = res.data as any;
        setPrinterConfig(s.printer_config ?? []);
        setNotifPrefs(s.notification_preferences ?? DEFAULT_NOTIF);
      }
      setLoading(false);
    })();
  }, [restaurantId]);

  const savePrinters = async () => {
    if (!restaurantId) return;
    setSaving(true);
    const result = await upsertSettings(restaurantId, { printer_config: printerConfig });
    if (result.error) { toast.error(result.error); setSaving(false); return; }
    setDirty(false);
    toast.success('Printer settings saved');
    setSaving(false);
  };

  const saveNotifications = async () => {
    if (!restaurantId) return;
    setSaving(true);
    const result = await upsertSettings(restaurantId, { notification_preferences: notifPrefs });
    if (result.error) { toast.error(result.error); setSaving(false); return; }
    toast.success('Notification preferences saved');
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage printers and notification preferences</p>
      </div>

      {/* Printers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" /> Printer Configuration
          </CardTitle>
          <CardDescription>Manage receipt and kitchen printers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {printerConfig.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No printers configured yet.</p>
          ) : (
            <div className="space-y-3">
              {printerConfig.map((printer, index) => (
                <div key={`${printer.name}-${index}`} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={printer.name}
                      onChange={(e) => {
                        setDirty(true);
                        setPrinterConfig((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, name: e.target.value } : item))
                        );
                      }}
                      placeholder="Printer name"
                    />
                    <Input
                      className="font-mono text-xs"
                      value={printer.ip}
                      onChange={(e) => {
                        setDirty(true);
                        setPrinterConfig((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, ip: e.target.value } : item))
                        );
                      }}
                      placeholder="192.168.1.xxx"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setPrinterConfig((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() =>
              setPrinterConfig((prev) => [
                ...prev,
                { name: `Printer ${prev.length + 1}`, type: 'ESC/POS', ip: '192.168.1.' },
              ])
            }
          >
            <Plus className="h-4 w-4" /> Add Printer
          </Button>
          <Button onClick={savePrinters} disabled={saving || !dirty} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Printers
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" /> Notification Preferences
          </CardTitle>
          <CardDescription>Configure how you receive alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {[
            { title: 'New Order Alert', keys: [{ id: 'order_sound' as const, label: 'Sound' }, { id: 'order_popup' as const, label: 'Popup Notification' }] },
            { title: 'Low Stock Alerts', keys: [{ id: 'stock_email' as const, label: 'Email' }, { id: 'stock_inapp' as const, label: 'In-App' }] },
            { title: 'Bill Request Alerts', keys: [{ id: 'bill_sound' as const, label: 'Sound' }, { id: 'bill_inapp' as const, label: 'In-App' }] },
          ].map((section) => (
            <div key={section.title} className="space-y-3 rounded-lg border p-4">
              <h3 className="flex items-center gap-2 font-semibold">
                <Bell className="h-4 w-4" />{section.title}
              </h3>
              <Separator />
              <div className="space-y-3">
                {section.keys.map((key) => (
                  <div key={key.id} className="flex items-center justify-between">
                    <Label>{key.label}</Label>
                    <Switch
                      checked={notifPrefs[key.id]}
                      onCheckedChange={(v) => {
                        setNotifPrefs((prev) => ({ ...prev, [key.id]: v }));
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Button onClick={saveNotifications} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Notifications
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
