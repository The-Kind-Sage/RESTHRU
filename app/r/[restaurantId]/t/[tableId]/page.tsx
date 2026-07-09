'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Search,
  Minus,
  Plus,
  X,
  Check,
  ChevronRight,
  Droplet,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useCartStore } from '@/store/cart-store';
import { formatCurrency } from '@/lib/format';
import { MenuItem, FoodType, SpiceLevel } from '@/types';

// Mock menu data
const MOCK_MENU_DATA: MenuItem[] = [
  {
    id: '1',
    restaurantId: 'rest-1',
    categoryId: 'cat-starters',
    name: 'Veg Momo',
    description: 'Steamed vegetable dumplings with special sauce',
    price: 250,
    foodType: FoodType.VEG,
    spiceLevel: SpiceLevel.MILD,
    allergens: [],
    prepTime: 10,
    addOns: [],
    isAvailable: true,
    displayOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    restaurantId: 'rest-1',
    categoryId: 'cat-starters',
    name: 'Chicken Momo',
    description: 'Steamed chicken dumplings with secret spice blend',
    price: 350,
    foodType: FoodType.NON_VEG,
    spiceLevel: SpiceLevel.MEDIUM,
    allergens: [],
    prepTime: 12,
    addOns: [],
    isAvailable: true,
    displayOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    restaurantId: 'rest-1',
    categoryId: 'cat-starters',
    name: 'Samosa',
    description: 'Crispy pastry with potato and spice filling',
    price: 150,
    foodType: FoodType.VEG,
    spiceLevel: SpiceLevel.MEDIUM,
    allergens: [],
    prepTime: 8,
    addOns: [],
    isAvailable: true,
    displayOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    restaurantId: 'rest-1',
    categoryId: 'cat-main',
    name: 'Thakali Set',
    description: 'Traditional Thakali platter with dal, rice, and curry',
    price: 450,
    foodType: FoodType.NON_VEG,
    spiceLevel: SpiceLevel.MEDIUM,
    allergens: [],
    prepTime: 20,
    addOns: [],
    isAvailable: true,
    displayOrder: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '5',
    restaurantId: 'rest-1',
    categoryId: 'cat-main',
    name: 'Dal Bhat',
    description: 'Lentil soup with steamed rice and vegetable curry',
    price: 300,
    foodType: FoodType.VEG,
    spiceLevel: SpiceLevel.MILD,
    allergens: [],
    prepTime: 15,
    addOns: [],
    isAvailable: true,
    displayOrder: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '6',
    restaurantId: 'rest-1',
    categoryId: 'cat-main',
    name: 'Newari Khaja Set',
    description: 'Special Newari meal set with side dishes',
    price: 500,
    foodType: FoodType.NON_VEG,
    spiceLevel: SpiceLevel.HOT,
    allergens: [],
    prepTime: 25,
    addOns: [],
    isAvailable: true,
    displayOrder: 6,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '7',
    restaurantId: 'rest-1',
    categoryId: 'cat-main',
    name: 'Chicken Curry',
    description: 'Tender chicken cooked in aromatic spices',
    price: 380,
    foodType: FoodType.NON_VEG,
    spiceLevel: SpiceLevel.MEDIUM,
    allergens: [],
    prepTime: 18,
    addOns: [],
    isAvailable: true,
    displayOrder: 7,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '8',
    restaurantId: 'rest-1',
    categoryId: 'cat-drinks',
    name: 'Masala Tea',
    description: 'Traditional Nepali spiced tea with milk',
    price: 80,
    foodType: FoodType.VEG,
    spiceLevel: SpiceLevel.MILD,
    allergens: [],
    prepTime: 5,
    addOns: [],
    isAvailable: true,
    displayOrder: 8,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '9',
    restaurantId: 'rest-1',
    categoryId: 'cat-drinks',
    name: 'Lassi',
    description: 'Refreshing yogurt-based drink',
    price: 120,
    foodType: FoodType.VEG,
    spiceLevel: SpiceLevel.NONE,
    allergens: [],
    prepTime: 3,
    addOns: [],
    isAvailable: true,
    displayOrder: 9,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '10',
    restaurantId: 'rest-1',
    categoryId: 'cat-drinks',
    name: 'Mo:Mo Soup',
    description: 'Hot soup with dumpling pieces',
    price: 180,
    foodType: FoodType.VEG,
    spiceLevel: SpiceLevel.MEDIUM,
    allergens: [],
    prepTime: 8,
    addOns: [],
    isAvailable: false,
    displayOrder: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '11',
    restaurantId: 'rest-1',
    categoryId: 'cat-dessert',
    name: 'Juju Dhau',
    description: 'Sweet milk pudding with nuts',
    price: 150,
    foodType: FoodType.VEG,
    spiceLevel: SpiceLevel.NONE,
    allergens: [],
    prepTime: 5,
    addOns: [],
    isAvailable: true,
    displayOrder: 11,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '12',
    restaurantId: 'rest-1',
    categoryId: 'cat-dessert',
    name: 'Rasbari',
    description: 'Soft cheese balls in sweet syrup',
    price: 100,
    foodType: FoodType.VEG,
    spiceLevel: SpiceLevel.NONE,
    allergens: [],
    prepTime: 5,
    addOns: [],
    isAvailable: true,
    displayOrder: 12,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '13',
    restaurantId: 'rest-1',
    categoryId: 'cat-special',
    name: 'Tandoori Chicken',
    description: 'Marinated chicken cooked in traditional tandoor',
    price: 550,
    foodType: FoodType.NON_VEG,
    spiceLevel: SpiceLevel.MEDIUM,
    allergens: [],
    prepTime: 30,
    addOns: [],
    isAvailable: true,
    displayOrder: 13,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '14',
    restaurantId: 'rest-1',
    categoryId: 'cat-special',
    name: 'Sekuwa',
    description: 'Grilled meat skewers with spices',
    price: 420,
    foodType: FoodType.NON_VEG,
    spiceLevel: SpiceLevel.HOT,
    allergens: [],
    prepTime: 25,
    addOns: [],
    isAvailable: true,
    displayOrder: 14,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

type CategoryKey = 'all' | 'starters' | 'main' | 'drinks' | 'desserts' | 'specials';

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'starters', label: 'Starters' },
  { key: 'main', label: 'Main Course' },
  { key: 'drinks', label: 'Drinks' },
  { key: 'desserts', label: 'Desserts' },
  { key: 'specials', label: 'Specials' },
];

