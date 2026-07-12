-- CreateTable
CREATE TABLE "floors" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "floors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "floors_restaurant_id_name_key" ON "floors"("restaurant_id", "name");

-- AddForeignKey
ALTER TABLE "floors" ADD CONSTRAINT "floors_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: new default for future rows (existing rows are rewritten below)
ALTER TABLE "tables" ALTER COLUMN "floor" SET DEFAULT 'Floor 1';

-- Data migration: rename the old generic floor labels to the new "Floor N" scheme.
-- Any restaurant that had already renamed a floor to something custom keeps its
-- custom name untouched — only the three shipped defaults are remapped.
UPDATE "tables" SET "floor" = 'Floor 1' WHERE "floor" = 'Ground Floor';
UPDATE "tables" SET "floor" = 'Floor 2' WHERE "floor" = 'First Floor';
UPDATE "tables" SET "floor" = 'Floor 3' WHERE "floor" = 'Terrace';

-- Backfill: one Floor row per distinct floor name already in use by a
-- restaurant's tables, ordered by first appearance so existing tab order is preserved.
WITH floor_usage AS (
  SELECT t."restaurant_id" AS restaurant_id, t."floor" AS name, MIN(t."created_at") AS first_seen
  FROM "tables" t
  GROUP BY t."restaurant_id", t."floor"
),
floor_ranked AS (
  SELECT restaurant_id, name, row_number() OVER (PARTITION BY restaurant_id ORDER BY first_seen) - 1 AS ord
  FROM floor_usage
)
INSERT INTO "floors" ("id", "restaurant_id", "name", "display_order", "created_at", "updated_at")
SELECT
  'fl_' || substr(md5(random()::text || clock_timestamp()::text || restaurant_id || name), 1, 20),
  restaurant_id, name, ord, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM floor_ranked
ON CONFLICT ("restaurant_id", "name") DO NOTHING;

-- Backfill: restaurants with no tables yet (so no floor usage detected above)
-- still get the standard three default floors, ready to use immediately.
INSERT INTO "floors" ("id", "restaurant_id", "name", "display_order", "created_at", "updated_at")
SELECT
  'fl_' || substr(md5(random()::text || clock_timestamp()::text || r."id" || d.name), 1, 20),
  r."id", d.name, d.ord, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "restaurants" r
CROSS JOIN (VALUES ('Floor 1', 0), ('Floor 2', 1), ('Floor 3', 2)) AS d(name, ord)
WHERE NOT EXISTS (SELECT 1 FROM "floors" f WHERE f."restaurant_id" = r."id")
ON CONFLICT ("restaurant_id", "name") DO NOTHING;
