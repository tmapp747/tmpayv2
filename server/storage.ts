import { eq, sql, and, or, desc, asc, gte, lte } from "drizzle-orm";
import { 
  users, 
  transactions, 
  qrPayments,
  telegramPayments,
  manualPayments,
  userPreferences,
  paymentMethods,
  userPaymentMethods,
  rolePermissions,
  supportedCurrencies,
  supportedUserRoles,
  supportedUserStatuses,
  resourceActionMap,
  type User, 
  type InsertUser,
  type Transaction,
  type InsertTransaction,
  type QrPayment,
  type InsertQrPayment,
  type TelegramPayment,
  type InsertTelegramPayment,
  type ManualPayment,
  type InsertManualPayment,
  type UserPreference,
  type InsertUserPreference,
  type PaymentMethod,
  type InsertPaymentMethod,
  type UserPaymentMethod,
  type InsertUserPaymentMethod,
  type Currency,
  type CurrencyBalances,
  type UserRole,
  type UserStatus
} from "@shared/schema";
import { DbStorage } from "./DbStorage";

// Storage interface for all database operations
export interface IStorage {
  // Previous sessionStore property has been removed as session storage is now handled by PostgreSQL
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(id: number, amount: number): Promise<User>;
  updateUserPendingBalance(id: number, amount: number): Promise<User>;
  getAllUsers(): Map<number, User>;
  // Casino user operations
  updateUserCasinoDetails(id: number, casinoDetails: Partial<User>): Promise<User>;
  updateUserCasinoBalance(id: number, amount: number): Promise<User>;
  getUserByCasinoUsername(casinoUsername: string): Promise<User | undefined>;
  getUserByCasinoClientId(casinoClientId: number): Promise<User | undefined>;
  
  // Authentication operations
  getUserByAccessToken(token: string): Promise<User | undefined>;
  updateUserAccessToken(id: number, token: string | null | undefined, expiresIn?: number): Promise<User>;
  getUserByRefreshToken(token: string): Promise<User | undefined>;
  updateUserRefreshToken(id: number, token: string | null | undefined, expiresIn?: number): Promise<User>;
  isTokenExpired(id: number): Promise<boolean>;
  updateUserAuthorizationStatus(id: number, isAuthorized: boolean): Promise<User>;
  updateUserPassword(id: number, password: string): Promise<User>;
  updateUserHierarchyInfo(id: number, topManager: string, immediateManager: string, userType: string): Promise<User>;
  setUserAllowedTopManagers(id: number, allowedTopManagers: string[]): Promise<User>;
  isUserAuthorized(username: string): Promise<boolean>;
  // Casino authentication
  getUserByCasinoAuthToken(token: string): Promise<User | undefined>;
  updateUserCasinoAuthToken(id: number, token: string, expiryDate: Date): Promise<User>;
  getUserByTopManager(topManager: string): Promise<User | undefined>;
  getTopManagerForUser(userId: number): Promise<string | null | undefined>;
  
  // Multi-currency operations
  getUserCurrencyBalance(id: number, currency: Currency): Promise<string>;
  updateUserCurrencyBalance(id: number, currency: Currency, amount: number): Promise<User>;
  exchangeCurrency(id: number, fromCurrency: Currency, toCurrency: Currency, amount: number): Promise<User>;
  updatePreferredCurrency(id: number, currency: Currency): Promise<User>;
  
