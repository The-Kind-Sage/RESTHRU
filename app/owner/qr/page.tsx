'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Download, Printer, Info, X, UtensilsCrossed, Loader2, ArrowUpRight, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import QRCode from 'react-qr-code';
import { useAuthStore } from '@/store/auth-store';
import { getTables } from '@/lib/actions/tables';
import { toast } from 'sonner';

const QR_CODE_COLORS = [
  { label: 'White', value: 'bg-background', border: 'border-border' },
  { label: 'Indigo Light', value: 'bg-primary-light', border: 'border-primary/20' },
  { label: 'Emerald Light', value: 'bg-emerald-50', border: 'border-emerald-200' },
  { label: 'Amber Light', value: 'bg-amber-50', border: 'border-amber-200' },
];

interface TableQRData {
  id: string;
  tableNumber: number;
  space: string;
  name: string | null;
  /** Rotating QR token — changes when the table is released after payment. */
  qrCode: string;
}

export default function QRCodeCenterPage() {
  const { restaurant } = useAuthStore();
  const restaurantId = restaurant?.id;
  const restaurantName = restaurant?.name || 'Restaurant';

  // Read the origin only after mount. Reading window during render makes the
  // server emit an empty origin while the client emits the real one, so the QR
  // encodes different data in each pass and React reports a hydration mismatch.
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);

  const [selectedQRPreview, setSelectedQRPreview] = useState<TableQRData | null>(null);
  const [bgColor, setBgColor] = useState(QR_CODE_COLORS[0]);
  const [customMessage, setCustomMessage] = useState('Scan to Order');
  const [dismissBanner, setDismissBanner] = useState(false);
  const [tables, setTables] = useState<TableQRData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSpace, setSelectedSpace] = useState<string>('all');
  const [isApplying, setIsApplying] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const loadTables = useCallback(async () => {
    if (!restaurantId) return;
    setIsLoading(true);
    const result = await getTables(restaurantId);
    if (result.data) {
      setTables(
        result.data.map((t: any) => ({
          id: t.id,
          tableNumber: t.tableNumber,
          space: t.space || 'Space 1',
          name: t.name,
          qrCode: t.qrCode || '',
        }))
      );
    } else if (result.error) {
      toast.error(result.error);
    }
    setIsLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  // Derived from the tables actually loaded, so renamed/added/deleted spaces
  // (managed on the Table Map page) are reflected here with no extra fetch.
  const spaces = Array.from(new Set(tables.map((t) => t.space))).sort();

  const filteredTables = selectedSpace === 'all'
    ? tables
    : tables.filter((t) => t.space === selectedSpace);

  const handleDownloadQR = (tableNumber: number) => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `table-${tableNumber}-qr.svg`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`QR for Table ${tableNumber} downloaded`);
  };

  const handlePrintQR = (tableNumber: number) => {
    const win = window.open('', '_blank');
    if (!win) return;
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    win.document.write(`
      <html><head><title>Table ${tableNumber} QR</title>
      <style>body{display:flex;justify-content:center;align-items:center;height:100vh;margin:0;padding:20px;font-family:sans-serif;}
      .card{text-align:center;padding:40px;border:2px solid #e2e8f0;border-radius:16px;max-width:400px;}
      img{width:250px;height:250px;}
      h2{margin:16px 0 4px;font-size:24px;}p{color:#64748b;margin:4px 0;}
      h1{color:#4f46e5;margin:8px 0;font-size:32px;}</style></head><body>
      <div class="card">
        <div class="flex items-center justify-center gap-2 mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
          </svg>
          <span style="font-weight:700;color:#4f46e5;font-size:20px;">Resthru</span>
        </div>
        ${new XMLSerializer().serializeToString(svg)}
        <h2>${restaurantName}</h2>
        <h1 style="color:#4f46e5;font-size:32px;font-weight:700;">Table ${tableNumber}</h1>
        <p>${customMessage}</p>
        <p style="margin-top:16px;font-size:12px;">resthru.com</p>
      </div></body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  const handleApplyToAll = () => {
    setIsApplying(true);
    toast.success(`Customization applied to all ${tables.length} tables`);
    setIsApplying(false);
  };

  const qrValue = selectedQRPreview && typeof window !== 'undefined'
    ? `${origin}/r/${restaurantId}?table=${selectedQRPreview.tableNumber}`
    : '';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">QR Code Center</h1>
          <p className="text-muted-foreground mt-1">
            Manage and customize QR codes for all your tables
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" asChild>
            <a href="/owner/menu" className="gap-2">
              <ArrowUpRight className="w-4 h-4" />
              Menu QR (Recommended)
            </a>
          </Button>
        </div>
      </div>

      {/* Explanation Banner */}
      {!dismissBanner && (
        <Card className="border-info/20 bg-info/10">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Info className="w-5 h-5 text-info mt-0.5" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-info">
                  Per-table QR codes let customers scan to view the menu and order directly
                  from their table. The main menu QR code in the Menu page is recommended for
                  most setups — it uses a single URL for all tables.
                </p>
              </div>
              <button
                onClick={() => setDismissBanner(true)}
                className="flex-shrink-0 text-info hover:text-info"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* QR Code Grid — grouped by space */}
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-semibold">QR Codes</h2>
          <div className="flex gap-2 flex-wrap">
            {['all', ...spaces].map((space) => (
              <Button
                key={space}
                variant={selectedSpace === space ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSpace(space)}
              >
                {space === 'all' ? 'All Spaces' : space}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <p className="font-medium">No tables found</p>
            <p className="text-sm mt-1">Add tables in the Table Management section first.</p>
          </div>
        ) : (
          Object.entries(
            // Group the visible tables under their space heading.
            filteredTables.reduce((acc: Record<string, TableQRData[]>, t) => {
              const key = t.space || 'Unassigned Space';
              (acc[key] ||= []).push(t);
              return acc;
            }, {})
          ).map(([spaceName, spaceTables]) => (
            <div key={spaceName} className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="h-5 w-1 rounded-full bg-primary" />
                <h3 className="font-semibold text-primary">{spaceName}</h3>
                <Badge variant="outline" className="text-[11px]">
                  {spaceTables.length} {spaceTables.length === 1 ? 'Table' : 'Tables'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {spaceTables.map((table) => {
                  // Points at the table's ordering route, not the menu book.
                  //   • the table is addressed by its cuid, so it can't be swapped
                  //     for a neighbour's by editing "table=1" to "table=2";
                  //   • `k` is the rotating token, checked against THAT table, so a
                  //     link kept from a previous sitting stops working once paid.
                  const menuUrl = `${origin}/r/${restaurantId}/t/${table.id}${table.qrCode ? `?k=${table.qrCode}` : ''}`;
                  return (
                    <div key={table.id} className="rounded-xl border overflow-hidden bg-card">
                      <div className="bg-muted/40 px-5 pt-6 pb-5 text-center">
                        <p className="text-sm font-medium text-muted-foreground">Welcome To</p>
                        <h4 className="text-xl font-bold mt-0.5 break-words">{restaurantName}</h4>

                        {/* QR with the table label riding on its top border */}
                        <div className="relative inline-block mt-6">
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 rounded-md bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-foreground whitespace-nowrap">
                            {table.name || `Table ${table.tableNumber}`}
                          </span>
                          <div className="rounded-xl border-2 border-primary p-3 bg-white">
                            <div className="bg-white p-2 rounded-lg">
                              <QRCode
                                value={menuUrl}
                                size={120}
                                bgColor="#ffffff"
                                fgColor="#0f172a"
                                level="H"
                              />
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mt-5">Scan To Explore Our Menu</p>

                        <div className="mt-6">
                          <p className="text-[10px] text-muted-foreground">Powered By</p>
                          <p className="text-sm font-extrabold tracking-tight">Resthru</p>
                        </div>
                      </div>

                      {/* Footer: link + actions */}
                      <div className="flex items-center gap-2 border-t px-3 py-2.5">
                        <a
                          href={menuUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 min-w-0 flex-1 text-xs text-primary hover:underline"
                          title={menuUrl}
                        >
                          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-primary/10">
                            <LinkIcon className="h-3 w-3" />
                          </span>
                          <span className="truncate">{menuUrl}</span>
                        </a>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 flex-shrink-0"
                          aria-label="Download QR"
                          onClick={() => handleDownloadQR(table.tableNumber)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 flex-shrink-0"
                          aria-label="Print QR"
                          onClick={() => handlePrintQR(table.tableNumber)}
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Customization Section */}
      <Card id="qr-preview-content">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-6">Customize QR Cards</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Settings */}
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-3 block">Card Background Color</label>
                <div className="flex gap-3">
                  {QR_CODE_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setBgColor(color)}
                      className={`w-12 h-12 rounded-lg border-2 transition-all ${color.value} ${
                        bgColor.value === color.value
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-border hover:border-border'
                      }`}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="message" className="text-sm font-medium mb-2 block">
                  Custom Message
                </label>
                <Input
                  id="message"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="e.g., Scan to Order"
                  className="mb-2"
                />
                <p className="text-xs text-muted-foreground">
                  This text appears below the QR code on the printed card
                </p>
              </div>

              <Button
                className="w-full"
                onClick={handleApplyToAll}
                disabled={isApplying || tables.length === 0}
              >
                {isApplying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Apply to All Tables
              </Button>
            </div>

            {/* Live Preview */}
            <div>
              <label className="text-sm font-medium mb-3 block">Live Preview</label>
              <div ref={qrRef} className={`${bgColor.value} border-2 ${bgColor.border} rounded-lg p-6 flex flex-col items-center gap-4 min-h-96`}>
                {/* Resthru Header */}
                <div className="flex items-center gap-2 mb-2">
                  <UtensilsCrossed className="w-5 h-5 text-primary" />
                  <span className="font-bold text-primary">Resthru</span>
                </div>

                {/* QR Code */}
                <div className="mb-4 p-2 bg-white rounded-lg">
                  <QRCode
                    value={`${origin}/r/${restaurantId}?table=${selectedQRPreview?.tableNumber || 1}`}
                    size={120}
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                    level="H"
                  />
                </div>

                {/* Restaurant Name */}
                <p className="text-center font-bold text-base">{restaurantName}</p>

                {/* Table Number */}
                <p className="text-2xl font-bold text-primary">
                  Table {selectedQRPreview?.tableNumber || 1}
                </p>

                {/* Custom Message */}
                <p className="text-sm text-muted-foreground">{customMessage}</p>

                {/* Website */}
                <p className="text-xs text-muted-foreground mt-auto">resthru.com</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Design Preview Dialog */}
      {selectedQRPreview && (
        <Dialog open={!!selectedQRPreview} onOpenChange={() => setSelectedQRPreview(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>QR Card Design Preview</DialogTitle>
            </DialogHeader>

            {/* Printable Card Design */}
            <div className={`${bgColor.value} border-4 border-border rounded-lg p-8 flex flex-col items-center gap-6 min-h-96`}>
              {/* Resthru Header */}
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-6 h-6 text-primary" />
                <span className="font-bold text-lg text-primary">Resthru</span>
              </div>

              {/* QR Code */}
              <div className="p-3 bg-white rounded-xl shadow-sm border">
                <QRCode
                  value={`${origin}/r/${restaurantId}?table=${selectedQRPreview.tableNumber}`}
                  size={160}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                  level="H"
                />
              </div>

              {/* Restaurant Name */}
              <p className="text-center font-bold text-lg">{restaurantName}</p>

              {/* Table Number */}
              <p className="text-3xl font-bold text-primary">Table {selectedQRPreview.tableNumber}</p>

              {/* Message */}
              <p className="text-base text-muted-foreground">{customMessage}</p>

              {/* Website */}
              <p className="text-sm text-muted-foreground mt-auto">resthru.com</p>
            </div>

            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setSelectedQRPreview(null)} className="flex-1">
                Close
              </Button>
              <Button
                onClick={() => {
                  handlePrintQR(selectedQRPreview.tableNumber);
                  setSelectedQRPreview(null);
                }}
                className="flex-1 bg-primary hover:bg-primary-hover"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Card
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
