import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  pgTableCreator,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Table creator – prefix matches drizzle.config.ts tablesFilter "mlm_*"
// ---------------------------------------------------------------------------
export const createTable = pgTableCreator((name) => `mlm_${name}`);

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const memberRoleEnum = pgEnum("member_role", [
  "member",
  "stokis",
  "bendahara",
  "direktur",
  "admin",
]);

export const rankEnum = pgEnum("rank", [
  "none",
  "sapphire",
  "emerald",
  "bronze",
  "silver",
  "gold",
  "diamond",
  "crown",
]);

export const treePositionEnum = pgEnum("tree_position", ["left", "right"]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "pin_purchase",
  "product_purchase",
  "bonus_credit",
  "withdrawal",
  "transfer",
  "pv_stock",
  "coin_purchase",
  "registration",
  "repurchase",
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "approved",
  "rejected",
  "completed",
]);

export const bonusTypeEnum = pgEnum("bonus_type", [
  "sponsor",
  "pairing",
  "matching",
  "shu",
  "personal_shopping",
  "seracoin",
  "titik",
  "reward",
  "komunitas",
  "auto_system",
]);

export const withdrawalStatusEnum = pgEnum("withdrawal_status", [
  "pending",
  "bendahara_approved",
  "direktur_approved",
  "processing",
  "completed",
  "rejected",
]);

export const pinStatusEnum = pgEnum("pin_status", [
  "available",
  "used",
  "expired",
]);

export const coinTxTypeEnum = pgEnum("coin_tx_type", [
  "earned",
  "purchased",
  "sold",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "withdrawal_request",
  "withdrawal_approved",
  "withdrawal_rejected",
  "withdrawal_completed",
  "bonus_received",
  "rank_up",
  "system",
  "referral_joined",
]);

export const periodTypeEnum = pgEnum("period_type", ["daily", "biweekly"]);

export const productApprovalEnum = pgEnum("product_approval", [
  "pending",
  "approved",
  "rejected",
]);

export const pvPurchaseStatusEnum = pgEnum("pv_purchase_status", [
  "pending",
  "confirmed",
  "rejected",
]);

export const pvPaymentMethodEnum = pgEnum("pv_payment_method", [
  "wallet",
  "manual_transfer",
]);