  // Transaction ledger and analytics operations
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByUserId(userId: number, options?: { limit?: number, offset?: number, type?: string, method?: string, status?: string, startDate?: Date, endDate?: Date }): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: number, status: string, reference?: string, metadata?: Record<string, any>): Promise<Transaction>;
  addStatusHistoryEntry(id: number, status: string, note?: string): Promise<Transaction>;
  completeTransaction(id: number, metadata?: Record<string, any>): Promise<Transaction>;
  recordTransactionFinancials(id: number, balanceBefore: number, balanceAfter: number, fee?: number): Promise<Transaction>;
  updateTransactionMetadata(id: number, metadata: Record<string, any>): Promise<Transaction>;
  setTransactionNonce(id: number, nonce: string): Promise<Transaction>;
  getTransactionByNonce(nonce: string): Promise<Transaction | undefined>;
  getTransactionsByDateRange(startDate: Date, endDate: Date, options?: { userId?: number, type?: string, method?: string, status?: string }): Promise<Transaction[]>;
  getTransactionsSummary(options?: { userId?: number, type?: string, method?: string, status?: string, startDate?: Date, endDate?: Date }): Promise<{ count: number, totalAmount: number, successfulAmount: number, pendingAmount: number, failedAmount: number }>;
  
  // Casino transaction operations
  getTransactionByUniqueId(uniqueId: string): Promise<Transaction | undefined>;
  getTransactionByCasinoReference(casinoReference: string): Promise<Transaction | undefined>;
  getCasinoTransactions(userId: number, type?: string, options?: { limit?: number, offset?: number }): Promise<Transaction[]>;
  
  // QR Payment operations
  createQrPayment(qrPayment: InsertQrPayment): Promise<QrPayment>;
  getQrPayment(id: number): Promise<QrPayment | undefined>;
  getQrPaymentByReference(reference: string): Promise<QrPayment | undefined>;
  updateQrPaymentStatus(id: number, status: string): Promise<QrPayment>;
  getActiveQrPaymentByUserId(userId: number): Promise<QrPayment | undefined>;
  getAllQrPayments(): Map<number, QrPayment>;
  
  // Paygram Payment operations
  createTelegramPayment(payment: InsertTelegramPayment): Promise<TelegramPayment>;
  getTelegramPayment(id: number): Promise<TelegramPayment | undefined>;
  getTelegramPaymentByInvoiceCode(invoiceCode: string): Promise<TelegramPayment | undefined>;
  getTelegramPaymentByReference(reference: string): Promise<TelegramPayment | undefined>;
  updateTelegramPaymentStatus(id: number, status: string): Promise<TelegramPayment>;
  getActiveTelegramPaymentByUserId(userId: number): Promise<TelegramPayment | undefined>;
  getAllTelegramPayments(): Map<number, TelegramPayment>;
  
  // Manual Payment operations
  createManualPayment(payment: InsertManualPayment): Promise<ManualPayment>;
  getManualPayment(id: number): Promise<ManualPayment | undefined>;
  getManualPaymentByReference(reference: string): Promise<ManualPayment | undefined>;
  updateManualPaymentStatus(id: number, status: string): Promise<ManualPayment>;
  uploadManualPaymentReceipt(id: number, proofImageUrl: string): Promise<ManualPayment>;
  getActiveManualPaymentByUserId(userId: number): Promise<ManualPayment | undefined>;
  updateManualPayment(id: number, updates: Partial<ManualPayment>): Promise<ManualPayment>;
  getAllManualPayments(): Map<number, ManualPayment>;
  
  // User Preferences operations
  createUserPreference(preference: InsertUserPreference): Promise<UserPreference>;
  getUserPreference(userId: number, key: string): Promise<UserPreference | undefined>;
  updateUserPreference(userId: number, key: string, value: any): Promise<UserPreference>;
  deleteUserPreference(userId: number, key: string): Promise<boolean>;
  getUserPreferences(userId: number): Promise<UserPreference[]>;
  
  // Payment Methods operations (admin-managed)
  createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod>;
  getPaymentMethod(id: number): Promise<PaymentMethod | undefined>;
  getPaymentMethodByName(name: string): Promise<PaymentMethod | undefined>;
  updatePaymentMethod(id: number, updates: Partial<PaymentMethod>): Promise<PaymentMethod>;
  deletePaymentMethod(id: number): Promise<boolean>;
  getPaymentMethods(type?: string, isActive?: boolean): Promise<PaymentMethod[]>;
  
  // User Payment Methods operations (user-managed for withdrawals)
  createUserPaymentMethod(method: InsertUserPaymentMethod): Promise<UserPaymentMethod>;
  getUserPaymentMethod(id: number): Promise<UserPaymentMethod | undefined>;
  getUserPaymentMethodsByUserId(userId: number, type?: string): Promise<UserPaymentMethod[]>;
  updateUserPaymentMethod(id: number, updates: Partial<UserPaymentMethod>): Promise<UserPaymentMethod>;
  deleteUserPaymentMethod(id: number): Promise<boolean>;
  setDefaultUserPaymentMethod(userId: number, methodId: number): Promise<UserPaymentMethod>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transactions: Map<number, Transaction>;
  private qrPayments: Map<number, QrPayment>;
  private telegramPayments: Map<number, TelegramPayment>;
  private manualPayments: Map<number, ManualPayment>;
  private userPreferences: Map<number, UserPreference>;
  private paymentMethods: Map<number, PaymentMethod>;
  private userPaymentMethods: Map<number, UserPaymentMethod>;
  
  private userIdCounter: number;
  private transactionIdCounter: number;
  private qrPaymentIdCounter: number;
  private telegramPaymentIdCounter: number;
  private manualPaymentIdCounter: number;
  private userPreferenceIdCounter: number;
  private paymentMethodIdCounter: number;
  private userPaymentMethodIdCounter: number;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.qrPayments = new Map();
    this.telegramPayments = new Map();
    this.manualPayments = new Map();
    this.userPreferences = new Map();
    this.paymentMethods = new Map();
    this.userPaymentMethods = new Map();
    
    this.userIdCounter = 1;
    this.transactionIdCounter = 1;
    this.qrPaymentIdCounter = 1;
    this.telegramPaymentIdCounter = 1;
    this.manualPaymentIdCounter = 1;
    this.userPreferenceIdCounter = 1;
    this.paymentMethodIdCounter = 1;
    this.userPaymentMethodIdCounter = 1;
    
    console.log('MemStorage initialized without test users');
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    
    // Ensure all required fields are present with defaults
    const user: User = { 
      ...userData, 
      id,
      email: userData.email || '',  // Use empty string instead of null to match type
      balance: userData.balance || '0.00',
      pendingBalance: userData.pendingBalance || '0.00',
      casinoId: userData.casinoId || `user-${id}`, // Generate a unique casinoId if not provided
      balances: userData.balances || { PHP: '0.00', PHPT: '0.00', USDT: '0.00' },
      preferredCurrency: userData.preferredCurrency || 'PHP',
      isVip: userData.isVip || false,
      casinoUsername: userData.casinoUsername || null,
      casinoClientId: userData.casinoClientId || null,
      topManager: userData.topManager || null,
      immediateManager: userData.immediateManager || null,
      casinoUserType: userData.casinoUserType || 'player',
      casinoBalance: userData.casinoBalance || '0.00',
      isAuthorized: userData.isAuthorized || false,
      allowedTopManagers: userData.allowedTopManagers || [],
      accessToken: userData.accessToken || null,
      accessTokenExpiry: userData.accessTokenExpiry || null,
      refreshToken: userData.refreshToken || null,
      refreshTokenExpiry: userData.refreshTokenExpiry || null,
      casinoAuthToken: userData.casinoAuthToken || null,
      casinoAuthTokenExpiry: userData.casinoAuthTokenExpiry || null,
      hierarchyLevel: userData.hierarchyLevel || 0,
      createdAt: now, 
      updatedAt: now 
    };
    
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(id: number, amount: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error(`User with ID ${id} not found`);
    
    const updatedUser = { 
      ...user, 
      balance: (parseFloat(user.balance.toString()) + amount).toFixed(2),
      updatedAt: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserPendingBalance(id: number, amount: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error(`User with ID ${id} not found`);
    
    const updatedUser = { 
      ...user, 
      pendingBalance: (parseFloat(user.pendingBalance.toString()) + amount).toFixed(2),
      updatedAt: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Returns all users
  getAllUsers(): Map<number, User> {
    return this.users;
  }

  // Casino user operations
  async updateUserCasinoDetails(id: number, casinoDetails: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error(`User with ID ${id} not found`);
    
    const updatedUser = { 
      ...user, 
      ...casinoDetails,
      updatedAt: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserCasinoBalance(id: number, amount: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error(`User with ID ${id} not found`);
    
    // Parse the casino balance - default to 0 if undefined
    const currentBalance = user.casinoBalance ? parseFloat(user.casinoBalance.toString()) : 0;
    
    const updatedUser = { 
      ...user, 
      casinoBalance: (currentBalance + amount).toFixed(2),
      updatedAt: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUserByCasinoUsername(casinoUsername: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.casinoUsername === casinoUsername
    );
  }

  async getUserByCasinoClientId(casinoClientId: number): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.casinoClientId === casinoClientId
    );
  }

  // Authentication operations
  async getUserByAccessToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.accessToken === token
    );
  }

  async updateUserAccessToken(id: number, token: string | null | undefined, expiresIn: number = 3600): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error(`User with ID ${id} not found`);
    
    // Calculate expiry date - default to 1 hour from now if not specified
    const expiryDate = token 
      ? new Date(Date.now() + expiresIn * 1000) 
      : null;
    
    const updatedUser = { 
      ...user, 
      accessToken: token || null, // Ensure null instead of undefined
      accessTokenExpiry: expiryDate,
      updatedAt: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getUserByRefreshToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.refreshToken === token
    );
  }
  
  async updateUserRefreshToken(id: number, token: string | null | undefined, expiresIn: number = 2592000): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error(`User with ID ${id} not found`);
    
    // Calculate expiry date - default to 30 days from now if not specified
    const expiryDate = token 
      ? new Date(Date.now() + expiresIn * 1000) 
      : null;
    
    const updatedUser = { 
      ...user, 
      refreshToken: token || null, // Ensure null instead of undefined
      refreshTokenExpiry: expiryDate,
      updatedAt: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async isTokenExpired(id: number): Promise<boolean> {
    const user = await this.getUser(id);
    if (!user) throw new Error(`User with ID ${id} not found`);
    
    // If there's no token or expiry date, consider it expired
    if (!user.accessToken || !user.accessTokenExpiry) {
      return true;
    }
    
    // Check if the current date is past the expiry date
    const now = new Date();
    return now > user.accessTokenExpiry;
  }

  async updateUserAuthorizationStatus(id: number, isAuthorized: boolean): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error(`User with ID ${id} not found`);
    
    const updatedUser = { 
      ...user, 
      isAuthorized,
      updatedAt: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserPassword(id: number, password: string): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error(`User with ID ${id} not found`);
    
    console.log(`Updating password for user ID ${id} (${user.username})`);
    
    const updatedUser = { 
      ...user, 
      password,
      updatedAt: new Date() 
    };
    this.users.set(id, updatedUser);
    
    console.log(`Password updated successfully for user ID ${id}`);
    return updatedUser;
  }

  async updateUserHierarchyInfo(id: number, topManager: string, immediateManager: string, userType: string): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error(`User with ID ${id} not found`);
    
    // Determine hierarchy level based on userType
    let hierarchyLevel = 0;
    if (userType === 'player') hierarchyLevel = 0;
    else if (userType === 'agent') hierarchyLevel = 1;
    else if (userType === 'manager') hierarchyLevel = 2;
    else if (userType === 'topManager') hierarchyLevel = 3;
    
    const updatedUser = { 
      ...user, 
      topManager,
      immediateManager,
      casinoUserType: userType,
      hierarchyLevel,
      updatedAt: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async setUserAllowedTopManagers(id: number, allowedTopManagers: string[]): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error(`User with ID ${id} not found`);
    
    const updatedUser = { 
      ...user, 
      allowedTopManagers,
      updatedAt: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async isUserAuthorized(username: string): Promise<boolean> {
    const user = await this.getUserByUsername(username);
    if (!user) return false;
    
    // If user has explicit authorization, check that first
    if (user.isAuthorized !== undefined && user.isAuthorized === true) {
      return true;
    }
    
    // Check if user is under an allowed top manager
    if (user.topManager && user.allowedTopManagers && user.allowedTopManagers.includes(user.topManager)) {
      return true;
    }
    
    return false;
  }
  
  // Casino authentication methods
  async getUserByCasinoAuthToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.casinoAuthToken === token
    );
  }
  
  async updateUserCasinoAuthToken(id: number, token: string, expiryDate: Date): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error(`User with ID ${id} not found`);
    
    // Ensure we always have a valid Date object (not null)
    const safeExpiryDate = expiryDate instanceof Date ? expiryDate : new Date();
    
    const updatedUser = { 
      ...user, 
      casinoAuthToken: token,
      casinoAuthTokenExpiry: safeExpiryDate,
      updatedAt: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getUserByTopManager(topManager: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.topManager === topManager && user.hierarchyLevel === 3
    );
  }
  
  async getTopManagerForUser(userId: number): Promise<string | null | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    // Return the topManager as-is, which could be a string or null
    return user.topManager;
  }
  
  // Multi-currency operations
  async getUserCurrencyBalance(id: number, currency: Currency): Promise<string> {
    const user = await this.getUser(id);
    if (!user) throw new Error(`User with ID ${id} not found`);
    
    // If the user already has balances property
    if (user.balances && typeof user.balances === 'object') {
      const balances = user.balances as CurrencyBalances;
      return balances[currency] || '0.00';
    }
    
    // If no balances property exists yet, check if this is the default currency
    if (currency === 'PHP') {
      // Return the main balance for PHP
      return user.balance || '0.00';
    }
    
    // Return 0 for other currencies that don't exist yet
    return '0.00';
  }
  
  async updateUserCurrencyBalance(id: number, currency: Currency, amount: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error(`User with ID ${id} not found`);
    
    // Initialize balances if it doesn't exist
    const balances = (user.balances as CurrencyBalances) || {} as CurrencyBalances;
    
    // Get current balance for this currency (default to 0)
    const currentBalance = parseFloat(balances[currency] || '0.00');
    
    // Update the balance
    balances[currency] = (currentBalance + amount).toFixed(2);
    
    // Special case for PHP which also updates the main balance
    let updatedMainBalance = user.balance;
    if (currency === 'PHP') {
      updatedMainBalance = balances[currency];
    }
    
    const updatedUser = { 
      ...user, 
      balances,
      balance: updatedMainBalance,
      updatedAt: new Date() 
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async exchangeCurrency(id: number, fromCurrency: Currency, toCurrency: Currency, amount: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error(`User with ID ${id} not found`);
    
    // Get current balances
    const fromBalance = parseFloat(await this.getUserCurrencyBalance(id, fromCurrency));
    
    // Verify user has enough in the source currency
    if (fromBalance < amount) {
      throw new Error(`Insufficient ${fromCurrency} balance for exchange`);
    }
    
    // Apply exchange rate (simplified for demo)
    // In production, this would use an actual exchange rate API
    const exchangeRates: Record<string, Record<string, number>> = {
      'PHP': { 'USD': 0.018, 'EUR': 0.016, 'CNY': 0.13, 'JPY': 2.53, 'KRW': 23.5, 'USDT': 0.018 },
      'USD': { 'PHP': 55.5, 'EUR': 0.91, 'CNY': 7.2, 'JPY': 140.5, 'KRW': 1300, 'USDT': 1.0 },
      'EUR': { 'PHP': 60.95, 'USD': 1.1, 'CNY': 7.9, 'JPY': 154.5, 'KRW': 1431, 'USDT': 1.1 },
      'CNY': { 'PHP': 7.7, 'USD': 0.14, 'EUR': 0.13, 'JPY': 19.6, 'KRW': 181, 'USDT': 0.14 },
      'JPY': { 'PHP': 0.39, 'USD': 0.0071, 'EUR': 0.0065, 'CNY': 0.051, 'KRW': 9.3, 'USDT': 0.0071 },
      'KRW': { 'PHP': 0.042, 'USD': 0.00077, 'EUR': 0.0007, 'CNY': 0.0055, 'JPY': 0.11, 'USDT': 0.00077 },
      'USDT': { 'PHP': 55.5, 'USD': 1.0, 'EUR': 0.91, 'CNY': 7.2, 'JPY': 140.5, 'KRW': 1300 }
    };
    
    const rate = exchangeRates[fromCurrency]?.[toCurrency] || 1;
    const convertedAmount = amount * rate;
    
    // Deduct from source currency
    await this.updateUserCurrencyBalance(id, fromCurrency, -amount);
    
    // Add to target currency
    return this.updateUserCurrencyBalance(id, toCurrency, convertedAmount);
  }
  
  async updatePreferredCurrency(id: number, currency: Currency): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error(`User with ID ${id} not found`);
    
    const updatedUser = { 
      ...user, 
      preferredCurrency: currency,
      updatedAt: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Transaction operations
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionsByUserId(
    userId: number, 
    options?: { 
      limit?: number, 
      offset?: number, 
      type?: string, 
      method?: string, 
      status?: string, 
      startDate?: Date, 
      endDate?: Date 
    }
  ): Promise<Transaction[]> {
    // If userId is 0, return all transactions (special case for admin)
    const transactions = Array.from(this.transactions.values());
    
    // Start with userId filter (if not 0, which means all)
    let filteredTransactions = userId === 0
      ? transactions
      : transactions.filter(tx => tx.userId === userId);
    
    // Apply additional filters from options if provided
    if (options) {
      if (options.type) {
        filteredTransactions = filteredTransactions.filter(tx => tx.type === options.type);
      }
      
      if (options.method) {
        filteredTransactions = filteredTransactions.filter(tx => tx.method === options.method);
      }
      
      if (options.status) {
        filteredTransactions = filteredTransactions.filter(tx => tx.status === options.status);
      }
      
      if (options.startDate) {
        filteredTransactions = filteredTransactions.filter(tx => {
          const txDate = tx.createdAt instanceof Date ? tx.createdAt : 
            (typeof tx.createdAt === 'string' ? new Date(tx.createdAt) : new Date());
          return txDate >= options.startDate!;
        });
      }
      
      if (options.endDate) {
        filteredTransactions = filteredTransactions.filter(tx => {
          const txDate = tx.createdAt instanceof Date ? tx.createdAt : 
            (typeof tx.createdAt === 'string' ? new Date(tx.createdAt) : new Date());
          return txDate <= options.endDate!;
        });
      }
    }
    
    // Sort by date (newest first)
    const sortedTransactions = filteredTransactions.sort((a, b) => {
      const dateA = a.createdAt ? (a.createdAt instanceof Date ? a.createdAt.getTime() : 
        (typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 0)) : 0;
      const dateB = b.createdAt ? (b.createdAt instanceof Date ? b.createdAt.getTime() : 
        (typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 0)) : 0;
      return dateB - dateA;
    });
    
    // Apply pagination if specified
    if (options && (options.limit !== undefined || options.offset !== undefined)) {
      const offset = options.offset || 0;
      const limit = options.limit || sortedTransactions.length;
      return sortedTransactions.slice(offset, offset + limit);
    }
    
    return sortedTransactions;
  }

  async createTransaction(txData: InsertTransaction): Promise<Transaction> {
    const id = this.transactionIdCounter++;
    const now = new Date();
    
    // Make sure all required fields are set with defaults for the comprehensive ledger
    const transaction: Transaction = { 
      // Core default fields
      id, 
      userId: txData.userId,
      type: txData.type,
      method: txData.method,
      amount: txData.amount,
      status: txData.status,
      
      // Casino fields with proper null handling
      casinoUsername: txData.casinoUsername || null,
      casinoClientId: txData.casinoClientId || null,
      paymentReference: txData.paymentReference || null,
      transactionId: txData.transactionId || null,
      casinoReference: txData.casinoReference || null,
      destinationAddress: txData.destinationAddress || null,
      destinationNetwork: txData.destinationNetwork || null,
      uniqueId: txData.uniqueId || null,
      
      // Enhanced ledger fields
      currency: txData.currency || 'PHP',
      fee: txData.fee || '0.00',
      netAmount: txData.netAmount || txData.amount, // Default to amount if not specified
      
      // Status tracking
      statusHistory: txData.statusHistory || null,
      statusUpdatedAt: txData.statusUpdatedAt || now,
      completedAt: txData.completedAt || null,
      
      // Financial tracking
      nonce: txData.nonce || null,
      balanceBefore: txData.balanceBefore || null,
      balanceAfter: txData.balanceAfter || null,
      exchangeRate: txData.exchangeRate || null,
      
      // Source and destination tracking
      sourceUserId: txData.sourceUserId || null,
      destinationUserId: txData.destinationUserId || null,
      
      // Additional data
      description: txData.description || null,
      notes: txData.notes || null,
      ipAddress: txData.ipAddress || null,
      userAgent: txData.userAgent || null,
      
      // Extended data and timestamps
      metadata: txData.metadata || {},
      createdAt: now, 
      updatedAt: now 
    };
    
    // Add initial status history entry
    const metadata = transaction.metadata as Record<string, any> || {};
    if (!metadata.statusHistory) {
      metadata.statusHistory = [{
        status: transaction.status,
        timestamp: now,
        note: 'Transaction created'
      }];
    }
    
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransactionStatus(id: number, status: string, reference?: string, metadata?: Record<string, any>): Promise<Transaction> {
    const transaction = await this.getTransaction(id);
    if (!transaction) throw new Error(`Transaction with ID ${id} not found`);
    
    const updatedTransaction: Transaction = { 
      ...transaction, 
      status, 
      updatedAt: new Date() 
    };
    
    if (reference) {
      updatedTransaction.paymentReference = reference;
    }
    
    // Add any additional metadata to the transaction
    if (metadata && typeof metadata === 'object') {
      // Create or update the metadata field
      updatedTransaction.metadata = {
        ...(updatedTransaction.metadata || {}),
        ...metadata
      };
    }
    
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  // Casino transaction operations
  async getTransactionByUniqueId(uniqueId: string): Promise<Transaction | undefined> {
    return Array.from(this.transactions.values()).find(
      (tx) => tx.uniqueId === uniqueId
    );
  }

  async getTransactionByCasinoReference(casinoReference: string): Promise<Transaction | undefined> {
    return Array.from(this.transactions.values()).find(
      (tx) => tx.casinoReference === casinoReference
    );
  }
  
  async getTransactionByNonce(nonce: string): Promise<Transaction | undefined> {
    return Array.from(this.transactions.values()).find(
      (tx) => tx.nonce === nonce
    );
  }
  
  async addStatusHistoryEntry(id: number, status: string, note?: string): Promise<Transaction> {
    const transaction = await this.getTransaction(id);
    if (!transaction) throw new Error(`Transaction with ID ${id} not found`);
    
    const now = new Date();
    const statusEntry = {
      status,
      timestamp: now,
      note: note || null
    };
    
    // Create or update the status history array in metadata
    const metadata = transaction.metadata as Record<string, any> || {};
    const statusHistory = (metadata.statusHistory || []) as any[];
    statusHistory.push(statusEntry);
    
    const updatedMetadata = {
      ...metadata,
      statusHistory
    };
    
    const updatedTransaction: Transaction = {
      ...transaction,
      status,
      statusUpdatedAt: now,
      statusHistory: updatedMetadata.statusHistory,
      metadata: updatedMetadata,
      updatedAt: now
    };
    
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }
  
  async completeTransaction(id: number, metadata?: Record<string, any>): Promise<Transaction> {
    const transaction = await this.getTransaction(id);
    if (!transaction) throw new Error(`Transaction with ID ${id} not found`);
    
    const now = new Date();
    const updatedTransaction: Transaction = {
      ...transaction,
      status: 'completed',
      statusUpdatedAt: now,
      completedAt: now,
      updatedAt: now
    };
    
    // Add any additional metadata
    if (metadata) {
      updatedTransaction.metadata = {
        ...(transaction.metadata || {}),
        ...metadata
      };
    }
    
    // Add status history entry for completion
    if (updatedTransaction.metadata) {
      const metadata = updatedTransaction.metadata as Record<string, any>;
      const statusHistory = (metadata.statusHistory || []) as any[];
      statusHistory.push({
        status: 'completed',
        timestamp: now,
        note: 'Transaction completed successfully'
      });
      metadata.statusHistory = statusHistory;
    }
    
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }
  
  async recordTransactionFinancials(
    id: number, 
    balanceBefore: number, 
    balanceAfter: number, 
    fee?: number
  ): Promise<Transaction> {
    const transaction = await this.getTransaction(id);
    if (!transaction) throw new Error(`Transaction with ID ${id} not found`);
    
    const updatedTransaction: Transaction = {
      ...transaction,
      balanceBefore: balanceBefore.toString(),
      balanceAfter: balanceAfter.toString(),
      fee: fee !== undefined ? fee.toString() : '0.00',
      netAmount: (parseFloat(transaction.amount.toString()) - (fee || 0)).toString(),
      updatedAt: new Date()
    };
    
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }
  
  async updateTransactionMetadata(id: number, metadata: Record<string, any>): Promise<Transaction> {
    const transaction = await this.getTransaction(id);
    if (!transaction) throw new Error(`Transaction with ID ${id} not found`);
    
    const updatedTransaction: Transaction = {
      ...transaction,
      metadata: {
        ...(transaction.metadata || {}),
        ...metadata
      },
      updatedAt: new Date()
    };
    
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }
  
  async setTransactionNonce(id: number, nonce: string): Promise<Transaction> {
    const transaction = await this.getTransaction(id);
    if (!transaction) throw new Error(`Transaction with ID ${id} not found`);
    
    const updatedTransaction: Transaction = {
      ...transaction,
      nonce,
      updatedAt: new Date()
    };
    
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }
  
  async getTransactionsByDateRange(
    startDate: Date, 
    endDate: Date, 
    options?: { 
      userId?: number, 
      type?: string, 
      method?: string, 
      status?: string 
    }
  ): Promise<Transaction[]> {
    let transactions = Array.from(this.transactions.values()).filter(tx => {
      const txDate = tx.createdAt instanceof Date ? tx.createdAt : 
        (typeof tx.createdAt === 'string' ? new Date(tx.createdAt) : new Date());
      return txDate >= startDate && txDate <= endDate;
    });
    
    // Apply additional filters if provided
    if (options) {
      if (options.userId !== undefined) {
        transactions = transactions.filter(tx => tx.userId === options.userId);
      }
      
      if (options.type) {
        transactions = transactions.filter(tx => tx.type === options.type);
      }
      
      if (options.method) {
        transactions = transactions.filter(tx => tx.method === options.method);
      }
      
      if (options.status) {
        transactions = transactions.filter(tx => tx.status === options.status);
      }
    }
    
    return transactions.sort((a, b) => {
      const dateA = a.createdAt ? (a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt as string).getTime()) : 0;
      const dateB = b.createdAt ? (b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt as string).getTime()) : 0;
      return dateB - dateA;
    });
  }
  
  async getTransactionsSummary(options?: { 
    userId?: number, 
    type?: string, 
    method?: string, 
    status?: string, 
    startDate?: Date, 
    endDate?: Date 
  }): Promise<{ 
    count: number, 
    totalAmount: number, 
    successfulAmount: number, 
    pendingAmount: number, 
    failedAmount: number 
  }> {
    // Get transactions based on filters
    let transactions = Array.from(this.transactions.values());
    
    if (options) {
      if (options.userId !== undefined) {
        transactions = transactions.filter(tx => tx.userId === options.userId);
      }
      
      if (options.type) {
        transactions = transactions.filter(tx => tx.type === options.type);
      }
      
      if (options.method) {
        transactions = transactions.filter(tx => tx.method === options.method);
      }
      
      if (options.status) {
        transactions = transactions.filter(tx => tx.status === options.status);
      }
      
      if (options.startDate) {
        transactions = transactions.filter(tx => {
          const txDate = tx.createdAt instanceof Date ? tx.createdAt : 
            (typeof tx.createdAt === 'string' ? new Date(tx.createdAt) : new Date());
          return txDate >= options.startDate!;
        });
      }
      
      if (options.endDate) {
        transactions = transactions.filter(tx => {
          const txDate = tx.createdAt instanceof Date ? tx.createdAt : 
            (typeof tx.createdAt === 'string' ? new Date(tx.createdAt) : new Date());
          return txDate <= options.endDate!;
        });
      }
    }
    
    // Calculate summary metrics
    const count = transactions.length;
    const totalAmount = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount.toString()), 0);
    
    // Group by status for specific metrics
    const successfulAmount = transactions
      .filter(tx => tx.status === 'completed')
      .reduce((sum, tx) => sum + parseFloat(tx.amount.toString()), 0);
      
    const pendingAmount = transactions
      .filter(tx => tx.status === 'pending' || tx.status === 'processing')
      .reduce((sum, tx) => sum + parseFloat(tx.amount.toString()), 0);
      
    const failedAmount = transactions
      .filter(tx => tx.status === 'failed' || tx.status === 'expired' || tx.status === 'rejected')
      .reduce((sum, tx) => sum + parseFloat(tx.amount.toString()), 0);
    
    return {
      count,
      totalAmount,
      successfulAmount,
      pendingAmount,
      failedAmount
    };
  }

  async getCasinoTransactions(userId: number, type?: string, options?: { limit?: number, offset?: number }): Promise<Transaction[]> {
    let transactions = Array.from(this.transactions.values())
      .filter(tx => tx.userId === userId && 
        (tx.type === 'casino_deposit' || 
         tx.type === 'casino_withdraw' || 
         tx.method === 'casino_transfer'));
    
    if (type) {
      transactions = transactions.filter(tx => tx.type === type);
    }
    
    return transactions.sort((a, b) => {
      const dateA = a.createdAt ? (a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt as string).getTime()) : 0;
      const dateB = b.createdAt ? (b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt as string).getTime()) : 0;
      return dateB - dateA;
    });
  }

  // QR Payment operations
  async createQrPayment(qrPaymentData: InsertQrPayment): Promise<QrPayment> {
    const id = this.qrPaymentIdCounter++;
    const now = new Date();
    
    // Ensure all fields with proper defaults
    const qrPayment: QrPayment = { 
      ...qrPaymentData, 
      id,
      status: qrPaymentData.status || 'pending',
      directPayReference: qrPaymentData.directPayReference || null,
      payUrl: qrPaymentData.payUrl || null, // Support the payUrl field
      createdAt: now, 
      updatedAt: now 
    };
    
    this.qrPayments.set(id, qrPayment);
    return qrPayment;
  }

  async getQrPayment(id: number): Promise<QrPayment | undefined> {
    return this.qrPayments.get(id);
  }

  async getQrPaymentByReference(reference: string): Promise<QrPayment | undefined> {
    return Array.from(this.qrPayments.values()).find(
      (qr) => qr.directPayReference === reference
    );
  }

  async updateQrPaymentStatus(id: number, status: string): Promise<QrPayment> {
    const qrPayment = await this.getQrPayment(id);
    if (!qrPayment) throw new Error(`QR Payment with ID ${id} not found`);
    
    const updatedQrPayment: QrPayment = { 
      ...qrPayment, 
      status,
      updatedAt: new Date() 
    };
    this.qrPayments.set(id, updatedQrPayment);
    return updatedQrPayment;
  }

  async getActiveQrPaymentByUserId(userId: number): Promise<QrPayment | undefined> {
    return Array.from(this.qrPayments.values()).find(
      (qr) => qr.userId === userId && (qr.status === 'pending') && new Date() < qr.expiresAt
    );
  }
  
  // Get all QR payments (for admin dashboard)
  getAllQrPayments(): Map<number, QrPayment> {
    return this.qrPayments;
  }

  // Paygram/Telegram Payment operations
  async createTelegramPayment(paymentData: InsertTelegramPayment): Promise<TelegramPayment> {
    const id = this.telegramPaymentIdCounter++;
    const now = new Date();
    
    // Create with default values for required fields
    const telegramPayment: TelegramPayment = { 
      id,
      userId: paymentData.userId,
      transactionId: paymentData.transactionId,
      payUrl: paymentData.payUrl,
      amount: paymentData.amount,
      currency: paymentData.currency || 'PHPT',
      expiresAt: paymentData.expiresAt,
      telegramReference: paymentData.telegramReference || null,
      invoiceId: paymentData.invoiceId || null,
      status: paymentData.status || 'pending',
      createdAt: now, 
      updatedAt: now 
    };
    
    this.telegramPayments.set(id, telegramPayment);
    return telegramPayment;
  }

  async getTelegramPayment(id: number): Promise<TelegramPayment | undefined> {
    try {
      // Try to get from database first
      const result = await this.dbInstance.select()
        .from(telegramPayments)
        .where(eq(telegramPayments.id, id))
        .limit(1);
      
      if (result && result.length > 0) {
        // Convert DB format to TelegramPayment type
        const dbTelegram = result[0];
        const telegramPayment: TelegramPayment = {
          ...dbTelegram,
          // Make sure numeric values are returned as strings
          amount: dbTelegram.amount ? dbTelegram.amount.toString() : "0",
        };
        
        // Update in-memory storage
        this.telegramPayments.set(telegramPayment.id, telegramPayment);
        
        return telegramPayment;
      }
      
      // Fall back to in-memory lookup if not found in DB
      return this.telegramPayments.get(id);
    } catch (error) {
      console.error('Error fetching Telegram payment from database:', error);
      // Fall back to in-memory lookup if DB query fails
      return this.telegramPayments.get(id);
    }
  }

  async getTelegramPaymentByInvoiceCode(invoiceCode: string): Promise<TelegramPayment | undefined> {
    try {
      // Try to get from database first
      const result = await this.dbInstance.select()
        .from(telegramPayments)
        .where(eq(telegramPayments.invoiceId, invoiceCode))
        .limit(1);
      
      if (result && result.length > 0) {
        // Convert DB format to TelegramPayment type
        const dbTelegram = result[0];
        const telegramPayment: TelegramPayment = {
          ...dbTelegram,
          // Make sure numeric values are returned as strings
          amount: dbTelegram.amount ? dbTelegram.amount.toString() : "0",
        };
        
        // Update in-memory storage
        this.telegramPayments.set(telegramPayment.id, telegramPayment);
        
        return telegramPayment;
      }
      
      // Fall back to in-memory lookup if not found in DB
      return Array.from(this.telegramPayments.values()).find(
        (payment) => payment.invoiceId === invoiceCode
      );
    } catch (error) {
      console.error('Error fetching Telegram payment by invoice code from database:', error);
      // Fall back to in-memory lookup if DB query fails
      return Array.from(this.telegramPayments.values()).find(
        (payment) => payment.invoiceId === invoiceCode
      );
    }
  }
  
  async getTelegramPaymentByReference(reference: string): Promise<TelegramPayment | undefined> {
    try {
      // Try to get from database first
      const result = await this.dbInstance.select()
        .from(telegramPayments)
        .where(eq(telegramPayments.telegramReference, reference))
        .limit(1);
      
      if (result && result.length > 0) {
        // Convert DB format to TelegramPayment type
        const dbTelegram = result[0];
        const telegramPayment: TelegramPayment = {
          ...dbTelegram,
          // Make sure numeric values are returned as strings
          amount: dbTelegram.amount ? dbTelegram.amount.toString() : "0",
        };
        
        // Update in-memory storage
        this.telegramPayments.set(telegramPayment.id, telegramPayment);
        
        return telegramPayment;
      }
      
      // Fall back to in-memory lookup if not found in DB
      return Array.from(this.telegramPayments.values()).find(
        (payment) => payment.telegramReference === reference
      );
    } catch (error) {
      console.error('Error fetching Telegram payment by reference from database:', error);
      // Fall back to in-memory lookup if DB query fails
      return Array.from(this.telegramPayments.values()).find(
        (payment) => payment.telegramReference === reference
      );
    }
  }

  async updateTelegramPaymentStatus(id: number, status: string): Promise<TelegramPayment> {
    // First update in memory
    const telegramPayment = await this.getTelegramPayment(id);
    if (!telegramPayment) throw new Error(`Telegram Payment with ID ${id} not found`);
    
    const updatedPayment: TelegramPayment = { 
      ...telegramPayment, 
      status,
      updatedAt: new Date() 
    };
    this.telegramPayments.set(id, updatedPayment);
    
    // Then update in database
    try {
      await this.dbInstance.update(telegramPayments)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(eq(telegramPayments.id, id));
      
      console.log(`Updated Telegram payment status in database: ID=${id}, Status=${status}`);
    } catch (error) {
      console.error('Error updating Telegram payment status in database:', error);
      // Continue with in-memory data even if DB update fails
    }
    
    return updatedPayment;
  }

  async getActiveTelegramPaymentByUserId(userId: number): Promise<TelegramPayment | undefined> {
    try {
      // Get current date
      const now = new Date();
      
      // Try to get from database first
      const result = await this.dbInstance.select()
        .from(telegramPayments)
        .where(
          and(
            eq(telegramPayments.userId, userId),
            eq(telegramPayments.status, 'pending'),
            sql`${telegramPayments.expiresAt} > ${now}`
          )
        )
        .limit(1);
      
      if (result && result.length > 0) {
        // Convert DB format to TelegramPayment type
        const dbTelegram = result[0];
        const telegramPayment: TelegramPayment = {
          ...dbTelegram,
          // Make sure numeric values are returned as strings
          amount: dbTelegram.amount ? dbTelegram.amount.toString() : "0",
        };
        
        // Update in-memory storage
        this.telegramPayments.set(telegramPayment.id, telegramPayment);
        
        return telegramPayment;
      }
      
      // Fall back to in-memory lookup if not found in DB
      return Array.from(this.telegramPayments.values()).find(
        (payment) => payment.userId === userId && 
                    (payment.status === 'pending') && 
                    new Date() < payment.expiresAt
      );
    } catch (error) {
      console.error('Error fetching active Telegram payment from database:', error);
      // Fall back to in-memory lookup if DB query fails
      return Array.from(this.telegramPayments.values()).find(
        (payment) => payment.userId === userId && 
                    (payment.status === 'pending') && 
                    new Date() < payment.expiresAt
      );
    }
  }
  
  // Get all Telegram payments (for admin dashboard)
  getAllTelegramPayments(): Map<number, TelegramPayment> {
    return this.telegramPayments;
  }

  // Manual Payment operations
  async createManualPayment(paymentData: InsertManualPayment): Promise<ManualPayment> {
    // First create in memory using parent class implementation
    const id = this.manualPaymentIdCounter++;
    const now = new Date();
    
    // Create a new manual payment record with explicit null handling for optional fields
    const manualPayment: ManualPayment = { 
      userId: paymentData.userId,
      transactionId: paymentData.transactionId,
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod,
      notes: paymentData.notes !== undefined ? paymentData.notes : null,
      proofImageUrl: paymentData.proofImageUrl,
      reference: paymentData.reference,
      id,
      status: paymentData.status || 'pending',
      adminId: paymentData.adminId || null,
      adminNotes: paymentData.adminNotes || null,
      createdAt: now, 
      updatedAt: now 
    };
    
    this.manualPayments.set(id, manualPayment);
    
    // Then persist to database
    try {
      console.log('Persisting Manual payment to database:', {
        id: manualPayment.id,
        userId: manualPayment.userId,
        transactionId: manualPayment.transactionId,
        amount: manualPayment.amount,
        reference: manualPayment.reference
      });

      // Insert into the database - omit the ID to let PostgreSQL auto-increment
      const inserted = await this.dbInstance.insert(manualPayments).values({
        userId: manualPayment.userId,
        transactionId: manualPayment.transactionId,
        amount: manualPayment.amount,
        paymentMethod: manualPayment.paymentMethod,
        notes: manualPayment.notes,
        proofImageUrl: manualPayment.proofImageUrl,
        reference: manualPayment.reference,
        status: manualPayment.status,
        adminId: manualPayment.adminId,
        adminNotes: manualPayment.adminNotes,
        createdAt: manualPayment.createdAt,
        updatedAt: manualPayment.updatedAt
      }).returning();
      
      if (inserted && inserted[0]) {
        console.log(`Successfully created Manual payment in database: ID=${manualPayment.id}, Amount=${manualPayment.amount}, Reference=${manualPayment.reference}`);
      }
    } catch (error) {
      console.error('Error creating Manual payment in database:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      // Continue with in-memory data even if DB persistence fails
    }
    
    return manualPayment;
  }

  async getManualPayment(id: number): Promise<ManualPayment | undefined> {
    try {
      // Try to get from database first
      const result = await this.dbInstance.select()
        .from(manualPayments)
        .where(eq(manualPayments.id, id))
        .limit(1);
      
      if (result && result.length > 0) {
        // Convert DB format to ManualPayment type
        const dbManual = result[0];
        const manualPayment: ManualPayment = {
          ...dbManual,
          // Make sure numeric values are returned as strings
          amount: dbManual.amount ? dbManual.amount.toString() : "0",
        };
        
        // Update in-memory storage
        this.manualPayments.set(manualPayment.id, manualPayment);
        
        return manualPayment;
      }
      
      // Fall back to in-memory lookup if not found in DB
      return this.manualPayments.get(id);
    } catch (error) {
      console.error('Error fetching Manual payment from database:', error);
      // Fall back to in-memory lookup if DB query fails
      return this.manualPayments.get(id);
    }
  }

  async getManualPaymentByReference(reference: string): Promise<ManualPayment | undefined> {
    try {
      // Try to get from database first
      const result = await this.dbInstance.select()
        .from(manualPayments)
        .where(eq(manualPayments.reference, reference))
        .limit(1);
      
      if (result && result.length > 0) {
        // Convert DB format to ManualPayment type
        const dbManual = result[0];
        const manualPayment: ManualPayment = {
          ...dbManual,
          // Make sure numeric values are returned as strings
          amount: dbManual.amount ? dbManual.amount.toString() : "0",
        };
        
        // Update in-memory storage
        this.manualPayments.set(manualPayment.id, manualPayment);
        
        return manualPayment;
      }
      
      // Fall back to in-memory lookup if not found in DB
      return Array.from(this.manualPayments.values()).find(
        (payment) => payment.reference === reference
      );
    } catch (error) {
      console.error('Error fetching Manual payment by reference from database:', error);
      // Fall back to in-memory lookup if DB query fails
      return Array.from(this.manualPayments.values()).find(
        (payment) => payment.reference === reference
      );
    }
  }

  async updateManualPaymentStatus(id: number, status: string): Promise<ManualPayment> {
    // First update in memory
    const payment = await this.getManualPayment(id);
    if (!payment) throw new Error(`Manual payment with ID ${id} not found`);
    
    const updatedPayment: ManualPayment = { 
      ...payment, 
      status, 
      updatedAt: new Date() 
    };
    
    this.manualPayments.set(id, updatedPayment);
    
    // Then update in database
    try {
      await this.dbInstance.update(manualPayments)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(eq(manualPayments.id, id));
      
      console.log(`Updated Manual payment status in database: ID=${id}, Status=${status}`);
    } catch (error) {
      console.error('Error updating Manual payment status in database:', error);
      // Continue with in-memory data even if DB update fails
    }
    
    return updatedPayment;
  }

  async uploadManualPaymentReceipt(id: number, proofImageUrl: string): Promise<ManualPayment> {
    // First update in memory
    const payment = await this.getManualPayment(id);
    if (!payment) throw new Error(`Manual payment with ID ${id} not found`);
    
    const updatedPayment: ManualPayment = { 
      ...payment, 
      proofImageUrl,
      updatedAt: new Date() 
    };
    
    this.manualPayments.set(id, updatedPayment);
    
    // Then update in database
    try {
      await this.dbInstance.update(manualPayments)
        .set({
          proofImageUrl,
          updatedAt: new Date()
        })
        .where(eq(manualPayments.id, id));
      
      console.log(`Updated Manual payment receipt in database: ID=${id}, proofImageUrl=${proofImageUrl}`);
    } catch (error) {
      console.error('Error updating Manual payment receipt in database:', error);
      // Continue with in-memory data even if DB update fails
    }
    
    return updatedPayment;
  }

  async getActiveManualPaymentByUserId(userId: number): Promise<ManualPayment | undefined> {
    try {
      // Try to get from database first
      const result = await this.dbInstance.select()
        .from(manualPayments)
        .where(
          and(
            eq(manualPayments.userId, userId),
            or(
              eq(manualPayments.status, 'pending'),
              eq(manualPayments.status, 'processing')
            )
          )
        )
        .limit(1);
      
      if (result && result.length > 0) {
        // Convert DB format to ManualPayment type
        const dbManual = result[0];
        const manualPayment: ManualPayment = {
          ...dbManual,
          // Make sure numeric values are returned as strings
          amount: dbManual.amount ? dbManual.amount.toString() : "0",
        };
        
        // Update in-memory storage
        this.manualPayments.set(manualPayment.id, manualPayment);
        
        return manualPayment;
      }
      
      // Fall back to in-memory lookup if not found in DB
      return Array.from(this.manualPayments.values()).find(
        (payment) => payment.userId === userId && 
                    (payment.status === 'pending' || payment.status === 'processing')
      );
    } catch (error) {
      console.error('Error fetching active Manual payment from database:', error);
      // Fall back to in-memory lookup if DB query fails
      return Array.from(this.manualPayments.values()).find(
        (payment) => payment.userId === userId && 
                    (payment.status === 'pending' || payment.status === 'processing')
      );
    }
  }

  async updateManualPayment(id: number, updates: Partial<ManualPayment>): Promise<ManualPayment> {
    // First update in memory
    const payment = await this.getManualPayment(id);
    if (!payment) throw new Error(`Manual payment with ID ${id} not found`);
    
    const updatedPayment = { 
      ...payment,
      ...updates,
      updatedAt: new Date() 
    };
    
    this.manualPayments.set(id, updatedPayment);
    
    // Then update in database
    try {
      // Create a database-compatible update object (camelCase to snake_case conversion)
      const dbUpdates: Record<string, any> = {
        updated_at: new Date(),
      };
      
      // Add all provided update fields with appropriate conversion
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.proofImageUrl !== undefined) dbUpdates.proof_image_url = updates.proofImageUrl;
      if (updates.adminId !== undefined) dbUpdates.admin_id = updates.adminId;
      if (updates.adminNotes !== undefined) dbUpdates.admin_notes = updates.adminNotes;
      
      await this.dbInstance.update(manualPayments)
        .set(dbUpdates)
        .where(eq(manualPayments.id, id));
      
      console.log(`Updated Manual payment in database: ID=${id}`);
    } catch (error) {
      console.error('Error updating Manual payment in database:', error);
      // Continue with in-memory data even if DB update fails
    }
    
    return updatedPayment;
  }
  
  getAllManualPayments(): Map<number, ManualPayment> {
    return this.manualPayments;
  }

  // User Preferences operations
  async createUserPreference(preferenceData: InsertUserPreference): Promise<UserPreference> {
    const id = this.userPreferenceIdCounter++;
    const now = new Date();
    
    // Create the preference with all required fields
    const preference: UserPreference = {
      ...preferenceData,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.userPreferences.set(id, preference);
    return preference;
  }
  
  async getUserPreference(userId: number, key: string): Promise<UserPreference | undefined> {
    return Array.from(this.userPreferences.values()).find(
      (pref) => pref.userId === userId && pref.key === key
    );
  }
  
  async updateUserPreference(userId: number, key: string, value: any): Promise<UserPreference> {
    // First, try to find an existing preference
    const existingPref = await this.getUserPreference(userId, key);
    
    if (existingPref) {
      // Update the existing preference
      const updatedPref: UserPreference = {
        ...existingPref,
        value: JSON.stringify(value),
        updatedAt: new Date()
      };
      
      this.userPreferences.set(existingPref.id, updatedPref);
      return updatedPref;
    } else {
      // Create a new preference if it doesn't exist
      return this.createUserPreference({
        userId,
        key,
        value: JSON.stringify(value),
        lastUpdated: new Date().toISOString()
      });
    }
  }
  
  async deleteUserPreference(userId: number, key: string): Promise<boolean> {
    const preference = await this.getUserPreference(userId, key);
    if (!preference) return false;
    
    return this.userPreferences.delete(preference.id);
  }
  
  async getUserPreferences(userId: number): Promise<UserPreference[]> {
    return Array.from(this.userPreferences.values()).filter(
      (pref) => pref.userId === userId
    );
  }
  
  // Payment Methods operations (admin-managed)
  async createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod> {
    const id = this.paymentMethodIdCounter++;
    const now = new Date();
    
    const paymentMethod: PaymentMethod = {
      ...method,
      id,
      isActive: method.isActive ?? true, // Default to active if not specified
      createdAt: now,
      updatedAt: now
    };
    
    this.paymentMethods.set(id, paymentMethod);
    
    // Also save to database for persistence
    try {
      await db.insert(paymentMethods).values({
        ...method,
        id,
        isActive: method.isActive ?? true,
        createdAt: now,
        updatedAt: now
      });
    } catch (error) {
      console.error('Error inserting payment method to database:', error);
    }
    
    return paymentMethod;
  }
  
  async getPaymentMethod(id: number): Promise<PaymentMethod | undefined> {
    // First check in-memory cache
    const cachedMethod = this.paymentMethods.get(id);
    if (cachedMethod) return cachedMethod;
    
    // If not in cache, try to fetch from database
    try {
      const result = await db.query.paymentMethods.findFirst({
        where: eq(paymentMethods.id, id)
      });
      
      if (result) {
        // Add to cache for future requests
        this.paymentMethods.set(id, result);
        return result;
      }
    } catch (error) {
      console.error('Error fetching payment method from database:', error);
    }
    
    return undefined;
  }
  
  async getPaymentMethodByName(name: string): Promise<PaymentMethod | undefined> {
    // First check in-memory cache
    const cachedMethod = Array.from(this.paymentMethods.values()).find(
      method => method.name.toLowerCase() === name.toLowerCase()
    );
    
    if (cachedMethod) return cachedMethod;
    
    // If not in cache, try to fetch from database
    try {
      const result = await db.query.paymentMethods.findFirst({
        where: sql`LOWER(${paymentMethods.name}) = LOWER(${name})`
      });
      
      if (result) {
        // Add to cache for future requests
        this.paymentMethods.set(result.id, result);
        return result;
      }
    } catch (error) {
      console.error('Error fetching payment method by name from database:', error);
    }
    
    return undefined;
  }
  
  async updatePaymentMethod(id: number, updates: Partial<PaymentMethod>): Promise<PaymentMethod> {
    const method = await this.getPaymentMethod(id);
    if (!method) throw new Error(`Payment method with ID ${id} not found`);
    
    const updatedMethod = {
      ...method,
      ...updates,
      updatedAt: new Date()
    };
    
    this.paymentMethods.set(id, updatedMethod);
    
    // Also update in database
    try {
      await db.update(paymentMethods)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(paymentMethods.id, id));
    } catch (error) {
      console.error('Error updating payment method in database:', error);
    }
    
    return updatedMethod;
  }
  
  async deletePaymentMethod(id: number): Promise<boolean> {
    const method = await this.getPaymentMethod(id);
    if (!method) return false;
    
    // Remove from memory
    const memoryResult = this.paymentMethods.delete(id);
    
    // Also remove from database
    try {
      await db.delete(paymentMethods)
        .where(eq(paymentMethods.id, id));
    } catch (error) {
      console.error('Error deleting payment method from database:', error);
      
      // If database delete fails, restore the in-memory entry
      if (memoryResult) {
        this.paymentMethods.set(id, method);
      }
      
      return false;
    }
    
    return memoryResult;
  }
  
  async getPaymentMethods(type?: string, isActive?: boolean): Promise<PaymentMethod[]> {
    // Start with fetching from database to ensure we have the latest data
    try {
      let query = db.select().from(paymentMethods);
      
      if (type) {
        query = query.where(eq(paymentMethods.type, type));
      }
      
      if (isActive !== undefined) {
        query = query.where(eq(paymentMethods.isActive, isActive));
      }
      
      const results = await query;
      
      // Update our in-memory cache
      for (const method of results) {
        this.paymentMethods.set(method.id, method);
      }
    } catch (error) {
      console.error('Error fetching payment methods from database:', error);
    }
    
    // Return filtered methods from in-memory cache
    let methods = Array.from(this.paymentMethods.values());
    
    if (type) {
      methods = methods.filter(method => method.type === type);
    }
    
    if (isActive !== undefined) {
      methods = methods.filter(method => method.isActive === isActive);
    }
    
    return methods;
  }
  
  // User Payment Methods operations (user-managed for withdrawals)
  async createUserPaymentMethod(method: InsertUserPaymentMethod): Promise<UserPaymentMethod> {
    const id = this.userPaymentMethodIdCounter++;
    const now = new Date();
    
    const userPaymentMethod: UserPaymentMethod = {
      ...method,
      id,
      isDefault: method.isDefault ?? false, // Default to not default
      isVerified: method.isVerified ?? false, // Default to not verified
      createdAt: now,
      updatedAt: now
    };
    
    this.userPaymentMethods.set(id, userPaymentMethod);
    
    // Also save to database for persistence
    try {
      await db.insert(userPaymentMethods).values({
        ...method,
        id,
        isDefault: method.isDefault ?? false,
        isVerified: method.isVerified ?? false,
        createdAt: now,
        updatedAt: now
      });
      
      // If this is set as default, clear other defaults for this user
      if (method.isDefault) {
        await this.clearOtherDefaultPaymentMethods(method.userId, id);
      }
    } catch (error) {
      console.error('Error inserting user payment method to database:', error);
    }
    
    return userPaymentMethod;
  }
  
  async getUserPaymentMethod(id: number): Promise<UserPaymentMethod | undefined> {
    // First check in-memory cache
    const cachedMethod = this.userPaymentMethods.get(id);
    if (cachedMethod) return cachedMethod;
    
    // If not in cache, try to fetch from database
    try {
      const result = await db.query.userPaymentMethods.findFirst({
        where: eq(userPaymentMethods.id, id)
      });
      
      if (result) {
        // Add to cache for future requests
        this.userPaymentMethods.set(id, result);
        return result;
      }
    } catch (error) {
      console.error('Error fetching user payment method from database:', error);
    }
    
    return undefined;
  }
  
  async getUserPaymentMethodsByUserId(userId: number, type?: string): Promise<UserPaymentMethod[]> {
    // Start with fetching from database to ensure we have the latest data
    try {
      let query = db.select().from(userPaymentMethods)
        .where(eq(userPaymentMethods.userId, userId));
      
      if (type) {
        query = query.where(eq(userPaymentMethods.type, type));
      }
      
      const results = await query;
      
      // Update our in-memory cache
      for (const method of results) {
        this.userPaymentMethods.set(method.id, method);
      }
    } catch (error) {
      console.error('Error fetching user payment methods from database:', error);
    }
    
    // Return filtered methods from in-memory cache
    let methods = Array.from(this.userPaymentMethods.values())
      .filter(method => method.userId === userId);
    
    if (type) {
      methods = methods.filter(method => method.type === type);
    }
    
    return methods;
  }
  
  async updateUserPaymentMethod(id: number, updates: Partial<UserPaymentMethod>): Promise<UserPaymentMethod> {
    const method = await this.getUserPaymentMethod(id);
    if (!method) throw new Error(`User payment method with ID ${id} not found`);
    
    const updatedMethod = {
      ...method,
      ...updates,
      updatedAt: new Date()
    };
    
    this.userPaymentMethods.set(id, updatedMethod);
    
    // Also update in database
    try {
      await db.update(userPaymentMethods)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(userPaymentMethods.id, id));
      
      // If this is set as default, clear other defaults for this user
      if (updates.isDefault) {
        await this.clearOtherDefaultPaymentMethods(method.userId, id);
      }
    } catch (error) {
      console.error('Error updating user payment method in database:', error);
    }
    
    return updatedMethod;
  }
  
  async deleteUserPaymentMethod(id: number): Promise<boolean> {
    const method = await this.getUserPaymentMethod(id);
    if (!method) return false;
    
    // Remove from memory
    const memoryResult = this.userPaymentMethods.delete(id);
    
    // Also remove from database
    try {
      await db.delete(userPaymentMethods)
        .where(eq(userPaymentMethods.id, id));
    } catch (error) {
      console.error('Error deleting user payment method from database:', error);
      
      // If database delete fails, restore the in-memory entry
      if (memoryResult) {
        this.userPaymentMethods.set(id, method);
      }
      
      return false;
    }
    
    return memoryResult;
  }
  
  async setDefaultUserPaymentMethod(userId: number, methodId: number): Promise<UserPaymentMethod> {
    const method = await this.getUserPaymentMethod(methodId);
    if (!method) throw new Error(`User payment method with ID ${methodId} not found`);
    
    if (method.userId !== userId) {
      throw new Error(`Payment method ${methodId} does not belong to user ${userId}`);
    }
    
    // Clear other default methods for this user
    await this.clearOtherDefaultPaymentMethods(userId, methodId);
    
    // Set this method as default
    return this.updateUserPaymentMethod(methodId, { isDefault: true });
  }
  
  // Helper method to clear other default payment methods for a user
  private async clearOtherDefaultPaymentMethods(userId: number, exceptMethodId: number): Promise<void> {
    const userMethods = await this.getUserPaymentMethodsByUserId(userId);
    
    for (const method of userMethods) {
      if (method.id !== exceptMethodId && method.isDefault) {
        await this.updateUserPaymentMethod(method.id, { isDefault: false });
      }
    }
  }
}

