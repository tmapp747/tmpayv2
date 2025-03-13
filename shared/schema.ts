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
  // 747 Casino-specific fields
  casinoUsername: text("casino_username"),
  casinoClientId: integer("casino_client_id"),
  topManager: text("top_manager"),
  immediateManager: text("immediate_manager"),
  casinoUserType: text("casino_user_type"),
  casinoBalance: numeric("casino_balance", { precision: 10, scale: 2 }).default("0"),
  // Auth and hierarchy fields
  accessToken: text("access_token"), // Each user has a unique token for transfers
  isAuthorized: boolean("is_authorized").default(false), // If user is allowed to use the system
  hierarchyLevel: integer("hierarchy_level").default(0), // 0=player, 1=agent, 2=manager, 3=top manager
  allowedTopManagers: text("allowed_top_managers").array(), // List of top managers this user is allowed under
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
  type: text("type").notNull(), // 'deposit', 'withdraw', 'transfer', 'casino_deposit', 'casino_withdraw'
  method: text("method").notNull(), // 'gcash_qr', 'bank_transfer', 'crypto', 'casino_transfer', etc.
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(), // 'pending', 'completed', 'failed', 'expired'
  paymentReference: text("payment_reference"),
  transactionId: text("transaction_id"),
  casinoReference: text("casino_reference"),
  // 747 Casino-specific fields
  casinoClientId: integer("casino_client_id"),
  casinoUsername: text("casino_username"),
  destinationAddress: text("destination_address"), // For crypto withdrawals
  destinationNetwork: text("destination_network"), // For crypto withdrawals
  uniqueId: text("unique_id"), // For casino transactions
  currency: text("currency").default("USD"),
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

// 747 Casino-specific API request schemas
export const casinoDepositSchema = z.object({
  userId: z.number(),
  casinoClientId: z.number(),
  casinoUsername: z.string(),
  amount: z.number().min(1),
  currency: z.string().default("USD"),
  method: z.string()
});

export const casinoWithdrawSchema = z.object({
  userId: z.number(),
  casinoClientId: z.number(),
  casinoUsername: z.string(),
  amount: z.number().min(1),
  currency: z.number().default(1),
  destinationCurrency: z.number().default(1),
  destinationNetwork: z.string(),
  destinationAddress: z.string(),
  uniqueId: z.number().optional()
});

export const casinoTransferSchema = z.object({
  fromUserId: z.number(),
  fromCasinoUsername: z.string(),
  toClientId: z.number(),
  toUsername: z.string(),
  amount: z.number().min(1),
  currency: z.string().default("USD"),
  comment: z.string().optional()
});

export const casinoGetUserDetailsSchema = z.object({
  username: z.string()
});

// Authentication schemas
export const loginSchema = z.object({
  username: z.string(),
  password: z.string()
});

export const authSchema = z.object({
  token: z.string(),
  username: z.string()
});

export const allowedTopManagersSchema = z.array(z.string()).min(1);

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

// 747 Casino-specific types
export type CasinoDepositRequest = z.infer<typeof casinoDepositSchema>;
export type CasinoWithdrawRequest = z.infer<typeof casinoWithdrawSchema>;
export type CasinoTransferRequest = z.infer<typeof casinoTransferSchema>;
export type CasinoGetUserDetailsRequest = z.infer<typeof casinoGetUserDetailsSchema>;

// Auth types
export type LoginRequest = z.infer<typeof loginSchema>;
export type AuthRequest = z.infer<typeof authSchema>;
export type AllowedTopManagers = z.infer<typeof allowedTopManagersSchema>;
