-- Statystyka ruchu na stronie
USE galaxy;

CREATE TABLE IF NOT EXISTS page_views (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  path VARCHAR(500) NOT NULL,
  referrer VARCHAR(500) NULL,
  visitor_key VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_page_views_created_at (created_at),
  KEY idx_page_views_path (path(191)),
  KEY idx_page_views_visitor (visitor_key, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