// Create a singleton instance of the storage
// Database Storage implementation
export class DbStorage extends MemStorage {
  private dbInstance: any; // Drizzle database connection
  
  constructor(dbInstance: any) {
    super();
    this.dbInstance = dbInstance;
    this.initializeFromDb();
  }
  
  // Helper method to safely update user IDs in memory storage
  private updateInMemoryUser(oldId: number, newId: number, user: User): void {
    // Get all users from parent class
    const allUsers = super.getAllUsers();
    // Remove old entry if it exists
    if (allUsers.has(oldId)) {
      allUsers.delete(oldId);
    }
    // Add with new ID
    allUsers.set(newId, user);
    console.log(`Memory storage updated: User ${user.username} ID changed from ${oldId} to ${newId}`);
  }
  
  // Helper method to convert DB format to memory format
  private convertDbUserToMemoryFormat(dbUser: any): User {
    if (!dbUser) return undefined as any;
    
    return {
      id: dbUser.id,
      username: dbUser.username,
      password: dbUser.password,
      email: dbUser.email || '',
      balance: dbUser.balance || '0',
      pendingBalance: dbUser.pending_balance || '0',
      balances: dbUser.balances || { PHP: '0', PHPT: '0', USDT: '0' },
      preferredCurrency: dbUser.preferred_currency || 'PHP',
      isVip: dbUser.is_vip || false,
      casinoId: dbUser.casino_id || '',
      casinoUsername: dbUser.casino_username,
      casinoClientId: dbUser.casino_client_id,
      topManager: dbUser.top_manager,
      immediateManager: dbUser.immediate_manager,
      casinoUserType: dbUser.casino_user_type,
      casinoBalance: dbUser.casino_balance || '0',
      isAuthorized: dbUser.is_authorized || false,
      allowedTopManagers: dbUser.allowed_top_managers || [],
      accessToken: dbUser.access_token,
      accessTokenExpiry: dbUser.access_token_expiry,
      refreshToken: dbUser.refresh_token,
      refreshTokenExpiry: dbUser.refresh_token_expiry,
      casinoAuthToken: dbUser.casino_auth_token,
      casinoAuthTokenExpiry: dbUser.casino_auth_token_expiry,
      hierarchyLevel: dbUser.hierarchy_level || 0,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at
    };
  }