// ---------------------------------------------------------------------------
// Better Auth tables (managed by Better Auth – do NOT add mlm_ prefix)
// ---------------------------------------------------------------------------
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
  // --- Admin plugin fields ---
  role: text("role").default("user"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // --- Admin plugin fields ---
  impersonatedBy: text("impersonated_by"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

// ---------------------------------------------------------------------------
// MLM Member Profiles
// ---------------------------------------------------------------------------
export const memberProfiles = createTable(
  "member_profiles",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d
      .text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    referralCode: d.varchar("referral_code", { length: 50 }).notNull().unique(),
    sponsorId: d.integer("sponsor_id"), // self-ref to memberProfiles.id
    role: memberRoleEnum().notNull().default("member"),
    personalPV: d
      .numeric("personal_pv", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    accumulatedPV: d
      .numeric("accumulated_pv", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    rank: rankEnum().notNull().default("none"),
    isActive: d.boolean("is_active").notNull().default(true),
    isWarung: d.boolean("is_warung").notNull().default(false),
    warungName: d.varchar("warung_name", { length: 255 }),
    warungPhoto: d.text("warung_photo"),
    warungLat: d.numeric("warung_lat", { precision: 10, scale: 7 }),
    warungLng: d.numeric("warung_lng", { precision: 10, scale: 7 }),
    weeklyRepurchasePV: d
      .numeric("weekly_repurchase_pv", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    lastRepurchaseAt: d.timestamp("last_repurchase_at", { withTimezone: true }),
    joinPackage: d.integer("join_package").default(1), // number of PINs on join
    pinCount: d.integer("pin_count").notNull().default(0),
    bankName: d.varchar("bank_name", { length: 100 }),
    bankAccountNumber: d.varchar("bank_account_number", { length: 50 }),
    bankAccountHolder: d.varchar("bank_account_holder", { length: 255 }),
    phone: d.varchar({ length: 20 }),
    address: d.text(),
    planBActive: d.boolean("plan_b_active").notNull().default(false),
    planCActive: d.boolean("plan_c_active").notNull().default(false),
    planDActive: d.boolean("plan_d_active").notNull().default(false),
    createdAt: d
      .timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d
      .timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date()),
  }),
  (t) => [
    index("member_profiles_user_id_idx").on(t.userId),
    index("member_profiles_sponsor_idx").on(t.sponsorId),
    uniqueIndex("member_profiles_referral_code_idx").on(t.referralCode),
    index("member_profiles_role_idx").on(t.role),
    index("member_profiles_rank_idx").on(t.rank),
  ],
);

// ---------------------------------------------------------------------------
// Binary Tree
// ---------------------------------------------------------------------------
export const binaryTree = createTable(
  "binary_tree",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    memberId: d
      .integer("member_id")
      .notNull()
      .unique()
      .references(() => memberProfiles.id, { onDelete: "cascade" }),
    parentId: d.integer("parent_id"), // self-ref to binaryTree.id, null = root
    position: treePositionEnum(), // null for root
    leftChildId: d.integer("left_child_id"), // self-ref
    rightChildId: d.integer("right_child_id"), // self-ref
    leftGroupPV: d
      .numeric("left_group_pv", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    rightGroupPV: d
      .numeric("right_group_pv", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    leftGroupHU: d.integer("left_group_hu").notNull().default(0),
    rightGroupHU: d.integer("right_group_hu").notNull().default(0),
    depth: d.integer().notNull().default(0),
    createdAt: d
      .timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("binary_tree_member_idx").on(t.memberId),
    index("binary_tree_parent_idx").on(t.parentId),
    index("binary_tree_depth_idx").on(t.depth),
  ],
);

// ---------------------------------------------------------------------------
// Wallets
// ---------------------------------------------------------------------------
export const wallets = createTable(
  "wallets",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    memberId: d
      .integer("member_id")
      .notNull()
      .unique()
      .references(() => memberProfiles.id, { onDelete: "cascade" }),
    mainBalance: d
      .numeric("main_balance", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    coinBalance: d
      .numeric("coin_balance", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    frozenBalance: d
      .numeric("frozen_balance", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    totalWithdrawn: d
      .numeric("total_withdrawn", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    pvStockBalance: d
      .numeric("pv_stock_balance", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    updatedAt: d
      .timestamp("updated_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("wallets_member_idx").on(t.memberId)],
);

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------
export const transactions = createTable(
  "transactions",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    memberId: d
      .integer("member_id")
      .notNull()
      .references(() => memberProfiles.id),
    type: transactionTypeEnum().notNull(),
    amount: d.numeric({ precision: 14, scale: 2 }).notNull(),
    pvAmount: d
      .numeric("pv_amount", { precision: 12, scale: 2 })
      .default("0"),
    description: d.text(),
    status: transactionStatusEnum().notNull().default("pending"),
    referenceId: d.varchar("reference_id", { length: 255 }),
    createdAt: d
      .timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("transactions_member_idx").on(t.memberId),
    index("transactions_type_idx").on(t.type),
    index("transactions_status_idx").on(t.status),
    index("transactions_created_at_idx").on(t.createdAt),
  ],
);

// ---------------------------------------------------------------------------
// Bonuses
// ---------------------------------------------------------------------------
export const bonuses = createTable(
  "bonuses",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    memberId: d
      .integer("member_id")
      .notNull()
      .references(() => memberProfiles.id),
    type: bonusTypeEnum().notNull(),
    amount: d.numeric({ precision: 14, scale: 2 }).notNull(),
    pvBasis: d
      .numeric("pv_basis", { precision: 14, scale: 2 })
      .default("0"),
    sourceMemberId: d.integer("source_member_id"), // who triggered this bonus
    periodStart: d.timestamp("period_start", { withTimezone: true }),
    periodEnd: d.timestamp("period_end", { withTimezone: true }),
    status: transactionStatusEnum().notNull().default("completed"),
    createdAt: d
      .timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("bonuses_member_idx").on(t.memberId),
    index("bonuses_type_idx").on(t.type),
    index("bonuses_created_at_idx").on(t.createdAt),
  ],
);

// ---------------------------------------------------------------------------
// National Turnover
// ---------------------------------------------------------------------------
export const nationalTurnover = createTable(
  "national_turnover",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    date: d.timestamp({ withTimezone: true }).notNull(),
    totalPV: d
      .numeric("total_pv", { precision: 16, scale: 2 })
      .notNull()
      .default("0"),
    totalRupiah: d
      .numeric("total_rupiah", { precision: 16, scale: 2 })
      .notNull()
      .default("0"),
    periodType: periodTypeEnum("period_type").notNull().default("daily"),
    isSettled: d.boolean("is_settled").notNull().default(false),
    settledAt: d.timestamp("settled_at", { withTimezone: true }),
    createdAt: d
      .timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("national_turnover_date_idx").on(t.date),
    index("national_turnover_settled_idx").on(t.isSettled),
  ],
);

// ---------------------------------------------------------------------------
// SHU Periods
// ---------------------------------------------------------------------------
export const shuPeriods = createTable(
  "shu_periods",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    periodStart: d
      .timestamp("period_start", { withTimezone: true })
      .notNull(),
    periodEnd: d.timestamp("period_end", { withTimezone: true }).notNull(),
    totalPV: d
      .numeric("total_pv", { precision: 16, scale: 2 })
      .notNull()
      .default("0"),
    totalSHUCount: d.integer("total_shu_count").notNull().default(0),
    perSHUValue: d
      .numeric("per_shu_value", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    isSettled: d.boolean("is_settled").notNull().default(false),
    settledAt: d.timestamp("settled_at", { withTimezone: true }),
    createdAt: d
      .timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("shu_periods_settled_idx").on(t.isSettled)],
);

// ---------------------------------------------------------------------------
// Member SHU (per-member SHU count per period)
// ---------------------------------------------------------------------------
export const memberSHU = createTable(
  "member_shu",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    memberId: d
      .integer("member_id")
      .notNull()
      .references(() => memberProfiles.id),
    periodId: d
      .integer("period_id")
      .notNull()
      .references(() => shuPeriods.id),
    shuCount: d.integer("shu_count").notNull().default(0),
    bonusPaid: d
      .numeric("bonus_paid", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    createdAt: d
      .timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("member_shu_member_idx").on(t.memberId),
    index("member_shu_period_idx").on(t.periodId),
  ],
);

// ---------------------------------------------------------------------------
// Coins (ledger)
// ---------------------------------------------------------------------------
export const coins = createTable(
  "coins",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    memberId: d
      .integer("member_id")
      .notNull()
      .references(() => memberProfiles.id),
    amount: d.numeric({ precision: 14, scale: 4 }).notNull(),
    type: coinTxTypeEnum().notNull(),
    pricePerCoin: d.numeric("price_per_coin", { precision: 14, scale: 2 }),
    description: d.text(),
    createdAt: d
      .timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("coins_member_idx").on(t.memberId),
    index("coins_type_idx").on(t.type),
  ],
);

// ---------------------------------------------------------------------------
// PINs (registration PINs)
// ---------------------------------------------------------------------------
export const pins = createTable(
  "pins",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    pin: d.varchar({ length: 20 }).notNull().unique(),
    stokisId: d
      .integer("stokis_id")
      .references(() => stokis.id),
    generatedByAdminId: d.integer("generated_by_admin_id"), // admin who generated
    price: d
      .numeric({ precision: 12, scale: 2 })
      .notNull()
      .default("150000"),
    pvValue: d
      .numeric("pv_value", { precision: 12, scale: 2 })
      .notNull()
      .default("150"),
    usedByMemberId: d
      .integer("used_by_member_id")
      .references(() => memberProfiles.id),
    usedAt: d.timestamp("used_at", { withTimezone: true }),
    status: pinStatusEnum().notNull().default("available"),
    createdAt: d
      .timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    uniqueIndex("pins_pin_idx").on(t.pin),
    index("pins_stokis_idx").on(t.stokisId),
    index("pins_status_idx").on(t.status),
  ],
);

// ---------------------------------------------------------------------------
// Stokis
// ---------------------------------------------------------------------------
export const stokis = createTable(
  "stokis",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    memberId: d
      .integer("member_id")
      .notNull()
      .unique()
      .references(() => memberProfiles.id, { onDelete: "cascade" }),
    stokisNumber: d.integer("stokis_number").notNull().unique(), // sequential
    name: d.varchar({ length: 255 }).notNull(),
    barcodeData: d.text("barcode_data"),
    address: d.text(),
    phone: d.varchar({ length: 20 }),
    isActive: d.boolean("is_active").notNull().default(true),
    pinStock: d.integer("pin_stock").notNull().default(0),
    pvStock: d
      .numeric("pv_stock", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    totalCommission: d
      .numeric("total_commission", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    commissionRate: d
      .numeric("commission_rate", { precision: 5, scale: 2 })
      .notNull()
      .default("10"),
    createdAt: d
      .timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    uniqueIndex("stokis_member_idx").on(t.memberId),
    uniqueIndex("stokis_number_idx").on(t.stokisNumber),
  ],
);

// ---------------------------------------------------------------------------
// PV Purchases (member buys PV from stokis)
// ---------------------------------------------------------------------------
export const pvPurchases = createTable(
  "pv_purchases",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    memberId: d
      .integer("member_id")
      .notNull()
      .references(() => memberProfiles.id),
    stokisId: d
      .integer("stokis_id")
      .notNull()
      .references(() => stokis.id),
    pvAmount: d
      .numeric("pv_amount", { precision: 12, scale: 2 })
      .notNull(),
    rupiahAmount: d
      .numeric("rupiah_amount", { precision: 14, scale: 2 })
      .notNull(),
    status: pvPurchaseStatusEnum().notNull().default("pending"),
    paymentMethod: pvPaymentMethodEnum("payment_method").notNull(),
    confirmedAt: d.timestamp("confirmed_at", { withTimezone: true }),
    rejectedAt: d.timestamp("rejected_at", { withTimezone: true }),
    rejectionReason: d.text("rejection_reason"),
    createdAt: d
      .timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("pv_purchases_member_idx").on(t.memberId),
    index("pv_purchases_stokis_idx").on(t.stokisId),
    index("pv_purchases_status_idx").on(t.status),
  ],
);

// ---------------------------------------------------------------------------
// Products (warung listings)
// ---------------------------------------------------------------------------
export const products = createTable(
  "products",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    warungMemberId: d
      .integer("warung_member_id")
      .notNull()
      .references(() => memberProfiles.id),
    name: d.varchar({ length: 255 }).notNull(),
    description: d.text(),
    price: d.numeric({ precision: 12, scale: 2 }).notNull(),
    pvValue: d.numeric("pv_value", { precision: 12, scale: 2 }).notNull(),
    imageUrl: d.text("image_url"),
    category: d.varchar({ length: 100 }),
    isActive: d.boolean("is_active").notNull().default(true),
    approvalStatus: productApprovalEnum("approval_status")
      .notNull()
      .default("pending"),
    rejectionReason: d.text("rejection_reason"),
    approvedById: d
      .integer("approved_by_id")
      .references(() => memberProfiles.id),
    createdAt: d
      .timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d
      .timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date()),
  }),
  (t) => [
    index("products_warung_idx").on(t.warungMemberId),
    index("products_category_idx").on(t.category),
    index("products_active_idx").on(t.isActive),
    index("products_approval_idx").on(t.approvalStatus),
  ],
);

// ---------------------------------------------------------------------------
// Withdrawals (dual-approval flow)
// ---------------------------------------------------------------------------
export const withdrawals = createTable(
  "withdrawals",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    memberId: d
      .integer("member_id")
      .notNull()
      .references(() => memberProfiles.id),
    amount: d.numeric({ precision: 14, scale: 2 }).notNull(),
    bankName: d.varchar("bank_name", { length: 100 }).notNull(),
    accountNumber: d.varchar("account_number", { length: 50 }).notNull(),
    accountHolder: d.varchar("account_holder", { length: 255 }).notNull(),
    status: withdrawalStatusEnum().notNull().default("pending"),
    bendaharaId: d.integer("bendahara_id"), // who approved step 1
    bendaharaApprovedAt: d.timestamp("bendahara_approved_at", {
      withTimezone: true,
    }),
    direkturId: d.integer("direktur_id"), // who approved step 2
    direkturApprovedAt: d.timestamp("direktur_approved_at", {
      withTimezone: true,
    }),
    rejectedById: d.integer("rejected_by_id"),
    rejectedAt: d.timestamp("rejected_at", { withTimezone: true }),
    rejectionReason: d.text("rejection_reason"),
    completedAt: d.timestamp("completed_at", { withTimezone: true }),
    xenditDisbursementId: d.varchar("xendit_disbursement_id", { length: 255 }),
    createdAt: d
      .timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("withdrawals_member_idx").on(t.memberId),
    index("withdrawals_status_idx").on(t.status),
    index("withdrawals_created_at_idx").on(t.createdAt),
  ],
);

