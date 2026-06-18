-- =============================================================
-- RESTHRU — Complete Supabase Schema
-- Run this ONCE in your Supabase SQL Editor.
-- Uses IF NOT EXISTS / DO NOTHING everywhere — safe to re-run.
-- =============================================================

-- ── EXTENSIONS ────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- 1. PLANS
-- =============================================================
CREATE TABLE IF NOT EXISTS plans (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name           TEXT UNIQUE NOT NULL,
  price          NUMERIC NOT NULL DEFAULT 0,
  yearly_price   NUMERIC,
  features       JSONB DEFAULT '[]',
  is_popular     BOOLEAN DEFAULT false,
  sort_order     INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now()
);

INSERT INTO plans (name, price, yearly_price, features, is_popular, sort_order) VALUES
('Free',       0,    0,     '["1 Restaurant","Up to 10 Tables","Basic POS","QR Menu","2 Staff Accounts"]', false, 1),
('Basic',      1999, 19190, '["Unlimited Tables","Full POS","QR Menu Ordering","Offline Mode","5 Staff","Basic Reports","Thermal Printer","eSewa & Khalti"]', false, 2),
('Pro',        4999, 47990, '["Everything in Basic","Inventory","Advanced Analytics","Unlimited Staff","VAT Reports","Multi-branch (3)","Low Stock Alerts","Priority Support"]', true, 3),
('Enterprise', 0,    0,     '["Everything in Pro","Unlimited Branches","Custom Features","API Access","Dedicated AM","On-site Training","SLA"]', false, 4)
ON CONFLICT (name) DO NOTHING;

