import { 
  users, 
  transactions, 
  qrPayments,
  telegramPayments,
  manualPayments,
  supportedCurrencies,
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
  type Currency,
  type CurrencyBalances
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Storage interface for all database operations
export interface IStorage {
  // Session store
  sessionStore: session.Store;
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
  
  // Paygram Payment operations
  createTelegramPayment(payment: InsertTelegramPayment): Promise<TelegramPayment>;
  getTelegramPayment(id: number): Promise<TelegramPayment | undefined>;
  getTelegramPaymentByInvoiceCode(invoiceCode: string): Promise<TelegramPayment | undefined>;
  getTelegramPaymentByReference(reference: string): Promise<TelegramPayment | undefined>;
  updateTelegramPaymentStatus(id: number, status: string): Promise<TelegramPayment>;
  getActiveTelegramPaymentByUserId(userId: number): Promise<TelegramPayment | undefined>;
  
  // Manual Payment operations
  createManualPayment(payment: InsertManualPayment): Promise<ManualPayment>;
  getManualPayment(id: number): Promise<ManualPayment | undefined>;
  getManualPaymentByReference(reference: string): Promise<ManualPayment | undefined>;
  updateManualPaymentStatus(id: number, status: string): Promise<ManualPayment>;
  uploadManualPaymentReceipt(id: number, proofImageUrl: string): Promise<ManualPayment>;
  getActiveManualPaymentByUserId(userId: number): Promise<ManualPayment | undefined>;
  updateManualPayment(id: number, updates: Partial<ManualPayment>): Promise<ManualPayment>;
  getAllManualPayments(): Map<number, ManualPayment>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transactions: Map<number, Transaction>;
  private qrPayments: Map<number, QrPayment>;
  private telegramPayments: Map<number, TelegramPayment>;
  private manualPayments: Map<number, ManualPayment>;
  
  private userIdCounter: number;
  private transactionIdCounter: number;
  private qrPaymentIdCounter: number;
  private telegramPaymentIdCounter: number;
  private manualPaymentIdCounter: number;

  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.qrPayments = new Map();
    this.telegramPayments = new Map();
    this.manualPayments = new Map();
    
    this.userIdCounter = 1;
    this.transactionIdCounter = 1;
    this.qrPaymentIdCounter = 1;
    this.telegramPaymentIdCounter = 1;
    this.manualPaymentIdCounter = 1;

    // Initialize the session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Add a test user
    const testUser: User = {
      id: this.userIdCounter++,
      username: 'chubbyme',
      // Using plaintext password for testing
      password: 'password123',
      email: null,
      balance: '1000.00',
      pendingBalance: '0.00',
      balances: { PHP: '1000.00', PHPT: '500.00', USDT: '100.00' },
      preferredCurrency: 'PHP',
      isVip: false,
      casinoId: '747-123456',
      casinoUsername: 'chubbyme',
      casinoClientId: 123456,
      topManager: 'Marcthepogi',
      immediateManager: 'manager1',
      casinoUserType: 'player',
      casinoBalance: '1000.00',
      isAuthorized: true,
      allowedTopManagers: ['Marcthepogi', 'bossmarc747', 'teammarc'],
      accessToken: null,
      accessTokenExpiry: null,
      refreshToken: null,
      refreshTokenExpiry: null,
      casinoAuthToken: null,
      casinoAuthTokenExpiry: null,
      hierarchyLevel: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.set(testUser.id, testUser);
    console.log('Added test user:', testUser.username);
    
    // Add another test user for deposit operations
    const athan45User: User = {
      id: this.userIdCounter++,
      username: 'athan45',
      password: 'player123',
      email: null,
      balance: '1000.00',
      pendingBalance: '0.00',
      balances: { PHP: '1000.00', PHPT: '500.00', USDT: '100.00' },
      preferredCurrency: 'PHP',
      isVip: false,
      casinoId: '747-654321',
      casinoUsername: 'athan45',
      casinoClientId: 654321,
      topManager: 'Marcthepogi',
      immediateManager: 'manager1',
      casinoUserType: 'player',
      casinoBalance: '500.00',
      isAuthorized: true,
      allowedTopManagers: ['Marcthepogi', 'bossmarc747', 'teammarc'],
      accessToken: null,
      accessTokenExpiry: null,
      refreshToken: null,
      refreshTokenExpiry: null,
      casinoAuthToken: null,
      casinoAuthTokenExpiry: null,
      hierarchyLevel: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.set(athan45User.id, athan45User);
    console.log('Added test user:', athan45User.username);
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
      email: userData.email || null,
      balance: userData.balance || '0.00',
      pendingBalance: userData.pendingBalance || '0.00',
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
      const dateA = a.createdAt ? (a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt as string).getTime()) : 0;
      const dateB = b.createdAt ? (b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt as string).getTime()) : 0;
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
      const txDate = tx.createdAt instanceof Date ? tx.createdAt : new Date(tx.createdAt as string);
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
          const txDate = tx.createdAt instanceof Date ? tx.createdAt : new Date(tx.createdAt as string);
          return txDate >= options.startDate!;
        });
      }
      
      if (options.endDate) {
        transactions = transactions.filter(tx => {
          const txDate = tx.createdAt instanceof Date ? tx.createdAt : new Date(tx.createdAt as string);
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
    return this.telegramPayments.get(id);
  }

  async getTelegramPaymentByInvoiceCode(invoiceCode: string): Promise<TelegramPayment | undefined> {
    return Array.from(this.telegramPayments.values()).find(
      (payment) => payment.invoiceId === invoiceCode
    );
  }
  
  async getTelegramPaymentByReference(reference: string): Promise<TelegramPayment | undefined> {
    return Array.from(this.telegramPayments.values()).find(
      (payment) => payment.telegramReference === reference
    );
  }

  async updateTelegramPaymentStatus(id: number, status: string): Promise<TelegramPayment> {
    const telegramPayment = await this.getTelegramPayment(id);
    if (!telegramPayment) throw new Error(`Telegram Payment with ID ${id} not found`);
    
    const updatedPayment: TelegramPayment = { 
      ...telegramPayment, 
      status,
      updatedAt: new Date() 
    };
    this.telegramPayments.set(id, updatedPayment);
    return updatedPayment;
  }

  async getActiveTelegramPaymentByUserId(userId: number): Promise<TelegramPayment | undefined> {
    return Array.from(this.telegramPayments.values()).find(
      (payment) => payment.userId === userId && 
                  (payment.status === 'pending') && 
                  new Date() < payment.expiresAt
    );
  }

  // Manual Payment operations
  async createManualPayment(paymentData: InsertManualPayment): Promise<ManualPayment> {
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
    return manualPayment;
  }

  async getManualPayment(id: number): Promise<ManualPayment | undefined> {
    return this.manualPayments.get(id);
  }

  async getManualPaymentByReference(reference: string): Promise<ManualPayment | undefined> {
    return Array.from(this.manualPayments.values()).find(
      (payment) => payment.reference === reference
    );
  }

  async updateManualPaymentStatus(id: number, status: string): Promise<ManualPayment> {
    const payment = await this.getManualPayment(id);
    if (!payment) throw new Error(`Manual payment with ID ${id} not found`);
    
    const updatedPayment: ManualPayment = { 
      ...payment, 
      status, 
      updatedAt: new Date() 
    };
    
    this.manualPayments.set(id, updatedPayment);
    return updatedPayment;
  }

  async uploadManualPaymentReceipt(id: number, proofImageUrl: string): Promise<ManualPayment> {
    const payment = await this.getManualPayment(id);
    if (!payment) throw new Error(`Manual payment with ID ${id} not found`);
    
    const updatedPayment: ManualPayment = { 
      ...payment, 
      proofImageUrl,
      updatedAt: new Date() 
    };
    
    this.manualPayments.set(id, updatedPayment);
    return updatedPayment;
  }

  async getActiveManualPaymentByUserId(userId: number): Promise<ManualPayment | undefined> {
    return Array.from(this.manualPayments.values()).find(
      (payment) => payment.userId === userId && 
                  (payment.status === 'pending' || payment.status === 'processing')
    );
  }

  async updateManualPayment(id: number, updates: Partial<ManualPayment>): Promise<ManualPayment> {
    const payment = await this.getManualPayment(id);
    if (!payment) throw new Error(`Manual payment with ID ${id} not found`);
    
    const updatedPayment = { 
      ...payment,
      ...updates,
      updatedAt: new Date() 
    };
    
    this.manualPayments.set(id, updatedPayment);
    return updatedPayment;
  }
  
  getAllManualPayments(): Map<number, ManualPayment> {
    return this.manualPayments;
  }
}

// Create a singleton instance of the storage
export const storage = new MemStorage();
