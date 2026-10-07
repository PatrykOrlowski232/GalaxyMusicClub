-- Galaxy DB — cena loży + zaliczka przy rezerwacji
USE galaxy;

ALTER TABLE lounges
  ADD COLUMN price DECIMAL(10, 2) NOT NULL DEFAULT 1000.00 AFTER name;

UPDATE lounges SET price = CASE id
  WHEN 1 THEN 800.00
  WHEN 2 THEN 1200.00
  WHEN 3 THEN 2000.00
  ELSE 1000.00
END;

ALTER TABLE lounge_reservations
  ADD COLUMN full_price DECIMAL(10, 2) NULL AFTER status_id,
  ADD COLUMN deposit_amount DECIMAL(10, 2) NULL AFTER full_price,
  ADD COLUMN deposit_paid_at DATETIME NULL AFTER deposit_amount,
  ADD COLUMN stripe_session_id VARCHAR(255) NULL AFTER deposit_paid_at;

INSERT INTO transaction_types (name)
SELECT 'LoungeDeposit'
WHERE NOT EXISTS (
  SELECT 1 FROM transaction_types WHERE name = 'LoungeDeposit'
);
