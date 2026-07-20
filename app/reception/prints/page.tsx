'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Printer, Plus, Settings, RefreshCw,
  Clock, FileText, Download, WifiOff,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { getSettingsData } from '@/lib/actions/settings';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function PrintsPage() {
  const { restaurant } = useAuthStore();
  const restaurantId = restaurant?.id;
  const [activeTab, setActiveTab] = useState('printers');
  const [printers, setPrinters] = useState<Array<{ name: string; type: string; ip: string; status: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingIdx, setRefreshingIdx] = useState<number | null>(null);

  const fetchPrinters = useCallback(async (showLoader = false) => {
    if (!restaurantId) return;
    if (showLoader) setLoading(true);
    const res = await getSettingsData(restaurantId);
    if ("data" in res && res.data) {
      const config = (res.data as any).printer_config || [];
      setPrinters(config.map((p: any) => ({ ...p, status: 'unverified' })));
    }
    if (showLoader) setLoading(false);
  }, [restaurantId]);

  const handleRefreshPrinter = async (idx: number) => {
    setRefreshingIdx(idx);
    await fetchPrinters();
    setRefreshingIdx(null);
    toast.success('Printer list refreshed');
  };

  useEffect(() => {
    fetchPrinters(true);
  }, [restaurantId, fetchPrinters]);

  const handlePrintTest = async (printer: any) => {
    toast.success(`Test page sent to ${printer.name}`);
    const w = window.open('', '', 'width=300,height=400');
    if (w) {
      w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Test Print</title><style>body{font-family:monospace;padding:10mm;text-align:center}@page{margin:0;size:80mm auto}</style></head><body><h2>Test Print</h2><p>Printer: ${printer.name}</p><p>${printer.ip}</p><p>If you can read this, the printer is working.</p><p style="margin-top:20px;">---</p></body></html>`);
      w.document.close();
      setTimeout(() => w.print(), 300);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Print Center</h1>
          <p className="text-muted-foreground">Manage printers and print queue</p>
        </div>
        <Link href="/reception/settings">
          <Button className="bg-primary hover:bg-primary-dark text-white w-full sm:w-auto">
            <Settings className="h-4 w-4 mr-2" /> Printer Settings
          </Button>
        </Link>
      </motion.div>

      <Tabs defaultValue="printers" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="printers">Printers</TabsTrigger>
          <TabsTrigger value="queue">Print Queue</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="printers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-2 text-center py-16 text-muted-foreground">Loading...</div>
            ) : printers.length === 0 ? (
              <div className="col-span-2 text-center py-16 text-muted-foreground">
                <Printer className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No printers configured</p>
                <p className="text-sm mt-1">
                  <Link href="/reception/settings" className="text-primary hover:underline">
                    Go to Settings
                  </Link> to add one.
                </p>
              </div>
            ) : (
              printers.map((printer, idx) => (
                <motion.div key={`${printer.name}-${idx}`} variants={itemVariants}>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-lg bg-muted/30">
                            <Printer className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{printer.name}</h3>
                            <p className="text-sm text-muted-foreground">{printer.type}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-muted-foreground">
                          Unverified
                        </Badge>
                      </div>
                      <Separator className="mb-4" />
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-muted-foreground">IP:</span><span className="ml-2 text-foreground font-medium">{printer.ip}</span></div>
                        <div>
                          <span className="flex items-center gap-1 text-muted-foreground"><WifiOff className="w-3 h-3" /> Not verified</span>
                        </div>
                      </div>
                      <Separator className="my-4" />
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handlePrintTest(printer)}>
                          <FileText className="h-4 w-4 mr-2" /> Test Print
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleRefreshPrinter(idx)} disabled={refreshingIdx === idx}>
                          <RefreshCw className={`h-4 w-4 ${refreshingIdx === idx ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => window.open('/reception/settings', '_self')}>
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Current Print Queue</CardTitle></CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Not available yet</p>
                <p className="text-sm mt-1">Print queue tracking will be available in a future update.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Print History</CardTitle>
                <Button variant="outline" size="sm" disabled><Download className="h-4 w-4 mr-2" /> Export</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Not available yet</p>
                <p className="text-sm mt-1">Print history will be available in a future update.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