const getCategoryId = (key: CategoryKey): string => {
  const map: Record<CategoryKey, string> = {
    all: '',
    starters: 'cat-starters',
    main: 'cat-main',
    drinks: 'cat-drinks',
    desserts: 'cat-dessert',
    specials: 'cat-special',
  };
  return map[key];
};

const getSpiceEmojis = (level: SpiceLevel): string => {
  const map: Record<SpiceLevel, string> = {
    [SpiceLevel.NONE]: '',
    [SpiceLevel.MILD]: '🌶️',
    [SpiceLevel.MEDIUM]: '🌶️🌶️',
    [SpiceLevel.HOT]: '🌶️🌶️🌶️',
    [SpiceLevel.EXTRA_HOT]: '🌶️🌶️🌶️🌶️',
  };
  return map[level];
};

const getFoodTypeDot = (type: FoodType): string => {
  return type === FoodType.VEG ? '🟢' : '🔴';
};

export default function CustomerMenuPage() {
  const params = useParams();
  const restaurantId = params.restaurantId as string;
  const tableId = params.tableId as string;

  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const [language, setLanguage] = useState<'EN' | 'NP'>('EN');
  const [orderSheetOpen, setOrderSheetOpen] = useState(false);
  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [splitBillCount, setSplitBillCount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [categoryScrollRef, setCategoryScrollRef] = useState<HTMLDivElement | null>(null);

  const { items, addItem, removeItem, updateQuantity, addNote, getItemCount, getSubtotal, getTax, getTotal, clearCart } =
    useCartStore();

  const filteredMenuItems = selectedCategory === 'all'
    ? MOCK_MENU_DATA
    : MOCK_MENU_DATA.filter((item) => item.categoryId === getCategoryId(selectedCategory));

  const handleAddToCart = (item: MenuItem) => {
    if (item.isAvailable) {
      addItem(item, 1);
    }
  };

  const handlePlaceOrder = () => {
    setOrderPlaced(true);
    clearCart();
    setTimeout(() => {
      setOrderPlaced(false);
      setOrderSheetOpen(false);
    }, 3000);
  };

  const itemCount = getItemCount();
  const subtotal = getSubtotal();
  const tax = getTax(13);
  const total = getTotal(13);

  const emojis = ['🍜', '🍛', '🥘', '🍲', '🥗', '🍖'];

  // Deterministic emoji per item — avoids server/client hydration mismatch
  const getItemEmoji = (id: string) => {
    const hash = id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return emojis[hash % emojis.length];
  };

  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-background overflow-x-hidden">
      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 bg-card border-b">
        <div className="p-4 flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg truncate">Himalayan Kitchen</h1>
            <Badge variant="default" className="mt-1 bg-primary w-fit">
              Table {tableId}
            </Badge>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1 text-xs font-medium">
              <button
                onClick={() => setLanguage('EN')}
                className={`px-2 py-1 ${language === 'EN' ? 'font-bold' : 'text-muted-foreground'}`}
              >
                EN
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                onClick={() => setLanguage('NP')}
                className={`px-2 py-1 ${language === 'NP' ? 'font-bold' : 'text-muted-foreground'}`}
              >
                NP
              </button>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* RESTAURANT HERO */}
      <div className="relative h-[200px] bg-gradient-to-br from-accent-light to-accent-light overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h2 className="text-xl font-bold">Himalayan Kitchen</h2>
          <p className="text-sm opacity-90">Newari & Thakali Cuisine</p>
        </div>
      </div>

      {/* CATEGORY TABS */}
      <div
        ref={setCategoryScrollRef}
        className="sticky top-[73px] z-30 bg-card border-b"
      >
        <div className="flex flex-wrap gap-2 p-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat.key
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* MENU ITEMS LIST */}
      <div className="pb-24 px-3 py-4 space-y-3">
        <AnimatePresence mode="wait">
          {filteredMenuItems.map((item, index) => {
            const cartItem = items.find((ci) => ci.menuItemId === item.id);
            const quantity = cartItem?.quantity ?? 0;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`overflow-hidden ${!item.isAvailable ? 'opacity-60' : ''}`}>
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      {/* LEFT SIDE */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base">{item.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                        <p className="font-bold text-primary mt-1 text-sm">
                          {formatCurrency(item.price)}
                        </p>

                        {/* Indicators Row */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                          <span>{getFoodTypeDot(item.foodType)}</span>
                          {getSpiceEmojis(item.spiceLevel) && (
                            <span>{getSpiceEmojis(item.spiceLevel)}</span>
                          )}
                          {item.id === '13' && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-accent-light text-warning"
                            >
                              Popular
                            </Badge>
                          )}
                          {item.id === '14' && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-primary-light text-primary"
                            >
                              New
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* RIGHT SIDE */}
                      <div className="flex-shrink-0">
                        <div className="relative w-[100px] h-[100px] rounded-lg bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-3xl overflow-hidden">
                          {getItemEmoji(item.id)}

                          {!item.isAvailable && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <p className="text-white font-bold text-xs">Out of Stock</p>
                            </div>
                          )}

                          {quantity === 0 && item.isAvailable && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleAddToCart(item)}
                              className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center"
                            >
                              <Plus className="w-4 h-4" />
                            </motion.button>
                          )}

                          {quantity > 0 && (
                            <div className="absolute bottom-1 right-1 flex items-center gap-1 bg-background rounded-full px-1">
                              <button
                                onClick={() => updateQuantity(item.id, quantity - 1)}
                                className="p-0.5 hover:bg-muted rounded"
                              >
                                <Minus className="w-3 h-3 text-primary" />
                              </button>
                              <span className="text-xs font-bold w-4 text-center">{quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, quantity + 1)}
                                className="p-0.5 hover:bg-muted rounded"
                              >
                                <Plus className="w-3 h-3 text-primary" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* FLOATING CART BAR */}
      <AnimatePresence>
        {itemCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto"
          >
            <button
              onClick={() => setOrderSheetOpen(true)}
              className="w-full h-[60px] bg-primary text-white rounded-t-xl shadow-lg flex items-center justify-between px-4 font-semibold active:opacity-90"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  <span className="absolute -top-2 -right-2 bg-destructive text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                </div>
                <span className="text-sm">{formatCurrency(total)}</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                View Order
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ORDER SHEET DRAWER */}
      <Drawer open={orderSheetOpen} onOpenChange={setOrderSheetOpen}>
        <DrawerContent className="max-w-[430px]">
          <DrawerHeader className="border-b">
            <DrawerTitle>Your Order</DrawerTitle>
          </DrawerHeader>

          <AnimatePresence>
            {orderPlaced ? (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 gap-4"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.6 }}
                  className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center"
                >
                  <Check className="w-8 h-8 text-success" />
                </motion.div>
                <p className="text-lg font-bold text-center">
                  Your order is on its way to the kitchen!
                </p>
                <Badge className="bg-info/10 text-info">Order #ORD-2024-00523</Badge>

                {/* Order Status Tracker */}
                <div className="w-full px-4 mt-6 space-y-3">
                  {[
                    { label: 'Received', done: true },
                    { label: 'Preparing', done: false },
                    { label: 'Ready', done: false },
                    { label: 'Served', done: false },
                  ].map((step, i) => (
                    <div key={step.label} className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          step.done
                            ? 'bg-success text-white'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {step.done ? <Check className="w-4 h-4" /> : i + 1}
                      </div>
                      <span className="text-sm">{step.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                  {/* Order Items */}
                  {items.map((cartItem) => (
                    <div key={cartItem.menuItemId} className="border-b pb-4 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{cartItem.menuItemName}</p>
                          <p className="text-xs text-primary font-bold">
                            {formatCurrency(cartItem.subtotal)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(cartItem.menuItemId)}
                          className="p-1 hover:bg-destructive/10 rounded"
                        >
                          <X className="w-4 h-4 text-destructive" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() =>
                            updateQuantity(cartItem.menuItemId, cartItem.quantity - 1)
                          }
                          className="p-1 border border-primary text-primary rounded h-6 w-6 flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-6 text-center">
                          {cartItem.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(cartItem.menuItemId, cartItem.quantity + 1)
                          }
                          className="p-1 border border-primary text-primary rounded h-6 w-6 flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <Input
                        size={undefined}
                        placeholder="Special instructions..."
                        value={cartItem.specialInstructions || ''}
                        onChange={(e) => addNote(cartItem.menuItemId, e.target.value)}
                        className="text-xs h-7"
                      />
                    </div>
                  ))}

                  <div className="bg-muted p-3 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax (13% VAT)</span>
                      <span>{formatCurrency(tax)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-base text-primary">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-2">
                      Special Instructions for Kitchen
                    </label>
                    <textarea
                      placeholder="Any special requests?"
                      className="w-full text-sm border border-input rounded-md p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="border-t p-4 space-y-3">
                  <Button
                    onClick={handlePlaceOrder}
                    className="w-full bg-primary hover:bg-primary-hover h-11 font-bold"
                  >
                    Place Order
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setBillDialogOpen(true)}
                    className="w-full"
                  >
                    Request Bill
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DrawerContent>
      </Drawer>

      {/* BILL REQUEST DIALOG */}
      <Dialog open={billDialogOpen} onOpenChange={setBillDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Request Bill</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium block mb-3">Split Bill</label>
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSplitBillCount(Math.max(1, splitBillCount - 1))}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="text-lg font-bold w-8 text-center">{splitBillCount}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSplitBillCount(Math.min(6, splitBillCount + 1))}
                >
                  <Plus className="w-3 h-3" />
                </Button>
                <span className="text-sm text-muted-foreground ml-auto">
                  {Math.round(total / splitBillCount)} per person
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-3">Payment Method</label>
              <div className="space-y-2">
                {[
                  { value: 'CASH', label: 'Cash' },
                  { value: 'ESEWA', label: 'eSewa' },
                  { value: 'KHALTI', label: 'Khalti' },
                  { value: 'FONEPAY', label: 'Fonepay' },
                ].map((method) => (
                  <label key={method.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value={method.value}
                      checked={paymentMethod === method.value}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{method.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {paymentMethod !== 'CASH' && (
              <div className="bg-muted p-4 rounded-lg flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-muted to-muted rounded-lg mx-auto mb-2 flex items-center justify-center text-2xl">
                    📱
                  </div>
                  <p className="text-xs text-muted-foreground">QR Code for {paymentMethod}</p>
                </div>
              </div>
            )}

            <Button className="w-full bg-primary hover:bg-primary-hover">
              Confirm Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
