'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, Trash2, Plus, Volume2, Bell } from 'lucide-react';
import { uploadImage } from '@/lib/upload';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [saveMessage, setSaveMessage] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const handleLogoUpload = async (file: File) => {
    setIsUploadingLogo(true);
    const url = await uploadImage(file, 'logos');
    if (url) {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase
            .from('restaurants')
            .update({ logo_url: url })
            .eq('owner_id', session.user.id);
        }
      }
      toast.success('Logo uploaded successfully');
    } else {
      toast.error('Logo upload failed');
    }
    setIsUploadingLogo(false);
  };

  const handleCoverUpload = async (file: File) => {
    setIsUploadingCover(true);
    const url = await uploadImage(file, 'covers');
    if (url) {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase
            .from('restaurants')
            .update({ cover_url: url })
            .eq('owner_id', session.user.id);
        }
      }
      toast.success('Cover photo uploaded successfully');
    } else {
      toast.error('Cover photo upload failed');
    }
    setIsUploadingCover(false);
  };

  const handleSave = () => {
    setSaveMessage('Settings saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your restaurant configuration and preferences
        </p>
      </div>

      {/* Tabs with vertical layout */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex gap-6 lg:gap-8">
        {/* Vertical Tab List */}
        <TabsList className="flex flex-col h-auto w-full lg:w-64 bg-transparent p-0 space-y-1">
          <TabsTrigger
            value="general"
            className="justify-start data-[state=active]:bg-primary/10 w-full rounded-md px-4 py-2"
          >
            General
          </TabsTrigger>
          <TabsTrigger
            value="billing"
            className="justify-start data-[state=active]:bg-primary/10 w-full rounded-md px-4 py-2"
          >
            Billing & Tax
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="justify-start data-[state=active]:bg-primary/10 w-full rounded-md px-4 py-2"
          >
            Payments
          </TabsTrigger>
          <TabsTrigger
            value="printers"
            className="justify-start data-[state=active]:bg-primary/10 w-full rounded-md px-4 py-2"
          >
            Printers
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="justify-start data-[state=active]:bg-primary/10 w-full rounded-md px-4 py-2"
          >
            Notifications
          </TabsTrigger>
          <TabsTrigger
            value="subscription"
            className="justify-start data-[state=active]:bg-primary/10 w-full rounded-md px-4 py-2"
          >
            Subscription
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="justify-start data-[state=active]:bg-primary/10 w-full rounded-md px-4 py-2"
          >
            Security
          </TabsTrigger>
        </TabsList>

        {/* Tab Contents */}
        <div className="flex-1">
          {/* GENERAL TAB */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Information</CardTitle>
                <CardDescription>Update your restaurant details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Restaurant Name */}
                <div className="space-y-2">
                  <Label htmlFor="restaurant-name">Restaurant Name</Label>
                  <Input
                    id="restaurant-name"
                    placeholder="Enter restaurant name"
                    defaultValue="Resthru Restaurant"
                  />
                </div>

                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4">
                    <label className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50 cursor-pointer hover:border-primary transition-colors overflow-hidden">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="h-full w-full object-cover rounded-lg" />
                      ) : (
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setLogoFile(file);
                            setLogoPreview(URL.createObjectURL(file));
                            handleLogoUpload(file);
                          }
                        }}
                      />
                    </label>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {isUploadingLogo ? 'Uploading...' : 'Recommended size: 200x200px'}
                      </p>
                      <label className="cursor-pointer">
                        <Button variant="outline" size="sm" asChild>
                          <span>{logoPreview ? 'Change Logo' : 'Choose File'}</span>
                        </Button>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setLogoFile(file);
                              setLogoPreview(URL.createObjectURL(file));
                              handleLogoUpload(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Cover Photo Upload */}
                <div className="space-y-2">
                  <Label>Cover Photo</Label>
                  <label className="block w-full rounded-lg border-2 border-dashed border-muted-foreground/25 cursor-pointer hover:border-primary transition-colors overflow-hidden">
                    {coverPreview ? (
                      <div className="relative">
                        <img src={coverPreview} alt="Cover" className="w-full h-40 object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                          <p className="text-white text-sm font-medium">Click to change</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 flex flex-col items-center justify-center gap-3 bg-muted/50">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {isUploadingCover ? 'Uploading...' : 'Recommended size: 1200x400px'}
                        </p>
                        <span className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 h-8 text-sm font-medium hover:bg-accent">
                          Choose File
                        </span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCoverFile(file);
                          setCoverPreview(URL.createObjectURL(file));
                          handleCoverUpload(file);
                        }
                      }}
                    />
                  </label>
                </div>

                <Separator />

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="Enter restaurant address"
                    defaultValue="Thamel, Kathmandu, Nepal"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="Enter phone number"
                    defaultValue="+977-1-4123456"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    defaultValue="hello@resthru.com"
                  />
                </div>

                <Separator />

                {/* Operating Hours */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Operating Hours</h3>
                  {[
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                    'Sunday',
                  ].map((day) => (
                    <div key={day} className="flex items-center gap-4">
                      <div className="w-24">
                        <p className="text-sm font-medium">{day}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          defaultValue="07:00"
                          className="w-32"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="time"
                          defaultValue="22:00"
                          className="w-32"
                        />
                      </div>
                      <Switch defaultChecked />
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Language & Regional */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="lang-en"
                          name="language"
                          defaultChecked
                        />
                        <Label htmlFor="lang-en" className="font-normal">
                          English
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="lang-ne"
                          name="language"
                        />
                        <Label htmlFor="lang-ne" className="font-normal">
                          Nepali
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      disabled
                      defaultValue="NPR"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input
                      id="timezone"
                      disabled
                      defaultValue="Asia/Kathmandu"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date-format">Date Format</Label>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm">
                        AD
                      </Button>
                      <span className="text-muted-foreground">/</span>
                      <Button variant="ghost" size="sm">
                        BS
                      </Button>
                    </div>
                  </div>
                </div>

                <Button onClick={handleSave} className="w-full md:w-auto">
                  Save Changes
                </Button>
                {saveMessage && (
                  <p className="text-sm text-primary">{saveMessage}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* BILLING & TAX TAB */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tax Information</CardTitle>
                <CardDescription>Configure tax and billing details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* PAN Number */}
                <div className="space-y-2">
                  <Label htmlFor="pan">PAN Number</Label>
                  <Input
                    id="pan"
                    placeholder="Enter PAN number"
                    defaultValue="123456789"
                  />
                </div>

                {/* VAT Registration */}
                <div className="space-y-2">
                  <Label htmlFor="vat">VAT Registration Number</Label>
                  <Input
                    id="vat"
                    placeholder="Enter VAT registration number"
                    defaultValue="6012345678-001"
                  />
                </div>

                {/* Tax Rate */}
                <div className="space-y-2">
                  <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                  <Input
                    id="tax-rate"
                    type="number"
                    placeholder="13"
                    defaultValue="13"
                  />
                </div>

                {/* Bill Footer Message */}
                <div className="space-y-2">
                  <Label htmlFor="bill-footer">Bill Footer Message</Label>
                  <textarea
                    id="bill-footer"
                    className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Thank you for your visit!"
                    defaultValue="Thank you for dining with us! We hope to see you again soon."
                  />
                </div>

                <Separator />

                {/* Receipt Format Preview */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Receipt Format Preview</h3>
                  <div className="w-full max-w-sm mx-auto p-4 border rounded-lg bg-muted/30 font-mono text-xs space-y-1">
                    <p className="text-center font-bold">Resthru Restaurant</p>
                    <p className="text-center text-[10px]">Thamel, Kathmandu</p>
                    <div className="border-b my-2" />
                    <p>Chicken Momo x2........450</p>
                    <p>Chow Mein.............300</p>
                    <p>Masala Tea............80</p>
                    <div className="border-b my-2" />
                    <p className="font-bold flex justify-between">
                      <span>Total:</span>
                      <span>830</span>
                    </p>
                    <div className="border-b my-2" />
                    <p className="text-center text-[10px]">
                      Thank you for dining with us!
                    </p>
                  </div>
                </div>

                {/* Receipt Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="vat-receipt">Enable VAT on Receipt</Label>
                    <Switch id="vat-receipt" defaultChecked />
                  </div>
                </div>

                <Button onClick={handleSave} className="w-full md:w-auto">
                  Save Changes
                </Button>
                {saveMessage && (
                  <p className="text-sm text-primary">{saveMessage}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PAYMENTS TAB */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Gateways</CardTitle>
                <CardDescription>Configure payment method integrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* eSewa */}
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">eSewa</h3>
                      <p className="text-sm text-muted-foreground">
                        Enable eSewa payments
                      </p>
                    </div>
                    <Switch id="esewa-toggle" defaultChecked />
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="esewa-id">Merchant ID</Label>
                      <Input
                        id="esewa-id"
                        placeholder="Enter merchant ID"
                        defaultValue="9810012345"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="esewa-secret">Secret Key</Label>
                      <Input
                        id="esewa-secret"
                        type="password"
                        placeholder="Enter secret key"
                        defaultValue="•••••••••"
                      />
                    </div>
                  </div>
                </div>

                {/* Khalti */}
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Khalti</h3>
                      <p className="text-sm text-muted-foreground">
                        Enable Khalti payments
                      </p>
                    </div>
                    <Switch id="khalti-toggle" defaultChecked />
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="khalti-key">API Key</Label>
                      <Input
                        id="khalti-key"
                        placeholder="Enter API key"
                        defaultValue="live_1234567890abcdef"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="khalti-secret">Secret Key</Label>
                      <Input
                        id="khalti-secret"
                        type="password"
                        placeholder="Enter secret key"
                        defaultValue="•••••••••"
                      />
                    </div>
                  </div>
                </div>

                {/* Fonepay */}
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Fonepay</h3>
                      <p className="text-sm text-muted-foreground">
                        Enable Fonepay payments
                      </p>
                    </div>
                    <Switch id="fonepay-toggle" />
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fonepay-id">Merchant ID</Label>
                      <Input
                        id="fonepay-id"
                        placeholder="Enter merchant ID"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fonepay-secret">Secret Key</Label>
                      <Input
                        id="fonepay-secret"
                        type="password"
                        placeholder="Enter secret key"
                      />
                    </div>
                  </div>
                </div>

                {/* Cash Payment */}
                <div className="space-y-4 rounded-lg border p-4 opacity-60">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Cash Payment</h3>
                      <p className="text-sm text-muted-foreground">
                        Cash payments are always enabled
                      </p>
                    </div>
                    <Switch disabled checked />
                  </div>
                </div>

                <Button onClick={handleSave} className="w-full md:w-auto">
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PRINTERS TAB */}
          <TabsContent value="printers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Printer Configuration</CardTitle>
                <CardDescription>Manage receipt and kitchen printers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Printer List */}
                <div className="space-y-4">
                  {[
                    {
                      name: 'Kitchen Printer',
                      type: 'ESC/POS',
                      ip: '192.168.1.100',
                    },
                    {
                      name: 'Bill Printer',
                      type: 'ESC/POS',
                      ip: '192.168.1.101',
                    },
                  ].map((printer) => (
                    <div
                      key={printer.name}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-semibold">{printer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {printer.type} - {printer.ip}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Test Print
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Add Printer
                </Button>

                <Separator />

                {/* Printer Assignment */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Printer Assignment</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Kitchen Printer', name: 'kitchen' },
                      { label: 'Bill Printer', name: 'bill' },
                      { label: 'Default Printer', name: 'default' },
                    ].map((item) => (
                      <div key={item.name} className="flex items-center gap-3">
                        <input
                          type="radio"
                          id={item.name}
                          name="default-printer"
                          defaultChecked={item.name === 'bill'}
                        />
                        <Label htmlFor={item.name} className="font-normal">
                          {item.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Receipt Format */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Receipt Format Options</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="logo-receipt">Logo on Receipt</Label>
                      <Switch id="logo-receipt" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="name-receipt">Restaurant Name</Label>
                      <Switch id="name-receipt" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="address-receipt">Address on Receipt</Label>
                      <Switch id="address-receipt" defaultChecked />
                    </div>
                  </div>
                </div>

                {/* Thank You Message */}
                <div className="space-y-2">
                  <Label htmlFor="thank-you">Thank You Message</Label>
                  <textarea
                    id="thank-you"
                    className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Thank you message on receipt"
                    defaultValue="Thank you! Please visit again."
                  />
                </div>

                <Button onClick={handleSave} className="w-full md:w-auto">
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NOTIFICATIONS TAB */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure how you receive alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* New Order Alert */}
                <div className="space-y-4 rounded-lg border p-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    New Order Alert
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="order-sound">Sound</Label>
                      <Switch id="order-sound" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="order-popup">Popup Notification</Label>
                      <Switch id="order-popup" defaultChecked />
                    </div>
                  </div>
                </div>

                {/* Low Stock Alert */}
                <div className="space-y-4 rounded-lg border p-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Low Stock Alerts
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="stock-email">Email</Label>
                      <Switch id="stock-email" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="stock-inapp">In-App</Label>
                      <Switch id="stock-inapp" defaultChecked />
                    </div>
                  </div>
                </div>

                {/* Bill Request Alert */}
                <div className="space-y-4 rounded-lg border p-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Bill Request Alerts
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="bill-sound">Sound</Label>
                      <Switch id="bill-sound" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="bill-inapp">In-App</Label>
                      <Switch id="bill-inapp" defaultChecked />
                    </div>
                  </div>
                </div>

                {/* Daily Summary Email */}
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Daily Summary Email</h3>
                    <Switch id="daily-email" defaultChecked />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-time">Delivery Time</Label>
                    <Input
                      id="email-time"
                      type="time"
                      defaultValue="09:00"
                    />
                  </div>
                </div>

                <Button onClick={handleSave} className="w-full md:w-auto">
                  Save Changes
                </Button>
                {saveMessage && (
                  <p className="text-sm text-primary">{saveMessage}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SUBSCRIPTION TAB */}
          <TabsContent value="subscription" className="space-y-6">
            {/* Current Plan */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary-light to-emerald-100">
              <CardHeader>
                <CardTitle className="text-2xl">Pro Plan</CardTitle>
                <CardDescription>Your current subscription</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-3xl font-bold">NPR 4,999</p>
                  <p className="text-muted-foreground">/month</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Included Features:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex gap-2">
                      <span className="text-primary">✓</span>
                      Up to 50 Tables
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">✓</span>
                      Unlimited Staff Accounts
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">✓</span>
                      Advanced Reports & Analytics
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">✓</span>
                      Multiple Payment Methods
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">✓</span>
                      Priority Support
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Usage Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tables</span>
                    <span className="text-sm text-muted-foreground">12 / 50</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full"
                      style={{ width: '24%' }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Staff</span>
                    <span className="text-sm text-muted-foreground">
                      8 / Unlimited
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: '100%' }} />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Storage</span>
                    <span className="text-sm text-muted-foreground">2.1GB / 10GB</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: '21%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plan Actions */}
            <div className="flex gap-2">
              <Button>Upgrade to Enterprise</Button>
              <Button variant="outline">Downgrade to Basic</Button>
            </div>

            {/* Billing History */}
            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>Your recent invoices and payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr className="text-muted-foreground">
                        <th className="text-left py-3 px-4 font-medium">Date</th>
                        <th className="text-left py-3 px-4 font-medium">Amount</th>
                        <th className="text-left py-3 px-4 font-medium">Plan</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                        <th className="text-center py-3 px-4 font-medium">Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          date: 'Jun 17, 2026',
                          amount: 'NPR 4,999',
                          plan: 'Pro',
                          status: 'Paid',
                        },
                        {
                          date: 'May 17, 2026',
                          amount: 'NPR 4,999',
                          plan: 'Pro',
                          status: 'Paid',
                        },
                        {
                          date: 'Apr 17, 2026',
                          amount: 'NPR 4,999',
                          plan: 'Pro',
                          status: 'Paid',
                        },
                      ].map((item, idx) => (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">{item.date}</td>
                          <td className="py-3 px-4 font-medium">{item.amount}</td>
                          <td className="py-3 px-4">{item.plan}</td>
                          <td className="py-3 px-4">
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-primary-light text-primary">
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Button variant="ghost" size="sm">
                              Download
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Next Billing Date */}
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Next billing date: <span className="font-semibold">July 17, 2026</span>
                </p>
              </CardContent>
            </Card>

            {/* Cancel Subscription */}
            <div className="space-y-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
              <h3 className="font-semibold text-destructive">
                Danger Zone
              </h3>
              <p className="text-sm text-muted-foreground">
                Cancel your subscription and delete all associated data.
              </p>
              <Button variant="destructive">Cancel Subscription</Button>
            </div>
          </TabsContent>

          {/* SECURITY TAB */}
          <TabsContent value="security" className="space-y-6">
            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-pwd">Current Password</Label>
                  <Input
                    id="current-pwd"
                    type="password"
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-pwd">New Password</Label>
                  <Input
                    id="new-pwd"
                    type="password"
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-pwd">Confirm New Password</Label>
                  <Input
                    id="confirm-pwd"
                    type="password"
                    placeholder="Confirm new password"
                  />
                </div>
                <Button onClick={handleSave} className="w-full md:w-auto">
                  Change Password
                </Button>
              </CardContent>
            </Card>

            {/* Two-Factor Authentication */}
            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">2FA Status</p>
                    <p className="text-sm text-muted-foreground">
                      Currently disabled
                    </p>
                  </div>
                  <Switch id="2fa" />
                </div>
              </CardContent>
            </Card>

            {/* Active Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>Manage your active login sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr className="text-muted-foreground">
                        <th className="text-left py-3 px-4 font-medium">Device</th>
                        <th className="text-left py-3 px-4 font-medium">Location</th>
                        <th className="text-left py-3 px-4 font-medium">
                          Last Active
                        </th>
                        <th className="text-center py-3 px-4 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          device: 'Chrome on macOS',
                          location: 'Kathmandu, Nepal',
                          lastActive: 'Just now',
                        },
                        {
                          device: 'Safari on iPhone',
                          location: 'Kathmandu, Nepal',
                          lastActive: '2 hours ago',
                        },
                      ].map((session, idx) => (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">{session.device}</td>
                          <td className="py-3 px-4">{session.location}</td>
                          <td className="py-3 px-4">{session.lastActive}</td>
                          <td className="py-3 px-4 text-center">
                            <Button variant="ghost" size="sm">
                              Revoke
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Login History */}
            <Card>
              <CardHeader>
                <CardTitle>Login History</CardTitle>
                <CardDescription>Recent login attempts to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr className="text-muted-foreground">
                        <th className="text-left py-3 px-4 font-medium">Date</th>
                        <th className="text-left py-3 px-4 font-medium">IP Address</th>
                        <th className="text-left py-3 px-4 font-medium">Device</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          date: 'Jun 17, 9:42 AM',
                          ip: '192.168.1.5',
                          device: 'Chrome on macOS',
                          status: 'Success',
                        },
                        {
                          date: 'Jun 17, 8:15 AM',
                          ip: '58.123.45.67',
                          device: 'Safari on iPhone',
                          status: 'Success',
                        },
                        {
                          date: 'Jun 16, 11:20 PM',
                          ip: '192.168.1.5',
                          device: 'Chrome on macOS',
                          status: 'Success',
                        },
                        {
                          date: 'Jun 16, 5:10 PM',
                          ip: '203.123.45.60',
                          device: 'Firefox on Windows',
                          status: 'Failed',
                        },
                        {
                          date: 'Jun 15, 2:30 PM',
                          ip: '192.168.1.5',
                          device: 'Chrome on macOS',
                          status: 'Success',
                        },
                      ].map((entry, idx) => (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">{entry.date}</td>
                          <td className="py-3 px-4">{entry.ip}</td>
                          <td className="py-3 px-4">{entry.device}</td>
                          <td className="py-3 px-4">
                            <span
                              className={
                                entry.status === 'Success'
                                  ? 'inline-block px-2 py-1 rounded-full text-xs font-medium bg-primary-light text-primary'
                                  : 'inline-block px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-destructive'
                              }
                            >
                              {entry.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
