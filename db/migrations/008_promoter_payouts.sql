-- Galaxy DB — wnioski o wypłatę z portfela promotora
USE galaxy;

ALTER TABLE promotor_wallets
  ADD COLUMN bank_account VARCHAR(34) NULL AFTER account_number,
  ADD COLUMN bank_account_holder VARCHAR(150) NULL AFTER bank_account;

CREATE TABLE IF NOT EXISTS promotor_payout_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  wallet_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  bank_account VARCHAR(34) NOT NULL,
  bank_account_holder VARCHAR(150) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_ppr_wallet (wallet_id),
  KEY idx_ppr_status (status),
  CONSTRAINT fk_ppr_wallet FOREIGN KEY (wallet_id) REFERENCES promotor_wallets (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
