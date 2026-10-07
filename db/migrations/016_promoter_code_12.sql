-- Kod promotora: 12 losowych znaków w promotor_wallets.account_number
-- (unikalny indeks uq_promotor_wallets_account już istnieje)
-- Backfill: npm run promoters:backfill-codes
USE galaxy;

-- Brak zmian DDL — pole account_number już przechowuje kod sprzedażowy.
SELECT 1;
