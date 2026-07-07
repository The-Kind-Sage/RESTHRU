'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, LayoutGrid, List, Eye, Edit2, Trash2,
  Upload, X, QrCode, Palette, Download, FileImage,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { FOOD_TYPES, FOOD_SUB_TYPES, SPICE_LEVELS, ALLERGENS } from '@/lib/constants';
import { uploadImage } from '@/lib/upload';
import { supabase } from '@/lib/supabase';
import { addCategory, updateCategory, deleteCategory as deleteCategoryAction, toggleCategoryActive as toggleCategoryActiveAction } from '@/lib/actions/menu';
import { useAuthStore } from '@/store/auth-store';

// ── Types ────────────────────────────────────────────────────────────────────
interface MenuItem {
  id: string;
  nameEn: string;
  nameNp?: string;
  category: string;       // category id
  description: string;
  price: number;
  discountPrice?: number;
  foodType: 'veg' | 'non_veg' | 'vegan' | 'fish';
  subType: 'veg' | 'chicken' | 'buff' | 'pork' | 'mutton';
  spiceLevel: 'none' | 'mild' | 'medium' | 'hot' | 'extra_hot';
  prepTime: number;
  available: boolean;
  isPopular: boolean;
  isNew: boolean;
  allergens: string[];
  variants: { name: string; price: number }[];
  emoji: string;
  image?: string;
  outOfStock?: boolean;
}

interface Category {
  id: string;
  name: string;
  nameNp?: string;
  emoji: string;
  itemCount: number;
  active: boolean;
  sortOrder: number;
}

interface MenuSettings {
  bgUrl: string | null;
  customMenuUrl: string | null;
}