-- =============================================================
-- 2. RESTAURANTS
-- =============================================================
CREATE TABLE IF NOT EXISTS restaurants (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,
  type             TEXT DEFAULT 'restaurant',
  address          TEXT,
  city             TEXT,
  phone            TEXT,
  email            TEXT,
  pan_number       TEXT,
  vat_registered   BOOLEAN DEFAULT false,
  vat_number       TEXT,
  logo_url         TEXT,
  cover_url        TEXT,
  menu_bg_url      TEXT,
  menu_custom_url  TEXT,
  num_tables       INTEGER DEFAULT 0,
  operating_hours  JSONB DEFAULT '{}',
  language         TEXT DEFAULT 'en',
  currency         TEXT DEFAULT 'NPR',
  timezone         TEXT DEFAULT 'Asia/Kathmandu',
  date_format      TEXT DEFAULT 'ad',
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurants_slug   ON restaurants(slug);
CREATE INDEX        IF NOT EXISTS idx_restaurants_owner  ON restaurants(owner_id);

-- =============================================================
-- 3. SUBSCRIPTIONS
-- =============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id        UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  plan_id              UUID REFERENCES plans(id),
  status               TEXT DEFAULT 'active',
  billing_cycle        TEXT DEFAULT 'monthly',
  current_period_start TIMESTAMPTZ DEFAULT now(),
  current_period_end   TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_restaurant ON subscriptions(restaurant_id);

-- =============================================================
-- 4. STAFF
-- =============================================================
CREATE TABLE IF NOT EXISTS staff (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'waiter',
  phone         TEXT,
  email         TEXT,
  avatar_url    TEXT,
  status        TEXT DEFAULT 'off_duty',
  salary        NUMERIC DEFAULT 0,
  qr_code_url   TEXT,
  user_id       UUID REFERENCES auth.users(id),
  joined_at     TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_restaurant ON staff(restaurant_id);

-- =============================================================
-- 5. TABLES  (restaurant seating tables)
-- =============================================================
CREATE TABLE IF NOT EXISTS tables (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  table_number  INTEGER NOT NULL,
  name          TEXT,
  capacity      INTEGER DEFAULT 4,
  shape         TEXT DEFAULT 'square',
  floor         TEXT DEFAULT 'Ground Floor',
  status        TEXT DEFAULT 'available',
  position_x    NUMERIC DEFAULT 50,
  position_y    NUMERIC DEFAULT 50,
  qr_code_url   TEXT,
  occupied_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(restaurant_id, table_number)
);

CREATE INDEX IF NOT EXISTS idx_tables_restaurant ON tables(restaurant_id);

-- =============================================================
-- 6. CATEGORIES
-- =============================================================
CREATE TABLE IF NOT EXISTS categories (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  name_np       TEXT,
  icon          TEXT,
  sort_order    INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_restaurant ON categories(restaurant_id);

-- =============================================================
-- 7. MENU ITEMS
-- =============================================================
CREATE TABLE IF NOT EXISTS menu_items (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  name_np       TEXT,
  description   TEXT,
  price         NUMERIC NOT NULL DEFAULT 0,
  discount_price NUMERIC,
  image_url     TEXT,
  food_type     TEXT DEFAULT 'veg',
  sub_type      TEXT DEFAULT 'veg',
  spice_level   TEXT DEFAULT 'none',
  prep_time     INTEGER DEFAULT 15,
  is_available  BOOLEAN DEFAULT true,
  is_popular    BOOLEAN DEFAULT false,
  is_new        BOOLEAN DEFAULT false,
  allergens     JSONB DEFAULT '[]',
  add_ons       JSONB DEFAULT '[]',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category   ON menu_items(category_id);

-- =============================================================
-- 8. ORDERS
-- =============================================================
CREATE TABLE IF NOT EXISTS orders (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id     UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id          UUID REFERENCES tables(id),
  order_number      TEXT NOT NULL,
  status            TEXT DEFAULT 'pending',
  waiter_id         UUID REFERENCES staff(id),
  total_amount      NUMERIC DEFAULT 0,
  tax_amount        NUMERIC DEFAULT 0,
  discount_amount   NUMERIC DEFAULT 0,
  service_charge    NUMERIC DEFAULT 0,
  payment_method    TEXT,
  payment_status    TEXT DEFAULT 'pending',
  special_instructions TEXT,
  customer_name     TEXT,
  customer_phone    TEXT,
  served_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(restaurant_id, order_number)
);

CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_table      ON orders(table_id);

-- =============================================================
-- 9. ORDER ITEMS
-- =============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id        UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id    UUID REFERENCES menu_items(id),
  menu_item_name  TEXT NOT NULL,
  quantity        INTEGER NOT NULL DEFAULT 1,
  unit_price      NUMERIC NOT NULL DEFAULT 0,
  total_price     NUMERIC NOT NULL DEFAULT 0,
  special_notes   TEXT,
  add_on_data     JSONB DEFAULT '[]',
  status          TEXT DEFAULT 'pending',
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- =============================================================
-- 10. BILLS
-- =============================================================
CREATE TABLE IF NOT EXISTS bills (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id  UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  order_id       UUID REFERENCES orders(id),
  bill_number    TEXT,
  subtotal       NUMERIC NOT NULL DEFAULT 0,
  tax_amount     NUMERIC NOT NULL DEFAULT 0,
  service_charge NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  total_amount   NUMERIC NOT NULL DEFAULT 0,
  amount_paid    NUMERIC DEFAULT 0,
  change_amount  NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  payment_ref    TEXT,
  split_count    INTEGER DEFAULT 1,
  notes          TEXT,
  paid_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bills_restaurant ON bills(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_bills_order      ON bills(order_id);

-- =============================================================
-- 11. INVENTORY ITEMS
-- =============================================================
CREATE TABLE IF NOT EXISTS inventory_items (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  category      TEXT,
  current_stock NUMERIC DEFAULT 0,
  unit          TEXT DEFAULT 'pcs',
  min_threshold NUMERIC DEFAULT 0,
  last_updated  TIMESTAMPTZ DEFAULT now(),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_restaurant ON inventory_items(restaurant_id);

-- =============================================================
-- 12. INVENTORY HISTORY
-- =============================================================
CREATE TABLE IF NOT EXISTS inventory_history (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  type              TEXT NOT NULL DEFAULT 'added',  -- 'added' | 'used' | 'adjusted'
  quantity          NUMERIC NOT NULL,
  note              TEXT,
  recorded_by       UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inv_history_item ON inventory_history(inventory_item_id);

-- =============================================================
-- 13. NOTIFICATIONS
-- =============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  type          TEXT NOT NULL DEFAULT 'system',  -- 'order' | 'stock' | 'bill' | 'system'
  title         TEXT NOT NULL,
  message       TEXT,
  is_read       BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_restaurant ON notifications(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread     ON notifications(restaurant_id, is_read);

-- =============================================================
-- 14. ACTIVITY LOGS
-- =============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id),
  action        TEXT NOT NULL,
  details       JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_restaurant ON activity_logs(restaurant_id);

-- =============================================================
-- 15. RESTAURANT SETTINGS  (billing/tax/payment config)
-- =============================================================
CREATE TABLE IF NOT EXISTS restaurant_settings (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id           UUID REFERENCES restaurants(id) ON DELETE CASCADE UNIQUE,
  pan_number              TEXT,
  vat_rate                NUMERIC DEFAULT 13,
  vat_number              TEXT,
  bill_footer_message     TEXT,
  vat_on_receipt          BOOLEAN DEFAULT true,
  esewa_config            JSONB DEFAULT '{}',
  khalti_config           JSONB DEFAULT '{}',
  fonepay_config          JSONB DEFAULT '{}',
  printer_config          JSONB DEFAULT '[]',
  notification_preferences JSONB DEFAULT '{}',
  receipt_format          JSONB DEFAULT '{}',
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- 16. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =============================================================
ALTER TABLE restaurants          ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff                ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables               ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories           ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills                ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_history    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans                ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- 17. RLS POLICIES
-- Helper: all owner-scoped tables check via restaurants.owner_id
-- =============================================================

-- PLANS — readable by everyone authenticated
DROP POLICY IF EXISTS "plans_select" ON plans;
CREATE POLICY "plans_select" ON plans FOR SELECT TO authenticated USING (true);

-- RESTAURANTS
DROP POLICY IF EXISTS "restaurants_select_own"  ON restaurants;
DROP POLICY IF EXISTS "restaurants_insert_own"  ON restaurants;
DROP POLICY IF EXISTS "restaurants_update_own"  ON restaurants;
DROP POLICY IF EXISTS "restaurants_delete_own"  ON restaurants;
DROP POLICY IF EXISTS "restaurants_select_anon" ON restaurants;
CREATE POLICY "restaurants_select_own"  ON restaurants FOR SELECT     TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "restaurants_insert_own"  ON restaurants FOR INSERT     TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "restaurants_update_own"  ON restaurants FOR UPDATE     TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "restaurants_delete_own"  ON restaurants FOR DELETE     TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "restaurants_select_anon" ON restaurants FOR SELECT     TO anon USING (true);

-- SUBSCRIPTIONS
DROP POLICY IF EXISTS "subscriptions_select" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_update" ON subscriptions;
CREATE POLICY "subscriptions_select" ON subscriptions FOR SELECT TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "subscriptions_insert" ON subscriptions FOR INSERT TO authenticated WITH CHECK (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "subscriptions_update" ON subscriptions FOR UPDATE TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));

-- STAFF
DROP POLICY IF EXISTS "staff_select" ON staff;
DROP POLICY IF EXISTS "staff_insert" ON staff;
DROP POLICY IF EXISTS "staff_update" ON staff;
DROP POLICY IF EXISTS "staff_delete" ON staff;
CREATE POLICY "staff_select" ON staff FOR SELECT TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "staff_insert" ON staff FOR INSERT TO authenticated WITH CHECK (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "staff_update" ON staff FOR UPDATE TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "staff_delete" ON staff FOR DELETE TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));

-- TABLES
DROP POLICY IF EXISTS "tables_select_own"  ON tables;
DROP POLICY IF EXISTS "tables_insert_own"  ON tables;
DROP POLICY IF EXISTS "tables_update_own"  ON tables;
DROP POLICY IF EXISTS "tables_delete_own"  ON tables;
DROP POLICY IF EXISTS "tables_select_anon" ON tables;
CREATE POLICY "tables_select_own"  ON tables FOR SELECT TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "tables_insert_own"  ON tables FOR INSERT TO authenticated WITH CHECK (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "tables_update_own"  ON tables FOR UPDATE TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "tables_delete_own"  ON tables FOR DELETE TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "tables_select_anon" ON tables FOR SELECT TO anon USING (true);

-- CATEGORIES
DROP POLICY IF EXISTS "categories_select_own"  ON categories;
DROP POLICY IF EXISTS "categories_insert_own"  ON categories;
DROP POLICY IF EXISTS "categories_update_own"  ON categories;
DROP POLICY IF EXISTS "categories_delete_own"  ON categories;
DROP POLICY IF EXISTS "categories_select_anon" ON categories;
CREATE POLICY "categories_select_own"  ON categories FOR SELECT TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "categories_insert_own"  ON categories FOR INSERT TO authenticated WITH CHECK (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "categories_update_own"  ON categories FOR UPDATE TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "categories_delete_own"  ON categories FOR DELETE TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "categories_select_anon" ON categories FOR SELECT TO anon USING (is_active = true);

-- MENU ITEMS
DROP POLICY IF EXISTS "menu_items_select_own"  ON menu_items;
DROP POLICY IF EXISTS "menu_items_insert_own"  ON menu_items;
DROP POLICY IF EXISTS "menu_items_update_own"  ON menu_items;
DROP POLICY IF EXISTS "menu_items_delete_own"  ON menu_items;
DROP POLICY IF EXISTS "menu_items_select_anon" ON menu_items;
CREATE POLICY "menu_items_select_own"  ON menu_items FOR SELECT TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "menu_items_insert_own"  ON menu_items FOR INSERT TO authenticated WITH CHECK (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "menu_items_update_own"  ON menu_items FOR UPDATE TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "menu_items_delete_own"  ON menu_items FOR DELETE TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "menu_items_select_anon" ON menu_items FOR SELECT TO anon USING (is_available = true);

-- ORDERS (owner + anon QR ordering)
DROP POLICY IF EXISTS "orders_select_own"  ON orders;
DROP POLICY IF EXISTS "orders_insert_own"  ON orders;
DROP POLICY IF EXISTS "orders_update_own"  ON orders;
DROP POLICY IF EXISTS "orders_insert_anon" ON orders;
CREATE POLICY "orders_select_own"  ON orders FOR SELECT TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "orders_insert_own"  ON orders FOR INSERT TO authenticated WITH CHECK (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "orders_update_own"  ON orders FOR UPDATE TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "orders_insert_anon" ON orders FOR INSERT TO anon WITH CHECK (true);

-- ORDER ITEMS
DROP POLICY IF EXISTS "order_items_select_own"  ON order_items;
DROP POLICY IF EXISTS "order_items_insert_own"  ON order_items;
DROP POLICY IF EXISTS "order_items_update_own"  ON order_items;
DROP POLICY IF EXISTS "order_items_insert_anon" ON order_items;
CREATE POLICY "order_items_select_own"  ON order_items FOR SELECT TO authenticated USING (order_id IN (SELECT id FROM orders WHERE restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())));
CREATE POLICY "order_items_insert_own"  ON order_items FOR INSERT TO authenticated WITH CHECK (order_id IN (SELECT id FROM orders WHERE restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())));
CREATE POLICY "order_items_update_own"  ON order_items FOR UPDATE TO authenticated USING (order_id IN (SELECT id FROM orders WHERE restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())));
CREATE POLICY "order_items_insert_anon" ON order_items FOR INSERT TO anon WITH CHECK (true);

-- BILLS
DROP POLICY IF EXISTS "bills_select" ON bills;
DROP POLICY IF EXISTS "bills_insert" ON bills;
DROP POLICY IF EXISTS "bills_update" ON bills;
CREATE POLICY "bills_select" ON bills FOR SELECT TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "bills_insert" ON bills FOR INSERT TO authenticated WITH CHECK (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "bills_update" ON bills FOR UPDATE TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));

-- INVENTORY ITEMS
DROP POLICY IF EXISTS "inventory_select" ON inventory_items;
DROP POLICY IF EXISTS "inventory_insert" ON inventory_items;
DROP POLICY IF EXISTS "inventory_update" ON inventory_items;
DROP POLICY IF EXISTS "inventory_delete" ON inventory_items;
CREATE POLICY "inventory_select" ON inventory_items FOR SELECT TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "inventory_insert" ON inventory_items FOR INSERT TO authenticated WITH CHECK (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "inventory_update" ON inventory_items FOR UPDATE TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "inventory_delete" ON inventory_items FOR DELETE TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));

-- INVENTORY HISTORY
DROP POLICY IF EXISTS "inv_history_select" ON inventory_history;
DROP POLICY IF EXISTS "inv_history_insert" ON inventory_history;
CREATE POLICY "inv_history_select" ON inventory_history FOR SELECT TO authenticated USING (inventory_item_id IN (SELECT id FROM inventory_items WHERE restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())));
CREATE POLICY "inv_history_insert" ON inventory_history FOR INSERT TO authenticated WITH CHECK (inventory_item_id IN (SELECT id FROM inventory_items WHERE restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())));

-- NOTIFICATIONS
DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "notifications_insert" ON notifications FOR INSERT TO authenticated WITH CHECK (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "notifications_update" ON notifications FOR UPDATE TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));

-- ACTIVITY LOGS
DROP POLICY IF EXISTS "activity_select" ON activity_logs;
DROP POLICY IF EXISTS "activity_insert" ON activity_logs;
CREATE POLICY "activity_select" ON activity_logs FOR SELECT TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "activity_insert" ON activity_logs FOR INSERT TO authenticated WITH CHECK (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));

-- RESTAURANT SETTINGS
DROP POLICY IF EXISTS "settings_select" ON restaurant_settings;
DROP POLICY IF EXISTS "settings_insert" ON restaurant_settings;
DROP POLICY IF EXISTS "settings_update" ON restaurant_settings;
CREATE POLICY "settings_select" ON restaurant_settings FOR SELECT TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "settings_insert" ON restaurant_settings FOR INSERT TO authenticated WITH CHECK (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "settings_update" ON restaurant_settings FOR UPDATE TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));

-- =============================================================
-- 18. STORAGE BUCKET + POLICIES
-- =============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "storage_upload"        ON storage.objects;
DROP POLICY IF EXISTS "storage_update"        ON storage.objects;
DROP POLICY IF EXISTS "storage_delete"        ON storage.objects;
DROP POLICY IF EXISTS "storage_public_read"   ON storage.objects;

CREATE POLICY "storage_upload"      ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'uploads');
CREATE POLICY "storage_update"      ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'uploads');
CREATE POLICY "storage_delete"      ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'uploads');
CREATE POLICY "storage_public_read" ON storage.objects FOR SELECT TO public     USING (bucket_id = 'uploads');

-- =============================================================
-- 19. UPDATED_AT TRIGGER  (keeps updated_at fresh automatically)
-- =============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'restaurants','subscriptions','staff','tables',
    'categories','menu_items','orders','bills',
    'restaurant_settings'
  ] LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_updated_at ON %I;
      CREATE TRIGGER trg_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    ', tbl, tbl);
  END LOOP;
END;
$$;

-- =============================================================
-- DONE.  All tables, indexes, RLS policies, storage, and
-- triggers are now in place.  Safe to run again (idempotent).
-- =============================================================
