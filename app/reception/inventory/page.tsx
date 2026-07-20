'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, X, Plus, Clock, Search,
  TrendingUp, TrendingDown, AlertCircle, Check,
} from 'lucide-react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { formatRelativeTime } from '@/lib/format';
import { useAuthStore } from '@/store/auth-store';
import {
  getInventoryItems, addInventoryItem,
  updateInventoryStock, addStock, recordUsage, getInventoryHistory,
} from '@/lib/actions/inventory';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

const statusColors: { [key: string]: string } = {
  Healthy:        'bg-primary-light text-primary',
  Low:            'bg-accent-light text-warning',
  'Out of Stock': 'bg-destructive/10 text-destructive',
};

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  minThreshold: number;
  lastUpdated: Date;
  status: string;
}

function getItemStatus(currentStock: number, minThreshold: number): string {
  if (currentStock <= 0) return 'Out of Stock';
  if (currentStock <= minThreshold) return 'Low';
  return 'Healthy';
}

type HistoryEntry = {
  id: string;
  movementType: string;
  quantity: number;
  reason: string | null;
  createdAt: string | Date;
};

function StockHistoryDialog({ item, onStockChanged }: {
  item: InventoryItem;
  onStockChanged: (id: string, newStock: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [showAddStock, setShowAddStock] = useState(false);
  const [showRecordUsage, setShowRecordUsage] = useState(false);
  const [addQty, setAddQty] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [usageQty, setUsageQty] = useState('');
  const [usageNotes, setUsageNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [trend, setTrend] = useState<{ day: string; stock: number }[]>([]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    setHistoryError(null);
    const result = await getInventoryHistory(item.id);
    setIsLoadingHistory(false);
    if (result.error) { setHistoryError(result.error); return; }
    if (result.data) {
      setEntries(result.data.entries);
      setTrend(result.data.trend);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) loadHistory();
  };

  const handleAddStock = async () => {
    const qty = parseFloat(addQty);
    if (!qty || qty <= 0) { toast.error('Enter a quantity greater than 0'); return; }
    setIsSubmitting(true);
    const result = await addStock(item.id, qty, addNotes || undefined);
    setIsSubmitting(false);
    if (result.error) { toast.error(result.error); return; }
    if (result.data) {
      onStockChanged(item.id, result.data.currentQuantity);
      toast.success(`Added ${qty} ${item.unit}`);
      setAddQty(''); setAddNotes(''); setShowAddStock(false);
      loadHistory();
    }
  };

  const handleRecordUsage = async () => {
    const qty = parseFloat(usageQty);
    if (!qty || qty <= 0) { toast.error('Enter a quantity greater than 0'); return; }
    setIsSubmitting(true);
    const result = await recordUsage(item.id, qty, usageNotes || undefined);
    setIsSubmitting(false);
    if (result.error) { toast.error(result.error); return; }
    if (result.data) {
      onStockChanged(item.id, result.data.currentQuantity);
      toast.success(`Recorded usage of ${qty} ${item.unit}`);
      setUsageQty(''); setUsageNotes(''); setShowRecordUsage(false);
      loadHistory();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          onClick={(e) => e.stopPropagation()}
        >
          <Clock className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Stock History - {item.name}</DialogTitle>
          <DialogDescription>
            View stock movements and trends for this item
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-primary hover:bg-primary-hover"
              onClick={() => { setShowAddStock(!showAddStock); setShowRecordUsage(false); }}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Add Stock
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setShowRecordUsage(!showRecordUsage); setShowAddStock(false); }}
            >
              <TrendingDown className="h-4 w-4 mr-2" />
              Record Usage
            </Button>
          </div>

          {showAddStock && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Quantity to Add ({item.unit})
                </label>
                <Input type="number" placeholder="0" min="0" value={addQty} onChange={e => setAddQty(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Notes
                </label>
                <Input placeholder="Add notes..." value={addNotes} onChange={e => setAddNotes(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-primary" onClick={handleAddStock} disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Stock'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddStock(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {showRecordUsage && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Quantity Used ({item.unit})
                </label>
                <Input type="number" placeholder="0" min="0" value={usageQty} onChange={e => setUsageQty(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Notes
                </label>
                <Input placeholder="Add notes..." value={usageNotes} onChange={e => setUsageNotes(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-accent hover:bg-accent/80" onClick={handleRecordUsage} disabled={isSubmitting}>
                  {isSubmitting ? 'Recording...' : 'Record Usage'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowRecordUsage(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <p className="font-medium text-sm">Recent Movements</p>
            {isLoadingHistory ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
              </div>
            ) : historyError ? (
              <p className="text-sm text-destructive py-4">{historyError}</p>
            ) : entries.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No movements recorded yet for this item.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {entries.map(e => (
                  <div key={e.id} className="flex items-center justify-between text-sm p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {e.movementType === 'USAGE'
                        ? <TrendingDown className="h-4 w-4 text-destructive" />
                        : <TrendingUp className="h-4 w-4 text-success" />}
                      <div>
                        <p className="font-medium">
                          {e.movementType === 'USAGE' ? 'Used' : e.movementType === 'ADJUSTMENT' ? 'Adjusted' : 'Added'} {Math.abs(e.quantity)} {item.unit}
                          {e.reason ? ` — ${e.reason}` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatRelativeTime(new Date(e.createdAt))}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="font-medium text-sm">Stock Level Trend</p>
            {isLoadingHistory ? (
              <Skeleton className="h-[250px] w-full rounded-lg" />
            ) : trend.length <= 1 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Not enough movement history yet to chart a trend.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="stock"
                    stroke="hsl(var(--primary))"
                    dot={{ fill: 'hsl(var(--primary))' }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddInventoryDialog({ restaurantId, onAdded }: {
  restaurantId: string;
  onAdded: (item: InventoryItem) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    itemName: '', category: '', currentStock: '', unit: 'kg', minThreshold: '',
  });

  const resetForm = () => setFormData({ itemName: '', category: '', currentStock: '', unit: 'kg', minThreshold: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) { toast.error('Not authenticated'); return; }
    if (!formData.itemName || !formData.currentStock || !formData.minThreshold) {
      toast.error('Please fill all required fields'); return;
    }
    setIsSaving(true);
    const stock   = parseFloat(formData.currentStock);
    const minThr  = parseFloat(formData.minThreshold);
    const result = await addInventoryItem({
      restaurantId,
      name:          formData.itemName,
      category:      formData.category || '',
      currentStock:  stock,
      unit:          formData.unit,
      minThreshold:  minThr,
    });

    setIsSaving(false);
    if (result.error) { toast.error(result.error); return; }
    if (!result.data) return;

    const item = result.data;
    onAdded({
      id:           item.id,
      name:         item.name,
      category:     item.description || '',
      currentStock: item.currentQuantity,
      unit:         item.unit,
      minThreshold: item.reorderLevel,
      lastUpdated:  new Date(item.updatedAt),
      status:       getItemStatus(item.currentQuantity, item.reorderLevel),
    });
    toast.success(`${item.name} added to inventory`);
    setIsOpen(false);
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary-hover">
          <Plus className="h-4 w-4 mr-2" />Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Inventory Item</DialogTitle>
          <DialogDescription>Add a new item to your restaurant inventory.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Item Name *</label>
            <Input placeholder="e.g., Chicken" value={formData.itemName}
              onChange={e => setFormData({ ...formData, itemName: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <Input placeholder="e.g., Meat" value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Current Stock *</label>
              <Input type="number" placeholder="0" min="0" value={formData.currentStock}
                onChange={e => setFormData({ ...formData, currentStock: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unit *</label>
              <Select value={formData.unit} onValueChange={v => setFormData({ ...formData, unit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="pcs">pcs</SelectItem>
                  <SelectItem value="liters">liters</SelectItem>
                  <SelectItem value="grams">grams</SelectItem>
                  <SelectItem value="dozen">dozen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Minimum Threshold *</label>
            <Input type="number" placeholder="0" min="0" value={formData.minThreshold}
              onChange={e => setFormData({ ...formData, minThreshold: e.target.value })} required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setIsOpen(false); resetForm(); }} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary" disabled={isSaving}>
              {isSaving ? 'Adding...' : 'Add Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditableStockCell({
  itemId,
  value,
  unit,
  onSaved,
}: {
  itemId: string;
  value: number;
  unit: string;
  onSaved: (newValue: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const [isSaving, setIsSaving] = useState(false);

  // Re-sync the edit buffer if the underlying value changes elsewhere
  // (e.g. Add Stock / Record Usage in StockHistoryDialog) while not editing.
  useEffect(() => {
    if (!isEditing) setEditValue(value.toString());
  }, [value, isEditing]);

  const handleSave = async () => {
    const parsed = parseFloat(editValue);
    if (Number.isNaN(parsed) || parsed < 0) {
      toast.error('Enter a valid, non-negative quantity');
      return;
    }
    if (parsed === value) { setIsEditing(false); return; }
    setIsSaving(true);
    const result = await updateInventoryStock(itemId, parsed);
    setIsSaving(false);
    if (result.error) {
      toast.error(result.error);
      setEditValue(value.toString()); // revert — do not silently keep a stale/unsent value
      return;
    }
    onSaved(parsed);
    toast.success('Stock updated');
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value.toString());
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
          className="w-20"
          min="0"
          autoFocus
          disabled={isSaving}
        />
        <span className="text-sm">{unit}</span>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-success"
          onClick={handleSave}
          disabled={isSaving}
          title="Save"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-destructive"
          onClick={handleCancel}
          disabled={isSaving}
          title="Cancel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition"
      onClick={() => setIsEditing(true)}
      title="Click to edit stock quantity"
    >
      {value} {unit}
    </div>
  );
}

export default function InventoryPage() {
  const { restaurant } = useAuthStore();
  const restaurantId = restaurant?.id || '';

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [alertDismissed, setAlertDismissed] = useState(false);

  const loadItems = useCallback(() => {
    if (!restaurantId) return;
    setIsLoading(true);
    setLoadError(null);
    getInventoryItems(restaurantId).then(result => {
      setIsLoading(false);
      if (result.error) { setLoadError(result.error); toast.error(result.error); return; }
      if (result.data) {
        setInventoryItems(result.data.map((i: any) => ({
          id:           i.id,
          name:         i.name,
          category:     i.description || '',
          currentStock: i.currentQuantity,
          unit:         i.unit,
          minThreshold: i.reorderLevel,
          lastUpdated:  new Date(i.updatedAt),
          status:       getItemStatus(i.currentQuantity, i.reorderLevel),
        })));
      }
    });
  }, [restaurantId]);

  // Load items from server action on mount
  useEffect(() => { loadItems(); }, [loadItems]);

  const totalItems     = inventoryItems.length;
  const lowStockItems  = inventoryItems.filter(i => i.status === 'Low').length;
  const outOfStockItems = inventoryItems.filter(i => i.status === 'Out of Stock').length;
  const healthyItems   = inventoryItems.filter(i => i.status === 'Healthy').length;

  const filteredItems = inventoryItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="space-y-6 p-6">
      {!alertDismissed && (lowStockItems > 0 || outOfStockItems > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center justify-between gap-4 p-4 rounded-lg bg-accent-light border border-accent/20"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-accent" />
            <div>
              <p className="font-medium text-warning">
                {lowStockItems + outOfStockItems} item
                {lowStockItems + outOfStockItems !== 1 ? 's are' : ' is'} running low on stock
              </p>
              <p className="text-sm text-warning">
                Please reorder soon to avoid stockouts
              </p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setAlertDismissed(true)}
            className="text-accent hover:bg-accent-light"
          >
            <X className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Inventory Management</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage your restaurant inventory
            </p>
          </div>
          <AddInventoryDialog
            restaurantId={restaurantId}
            onAdded={item => setInventoryItems(prev => [item, ...prev])}
          />
        </div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-4 md:grid-cols-4"
      >
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Items
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Items in inventory
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-l-4 border-l-warning">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Low Stock
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                {lowStockItems}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Below minimum threshold
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-l-4 border-l-destructive">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Out of Stock
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {outOfStockItems}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Items not available
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-l-4 border-l-success">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Healthy Stock
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {healthyItems}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Above minimum threshold
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Inventory Items</CardTitle>
            <CardDescription>
              Manage all inventory items and stock levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items or categories..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Min Threshold</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((__, j) => (
                          <TableCell key={j}><Skeleton className="h-5 w-full max-w-[120px]" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : loadError ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
                        <p className="text-sm text-destructive mb-3">{loadError}</p>
                        <Button size="sm" variant="outline" onClick={loadItems}>Retry</Button>
                      </TableCell>
                    </TableRow>
                  ) : filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-bold">
                          {item.name}
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.category}
                        </TableCell>
                        <TableCell>
                          <EditableStockCell
                            itemId={item.id}
                            value={item.currentStock}
                            unit={item.unit}
                            onSaved={(newValue) => setInventoryItems(prev => prev.map(i =>
                              i.id === item.id
                                ? { ...i, currentStock: newValue, status: getItemStatus(newValue, i.minThreshold), lastUpdated: new Date() }
                                : i
                            ))}
                          />
                        </TableCell>
                        <TableCell className="text-sm">{item.unit}</TableCell>
                        <TableCell className="text-sm">
                          {item.minThreshold} {item.unit}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[item.status]}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatRelativeTime(item.lastUpdated)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StockHistoryDialog
                              item={item}
                              onStockChanged={(id, newStock) => setInventoryItems(prev => prev.map(i =>
                                i.id === id
                                  ? { ...i, currentStock: newStock, status: getItemStatus(newStock, i.minThreshold), lastUpdated: new Date() }
                                  : i
                              ))}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10">
                        <Search className="h-6 w-6 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-muted-foreground">
                          {searchQuery ? 'No items match your search' : 'No inventory items yet — click "Add Item" to get started'}
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
