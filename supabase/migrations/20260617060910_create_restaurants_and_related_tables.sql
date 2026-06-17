-- Restaurants table
CREATE TABLE restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'restaurant',
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  pan_number TEXT,
  vat_registered BOOLEAN DEFAULT false,
  vat_number TEXT,
  logo_url TEXT,
  cover_url TEXT,
  num_tables INTEGER DEFAULT 0,
  operating_hours JSONB DEFAULT '{}',
  language TEXT DEFAULT 'en',
  currency TEXT DEFAULT 'NPR',
  timezone TEXT DEFAULT 'Asia/Kathmandu',
  date_format TEXT DEFAULT 'ad',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Restaurant settings table
CREATE TABLE restaurant_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE UNIQUE,
  pan_number TEXT,
  vat_rate NUMERIC DEFAULT 13,
  vat_number TEXT,
  bill_footer_message TEXT,
  vat_on_receipt BOOLEAN DEFAULT true,
  esewa_config JSONB DEFAULT '{}',
  khalti_config JSONB DEFAULT '{}',
  fonepay_config JSONB DEFAULT '{}',
  printer_config JSONB DEFAULT '[]',
  notification_preferences JSONB DEFAULT '{}',
  receipt_format JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Plans table
CREATE TABLE plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  yearly_price NUMERIC,
  features JSONB DEFAULT '[]',
  is_popular BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id),
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMPTZ DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  billing_cycle TEXT DEFAULT 'monthly',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Staff table
CREATE TABLE staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'waiter',
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'off_duty',
  qr_code_url TEXT,
  salary NUMERIC,
  user_id UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tables (restaurant tables)
CREATE TABLE tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  name TEXT,
  capacity INTEGER DEFAULT 4,
  shape TEXT DEFAULT 'square',
  floor TEXT DEFAULT 'Ground Floor',
  qr_code_url TEXT,
  status TEXT DEFAULT 'available',
  position_x NUMERIC DEFAULT 0,
  position_y NUMERIC DEFAULT 0,
  occupied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(restaurant_id, table_number)
);

-- Categories table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_np TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Menu items table
CREATE TABLE menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  name_np TEXT,
  description TEXT,
  price NUMERIC NOT NULL,
  discount_price NUMERIC,
  image_url TEXT,
  food_type TEXT DEFAULT 'veg',
  spice_level TEXT DEFAULT 'none',
  prep_time INTEGER,
  is_available BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  allergens JSONB DEFAULT '[]',
  add_ons JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id UUID REFERENCES tables(id),
  order_number TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  waiter_id UUID REFERENCES staff(id),
  total_amount NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  special_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  served_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(restaurant_id, order_number)
);

-- Order items table
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  special_notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inventory items table
CREATE TABLE inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  current_stock NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  min_threshold NUMERIC DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inventory history table
CREATE TABLE inventory_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'added',
  quantity NUMERIC NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bills table
CREATE TABLE bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  subtotal NUMERIC NOT NULL,
  tax NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  payment_method TEXT,
  split_count INTEGER DEFAULT 1,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Activity logs table
CREATE TABLE activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id UUID,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for restaurants (owner access)
CREATE POLICY "select_own_restaurants" ON restaurants FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "insert_own_restaurants" ON restaurants FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "update_own_restaurants" ON restaurants FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "delete_own_restaurants" ON restaurants FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- RLS policies for restaurant_settings
CREATE POLICY "select_own_settings" ON restaurant_settings FOR SELECT TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "insert_own_settings" ON restaurant_settings FOR INSERT TO authenticated WITH CHECK (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "update_own_settings" ON restaurant_settings FOR UPDATE TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));

-- RLS policies for plans (readable by all authenticated)
CREATE POLICY "select_plans" ON plans FOR SELECT TO authenticated USING (true);

-- RLS policies for subscriptions
CREATE POLICY "select_own_subscriptions" ON subscriptions FOR SELECT TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "insert_own_subscriptions" ON subscriptions FOR INSERT TO authenticated WITH CHECK (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "update_own_subscriptions" ON subscriptions FOR UPDATE TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));

-- RLS policies for staff
CREATE POLICY "select_own_staff" ON staff FOR SELECT TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "insert_own_staff" ON staff FOR INSERT TO authenticated WITH CHECK (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "update_own_staff" ON staff FOR UPDATE TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "delete_own_staff" ON staff FOR DELETE TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));

-- RLS policies for tables
CREATE POLICY "select_own_tables" ON tables FOR SELECT TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "insert_own_tables" ON tables FOR INSERT TO authenticated WITH CHECK (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "update_own_tables" ON tables FOR UPDATE TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "delete_own_tables" ON tables FOR DELETE TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));

-- RLS policies for categories
CREATE POLICY "select_own_categories" ON categories FOR SELECT TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "insert_own_categories" ON categories FOR INSERT TO authenticated WITH CHECK (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "update_own_categories" ON categories FOR UPDATE TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "delete_own_categories" ON categories FOR DELETE TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));

