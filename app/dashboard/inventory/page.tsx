'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, X, Plus, Edit2, Clock, Search,
  TrendingUp, TrendingDown, AlertCircle,
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
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const stockHistoryData: { day: string; stock: number }[] = [];

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

function StockHistoryDialog({ item }: { item: InventoryItem }) {
  const [showAddStock, setShowAddStock] = useState(false);
  const [showRecordUsage, setShowRecordUsage] = useState(false);

  return (
    <Dialog>
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
            View stock movements and trends over the last 7 days
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-primary hover:bg-primary-hover"
              onClick={() => setShowAddStock(!showAddStock)}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Add Stock
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowRecordUsage(!showRecordUsage)}
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
                <Input type="number" placeholder="0" min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Notes
                </label>
                <Input placeholder="Add notes..." />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-primary">
                  Add Stock
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
                <Input type="number" placeholder="0" min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Notes
                </label>
                <Input placeholder="Add notes..." />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-accent hover:bg-accent">
                  Record Usage
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
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between text-sm p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <div>
                    <p className="font-medium">Added 5 kg</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  <div>
                    <p className="font-medium">Used 2 kg</p>
                    <p className="text-xs text-muted-foreground">5 hours ago</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <div>
                    <p className="font-medium">Added 10 kg</p>
                    <p className="text-xs text-muted-foreground">Yesterday</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="font-medium text-sm">Stock Level Trend</p>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stockHistoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="stock"
                  stroke="#3b82f6"
                  dot={{ fill: '#3b82f6' }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
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
    if (!supabase || !restaurantId) { toast.error('Not authenticated'); return; }
    if (!formData.itemName || !formData.currentStock || !formData.minThreshold) {
      toast.error('Please fill all required fields'); return;
    }
    setIsSaving(true);
    const stock   = parseFloat(formData.currentStock);
    const minThr  = parseFloat(formData.minThreshold);
    const { data, error } = await supabase.from('inventory_items').insert([{
      restaurant_id: restaurantId,
      name:          formData.itemName,
      category:      formData.category || null,
      current_stock: stock,
      unit:          formData.unit,
      min_threshold: minThr,
    }]).select('*').single();

    setIsSaving(false);
    if (error) { toast.error(error.message || 'Failed to add item'); return; }

    onAdded({
      id:           data.id,
      name:         data.name,
      category:     data.category || '',
      currentStock: data.current_stock,
      unit:         data.unit,
      minThreshold: data.min_threshold,
      lastUpdated:  new Date(data.last_updated || Date.now()),
      status:       getItemStatus(data.current_stock, data.min_threshold),
    });
    toast.success(`${data.name} added to inventory`);
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
  value,
  unit,
}: {
  value: number;
  unit: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());

  const handleSave = () => {
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-20"
          min="0"
          autoFocus
        />
        <span className="text-sm">{unit}</span>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={handleSave}
        >
          ✓
        </Button>
      </div>
    );
  }

  return (
    <div
      className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition"
      onClick={() => setIsEditing(true)}
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
  const [searchQuery, setSearchQuery] = useState('');
  const [alertDismissed, setAlertDismissed] = useState(false);

  // Load items from Supabase on mount
  useEffect(() => {
    if (!supabase || !restaurantId) return;
    setIsLoading(true);
    supabase
      .from('inventory_items')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        setIsLoading(false);
        if (error) { toast.error('Failed to load inventory'); return; }
        if (data) {
          setInventoryItems(data.map((i: any) => ({
            id:           i.id,
            name:         i.name,
            category:     i.category || '',
            currentStock: i.current_stock,
            unit:         i.unit,
            minThreshold: i.min_threshold,
            lastUpdated:  new Date(i.last_updated || i.created_at),
            status:       getItemStatus(i.current_stock, i.min_threshold),
          })));
        }
      });
  }, [restaurantId]);

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Inventory Management</h1>
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
          <Card className="border-l-4 border-l-amber-500">
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
          <Card className="border-l-4 border-l-rose-500">
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
          <Card className="border-l-4 border-l-emerald-500">
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
                  {filteredItems.length > 0 ? (
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
                            value={item.currentStock}
                            unit={item.unit}
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
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <StockHistoryDialog item={item} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6">
                        <p className="text-muted-foreground">
                          No inventory items found
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
