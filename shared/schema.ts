import { pgTable, text, serial, integer, timestamp, boolean, numeric, json, date, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Currency definition - only supporting PHP (fiat), PHPT and USDT (crypto)
export const supportedCurrencies = ['PHP', 'PHPT', 'USDT'];
export const supportedPaymentMethodTypes = ['bank', 'wallet', 'cash', 'remittance', 'crypto', 'instapay', 'pesonet', 'other'];
export const supportedUserRoles = ['player', 'agent', 'admin'];
export const supportedUserStatuses = ['active', 'suspended', 'inactive', 'pending_review'];
export const supportedConversationStatuses = ['active', 'resolved', 'pending', 'closed'];
export const supportedMessageTypes = ['user', 'assistant', 'system'];
export const supportedChatTypes = ['ai', 'human'];

// Define available resources and their actions for permissions
export const resourceActionMap = {
  users: ['read', 'create', 'update', 'delete', 'approve', 'reject', 'suspend', 'manage'],
  transactions: ['read', 'create', 'update', 'delete', 'approve', 'reject', 'manage'],
  deposits: ['read', 'create', 'approve', 'reject', 'manage'],
  withdrawals: ['read', 'create', 'approve', 'reject', 'manage'],
  reports: ['read', 'create', 'export', 'share'],
  settings: ['read', 'update', 'manage'],
  casino: ['connect', 'transfer', 'sync', 'manage']
};

// Role Permissions schema - Defines what each role can do
export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(),
  permission: text("permission").notNull(), // Format: resource:action (e.g., users:read, transactions:create)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User schema
// Insert schema for role permissions
export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().notNull(), // UUID v4 for public API interactions
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(), // Email is now required
  
  // Role and status management
  role: text("role").default('player').notNull(), // player, agent, admin
  status: text("status").default('active').notNull(), // active, suspended, inactive, pending_review
  lastLoginAt: timestamp("last_login_at"),
  lastLoginIp: text("last_login_ip"),
  statusReason: text("status_reason"), // Reason for current status (e.g., why suspended)
  
  // Primary balance in PHP (Philippine Peso) for DirectPay transactions
  balance: numeric("balance", { precision: 10, scale: 2 }).default("0").notNull(),
  pendingBalance: numeric("pending_balance", { precision: 10, scale: 2 }).default("0").notNull(),
  
  // Multi-currency support
  balances: json("balances").default({}).notNull(), // JSON object with currency as key and balance as value
  preferredCurrency: text("preferred_currency").default("PHP").notNull(),
  
  // Casino integration
  casinoId: text("casino_id").notNull(),
  casinoUsername: text("casino_username"),
  casinoClientId: integer("casino_client_id"),
  topManager: text("top_manager"),
  immediateManager: text("immediate_manager"),
  casinoUserType: text("casino_user_type"),
  
  // Auth and tokens
  accessToken: text("access_token"), // Each user has a unique token for transfers
  accessTokenExpiry: timestamp("access_token_expiry"), // When the access token expires
  refreshToken: text("refresh_token"), // Token used to refresh the access token
  refreshTokenExpiry: timestamp("refresh_token_expiry"), // When the refresh token expires
  casinoAuthToken: text("casino_auth_token"), // Casino API auth token (typically from top manager)
  casinoAuthTokenExpiry: timestamp("casino_auth_token_expiry"), // When the casino auth token expires
  
  // Authorization and hierarchy management
  isAuthorized: boolean("is_authorized").default(false), // If user is allowed to use the system
  allowedTopManagers: text("allowed_top_managers").array(), // List of top managers this user is allowed under
  
  // Audit and timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  email: z.string().email(),
  casinoId: z.string().nonempty(),
  preferredCurrency: z.enum(['PHP', 'PHPT', 'USDT']).default('PHP')
});