-- RLS policies for menu_items (readable by anon for QR menu, writable by owner)
CREATE POLICY "select_own_menu_items" ON menu_items FOR SELECT TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "select_menu_items_for_qr" ON menu_items FOR SELECT TO anon USING (is_available = true);
CREATE POLICY "insert_own_menu_items" ON menu_items FOR INSERT TO authenticated WITH CHECK (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "update_own_menu_items" ON menu_items FOR UPDATE TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "delete_own_menu_items" ON menu_items FOR DELETE TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));

-- RLS policies for orders
CREATE POLICY "select_own_orders" ON orders FOR SELECT TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "insert_own_orders" ON orders FOR INSERT TO authenticated WITH CHECK (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "update_own_orders" ON orders FOR UPDATE TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
-- Allow anon to create orders from QR menu
CREATE POLICY "insert_qr_orders" ON orders FOR INSERT TO anon WITH CHECK (true);

-- RLS policies for order_items
CREATE POLICY "select_own_order_items" ON order_items FOR SELECT TO authenticated USING (order_id IN (SELECT id FROM orders WHERE restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())));
CREATE POLICY "insert_own_order_items" ON order_items FOR INSERT TO authenticated WITH CHECK (order_id IN (SELECT id FROM orders WHERE restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())));
CREATE POLICY "update_own_order_items" ON order_items FOR UPDATE TO authenticated USING (order_id IN (SELECT id FROM orders WHERE restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())));
-- Allow anon to create order items from QR menu
CREATE POLICY "insert_qr_order_items" ON order_items FOR INSERT TO anon WITH CHECK (true);

-- RLS policies for inventory_items
CREATE POLICY "select_own_inventory" ON inventory_items FOR SELECT TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "insert_own_inventory" ON inventory_items FOR INSERT TO authenticated WITH CHECK (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "update_own_inventory" ON inventory_items FOR UPDATE TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "delete_own_inventory" ON inventory_items FOR DELETE TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));

-- RLS policies for inventory_history
CREATE POLICY "select_own_inventory_history" ON inventory_history FOR SELECT TO authenticated USING (inventory_item_id IN (SELECT id FROM inventory_items WHERE restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())));
CREATE POLICY "insert_own_inventory_history" ON inventory_history FOR INSERT TO authenticated WITH CHECK (inventory_item_id IN (SELECT id FROM inventory_items WHERE restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())));

-- RLS policies for bills
CREATE POLICY "select_own_bills" ON bills FOR SELECT TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "insert_own_bills" ON bills FOR INSERT TO authenticated WITH CHECK (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "update_own_bills" ON bills FOR UPDATE TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));

-- RLS policies for notifications
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));

-- RLS policies for activity_logs
CREATE POLICY "select_own_activity" ON activity_logs FOR SELECT TO authenticated USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "insert_own_activity" ON activity_logs FOR INSERT TO authenticated WITH CHECK (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));

-- Insert default plans
INSERT INTO plans (name, price, yearly_price, features, is_popular, sort_order) VALUES
('Free', 0, 0, '["1 Restaurant","Up to 10 Tables","Basic POS","QR Menu","2 Staff Accounts"]', false, 1),
('Basic', 1999, 19190, '["Unlimited Tables","Full POS System","QR Menu Ordering","Offline Mode","5 Staff Accounts","Basic Reports","Thermal Printer Support","eSewa and Khalti Payments"]', false, 2),
('Pro', 4999, 47990, '["Everything in Basic","Inventory Management","Advanced Analytics","Unlimited Staff","VAT and IRD Reports","Multi-branch (up to 3)","Low Stock Alerts","Priority Support"]', true, 3),
('Enterprise', 0, 0, '["Everything in Pro","Unlimited Branches","Custom Features","API Access","Dedicated Account Manager","On-site Training","SLA Guarantee"]', false, 4);

-- Allow anon to read categories for QR menu
CREATE POLICY "select_categories_for_qr" ON categories FOR SELECT TO anon USING (is_active = true);

-- Allow anon to read tables for QR menu
CREATE POLICY "select_tables_for_qr" ON tables FOR SELECT TO anon USING (true);

-- Allow anon to read restaurants for QR menu
CREATE POLICY "select_restaurants_for_qr" ON restaurants FOR SELECT TO anon USING (true);

-- Create indexes for performance
CREATE INDEX idx_restaurants_owner ON restaurants(owner_id);
CREATE INDEX idx_restaurants_slug ON restaurants(slug);
CREATE INDEX idx_staff_restaurant ON staff(restaurant_id);
CREATE INDEX idx_tables_restaurant ON tables(restaurant_id);
CREATE INDEX idx_categories_restaurant ON categories(restaurant_id);
CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_inventory_restaurant ON inventory_items(restaurant_id);
CREATE INDEX idx_notifications_restaurant ON notifications(restaurant_id);
CREATE INDEX idx_bills_restaurant ON bills(restaurant_id);
