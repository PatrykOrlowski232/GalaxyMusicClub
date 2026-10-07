-- Galaxy DB — info o artyście
USE galaxy;

ALTER TABLE artists
  ADD COLUMN info TEXT NULL AFTER name;

UPDATE artists SET info = description WHERE info IS NULL AND description IS NOT NULL;

-- Seed bio: node scripts/seed-artist-info.mjs
