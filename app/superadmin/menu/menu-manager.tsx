'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import {
  UtensilsCrossed, RefreshCw, Loader2, Plus, Pencil, Trash2, Copy,
  Search, FolderPlus, ClipboardPaste,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getRestaurantMenu, listRestaurantsWithMenuCounts,
  adminAddMenuItem, adminUpdateMenuItem, adminDeleteMenuItem,
  adminToggleMenuItemAvailable, adminAddCategory, adminDeleteCategory,
  copyMenuItems,
  type RestaurantMenuSummary, type AdminMenuItem, type AdminMenuCategory,
} from '@/lib/actions/admin-menu';

const ITEM_TYPES = ['FOOD', 'DRINK', 'DESSERT', 'COMBO'];
const FOOD_TYPES = ['VEG', 'NON_VEG', 'EGG', 'VEGAN'];
const SPICE_LEVELS = ['NONE', 'MILD', 'MEDIUM', 'HOT'];

const foodTypeColor: Record<string, string> = {
  VEG: 'bg-success/10 text-success border-success/30',
  VEGAN: 'bg-success/10 text-success border-success/30',
  NON_VEG: 'bg-destructive/10 text-destructive border-destructive/30',
  EGG: 'bg-warning/10 text-warning border-warning/30',
};

type MenuState = {
  restaurant: { id: string; name: string; currency: string };
  categories: AdminMenuCategory[];
  items: AdminMenuItem[];
};

type ItemForm = {
  name: string;
  categoryId: string;
  price: string;
  discountPrice: string;
  description: string;
  itemType: string;
  foodType: string;
  spiceLevel: string;
  isAvailable: boolean;
};

const emptyForm = (categoryId = ''): ItemForm => ({
  name: '', categoryId, price: '', discountPrice: '', description: '',
  itemType: 'FOOD', foodType: 'VEG', spiceLevel: 'NONE', isAvailable: true,
});

