'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Eye,
  Edit2,
  Trash2,
  ChevronRight,
  Upload,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FOOD_TYPES, SPICE_LEVELS, ALLERGENS } from '@/lib/constants';
import { uploadImage } from '@/lib/upload';

interface MenuItem {
  id: string;
  nameEn: string;
  nameNp?: string;
  category: string;
  description: string;
  price: number;
  discountPrice?: number;
  foodType: 'veg' | 'non_veg' | 'vegan' | 'fish';
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

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('1');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSavingItem, setIsSavingItem] = useState(false);

  const [formData, setFormData] = useState<Partial<MenuItem>>({
    nameEn: '',
    nameNp: '',
    description: '',
    price: 0,
    discountPrice: undefined,
    foodType: 'veg',
    spiceLevel: 'none',
    prepTime: 15,
    available: true,
    isPopular: false,
    isNew: false,
    allergens: [],
    variants: [],
    emoji: '🍽️',
  });

  const [categoryFormData, setCategoryFormData] = useState<Partial<Category>>({
    name: '',
    nameNp: '',
    emoji: '📂',
    sortOrder: 0,
    active: true,
  });

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => item.category === selectedCategory)
      .filter((item) =>
        item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [items, selectedCategory, searchQuery]);

  const handleAddItem = () => {
    setEditingItem(null);
    setImageFile(null);
    setImagePreview(null);
    setFormData({
      nameEn: '',
      nameNp: '',
      category: selectedCategory,
      description: '',
      price: 0,
      discountPrice: undefined,
      foodType: 'veg',
      spiceLevel: 'none',
      prepTime: 15,
      available: true,
      isPopular: false,
      isNew: false,
      allergens: [],
      variants: [],
      emoji: '🍽️',
    });
    setIsAddItemOpen(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setFormData(item);
    setImageFile(null);
    setImagePreview(item.image || null);
    setIsAddItemOpen(true);
  };

  const handleSaveItem = async () => {
    if (!formData.nameEn) return;
    setIsSavingItem(true);

    // Upload image if a new file was selected
    let image = formData.image;
    if (imageFile) {
      const uploaded = await uploadImage(imageFile, 'menu-items');
      if (uploaded) {
        image = uploaded;
      }
    }

    if (editingItem) {
      setItems(items.map((item) =>
        item.id === editingItem.id ? { ...editingItem, ...formData, image } : item
      ));
    } else {
      const newItem: MenuItem = {
        id: Date.now().toString(),
        ...formData,
        image,
        category: selectedCategory,
        nameEn: formData.nameEn || '',
        description: formData.description || '',
        price: formData.price || 0,
        foodType: formData.foodType || 'veg',
        spiceLevel: formData.spiceLevel || 'none',
        prepTime: formData.prepTime || 15,
        available: formData.available ?? true,
        isPopular: formData.isPopular ?? false,
        isNew: formData.isNew ?? false,
        allergens: formData.allergens || [],
        variants: formData.variants || [],
        emoji: formData.emoji || '🍽️',
      };
      setItems([...items, newItem]);
      setCategories(
        categories.map((cat) =>
          cat.id === selectedCategory ? { ...cat, itemCount: cat.itemCount + 1 } : cat
        )
      );
    }
    setIsSavingItem(false);
    setIsAddItemOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
    setCategories(
      categories.map((cat) =>
        cat.id === selectedCategory ? { ...cat, itemCount: Math.max(0, cat.itemCount - 1) } : cat
      )
    );
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({
      name: '',
      nameNp: '',
      emoji: '📂',
      sortOrder: categories.length,
      active: true,
    });
    setIsAddCategoryOpen(true);
  };

  const handleSaveCategory = () => {
    if (!categoryFormData.name) return;

    if (editingCategory) {
      setCategories(
        categories.map((cat) => (cat.id === editingCategory.id ? { ...editingCategory, ...categoryFormData } : cat))
      );
    } else {
      const newCategory: Category = {
        id: Date.now().toString(),
        name: categoryFormData.name || '',
        nameNp: categoryFormData.nameNp,
        emoji: categoryFormData.emoji || '📂',
        itemCount: 0,
        active: categoryFormData.active ?? true,
        sortOrder: categoryFormData.sortOrder || categories.length,
      };
      setCategories([...categories, newCategory]);
    }
    setIsAddCategoryOpen(false);
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(categories.filter((cat) => cat.id !== id));
    setItems(items.filter((item) => item.category !== id));
    if (selectedCategory === id) {
      setSelectedCategory(categories[0]?.id || '1');
    }
  };

  const toggleCategoryActive = (id: string) => {
    setCategories(categories.map((cat) => (cat.id === id ? { ...cat, active: !cat.active } : cat)));
  };

  const getFoodTypeColor = (foodType: string) => {
    const type = FOOD_TYPES.find((t) => t.value === foodType);
    return type?.color || '#000';
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel - Categories */}
      <div className="w-[300px] border-r bg-card">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Categories</h2>
              <Button size="sm" variant="default" onClick={handleAddCategory}>
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {/* Categories List */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              <AnimatePresence>
                {categories.map((category) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className={`group relative px-3 py-2 rounded-lg cursor-pointer transition-all ${
                      selectedCategory === category.id
                        ? 'border-l-2 border-primary bg-primary/5'
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-xl">{category.emoji}</span>
                        <div>
                          <p className="font-medium text-sm">{category.name}</p>
                          <p className="text-xs text-muted-foreground">{category.itemCount} items</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCategory(category);
                            setCategoryFormData(category);
                            setIsAddCategoryOpen(true);
                          }}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(category.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-muted-foreground">
                        {category.active ? 'Active' : 'Inactive'}
                      </span>
                      <Switch
                        checked={category.active}
                        onCheckedChange={() => toggleCategoryActive(category.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Right Panel - Menu Items */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b bg-card">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-bold">Menu Items</h2>
              <p className="text-sm text-muted-foreground">
                {categories.find((c) => c.id === selectedCategory)?.name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="default" onClick={handleAddItem}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
              <Button variant="outline" onClick={() => {}}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 border rounded-lg p-1 bg-muted">
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                onClick={() => setViewMode('grid')}
                className="w-10 h-8"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                onClick={() => setViewMode('list')}
                className="w-10 h-8"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Items Container */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="h-full overflow-hidden group relative">
                        {/* Image Placeholder */}
                        <div className="relative h-40 bg-gradient-to-br from-accent-light to-accent-light flex items-center justify-center">
                          <span className="text-6xl">{item.emoji}</span>
                          {item.outOfStock && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <span className="text-white font-bold text-center">Out of Stock</span>
                            </div>
                          )}
                          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEditItem(item)}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 w-8 p-0"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-bold text-base">{item.nameEn}</h3>
                                <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                              </div>
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: getFoodTypeColor(item.foodType) }}
                              />
                            </div>

                            <div className="flex items-baseline gap-2">
                              {item.discountPrice ? (
                                <>
                                  <span className="text-primary font-bold">
                                    NPR {item.discountPrice}
                                  </span>
                                  <span className="text-xs text-muted-foreground line-through">
                                    NPR {item.price}
                                  </span>
                                </>
                              ) : (
                                <span className="text-primary font-bold">
                                  NPR {item.price}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                              {item.isPopular && <Badge variant="secondary" className="bg-accent-light text-warning">Popular</Badge>}
                              {item.isNew && <Badge variant="secondary" className="bg-primary-light text-primary">New</Badge>}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t">
                              <span className="text-xs text-muted-foreground">
                                {item.available ? 'Available' : 'Unavailable'}
                              </span>
                              <Switch
                                checked={item.available}
                                onCheckedChange={(checked) => {
                                  setItems(
                                    items.map((i) => (i.id === item.id ? { ...i, available: checked } : i))
                                  );
                                }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              // List View
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-4 px-4 py-2 font-semibold text-sm text-muted-foreground border-b">
                  <div className="col-span-1">Image</div>
                  <div className="col-span-2">Name</div>
                  <div className="col-span-2">Description</div>
                  <div className="col-span-1">Price</div>
                  <div className="col-span-1">Type</div>
                  <div className="col-span-1">Available</div>
                  <div className="col-span-4">Actions</div>
                </div>
                <AnimatePresence>
                  {filteredItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="grid grid-cols-12 gap-4 items-center p-4 border rounded-lg hover:bg-accent group"
                    >
                      <div className="col-span-1">
                        <div className="text-2xl">{item.emoji}</div>
                      </div>
                      <div className="col-span-2">
                        <p className="font-medium text-sm">{item.nameEn}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                      </div>
                      <div className="col-span-1">
                        <p className="font-bold text-primary">NPR {item.price}</p>
                      </div>
                      <div className="col-span-1">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: getFoodTypeColor(item.foodType) }}
                        />
                      </div>
                      <div className="col-span-1">
                        <Switch
                          checked={item.available}
                          onCheckedChange={(checked) => {
                            setItems(
                              items.map((i) => (i.id === item.id ? { ...i, available: checked } : i))
                            );
                          }}
                        />
                      </div>
                      <div className="col-span-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.isPopular && (
                          <Badge variant="secondary" className="bg-accent-light text-warning text-xs">
                            Popular
                          </Badge>
                        )}
                        {item.isNew && (
                          <Badge variant="secondary" className="bg-primary-light text-primary text-xs">
                            New
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditItem(item)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Add/Edit Item Dialog */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the menu item details' : 'Add a new item to your menu'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 py-4">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="text-sm font-medium mb-2 block">Food Image</label>
                <label className="block border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-accent transition-colors">
                  {imagePreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={imagePreview}
                        alt="Food preview"
                        className="h-28 w-full object-cover rounded-md"
                      />
                      <p className="text-xs text-muted-foreground">Click to change</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Drop image here or click</p>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </label>
              </div>

              {/* Item Name EN */}
              <div>
                <label className="text-sm font-medium mb-2 block">Item Name (English) *</label>
                <Input
                  placeholder="e.g., Momo"
                  value={formData.nameEn || ''}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                />
              </div>

              {/* Item Name NP */}
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  Item Name (Nepali)
                  <Badge variant="outline" className="text-xs">NP</Badge>
                </label>
                <Input
                  placeholder="e.g., मोमो"
                  value={formData.nameNp || ''}
                  onChange={(e) => setFormData({ ...formData, nameNp: e.target.value })}
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select
                  value={formData.category || selectedCategory}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.emoji} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  placeholder="Describe your item..."
                  className="resize-none"
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">Price (NPR) *</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.price || 0}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Discount Price</label>
                  <Input
                    type="number"
                    placeholder="Optional"
                    value={formData.discountPrice || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, discountPrice: e.target.value ? parseFloat(e.target.value) : undefined })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Food Type */}
              <div>
                <label className="text-sm font-medium mb-3 block">Food Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {FOOD_TYPES.map((type) => (
                    <div
                      key={type.value}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.foodType === type.value
                          ? 'border-primary bg-primary-light'
                          : 'border-border hover:border-primary'
                      }`}
                      onClick={() => setFormData({ ...formData, foodType: type.value as any })}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                        <span className="text-sm font-medium">{type.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spice Level */}
              <div>
                <label className="text-sm font-medium mb-2 block">Spice Level</label>
                <div className="flex gap-2 flex-wrap">
                  {SPICE_LEVELS.map((level) => (
                    <Button
                      key={level.value}
                      variant={formData.spiceLevel === level.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormData({ ...formData, spiceLevel: level.value as any })}
                      className="text-xs"
                    >
                      {level.icon} {level.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Prep Time */}
              <div>
                <label className="text-sm font-medium mb-2 block">Preparation Time (minutes)</label>
                <Input
                  type="number"
                  placeholder="15"
                  value={formData.prepTime || 15}
                  onChange={(e) => setFormData({ ...formData, prepTime: parseInt(e.target.value) })}
                />
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Available</label>
                  <Switch
                    checked={formData.available ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, available: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Mark as Popular</label>
                  <Switch
                    checked={formData.isPopular ?? false}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPopular: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Mark as New</label>
                  <Switch
                    checked={formData.isNew ?? false}
                    onCheckedChange={(checked) => setFormData({ ...formData, isNew: checked })}
                  />
                </div>
              </div>

              {/* Allergens */}
              <div>
                <label className="text-sm font-medium mb-2 block">Allergens</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALLERGENS.map((allergen) => (
                    <label key={allergen} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(formData.allergens || []).includes(allergen)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              allergens: [...(formData.allergens || []), allergen],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              allergens: (formData.allergens || []).filter((a) => a !== allergen),
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{allergen}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setIsAddItemOpen(false)} disabled={isSavingItem}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleSaveItem} disabled={isSavingItem}>
              {isSavingItem ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Category Dialog */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Update the category details' : 'Create a new menu category'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Category Name *</label>
              <Input
                placeholder="e.g., Starters"
                value={categoryFormData.name || ''}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                Category Name (Nepali)
                <Badge variant="outline" className="text-xs">NP</Badge>
              </label>
              <Input
                placeholder="e.g., अप्पिटाइजर"
                value={categoryFormData.nameNp || ''}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, nameNp: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Icon/Emoji</label>
              <Input
                placeholder="e.g., 🥟"
                value={categoryFormData.emoji || ''}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, emoji: e.target.value })}
                className="text-2xl"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Sort Order</label>
              <Input
                type="number"
                value={categoryFormData.sortOrder || 0}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, sortOrder: parseInt(e.target.value) })}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Active</label>
              <Switch
                checked={categoryFormData.active ?? true}
                onCheckedChange={(checked) => setCategoryFormData({ ...categoryFormData, active: checked })}
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleSaveCategory}>
              {editingCategory ? 'Update Category' : 'Add Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
