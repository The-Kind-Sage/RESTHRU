'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit2, Trash2, Loader2, Check, X, GripVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { getPlans, createPlan, updatePlan, deletePlan } from '@/lib/actions/plans';
import { PLAN_TYPES } from '@/lib/constants';

interface Plan {
  id: string;
  type: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  maxRestaurants: number;
  maxTables: number;
  maxStaff: number;
  maxMenuItems: number;
  features: string[];
  displayOrder: number;
  isPopular: boolean;
  colorHex: string;
  isActive: boolean;
}

const emptyForm = {
  type: '', name: '', description: '', monthlyPrice: 0, annualPrice: 0,
  currency: 'NPR', maxRestaurants: 1, maxTables: 10, maxStaff: 5, maxMenuItems: 50,
  features: [] as string[], displayOrder: 0, isPopular: false, colorHex: '#6b7280', isActive: true,
};

export default function PackagesPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [featureInput, setFeatureInput] = useState('');

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    const res = await getPlans();
    if (res.data) setPlans(res.data);
    else toast.error(res.error || 'Failed to load plans');
    setLoading(false);
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, displayOrder: plans.length });
    setDialogOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditingId(plan.id);
    setForm({
      type: plan.type, name: plan.name, description: plan.description,
      monthlyPrice: plan.monthlyPrice, annualPrice: plan.annualPrice,
      currency: plan.currency, maxRestaurants: plan.maxRestaurants,
      maxTables: plan.maxTables, maxStaff: plan.maxStaff, maxMenuItems: plan.maxMenuItems,
      features: [...plan.features], displayOrder: plan.displayOrder,
      isPopular: plan.isPopular, colorHex: plan.colorHex, isActive: plan.isActive,
    });
    setDialogOpen(true);
  };

  const addFeature = () => {
    const trimmed = featureInput.trim();
    if (!trimmed) return;
    if (form.features.includes(trimmed)) { toast.error('Feature already added'); return; }
    setForm({ ...form, features: [...form.features, trimmed] });
    setFeatureInput('');
  };

  const removeFeature = (idx: number) => {
    setForm({ ...form, features: form.features.filter((_, i) => i !== idx) });
  };

  const handleSave = async () => {
    if (!form.name || !form.type) { toast.error('Name and type are required'); return; }
    setSaving(true);
    const res = editingId
      ? await updatePlan(editingId, form)
      : await createPlan(form);
    setSaving(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success(editingId ? 'Plan updated' : 'Plan created');
    setDialogOpen(false);
    fetchPlans();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const res = await deletePlan(deleteId);
    setDeleting(false);
    if (res.error) { toast.error(res.error); setDeleteId(null); return; }
    toast.success('Plan deleted');
    setDeleteId(null);
    fetchPlans();
  };

  const planTypeColor = (type: string) => {
    const t = PLAN_TYPES.find((p) => p.value === type.toLowerCase());
    return t?.color || '#6b7280';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Packages</h1>
          <p className="text-muted-foreground">Create and edit subscription plans shown on the Pricing page</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Add Package
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No packages yet. Click "Add Package" to create one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Monthly</TableHead>
                  <TableHead>Annual</TableHead>
                  <TableHead>Tables</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Menu</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Popular</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="text-sm text-muted-foreground">{plan.displayOrder}</TableCell>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>
                      <Badge style={{ backgroundColor: planTypeColor(plan.type) + '20', color: planTypeColor(plan.type), borderColor: planTypeColor(plan.type) + '40' }} variant="outline">
                        {plan.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{plan.monthlyPrice === 0 ? 'Free' : `NPR ${plan.monthlyPrice.toLocaleString()}`}</TableCell>
                    <TableCell>{plan.annualPrice === 0 ? 'Free' : `NPR ${plan.annualPrice.toLocaleString()}`}</TableCell>
                    <TableCell>{plan.maxTables}</TableCell>
                    <TableCell>{plan.maxStaff}</TableCell>
                    <TableCell>{plan.maxMenuItems}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{plan.features.length}</Badge>
                    </TableCell>
                    <TableCell>{plan.isPopular ? <Check className="w-4 h-4 text-success" /> : <X className="w-4 h-4 text-muted-foreground" />}</TableCell>
                    <TableCell>{plan.isActive ? <Check className="w-4 h-4 text-success" /> : <X className="w-4 h-4 text-destructive" />}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(plan)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId(plan.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Package' : 'Add Package'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan Type *</Label>
                <select
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="">Select type</option>
                  {PLAN_TYPES.map((t) => (
                    <option key={t.value} value={t.value.toUpperCase()}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Plan Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Free, Basic" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of this plan" rows={2} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Monthly Price (NPR)</Label>
                <Input type="number" value={form.monthlyPrice} onChange={(e) => setForm({ ...form, monthlyPrice: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Annual Price (NPR)</Label>
                <Input type="number" value={form.annualPrice} onChange={(e) => setForm({ ...form, annualPrice: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Max Tables</Label>
                <Input type="number" value={form.maxTables} onChange={(e) => setForm({ ...form, maxTables: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Max Staff</Label>
                <Input type="number" value={form.maxStaff} onChange={(e) => setForm({ ...form, maxStaff: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Max Menu Items</Label>
                <Input type="number" value={form.maxMenuItems} onChange={(e) => setForm({ ...form, maxMenuItems: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Max Restaurants</Label>
                <Input type="number" value={form.maxRestaurants} onChange={(e) => setForm({ ...form, maxRestaurants: Number(e.target.value) })} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.colorHex} onChange={(e) => setForm({ ...form, colorHex: e.target.value })} className="h-10 w-14 rounded border cursor-pointer" />
                  <Input value={form.colorHex} onChange={(e) => setForm({ ...form, colorHex: e.target.value })} className="flex-1" />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Switch id="isPopular" checked={form.isPopular} onCheckedChange={(v) => setForm({ ...form, isPopular: v })} />
                  <Label htmlFor="isPopular">Popular</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="isActive" checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Features</Label>
              <div className="flex gap-2">
                <Input
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  placeholder="Add a feature..."
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                />
                <Button variant="outline" onClick={addFeature} type="button">Add</Button>
              </div>
              {form.features.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.features.map((f, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-1 pr-1">
                      {f}
                      <button onClick={() => removeFeature(idx)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Package?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this plan. It cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
