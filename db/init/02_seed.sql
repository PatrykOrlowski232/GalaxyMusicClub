-- Wygenerowane przez scripts/dump-schema.ts — słowniki wymagane przez aplikację.
SET NAMES utf8mb4;

INSERT IGNORE INTO `account_types` (`id`, `name`) VALUES
  (1, 'Admin'),
  (2, 'Owner'),
  (3, 'Promotor'),
  (4, 'Customer'),
  (5, 'Barman'),
  (6, 'Manager');

INSERT IGNORE INTO `order_statuses` (`id`, `name`) VALUES
  (1, 'Created'),
  (2, 'AwaitingPayment'),
  (3, 'Paid'),
  (4, 'Cancelled'),
  (5, 'Refunded');

INSERT IGNORE INTO `payment_statuses` (`id`, `name`) VALUES
  (1, 'Pending'),
  (2, 'Paid'),
  (3, 'Failed'),
  (4, 'Refunded');

INSERT IGNORE INTO `reservation_statuses` (`id`, `name`) VALUES
  (1, 'Pending'),
  (2, 'Confirmed'),
  (3, 'Cancelled'),
  (4, 'Completed');

INSERT IGNORE INTO `ticket_types` (`id`, `name`, `description`) VALUES
  (1, 'Standard', 'Wejście standardowe'),
  (2, 'Early Bird', 'Wejście early bird'),
  (3, 'VIP', 'Wejście VIP'),
  (4, 'Guestlist', 'Guestlist');

INSERT IGNORE INTO `transaction_states` (`id`, `name`) VALUES
  (1, 'Pending'),
  (2, 'Completed'),
  (3, 'Failed'),
  (4, 'Cancelled');

INSERT IGNORE INTO `transaction_types` (`id`, `name`) VALUES
  (1, 'TicketSale'),
  (2, 'PromotorCommission'),
  (3, 'PromotorPayout'),
  (4, 'Refund'),
  (5, 'Adjustment'),
  (6, 'LoungeDeposit');
