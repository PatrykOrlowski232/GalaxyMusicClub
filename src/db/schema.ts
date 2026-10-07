import {
  boolean,
  date,
  datetime,
  decimal,
  index,
  int,
  json,
  mysqlTable,
  primaryKey,
  smallint,
  text,
  tinyint,
  uniqueIndex,
  varchar,
  bigint,
  customType,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

const longblob = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "longblob";
  },
});

export const mediaFiles = mysqlTable(
  "media_files",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    originalName: varchar("original_name", { length: 255 }),
    byteSize: int("byte_size", { unsigned: true }).notNull(),
    data: longblob("data").notNull(),
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [primaryKey({ columns: [t.id] })],
);

export const accountTypes = mysqlTable(
  "account_types",
  {
    id: tinyint("id", { unsigned: true }).autoincrement().notNull(),
    name: varchar("name", { length: 30 }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.id] }), uniqueIndex("uq_account_types_name").on(t.name)],
);

export const users = mysqlTable(
  "users",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    googleId: varchar("google_id", { length: 64 }),
    password: varchar("password", { length: 255 }),
    isNewsletterMember: boolean("is_newsletter_member").notNull().default(false),
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    primaryKey({ columns: [t.id] }),
    uniqueIndex("uq_users_email").on(t.email),
    uniqueIndex("uq_users_google_id").on(t.googleId),
  ],
);

export const userAccountTypes = mysqlTable(
  "user_account_types",
  {
    userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
    accountTypeId: tinyint("account_type_id", { unsigned: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.accountTypeId] })],
);

export const events = mysqlTable(
  "events",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().notNull(),
    title: varchar("title", { length: 200 }),
    startsAt: datetime("starts_at").notNull(),
    endsAt: datetime("ends_at"),
    graphicUrl: varchar("graphic_url", { length: 500 }),
    graphicMediaId: bigint("graphic_media_id", { mode: "number", unsigned: true }),
    description: text("description"),
    ticketUrl: varchar("ticket_url", { length: 500 }),
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [primaryKey({ columns: [t.id] }), index("idx_events_starts_at").on(t.startsAt)],
);

export const ticketTypes = mysqlTable(
  "ticket_types",
  {
    id: tinyint("id", { unsigned: true }).autoincrement().notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    description: varchar("description", { length: 255 }),
  },
  (t) => [primaryKey({ columns: [t.id] }), uniqueIndex("uq_ticket_types_name").on(t.name)],
);

export const eventTicketLevels = mysqlTable(
  "event_ticket_levels",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().notNull(),
    eventId: bigint("event_id", { mode: "number", unsigned: true }).notNull(),
    ticketTypeId: tinyint("ticket_type_id", { unsigned: true }).notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    quantity: int("quantity", { unsigned: true }),
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    primaryKey({ columns: [t.id] }),
    index("idx_etl_event_id").on(t.eventId),
    index("idx_etl_ticket_type_id").on(t.ticketTypeId),
  ],
);

export const tickets = mysqlTable(
  "tickets",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().notNull(),
    eventId: bigint("event_id", { mode: "number", unsigned: true }).notNull(),
    ticketLevelId: bigint("ticket_level_id", { mode: "number", unsigned: true }).notNull(),
    ownerId: bigint("owner_id", { mode: "number", unsigned: true }).notNull(),
    number: varchar("number", { length: 50 }).notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    promotorId: bigint("promotor_id", { mode: "number", unsigned: true }),
    isRealized: boolean("is_realized").notNull().default(false),
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    realizedAt: datetime("realized_at"),
    cancelledAt: datetime("cancelled_at"),
  },
  (t) => [
    primaryKey({ columns: [t.id] }),
    uniqueIndex("uq_tickets_number").on(t.number),
    index("idx_tickets_event_id").on(t.eventId),
    index("idx_tickets_owner_id").on(t.ownerId),
    index("idx_tickets_promotor_id").on(t.promotorId),
  ],
);

export const levels = mysqlTable(
  "levels",
  {
    id: tinyint("id", { unsigned: true }).autoincrement().notNull(),
    name: varchar("name", { length: 50 }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.id] }), uniqueIndex("uq_levels_name").on(t.name)],
);

export const lounges = mysqlTable(
  "lounges",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().notNull(),
    levelId: tinyint("level_id", { unsigned: true }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull().default("1000.00"),
  },
  (t) => [primaryKey({ columns: [t.id] }), index("idx_lounges_level_id").on(t.levelId)],
);