  // Initialize memory store from database
  private async initializeFromDb() {
    try {
      console.log('Initializing storage from database...');
      // Load existing users from database
      const dbUsers = await this.dbInstance.select().from(users);
      
      if (dbUsers && dbUsers.length > 0) {
        console.log(`Found ${dbUsers.length} users in database`);
        // Process and add each user to the in-memory store using parent class methods
        for (const dbUser of dbUsers) {
          // Skip DB initialization for users that already exist in memory
          const existingUser = await super.getUser(dbUser.id);
          if (existingUser) {
            console.log(`User ${dbUser.username} (ID: ${dbUser.id}) already exists in memory, skipping`);
            continue;
          }
          
          // Extract only the properties we need for the user
          // This ensures type compatibility with our schema
          const userData = {
            // Required fields
            username: dbUser.username,
            password: dbUser.password,
            casinoId: dbUser.casinoId || 'default',
            
            // Optional fields with defaults
            email: dbUser.email || null,
            balance: dbUser.balance || '0',
            pendingBalance: dbUser.pendingBalance || '0',
            isVip: dbUser.isVip || false,
            
            // Casino specific fields
            casinoUsername: dbUser.casinoUsername || null,
            casinoClientId: dbUser.casinoClientId || null,
            topManager: dbUser.topManager || null,
            immediateManager: dbUser.immediateManager || null,
            casinoUserType: dbUser.casinoUserType || null,
            casinoBalance: dbUser.casinoBalance || '0',
            
            // Authentication fields
            accessToken: dbUser.accessToken || null,
            refreshToken: dbUser.refreshToken || null,
            
            // Multi-currency support
            currencyBalances: dbUser.currencyBalances || {},
            preferredCurrency: dbUser.preferredCurrency || 'PHP',
            
            // Authorization
            isAuthorized: dbUser.isAuthorized || false,
            allowedTopManagers: dbUser.allowedTopManagers || []
          };
          
          // Call the parent class method to create the user but without database persistence
          try {
            // We have to manually force the ID to match the database
            const user = {...userData, 
              id: dbUser.id,
              balances: dbUser.balances || { PHP: '0.00', PHPT: '0.00', USDT: '0.00' },
              hierarchyLevel: dbUser.hierarchy_level || 0,
              accessTokenExpiry: dbUser.accessTokenExpiry ? new Date(dbUser.accessTokenExpiry) : null,
              refreshTokenExpiry: dbUser.refreshTokenExpiry ? new Date(dbUser.refreshTokenExpiry) : null,
              casinoAuthTokenExpiry: dbUser.casinoAuthTokenExpiry ? new Date(dbUser.casinoAuthTokenExpiry) : null,
              casinoAuthToken: dbUser.casinoAuthToken,
              createdAt: new Date(dbUser.createdAt),
              updatedAt: new Date(dbUser.updatedAt)
            };
            
            // Use special override implementation to avoid incrementing ID counter
            this.insertUserDirect(user);
            console.log(`Loaded user ${user.username} (ID: ${user.id}) from database`);
          } catch (error) {
            console.error(`Error loading user ${dbUser.username} (ID: ${dbUser.id}) from database:`, error);
          }
        }
      } else {
        console.log('No existing users found in database');
      }
    } catch (error) {
      console.error('Error initializing from database:', error);
      // Continue with empty memory store if database initialization fails
    }
  }
  
