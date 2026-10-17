-- This is an empty migration.
UPDATE "member" SET "role" = 'admin' WHERE "role" = 'owner';
