-- Galaxy DB — aktualności / posty + logi newslettera
USE galaxy;

CREATE TABLE IF NOT EXISTS news_posts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(30) NOT NULL DEFAULT 'general',
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  author_id BIGINT UNSIGNED NULL,
  published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_news_posts_published (is_published, published_at),
  KEY idx_news_posts_category (category),
  CONSTRAINT fk_news_posts_author FOREIGN KEY (author_id) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS newsletter_sends (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  news_post_id BIGINT UNSIGNED NULL,
  subject VARCHAR(255) NOT NULL,
  recipient_count INT UNSIGNED NOT NULL DEFAULT 0,
  sent_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_newsletter_sends_post (news_post_id),
  CONSTRAINT fk_newsletter_sends_post FOREIGN KEY (news_post_id) REFERENCES news_posts (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_newsletter_sends_user FOREIGN KEY (sent_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO news_posts (title, body, category, is_published, published_at) VALUES
(
  'Nadchodzące noce w Galaxy',
  'Sprawdź kalendarz eventów — bilety online i rezerwacje lóż już dostępne na stronie. Śledź lineup i kup wcześniej.',
  'event',
  TRUE,
  NOW()
),
(
  'Nowe promocje klubowe',
  'Early Bird, urodziny w Galaxy i Student Thursday — szczegóły w zakładce Promocje. Newsletter to najszybszy sposób, by nie przegapić ofert.',
  'promo',
  TRUE,
  NOW()
);
