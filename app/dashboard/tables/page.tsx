'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Users,
  Copy,
  Share2,
  QrCode,
  Lock,
  Unlock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FLOORS } from '@/lib/constants';

interface Table {
  id: number;
  number: string;
  capacity: number;
  shape: 'square' | 'round' | 'large';
  status: 'available' | 'occupied' | 'bill_requested' | 'reserved';
  x: number;
  y: number;
  floor: string;
  ordersCount?: number;
  timeSeated?: string;
  totalBill?: number;
}

const mockTables: Table[] = [];

const getStatusColors = (status: string) => {
  switch (status) {
    case 'available':
      return {
        bg: 'bg-primary/20',
        border: 'border-primary',
        text: 'text-primary',
        badge: 'bg-primary/20 text-primary border border-primary',
      };
    case 'occupied':
      return {
        bg: 'bg-destructive/20',
        border: 'border-destructive',
        text: 'text-destructive',
        badge: 'bg-destructive/20 text-destructive border border-destructive',
      };
    case 'bill_requested':
      return {
        bg: 'bg-accent/20',
        border: 'border-accent',
        text: 'text-warning',
        badge: 'bg-accent/20 text-warning border border-accent',
      };
    case 'reserved':
      return {
        bg: 'bg-muted0/20',
        border: 'border-border',
        text: 'text-foreground',
        badge: 'bg-muted0/20 text-foreground border border-border',
      };
    default:
      return {
        bg: 'bg-muted0/20',
        border: 'border-border',
        text: 'text-muted-foreground',
        badge: 'bg-muted0/20 text-muted-foreground border border-border',
      };
  }
};

const getStatusIndicatorColor = (status: string) => {
  switch (status) {
    case 'available':
      return '#22c55e';
    case 'occupied':
      return '#ef4444';
    case 'bill_requested':
      return '#f59e0b';
    case 'reserved':
      return '#8b5cf6';
    default:
      return '#6b7280';
  }
};

function TableGridItem({ table, onTableClick, isEditMode }: { table: Table; onTableClick: (table: Table) => void; isEditMode: boolean }) {
  const colors = getStatusColors(table.status);
  const isRound = table.shape === 'round';
  const isLarge = table.shape === 'large';

  const baseSize = isLarge ? 120 : isRound ? 80 : 100;

  return (
    <motion.div
      whileHover={{ scale: isEditMode ? 1 : 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        position: 'absolute',
        left: `${table.x}px`,
        top: `${table.y}px`,
      }}
      onClick={() => !isEditMode && onTableClick(table)}
      className="cursor-pointer"
    >
      {isRound ? (
        <div
          className={`w-20 h-20 rounded-full ${colors.bg} border-2 ${colors.border} flex flex-col items-center justify-center p-2 transition-all ${!isEditMode && 'hover:shadow-lg'}`}
        >
          <div className="text-sm font-bold text-center">T{table.number}</div>
          <Users className="w-3 h-3 mt-1" />
          {table.status !== 'available' && table.ordersCount && (
            <Badge className="mt-1 text-xs px-1 py-0">
              {table.ordersCount} items
            </Badge>
          )}
        </div>
      ) : isLarge ? (
        <div
          className={`w-32 h-20 rounded-lg ${colors.bg} border-2 ${colors.border} flex flex-col items-center justify-center p-2 transition-all ${!isEditMode && 'hover:shadow-lg'}`}
        >
          <div className="text-base font-bold">T{table.number}</div>
          <div className="flex items-center gap-1 mt-1">
            <Users className="w-4 h-4" />
            <span className="text-xs">{table.capacity}</span>
          </div>
          {table.status !== 'available' && table.ordersCount && (
            <Badge className="mt-1 text-xs px-1 py-0">
              {table.ordersCount} items
            </Badge>
          )}
        </div>
      ) : (
        <div
          className={`w-24 h-24 rounded-lg ${colors.bg} border-2 ${colors.border} flex flex-col items-center justify-center p-2 transition-all ${!isEditMode && 'hover:shadow-lg'}`}
        >
          <div className="text-sm font-bold">T{table.number}</div>
          <Users className="w-3 h-3 mt-1" />
          {table.status !== 'available' && table.ordersCount && (
            <Badge className="mt-1 text-xs px-1 py-0">
              {table.ordersCount} items
            </Badge>
          )}
        </div>
      )}
    </motion.div>
  );
}

