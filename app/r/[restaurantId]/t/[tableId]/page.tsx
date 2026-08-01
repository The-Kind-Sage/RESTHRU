'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  ShoppingCart,
  Minus,
  Plus,
  X,
  Check,
  ChevronRight,
  Droplet,
  Flame,
  Loader2,
  AlertCircle,
  BookOpen,
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
import { getPublicMenuData } from '@/lib/actions/public-menu';
import { createPublicOrder, getPublicOrderStatus, requestPublicBill, getPublicTableInfo } from '@/lib/actions/public-order';
import { generatePublicPaymentQR } from '@/lib/actions/payments';
import GuestHelpPanel from './_components/GuestHelpPanel';

interface CategoryTab {
  id: string;
  name: string;
}

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
  // Rotating QR token from the scanned link (?k=…), proving this is the
  // current sitting at the table rather than a link kept from a past visit.
  const searchParams = useSearchParams();
  const qrToken = searchParams.get('k') ?? undefined;

  const [restaurant, setRestaurant] = useState<{ name: string; tagline?: string } | null>(null);
  const [categories, setCategories] = useState<CategoryTab[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuError, setMenuError] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  // Guests can switch how dishes are laid out from the floating "View Style"
  // action: a single-column list (default) or a two-up grid.
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  // Human-readable table label. The URL carries the cuid, so the number has to
  // be looked up rather than parsed out of the path.
  const [tableLabel, setTableLabel] = useState<string>('');

  useEffect(() => {
    if (!restaurantId || !tableId) return;
    getPublicTableInfo(restaurantId, tableId).then((res) => {
      if ('data' in res && res.data) {
        setTableLabel(res.data.name || `Table ${res.data.tableNumber}`);
      }
    });
  }, [restaurantId, tableId]);
  const [orderSheetOpen, setOrderSheetOpen] = useState(false);
  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<{ id: string; orderId: string; status: string } | null>(null);
  const [isRequestingBill, setIsRequestingBill] = useState(false);
  const [splitBillCount, setSplitBillCount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentQR, setPaymentQR] = useState<{ url: string; loading: boolean; error: string | null }>({
    url: '',
    loading: false,
    error: null,
  });
  const [categoryScrollRef, setCategoryScrollRef] = useState<HTMLDivElement | null>(null);

  const { items, addItem, removeItem, updateQuantity, addNote, getItemCount, getSubtotal, getTax, getTotal, clearCart } =
    useCartStore();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setMenuError(false);
    const data = await getPublicMenuData(restaurantId);
    if (data.restaurant) {
      setRestaurant({ name: data.restaurant.name, tagline: data.restaurant.address });
      setCategories(data.categories.map((c) => ({ id: c.id, name: c.name })));
      setMenuItems(data.items.map((item) => ({
        id: item.id,
        restaurantId,
        categoryId: item.categoryId,
        name: item.name,
        description: item.description || '',
        imageUrl: item.image,
        price: item.price,
        discountPrice: item.discountPrice,
        foodType: item.foodType as FoodType,
        spiceLevel: item.spiceLevel as SpiceLevel,
        allergens: [],
        prepTime: 0,
        addOns: [],
        isAvailable: true,
        displayOrder: 0,
        totalOrders: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })));
    } else {
      setMenuError(true);
    }
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Poll the real order status while a just-placed order hasn't reached a terminal
  // state, so the tracker below reflects the kitchen's actual progress rather than a
  // static "Received" — falls back gracefully (silent no-op) if a poll fails.
  useEffect(() => {
    if (!placedOrder || ['SERVED', 'CANCELLED'].includes(placedOrder.status)) return;
    const interval = setInterval(async () => {
      const res = await getPublicOrderStatus(placedOrder.id, restaurantId);
      if (res.data) {
        setPlacedOrder((prev) => (prev ? { ...prev, status: res.data!.status } : prev));
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [placedOrder, restaurantId]);

  // Fetch a real payment QR whenever a non-cash method is selected in the Request
  // Bill dialog, instead of the placeholder emoji.
  useEffect(() => {
    const currentTotal = getTotal(13);
    if (!billDialogOpen || paymentMethod === 'CASH' || currentTotal <= 0) {
      setPaymentQR({ url: '', loading: false, error: null });
      return;
    }
    let cancelled = false;
    setPaymentQR({ url: '', loading: true, error: null });
    generatePublicPaymentQR({ restaurantId, tableId, method: paymentMethod, amount: currentTotal }).then((res) => {
      if (cancelled) return;
      if (res.error || !res.data) {
        setPaymentQR({ url: '', loading: false, error: res.error || 'Failed to generate QR code' });
      } else {
        setPaymentQR({ url: res.data.qrDataUrl, loading: false, error: null });
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billDialogOpen, paymentMethod, restaurantId, tableId]);

  const filteredMenuItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter((item) => item.categoryId === selectedCategory);

  const handleAddToCart = (item: MenuItem) => {
    if (item.isAvailable) {
      addItem(item, 1);
    }
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0 || isPlacingOrder) return;
    setIsPlacingOrder(true);
    try {
      const result = await createPublicOrder({
        restaurantId,
        tableId,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          notes: i.specialInstructions,
        })),
        // Forwarded from the scanned QR link; the server rejects a token from a
        // previous sitting so an old link can't order after the bill is paid.
        token: qrToken,
      });

      if (result.error || !result.data) {
        toast.error(result.error || 'Failed to place order. Please try again.');
        return;
      }
      if (result.warning) {
        toast.warning(result.warning);
      }

      setPlacedOrder({ id: result.data.id, orderId: result.data.orderId, status: result.data.status });
      clearCart();
    } catch {
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (isRequestingBill) return;
    setIsRequestingBill(true);
    try {
      const result = await requestPublicBill({
        restaurantId,
        tableId,
        paymentMethod,
        splitCount: splitBillCount > 1 ? splitBillCount : undefined,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Bill requested — a staff member will be with you shortly.');
      setBillDialogOpen(false);
    } catch {
      toast.error('Failed to request bill. Please try again.');
    } finally {
      setIsRequestingBill(false);
    }
  };

  const itemCount = getItemCount();
  const subtotal = getSubtotal();
  const total = getSubtotal();

  const emojis = ['🍜', '🍛', '🥘', '🍲', '🥗', '🍖'];

  // Deterministic emoji per item — avoids server/client hydration mismatch
  const getItemEmoji = (id: string) => {
    const hash = id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return emojis[hash % emojis.length];
  };

  if (!loading && menuError) {
    return (
      <div className="max-w-[430px] mx-auto min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <div>
          <h1 className="font-bold text-lg">Menu unavailable</h1>
          <p className="text-sm text-muted-foreground mt-1">
            We couldn&apos;t find this restaurant&apos;s menu. The QR code may be out of date,
            or the restaurant may no longer be active.
          </p>
        </div>
        <Button onClick={() => fetchData()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="max-w-[430px] md:max-w-2xl lg:max-w-4xl mx-auto min-h-screen bg-background overflow-x-hidden">
      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 bg-card border-b">
        <div className="p-4 flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg truncate">{restaurant?.name || 'Menu'}</h1>
            {tableLabel && (
              <Badge variant="default" className="mt-1 bg-primary w-fit">
                {tableLabel}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              title="Browse full menu"
              onClick={() => window.open(`/r/${restaurantId}`, '_blank')}
            >
              <BookOpen className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* RESTAURANT HERO */}
      {restaurant && (
        <div className="relative h-[200px] bg-gradient-to-br from-accent-light to-accent-light overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h2 className="text-xl font-bold">{restaurant.name}</h2>
            {restaurant.tagline && (
              <p className="text-sm opacity-90">{restaurant.tagline}</p>
            )}
          </div>
        </div>
      )}

      {/* CATEGORY TABS */}
      {categories.length > 0 && (
        <div
          ref={setCategoryScrollRef}
          className="sticky top-[73px] z-30 bg-card border-b"
        >
          <div className="flex flex-wrap gap-2 p-3">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MENU ITEMS LIST */}
      <div
        className={
          viewMode === 'grid'
            ? 'pb-24 px-3 py-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 items-stretch'
            : 'pb-24 px-3 py-4 space-y-3'
        }
      >
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-muted rounded w-full animate-pulse" />
                    <div className="h-3 bg-muted rounded w-1/4 animate-pulse" />
                  </div>
                  <div className="w-[100px] h-[100px] bg-muted rounded-lg animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : menuItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No menu items available</p>
          </div>
        ) : (
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
                <Card className={`overflow-hidden h-full ${!item.isAvailable ? 'opacity-60' : ''}`}>
                  <CardContent className="p-3 h-full">
                    {/* Grid stacks image-over-text so two cards fit a phone;
                        list keeps the wider text-beside-thumbnail layout. */}
                    <div className={viewMode === 'grid' ? 'flex flex-col-reverse gap-2 h-full' : 'flex gap-3'}>
                      {/* LEFT SIDE */}
                      <div className="flex-1 min-w-0">
                        <h3 className={viewMode === 'grid' ? 'font-bold text-sm line-clamp-1' : 'font-bold text-base'}>{item.name}</h3>
                        <p className={viewMode === 'grid' ? 'hidden' : 'text-xs text-muted-foreground line-clamp-2'}>
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
                        </div>
                      </div>

                      {/* RIGHT SIDE */}
                      <div className={viewMode === 'grid' ? 'w-full' : 'flex-shrink-0'}>
                        <div
                          className={
                            'relative rounded-lg bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-3xl overflow-hidden ' +
                            (viewMode === 'grid' ? 'w-full aspect-square' : 'w-[100px] h-[100px]')
                          }
                        >
                          {/* Show the dish photo when there is one; the emoji is
                              only a fallback for items with no image. */}
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              loading="lazy"
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          ) : (
                            getItemEmoji(item.id)
                          )}

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
      )}
      </div>

      {/* FLOATING CART BAR */}
      <AnimatePresence>
        {itemCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-0 left-0 right-0 max-w-[430px] md:max-w-2xl lg:max-w-4xl mx-auto"
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
            {placedOrder ? (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 gap-4"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.6 }}
                  className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    placedOrder.status === 'CANCELLED' ? 'bg-destructive/10' : 'bg-primary-light'
                  }`}
                >
                  {placedOrder.status === 'CANCELLED' ? (
                    <AlertCircle className="w-8 h-8 text-destructive" />
                  ) : (
                    <Check className="w-8 h-8 text-success" />
                  )}
                </motion.div>
                <p className="text-lg font-bold text-center">
                  {placedOrder.status === 'CANCELLED'
                    ? 'This order was cancelled. Please speak to a staff member.'
                    : 'Your order is on its way to the kitchen!'}
                </p>
                <Badge className="bg-info/10 text-info">Order #{placedOrder.orderId}</Badge>

                {/* Order Status Tracker — driven by the real order status, polled every 8s */}
                {placedOrder.status !== 'CANCELLED' && (
                  <div className="w-full px-4 mt-6 space-y-3">
                    {(() => {
                      const steps = [
                        { key: 'PENDING', label: 'Received' },
                        { key: 'PREPARING', label: 'Preparing' },
                        { key: 'READY', label: 'Ready' },
                        { key: 'SERVED', label: 'Served' },
                      ];
                      const currentIndex = Math.max(0, steps.findIndex((s) => s.key === placedOrder.status));
                      return steps.map((step, i) => {
                        const done = i <= currentIndex;
                        return (
                          <div key={step.label} className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                done ? 'bg-success text-white' : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {done ? <Check className="w-4 h-4" /> : i + 1}
                            </div>
                            <span className="text-sm">{step.label}</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}

                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setPlacedOrder(null);
                    setOrderSheetOpen(false);
                  }}
                >
                  Continue Browsing
                </Button>
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
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-base text-primary">
                        {formatCurrency(subtotal)}
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
                    disabled={isPlacingOrder || items.length === 0}
                    className="w-full bg-primary hover:bg-primary-hover h-11 font-bold"
                  >
                    {isPlacingOrder ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      'Place Order'
                    )}
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

      {/* Guest FAB + help sheet (water / waiter / bill) */}
      <GuestHelpPanel
        restaurantId={restaurantId}
        tableId={tableId}
        onRequestBill={() => setBillDialogOpen(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        categories={categories}
        subMenus={Array.from(
          new Set(menuItems.map((i: any) => i.menuSection).filter(Boolean))
        ) as string[]}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

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
              <div className="bg-muted p-4 rounded-lg flex items-center justify-center min-h-32">
                <div className="text-center">
                  {paymentQR.loading ? (
                    <div className="w-20 h-20 mx-auto mb-2 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : paymentQR.error ? (
                    <p className="text-xs text-destructive px-2">{paymentQR.error}</p>
                  ) : paymentQR.url ? (
                    <img
                      src={paymentQR.url}
                      alt={`Payment QR code for ${paymentMethod}`}
                      className="w-28 h-28 mx-auto mb-2 rounded-lg bg-white p-1"
                    />
                  ) : null}
                  <p className="text-xs text-muted-foreground mt-1">
                    Scan to pay with {paymentMethod}
                  </p>
                </div>
              </div>
            )}

            <Button
              className="w-full bg-primary hover:bg-primary-hover"
              onClick={handleConfirmPayment}
              disabled={isRequestingBill}
            >
              {isRequestingBill ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Confirm Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
