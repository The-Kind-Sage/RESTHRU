'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Users, QrCode, Lock, Unlock, Download, Trash2,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import QRCode from 'react-qr-code';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import { FLOORS } from '@/lib/constants';

interface Table {
  id: string;
  number: number;
  name?: string;
  capacity: number;
  shape: 'square' | 'round' | 'large';
  status: 'available' | 'occupied' | 'bill_requested' | 'reserved';
  floor: string;
  position_x: number;
  position_y: number;
  qr_code_url?: string;
}

const getStatusColors = (status: string) => {
  switch (status) {
    case 'available':     return { bg: 'bg-primary/10',     border: 'border-primary',     badge: 'bg-primary/10 text-primary border border-primary' };
    case 'occupied':      return { bg: 'bg-destructive/10', border: 'border-destructive', badge: 'bg-destructive/10 text-destructive border border-destructive' };
    case 'bill_requested':return { bg: 'bg-amber-500/10',   border: 'border-amber-500',   badge: 'bg-amber-500/10 text-amber-600 border border-amber-400' };
    case 'reserved':      return { bg: 'bg-violet-500/10',  border: 'border-violet-500',  badge: 'bg-violet-500/10 text-violet-600 border border-violet-400' };
    default:              return { bg: 'bg-muted/20',        border: 'border-border',       badge: 'bg-muted text-muted-foreground' };
  }
};