export default function MenuManager({
  initialRestaurants,
}: {
  initialRestaurants: RestaurantMenuSummary[];
}) {
  const [restaurants, setRestaurants] = useState(initialRestaurants);
  const [selectedId, setSelectedId] = useState<string>('');
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Item editor dialog
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ItemForm>(emptyForm());
  const [savingItem, setSavingItem] = useState(false);

  // Category dialog
  const [catOpen, setCatOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [savingCat, setSavingCat] = useState(false);

  // Copy dialog
  const [copyOpen, setCopyOpen] = useState(false);
  const [copyMode, setCopyMode] = useState<'selected' | 'all'>('selected');
  const [copyTargetId, setCopyTargetId] = useState('');
  const [copying, setCopying] = useState(false);

  const selectedSummary = restaurants.find((r) => r.id === selectedId);

  const reloadRestaurants = useCallback(async () => {
    try {
      const rows = await listRestaurantsWithMenuCounts();
      setRestaurants(rows);
    } catch {
      /* non-fatal — counts just won't refresh */
    }
  }, []);

  const loadMenu = useCallback(async (restaurantId: string) => {
    if (!restaurantId) return;
    setLoading(true);
    setSelectedItemIds(new Set());
    const result = await getRestaurantMenu(restaurantId);
    if ('error' in result && result.error) {
      toast.error(result.error);
      setMenu(null);
    } else if ('data' in result && result.data) {
      setMenu(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedId) loadMenu(selectedId);
    else setMenu(null);
  }, [selectedId, loadMenu]);

  const refreshAll = useCallback(async () => {
    await Promise.all([reloadRestaurants(), selectedId ? loadMenu(selectedId) : Promise.resolve()]);
  }, [reloadRestaurants, loadMenu, selectedId]);

  const currency = menu?.restaurant.currency ?? '';
  const money = (n: number) => `${currency} ${n.toLocaleString()}`;

  // Group items by category, honouring category order, then any orphans.
  const grouped = useMemo(() => {
    if (!menu) return [] as { category: AdminMenuCategory; items: AdminMenuItem[] }[];
    const q = search.trim().toLowerCase();
    const visible = q
      ? menu.items.filter((i) => i.name.toLowerCase().includes(q))
      : menu.items;
    const byCat = new Map<string, AdminMenuItem[]>();
    for (const item of visible) {
      const arr = byCat.get(item.categoryId) ?? [];
      arr.push(item);
      byCat.set(item.categoryId, arr);
    }
    const groups = menu.categories.map((category) => ({
      category,
      items: byCat.get(category.id) ?? [],
    }));
    // Items whose category row is missing (shouldn't happen, but be safe).
    const known = new Set(menu.categories.map((c) => c.id));
    const orphans = visible.filter((i) => !known.has(i.categoryId));
    if (orphans.length) {
      groups.push({
        category: { id: '__orphan__', name: 'Uncategorised', isActive: true },
        items: orphans,
      });
    }
    return groups;
  }, [menu, search]);

  const shownItemIds = useMemo(
    () => grouped.flatMap((g) => g.items.map((i) => i.id)),
    [grouped]
  );
  const allShownSelected = shownItemIds.length > 0 && shownItemIds.every((id) => selectedItemIds.has(id));

  const toggleItem = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllShown = () => {
    setSelectedItemIds((prev) => {
      if (allShownSelected) return new Set();
      return new Set(shownItemIds);
    });
  };

  // ── Item editor ──
  const openAddItem = () => {
    const firstCat = menu?.categories[0]?.id ?? '';
    setEditingId(null);
    setForm(emptyForm(firstCat));
    setEditorOpen(true);
  };

  const openEditItem = (item: AdminMenuItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      categoryId: item.categoryId,
      price: String(item.price),
      discountPrice: item.discountPrice != null ? String(item.discountPrice) : '',
      description: item.description ?? '',
      itemType: item.itemType || 'FOOD',
      foodType: item.foodType || 'VEG',
      spiceLevel: item.spiceLevel || 'NONE',
      isAvailable: item.isAvailable,
    });
    setEditorOpen(true);
  };

  const saveItem = async () => {
    if (!menu) return;
    if (!form.name.trim()) return toast.error('Item name is required');
    if (!form.categoryId) return toast.error('Pick a category');
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) return toast.error('Enter a valid price');
    const discountPrice = form.discountPrice.trim() === '' ? null : parseFloat(form.discountPrice);
    if (discountPrice != null && (isNaN(discountPrice) || discountPrice < 0)) {
      return toast.error('Enter a valid discount price');
    }

    setSavingItem(true);
    const payload = {
      name: form.name,
      categoryId: form.categoryId,
      price,
      discountPrice,
      description: form.description,
      itemType: form.itemType,
      foodType: form.foodType,
      spiceLevel: form.spiceLevel,
      isAvailable: form.isAvailable,
    };
    const result = editingId
      ? await adminUpdateMenuItem(editingId, payload)
      : await adminAddMenuItem({ restaurantId: menu.restaurant.id, ...payload });
    setSavingItem(false);

    if (result && 'error' in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(editingId ? 'Item updated' : 'Item added');
    setEditorOpen(false);
    await refreshAll();
  };

  const deleteItem = async (item: AdminMenuItem) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    const result = await adminDeleteMenuItem(item.id);
    if (result && 'error' in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Item deleted');
    await refreshAll();
  };

  const toggleAvailable = async (item: AdminMenuItem, next: boolean) => {
    // Optimistic flip.
    setMenu((m) =>
      m ? { ...m, items: m.items.map((i) => (i.id === item.id ? { ...i, isAvailable: next } : i)) } : m
    );
    const result = await adminToggleMenuItemAvailable(item.id, next);
    if (result && 'error' in result && result.error) {
      toast.error(result.error);
      loadMenu(menu!.restaurant.id);
    }
  };

  // ── Category ──
  const saveCategory = async () => {
    if (!menu) return;
    if (!catName.trim()) return toast.error('Category name is required');
    setSavingCat(true);
    const result = await adminAddCategory(menu.restaurant.id, catName.trim());
    setSavingCat(false);
    if (result && 'error' in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Category added');
    setCatName('');
    setCatOpen(false);
    await refreshAll();
  };

  const deleteCategory = async (category: AdminMenuCategory) => {
    if (category.id === '__orphan__') return;
    if (!confirm(`Delete category "${category.name}"?`)) return;
    const result = await adminDeleteCategory(category.id);
    if (result && 'error' in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Category deleted');
    await refreshAll();
  };

  // ── Copy / paste ──
  const openCopy = (mode: 'selected' | 'all') => {
    setCopyMode(mode);
    setCopyTargetId('');
    setCopyOpen(true);
  };

  const copyCount = copyMode === 'all' ? (menu?.items.length ?? 0) : selectedItemIds.size;

  const runCopy = async () => {
    if (!menu) return;
    if (!copyTargetId) return toast.error('Pick a restaurant to paste into');
    setCopying(true);
    const result = await copyMenuItems({
      sourceRestaurantId: menu.restaurant.id,
      targetRestaurantId: copyTargetId,
      itemIds: copyMode === 'selected' ? Array.from(selectedItemIds) : undefined,
    });
    setCopying(false);
    if (result && 'error' in result && result.error) {
      toast.error(result.error);
      return;
    }
    if (result && 'data' in result && result.data) {
      toast.success(`Copied ${result.data.copied} item(s) into ${result.data.targetName}`);
    }
    setCopyOpen(false);
    setSelectedItemIds(new Set());
    await reloadRestaurants();
  };

  const copyTargets = restaurants.filter((r) => r.id !== selectedId);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Menu Management"
        description="Manage every restaurant's menu from one place. Owners' own edits sync here live — this reads the same records they do."
      >
        <Button variant="outline" size="sm" onClick={refreshAll} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </PageHeader>

      {/* Restaurant picker + summary */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5 w-full sm:max-w-sm">
            <Label className="text-xs text-muted-foreground">Restaurant</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a restaurant to manage its menu" />
              </SelectTrigger>
              <SelectContent>
                {restaurants.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                    {r.city ? ` · ${r.city}` : ''} — {r.itemCount} items
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedSummary && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={selectedSummary.isActive ? 'default' : 'destructive'}>
                {selectedSummary.isActive ? 'Active' : 'Closed'}
              </Badge>
              <Badge className="bg-muted text-muted-foreground border border-border">
                {selectedSummary.itemCount} items
              </Badge>
              <Badge className="bg-muted text-muted-foreground border border-border">
                {selectedSummary.categoryCount} categories
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {!selectedId ? (
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-0">
            <EmptyState
              icon={UtensilsCrossed}
              title="Pick a restaurant"
              description="Choose a restaurant above to view and manage its live menu."
            />
          </CardContent>
        </Card>
      ) : loading && !menu ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : menu ? (
        <>
          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search items in this menu"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCatOpen(true)}>
                <FolderPlus className="h-4 w-4 mr-1" /> Add category
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openCopy('all')}
                disabled={menu.items.length === 0}
              >
                <Copy className="h-4 w-4 mr-1" /> Copy whole menu
              </Button>
              <Button size="sm" onClick={openAddItem} disabled={menu.categories.length === 0}>
                <Plus className="h-4 w-4 mr-1" /> Add item
              </Button>
            </div>
          </div>

          {menu.categories.length === 0 && (
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-0">
                <EmptyState
                  icon={FolderPlus}
                  title="No categories yet"
                  description="Add a category first — every menu item belongs to one."
                  action={<Button size="sm" onClick={() => setCatOpen(true)}><FolderPlus className="h-4 w-4 mr-1" /> Add category</Button>}
                />
              </CardContent>
            </Card>
          )}

          {/* Selection bar */}
          {shownItemIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <Checkbox checked={allShownSelected} onCheckedChange={toggleSelectAllShown} />
                Select all shown
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{selectedItemIds.size} selected</span>
                <Button
                  size="sm"
                  onClick={() => openCopy('selected')}
                  disabled={selectedItemIds.size === 0}
                >
                  <ClipboardPaste className="h-4 w-4 mr-1" /> Copy selected to…
                </Button>
                {selectedItemIds.size > 0 && (
                  <Button size="sm" variant="ghost" onClick={() => setSelectedItemIds(new Set())}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Menu grouped by category */}
          <div className="space-y-4">
            {grouped.map(({ category, items }) => (
              <Card key={category.id} className="bg-card border-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {category.name}
                    <Badge className="bg-muted text-muted-foreground border border-border font-normal">
                      {items.length}
                    </Badge>
                    {!category.isActive && (
                      <Badge className="bg-warning/10 text-warning border border-warning/30 font-normal">
                        hidden
                      </Badge>
                    )}
                  </CardTitle>
                  {category.id !== '__orphan__' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteCategory(category)}
                      title="Delete category"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No items in this category.</p>
                  ) : (
                    <div className="divide-y divide-border">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 py-2.5">
                          <Checkbox
                            checked={selectedItemIds.has(item.id)}
                            onCheckedChange={() => toggleItem(item.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-medium truncate ${!item.isAvailable ? 'text-muted-foreground line-through' : ''}`}>
                                {item.name}
                              </span>
                              <Badge className={`border font-normal text-[10px] ${foodTypeColor[item.foodType] || 'bg-muted text-muted-foreground border-border'}`}>
                                {item.foodType.replace('_', '-')}
                              </Badge>
                            </div>
                            {item.description && (
                              <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                            )}
                          </div>
                          <div className="text-right whitespace-nowrap">
                            {item.discountPrice != null ? (
                              <div className="text-sm">
                                <span className="font-medium">{money(item.discountPrice)}</span>{' '}
                                <span className="text-xs text-muted-foreground line-through">{money(item.price)}</span>
                              </div>
                            ) : (
                              <span className="text-sm font-medium">{money(item.price)}</span>
                            )}
                          </div>
                          <Switch
                            checked={item.isAvailable}
                            onCheckedChange={(v) => toggleAvailable(item, v)}
                            title={item.isAvailable ? 'Available' : 'Unavailable'}
                          />
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditItem(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteItem(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : null}

      {/* Item editor dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit item' : 'Add item'}</DialogTitle>
            <DialogDescription>
              {menu ? `${menu.restaurant.name}'s menu` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Chicken Momo" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {menu?.categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Price</Label>
                <Input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Discount price <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input type="number" min="0" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.itemType} onValueChange={(v) => setForm({ ...form, itemType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ITEM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Food</Label>
                <Select value={form.foodType} onValueChange={(v) => setForm({ ...form, foodType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FOOD_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace('_', '-')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Spice</Label>
                <Select value={form.spiceLevel} onValueChange={(v) => setForm({ ...form, spiceLevel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SPICE_LEVELS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Switch checked={form.isAvailable} onCheckedChange={(v) => setForm({ ...form, isAvailable: v })} />
              Available for ordering
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)} disabled={savingItem}>Cancel</Button>
            <Button onClick={saveItem} disabled={savingItem}>
              {savingItem && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editingId ? 'Save changes' : 'Add item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add category dialog */}
      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add category</DialogTitle>
            <DialogDescription>{menu ? `To ${menu.restaurant.name}'s menu` : ''}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Category name</Label>
            <Input
              autoFocus
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g. Starters"
              onKeyDown={(e) => { if (e.key === 'Enter') saveCategory(); }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatOpen(false)} disabled={savingCat}>Cancel</Button>
            <Button onClick={saveCategory} disabled={savingCat}>
              {savingCat && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Copy dialog */}
      <Dialog open={copyOpen} onOpenChange={setCopyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Copy menu items</DialogTitle>
            <DialogDescription>
              Copying {copyCount} item(s) from <span className="font-medium text-foreground">{menu?.restaurant.name}</span>.
              Matching categories are created in the target automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Paste into</Label>
              <Select value={copyTargetId} onValueChange={setCopyTargetId}>
                <SelectTrigger><SelectValue placeholder="Select target restaurant" /></SelectTrigger>
                <SelectContent>
                  {copyTargets.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}{r.city ? ` · ${r.city}` : ''} — {r.itemCount} items
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Items are added as new copies — nothing in the target is overwritten or removed.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyOpen(false)} disabled={copying}>Cancel</Button>
            <Button onClick={runCopy} disabled={copying || copyCount === 0}>
              {copying && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              <ClipboardPaste className="h-4 w-4 mr-1" /> Paste {copyCount} item(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