// ---------------------------------------------------------------------------
// Rank History
// ---------------------------------------------------------------------------
export const rankHistory = createTable(
  "rank_history",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    memberId: d
      .integer("member_id")
      .notNull()
      .references(() => memberProfiles.id),
    rank: rankEnum().notNull(),
    achievedAt: d
      .timestamp("achieved_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    rewardsClaimed: d.boolean("rewards_claimed").notNull().default(false),
  }),
  (t) => [index("rank_history_member_idx").on(t.memberId)],
);

// ---------------------------------------------------------------------------
// Rewards (non-cash: motor, mobil, etc.)
// ---------------------------------------------------------------------------
export const rewards = createTable("rewards", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  name: d.varchar({ length: 255 }).notNull(), // e.g. "Motor", "Mobil ke-1"
  description: d.text(),
  requiredRank: rankEnum("required_rank").notNull(),
  requiredPV: d
    .numeric("required_pv", { precision: 14, scale: 2 })
    .notNull(),
  valueRupiah: d
    .numeric("value_rupiah", { precision: 14, scale: 2 })
    .notNull(),
  isActive: d.boolean("is_active").notNull().default(true),
  createdAt: d
    .timestamp("created_at", { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
}));

// ---------------------------------------------------------------------------
// Member Rewards (claimed rewards)
// ---------------------------------------------------------------------------
export const memberRewards = createTable(
  "member_rewards",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    memberId: d
      .integer("member_id")
      .notNull()
      .references(() => memberProfiles.id),
    rewardId: d
      .integer("reward_id")
      .notNull()
      .references(() => rewards.id),
    claimedAt: d
      .timestamp("claimed_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    status: d.varchar({ length: 50 }).notNull().default("pending"), // pending, approved, delivered
  }),
  (t) => [index("member_rewards_member_idx").on(t.memberId)],
);

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export const notifications = createTable(
  "notifications",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    memberId: d
      .integer("member_id")
      .notNull()
      .references(() => memberProfiles.id),
    title: d.varchar({ length: 255 }).notNull(),
    message: d.text().notNull(),
    type: notificationTypeEnum().notNull().default("system"),
    isRead: d.boolean("is_read").notNull().default(false),
    soundAlert: d.boolean("sound_alert").notNull().default(false),
    metadata: d.text(), // JSON string for extra data
    createdAt: d
      .timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("notifications_member_idx").on(t.memberId),
    index("notifications_read_idx").on(t.isRead),
    index("notifications_created_at_idx").on(t.createdAt),
  ],
);

