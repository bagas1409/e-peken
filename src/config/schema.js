import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
  varchar,
  jsonb,
} from "drizzle-orm/pg-core";

/* =========================
   USERS & ROLES
========================= */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password"),

  status: text("status").default("ACTIVE"), // ACTIVE | BANNED
  createdAt: timestamp("created_at").defaultNow(),
});

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // USER | UMKM | ADMIN
});

export const userRoles = pgTable("user_roles", {
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  roleId: integer("role_id")
    .references(() => roles.id)
    .notNull(),
});

/* =========================
   UMKM
========================= */

export const umkmProfiles = pgTable("umkm_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  storeName: text("store_name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  logoUrl: text("logo_url"),
  bannerUrl: text("banner_url"),
  address: text("address"),
  latitude: numeric("latitude", { precision: 10, scale: 6 }),
  longitude: numeric("longitude", { precision: 10, scale: 6 }),
  openTime: varchar("open_time", { length: 5 }),
  closeTime: varchar("close_time", { length: 5 }),
  status: text("status").default("PENDING"), // PENDING | ACTIVE | SUSPENDED
  createdAt: timestamp("created_at").defaultNow(),
});

export const umkmVerifications = pgTable("umkm_verifications", {
  id: serial("id").primaryKey(),
  umkmId: integer("umkm_id")
    .references(() => umkmProfiles.id)
    .notNull(),
  ktpUrl: text("ktp_url"),
  storePhotoUrl: text("store_photo_url"),
  businessDocUrl: text("business_doc_url"),
  status: text("status").default("PENDING"), // PENDING | APPROVED | REJECTED
  rejectionReason: text("rejection_reason"),
  verifiedAt: timestamp("verified_at"),
});

/* =========================
   CATEGORIES & PRODUCTS
========================= */

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  parentId: integer("parent_id"),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  umkmId: integer("umkm_id")
    .references(() => umkmProfiles.id)
    .notNull(),
  categoryId: integer("category_id")
    .references(() => categories.id)
    .notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  stock: integer("stock").default(0),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .references(() => products.id)
    .notNull(),
  imageUrl: text("image_url").notNull(),
  isPrimary: boolean("is_primary").default(false),
});

export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .references(() => products.id)
    .notNull(),
  name: text("name").notNull(), // warna / ukuran
  priceAdjustment: numeric("price_adjustment", {
    precision: 12,
    scale: 2,
  }).default("0"),
  stock: integer("stock").default(0),
});

/* =========================
   CART
========================= */

export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: integer("cart_id")
    .references(() => carts.id)
    .notNull(),
  productId: integer("product_id")
    .references(() => products.id)
    .notNull(),
  quantity: integer("quantity").default(1),
});

/* =========================
   ORDERS & PAYMENTS
========================= */

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  umkmId: integer("umkm_id")
    .references(() => umkmProfiles.id)
    .notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }),
  shippingCost: numeric("shipping_cost", { precision: 12, scale: 2 }),
  orderStatus: text("order_status").default("PENDING"),
  paymentStatus: text("payment_status").default("UNPAID"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  productId: integer("product_id")
    .references(() => products.id)
    .notNull(),
  price: numeric("price", { precision: 12, scale: 2 }),
  quantity: integer("quantity"),
});

export const orderStatusLogs = pgTable("order_status_logs", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  status: text("status").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  paymentMethod: text("payment_method"),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  status: text("status").default("PENDING"),
  paidAt: timestamp("paid_at"),
});

/* =========================
   WALLET & WITHDRAW
========================= */

export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  umkmId: integer("umkm_id")
    .references(() => umkmProfiles.id)
    .notNull(),
  balanceAvailable: numeric("balance_available", {
    precision: 14,
    scale: 2,
  }).default("0"),
  balancePending: numeric("balance_pending", {
    precision: 14,
    scale: 2,
  }).default("0"),
});

export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id")
    .references(() => wallets.id)
    .notNull(),
  type: text("type"), // IN | OUT
  amount: numeric("amount", { precision: 14, scale: 2 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const withdrawRequests = pgTable("withdraw_requests", {
  id: serial("id").primaryKey(),
  umkmId: integer("umkm_id")
    .references(() => umkmProfiles.id)
    .notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }),
  bankName: text("bank_name"),
  bankAccount: text("bank_account"),
  status: text("status").default("PENDING"),
  requestedAt: timestamp("requested_at").defaultNow(),
});

/* =========================
   REVIEW & CHAT
========================= */

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  productId: integer("product_id")
    .references(() => products.id)
    .notNull(),
  rating: integer("rating"),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  umkmId: integer("umkm_id")
    .references(() => umkmProfiles.id)
    .notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id")
    .references(() => chats.id)
    .notNull(),
  senderId: integer("sender_id")
    .references(() => users.id)
    .notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const disputes = pgTable("disputes", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  reason: text("reason").notNull(),
  status: text("status").default("OPEN"), // OPEN | RESOLVED
  decision: text("decision"), // REFUND | RELEASE
  createdAt: timestamp("created_at").defaultNow(),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull(),
  action: text("action").notNull(),
  target: text("target"),
  metadata: jsonb("metadata"), // ✅ FIX
  createdAt: timestamp("created_at").defaultNow(),
});
