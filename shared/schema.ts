import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["customer", "printer", "admin"] }).notNull().default("customer"),
  creditBalance: decimal("credit_balance", { precision: 10, scale: 2 }).default("0.00"),
  subscriptionStatus: varchar("subscription_status", { enum: ["active", "inactive", "suspended"] }).default("inactive"),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  companyName: varchar("company_name"),
  companyDescription: text("company_description"),
  companyAddress: text("company_address"),
  companyPhone: varchar("company_phone"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalRatings: integer("total_ratings").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  type: varchar("type", { enum: ["sheet_label", "roll_label", "general_printing"] }).notNull(),
  status: varchar("status", { enum: ["pending", "received_quotes", "approved", "in_progress", "completed", "cancelled"] }).notNull().default("pending"),
  title: varchar("title").notNull(),
  description: text("description"),
  specifications: jsonb("specifications").notNull(),
  fileUrls: text("file_urls").array(),
  deadline: timestamp("deadline"),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  selectedQuoteId: uuid("selected_quote_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const printerQuotes = pgTable("printer_quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  quoteId: uuid("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  printerId: varchar("printer_id").notNull().references(() => users.id),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  estimatedDays: integer("estimated_days").notNull(),
  notes: text("notes"),
  status: varchar("status", { enum: ["pending", "accepted", "rejected"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  quoteId: uuid("quote_id").notNull().references(() => quotes.id),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  printerId: varchar("printer_id").notNull().references(() => users.id),
  printerQuoteId: uuid("printer_quote_id").notNull().references(() => printerQuotes.id),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { enum: ["pending_payment", "paid", "in_production", "shipped", "delivered", "cancelled"] }).notNull().default("pending_payment"),
  paymentStatus: varchar("payment_status", { enum: ["pending", "completed", "failed", "refunded"] }).notNull().default("pending"),
  trackingNumber: varchar("tracking_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ratings = pgTable("ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  printerId: varchar("printer_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const files = pgTable("files", {
  id: uuid("id").primaryKey().defaultRandom(),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  mimeType: varchar("mime_type").notNull(),
  size: integer("size").notNull(),
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  quoteId: uuid("quote_id").references(() => quotes.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  quotes: many(quotes),
  printerQuotes: many(printerQuotes),
  ordersAsCustomer: many(orders, { relationName: "customerOrders" }),
  ordersAsPrinter: many(orders, { relationName: "printerOrders" }),
  ratingsGiven: many(ratings, { relationName: "customerRatings" }),
  ratingsReceived: many(ratings, { relationName: "printerRatings" }),
  files: many(files),
}));

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  customer: one(users, {
    fields: [quotes.customerId],
    references: [users.id],
  }),
  printerQuotes: many(printerQuotes),
  order: one(orders),
  files: many(files),
}));

export const printerQuotesRelations = relations(printerQuotes, ({ one }) => ({
  quote: one(quotes, {
    fields: [printerQuotes.quoteId],
    references: [quotes.id],
  }),
  printer: one(users, {
    fields: [printerQuotes.printerId],
    references: [users.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  quote: one(quotes, {
    fields: [orders.quoteId],
    references: [quotes.id],
  }),
  customer: one(users, {
    fields: [orders.customerId],
    references: [users.id],
    relationName: "customerOrders",
  }),
  printer: one(users, {
    fields: [orders.printerId],
    references: [users.id],
    relationName: "printerOrders",
  }),
  printerQuote: one(printerQuotes, {
    fields: [orders.printerQuoteId],
    references: [printerQuotes.id],
  }),
  rating: one(ratings),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  order: one(orders, {
    fields: [ratings.orderId],
    references: [orders.id],
  }),
  customer: one(users, {
    fields: [ratings.customerId],
    references: [users.id],
    relationName: "customerRatings",
  }),
  printer: one(users, {
    fields: [ratings.printerId],
    references: [users.id],
    relationName: "printerRatings",
  }),
}));

export const filesRelations = relations(files, ({ one }) => ({
  uploadedBy: one(users, {
    fields: [files.uploadedBy],
    references: [users.id],
  }),
  quote: one(quotes, {
    fields: [files.quoteId],
    references: [quotes.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertQuoteSchema = createInsertSchema(quotes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPrinterQuoteSchema = createInsertSchema(printerQuotes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRatingSchema = createInsertSchema(ratings).omit({ id: true, createdAt: true });
export const insertFileSchema = createInsertSchema(files).omit({ id: true, createdAt: true });

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotes.$inferSelect;
export type InsertPrinterQuote = z.infer<typeof insertPrinterQuoteSchema>;
export type PrinterQuote = typeof printerQuotes.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratings.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;
