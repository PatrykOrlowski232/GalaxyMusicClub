-- Galaxy DB — zdjęcie artysty (DJ)
USE galaxy;

ALTER TABLE artists
  ADD COLUMN photo_url VARCHAR(500) NULL AFTER info;
