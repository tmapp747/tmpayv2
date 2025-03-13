import { 
  users, 
  transactions, 
  qrPayments,
  telegramPayments,
  supportedCurrencies,
  type User, 
  type InsertUser,
  type Transaction,
  type InsertTransaction,
  type QrPayment,
  type InsertQrPayment,
  type TelegramPayment,
  type InsertTelegramPayment,
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
  updateUserAccessToken(id: number, token: string | null | undefined): Promise<User>;
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
  
  // Transaction operations
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByUserId(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: number, status: string, reference?: string): Promise<Transaction>;
  // Casino transaction operations
  getTransactionByUniqueId(uniqueId: string): Promise<Transaction | undefined>;
  getTransactionByCasinoReference(casinoReference: string): Promise<Transaction | undefined>;
  getCasinoTransactions(userId: number, type?: string): Promise<Transaction[]>;
  
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
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transactions: Map<number, Transaction>;
  private qrPayments: Map<number, QrPayment>;
  private telegramPayments: Map<number, TelegramPayment>;
  
  private userIdCounter: number;
  private transactionIdCounter: number;
  private qrPaymentIdCounter: number;
  private telegramPaymentIdCounter: number;

  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.qrPayments = new Map();
    this.telegramPayments = new Map();
    
    this.userIdCounter = 1;
    this.transactionIdCounter = 1;
    this.qrPaymentIdCounter = 1;
    this.telegramPaymentIdCounter = 1;

    // Initialize the session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Add a test user
    const testUser: User = {
      id: this.userIdCounter++,
      username: 'chubbyme',
      password: 'player123',
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
      casinoAuthToken: null,
      casinoAuthTokenExpiry: null,
      hierarchyLevel: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.set(testUser.id, testUser);
    console.log('Added test user:', testUser.username);
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

  async updateUserAccessToken(id: number, token: string | null | undefined): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error(`User with ID ${id} not found`);
    
    const updatedUser = { 
      ...user, 
      accessToken: token || null, // Ensure null instead of undefined
      updatedAt: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
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
    
    const updatedUser = { 
      ...user, 
      casinoAuthToken: token,
      casinoAuthTokenExpiry: expiryDate,
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

  async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(tx => tx.userId === userId)
      .sort((a, b) => {
        const dateA = a.createdAt ? (a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt as string).getTime()) : 0;
        const dateB = b.createdAt ? (b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt as string).getTime()) : 0;
        return dateB - dateA;
      });
  }

  async createTransaction(txData: InsertTransaction): Promise<Transaction> {
    const id = this.transactionIdCounter++;
    const now = new Date();
    
    // Make sure all required fields are set with defaults
    const transaction: Transaction = { 
      ...txData, 
      id, 
      casinoUsername: txData.casinoUsername || null,
      casinoClientId: txData.casinoClientId || null,
      paymentReference: txData.paymentReference || null,
      transactionId: txData.transactionId || null,
      casinoReference: txData.casinoReference || null,
      destinationAddress: txData.destinationAddress || null,
      destinationNetwork: txData.destinationNetwork || null,
      uniqueId: txData.uniqueId || null,
      currency: txData.currency || 'PHP',
      metadata: txData.metadata || null,
      createdAt: now, 
      updatedAt: now 
    };
    
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransactionStatus(id: number, status: string, reference?: string): Promise<Transaction> {
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

  async getCasinoTransactions(userId: number, type?: string): Promise<Transaction[]> {
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
}

// Create a singleton instance of the storage
export const storage = new MemStorage();