function TableQrDialog({ table, restaurantId }: { table: Table; restaurantId: string }) {
  const [open, setOpen] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const qrUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/r/${restaurantId}/t/${table.id}`
    : `/r/${restaurantId}/t/${table.id}`;

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `table-${table.number}-qr.svg`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setOpen(true)}>
        <QrCode className="w-3.5 h-3.5" /> QR
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Table {table.number} QR</DialogTitle>
            <DialogDescription>Customers scan this to view the menu and order.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-2">
            <div ref={qrRef} className="p-4 bg-white rounded-xl border shadow">
              <QRCode value={qrUrl} size={180} bgColor="#fff" fgColor="#0f172a" level="H" />
            </div>
            <p className="text-xs text-muted-foreground text-center break-all">{qrUrl}</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
            <Button onClick={handleDownload} className="gap-2">
              <Download className="w-4 h-4" /> Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TableGridItem({ table, restaurantId, onClick, isEditMode, onPositionChange, onDelete }: {
  table: Table; restaurantId: string;
  onClick: (t: Table) => void; isEditMode: boolean;
  onPositionChange: (id: string, x: number, y: number) => void;
  onDelete: (table: Table) => void;
}) {
  const colors = getStatusColors(table.status);
  const sizeClass = table.shape === 'large'
    ? 'w-32 h-20'
    : table.shape === 'round'
      ? 'w-20 h-20 rounded-full'
      : 'w-24 h-24';

  // Drag state — all tracked in a ref so no re-renders during drag
  const dragRef = useRef<{
    dragging: boolean;
    startX: number; startY: number;
    origX: number;  origY: number;
  }>({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0 });
  const elRef = useRef<HTMLDivElement>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      dragging: true,
      startX: e.clientX, startY: e.clientY,
      origX: table.position_x, origY: table.position_y,
    };
    elRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.dragging || !isEditMode) return;
    e.preventDefault();
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const newX = Math.max(0, Math.round(dragRef.current.origX + dx));
    const newY = Math.max(0, Math.round(dragRef.current.origY + dy));
    if (elRef.current) {
      elRef.current.style.left = `${newX}px`;
      elRef.current.style.top  = `${newY}px`;
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current.dragging || !isEditMode) return;
    dragRef.current.dragging = false;
    elRef.current?.releasePointerCapture(e.pointerId);
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    // Only treat as a drag if actually moved more than 4px
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      const newX = Math.max(0, Math.round(dragRef.current.origX + dx));
      const newY = Math.max(0, Math.round(dragRef.current.origY + dy));
      onPositionChange(table.id, newX, newY);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isEditMode) onClick(table);
  };

  return (
    <div
      ref={elRef}
      style={{
        position: 'absolute',
        left: `${table.position_x}px`,
        top:  `${table.position_y}px`,
        cursor: isEditMode ? 'grab' : 'pointer',
        userSelect: 'none',
        touchAction: 'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={handleClick}
    >
      <div
        className={`
          ${sizeClass}
          ${table.shape !== 'round' ? 'rounded-lg' : ''}
          ${colors.bg} border-2 ${colors.border}
          flex flex-col items-center justify-center p-2
          transition-shadow hover:shadow-md relative
          ${isEditMode ? 'ring-2 ring-primary/40 ring-offset-1' : ''}
        `}
      >
        {/* Delete button — only visible in edit mode */}
        {isEditMode && (
          <button
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center shadow hover:bg-red-700 transition-colors z-10"
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onDelete(table); }}
            aria-label={`Delete table ${table.number}`}
          >
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        )}

        <div className="text-sm font-bold">T{table.number}</div>
        {table.name && (
          <div className="text-[10px] text-muted-foreground truncate max-w-full px-1">{table.name}</div>
        )}
        <div className="flex items-center gap-1 mt-1">
          <Users className="w-3 h-3" />
          <span className="text-xs">{table.capacity}</span>
        </div>
        {isEditMode && (
          <div className="text-[9px] text-muted-foreground mt-0.5">drag</div>
        )}
      </div>
    </div>
  );
}

function TableDetailDialog({ table, restaurantId, isOpen, onClose, onStatusChange }: {
  table: Table | null; restaurantId: string;
  isOpen: boolean; onClose: () => void;
  onStatusChange: (id: string, status: Table['status']) => void;
}) {
  const [newStatus, setNewStatus] = useState<Table['status']>('available');

  useEffect(() => { if (table) setNewStatus(table.status); }, [table]);

  if (!table) return null;
  const colors = getStatusColors(table.status);
  const statusLabel = table.status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const handleStatusChange = async () => {
    if (!supabase) return;
    const { error } = await supabase.from('tables').update({ status: newStatus }).eq('id', table.id);
    if (error) { toast.error(error.message); return; }
    onStatusChange(table.id, newStatus);
    toast.success('Table status updated');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Table {table.number}{table.name ? ` — ${table.name}` : ''}</DialogTitle>
          <DialogDescription>Capacity: {table.capacity} people · {table.floor}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Current status:</span>
            <Badge className={colors.badge}>{statusLabel}</Badge>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Change Status</label>
            <Select value={newStatus} onValueChange={v => setNewStatus(v as Table['status'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="bill_requested">Bill Requested</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="pt-1">
            <TableQrDialog table={table} restaurantId={restaurantId} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleStatusChange}>Update Status</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddTableDialog({ isOpen, onClose, restaurantId, existingCount, defaultFloor, onAdded }: {
  isOpen: boolean; onClose: () => void;
  restaurantId: string; existingCount: number; defaultFloor: string;
  onAdded: (table: Table) => void;
}) {
  const [tableNumber, setTableNumber] = useState('');
  const [tableName, setTableName] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [shape, setShape] = useState<'square' | 'round' | 'large'>('square');
  const [floor, setFloor] = useState('Ground Floor');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTableNumber(String(existingCount + 1));
      setFloor(defaultFloor);
    }
  }, [isOpen, existingCount, defaultFloor]);

  const handleAdd = async () => {
    if (!tableNumber || !supabase) return;
    setIsSaving(true);

    const GRID_COLS = 5;
    const idx = existingCount;
    const col = idx % GRID_COLS;
    const row = Math.floor(idx / GRID_COLS);
    const x = 50 + col * 150;
    const y = 50 + row * 150;

    const { data, error } = await supabase.from('tables').insert([{
      restaurant_id: restaurantId,
      table_number: parseInt(tableNumber),
      name: tableName || null,
      capacity: parseInt(capacity),
      shape,
      floor,
      status: 'available',
      position_x: x,
      position_y: y,
    }]).select('*').single();

    setIsSaving(false);
    if (error) { toast.error(error.message); return; }

    onAdded({
      id: data.id,
      number: data.table_number,
      name: data.name,
      capacity: data.capacity,
      shape: data.shape,
      status: data.status,
      floor: data.floor,
      position_x: data.position_x,
      position_y: data.position_y,
    });
    toast.success(`Table ${data.table_number} added`);
    onClose();
    setTableNumber(''); setTableName(''); setCapacity('4'); setShape('square'); setFloor('Ground Floor');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Table</DialogTitle>
          <DialogDescription>Create a new table in your restaurant layout</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Table Number *</label>
              <Input type="number" placeholder="1" value={tableNumber} onChange={e => setTableNumber(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Capacity</label>
              <Input type="number" placeholder="4" value={capacity} onChange={e => setCapacity(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Table Name / Label (optional)</label>
            <Input placeholder="e.g., Window Table" value={tableName} onChange={e => setTableName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Shape</label>
            <Select value={shape} onValueChange={v => setShape(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="square">Square</SelectItem>
                <SelectItem value="round">Round</SelectItem>
                <SelectItem value="large">Large (8+ seater)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Floor</label>
            <Select value={floor} onValueChange={setFloor}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(FLOORS ?? ['Ground Floor', 'First Floor', 'Rooftop']).map(f => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleAdd} disabled={isSaving || !tableNumber}>
            {isSaving ? 'Adding...' : 'Add Table'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TableMapPage() {
  const { restaurant } = useAuthStore();
  const restaurantId = restaurant?.id || '';
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState('Ground Floor');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [tableDetailOpen, setTableDetailOpen] = useState(false);
  const [addTableOpen, setAddTableOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Table | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce timer ref — save position to DB 600ms after last drag end
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDeleteTable = async () => {
    if (!deleteTarget || !supabase) return;
    setIsDeleting(true);
    const { error } = await supabase.from('tables').delete().eq('id', deleteTarget.id);
    setIsDeleting(false);
    if (error) { toast.error(error.message); return; }
    setTables(prev => prev.filter(t => t.id !== deleteTarget.id));
    toast.success(`Table ${deleteTarget.number} deleted`);
    setDeleteTarget(null);
  };

  const handlePositionChange = (id: string, x: number, y: number) => {
    // Update local state immediately so the UI feels instant
    setTables(prev => prev.map(t => t.id === id ? { ...t, position_x: x, position_y: y } : t));

    // Debounce the DB write
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (!supabase) return;
      const { error } = await supabase
        .from('tables')
        .update({ position_x: Math.round(x), position_y: Math.round(y) })
        .eq('id', id);
      if (error) {
        console.error('Table position save error:', error);
        toast.error(`Position save failed: ${error.message}`);
      }
    }, 600);
  };

  useEffect(() => {
    if (!supabase || !restaurantId) return;
    setIsLoading(true);
    supabase.from('tables').select('*').eq('restaurant_id', restaurantId).then(({ data, error }) => {
      setIsLoading(false);
      if (error) { toast.error('Failed to load tables'); return; }
      if (data) setTables(data.map((t: any) => ({
        id: t.id, number: t.table_number, name: t.name,
        capacity: t.capacity, shape: t.shape || 'square',
        status: t.status || 'available', floor: t.floor || 'Ground Floor',
        position_x: t.position_x || 50, position_y: t.position_y || 50,
        qr_code_url: t.qr_code_url,
      })));
    });
  }, [restaurantId]);

  const floorTables = tables.filter(t => t.floor === selectedFloor);
  const floors = FLOORS ?? ['Ground Floor', 'First Floor', 'Rooftop'];

  const counts = {
    available: floorTables.filter(t => t.status === 'available').length,
    occupied: floorTables.filter(t => t.status === 'occupied').length,
    billRequested: floorTables.filter(t => t.status === 'bill_requested').length,
    reserved: floorTables.filter(t => t.status === 'reserved').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Table Map</h1>
          <p className="text-muted-foreground mt-1">Manage your restaurant floor layout and table status</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={isEditMode ? 'default' : 'outline'} onClick={() => setIsEditMode(!isEditMode)} className="gap-2">
            {isEditMode ? <><Lock className="w-4 h-4" />Done Editing</> : <><Unlock className="w-4 h-4" />Edit Layout</>}
          </Button>
          <Button onClick={() => setAddTableOpen(true)} className="gap-2 bg-primary hover:bg-primary-hover">
            <Plus className="w-4 h-4" /> Add Table
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="space-y-4">
            <Tabs value={selectedFloor} onValueChange={setSelectedFloor} className="w-fit">
              <TabsList>
                {floors.map(f => <TabsTrigger key={f} value={f}>{f}</TabsTrigger>)}
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-6 flex-wrap text-sm">
              {[
                { label: 'Available', count: counts.available, color: '#22c55e' },
                { label: 'Occupied', count: counts.occupied, color: '#ef4444' },
                { label: 'Bill Requested', count: counts.billRequested, color: '#f59e0b' },
                { label: 'Reserved', count: counts.reserved, color: '#8b5cf6' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="font-medium">{s.count} {s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[500px] flex items-center justify-center text-muted-foreground">Loading tables...</div>
          ) : (
            <div className="relative w-full min-h-[500px] bg-muted/20 rounded-xl border-2 border-dashed overflow-auto">
              {floorTables.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <p className="font-medium">No tables on this floor</p>
                  <p className="text-sm">Click "Add Table" to place your first table.</p>
                </div>
              ) : (
                floorTables.map(table => (
                  <TableGridItem
                    key={table.id}
                    table={table}
                    restaurantId={restaurantId}
                    onClick={t => { setSelectedTable(t); setTableDetailOpen(true); }}
                    isEditMode={isEditMode}
                    onPositionChange={handlePositionChange}
                    onDelete={t => setDeleteTarget(t)}
                  />
                ))
              )}
            </div>
          )}

          {/* Mobile list view */}
          {floorTables.length > 0 && (
            <div className="md:hidden space-y-2 mt-4">
              {floorTables.map(table => {
                const colors = getStatusColors(table.status);
                const label = table.status.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
                return (
                  <motion.div key={table.id} whileTap={{ scale: 0.97 }}
                    onClick={() => { setSelectedTable(table); setTableDetailOpen(true); }}
                    className={`p-4 rounded-lg border-2 ${colors.border} ${colors.bg} cursor-pointer flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold">Table {table.number}</span>
                      <Badge className={colors.badge}>{label}</Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="w-4 h-4" />{table.capacity}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <TableDetailDialog
        table={selectedTable}
        restaurantId={restaurantId}
        isOpen={tableDetailOpen}
        onClose={() => { setTableDetailOpen(false); setSelectedTable(null); }}
        onStatusChange={(id, status) => setTables(prev => prev.map(t => t.id === id ? { ...t, status } : t))}
      />

      <AddTableDialog
        isOpen={addTableOpen}
        onClose={() => setAddTableOpen(false)}
        restaurantId={restaurantId}
        existingCount={tables.length}
        defaultFloor={selectedFloor}
        onAdded={t => setTables(prev => [...prev, t])}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Table {deleteTarget?.number}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.name ? `"${deleteTarget.name}" — ` : ''}
              Capacity {deleteTarget?.capacity} · {deleteTarget?.floor}.
              This will permanently remove the table and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTable}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete Table'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