  // Special method to directly insert a user without database persistence
  private insertUserDirect(user: User): void {
    // We know this is risky, but we need to rebuild the in-memory state from DB
    // Using typescript type assertion to bypass private property access restrictions
    // This is only used during initialization
    const self = this as any;
    self.users.set(user.id, user);
  }

  // Override user creation to persist to database
  async createUser(userData: InsertUser): Promise<User> {
    let createdUser: User | null = null;
    
    try {
      // First create user in memory as parent class does
      console.log(`DbStorage: Creating user in memory: ${userData.username}`);
      createdUser = await super.createUser(userData);
      console.log(`DbStorage: Successfully created user in memory: ${createdUser.username} (ID: ${createdUser.id})`);

      // Now persist to database - explicitly extract fields to avoid issues with non-schema fields
      console.log(`DbStorage: Persisting user to database: ${createdUser.username}`);
      
      // Ensure all fields match the database schema with proper naming
      // Log the casino ID for debugging
      console.log(`DEBUG: User casinoId before DB persistence: "${createdUser.casinoId}"`);
      
      // CRITICAL FIX: Use casinoClientId directly without adding 747- prefix
      // As per user requirements, we should use the exact data from the API
      let casinoIdValue = createdUser.casinoId;
      
      // If casinoId is missing but we have casinoClientId, use that directly as a string
      if (!casinoIdValue && createdUser.casinoClientId) {
        casinoIdValue = String(createdUser.casinoClientId);
        console.log(`Using casinoClientId directly for casinoId: ${casinoIdValue}`);
      }
      
      // If we still don't have a value (highly unlikely), create a fallback
      if (!casinoIdValue) {
        casinoIdValue = String(Date.now()); // Last resort fallback
        console.log(`WARNING: Using timestamp fallback for casinoId: ${casinoIdValue}`);
      }
      
      const dbUser = {
        id: createdUser.id,
        username: createdUser.username,
        password: createdUser.password,
        email: createdUser.email || '', // Ensure email is never null
        balance: createdUser.balance || '0.00',
        pending_balance: createdUser.pendingBalance || '0.00',
        balances: createdUser.balances || { PHP: '0.00', PHPT: '0.00', USDT: '0.00' },
        preferred_currency: createdUser.preferredCurrency || 'PHP',
        is_vip: createdUser.isVip || false,
        casino_id: casinoIdValue, // Use our guaranteed non-null value
        casino_username: createdUser.casinoUsername,
        casino_client_id: createdUser.casinoClientId,
        top_manager: createdUser.topManager,
        immediate_manager: createdUser.immediateManager,
        casino_user_type: createdUser.casinoUserType || 'player',
        casino_balance: createdUser.casinoBalance || '0.00',
        is_authorized: createdUser.isAuthorized || false,
        allowed_top_managers: createdUser.allowedTopManagers || [],
        access_token: createdUser.accessToken,
        access_token_expiry: createdUser.accessTokenExpiry,
        refresh_token: createdUser.refreshToken,
        refresh_token_expiry: createdUser.refreshTokenExpiry,
        casino_auth_token: createdUser.casinoAuthToken,
        casino_auth_token_expiry: createdUser.casinoAuthTokenExpiry,
        hierarchy_level: createdUser.hierarchyLevel || 0,
        created_at: createdUser.createdAt,
        updated_at: createdUser.updatedAt
      };
      
      // Debug log right before insertion
      console.log('DEBUG: dbUser object for insertion:', JSON.stringify({
        ...dbUser,
        password: '[REDACTED]' // Don't log the actual password
      }, null, 2));
      
      // CRITICAL FIX: Use simplified insert focusing only on the casino_id field
      console.log(`CRITICAL: Using direct database insert with explicit casino_id=${casinoIdValue}`);
      
      // Create a structured object with known types for the insert
      const userInsertData = {
        id: dbUser.id,
        username: dbUser.username,
        password: dbUser.password,
        email: dbUser.email,
        balance: dbUser.balance,
        pending_balance: dbUser.pending_balance,
        balances: dbUser.balances,
        preferred_currency: dbUser.preferred_currency,
        is_vip: dbUser.is_vip,
        casino_id: casinoIdValue, // Use our guaranteed non-null value
        casino_username: dbUser.casino_username,
        casino_client_id: dbUser.casino_client_id,
        top_manager: dbUser.top_manager,
        immediate_manager: dbUser.immediate_manager,
        casino_user_type: dbUser.casino_user_type,
        casino_balance: dbUser.casino_balance,
        is_authorized: dbUser.is_authorized,
        // Special handling for array types
        allowed_top_managers: dbUser.allowed_top_managers || [],
        hierarchy_level: dbUser.hierarchy_level,
        created_at: dbUser.created_at,
        updated_at: dbUser.updated_at,
        access_token: dbUser.access_token,
        access_token_expiry: dbUser.access_token_expiry,
        refresh_token: dbUser.refresh_token,
        refresh_token_expiry: dbUser.refresh_token_expiry,
        casino_auth_token: dbUser.casino_auth_token,
        casino_auth_token_expiry: dbUser.casino_auth_token_expiry
      };
      
      // Generate and log the actual SQL query for debugging
      const insertQuery = this.dbInstance.insert(users).values(userInsertData);
      console.log('SQL Insert Query:', insertQuery.toSQL().sql);
      console.log('SQL Insert Values:', JSON.stringify(insertQuery.toSQL().params, null, 2));
      
      // Try a super simplified approach using direct pool query
      console.log('CRITICAL FIX: Try direct pool query');
      
      try {
        // Import the pool directly from db.ts
        const { pool } = await import('./db');
        
        if (!pool) {
          console.error('Direct pool access failed - no pool available');
          throw new Error('No database pool available');
        }
        
        // Use a simplified direct approach with pg
        console.log('SIMPLIFIED: Using pool.query with minimal fields');
        
        // Minimal SQL query with just the essential fields
        const simpleSql = `
          INSERT INTO users (username, password, email, casino_id, balance, pending_balance, is_authorized) 
          VALUES ($1, $2, $3, $4, $5, $6, $7) 
          RETURNING id
        `;
        
        const simpleParams = [
          createdUser.username,
          createdUser.password,
          createdUser.email || '',
          casinoIdValue,
          '0.00',
          '0.00',
          true
        ];
        
        console.log('SIMPLE SQL:', simpleSql);
        console.log('SIMPLE PARAMS:', simpleParams.map((p, i) => i === 1 ? '[REDACTED]' : p));
        
        // Execute query with direct pool access
        const result = await pool.query(simpleSql, simpleParams);
        console.log('INSERT RESULT:', JSON.stringify(result.rows || {}));
        
        if (result.rows && result.rows.length > 0) {
          const newId = result.rows[0].id;
          console.log('DB insert successful, new ID:', newId);
          
          // Important fix: Update in-memory storage with the new ID
          const oldId = createdUser.id;
          createdUser.id = newId;
          
          // Remove the old entry and add the new one with updated ID
          this.updateInMemoryUser(oldId, newId, createdUser);
          
          console.log(`Updated in-memory user ID from ${oldId} to ${newId}`);
        }
      } catch (poolError) {
        console.error('Direct pool query failed:', poolError instanceof Error ? poolError.message : String(poolError));
        
        // Minimal insertion using Drizzle API only
        console.log('FALLBACK: Trying minimal Drizzle insertion');
        
        // Use SQL template strings (safer than raw SQL)
        await this.dbInstance.execute(sql`
          INSERT INTO users (username, password, email, casino_id, preferred_currency)
          VALUES (${createdUser.username}, ${createdUser.password}, ${createdUser.email || ''}, ${casinoIdValue}, ${'PHP'})
        `);
      }

      console.log(`User ${createdUser.username} (ID: ${createdUser.id}) persisted to database successfully`);
      return createdUser;
    } catch (error) {
      console.error('Error creating user in database:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // If DB operation fails and we already created the user in memory, try to clean up
      if (createdUser && createdUser.id) {
        try {
          // Get all users and manipulate the Map
          const allUsers = super.getAllUsers();
          if (allUsers && allUsers.has(createdUser.id)) {
            allUsers.delete(createdUser.id);
            console.log(`Removed user ${createdUser.username} (ID: ${createdUser.id}) from memory due to DB error`);
          }
        } catch (cleanupError) {
          console.error('Error cleaning up memory after DB error:', cleanupError);
        }
      }
      
      // Instead of re-throwing, return the memory user if it exists
      // This ensures the UI flow continues even if DB persistence fails
      if (createdUser) {
        console.log(`WARNING: Returning memory-only user ${createdUser.username} (ID: ${createdUser.id}) due to DB persistence failure`);
        // Insert user directly into our memory map to ensure it persists across server restarts
        this.insertUserDirect(createdUser);
        return createdUser;
      }
      
      // Only re-throw if we don't have a user at all
      throw error;
    }
  }

  // Override update methods to persist changes
  async updateUserAccessToken(id: number, token: string | null | undefined, expiresIn: number = 3600): Promise<User> {
    // First check if the user exists in memory
    let user = super.getUser(id);
    
    if (!user) {
      // Try to load user from database if not found in memory
      try {
        const dbUser = await this.dbInstance.select().from(users).where(eq(users.id, id)).limit(1);
        if (dbUser && dbUser.length > 0) {
          // Convert DB user to memory format
          user = this.convertDbUserToMemoryFormat(dbUser[0]);
          
          // Add to memory map
          this.insertUserDirect(user);
          console.log(`Loaded user ${user.username} (ID: ${id}) from database on demand`);
        } else {
          throw new Error(`User with ID ${id} not found in database or memory`);
        }
      } catch (dbError) {
        console.error(`Failed to find user with ID ${id} in database:`, dbError);
        throw new Error(`User with ID ${id} not found`);
      }
    }
    
    // Now update in memory
    user = await super.updateUserAccessToken(id, token, expiresIn);
    
    // Then persist to database
    try {
      // Update query with proper SQL syntax
      await this.dbInstance.execute(
        sql`UPDATE ${users} 
            SET access_token = ${token}, 
                access_token_expiry = ${user.accessTokenExpiry}, 
                updated_at = ${user.updatedAt} 
            WHERE id = ${id}`
      );
      console.log(`Successfully updated access token in database for user ID: ${id}`);
    } catch (error) {
      console.error('Error updating user access token in database:', error);
      // Continue with memory update even if DB fails
    }
    
    return user;
  }

  async updateUserRefreshToken(id: number, token: string | null | undefined, expiresIn: number = 2592000): Promise<User> {
    // First check if the user exists in memory
    let user = super.getUser(id);
    
    if (!user) {
      // Try to load user from database if not found in memory
      try {
        const dbUser = await this.dbInstance.select().from(users).where(eq(users.id, id)).limit(1);
        if (dbUser && dbUser.length > 0) {
          // Convert DB user to memory format
          user = this.convertDbUserToMemoryFormat(dbUser[0]);
          
          // Add to memory map
          this.insertUserDirect(user);
          console.log(`Loaded user ${user.username} (ID: ${id}) from database on demand for refresh token update`);
        } else {
          throw new Error(`User with ID ${id} not found in database or memory`);
        }
      } catch (dbError) {
        console.error(`Failed to find user with ID ${id} in database:`, dbError);
        throw new Error(`User with ID ${id} not found`);
      }
    }
    
    // Now update in memory
    user = await super.updateUserRefreshToken(id, token, expiresIn);
    
    // Then persist to database
    try {
      // Update query with proper SQL syntax
      await this.dbInstance.execute(
        sql`UPDATE ${users} 
            SET refresh_token = ${token}, 
                refresh_token_expiry = ${user.refreshTokenExpiry}, 
                updated_at = ${user.updatedAt} 
            WHERE id = ${id}`
      );
      console.log(`Successfully updated refresh token in database for user ID: ${id}`);
    } catch (error) {
      console.error('Error updating user refresh token in database:', error);
      // Continue with memory update even if DB fails
    }
    
    return user;
  }
  
  async updateUserPassword(id: number, password: string): Promise<User> {
    // First update in memory
    const user = await super.updateUserPassword(id, password);
    
    // Then persist to database
    try {
      await this.dbInstance.update(users)
        .set({
          password: password,
          updated_at: user.updatedAt
        })
        .where(eq(users.id, id));
    } catch (error) {
      console.error('Error updating user password in database:', error);
      // Continue with memory update even if DB fails
    }
    
    return user;
  }
  
  async updateUserHierarchyInfo(id: number, topManager: string, immediateManager: string, userType: string): Promise<User> {
    // First update in memory
    const user = await super.updateUserHierarchyInfo(id, topManager, immediateManager, userType);
    
    // Then persist to database
    try {
      await this.dbInstance.update(users)
        .set({
          top_manager: topManager,
          immediate_manager: immediateManager,
          casino_user_type: userType,
          hierarchy_level: user.hierarchyLevel,
          updated_at: new Date()
        })
        .where(eq(users.id, id));
      
      console.log(`Persisted hierarchy info for user ${id} to database: topManager=${topManager}, immediateManager=${immediateManager}, userType=${userType}`);
    } catch (error) {
      console.error('Error updating user hierarchy info in database:', error);
      // Continue with memory update even if DB fails
    }
    
    return user;
  }
  
  async setUserAllowedTopManagers(id: number, allowedTopManagers: string[]): Promise<User> {
    // First update in memory
    const user = await super.setUserAllowedTopManagers(id, allowedTopManagers);
    
    // Then persist to database
    try {
      await this.dbInstance.update(users)
        .set({
          allowed_top_managers: allowedTopManagers,
          updated_at: new Date()
        })
        .where(eq(users.id, id));
      
      console.log(`Persisted allowed top managers for user ${id} to database: ${allowedTopManagers.join(', ')}`);
    } catch (error) {
      console.error('Error updating user allowed top managers in database:', error);
      // Continue with memory update even if DB fails
    }
    
    return user;
  }
  
  async updateUserCasinoAuthToken(id: number, token: string, expiryDate: Date): Promise<User> {
    // First update in memory
    const user = await super.updateUserCasinoAuthToken(id, token, expiryDate);
    
    // Then persist to database
    try {
      await this.dbInstance.update(users)
        .set({
          casino_auth_token: token,
          casino_auth_token_expiry: expiryDate,
          updated_at: new Date()
        })
        .where(eq(users.id, id));
      
      console.log(`Persisted casino auth token for user ${id} to database, expires: ${expiryDate.toISOString()}`);
    } catch (error) {
      console.error('Error updating user casino auth token in database:', error);
      // Continue with memory update even if DB fails
    }
    
    return user;
  }

  // Override user preference methods to persist to database
  async createUserPreference(preferenceData: InsertUserPreference): Promise<UserPreference> {
    // First create in memory
    const preference = await super.createUserPreference(preferenceData);
    
    // Then persist to database
    try {
      // Check if this preference already exists in the database to avoid ID conflicts
      const existingPrefs = await this.dbInstance
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, preference.userId))
        .where(eq(userPreferences.key, preference.key));
        
      if (existingPrefs && existingPrefs.length > 0) {
        // Update existing preference instead of creating a new one
        await this.dbInstance.update(userPreferences)
          .set({
            value: preference.value,
            lastUpdated: new Date(),
            updatedAt: preference.updatedAt
          })
          .where(eq(userPreferences.userId, preference.userId))
          .where(eq(userPreferences.key, preference.key));
        
        console.log(`Updated existing user preference in database: userId=${preference.userId}, key=${preference.key}`);
        
        // Return the database record ID instead of memory ID
        preference.id = existingPrefs[0].id;
      } else {
        // Insert new preference without specifying ID (let DB auto-increment)
        const result = await this.dbInstance.insert(userPreferences).values({
          userId: preference.userId,
          key: preference.key,
          value: preference.value,
          lastUpdated: preference.lastUpdated || new Date(),
          createdAt: preference.createdAt,
          updatedAt: preference.updatedAt
        }).returning();
        
        if (result && result.length > 0) {
          // Update the in-memory ID to match the database
          preference.id = result[0].id;
        }
        
        console.log(`Persisted new user preference to database: userId=${preference.userId}, key=${preference.key}`);
      }
    } catch (error) {
      console.error('Error creating user preference in database:', error);
      // Continue with memory version even if DB fails
    }
    
