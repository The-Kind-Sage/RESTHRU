-- Backfill legacy STAFF role to RESTAURANT_OWNER
-- Run after deploying the code change so new registrations write the new value.
UPDATE users SET role = 'RESTAURANT_OWNER' WHERE role = 'STAFF';