// Transaction ledger schema with enhanced tracking and analytics capabilities
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().notNull(), // UUID v4 for public API interactions
  userId: integer("user_id").notNull(),
  // Core transaction fields
  type: text("type").notNull(), // 'deposit', 'withdraw', 'transfer', 'casino_deposit', 'casino_withdraw', 'exchange', 'refund'
  method: text("method").notNull(), // 'gcash_qr', 'bank_transfer', 'crypto', 'casino_transfer', 'direct_pay', 'paygram', 'manual'
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  fee: numeric("fee", { precision: 10, scale: 2 }).default("0.00"), // Transaction fee if applicable
  netAmount: numeric("net_amount", { precision: 10, scale: 2 }), // Amount after fees (calculated)

  // Status tracking with dual-state for payment and casino processing
  status: text("status").notNull(), // Overall status: 'pending', 'processing', 'completed', 'failed', 'expired', 'refunded', 'disputed'
  gcashStatus: text("gcash_status").default("processing"), // GCash payment status: 'processing', 'completed', 'failed'
  casinoStatus: text("casino_status").default("pending"), // Casino transfer status: 'pending', 'processing', 'completed', 'failed'
  statusHistory: json("status_history"), // Array of status changes with timestamps for audit trail
  statusUpdatedAt: timestamp("status_updated_at"), // When status was last changed
  completedAt: timestamp("completed_at"), // When transaction was completed (if applicable)

  // References and IDs across systems
  paymentReference: text("payment_reference"), // DirectPay or other payment reference
  transactionId: text("transaction_id"), // Internal or external transaction ID
  casinoReference: text("casino_reference"), // 747 Casino reference
  nonce: text("nonce"), // Unique transaction nonce for reconciliation and duplicate prevention

  // 747 Casino-specific fields
  casinoClientId: integer("casino_client_id"),
  casinoUsername: text("casino_username"),
  destinationAddress: text("destination_address"), // For crypto withdrawals
  destinationNetwork: text("destination_network"), // For crypto withdrawals
  uniqueId: text("unique_id"), // For casino transactions

  // Financial tracking
  currency: text("currency").default("PHP"), // Default to PHP for DirectPay GCash
  exchangeRate: numeric("exchange_rate", { precision: 10, scale: 6 }), // Exchange rate if currency conversion involved
  balanceBefore: numeric("balance_before", { precision: 10, scale: 2 }), // User balance before transaction
  balanceAfter: numeric("balance_after", { precision: 10, scale: 2 }), // User balance after transaction

  // Source and destination for transfers
  sourceUserId: integer("source_user_id"), // For transfer: who sent the money
  destinationUserId: integer("destination_user_id"), // For transfer: who received the money

  // Additional data and metadata
  description: text("description"), // Human-readable description of transaction
  notes: text("notes"), // Admin or system notes
  ipAddress: text("ip_address"), // IP address of user when transaction was initiated
  userAgent: text("user_agent"), // User agent of client when transaction was initiated
  metadata: json("metadata"), // Extended transaction metadata (nonce, error details, etc.)

  // Temporal data
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
  uuid: uuid("uuid").defaultRandom().notNull(), // UUID v4 for public API interactions
  userId: integer("user_id").notNull(),
  transactionId: integer("transaction_id").notNull(),
  qrCodeData: text("qr_code_data").notNull(),
  payUrl: text("pay_url"), // URL for DirectPay payment page
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  directPayReference: text("direct_pay_reference"),
  status: text("status").notNull().default("pending"), // 'pending', 'completed', 'expired', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Telegram PayBot Payment schema
