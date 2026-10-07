-- Dzienne zrzuty ruchu (koniec dnia)
USE galaxy;

CREATE TABLE IF NOT EXISTS traffic_daily_snapshots (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  day DATE NOT NULL,
  views INT UNSIGNED NOT NULL DEFAULT 0,
  uniques INT UNSIGNED NOT NULL DEFAULT 0,
  top_paths JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_traffic_daily_day (day),
  KEY idx_traffic_daily_day (day)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
