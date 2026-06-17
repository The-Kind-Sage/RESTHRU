-- Add all columns that were missing from the live database
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'restaurant';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS pan_number TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurants_slug ON restaurants(slug);

-- Index on owner_id for RLS performance
CREATE INDEX IF NOT EXISTS idx_restaurants_owner ON restaurants(owner_id);

-- RLS policies for owner access (skip if already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'restaurants' AND policyname = 'select_own_restaurants'
  ) THEN
    CREATE POLICY "select_own_restaurants" ON restaurants FOR SELECT TO authenticated USING (auth.uid() = owner_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'restaurants' AND policyname = 'insert_own_restaurants'
  ) THEN
    CREATE POLICY "insert_own_restaurants" ON restaurants FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'restaurants' AND policyname = 'update_own_restaurants'
  ) THEN
    CREATE POLICY "update_own_restaurants" ON restaurants FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
  END IF;
END
$$;
