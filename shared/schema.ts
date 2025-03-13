import { pgTable, text, serial, integer, timestamp, boolean, numeric, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  balance: numeric("balance", { precision: 10, scale: 2 }).default("0").notNull(),
  pendingBalance: numeric("pending_balance", { precision: 10, scale: 2 }).default("0").notNull(),
  isVip: boolean("is_vip").default(false),
  casinoId: text("casino_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Transaction schema
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'deposit', 'withdraw', 'transfer'
  method: text("method").notNull(), // 'gcash_qr', 'bank_transfer', 'crypto', etc.
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(), // 'pending', 'completed', 'failed'
  paymentReference: text("payment_reference"),
  transactionId: text("transaction_id"),
  casinoReference: text("casino_reference"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// QR Payment schema
export const qrPayments = pgTable("qr_payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  transactionId: integer("transaction_id").notNull(),
  qrCodeData: text("qr_code_data").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  directPayReference: text("direct_pay_reference"),
  status: text("status").notNull().default("pending"), // 'pending', 'completed', 'expired', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertQrPaymentSchema = createInsertSchema(qrPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// API Request schemas for casino and payment provider
export const generateQrCodeSchema = z.object({
  userId: z.number(),
  username: z.string(),
  amount: z.number().min(100).max(50000),
  casinoId: z.string()
});

export const verifyPaymentSchema = z.object({
  paymentReference: z.string(),
  transactionId: z.string().optional(),
  amount: z.number(),
  status: z.enum(['success', 'failed', 'pending'])
});

export const updateBalanceSchema = z.object({
  userId: z.number(),
  casinoId: z.string(),
  amount: z.number(),
  transactionId: z.string()
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type QrPayment = typeof qrPayments.$inferSelect;
export type InsertQrPayment = z.infer<typeof insertQrPaymentSchema>;

export type GenerateQrCodeRequest = z.infer<typeof generateQrCodeSchema>;
export type VerifyPaymentRequest = z.infer<typeof verifyPaymentSchema>;
export type UpdateBalanceRequest = z.infer<typeof updateBalanceSchema>;