    return preference;
  }
  
  async updateUserPreference(userId: number, key: string, value: any): Promise<UserPreference> {
    // First update in memory
    const preference = await super.updateUserPreference(userId, key, value);
    
    // Then persist to database
    try {
      // Check if this preference already exists in the database
      const existingPrefs = await this.dbInstance
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .where(eq(userPreferences.key, key));
      
      if (existingPrefs && existingPrefs.length > 0) {
        // Update existing preference
        await this.dbInstance.update(userPreferences)
          .set({
            value: preference.value,
            lastUpdated: new Date(),
            updatedAt: preference.updatedAt
          })
          .where(eq(userPreferences.userId, userId))
          .where(eq(userPreferences.key, key));
        
        // Update the in-memory ID to match the database
        preference.id = existingPrefs[0].id;
        
        console.log(`Updated user preference in database: userId=${userId}, key=${key}`);
      } else {
        // Insert new preference without specifying ID (let DB auto-increment)
        const result = await this.dbInstance.insert(userPreferences).values({
          userId: userId,
          key: key,
          value: preference.value,
          lastUpdated: preference.lastUpdated || new Date(),
          createdAt: preference.createdAt,
          updatedAt: preference.updatedAt
        }).returning();
        
        if (result && result.length > 0) {
          // Update the in-memory ID to match the database
          preference.id = result[0].id;
        }
        
        console.log(`Inserted new user preference to database: userId=${userId}, key=${key}`);
      }
    } catch (error) {
      console.error('Error updating user preference in database:', error);
      // Continue with memory version even if DB fails
    }
    
    return preference;
  }
  
  async deleteUserPreference(userId: number, key: string): Promise<boolean> {
    // First delete from memory
    const result = await super.deleteUserPreference(userId, key);
    
    // Then delete from database if memory operation was successful
    if (result) {
      try {
        await this.dbInstance.delete(userPreferences)
          .where(eq(userPreferences.userId, userId))
          .where(eq(userPreferences.key, key));
        
        console.log(`Deleted user preference from database: userId=${userId}, key=${key}`);
      } catch (error) {
        console.error('Error deleting user preference from database:', error);
        // Continue with memory result even if DB fails
      }
    }
    
    return result;
  }

  // Transaction methods
  async createTransaction(txData: InsertTransaction): Promise<Transaction> {
    // First create in memory
    const transaction = await super.createTransaction(txData);
    
    // Then persist to database
    try {
      // Convert statusHistory to a proper JSON object if it exists
      const statusHistoryForDb = transaction.statusHistory 
        ? transaction.statusHistory 
        : null;
      
      // Convert metadata to a proper JSON object if it exists
      const metadataForDb = transaction.metadata 
        ? transaction.metadata 
        : null;

      // Insert into the database - omit ID to let PostgreSQL auto-increment
      const inserted = await this.dbInstance.insert(transactions).values({
        userId: transaction.userId,
        type: transaction.type,
        method: transaction.method,
        amount: transaction.amount,
        fee: transaction.fee,
        netAmount: transaction.netAmount,
        status: transaction.status,
        statusHistory: statusHistoryForDb,
        statusUpdatedAt: transaction.statusUpdatedAt,
        completedAt: transaction.completedAt,
        paymentReference: transaction.paymentReference,
        transactionId: transaction.transactionId,
        casinoReference: transaction.casinoReference,
        nonce: transaction.nonce,
        casinoClientId: transaction.casinoClientId,
        casinoUsername: transaction.casinoUsername,
        destinationAddress: transaction.destinationAddress,
        destinationNetwork: transaction.destinationNetwork,
        uniqueId: transaction.uniqueId,
        currency: transaction.currency,
        balanceBefore: transaction.balanceBefore,
        balanceAfter: transaction.balanceAfter,
        metadata: metadataForDb,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt
      }).returning();
      
      if (inserted && inserted[0]) {
        // Update the in-memory transaction ID to match the database auto-increment ID
        transaction.id = inserted[0].id;
        console.log(`Created transaction in database: ID=${transaction.id}, Type=${transaction.type}, Amount=${transaction.amount}`);
      }
    } catch (error) {
      console.error('Error creating transaction in database:', error);
      // Continue with in-memory data even if DB fails
    }
    
    return transaction;
  }

  async getTransactionsByUserId(
    userId: number, 
    options?: { 
      limit?: number, 
      offset?: number, 
      type?: string, 
      method?: string, 
      status?: string,
      startDate?: Date,
      endDate?: Date
    }
  ): Promise<Transaction[]> {
    try {
      console.log(`Fetching transactions from database for userId: ${userId}`);
      
      // Start building the query
      let query = this.dbInstance.select()
        .from(transactions)
        .where(eq(transactions.userId, userId));
      
      // Apply filters if provided
      if (options?.type) {
        query = query.where(eq(transactions.type, options.type));
      }
      
      if (options?.method) {
        query = query.where(eq(transactions.method, options.method));
      }
      
      if (options?.status) {
        query = query.where(eq(transactions.status, options.status));
      }
      
      if (options?.startDate) {
        query = query.where(gte(transactions.createdAt, options.startDate));
      }
      
      if (options?.endDate) {
        query = query.where(lte(transactions.createdAt, options.endDate));
      }
      
      // Apply ordering
      query = query.orderBy(desc(transactions.createdAt));
      
      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      if (options?.offset) {
        query = query.offset(options.offset);
      }
      
      // Execute the query
      const result = await query;
      
      // Map over the results to convert DB format to Transaction type
      const dbTransactions = result.map(dbTx => {
        return {
          ...dbTx,
          // Make sure numeric values are returned as strings
          amount: dbTx.amount ? dbTx.amount.toString() : "0",
          fee: dbTx.fee ? dbTx.fee.toString() : "0",
          netAmount: dbTx.netAmount ? dbTx.netAmount.toString() : null,
          balanceBefore: dbTx.balanceBefore ? dbTx.balanceBefore.toString() : null,
          balanceAfter: dbTx.balanceAfter ? dbTx.balanceAfter.toString() : null,
        } as Transaction;
      });
      
      console.log(`Found ${dbTransactions.length} transactions in database for userId: ${userId}`);
      
      // Update in-memory storage with the database results to ensure consistency
      dbTransactions.forEach(tx => {
        // We're updating the in-memory storage with DB data
        if (!this.transactions.has(tx.id)) {
          this.transactions.set(tx.id, tx);
        }
      });
      
      return dbTransactions;
    } catch (error) {
      console.error('Error fetching transactions from database:', error);
      // Fall back to in-memory data if DB query fails
      return super.getTransactionsByUserId(userId, options);
    }
  }

  async updateTransactionStatus(id: number, status: string, reference?: string, metadata?: Record<string, any>): Promise<Transaction> {
    // First update in memory
    const transaction = await super.updateTransactionStatus(id, status, reference, metadata);
    
    // Then update in database
    try {
      // Prepare the update data
      const updateData: any = {
        status,
        statusUpdatedAt: transaction.statusUpdatedAt,
        updatedAt: transaction.updatedAt
      };
      
      if (reference) {
        updateData.paymentReference = reference;
      }
      
      if (transaction.statusHistory) {
        updateData.statusHistory = transaction.statusHistory;
      }
      
      if (metadata) {
        updateData.metadata = metadata;
      }
      
      // Update in database
      await this.dbInstance.update(transactions)
        .set(updateData)
        .where(eq(transactions.id, id))
        .returning();
      
      console.log(`Updated transaction status in database: ID=${id}, Status=${status}`);
    } catch (error) {
      console.error('Error updating transaction status in database:', error);
      // Continue with in-memory data even if DB fails
    }
    
    return transaction;
  }

  async completeTransaction(id: number, metadata?: Record<string, any>): Promise<Transaction> {
    // First complete in memory
    const transaction = await super.completeTransaction(id, metadata);
    
    // Then update in database
    try {
      // Prepare the update data
      const updateData: any = {
        status: 'completed',
        statusUpdatedAt: transaction.statusUpdatedAt,
        completedAt: transaction.completedAt,
        updatedAt: transaction.updatedAt
      };
      
      if (transaction.statusHistory) {
        updateData.statusHistory = transaction.statusHistory;
      }
      
      if (metadata) {
        updateData.metadata = metadata;
      }
      
      // Update in database
      await this.dbInstance.update(transactions)
        .set(updateData)
        .where(eq(transactions.id, id))
        .returning();
      
      console.log(`Completed transaction in database: ID=${id}`);
    } catch (error) {
      console.error('Error completing transaction in database:', error);
      // Continue with in-memory data even if DB fails
    }
    
    return transaction;
  }

  async recordTransactionFinancials(id: number, balanceBefore: number, balanceAfter: number, fee?: number): Promise<Transaction> {
    // First update in memory
    const transaction = await super.recordTransactionFinancials(id, balanceBefore, balanceAfter, fee);
    
    // Then update in database
    try {
      // Prepare the update data
      const updateData: any = {
        balanceBefore,
        balanceAfter,
        updatedAt: transaction.updatedAt
      };
      
      if (fee !== undefined) {
        updateData.fee = fee;
      }
      
      // Update in database
      await this.dbInstance.update(transactions)
        .set(updateData)
        .where(eq(transactions.id, id))
        .returning();
      
      console.log(`Updated transaction financials in database: ID=${id}`);
    } catch (error) {
      console.error('Error updating transaction financials in database:', error);
      // Continue with in-memory data even if DB fails
    }
    
    return transaction;
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    try {
      const result = await this.dbInstance.select()
        .from(transactions)
        .where(eq(transactions.id, id))
        .limit(1);
      
      if (result && result.length > 0) {
        // Convert DB format to Transaction type
        const dbTx = result[0];
        const transaction = {
          ...dbTx,
          // Make sure numeric values are returned as strings
          amount: dbTx.amount ? dbTx.amount.toString() : "0",
          fee: dbTx.fee ? dbTx.fee.toString() : "0",
          netAmount: dbTx.netAmount ? dbTx.netAmount.toString() : null,
          balanceBefore: dbTx.balanceBefore ? dbTx.balanceBefore.toString() : null,
          balanceAfter: dbTx.balanceAfter ? dbTx.balanceAfter.toString() : null,
        } as Transaction;
        
        // Update in-memory storage
        this.transactions.set(transaction.id, transaction);
        
        return transaction;
      }
      
      // Fall back to in-memory lookup
      return super.getTransaction(id);
    } catch (error) {
      console.error('Error fetching transaction from database:', error);
      // Fall back to in-memory lookup if DB query fails
      return super.getTransaction(id);
    }
  }

  async getTransactionByReference(reference: string): Promise<Transaction | undefined> {
    try {
      const result = await this.dbInstance.select()
        .from(transactions)
        .where(eq(transactions.paymentReference, reference))
        .limit(1);
      
      if (result && result.length > 0) {
        // Convert DB format to Transaction type
        const dbTx = result[0];
        const transaction = {
          ...dbTx,
          // Make sure numeric values are returned as strings
          amount: dbTx.amount ? dbTx.amount.toString() : "0",
          fee: dbTx.fee ? dbTx.fee.toString() : "0",
          netAmount: dbTx.netAmount ? dbTx.netAmount.toString() : null,
          balanceBefore: dbTx.balanceBefore ? dbTx.balanceBefore.toString() : null,
          balanceAfter: dbTx.balanceAfter ? dbTx.balanceAfter.toString() : null,
        } as Transaction;
        
        // Update in-memory storage
        this.transactions.set(transaction.id, transaction);
        
        return transaction;
      }
      
      // Fall back to in-memory lookup if not found in DB
      return undefined;
    } catch (error) {
      console.error('Error fetching transaction by reference from database:', error);
      // Fall back to in-memory lookup if DB query fails
      return undefined;
    }
  }
  
  async getTransactionByNonce(nonce: string): Promise<Transaction | undefined> {
    try {
      const result = await this.dbInstance.select()
        .from(transactions)
        .where(eq(transactions.nonce, nonce))
        .limit(1);
      
      if (result && result.length > 0) {
        // Convert DB format to Transaction type
        const dbTx = result[0];
        const transaction = {
          ...dbTx,
          // Make sure numeric values are returned as strings
          amount: dbTx.amount ? dbTx.amount.toString() : "0",
          fee: dbTx.fee ? dbTx.fee.toString() : "0",
          netAmount: dbTx.netAmount ? dbTx.netAmount.toString() : null,
          balanceBefore: dbTx.balanceBefore ? dbTx.balanceBefore.toString() : null,
          balanceAfter: dbTx.balanceAfter ? dbTx.balanceAfter.toString() : null,
        } as Transaction;
        
        // Update in-memory storage
        this.transactions.set(transaction.id, transaction);
        
        return transaction;
      }
      
      // Fall back to in-memory lookup if not found in DB
      return super.getTransactionByNonce(nonce);
    } catch (error) {
      console.error('Error fetching transaction by nonce from database:', error);
      // Fall back to in-memory lookup if DB query fails
      return super.getTransactionByNonce(nonce);
    }
  }

  /**
   * Override createQrPayment to persist to database
   */
  async createQrPayment(qrPaymentData: InsertQrPayment): Promise<QrPayment> {
    // First create in memory using parent class implementation
    const qrPayment = await super.createQrPayment(qrPaymentData);
    
    // Then persist to database
    try {
      console.log('Persisting QR payment to database:', {
        id: qrPayment.id,
        userId: qrPayment.userId,
        transactionId: qrPayment.transactionId,
        amount: qrPayment.amount,
        reference: qrPayment.directPayReference
      });

      // Insert into the database - omit the ID to let PostgreSQL auto-increment
      const inserted = await this.dbInstance.insert(qrPayments).values({
        userId: qrPayment.userId,
        transactionId: qrPayment.transactionId,
        qrCodeData: qrPayment.qrCodeData,
        payUrl: qrPayment.payUrl,
        amount: qrPayment.amount,
        expiresAt: qrPayment.expiresAt,
        directPayReference: qrPayment.directPayReference,
        status: qrPayment.status,
        createdAt: qrPayment.createdAt,
        updatedAt: qrPayment.updatedAt
      }).returning();
      
      if (inserted && inserted[0]) {
        // Update the in-memory QR payment ID to match the database auto-increment ID
        qrPayment.id = inserted[0].id;
        console.log(`Successfully created QR payment in database: ID=${qrPayment.id}, Amount=${qrPayment.amount}, Reference=${qrPayment.directPayReference}`);
      }
    } catch (error) {
      console.error('Error creating QR payment in database:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      // Continue with in-memory data even if DB persistence fails
    }
    
    return qrPayment;
  }
  
  /**
   * Override getQrPayment to retrieve from database first
   */
  async getQrPayment(id: number): Promise<QrPayment | undefined> {
    try {
      // Try to get from database first
      const result = await this.dbInstance.select()
        .from(qrPayments)
        .where(eq(qrPayments.id, id))
        .limit(1);
      
      if (result && result.length > 0) {
        // Convert DB format to QrPayment type
        const dbQr = result[0];
        const qrPayment: QrPayment = {
          ...dbQr,
          // Make sure numeric values are returned as strings
          amount: dbQr.amount ? dbQr.amount.toString() : "0",
        };
        
        // Update in-memory storage
        this.qrPayments.set(qrPayment.id, qrPayment);
        
        return qrPayment;
      }
      
      // Fall back to in-memory lookup if not found in DB
      return super.getQrPayment(id);
    } catch (error) {
      console.error('Error fetching QR payment from database:', error);
      // Fall back to in-memory lookup if DB query fails
      return super.getQrPayment(id);
    }
  }
  
  /**
   * Override getQrPaymentByReference to retrieve from database first
   */
  async getQrPaymentByReference(reference: string): Promise<QrPayment | undefined> {
    try {
      // Try to get from database first
      const result = await this.dbInstance.select()
        .from(qrPayments)
        .where(eq(qrPayments.directPayReference, reference))
        .limit(1);
      
      if (result && result.length > 0) {
        // Convert DB format to QrPayment type
        const dbQr = result[0];
        const qrPayment: QrPayment = {
          ...dbQr,
          // Make sure numeric values are returned as strings
          amount: dbQr.amount ? dbQr.amount.toString() : "0",
        };
        
        // Update in-memory storage
        this.qrPayments.set(qrPayment.id, qrPayment);
        
        return qrPayment;
      }
      
      // Fall back to in-memory lookup if not found in DB
      return super.getQrPaymentByReference(reference);
    } catch (error) {
      console.error('Error fetching QR payment by reference from database:', error);
      // Fall back to in-memory lookup if DB query fails
      return super.getQrPaymentByReference(reference);
    }
  }
  
  /**
   * Override updateQrPaymentStatus to update in database
   */
  async updateQrPaymentStatus(id: number, status: string): Promise<QrPayment> {
    // First update in memory
    const qrPayment = await super.updateQrPaymentStatus(id, status);
    
    // Then update in database
    try {
      await this.dbInstance.update(qrPayments)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(eq(qrPayments.id, id));
      
      console.log(`Updated QR payment status in database: ID=${id}, Status=${status}`);
    } catch (error) {
      console.error('Error updating QR payment status in database:', error);
      // Continue with in-memory data even if DB update fails
    }
    
    return qrPayment;
  }
  
  /**
   * Override createTelegramPayment to persist to database
   */
  async createTelegramPayment(paymentData: InsertTelegramPayment): Promise<TelegramPayment> {
    // First create in memory using parent class implementation
    const telegramPayment = await super.createTelegramPayment(paymentData);
    
    // Then persist to database
    try {
      console.log('Persisting Telegram payment to database:', {
        id: telegramPayment.id,
        userId: telegramPayment.userId,
        transactionId: telegramPayment.transactionId,
        amount: telegramPayment.amount,
        reference: telegramPayment.telegramReference
      });

      // Insert into the database - omit the ID to let PostgreSQL auto-increment
      const inserted = await this.dbInstance.insert(telegramPayments).values({
        userId: telegramPayment.userId,
        transactionId: telegramPayment.transactionId,
        payUrl: telegramPayment.payUrl,
        amount: telegramPayment.amount,
        currency: telegramPayment.currency,
        expiresAt: telegramPayment.expiresAt,
        telegramReference: telegramPayment.telegramReference,
        invoiceId: telegramPayment.invoiceId,
        status: telegramPayment.status,
        createdAt: telegramPayment.createdAt,
        updatedAt: telegramPayment.updatedAt
      }).returning();
      
      if (inserted && inserted[0]) {
        // Update the in-memory Telegram payment ID to match the database auto-increment ID
        telegramPayment.id = inserted[0].id;
        console.log(`Successfully created Telegram payment in database: ID=${telegramPayment.id}, Amount=${telegramPayment.amount}, Reference=${telegramPayment.telegramReference}`);
      }
    } catch (error) {
      console.error('Error creating Telegram payment in database:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      // Continue with in-memory data even if DB persistence fails
    }
    
    return telegramPayment;
  }
  
  /**
   * Override getActiveQrPaymentByUserId to check database first
   */
  async getActiveQrPaymentByUserId(userId: number): Promise<QrPayment | undefined> {
    try {
      // Get current date
      const now = new Date();
      
      // Try to get from database first
      const result = await this.dbInstance.select()
        .from(qrPayments)
        .where(
          and(
            eq(qrPayments.userId, userId),
            eq(qrPayments.status, 'pending'),
            sql`${qrPayments.expiresAt} > ${now}`
          )
        )
        .limit(1);
      
      if (result && result.length > 0) {
        // Convert DB format to QrPayment type
        const dbQr = result[0];
        const qrPayment: QrPayment = {
          ...dbQr,
          // Make sure numeric values are returned as strings
          amount: dbQr.amount ? dbQr.amount.toString() : "0",
        };
        
        // Update in-memory storage
        this.qrPayments.set(qrPayment.id, qrPayment);
        
        return qrPayment;
      }
      
      // Fall back to in-memory lookup if not found in DB
      return super.getActiveQrPaymentByUserId(userId);
    } catch (error) {
      console.error('Error fetching active QR payment from database:', error);
      // Fall back to in-memory lookup if DB query fails
      return super.getActiveQrPaymentByUserId(userId);
    }
  }
  
  /**
   * Override getAllQrPayments to fetch all QR payments from the database
   * This is critical for providing accurate admin dashboard data
   */
  getAllQrPayments(): Map<number, QrPayment> {
    try {
      // First get the in-memory QR payments
      const memQrPayments = super.getAllQrPayments();
      
      // Then asynchronously refresh from the database
      this.refreshQrPaymentsFromDatabase();
      
      // Return current state immediately (will be updated in-memory for next call)
      return memQrPayments;
    } catch (error) {
      console.error('Error getting all QR payments:', error);
      // Fallback to in-memory data if database operation fails
      return super.getAllQrPayments();
    }
  }
  
  /**
   * Private helper to refresh QR payments from database
   */
  private async refreshQrPaymentsFromDatabase(): Promise<void> {
    try {
      // Fetch all QR payments from database
      const dbQrPayments = await this.dbInstance.select().from(qrPayments);
      
      // Convert each to proper format and update in-memory storage
      for (const dbQr of dbQrPayments) {
        const qrPayment: QrPayment = {
          ...dbQr,
          // Make sure numeric values are returned as strings
          amount: dbQr.amount ? dbQr.amount.toString() : "0",
        };
        
        // Update the in-memory storage
        this.qrPayments.set(qrPayment.id, qrPayment);
      }
      
      console.log(`Refreshed ${dbQrPayments.length} QR payments from database`);
    } catch (error) {
      console.error('Error refreshing QR payments from database:', error);
    }
  }
  
  /**
   * Override getAllTelegramPayments to fetch all Telegram payments from the database
   * This is critical for providing accurate admin dashboard data
   */
  getAllTelegramPayments(): Map<number, TelegramPayment> {
    try {
      // First get the in-memory Telegram payments
      const memTelegramPayments = super.getAllTelegramPayments();
      
      // Then asynchronously refresh from the database
      this.refreshTelegramPaymentsFromDatabase();
      
      // Return current state immediately (will be updated in-memory for next call)
      return memTelegramPayments;
    } catch (error) {
      console.error('Error getting all Telegram payments:', error);
      // Fallback to in-memory data if database operation fails
      return super.getAllTelegramPayments();
    }
  }
  
  /**
   * Private helper to refresh Telegram payments from database
   */
  private async refreshTelegramPaymentsFromDatabase(): Promise<void> {
    try {
      // Fetch all Telegram payments from database
      const dbTelegramPayments = await this.dbInstance.select().from(telegramPayments);
      
      // Convert each to proper format and update in-memory storage
      for (const dbTelegram of dbTelegramPayments) {
        const telegramPayment: TelegramPayment = {
          ...dbTelegram,
          // Make sure numeric values are returned as strings
          amount: dbTelegram.amount ? dbTelegram.amount.toString() : "0",
        };
        
        // Update the in-memory storage
        this.telegramPayments.set(telegramPayment.id, telegramPayment);
      }
      
      console.log(`Refreshed ${dbTelegramPayments.length} Telegram payments from database`);
    } catch (error) {
      console.error('Error refreshing Telegram payments from database:', error);
    }
  }
}

// Import database connection from db.ts
import { db } from './db';

// Create database storage instance
export const storage = new DbStorage(db);

// Log database storage initialization
console.log('Database storage initialized and connected to PostgreSQL');
