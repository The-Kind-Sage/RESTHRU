-- Create staff table if it doesn't exist on the live database
CREATE TABLE IF NOT EXISTS staff (
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

-- Enable RLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "select_own_staff" ON staff;
DROP POLICY IF EXISTS "insert_own_staff" ON staff;
DROP POLICY IF EXISTS "update_own_staff" ON staff;
DROP POLICY IF EXISTS "delete_own_staff" ON staff;

-- Recreate policies
CREATE POLICY "select_own_staff" ON staff
  FOR SELECT TO authenticated
  USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));

CREATE POLICY "insert_own_staff" ON staff
  FOR INSERT TO authenticated
  WITH CHECK (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));

CREATE POLICY "update_own_staff" ON staff
  FOR UPDATE TO authenticated
  USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));

CREATE POLICY "delete_own_staff" ON staff
  FOR DELETE TO authenticated
  USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_staff_restaurant ON staff(restaurant_id);