export const reservationStatuses = mysqlTable(
  "reservation_statuses",
  {
    id: tinyint("id", { unsigned: true }).autoincrement().notNull(),
    name: varchar("name", { length: 50 }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.id] }),
    uniqueIndex("uq_reservation_statuses_name").on(t.name),
  ],
);

export const loungeReservations = mysqlTable(
  "lounge_reservations",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().notNull(),
    loungeId: bigint("lounge_id", { mode: "number", unsigned: true }).notNull(),
    eventId: bigint("event_id", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
    statusId: tinyint("status_id", { unsigned: true }).notNull(),
    fullPrice: decimal("full_price", { precision: 10, scale: 2 }),
    depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }),
    depositPaidAt: datetime("deposit_paid_at"),
    stripeSessionId: varchar("stripe_session_id", { length: 255 }),
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    primaryKey({ columns: [t.id] }),
    uniqueIndex("uq_lounge_reservations_lounge_event").on(t.loungeId, t.eventId),
    index("idx_lr_event_id").on(t.eventId),
    index("idx_lr_user_id").on(t.userId),
  ],
);

export const parties = mysqlTable(
  "parties",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().notNull(),
    levelId: tinyint("level_id", { unsigned: true }).notNull(),
    eventId: bigint("event_id", { mode: "number", unsigned: true }).notNull(),
    lineup: text("lineup"),
    musicType: varchar("music_type", { length: 100 }),
  },
  (t) => [
    primaryKey({ columns: [t.id] }),
    index("idx_parties_event_id").on(t.eventId),
    index("idx_parties_level_id").on(t.levelId),
  ],
);

export const products = mysqlTable(
  "products",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    category: varchar("category", { length: 100 }),
    barcode: varchar("barcode", { length: 100 }),
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [primaryKey({ columns: [t.id] }), uniqueIndex("uq_products_barcode").on(t.barcode)],
);

export const productInventory = mysqlTable(
  "product_inventory",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().notNull(),
    productId: bigint("product_id", { mode: "number", unsigned: true }).notNull(),
    quantity: int("quantity", { unsigned: true }).notNull(),
    alarmQuantity: int("alarm_quantity", { unsigned: true }).notNull(),
    dateOfCheck: datetime("date_of_check").notNull(),
    employeeId: bigint("employee_id", { mode: "number", unsigned: true }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.id] }),
    uniqueIndex("uq_product_inventory_product").on(t.productId),
  ],
);

export const inventoryMovements = mysqlTable(
  "inventory_movements",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().notNull(),
    productId: bigint("product_id", { mode: "number", unsigned: true }).notNull(),
    employeeId: bigint("employee_id", { mode: "number", unsigned: true }).notNull(),
    quantity: int("quantity").notNull(),
    quantityAfter: int("quantity_after", { unsigned: true }).notNull(),
    movementType: varchar("movement_type", { length: 30 }).notNull(),
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [primaryKey({ columns: [t.id] }), index("idx_im_product_id").on(t.productId)],
);

export const transactionTypes = mysqlTable(
  "transaction_types",
  {
    id: tinyint("id", { unsigned: true }).autoincrement().notNull(),
    name: varchar("name", { length: 50 }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.id] }), uniqueIndex("uq_transaction_types_name").on(t.name)],
);

export const transactionStates = mysqlTable(
  "transaction_states",
  {
    id: tinyint("id", { unsigned: true }).autoincrement().notNull(),
    name: varchar("name", { length: 50 }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.id] }), uniqueIndex("uq_transaction_states_name").on(t.name)],
);

export const orderStatuses = mysqlTable(
  "order_statuses",
  {
    id: tinyint("id", { unsigned: true }).autoincrement().notNull(),
    name: varchar("name", { length: 50 }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.id] }), uniqueIndex("uq_order_statuses_name").on(t.name)],
);

export const paymentStatuses = mysqlTable(
  "payment_statuses",
  {
    id: tinyint("id", { unsigned: true }).autoincrement().notNull(),
    name: varchar("name", { length: 50 }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.id] }), uniqueIndex("uq_payment_statuses_name").on(t.name)],
);

export const promotorWallets = mysqlTable(
  "promotor_wallets",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().notNull(),
    userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
    accountNumber: varchar("account_number", { length: 34 }), // kod promotora (12 znaków)
    bankAccount: varchar("bank_account", { length: 34 }),
    bankAccountHolder: varchar("bank_account_holder", { length: 150 }),
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    primaryKey({ columns: [t.id] }),
    uniqueIndex("uq_promotor_wallets_user").on(t.userId),
    uniqueIndex("uq_promotor_wallets_account").on(t.accountNumber),
  ],
);