const EMPTY_FORM: Partial<MenuItem> = {
  nameEn: '', nameNp: '', description: '',
  price: 0, discountPrice: undefined,
  foodType: 'veg', subType: 'veg',
  spiceLevel: 'none', prepTime: 15,
  available: true, isPopular: false, isNew: false,
  allergens: [], variants: [], emoji: '🍽️',
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function MenuPage() {
  const { restaurant } = useAuthStore();
  const restaurantId = restaurant?.id;
  const qrRef = useRef<HTMLDivElement>(null);

  // ── State ─────────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [menuSettings, setMenuSettings] = useState<MenuSettings>({ bgUrl: null, customMenuUrl: null });
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);
  const [customMenuFile, setCustomMenuFile] = useState<File | null>(null);
  const [customMenuName, setCustomMenuName] = useState<string | null>(null);
  const [isSavingMenu, setIsSavingMenu] = useState(false);

  const [formData, setFormData] = useState<Partial<MenuItem>>(EMPTY_FORM);
  const [categoryFormData, setCategoryFormData] = useState<Partial<Category>>({
    name: '', nameNp: '', emoji: '📂', sortOrder: 0, active: true,
  });

  // ── Load categories & items from Supabase ──────────────────────────────────
  const loadData = useCallback(async () => {
    if (!supabase || !restaurantId) return;
    setIsLoadingItems(true);
    try {
      const [catRes, itemRes, restRes] = await Promise.all([
          supabase.from('categories').select('*').eq('restaurant_id', restaurantId).order('display_order'),
        supabase.from('menu_items').select('*').eq('restaurant_id', restaurantId).order('created_at'),
        supabase.from('restaurants').select('menu_bg_url,menu_custom_url').eq('id', restaurantId).single(),
      ]);

      if (catRes.data) {
        const cats: Category[] = catRes.data.map((c: any) => ({
          id: c.id, name: c.name, nameNp: c.name_np,
          emoji: c.icon || '📂', itemCount: 0,
          active: c.is_active, sortOrder: c.display_order ?? c.sort_order ?? 0,
        }));
        setCategories(cats);
        if (!selectedCategory && cats.length > 0) setSelectedCategory(cats[0].id);
      }

      if (itemRes.data) {
        const mapped: MenuItem[] = itemRes.data.map((i: any) => ({
          id: i.id, nameEn: i.name, nameNp: undefined,
          category: i.category_id, description: i.description || '',
          price: i.price, discountPrice: i.discount_price,
          foodType: i.food_type || 'veg', subType: i.sub_type || 'veg',
          spiceLevel: i.spice_level || 'none', prepTime: i.prep_time || 15,
          available: i.is_available, isPopular: false,
          isNew: false, allergens: i.allergens || [],
          variants: [], emoji: '🍽️', image: i.image_url,
        }));
        setItems(mapped);
      }

      if (restRes.data) {
        setMenuSettings({
          bgUrl: restRes.data.menu_bg_url || null,
          customMenuUrl: restRes.data.menu_custom_url || null,
        });
        setBgPreview(restRes.data.menu_bg_url || null);
      }
    } finally {
      setIsLoadingItems(false);
    }
  }, [restaurantId, selectedCategory]);

  useEffect(() => { loadData(); }, [restaurantId]);

  // ── Filtered items ─────────────────────────────────────────────────────────
  const filteredItems = useMemo(() => items
    .filter(i => i.category === selectedCategory)
    .filter(i =>
      i.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.description.toLowerCase().includes(searchQuery.toLowerCase())
    ), [items, selectedCategory, searchQuery]);

  const getFoodTypeColor = (ft: string) => FOOD_TYPES.find(t => t.value === ft)?.color || '#000';
  const getSubTypeInfo  = (st: string) => FOOD_SUB_TYPES.find(t => t.value === st);

  // ── Item handlers ──────────────────────────────────────────────────────────
  const handleAddItem = () => {
    setEditingItem(null); setImageFile(null); setImagePreview(null);
    setFormData({ ...EMPTY_FORM, category: selectedCategory });
    setIsAddItemOpen(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item); setFormData(item);
    setImageFile(null); setImagePreview(item.image || null);
    setIsAddItemOpen(true);
  };

  const handleSaveItem = async () => {
    if (!formData.nameEn || !restaurantId || !supabase) return;
    setIsSavingItem(true);
    try {
      let image_url = formData.image;
      if (imageFile) {
        const url = await uploadImage(imageFile, 'menu-items');
        if (url) image_url = url;
      }

      const payload: Record<string, any> = {
        restaurant_id: restaurantId,
        category_id:   formData.category || selectedCategory,
        name:          formData.nameEn,
        description:   formData.description || null,
        price:         formData.price || 0,
        discount_price: formData.discountPrice || null,
        food_type:     formData.foodType || 'veg',
        sub_type:      formData.subType  || 'veg',
        spice_level:   formData.spiceLevel || 'none',
        prep_time:     formData.prepTime || 15,
        is_available:  formData.available ?? true,
        allergens:     formData.allergens || [],
        image_url,
      };

      if (editingItem) {
        const { error } = await supabase.from('menu_items').update(payload).eq('id', editingItem.id);
        if (error) { toast.error(error.message); return; }
        setItems(items.map(i => i.id === editingItem.id
          ? { ...editingItem, ...formData, image: image_url || undefined } : i));
        toast.success('Item updated');
      } else {
        const { data, error } = await supabase.from('menu_items').insert([payload]).select('id').single();
        if (error) { toast.error(error.message); return; }
        const newItem: MenuItem = {
          id: data.id, nameEn: formData.nameEn!, nameNp: formData.nameNp,
          category: formData.category || selectedCategory,
          description: formData.description || '', price: formData.price || 0,
          discountPrice: formData.discountPrice, foodType: formData.foodType || 'veg',
          subType: formData.subType || 'veg', spiceLevel: formData.spiceLevel || 'none',
          prepTime: formData.prepTime || 15, available: formData.available ?? true,
          isPopular: formData.isPopular ?? false, isNew: formData.isNew ?? false,
          allergens: formData.allergens || [], variants: [],
          emoji: '🍽️', image: image_url || undefined,
        };
        setItems([...items, newItem]);
        setCategories(categories.map(c =>
          c.id === selectedCategory ? { ...c, itemCount: c.itemCount + 1 } : c));
        toast.success('Item added');
      }
      setIsAddItemOpen(false);
    } finally { setIsSavingItem(false); }
  };

  const handleDeleteItem = async (id: string) => {
    if (supabase) await supabase.from('menu_items').delete().eq('id', id);
    setItems(items.filter(i => i.id !== id));
    setCategories(categories.map(c =>
      c.id === selectedCategory ? { ...c, itemCount: Math.max(0, c.itemCount - 1) } : c));
  };

  const handleToggleAvailable = async (id: string, val: boolean) => {
    if (supabase) await supabase.from('menu_items').update({ is_available: val }).eq('id', id);
    setItems(items.map(i => i.id === id ? { ...i, available: val } : i));
  };

  // ── Category handlers ──────────────────────────────────────────────────────
  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({ name: '', nameNp: '', emoji: '📂', sortOrder: categories.length, active: true });
    setIsAddCategoryOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryFormData.name) { toast.error('Category name is required'); return; }
    if (!restaurantId) { toast.error('Restaurant not loaded — try refreshing'); return; }
    setIsSavingCategory(true);
    try {
      if (editingCategory) {
        const result = await updateCategory(editingCategory.id, {
          name: categoryFormData.name,
          nameNp: categoryFormData.nameNp,
          emoji: categoryFormData.emoji,
          sortOrder: categoryFormData.sortOrder,
          active: categoryFormData.active,
        });
        if (result.error) { toast.error(result.error); return; }
        setCategories(categories.map(c => c.id === editingCategory.id
          ? { ...editingCategory, ...categoryFormData } as Category : c));
        toast.success('Category updated');
      } else {
        const result = await addCategory({
          name: categoryFormData.name,
          nameNp: categoryFormData.nameNp,
          emoji: categoryFormData.emoji,
          sortOrder: categoryFormData.sortOrder,
          active: categoryFormData.active,
          restaurantId,
        });
        if (result.error) { toast.error(result.error); return; }
        if (result.data) {
          setCategories([...categories, {
            id: result.data.id, name: categoryFormData.name!, nameNp: categoryFormData.nameNp,
            emoji: categoryFormData.emoji || '📂', itemCount: 0,
            active: categoryFormData.active ?? true, sortOrder: categoryFormData.sortOrder || 0,
          }]);
          toast.success('Category added');
        }
      }
      setIsAddCategoryOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save category');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const result = await deleteCategoryAction(id);
    if (result.error) { toast.error(result.error); return; }
    setCategories(categories.filter(c => c.id !== id));
    setItems(items.filter(i => i.category !== id));
    if (selectedCategory === id) setSelectedCategory(categories[0]?.id || '');
  };

  const toggleCategoryActive = async (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    const result = await toggleCategoryActiveAction(id, !cat.active);
    if (result.error) { toast.error(result.error); return; }
    setCategories(categories.map(c => c.id === id ? { ...c, active: !c.active } : c));
  };

  // ── Edit Menu (appearance) save ───────────────────────────────────────────
  const handleSaveMenuAppearance = async () => {
    if (!supabase || !restaurantId) return;
    setIsSavingMenu(true);
    try {
      const updates: Record<string, string | null> = {};
      if (bgFile) {
        const url = await uploadImage(bgFile, 'menu-bg');
        if (url) { updates.menu_bg_url = url; setMenuSettings(s => ({ ...s, bgUrl: url })); }
      }
      if (customMenuFile) {
        const url = await uploadImage(customMenuFile, 'menu-custom');
        if (url) { updates.menu_custom_url = url; setMenuSettings(s => ({ ...s, customMenuUrl: url })); }
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from('restaurants').update(updates).eq('id', restaurantId);
        toast.success('Menu appearance saved');
      }
      setIsEditMenuOpen(false);
    } finally { setIsSavingMenu(false); }
  };

  // ── QR download ──────────────────────────────────────────────────────────
  const handleDownloadQr = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'menu-qr.svg'; a.click();
    URL.revokeObjectURL(url);
  };

  const qrUrl = typeof window !== 'undefined' && restaurantId
    ? `${window.location.origin}/r/${restaurantId}`
    : '';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-background">
      {/* ── Left Panel: Categories ── */}
      <div className="w-[280px] border-r bg-card flex flex-col flex-shrink-0">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">Categories</h2>
          <Button size="sm" onClick={handleAddCategory}><Plus className="w-4 h-4 mr-1" />Add</Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1">
            <AnimatePresence>
              {categories.map(cat => (
                <motion.div key={cat.id}
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                  className={`group px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                    selectedCategory === cat.id ? 'bg-primary text-white' : 'hover:bg-muted'}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-lg flex-shrink-0">{cat.emoji}</span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{cat.name}</p>
                        <p className={`text-xs ${selectedCategory === cat.id ? 'text-white/70' : 'text-muted-foreground'}`}>
                          {items.filter(i => i.category === cat.id).length} items
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                      <Button size="sm" variant={selectedCategory === cat.id ? 'secondary' : 'ghost'}
                        className="h-6 w-6 p-0"
                        onClick={e => { e.stopPropagation(); setEditingCategory(cat); setCategoryFormData(cat); setIsAddCategoryOpen(true); }}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive"
                        onClick={e => { e.stopPropagation(); handleDeleteCategory(cat.id); }}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No categories yet.<br/>Click Add to create one.</p>
            )}
          </div>
        </ScrollArea>

        {/* Edit Menu + QR buttons at bottom of sidebar */}
        <div className="p-3 border-t space-y-2">
          <Button variant="outline" className="w-full gap-2" onClick={() => setIsEditMenuOpen(true)}>
            <Palette className="w-4 h-4" /> Edit Menu
          </Button>
          <Button className="w-full gap-2 bg-primary hover:bg-primary-hover" onClick={() => setIsQrOpen(true)}>
            <QrCode className="w-4 h-4" /> Generate QR
          </Button>
        </div>
      </div>

      {/* ── Right Panel: Items ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-5 border-b bg-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Menu Items</h2>
              <p className="text-sm text-muted-foreground">{categories.find(c => c.id === selectedCategory)?.name || 'Select a category'}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddItem} disabled={!selectedCategory}>
                <Plus className="w-4 h-4 mr-2" />Add Item
              </Button>
              <Button variant="outline" onClick={() => window.open(`/r/${restaurantId}`, '_blank')}>
                <Eye className="w-4 h-4 mr-2" />Preview
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search items..." className="pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted">
              <Button size="sm" variant={viewMode === 'grid' ? 'default' : 'ghost'} onClick={() => setViewMode('grid')} className="h-8 w-9"><LayoutGrid className="w-4 h-4" /></Button>
              <Button size="sm" variant={viewMode === 'list' ? 'default' : 'ghost'} onClick={() => setViewMode('list')} className="h-8 w-9"><List className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-5">
            {isLoadingItems ? (
              <div className="text-center py-20 text-muted-foreground">Loading menu items...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <p className="font-medium mb-1">No items yet</p>
                <p className="text-sm">Click "Add Item" to add your first menu item.</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence>
                  {filteredItems.map(item => {
                    const sub = getSubTypeInfo(item.subType);
                    return (
                      <motion.div key={item.id}
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                        <Card className="overflow-hidden group relative h-full">
                          <div className="relative h-36 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden">
                            {item.image
                              ? <img src={item.image} alt={item.nameEn} className="w-full h-full object-cover" />
                              : <span className="text-5xl">🍽️</span>}
                            <div className="absolute top-2 left-2">
                              {sub && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: sub.color }}>
                                  {sub.emoji} {sub.label}
                                </span>
                              )}
                            </div>
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="sm" variant="secondary" className="h-7 w-7 p-0" onClick={() => handleEditItem(item)}><Edit2 className="w-3 h-3" /></Button>
                              <Button size="sm" variant="destructive" className="h-7 w-7 p-0" onClick={() => handleDeleteItem(item.id)}><Trash2 className="w-3 h-3" /></Button>
                            </div>
                          </div>
                          <CardContent className="p-3 space-y-1">
                            <p className="font-bold text-sm truncate">{item.nameEn}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                            <div className="flex items-center gap-1.5">
                              {item.discountPrice
                                ? <><span className="font-bold text-primary text-sm">NPR {item.discountPrice}</span><span className="text-xs line-through text-muted-foreground">NPR {item.price}</span></>
                                : <span className="font-bold text-primary text-sm">NPR {item.price}</span>}
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t">
                              <span className="text-xs text-muted-foreground">{item.available ? 'Available' : 'Unavailable'}</span>
                              <Switch checked={item.available} onCheckedChange={v => handleToggleAvailable(item.id, v)} />
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredItems.map(item => {
                  const sub = getSubTypeInfo(item.subType);
                  return (
                    <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/40 group">
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {item.image ? <img src={item.image} alt={item.nameEn} className="w-full h-full object-cover rounded-lg" /> : <span className="text-2xl">🍽️</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.nameEn}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      </div>
                      {sub && <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white flex-shrink-0" style={{ backgroundColor: sub.color }}>{sub.emoji} {sub.label}</span>}
                      <p className="font-bold text-primary text-sm flex-shrink-0">NPR {item.price}</p>
                      <Switch checked={item.available} onCheckedChange={v => handleToggleAvailable(item.id, v)} />
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleEditItem(item)}><Edit2 className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDeleteItem(item.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* ═══════════════════════════════════════════════
          Add / Edit Item Dialog
      ═══════════════════════════════════════════════ */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
            <DialogDescription>{editingItem ? 'Update item details' : 'Add a new item to your menu'}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 py-4">
            {/* Left */}
            <div className="space-y-4">
              {/* Image */}
              <div>
                <label className="text-sm font-medium mb-2 block">Food Image</label>
                <label className="block border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/40 transition-colors">
                  {imagePreview
                    ? <div className="flex flex-col items-center gap-1"><img src={imagePreview} alt="preview" className="h-28 w-full object-cover rounded-md" /><p className="text-xs text-muted-foreground">Click to change</p></div>
                    : <><Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" /><p className="text-sm text-muted-foreground">Drop image here or click</p></>}
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); } }} />
                </label>
              </div>

              <div><label className="text-sm font-medium mb-1.5 block">Item Name (English) *</label>
                <Input placeholder="e.g., Momo" value={formData.nameEn || ''} onChange={e => setFormData({ ...formData, nameEn: e.target.value })} /></div>

              <div><label className="text-sm font-medium mb-1.5 block">Item Name (Nepali)</label>
                <Input placeholder="e.g., मोमो" value={formData.nameNp || ''} onChange={e => setFormData({ ...formData, nameNp: e.target.value })} /></div>

              <div><label className="text-sm font-medium mb-1.5 block">Category</label>
                <Select value={formData.category || selectedCategory} onValueChange={v => setFormData({ ...formData, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.emoji} {c.name}</SelectItem>)}</SelectContent>
                </Select></div>

              <div><label className="text-sm font-medium mb-1.5 block">Description</label>
                <Textarea placeholder="Describe your item..." className="resize-none" rows={3} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium mb-1.5 block">Price (NPR) *</label>
                  <Input type="number" placeholder="0" value={formData.price || 0} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} /></div>
                <div><label className="text-sm font-medium mb-1.5 block">Discount Price</label>
                  <Input type="number" placeholder="Optional" value={formData.discountPrice || ''} onChange={e => setFormData({ ...formData, discountPrice: e.target.value ? parseFloat(e.target.value) : undefined })} /></div>
              </div>
            </div>

            {/* Right */}
            <div className="space-y-4">
              {/* Food Sub-type */}
              <div>
                <label className="text-sm font-medium mb-2 block">Food Sub-type</label>
                <div className="grid grid-cols-1 gap-1.5">
                  {FOOD_SUB_TYPES.map(st => (
                    <div key={st.value}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all ${formData.subType === st.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                      onClick={() => setFormData({ ...formData, subType: st.value as any, foodType: st.value === 'veg' ? 'veg' : 'non_veg' })}>
                      <span className="text-base">{st.emoji}</span>
                      <span className="text-sm font-medium flex-1">{st.label}</span>
                      <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: st.color }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Spice Level */}
              <div>
                <label className="text-sm font-medium mb-2 block">Spice Level</label>
                <div className="flex flex-wrap gap-1.5">
                  {SPICE_LEVELS.map(lv => (
                    <Button key={lv.value} variant={formData.spiceLevel === lv.value ? 'default' : 'outline'} size="sm"
                      onClick={() => setFormData({ ...formData, spiceLevel: lv.value as any })} className="text-xs">
                      {lv.icon} {lv.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div><label className="text-sm font-medium mb-1.5 block">Prep Time (min)</label>
                <Input type="number" value={formData.prepTime || 15} onChange={e => setFormData({ ...formData, prepTime: parseInt(e.target.value) || 15 })} /></div>

              <div className="space-y-2.5">
                {[['available','Available'], ['isPopular','Mark as Popular'], ['isNew','Mark as New']].map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-sm font-medium">{label}</label>
                    <Switch checked={(formData as any)[key] ?? (key === 'available')} onCheckedChange={v => setFormData({ ...formData, [key]: v })} />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Allergens</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {ALLERGENS.map(a => (
                    <label key={a} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={(formData.allergens || []).includes(a)}
                        onChange={e => setFormData({ ...formData, allergens: e.target.checked
                          ? [...(formData.allergens || []), a]
                          : (formData.allergens || []).filter(x => x !== a) })}
                        className="rounded" />
                      {a}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setIsAddItemOpen(false)} disabled={isSavingItem}>Cancel</Button>
            <Button onClick={handleSaveItem} disabled={isSavingItem}>
              {isSavingItem ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════
          Add / Edit Category Dialog
      ═══════════════════════════════════════════════ */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>{editingCategory ? 'Update category details' : 'Add a new category to your menu'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div><label className="text-sm font-medium mb-1.5 block">Category Name *</label>
              <Input placeholder="e.g., Starters" value={categoryFormData.name || ''} onChange={e => setCategoryFormData({ ...categoryFormData, name: e.target.value })} /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Category Name (Nepali)</label>
              <Input placeholder="e.g., अप्पिटाइजर" value={categoryFormData.nameNp || ''} onChange={e => setCategoryFormData({ ...categoryFormData, nameNp: e.target.value })} /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Icon / Emoji</label>
              <Input placeholder="🥟" value={categoryFormData.emoji || ''} onChange={e => setCategoryFormData({ ...categoryFormData, emoji: e.target.value })} className="text-2xl" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Sort Order</label>
              <Input type="number" value={categoryFormData.sortOrder || 0} onChange={e => setCategoryFormData({ ...categoryFormData, sortOrder: parseInt(e.target.value) || 0 })} /></div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Active</label>
              <Switch checked={categoryFormData.active ?? true} onCheckedChange={v => setCategoryFormData({ ...categoryFormData, active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)} disabled={isSavingCategory}>Cancel</Button>
            <Button onClick={handleSaveCategory} disabled={isSavingCategory}>
              {isSavingCategory ? 'Saving...' : editingCategory ? 'Update' : 'Add Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════
          Edit Menu Appearance Dialog
      ═══════════════════════════════════════════════ */}
      <Dialog open={isEditMenuOpen} onOpenChange={setIsEditMenuOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Menu</DialogTitle>
            <DialogDescription>Customise how your public menu looks to customers.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Background image */}
            <div>
              <label className="text-sm font-medium mb-2 block">Menu Background Image</label>
              <label className="block cursor-pointer rounded-xl border-2 border-dashed hover:border-primary transition-colors overflow-hidden">
                {bgPreview
                  ? <div className="relative h-44 w-full">
                      <img src={bgPreview} alt="bg" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white text-sm font-medium">Click to change</p>
                      </div>
                    </div>
                  : <div className="h-44 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/30">
                      <FileImage className="w-10 h-10 opacity-40" />
                      <p className="text-sm">Upload background image</p>
                      <p className="text-xs opacity-60">Recommended: 1200×400px</p>
                    </div>}
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) { setBgFile(f); setBgPreview(URL.createObjectURL(f)); } }} />
              </label>
            </div>

            <Separator />

            {/* Custom menu upload */}
            <div>
              <label className="text-sm font-medium mb-1 block">Custom Menu Upload</label>
              <p className="text-xs text-muted-foreground mb-3">Upload your own designed menu as an image or PDF. When set, customers will see this instead of the auto-generated menu.</p>
              <label className="flex items-center gap-4 border-2 border-dashed rounded-xl p-5 cursor-pointer hover:border-primary transition-colors">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Upload className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  {customMenuName || menuSettings.customMenuUrl
                    ? <>
                        <p className="font-medium text-sm truncate">{customMenuName || 'Custom menu uploaded'}</p>
                        <p className="text-xs text-muted-foreground">Click to replace</p>
                      </>
                    : <>
                        <p className="font-medium text-sm">Click to upload image or PDF</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, PDF — up to 20 MB</p>
                      </>}
                </div>
                {(customMenuName || menuSettings.customMenuUrl) && (
                  <Button type="button" size="icon" variant="ghost" className="text-destructive flex-shrink-0"
                    onClick={e => { e.preventDefault(); setCustomMenuFile(null); setCustomMenuName(null); setMenuSettings(s => ({ ...s, customMenuUrl: null })); }}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
                <input type="file" accept="image/*,application/pdf" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) { setCustomMenuFile(f); setCustomMenuName(f.name); } }} />
              </label>
              {menuSettings.customMenuUrl && !customMenuFile && (
                <a href={menuSettings.customMenuUrl} target="_blank" rel="noreferrer"
                  className="text-xs text-primary underline mt-2 inline-block">View current custom menu</a>
              )}
            </div>

            <Separator />

            {/* Items quick-edit table */}
            <div>
              <label className="text-sm font-medium mb-3 block">Quick-edit Items</label>
              {items.length === 0
                ? <p className="text-sm text-muted-foreground">No items yet.</p>
                : <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/40 group">
                        <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {item.image ? <img src={item.image} alt={item.nameEn} className="w-full h-full object-cover rounded-md" /> : <span>🍽️</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.nameEn}</p>
                          <p className="text-xs text-muted-foreground">NPR {item.price}</p>
                        </div>
                        <Switch checked={item.available} onCheckedChange={v => handleToggleAvailable(item.id, v)} />
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
                          onClick={() => { setIsEditMenuOpen(false); setTimeout(() => handleEditItem(item), 100); }}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>}
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsEditMenuOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveMenuAppearance} disabled={isSavingMenu}>
              {isSavingMenu ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════
          QR Code Dialog
      ═══════════════════════════════════════════════ */}
      <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Menu QR Code</DialogTitle>
            <DialogDescription>
              Place this QR code on every table. Customers scan it to view your menu and place orders.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            {restaurantId ? (
              <>
                <div ref={qrRef} className="p-4 bg-white rounded-2xl shadow-lg border">
                  <QRCode value={qrUrl} size={200} bgColor="#ffffff" fgColor="#0f172a" level="H" />
                </div>
                <div className="w-full bg-muted rounded-lg px-3 py-2 text-center">
                  <p className="text-xs text-muted-foreground break-all">{qrUrl}</p>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Scan with any camera app to open the menu page
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-8">Restaurant not loaded yet. Please refresh.</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsQrOpen(false)}>Close</Button>
            <Button onClick={handleDownloadQr} disabled={!restaurantId} className="gap-2">
              <Download className="w-4 h-4" /> Download QR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
