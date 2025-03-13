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
  
  // Transaction operations
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByUserId(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: number, status: string, reference?: string): Promise<Transaction>;
  
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
    
    // Add some initial data
    this.createUser({
      username: "JohnPlayer123",
      password: "password123",
      email: "john@example.com",
      casinoId: "747-player-001",
      balance: "12450.00",
      pendingBalance: "0.00",
      isVip: true
    });
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

  // Transaction operations
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(tx => tx.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
