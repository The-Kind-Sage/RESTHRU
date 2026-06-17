-- Enable RLS if not already enabled
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "select_own_restaurants" ON restaurants;
DROP POLICY IF EXISTS "insert_own_restaurants" ON restaurants;
DROP POLICY IF EXISTS "update_own_restaurants" ON restaurants;
DROP POLICY IF EXISTS "delete_own_restaurants" ON restaurants;
DROP POLICY IF EXISTS "select_restaurants_for_qr" ON restaurants;

-- Recreate policies
CREATE POLICY "select_own_restaurants" ON restaurants
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY "insert_own_restaurants" ON restaurants
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "update_own_restaurants" ON restaurants
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "delete_own_restaurants" ON restaurants
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- Allow anon to read restaurants (needed for QR menu)
CREATE POLICY "select_restaurants_for_qr" ON restaurants
  FOR SELECT TO anon USING (true);
