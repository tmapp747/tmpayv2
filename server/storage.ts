import { 
  users, 
  transactions, 
  qrPayments, 
  type User, 
  type InsertUser,
  type Transaction,
  type InsertTransaction,
  type QrPayment,
  type InsertQrPayment
} from "@shared/schema";

// Storage interface for all database operations
export interface IStorage {
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
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transactions: Map<number, Transaction>;
  private qrPayments: Map<number, QrPayment>;
  
  private userIdCounter: number;
  private transactionIdCounter: number;
  private qrPaymentIdCounter: number;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.qrPayments = new Map();
    
    this.userIdCounter = 1;
    this.transactionIdCounter = 1;
    this.qrPaymentIdCounter = 1;
    
    // Add some initial test data
    this.createUser({
      username: "colorway",
      password: "cassinoroyale@ngInaM0!2@",
      email: "colorway@example.com",
      casinoId: "747-player-123",
      balance: "5000.00",
      pendingBalance: "0.00",
      isVip: true,
      casinoUsername: "colorway",
      casinoClientId: 24601,
      casinoUserType: "player",
      casinoBalance: "7500.00",
      topManager: "alpha1",
      immediateManager: "beta7"
    });
    
    // Add some sample transactions
    setTimeout(() => {
      const user = this.users.get(1);
      if (user) {
        // Add casino deposit transaction
        this.createTransaction({
          userId: 1,
          type: "casino_deposit",
          method: "casino_transfer",
          amount: "1000.00",
          status: "completed",
          casinoClientId: 24601,
          casinoUsername: "colorway",
          casinoReference: "747DEP12345",
          uniqueId: "DP" + Date.now().toString(),
          currency: "USD"
        });
        
        // Add GCash QR deposit transaction
        this.createTransaction({
          userId: 1,
          type: "deposit",
          method: "gcash_qr",
          amount: "500.00",
          status: "completed",
          paymentReference: "GCQR-" + Date.now().toString(),
          transactionId: "TR-" + Date.now().toString()
        });
      }
    }, 100);
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
    const user: User = { 
      ...userData, 
      id, 
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
    const transaction: Transaction = { 
      ...txData, 
      id, 
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
    const qrPayment: QrPayment = { 
      ...qrPaymentData, 
      id,
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
}

// Create a singleton instance of the storage
export const storage = new MemStorage();