export const telegramPayments = pgTable("telegram_payments", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().notNull(), // UUID v4 for public API interactions
  userId: integer("user_id").notNull(),
  transactionId: integer("transaction_id").notNull(),
  payUrl: text("pay_url").notNull(),       // URL provided by Telegram PayBot
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("PHPT").notNull(), // Default to PHPT for Telegram payments
  expiresAt: timestamp("expires_at").notNull(),
  telegramReference: text("telegram_reference"),
  invoiceId: text("invoice_id"),
  status: text("status").notNull().default("pending"), // 'pending', 'completed', 'expired', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Manual Payment schema (for receipt uploads)
export const manualPayments = pgTable("manual_payments", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().notNull(), // UUID v4 for public API interactions
  userId: integer("user_id").notNull(),
  transactionId: integer("transaction_id").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // 'gcash', 'paymaya', 'bank_transfer', 'remittance', 'other'
  notes: text("notes"),
  proofImageUrl: text("proof_image_url").notNull(), // URL to uploaded receipt image
  reference: text("reference").notNull(), // Generated unique reference
  adminId: integer("admin_id"), // ID of admin who approved/rejected
  adminNotes: text("admin_notes"), // Notes from admin
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User preferences for client-side settings stored server-side
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  key: text("key").notNull(), // preference key (e.g., 'intro_video_shown')
  value: json("value").notNull(), // preference value as JSON
  lastUpdated: date("last_updated").notNull(), // When the preference was last updated
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment methods table for admin-managed payment options
export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Display name of the payment method (e.g., "Maya Wallet")
  type: text("type").notNull(), // Type of payment method: 'bank', 'wallet', 'cash', 'other'
  accountName: text("account_name").notNull(), // Account owner's name
  accountNumber: text("account_number").notNull(), // Account number, phone number, or identifier
  bankName: text("bank_name"), // Bank name if applicable
  instructions: text("instructions"), // Special instructions for this payment method
  iconUrl: text("icon_url"), // URL to icon for this payment method
  isActive: boolean("is_active").default(true), // Whether this payment method is currently active
  sortOrder: integer("sort_order").default(0), // Order to display payment methods
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User payment methods for withdrawals and receiving funds
export const userPaymentMethods = pgTable("user_payment_methods", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // User who owns this payment method
  type: text("type").notNull(), // Type of payment method: 'bank', 'wallet', 'crypto', 'instapay', 'pesonet', 'remittance', 'other'
  name: text("name").notNull(), // Name for this payment method (e.g., "My Maya Account")
  accountName: text("account_name").notNull(), // Account owner's name
  accountNumber: text("account_number").notNull(), // Account number, phone number, or wallet address
  bankName: text("bank_name"), // Bank name if applicable
  swiftCode: text("swift_code"), // SWIFT/BIC code for international transfers
  routingNumber: text("routing_number"), // Routing/ABA number for US banks
  blockchainNetwork: text("blockchain_network"), // Network for crypto addresses (e.g., "ETH", "BTC")
  
  // Philippine-specific fields
  instapayEnabled: boolean("instapay_enabled").default(false), // Whether this account supports InstaPay
  pesonetEnabled: boolean("pesonet_enabled").default(false), // Whether this account supports PESONet
  qrPhEnabled: boolean("qr_ph_enabled").default(false), // Whether this account supports QR Ph
  dailyTransferLimit: numeric("daily_transfer_limit", { precision: 10, scale: 2 }), // Daily transfer limit
  perTransactionLimit: numeric("per_transaction_limit", { precision: 10, scale: 2 }), // Per transaction limit
  
  // Security and verification
  verificationMethod: text("verification_method"), // 'micro_deposit', 'id_verification', 'otp', 'biometric'
  verificationStatus: text("verification_status").default("pending"), // 'pending', 'in_progress', 'verified', 'failed'
  verificationDate: timestamp("verification_date"), // When the verification was completed
  verificationData: json("verification_data").default({}), // Verification data (e.g., micro-deposit amounts)
  
  // Remittance-specific fields
  remittanceProvider: text("remittance_provider"), // 'western_union', 'remitly', 'xoom', 'palawan', 'cebuana', 'mlhuillier'
  remittancePhoneNumber: text("remittance_phone_number"), // Phone number for remittance service
  remittancePin: text("remittance_pin"), // PIN for remittance service (encrypted)
  
  // Enhanced categorization for e-wallets
  eWalletProvider: text("e_wallet_provider"), // 'gcash', 'paymaya', 'grabpay', 'shopeepay', 'coins', 'other'
  eWalletLinkedMobile: text("e_wallet_linked_mobile"), // Mobile number linked to this e-wallet
  
  additionalInfo: json("additional_info").default({}), // Any additional information
  isDefault: boolean("is_default").default(false), // Whether this is the default payment method for the user
  isVerified: boolean("is_verified").default(false), // Whether this payment method has been verified
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Support conversations for AI-assisted and human support
export const supportConversations = pgTable("support_conversations", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().notNull(), // UUID v4 for public API interactions
  userId: integer("user_id").notNull(), // User who started the conversation
  subject: text("subject").notNull(), // Conversation subject
  status: text("status").default('active').notNull(), // 'active', 'resolved', 'pending', 'closed'
  type: text("type").default('ai').notNull(), // 'ai' for AI assistant, 'human' for human agent
  priority: text("priority").default('normal'), // 'low', 'normal', 'high', 'urgent'
  assignedToId: integer("assigned_to_id"), // ID of human agent assigned to conversation (if any)
  lastMessageAt: timestamp("last_message_at").defaultNow(), // When the last message was sent
  metadata: json("metadata").default({}), // Additional metadata about the conversation
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages within support conversations
export const supportMessages = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().notNull(), // UUID v4 for public API interactions
  conversationId: integer("conversation_id").notNull(), // ID of the parent conversation
  userId: integer("user_id"), // User who sent the message (null for system or AI messages)
  agentId: integer("agent_id"), // ID of agent who sent message (null for user or AI messages)
  type: text("type").notNull(), // 'user', 'assistant', 'system'
  content: text("content").notNull(), // Message content
  attachments: json("attachments").default([]), // Array of attachment URLs or IDs
  isRead: boolean("is_read").default(false), // Whether message has been read
  metadata: json("metadata").default({}), // Additional metadata, including AI context
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertQrPaymentSchema = createInsertSchema(qrPayments).omit({
  id: true,
  uuid: true, // UUID will be auto-generated
  createdAt: true,
  updatedAt: true,
});

export const insertTelegramPaymentSchema = createInsertSchema(telegramPayments).omit({
  id: true,
  uuid: true, // UUID will be auto-generated
  createdAt: true,
  updatedAt: true,
});

export const insertManualPaymentSchema = createInsertSchema(manualPayments).omit({
  id: true,
  uuid: true, // UUID will be auto-generated
  createdAt: true,
  updatedAt: true,
});

export const insertUserPreferenceSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserPaymentMethodSchema = createInsertSchema(userPaymentMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// API Request schemas for casino and payment provider
export const generateQrCodeSchema = z.object({
  userId: z.number(),
  username: z.string(),
  amount: z.number().min(100).max(50000),
  casinoId: z.string(),
  currency: z.string().default("PHP")
});

export const verifyPaymentSchema = z.object({
  paymentReference: z.string(),
  transactionId: z.string().optional(),
  amount: z.number(),
  currency: z.string().default("PHP"),
  status: z.enum(['success', 'failed', 'pending'])
});

export const updateBalanceSchema = z.object({
  userId: z.number(),
  casinoId: z.string(),
  amount: z.number(),
  currency: z.string().default("PHP"),
  transactionId: z.string()
});

// Multi-currency schemas
export const currencySchema = z.enum(['PHP', 'PHPT', 'USDT']);

export const updatePreferredCurrencySchema = z.object({
  userId: z.number(),
  currency: currencySchema
});

export const getCurrencyBalanceSchema = z.object({
  userId: z.number(),
  currency: currencySchema
});

export const exchangeCurrencySchema = z.object({
  userId: z.number(), 
  fromCurrency: currencySchema,
  toCurrency: currencySchema,
  amount: z.number().positive()
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
  token: z.string()
});

export const allowedTopManagersSchema = z.array(z.string()).min(1);

export const updateUserPreferenceSchema = z.object({
  userId: z.number(), 
  key: z.string(),
  value: z.any(),
});

export const getUserPreferenceSchema = z.object({
  userId: z.number(),
  key: z.string()
});

// Type definitions for the role management system
export type UserRole = 'player' | 'agent' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'inactive' | 'pending_review';

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type QrPayment = typeof qrPayments.$inferSelect;
export type InsertQrPayment = z.infer<typeof insertQrPaymentSchema>;

export type TelegramPayment = typeof telegramPayments.$inferSelect;
export type InsertTelegramPayment = z.infer<typeof insertTelegramPaymentSchema>;

export type ManualPayment = typeof manualPayments.$inferSelect;
export type InsertManualPayment = z.infer<typeof insertManualPaymentSchema>;

export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = z.infer<typeof insertUserPreferenceSchema>;

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;

export type UserPaymentMethod = typeof userPaymentMethods.$inferSelect;
export type InsertUserPaymentMethod = z.infer<typeof insertUserPaymentMethodSchema>;

// Support conversations for AI-powered assistant are defined above

export const insertSupportConversationSchema = createInsertSchema(supportConversations).omit({
  id: true,
  uuid: true,
  createdAt: true,
  updatedAt: true,
  lastMessageAt: true,
});

export const insertSupportMessageSchema = createInsertSchema(supportMessages).omit({
  id: true,
  uuid: true,
  createdAt: true,
  updatedAt: true,
});

export type SupportConversation = typeof supportConversations.$inferSelect;
export type InsertSupportConversation = z.infer<typeof insertSupportConversationSchema>;

export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;

// Add schema for Telegram payment requests
export const generateTelegramPaymentSchema = z.object({
  userId: z.number(),
  username: z.string(),
  amount: z.number().min(10).max(1000000),
  casinoId: z.string(),
  currency: z.string().default("PHPT")
});

// Add schema for manual payment requests
export const manualPaymentSchema = z.object({
  amount: z.number().min(100).max(100000),
  paymentMethod: z.enum(['gcash', 'paymaya', 'bank_transfer', 'remittance', 'other']),
  notes: z.string().optional(),
  reference: z.string()
});

export type GenerateQrCodeRequest = z.infer<typeof generateQrCodeSchema>;
export type GenerateTelegramPaymentRequest = z.infer<typeof generateTelegramPaymentSchema>;
export type VerifyPaymentRequest = z.infer<typeof verifyPaymentSchema>;
export type UpdateBalanceRequest = z.infer<typeof updateBalanceSchema>;

// Multi-currency types
export type Currency = z.infer<typeof currencySchema>;
export type UpdatePreferredCurrencyRequest = z.infer<typeof updatePreferredCurrencySchema>;
export type GetCurrencyBalanceRequest = z.infer<typeof getCurrencyBalanceSchema>;
export type ExchangeCurrencyRequest = z.infer<typeof exchangeCurrencySchema>;
export type CurrencyBalances = Record<Currency, string>;

// 747 Casino-specific types
export type CasinoDepositRequest = z.infer<typeof casinoDepositSchema>;
export type CasinoWithdrawRequest = z.infer<typeof casinoWithdrawSchema>;
export type CasinoTransferRequest = z.infer<typeof casinoTransferSchema>;
export type CasinoGetUserDetailsRequest = z.infer<typeof casinoGetUserDetailsSchema>;

// Auth types
export type LoginRequest = z.infer<typeof loginSchema>;
export type AuthRequest = z.infer<typeof authSchema>;
export type AllowedTopManagers = z.infer<typeof allowedTopManagersSchema>;

// User preferences types
export type UpdateUserPreferenceRequest = z.infer<typeof updateUserPreferenceSchema>;
export type GetUserPreferenceRequest = z.infer<typeof getUserPreferenceSchema>;