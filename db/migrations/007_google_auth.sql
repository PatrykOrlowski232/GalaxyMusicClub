-- Galaxy DB — logowanie Google
USE galaxy;

ALTER TABLE users
  MODIFY COLUMN password VARCHAR(255) NULL,
  ADD COLUMN google_id VARCHAR(64) NULL AFTER email,
  ADD UNIQUE KEY uq_users_google_id (google_id);