// ---------------------------------------------------------------------------
// Audit Log
// ---------------------------------------------------------------------------
export const auditLog = createTable(
  "audit_log",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d.text("user_id").references(() => user.id),
    action: d.varchar({ length: 255 }).notNull(),
    entity: d.varchar({ length: 100 }).notNull(), // table name
    entityId: d.integer("entity_id"),
    oldValue: d.text("old_value"), // JSON
    newValue: d.text("new_value"), // JSON
    ipAddress: d.varchar("ip_address", { length: 45 }),
    createdAt: d
      .timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("audit_log_user_idx").on(t.userId),
    index("audit_log_entity_idx").on(t.entity),
    index("audit_log_created_at_idx").on(t.createdAt),
  ],
);

// ---------------------------------------------------------------------------
// Referral Links
// ---------------------------------------------------------------------------
export const referralLinks = createTable(
  "referral_links",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    memberId: d
      .integer("member_id")
      .notNull()
      .references(() => memberProfiles.id),
    code: d.varchar({ length: 50 }).notNull().unique(),
    clickCount: d.integer("click_count").notNull().default(0),
    registrationCount: d.integer("registration_count").notNull().default(0),
    createdAt: d
      .timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    uniqueIndex("referral_links_code_idx").on(t.code),
    index("referral_links_member_idx").on(t.memberId),
  ],
);