function TableDetailDialog({ table, isOpen, onClose }: { table: Table | null; isOpen: boolean; onClose: () => void }) {
  if (!table) return null;

  const colors = getStatusColors(table.status);
  const statusLabel = table.status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Table {table.number}</DialogTitle>
          <DialogDescription>
            Capacity: {table.capacity} people
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge className={colors.badge}>{statusLabel}</Badge>
          </div>

          {table.status === 'occupied' || table.status === 'bill_requested' ? (
            <div className="bg-muted p-3 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order Items:</span>
                <span className="font-medium">{table.ordersCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time Seated:</span>
                <span className="font-medium">{table.timeSeated}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Bill:</span>
                <span className="font-medium">NPR {table.totalBill?.toLocaleString()}</span>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium">Change Status</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="bill_requested">Bill Requested</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button variant="outline" size="sm">
            Add Items
          </Button>
          <Button variant="outline" size="sm">
            Request Bill
          </Button>
          <Button variant="outline" size="sm">
            Transfer Table
          </Button>
          <Button variant="outline" size="sm">
            Merge Tables
          </Button>
          <Button variant="outline" size="sm">
            Print KOT
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <QrCode className="w-4 h-4" />
            Generate QR
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddTableDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [tableNumber, setTableNumber] = useState('');
  const [tableName, setTableName] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [shape, setShape] = useState('square');
  const [floor, setFloor] = useState('Ground Floor');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Table</DialogTitle>
          <DialogDescription>
            Create a new table in your restaurant layout
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Table Number
              </label>
              <Input
                type="number"
                placeholder="21"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Capacity
              </label>
              <Input
                type="number"
                placeholder="4"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Table Name/Label
            </label>
            <Input
              placeholder="e.g., Window Table"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Shape</label>
            <Select value={shape} onValueChange={setShape}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="square">Square (4 seater)</SelectItem>
                <SelectItem value="round">Round (2 seater)</SelectItem>
                <SelectItem value="large">Large (8 seater)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Floor</label>
            <Select value={floor} onValueChange={setFloor}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FLOORS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-2 border-dashed rounded-lg p-8 bg-muted/30 flex flex-col items-center justify-center gap-2">
            <QrCode className="w-8 h-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">QR Code Preview</span>
          </div>

          <Button variant="outline" className="w-full gap-2">
            <QrCode className="w-4 h-4" />
            Generate QR Code
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose} className="bg-primary hover:bg-primary-hover">
            Add Table
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TableMapPage() {
  const [selectedFloor, setSelectedFloor] = useState('Ground Floor');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [tableDetailOpen, setTableDetailOpen] = useState(false);
  const [addTableOpen, setAddTableOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const floorTables = mockTables.filter((t) => t.floor === selectedFloor);

  const available = floorTables.filter((t) => t.status === 'available').length;
  const occupied = floorTables.filter((t) => t.status === 'occupied').length;
  const billRequested = floorTables.filter(
    (t) => t.status === 'bill_requested'
  ).length;
  const reserved = floorTables.filter((t) => t.status === 'reserved').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Table Map</h1>
          <p className="text-muted-foreground mt-1">
            Manage your restaurant floor layout and table status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isEditMode ? 'default' : 'outline'}
            onClick={() => setIsEditMode(!isEditMode)}
            className="gap-2"
          >
            {isEditMode ? (
              <>
                <Lock className="w-4 h-4" />
                Done Editing
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                Edit Layout
              </>
            )}
          </Button>
          <Button
            onClick={() => setAddTableOpen(true)}
            className="gap-2 bg-primary hover:bg-primary-hover"
          >
            <Plus className="w-4 h-4" />
            Add Table
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="space-y-4">
            <Tabs
              value={selectedFloor}
              onValueChange={setSelectedFloor}
              className="w-fit"
            >
              <TabsList>
                {FLOORS.map((floor) => (
                  <TabsTrigger key={floor} value={floor}>
                    {floor}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: '#22c55e' }}
                />
                <span className="text-sm font-medium">{available} Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: '#ef4444' }}
                />
                <span className="text-sm font-medium">{occupied} Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: '#f59e0b' }}
                />
                <span className="text-sm font-medium">
                  {billRequested} Bill Requested
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: '#8b5cf6' }}
                />
                <span className="text-sm font-medium">{reserved} Reserved</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="hidden md:block">
            <div className="relative w-full min-h-[500px] bg-muted/30 rounded-lg border-2 border-dashed overflow-auto">
              {floorTables.map((table) => (
                <TableGridItem
                  key={table.id}
                  table={table}
                  onTableClick={(table) => {
                    setSelectedTable(table);
                    setTableDetailOpen(true);
                  }}
                  isEditMode={isEditMode}
                />
              ))}
            </div>
          </div>

          <div className="md:hidden space-y-2">
            {floorTables.map((table) => {
              const colors = getStatusColors(table.status);
              const statusLabel = table.status
                .split('_')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

              return (
                <motion.div
                  key={table.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedTable(table);
                    setTableDetailOpen(true);
                  }}
                  className={`p-4 rounded-lg border-2 ${colors.border} ${colors.bg} cursor-pointer transition-all`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="font-bold text-lg">Table {table.number}</div>
                      <Badge className={colors.badge}>{statusLabel}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{table.capacity}</span>
                    </div>
                  </div>
                  {table.ordersCount && (
                    <div className="text-xs text-muted-foreground mt-2">
                      {table.ordersCount} items • {table.timeSeated}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <TableDetailDialog
        table={selectedTable}
        isOpen={tableDetailOpen}
        onClose={() => {
          setTableDetailOpen(false);
          setSelectedTable(null);
        }}
      />

      <AddTableDialog
        isOpen={addTableOpen}
        onClose={() => setAddTableOpen(false)}
      />
    </div>
  );
}
