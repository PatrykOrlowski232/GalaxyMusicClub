-- Galaxy DB — podsumowania sprzedaży eventu (raporty PDF)
USE galaxy;

CREATE TABLE IF NOT EXISTS event_summaries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id BIGINT UNSIGNED NOT NULL,
  generated_by BIGINT UNSIGNED NULL,
  generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tickets_count INT UNSIGNED NOT NULL DEFAULT 0,
  tickets_gross DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  promoter_tickets_count INT UNSIGNED NOT NULL DEFAULT 0,
  promoter_tickets_gross DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  promoter_commission_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.1000,
  promoter_commission_total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  lounge_reservations_count INT UNSIGNED NOT NULL DEFAULT 0,
  lounge_deposits_total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  lounge_full_price_total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  online_sales_total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  net_after_commission DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  summary_json JSON NULL,
  pdf_base64 MEDIUMTEXT NOT NULL,
  pdf_filename VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_event_summaries_event (event_id),
  KEY idx_event_summaries_generated (generated_at),
  CONSTRAINT fk_event_summaries_event FOREIGN KEY (event_id) REFERENCES events (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_event_summaries_user FOREIGN KEY (generated_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