export const promotorPayoutRequests = mysqlTable(
  "promotor_payout_requests",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().notNull(),
    walletId: bigint("wallet_id", { mode: "number", unsigned: true }).notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    bankAccount: varchar("bank_account", { length: 34 }).notNull(),
    bankAccountHolder: varchar("bank_account_holder", { length: 150 }),
    status: varchar("status", { length: 30 }).notNull().default("Pending"),
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    processedAt: datetime("processed_at"),
  },
  (t) => [
    primaryKey({ columns: [t.id] }),
    index("idx_ppr_wallet").on(t.walletId),
    index("idx_ppr_status").on(t.status),
  ],
);

export const promotorWalletTransactions = mysqlTable(
  "promotor_wallet_transactions",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().notNull(),
    walletId: bigint("wallet_id", { mode: "number", unsigned: true }).notNull(),
    value: decimal("value", { precision: 12, scale: 2 }).notNull(),
    transactionTypeId: tinyint("transaction_type_id", { unsigned: true }).notNull(),
    description: varchar("description", { length: 255 }),
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [primaryKey({ columns: [t.id] }), index("idx_pwt_wallet_id").on(t.walletId)],
);

export const transactions = mysqlTable(
  "transactions",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().notNull(),
    userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
    value: decimal("value", { precision: 12, scale: 2 }).notNull(),
    dateOf: datetime("date_of").notNull(),
    transactionTypeId: tinyint("transaction_type_id", { unsigned: true }).notNull(),
    stateId: tinyint("state_id", { unsigned: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.id] }), index("idx_transactions_user_id").on(t.userId)],
);

export const orders = mysqlTable(
  "orders",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().notNull(),
    userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
    eventId: bigint("event_id", { mode: "number", unsigned: true }),
    value: decimal("value", { precision: 12, scale: 2 }).notNull(),
    statusId: tinyint("status_id", { unsigned: true }).notNull(),
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    primaryKey({ columns: [t.id] }),
    index("idx_orders_user_id").on(t.userId),
    index("idx_orders_event_id").on(t.eventId),
  ],
);

export const orderItems = mysqlTable(
  "order_items",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().notNull(),
    orderId: bigint("order_id", { mode: "number", unsigned: true }).notNull(),
    eventTicketLevelId: bigint("event_ticket_level_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    quantity: int("quantity", { unsigned: true }).notNull(),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.id] }), index("idx_order_items_order_id").on(t.orderId)],
);

export const payments = mysqlTable(
  "payments",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().notNull(),
    orderId: bigint("order_id", { mode: "number", unsigned: true }).notNull(),
    value: decimal("value", { precision: 12, scale: 2 }).notNull(),
    provider: varchar("provider", { length: 50 }).notNull(),
    providerPaymentId: varchar("provider_payment_id", { length: 255 }),
    statusId: tinyint("status_id", { unsigned: true }).notNull(),
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    paidAt: datetime("paid_at"),
  },
  (t) => [
    primaryKey({ columns: [t.id] }),
    uniqueIndex("uq_payments_provider_payment_id").on(t.providerPaymentId),
    index("idx_payments_order_id").on(t.orderId),
  ],
);

export const artists = mysqlTable(
  "artists",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    info: text("info"),
    photoUrl: varchar("photo_url", { length: 500 }),
    photoMediaId: bigint("photo_media_id", { mode: "number", unsigned: true }),
    description: text("description"),
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [primaryKey({ columns: [t.id] }), index("idx_artists_name").on(t.name)],
);

export const partyLineup = mysqlTable(
  "party_lineup",
  {
    partyId: bigint("party_id", { mode: "number", unsigned: true }).notNull(),
    artistId: bigint("artist_id", { mode: "number", unsigned: true }).notNull(),
    position: smallint("position", { unsigned: true }),
  },
  (t) => [primaryKey({ columns: [t.partyId, t.artistId] })],
);

export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().notNull(),
    userId: bigint("user_id", { mode: "number", unsigned: true }),
    action: varchar("action", { length: 50 }).notNull(),
    entityType: varchar("entity_type", { length: 100 }).notNull(),
    entityId: bigint("entity_id", { mode: "number", unsigned: true }),
    oldValue: json("old_value"),
    newValue: json("new_value"),
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    primaryKey({ columns: [t.id] }),
    index("idx_audit_logs_entity").on(t.entityType, t.entityId),
    index("idx_audit_logs_user_id").on(t.userId),
  ],
);

