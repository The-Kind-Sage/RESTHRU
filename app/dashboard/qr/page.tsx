'use client';

import { useState } from 'react';
import { Download, Printer, Info, X, UtensilsCrossed } from 'lucide-react';
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

const FLOOR_NAMES = ['Ground Floor', 'First Floor', 'Second Floor'];
const TABLES_PER_FLOOR = Math.ceil(20 / FLOOR_NAMES.length);

const QR_CODE_COLORS = [
  { label: 'White', value: 'bg-background', border: 'border-border' },
  { label: 'Indigo Light', value: 'bg-primary-light', border: 'border-primary/20' },
  { label: 'Emerald Light', value: 'bg-primary-light', border: 'border-primary/20' },
  { label: 'Amber Light', value: 'bg-accent-light', border: 'border-accent/20' },
];

interface TableQRData {
  tableNumber: number;
  floor: string;
}

export default function QRCodeCenterPage() {
  const [selectedQRPreview, setSelectedQRPreview] = useState<TableQRData | null>(null);
  const [bgColor, setBgColor] = useState(QR_CODE_COLORS[0]);
  const [customMessage, setCustomMessage] = useState('Scan to Order');
  const [dismissBanner, setDismissBanner] = useState(false);

  // Generate mock table data
  const tables: TableQRData[] = Array.from({ length: 20 }, (_, i) => {
    const floorIndex = Math.floor(i / TABLES_PER_FLOOR);
    return {
      tableNumber: i + 1,
      floor: FLOOR_NAMES[Math.min(floorIndex, FLOOR_NAMES.length - 1)],
    };
  });

  const handleDownloadQR = (tableNumber: number) => {
    // Mock download functionality
    console.log(`Downloading QR code for Table ${tableNumber}`);
  };

  const handlePrintQR = (tableNumber: number) => {
    // Mock print functionality
    console.log(`Printing QR code for Table ${tableNumber}`);
  };

  const handleDownloadAll = () => {
    console.log('Downloading all QR codes');
  };

  const handlePrintAll = () => {
    console.log('Printing all QR codes');
  };

  const QRPlaceholder = () => (
    <div className="w-[120px] h-[120px] bg-gradient-to-br from-muted to-muted rounded-lg flex items-center justify-center text-center">
      <svg className="w-20 h-20 text-muted-foreground" viewBox="0 0 100 100" fill="none">
        <rect x="10" y="10" width="25" height="25" fill="currentColor" opacity="0.8" />
        <rect x="40" y="10" width="8" height="8" fill="currentColor" opacity="0.6" />
        <rect x="55" y="10" width="8" height="8" fill="currentColor" opacity="0.6" />
        <rect x="70" y="10" width="20" height="25" fill="currentColor" opacity="0.8" />
        <rect x="10" y="40" width="8" height="8" fill="currentColor" opacity="0.6" />
        <rect x="25" y="40" width="8" height="8" fill="currentColor" opacity="0.6" />
        <rect x="40" y="55" width="25" height="25" fill="currentColor" opacity="0.7" />
        <rect x="70" y="55" width="8" height="8" fill="currentColor" opacity="0.6" />
        <rect x="82" y="55" width="8" height="8" fill="currentColor" opacity="0.6" />
      </svg>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">QR Code Center</h1>
          <p className="text-muted-foreground mt-1">
            Manage and customize QR codes for all your tables
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={handleDownloadAll}>
            <Download className="w-4 h-4 mr-2" />
            Download All QR Codes
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrintAll}>
            <Printer className="w-4 h-4 mr-2" />
            Print All
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
                  Place these QR codes on your tables. Customers scan to view menu and
                  order. Staff scan to quickly identify tables.
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

      {/* QR Code Grid */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Table QR Codes</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tables.map((table) => (
              <Card
                key={table.tableNumber}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedQRPreview(table)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-center mb-3">
                    <QRPlaceholder />
                  </div>
                  <div className="text-center mb-3">
                    <p className="font-semibold text-sm">Table {table.tableNumber}</p>
                    <p className="text-xs text-muted-foreground">{table.floor}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadQR(table.tableNumber);
                      }}
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrintQR(table.tableNumber);
                      }}
                    >
                      <Printer className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Customization Section */}
      <Card>
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
                          ? `border-primary ring-2 ring-primary/20`
                          : `border-border hover:border-border`
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

              <Button className="w-full bg-primary hover:bg-primary-hover">
                Apply to All Tables
              </Button>
            </div>

            {/* Live Preview */}
            <div>
              <label className="text-sm font-medium mb-3 block">Live Preview</label>
              <div className={`${bgColor.value} border-2 ${bgColor.border} rounded-lg p-6 flex flex-col items-center gap-4 min-h-96`}>
                {/* Resthru Header */}
                <div className="flex items-center gap-2 mb-2">
                  <UtensilsCrossed className="w-5 h-5 text-primary" />
                  <span className="font-bold text-primary">Resthru</span>
                </div>

                {/* QR Code */}
                <div className="mb-4">
                  <QRPlaceholder />
                </div>

                {/* Restaurant Name */}
                <p className="text-center font-bold text-base">Himalayan Kitchen</p>

                {/* Table Number */}
                <p className="text-2xl font-bold text-primary">Table 5</p>

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
            <div className={`${bgColor.value} border-4 border-border rounded-lg p-8 flex flex-col items-center gap-6 min-h-96 bg-background`}>
              {/* Resthru Header */}
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-6 h-6 text-primary" />
                <span className="font-bold text-lg text-primary">Resthru</span>
              </div>

              {/* QR Code */}
              <div>
                <QRPlaceholder />
              </div>

              {/* Restaurant Name */}
              <p className="text-center font-bold text-lg">Himalayan Kitchen</p>

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
