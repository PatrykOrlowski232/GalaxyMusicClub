-- Galaxy DB — zdjęcia w tabeli (BLOB)
USE galaxy;

CREATE TABLE IF NOT EXISTS media_files (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  mime_type VARCHAR(100) NOT NULL,
  original_name VARCHAR(255) NULL,
  byte_size INT UNSIGNED NOT NULL,
  data LONGBLOB NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE artists
  ADD COLUMN photo_media_id BIGINT UNSIGNED NULL AFTER photo_url;

ALTER TABLE events
  ADD COLUMN graphic_media_id BIGINT UNSIGNED NULL AFTER graphic_url;

ALTER TABLE artists
  ADD CONSTRAINT fk_artists_photo_media
  FOREIGN KEY (photo_media_id) REFERENCES media_files(id)
  ON DELETE SET NULL;

ALTER TABLE events
  ADD CONSTRAINT fk_events_graphic_media
  FOREIGN KEY (graphic_media_id) REFERENCES media_files(id)
  ON DELETE SET NULL;