export const venueInquiries = mysqlTable(
  "venue_inquiries",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    eventDate: datetime("event_date"),
    guests: int("guests", { unsigned: true }),
    message: text("message"),
    status: varchar("status", { length: 30 }).notNull().default("New"),
    userId: bigint("user_id", { mode: "number", unsigned: true }),
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    primaryKey({ columns: [t.id] }),
    index("idx_venue_inquiries_created").on(t.createdAt),
    index("idx_venue_inquiries_status").on(t.status),
  ],
);

export const eventSummaries = mysqlTable(
  "event_summaries",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().notNull(),
    eventId: bigint("event_id", { mode: "number", unsigned: true }).notNull(),
    generatedBy: bigint("generated_by", { mode: "number", unsigned: true }),
    generatedAt: datetime("generated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    ticketsCount: int("tickets_count", { unsigned: true }).notNull().default(0),
    ticketsGross: decimal("tickets_gross", { precision: 12, scale: 2 }).notNull().default("0.00"),
    promoterTicketsCount: int("promoter_tickets_count", { unsigned: true }).notNull().default(0),
    promoterTicketsGross: decimal("promoter_tickets_gross", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0.00"),
    promoterCommissionRate: decimal("promoter_commission_rate", {
      precision: 5,
      scale: 4,
    })
      .notNull()
      .default("0.1000"),
    promoterCommissionTotal: decimal("promoter_commission_total", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0.00"),
    loungeReservationsCount: int("lounge_reservations_count", { unsigned: true })
      .notNull()
      .default(0),
    loungeDepositsTotal: decimal("lounge_deposits_total", { precision: 12, scale: 2 })
      .notNull()
      .default("0.00"),
    loungeFullPriceTotal: decimal("lounge_full_price_total", { precision: 12, scale: 2 })
      .notNull()
      .default("0.00"),
    onlineSalesTotal: decimal("online_sales_total", { precision: 12, scale: 2 })
      .notNull()
      .default("0.00"),
    netAfterCommission: decimal("net_after_commission", { precision: 12, scale: 2 })
      .notNull()
      .default("0.00"),
    summaryJson: json("summary_json"),
    pdfBase64: text("pdf_base64").notNull(),
    pdfFilename: varchar("pdf_filename", { length: 255 }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.id] }),
    index("idx_event_summaries_event").on(t.eventId),
    index("idx_event_summaries_generated").on(t.generatedAt),
  ],
);

export const newsPosts = mysqlTable(
  "news_posts",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body").notNull(),
    category: varchar("category", { length: 30 }).notNull().default("general"),
    isPublished: boolean("is_published").notNull().default(true),
    authorId: bigint("author_id", { mode: "number", unsigned: true }),
    publishedAt: datetime("published_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
  },
  (t) => [
    primaryKey({ columns: [t.id] }),
    index("idx_news_posts_published").on(t.isPublished, t.publishedAt),
    index("idx_news_posts_category").on(t.category),
  ],
);

export const newsletterSends = mysqlTable(
  "newsletter_sends",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().notNull(),
    newsPostId: bigint("news_post_id", { mode: "number", unsigned: true }),
    subject: varchar("subject", { length: 255 }).notNull(),
    recipientCount: int("recipient_count", { unsigned: true }).notNull().default(0),
    sentBy: bigint("sent_by", { mode: "number", unsigned: true }),
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    primaryKey({ columns: [t.id] }),
    index("idx_newsletter_sends_post").on(t.newsPostId),
  ],
);

export const pageViews = mysqlTable(
  "page_views",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().notNull(),
    path: varchar("path", { length: 500 }).notNull(),
    referrer: varchar("referrer", { length: 500 }),
    visitorKey: varchar("visitor_key", { length: 64 }),
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    primaryKey({ columns: [t.id] }),
    index("idx_page_views_created_at").on(t.createdAt),
    index("idx_page_views_path").on(t.path),
    index("idx_page_views_visitor").on(t.visitorKey, t.createdAt),
  ],
);

export const trafficDailySnapshots = mysqlTable(
  "traffic_daily_snapshots",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().notNull(),
    day: date("day").notNull(),
    views: int("views", { unsigned: true }).notNull().default(0),
    uniques: int("uniques", { unsigned: true }).notNull().default(0),
    topPaths: json("top_paths").$type<Array<{ path: string; views: number }>>(),
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    primaryKey({ columns: [t.id] }),
    uniqueIndex("uq_traffic_daily_day").on(t.day),
    index("idx_traffic_daily_day").on(t.day),
  ],
);
