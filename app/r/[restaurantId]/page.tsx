'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UtensilsCrossed, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

interface PublicItem {
  id: string;
  name: string;
  nameNp?: string;
  description?: string;
  price: number;
  discountPrice?: number;
  subType: string;
  spiceLevel: string;
  isPopular: boolean;
  isNew: boolean;
  available: boolean;
  image?: string;
  categoryId: string;
}

interface PublicCategory {
  id: string;
  name: string;
  emoji: string;
}

interface RestaurantInfo {
  name: string;
  address?: string;
  phone?: string;
  bgUrl?: string;
  customMenuUrl?: string;
}

const SUB_TYPE_COLORS: Record<string, string> = {
  veg: '#22c55e', chicken: '#f97316', buff: '#dc2626',
  pork: '#ec4899', mutton: '#7c3aed',
};
const SUB_TYPE_EMOJI: Record<string, string> = {
  veg: '🥦', chicken: '🍗', buff: '🐃', pork: '🐷', mutton: '🐑',
};
const SPICE_EMOJI: Record<string, string> = {
  none: '', mild: '🌶️', medium: '🌶️🌶️', hot: '🌶️🌶️🌶️', extra_hot: '🌶️🌶️🌶️🌶️',
};

export default function PublicMenuPage() {
  const params = useParams();
  const restaurantId = params.restaurantId as string;

  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [items, setItems] = useState<PublicItem[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !restaurantId) return;

    const load = async () => {
      if (!supabase) { setLoading(false); return; }
      setLoading(true);
      const [restRes, catRes, itemRes] = await Promise.all([
        supabase.from('restaurants')
          .select('name, address, phone, menu_bg_url, menu_custom_url')
          .eq('id', restaurantId).single(),
        supabase.from('categories')
          .select('id, name, icon, is_active')
          .eq('restaurant_id', restaurantId)
          .eq('is_active', true)
          .order('sort_order'),
        supabase.from('menu_items')
          .select('id, name, name_np, description, price, discount_price, sub_type, spice_level, is_popular, is_new, is_available, image_url, category_id')
          .eq('restaurant_id', restaurantId)
          .order('created_at'),
      ]);

      if (restRes.data) {
        setRestaurant({
          name: restRes.data.name,
          address: restRes.data.address,
          phone: restRes.data.phone,
          bgUrl: restRes.data.menu_bg_url,
          customMenuUrl: restRes.data.menu_custom_url,
        });
      }

      if (catRes.data) {
        setCategories(catRes.data.map((c: any) => ({
          id: c.id, name: c.name, emoji: c.icon || '📂',
        })));
      }

      if (itemRes.data) {
        setItems(itemRes.data.map((i: any) => ({
          id: i.id, name: i.name, nameNp: i.name_np,
          description: i.description, price: i.price,
          discountPrice: i.discount_price, subType: i.sub_type || 'veg',
          spiceLevel: i.spice_level || 'none', isPopular: i.is_popular,
          isNew: i.is_new, available: i.is_available,
          image: i.image_url, categoryId: i.category_id,
        })));
      }
      setLoading(false);
    };

    load();
  }, [restaurantId]);

  const filtered = items.filter(i => {
    if (!i.available) return false;
    if (selectedCat !== 'all' && i.categoryId !== selectedCat) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // If the restaurant uploaded a custom menu, show that directly
  if (!loading && restaurant?.customMenuUrl) {
    const isPdf = restaurant.customMenuUrl.toLowerCase().includes('.pdf');
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-40 bg-card border-b px-4 py-3 flex items-center gap-3">
          <UtensilsCrossed className="h-5 w-5 text-primary flex-shrink-0" />
          <h1 className="font-bold text-lg truncate">{restaurant?.name}</h1>
        </header>
        <div className="flex-1">
          {isPdf
            ? <iframe src={restaurant.customMenuUrl} className="w-full h-[calc(100vh-56px)]" title="Menu" />
            : <img src={restaurant.customMenuUrl} alt="Menu" className="w-full object-contain" />}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <UtensilsCrossed className="h-10 w-10 text-primary mx-auto mb-3 animate-pulse" />
          <p className="text-muted-foreground text-sm">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Restaurant not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-background">
      {/* Hero */}
      <div className="relative h-48 overflow-hidden"
        style={{ background: restaurant.bgUrl ? undefined : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
        {restaurant.bgUrl && (
          <img src={restaurant.bgUrl} alt="bg" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h1 className="text-2xl font-bold">{restaurant.name}</h1>
          {restaurant.address && <p className="text-sm opacity-80 mt-0.5">{restaurant.address}</p>}
        </div>
      </div>

      {/* Sticky search + category bar */}
      <div className="sticky top-0 z-30 bg-card border-b shadow-sm">
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search menu..." className="pl-9 h-9 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 px-4 pb-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSelectedCat('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${selectedCat === 'all' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
            All
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setSelectedCat(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${selectedCat === cat.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="p-4 space-y-3 pb-10">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <UtensilsCrossed className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No items found</p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((item, idx) => (
              <motion.div key={item.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="flex gap-3 bg-card rounded-xl border p-3 shadow-sm">
                {/* Image */}
                <div className="relative h-24 w-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
                  {item.image
                    ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    : <span className="text-3xl">🍽️</span>}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-sm leading-snug">{item.name}</p>
                    <div className="flex gap-1 flex-shrink-0">
                      {item.isPopular && <Badge className="text-[10px] h-4 px-1.5 bg-amber-100 text-amber-700 border-0">Popular</Badge>}
                      {item.isNew && <Badge className="text-[10px] h-4 px-1.5 bg-primary/10 text-primary border-0">New</Badge>}
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                  )}

                  {/* Tags row */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: SUB_TYPE_COLORS[item.subType] || '#6b7280' }}>
                      {SUB_TYPE_EMOJI[item.subType]} {item.subType.charAt(0).toUpperCase() + item.subType.slice(1)}
                    </span>
                    {SPICE_EMOJI[item.spiceLevel] && (
                      <span className="text-xs">{SPICE_EMOJI[item.spiceLevel]}</span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mt-1.5">
                    {item.discountPrice ? (
                      <>
                        <span className="font-bold text-primary text-sm">NPR {item.discountPrice}</span>
                        <span className="text-xs text-muted-foreground line-through">NPR {item.price}</span>
                      </>
                    ) : (
                      <span className="font-bold text-primary text-sm">NPR {item.price}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <footer className="text-center py-4 text-xs text-muted-foreground border-t">
        Powered by Resthru
      </footer>
    </div>
  );
}
