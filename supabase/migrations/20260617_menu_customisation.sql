-- Add sub_type column to menu_items for chicken/buff/pork/mutton/veg differentiation
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS sub_type TEXT DEFAULT 'veg';

-- Add menu customisation columns to restaurants
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS menu_bg_url    TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS menu_custom_url TEXT;  -- custom image/pdf uploaded by owner