// ---------------------------------------------------------------------------
// Company Settings (singleton config)
// ---------------------------------------------------------------------------
export const companySettings = createTable("company_settings", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  key: d.varchar({ length: 100 }).notNull().unique(),
  value: d.text().notNull(),
  description: d.text(),
  updatedAt: d
    .timestamp("updated_at", { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
}));

// ===========================================================================
// RELATIONS
// ===========================================================================

// -- Better Auth relations --
export const userRelations = relations(user, ({ many, one }) => ({
  account: many(account),
  session: many(session),
  memberProfile: one(memberProfiles, {
    fields: [user.id],
    references: [memberProfiles.userId],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

// -- Member Profile relations --
export const memberProfileRelations = relations(
  memberProfiles,
  ({ one, many }) => ({
    user: one(user, {
      fields: [memberProfiles.userId],
      references: [user.id],
    }),
    sponsor: one(memberProfiles, {
      fields: [memberProfiles.sponsorId],
      references: [memberProfiles.id],
      relationName: "sponsorTree",
    }),
    recruits: many(memberProfiles, { relationName: "sponsorTree" }),
    treeNode: one(binaryTree, {
      fields: [memberProfiles.id],
      references: [binaryTree.memberId],
    }),
    wallet: one(wallets, {
      fields: [memberProfiles.id],
      references: [wallets.memberId],
    }),
    stokisProfile: one(stokis, {
      fields: [memberProfiles.id],
      references: [stokis.memberId],
    }),
    transactions: many(transactions),
    bonuses: many(bonuses, { relationName: "bonusMember" }),
    bonusSources: many(bonuses, { relationName: "bonusSource" }),
    notifications: many(notifications),
    products: many(products),
    withdrawals: many(withdrawals),
    rankHistory: many(rankHistory),
    memberRewards: many(memberRewards),
    coins: many(coins),
    memberSHU: many(memberSHU),
    referralLinks: many(referralLinks),
  }),
);

// -- Binary Tree relations --
export const binaryTreeRelations = relations(binaryTree, ({ one }) => ({
  member: one(memberProfiles, {
    fields: [binaryTree.memberId],
    references: [memberProfiles.id],
  }),
  parent: one(binaryTree, {
    fields: [binaryTree.parentId],
    references: [binaryTree.id],
    relationName: "parentChild",
  }),
}));

// -- Wallet relations --
export const walletRelations = relations(wallets, ({ one }) => ({
  member: one(memberProfiles, {
    fields: [wallets.memberId],
    references: [memberProfiles.id],
  }),
}));

// -- Transaction relations --
export const transactionRelations = relations(transactions, ({ one }) => ({
  member: one(memberProfiles, {
    fields: [transactions.memberId],
    references: [memberProfiles.id],
  }),
}));

// -- Bonus relations --
export const bonusRelations = relations(bonuses, ({ one }) => ({
  member: one(memberProfiles, {
    fields: [bonuses.memberId],
    references: [memberProfiles.id],
    relationName: "bonusMember",
  }),
  sourceMember: one(memberProfiles, {
    fields: [bonuses.sourceMemberId],
    references: [memberProfiles.id],
    relationName: "bonusSource",
  }),
}));

// -- Stokis relations --
export const stokisRelations = relations(stokis, ({ one, many }) => ({
  member: one(memberProfiles, {
    fields: [stokis.memberId],
    references: [memberProfiles.id],
  }),
  pins: many(pins),
  pvPurchases: many(pvPurchases),
}));

// -- PIN relations --
export const pinRelations = relations(pins, ({ one }) => ({
  stokis: one(stokis, {
    fields: [pins.stokisId],
    references: [stokis.id],
  }),
  usedBy: one(memberProfiles, {
    fields: [pins.usedByMemberId],
    references: [memberProfiles.id],
  }),
}));

// -- Product relations --
export const productRelations = relations(products, ({ one }) => ({
  warung: one(memberProfiles, {
    fields: [products.warungMemberId],
    references: [memberProfiles.id],
  }),
}));

// -- Withdrawal relations --
export const withdrawalRelations = relations(withdrawals, ({ one }) => ({
  member: one(memberProfiles, {
    fields: [withdrawals.memberId],
    references: [memberProfiles.id],
  }),
}));

// -- Notification relations --
export const notificationRelations = relations(notifications, ({ one }) => ({
  member: one(memberProfiles, {
    fields: [notifications.memberId],
    references: [memberProfiles.id],
  }),
}));

// -- Rank History relations --
export const rankHistoryRelations = relations(rankHistory, ({ one }) => ({
  member: one(memberProfiles, {
    fields: [rankHistory.memberId],
    references: [memberProfiles.id],
  }),
}));

// -- Member Rewards relations --
export const memberRewardRelations = relations(memberRewards, ({ one }) => ({
  member: one(memberProfiles, {
    fields: [memberRewards.memberId],
    references: [memberProfiles.id],
  }),
  reward: one(rewards, {
    fields: [memberRewards.rewardId],
    references: [rewards.id],
  }),
}));

// -- Coins relations --
export const coinRelations = relations(coins, ({ one }) => ({
  member: one(memberProfiles, {
    fields: [coins.memberId],
    references: [memberProfiles.id],
  }),
}));

// -- Member SHU relations --
export const memberSHURelations = relations(memberSHU, ({ one }) => ({
  member: one(memberProfiles, {
    fields: [memberSHU.memberId],
    references: [memberProfiles.id],
  }),
  period: one(shuPeriods, {
    fields: [memberSHU.periodId],
    references: [shuPeriods.id],
  }),
}));

// -- SHU Periods relations --
export const shuPeriodRelations = relations(shuPeriods, ({ many }) => ({
  memberSHUs: many(memberSHU),
}));

// -- Referral Links relations --
export const referralLinkRelations = relations(referralLinks, ({ one }) => ({
  member: one(memberProfiles, {
    fields: [referralLinks.memberId],
    references: [memberProfiles.id],
  }),
}));

// -- Rewards relations --
export const rewardRelations = relations(rewards, ({ many }) => ({
  memberRewards: many(memberRewards),
}));

// -- Audit Log relations --
export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(user, {
    fields: [auditLog.userId],
    references: [user.id],
  }),
}));

// -- PV Purchases relations --
export const pvPurchaseRelations = relations(pvPurchases, ({ one }) => ({
  member: one(memberProfiles, {
    fields: [pvPurchases.memberId],
    references: [memberProfiles.id],
  }),
  stokis: one(stokis, {
    fields: [pvPurchases.stokisId],
    references: [stokis.id],
  }),
}));
