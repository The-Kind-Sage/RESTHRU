'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Printer,
  Plus,
  Settings,
  Trash2,
  Power,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const PRINTERS: { id: string; name: string; type: string; ip: string; status: string; model: string; lastPrint: string }[] = [];
const PRINT_QUEUE: { id: string; order: string; type: string; items: number; time: string; status: string }[] = [];
const PRINT_HISTORY: { id: string; order: string; printer: string; date: string; status: string }[] = [];

export default function PrintsPage() {
  const [activeTab, setActiveTab] = useState('printers');

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Print Center</h1>
          <p className="text-muted-foreground">Manage printers and print queue</p>
        </div>
        <Button className="bg-primary hover:bg-primary-dark text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Printer
        </Button>
      </motion.div>

      <Tabs defaultValue="printers" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="printers">Printers</TabsTrigger>
          <TabsTrigger value="queue">Print Queue</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="printers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {PRINTERS.length === 0 ? (
              <div className="col-span-2 text-center py-16 text-muted-foreground">
                <Printer className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No printers configured</p>
                <p className="text-sm mt-1">Click "Add Printer" to set up your first printer.</p>
              </div>
            ) : (
              PRINTERS.map((printer) => (
              <motion.div key={printer.id} variants={itemVariants}>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${printer.status === 'online' ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                          <Printer className={`h-6 w-6 ${printer.status === 'online' ? 'text-primary' : 'text-destructive'}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{printer.name}</h3>
                          <p className="text-sm text-muted-foreground">{printer.model}</p>
                        </div>
                      </div>
                      <Badge variant={printer.status === 'online' ? 'secondary' : 'destructive'}>
                        {printer.status === 'online' ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                    <Separator className="mb-4" />
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <span className="ml-2 text-foreground font-medium">{printer.type}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">IP:</span>
                        <span className="ml-2 text-foreground font-medium">{printer.ip}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Last Print:</span>
                        <span className="ml-2 text-foreground font-medium">{printer.lastPrint}</span>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Power className="h-4 w-4 mr-2" />
                        {printer.status === 'online' ? 'Disable' : 'Enable'}
                      </Button>
                      <Button variant="outline" size="icon">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
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
            <CardHeader>
              <CardTitle>Current Print Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {PRINT_QUEUE.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Print queue is empty</p>
                  </div>
                ) : (
                  PRINT_QUEUE.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                      <div className="flex items-center gap-3">
                        {job.status === 'printing' ? (
                          <RefreshCw className="h-5 w-5 text-primary animate-spin" />
                        ) : job.status === 'pending' ? (
                          <Clock className="h-5 w-5 text-warning" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{job.order}</span>
                            <Badge variant="secondary">{job.type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {job.items} items &middot; {job.time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {job.status === 'printing' && (
                          <Button variant="outline" size="sm">Cancel</Button>
                        )}
                        {job.status === 'pending' && (
                          <Button variant="outline" size="sm">
                            <RefreshCw className="h-3 w-3 mr-1" />Retry
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Print History</CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {PRINT_HISTORY.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No print history yet</p>
                  </div>
                ) : (
                  PRINT_HISTORY.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{entry.order}</span>
                            <Badge variant={entry.status === 'success' ? 'secondary' : 'destructive'}>
                              {entry.status === 'success' ? 'Success' : 'Failed'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {entry.printer} &middot; {entry.date}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">Reprint</Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Print Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Auto-print new orders</p>
                  <p className="text-sm text-muted-foreground">Automatically send new orders to kitchen printer</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Print receipts automatically</p>
                  <p className="text-sm text-muted-foreground">Print customer receipts on order completion</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Duplicate kitchen tickets</p>
                  <p className="text-sm text-muted-foreground">Print two copies of each kitchen order</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Sound alerts on print errors</p>
                  <p className="text-sm text-muted-foreground">Play a notification sound when printing fails</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Paper low warning</p>
                  <p className="text-sm text-muted-foreground">Alert when printer paper is running low</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
