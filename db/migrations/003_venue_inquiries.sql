-- Galaxy DB — zapytania o wynajem sali / imprezy specjalne
USE galaxy;

CREATE TABLE IF NOT EXISTS venue_inquiries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NULL,
  event_type VARCHAR(100) NOT NULL,
  event_date DATETIME NULL,
  guests INT UNSIGNED NULL,
  message TEXT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'New',
  user_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_venue_inquiries_created (created_at),
  KEY idx_venue_inquiries_status (status),
  CONSTRAINT fk_venue_inquiries_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
