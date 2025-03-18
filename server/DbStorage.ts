import { 
  users, 
  transactions, 
  qrPayments,
  telegramPayments,
  manualPayments,
  userPreferences,
  paymentMethods,
  userPaymentMethods,
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
  type UserPreference,
  type InsertUserPreference,
  type PaymentMethod,
  type InsertPaymentMethod,
  type UserPaymentMethod,
  type InsertUserPaymentMethod,
  type Currency,
  type CurrencyBalances
} from "@shared/schema";
import { IStorage } from "./storage";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq, and, or, desc, asc, gte, lte, sql, like, isNull } from "drizzle-orm";
import { DB_DEBUG } from "./constants";

/**
 * Database storage implementation for production use
 * This class implements all storage operations with proper database persistence
 */
export class DbStorage implements IStorage {
  private dbInstance: NodePgDatabase<typeof import("../shared/schema")>;

  constructor(dbInstance: NodePgDatabase<typeof import("../shared/schema")>) {
    this.dbInstance = dbInstance;
    console.log('DbStorage initialized with database connection');
  }

  // User operations with database persistence
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await this.dbInstance.select().from(users).where(eq(users.id, id));
      if (DB_DEBUG) console.log(`[DB] Retrieved user by ID: ${id}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error retrieving user by ID ${id}:`, error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await this.dbInstance.select().from(users).where(eq(users.username, username));
      if (DB_DEBUG) console.log(`[DB] Retrieved user by username: ${username}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error retrieving user by username ${username}:`, error);
      return undefined;
    }
  }

  async createUser(userData: InsertUser): Promise<User> {
    try {
      // Create user in database
      const result = await this.dbInstance.insert(users).values(userData).returning();
      if (DB_DEBUG) console.log(`[DB] Created new user: ${userData.username}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error creating user ${userData.username}:`, error);
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async updateUserBalance(id: number, amount: number): Promise<User> {
    try {
      // Use database transaction to ensure safe update
      const result = await this.dbInstance.transaction(async (tx) => {
        // Get current user to calculate new balance
        const currentUser = await tx.select().from(users).where(eq(users.id, id));
        if (!currentUser.length) throw new Error(`User with ID ${id} not found`);

        const user = currentUser[0];
        const currentBalance = parseFloat(user.balance);
        const newBalance = currentBalance + amount;

        // Update user with new balance
        return await tx.update(users)
          .set({ 
            balance: newBalance.toFixed(2),
            updatedAt: new Date()
          })
          .where(eq(users.id, id))
          .returning();
      });

      if (DB_DEBUG) console.log(`[DB] Updated user balance, user ID: ${id}, amount: ${amount}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error updating user balance for ID ${id}:`, error);
      throw new Error(`Failed to update user balance: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async updateUserPendingBalance(id: number, amount: number): Promise<User> {
    try {
      // Use database transaction to ensure safe update
      const result = await this.dbInstance.transaction(async (tx) => {
        // Get current user to calculate new pending balance
        const currentUser = await tx.select().from(users).where(eq(users.id, id));
        if (!currentUser.length) throw new Error(`User with ID ${id} not found`);

        const user = currentUser[0];
        const currentPendingBalance = parseFloat(user.pendingBalance);
        const newPendingBalance = currentPendingBalance + amount;

        // Update user with new pending balance
        return await tx.update(users)
          .set({ 
            pendingBalance: newPendingBalance.toFixed(2),
            updatedAt: new Date()
          })
          .where(eq(users.id, id))
          .returning();
      });

      if (DB_DEBUG) console.log(`[DB] Updated user pending balance, user ID: ${id}, amount: ${amount}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error updating user pending balance for ID ${id}:`, error);
      throw new Error(`Failed to update user pending balance: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getAllUsers(): Map<number, User> {
    // For compatibility with the interface, this returns a Map directly
    // Instead of a Promise<Map> which would break the interface contract
    const userMap = new Map<number, User>();

    try {
      // Start an async process to populate this map but return immediately
      this.refreshUsersFromDatabase().catch(error => {
        console.error('[DB] Error refreshing users from database:', error);
      });

      if (DB_DEBUG) console.log(`[DB] Returning user map with initial size: ${userMap.size}`);
      return userMap;
    } catch (error) {
      console.error('[DB] Error in getAllUsers:', error);
      return new Map();
    }
  }

  /**
   * Private helper to refresh users from the database
   */
  private async refreshUsersFromDatabase(): Promise<void> {
    try {
      const result = await this.dbInstance.select().from(users);
      const userMap = new Map<number, User>();

      for (const user of result) {
        userMap.set(user.id, user);
      }

      if (DB_DEBUG) console.log(`[DB] Refreshed ${result.length} users from database`);
    } catch (error) {
      console.error('[DB] Error refreshing users from database:', error);
    }
  }

  // Casino user operations
  async updateUserCasinoDetails(id: number, casinoDetails: Partial<User>): Promise<User> {
    try {
      const result = await this.dbInstance.update(users)
        .set({ 
          ...casinoDetails,
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning();

      if (DB_DEBUG) console.log(`[DB] Updated casino details for user ID: ${id}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error updating casino details for user ID ${id}:`, error);
      throw new Error(`Failed to update casino details: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async updateUserCasinoBalance(id: number, amount: number): Promise<User> {
    try {
      // Use database transaction to ensure safe update
      const result = await this.dbInstance.transaction(async (tx) => {
        // Get current user to calculate new casino balance
        const currentUser = await tx.select().from(users).where(eq(users.id, id));
        if (!currentUser.length) throw new Error(`User with ID ${id} not found`);

        const user = currentUser[0];
        const currentCasinoBalance = user.casinoBalance ? parseFloat(user.casinoBalance.toString()) : 0;
        const newCasinoBalance = currentCasinoBalance + amount;

        // Update user with new casino balance
        return await tx.update(users)
          .set({ 
            casinoBalance: newCasinoBalance.toFixed(2),
            updatedAt: new Date()
          })
          .where(eq(users.id, id))
          .returning();
      });

      if (DB_DEBUG) console.log(`[DB] Updated user casino balance, user ID: ${id}, amount: ${amount}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error updating user casino balance for ID ${id}:`, error);
      throw new Error(`Failed to update user casino balance: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getUserByCasinoUsername(casinoUsername: string): Promise<User | undefined> {
    try {
      const result = await this.dbInstance.select().from(users).where(eq(users.casinoUsername, casinoUsername));
      if (DB_DEBUG) console.log(`[DB] Retrieved user by casino username: ${casinoUsername}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error retrieving user by casino username ${casinoUsername}:`, error);
      return undefined;
    }
  }

  async getUserByCasinoClientId(casinoClientId: number): Promise<User | undefined> {
    try {
      const result = await this.dbInstance.select().from(users).where(eq(users.casinoClientId, casinoClientId));
      if (DB_DEBUG) console.log(`[DB] Retrieved user by casino client ID: ${casinoClientId}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error retrieving user by casino client ID ${casinoClientId}:`, error);
      return undefined;
    }
  }

  // Authentication operations
  async getUserByAccessToken(token: string): Promise<User | undefined> {
    try {
      const result = await this.dbInstance.select().from(users).where(eq(users.accessToken, token));
      if (DB_DEBUG && result.length) console.log(`[DB] Retrieved user by access token: ${result[0].username}`);
      return result[0];
    } catch (error) {
      console.error('[DB] Error retrieving user by access token:', error);
      return undefined;
    }
  }

  async updateUserAccessToken(id: number, token: string | null | undefined, expiresIn: number = 3600): Promise<User> {
    try {
      // Calculate expiry date
      const now = new Date();
      const expiryDate = token ? new Date(now.getTime() + expiresIn * 1000) : null;

      const result = await this.dbInstance.update(users)
        .set({ 
          accessToken: token,
          accessTokenExpiry: expiryDate,
          updatedAt: now
        })
        .where(eq(users.id, id))
        .returning();

      if (DB_DEBUG) console.log(`[DB] Updated access token for user ID: ${id}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error updating access token for user ID ${id}:`, error);
      throw new Error(`Failed to update access token: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getUserByRefreshToken(token: string): Promise<User | undefined> {
    try {
      const result = await this.dbInstance.select().from(users).where(eq(users.refreshToken, token));
      if (DB_DEBUG && result.length) console.log(`[DB] Retrieved user by refresh token: ${result[0].username}`);
      return result[0];
    } catch (error) {
      console.error('[DB] Error retrieving user by refresh token:', error);
      return undefined;
    }
  }

  async updateUserRefreshToken(id: number, token: string | null | undefined, expiresIn: number = 2592000): Promise<User> {
    try {
      // Calculate expiry date (30 days by default)
      const now = new Date();
      const expiryDate = token ? new Date(now.getTime() + expiresIn * 1000) : null;

      const result = await this.dbInstance.update(users)
        .set({ 
          refreshToken: token,
          refreshTokenExpiry: expiryDate,
          updatedAt: now
        })
        .where(eq(users.id, id))
        .returning();

      if (DB_DEBUG) console.log(`[DB] Updated refresh token for user ID: ${id}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error updating refresh token for user ID ${id}:`, error);
      throw new Error(`Failed to update refresh token: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async isTokenExpired(id: number): Promise<boolean> {
    try {
      const result = await this.dbInstance.select({
        accessTokenExpiry: users.accessTokenExpiry
      }).from(users).where(eq(users.id, id));

      if (!result.length || !result[0].accessTokenExpiry) return true;

      const expiryDate = new Date(result[0].accessTokenExpiry);
      return expiryDate < new Date();
    } catch (error) {
      console.error(`[DB] Error checking token expiration for user ID ${id}:`, error);
      return true; // Consider expired on error
    }
  }

  async updateUserAuthorizationStatus(id: number, isAuthorized: boolean): Promise<User> {
    try {
      const result = await this.dbInstance.update(users)
        .set({ 
          isAuthorized,
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning();

      if (DB_DEBUG) console.log(`[DB] Updated authorization status for user ID: ${id}, status: ${isAuthorized}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error updating authorization status for user ID ${id}:`, error);
      throw new Error(`Failed to update authorization status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async updateUserPassword(id: number, password: string): Promise<User> {
    try {
      const result = await this.dbInstance.update(users)
        .set({ 
          password,
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning();

      if (DB_DEBUG) console.log(`[DB] Updated password for user ID: ${id}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error updating password for user ID ${id}:`, error);
      throw new Error(`Failed to update password: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async updateUserHierarchyInfo(id: number, topManager: string, immediateManager: string, userType: string): Promise<User> {
    try {
      const result = await this.dbInstance.update(users)
        .set({ 
          topManager,
          immediateManager,
          casinoUserType: userType,
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning();

      if (DB_DEBUG) console.log(`[DB] Updated hierarchy info for user ID: ${id}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error updating hierarchy info for user ID ${id}:`, error);
      throw new Error(`Failed to update hierarchy info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async setUserAllowedTopManagers(id: number, allowedTopManagers: string[]): Promise<User> {
    try {
      const result = await this.dbInstance.update(users)
        .set({ 
          allowedTopManagers: JSON.stringify(allowedTopManagers),
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning();

      if (DB_DEBUG) console.log(`[DB] Updated allowed top managers for user ID: ${id}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error updating allowed top managers for user ID ${id}:`, error);
      throw new Error(`Failed to update allowed top managers: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async isUserAuthorized(username: string): Promise<boolean> {
    try {
      const result = await this.dbInstance.select({
        isAuthorized: users.isAuthorized
      }).from(users).where(eq(users.username, username));

      if (!result.length) return false;
      return result[0].isAuthorized === true;
    } catch (error) {
      console.error(`[DB] Error checking authorization for username ${username}:`, error);
      return false;
    }
  }

  // Casino auth operations
  async getUserByCasinoAuthToken(token: string): Promise<User | undefined> {
    try {
      const result = await this.dbInstance.select().from(users).where(eq(users.casinoAuthToken, token));
      if (DB_DEBUG && result.length) console.log(`[DB] Retrieved user by casino auth token: ${result[0].username}`);
      return result[0];
    } catch (error) {
      console.error('[DB] Error retrieving user by casino auth token:', error);
      return undefined;
    }
  }

  async updateUserCasinoAuthToken(id: number, token: string, expiryDate: Date): Promise<User> {
    try {
      const result = await this.dbInstance.update(users)
        .set({ 
          casinoAuthToken: token,
          casinoAuthTokenExpiry: expiryDate,
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning();

      if (DB_DEBUG) console.log(`[DB] Updated casino auth token for user ID: ${id}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error updating casino auth token for user ID ${id}:`, error);
      throw new Error(`Failed to update casino auth token: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getUserByTopManager(topManager: string): Promise<User | undefined> {
    try {
      const result = await this.dbInstance.select().from(users).where(eq(users.topManager, topManager));
      if (DB_DEBUG && result.length) console.log(`[DB] Retrieved user by top manager: ${topManager}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error retrieving user by top manager ${topManager}:`, error);
      return undefined;
    }
  }

  async getTopManagerForUser(userId: number): Promise<string | null | undefined> {
    try {
      const result = await this.dbInstance.select({
        topManager: users.topManager
      }).from(users).where(eq(users.id, userId));

      if (!result.length) return undefined;
      return result[0].topManager;
    } catch (error) {
      console.error(`[DB] Error getting top manager for user ID ${userId}:`, error);
      return undefined;
    }
  }

  // Multi-currency operations
  async getUserCurrencyBalance(id: number, currency: Currency): Promise<string> {
    try {
      const result = await this.dbInstance.select({
        balances: users.balances
      }).from(users).where(eq(users.id, id));

      if (!result.length) return "0.00";

      const balances = result[0].balances as Record<Currency, string>;
      return balances[currency] || "0.00";
    } catch (error) {
      console.error(`[DB] Error getting currency balance for user ID ${id}, currency ${currency}:`, error);
      return "0.00";
    }
  }

  async updateUserCurrencyBalance(id: number, currency: Currency, amount: number): Promise<User> {
    try {
      // Use database transaction to ensure safe update
      const result = await this.dbInstance.transaction(async (tx) => {
        // Get current user to update balances
        const currentUser = await tx.select().from(users).where(eq(users.id, id));
        if (!currentUser.length) throw new Error(`User with ID ${id} not found`);

        const user = currentUser[0];
        const balances = user.balances as Record<Currency, string> || {};
        const currentBalance = parseFloat(balances[currency] || "0.00");
        const newBalance = currentBalance + amount;

        // Update user with new balance
        balances[currency] = newBalance.toFixed(2);

        return await tx.update(users)
          .set({ 
            balances,
            updatedAt: new Date()
          })
          .where(eq(users.id, id))
          .returning();
      });

      if (DB_DEBUG) console.log(`[DB] Updated currency balance for user ID: ${id}, currency: ${currency}, amount: ${amount}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error updating currency balance for user ID ${id}:`, error);
      throw new Error(`Failed to update currency balance: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async exchangeCurrency(id: number, fromCurrency: Currency, toCurrency: Currency, amount: number): Promise<User> {
    try {
      // Use database transaction to ensure safe currency exchange
      const result = await this.dbInstance.transaction(async (tx) => {
        // Get current user to update balances
        const currentUser = await tx.select().from(users).where(eq(users.id, id));
        if (!currentUser.length) throw new Error(`User with ID ${id} not found`);

        const user = currentUser[0];
        const balances = user.balances as Record<Currency, string> || {};

        // Check if user has enough balance
        const fromBalance = parseFloat(balances[fromCurrency] || "0.00");
        if (fromBalance < amount) throw new Error(`Insufficient ${fromCurrency} balance`);

        // Exchange rate (simplified, in real app would come from external API)
        const exchangeRate = 1.0; // 1:1 for now, implement real rates later

        // Calculate new balances
        const newFromBalance = fromBalance - amount;
        const toBalance = parseFloat(balances[toCurrency] || "0.00");
        const newToBalance = toBalance + (amount * exchangeRate);

        // Update balances
        balances[fromCurrency] = newFromBalance.toFixed(2);
        balances[toCurrency] = newToBalance.toFixed(2);

        return await tx.update(users)
          .set({ 
            balances,
            updatedAt: new Date()
          })
          .where(eq(users.id, id))
          .returning();
      });

      if (DB_DEBUG) console.log(`[DB] Exchanged currency for user ID: ${id}, from: ${fromCurrency}, to: ${toCurrency}, amount: ${amount}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error exchanging currency for user ID ${id}:`, error);
      throw new Error(`Failed to exchange currency: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async updatePreferredCurrency(id: number, currency: Currency): Promise<User> {
    try {
      const result = await this.dbInstance.update(users)
        .set({ 
          preferredCurrency: currency,
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning();

      if (DB_DEBUG) console.log(`[DB] Updated preferred currency for user ID: ${id}, currency: ${currency}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error updating preferred currency for user ID ${id}:`, error);
      throw new Error(`Failed to update preferred currency: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Transaction operations
  async getTransaction(id: number): Promise<Transaction | undefined> {
    try {
      const result = await this.dbInstance.select().from(transactions).where(eq(transactions.id, id));
      if (DB_DEBUG) console.log(`[DB] Retrieved transaction by ID: ${id}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error retrieving transaction by ID ${id}:`, error);
      return undefined;
    }
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
      console.log(`[DB DEBUG] Fetching transactions for userId: ${userId} with options:`, options);

      // Log current transactions in the database
      const allTransactions = await this.dbInstance.select().from(transactions);
      console.log(`[DB DEBUG] Total transactions in database: ${allTransactions.length}`);
      console.log(`[DB DEBUG] Transaction IDs:`, allTransactions.map(t => t.id));
      console.log(`[DB DEBUG] Transaction user IDs:`, allTransactions.map(t => t.userId));

      // Build the query
      let query = this.dbInstance
        .select()
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

      // Order by creation date, newest first
      query = query.orderBy(desc(transactions.createdAt));

      // Apply pagination if provided
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.offset(options.offset);
      }

      // Convert query to SQL for debugging
      const { sql, params } = query.toSQL();
      console.log(`[DB DEBUG] SQL query for transactions: ${sql}`);
      console.log(`[DB DEBUG] SQL params:`, params);

      const result = await query;
      console.log(`[DB DEBUG] Retrieved ${result.length} transactions for user ID: ${userId}`);
      if (result.length > 0) {
        console.log(`[DB DEBUG] First transaction:`, result[0]);
      }

      return result;
    } catch (error) {
      console.error(`[DB] Error retrieving transactions for user ID ${userId}:`, error);
      return [];
    }
  }

  async createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
    try {
      // Use transaction to ensure consistency
      return await this.dbInstance.transaction(async (tx) => {
        // Check for duplicate references
        if (transactionData.paymentReference) {
          const existing = await tx.select()
            .from(transactions)
            .where(eq(transactions.paymentReference, transactionData.paymentReference));

          if (existing.length > 0) {
            throw new Error(`Transaction with reference ${transactionData.paymentReference} already exists`);
          }
        }

        // Create transaction
        const result = await tx.insert(transactions)
          .values({
            ...transactionData,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();

        if (DB_DEBUG) console.log(`[DB] Created new transaction: ${result[0].id}, type: ${transactionData.type}`);
        return result[0];
      });
    } catch (error) {
      console.error(`[DB] Error creating transaction:`, error);
      throw new Error(`Failed to create transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async updateTransactionStatus(id: number, status: string, reference?: string, metadata?: Record<string, any>): Promise<Transaction> {
    try {
      // Use transaction to ensure atomic update
      return await this.dbInstance.transaction(async (tx) => {
        // Get current transaction with all fields
        const currentTransaction = await tx
          .select()
          .from(transactions)
          .where(eq(transactions.id, id))
          .forUpdate();

        if (!currentTransaction.length) {
          throw new Error(`Transaction ${id} not found`);
        }

        const transaction = currentTransaction[0];
        const now = new Date();

        // Create history entry
        const historyEntry = {
          status,
          timestamp: now.toISOString(),
          previousStatus: transaction.status,
          note: `Status changed from ${transaction.status} to ${status}`
        };

        // Update status history
        const statusHistory = transaction.statusHistory || [];
        statusHistory.push(historyEntry);

        // Prepare update data
        const updateData: Partial<Transaction> = {
          status,
          statusHistory: JSON.stringify(statusHistory), //Added JSON.stringify
          statusUpdatedAt: now,
          updatedAt: now
        };

        // Update reference if provided
        if (reference) {
          updateData.paymentReference = reference;
        }

        // Update metadata if provided
        if (metadata) {
          updateData.metadata = {
            ...(transaction.metadata || {}),
            ...metadata
          };
        }

        const result = await this.dbInstance.update(transactions)
          .set(updateData)
          .where(eq(transactions.id, id))
          .returning();

        if (DB_DEBUG) console.log(`[DB] Updated transaction status: ${id}, status: ${status}`);
        return result[0];
      });
    } catch (error) {
      console.error(`[DB] Error updating transaction status for ID ${id}:`, error);
      throw new Error(`Failed to update transaction status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async addStatusHistoryEntry(id: number, status: string, note?: string): Promise<Transaction> {
    try {
      // Get current transaction to update
      const currentTransaction = await this.dbInstance.select().from(transactions).where(eq(transactions.id, id));
      if (!currentTransaction.length) throw new Error(`Transaction with ID ${id} not found`);

      const transaction = currentTransaction[0];
      const statusHistory = transaction.statusHistory || [];

      // Add new status history entry
      statusHistory.push({
        status,
        timestamp: new Date().toISOString(),
        note: note || `Status updated to ${status}`
      });

      const result = await this.dbInstance.update(transactions)
        .set({
          statusHistory: JSON.stringify(statusHistory), //Added JSON.stringify
          updatedAt: new Date()
        })
        .where(eq(transactions.id, id))
        .returning();

      if (DB_DEBUG) console.log(`[DB] Added status history entry to transaction: ${id}, status: ${status}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error adding status history entry for transaction ID ${id}:`, error);
      throw new Error(`Failed to add status history entry: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async completeTransaction(id: number, metadata?: Record<string, any>): Promise<Transaction> {
    try {
      // Get current transaction to update
      const currentTransaction = await this.dbInstance.select().from(transactions).where(eq(transactions.id, id));
      if (!currentTransaction.length) throw new Error(`Transaction with ID ${id} not found`);

      const transaction = currentTransaction[0];
      const statusHistory = transaction.statusHistory || [];

      // Add completed status history entry
      statusHistory.push({
        status: 'completed',
        timestamp: new Date().toISOString(),
        note: 'Transaction completed successfully'
      });

      // Prepare update data
      const updateData: Partial<Transaction> = {
        status: 'completed',
        statusHistory: JSON.stringify(statusHistory), //Added JSON.stringify
        completedAt: new Date(),
        statusUpdatedAt: new Date(),
        updatedAt: new Date()
      };

      // Update metadata if provided
      if (metadata) {
        updateData.metadata = {
          ...(transaction.metadata || {}),
          ...metadata
        };
      }

      const result = await this.dbInstance.update(transactions)
        .set(updateData)
        .where(eq(transactions.id, id))
        .returning();

      if (DB_DEBUG) console.log(`[DB] Completed transaction: ${id}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error completing transaction ID ${id}:`, error);
      throw new Error(`Failed to complete transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async recordTransactionFinancials(id: number, balanceBefore: number, balanceAfter: number, fee?: number): Promise<Transaction> {
    try {
      const updateData: Partial<Transaction> = {
        balanceBefore: balanceBefore.toFixed(2),
        balanceAfter: balanceAfter.toFixed(2),
        updatedAt: new Date()
      };

      if (fee !== undefined) {
        updateData.fee = fee.toFixed(2);
      }

      const result = await this.dbInstance.update(transactions)
        .set(updateData)
        .where(eq(transactions.id, id))
        .returning();

      if (DB_DEBUG) console.log(`[DB] Recorded financials for transaction: ${id}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error recording financials for transaction ID ${id}:`, error);
      throw new Error(`Failed to record transaction financials: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async updateTransactionMetadata(id: number, metadata: Record<string, any>): Promise<Transaction> {
    try {
      // Get current transaction to update
      const currentTransaction = await this.dbInstance.select().from(transactions).where(eq(transactions.id, id));
      if (!currentTransaction.length) throw new Error(`Transaction with ID ${id} not found`);

      const transaction = currentTransaction[0];

      // Merge metadata
      const updatedMetadata = {
        ...(transaction.metadata || {}),
        ...metadata
      };

      const result = await this.dbInstance.update(transactions)
        .set({
          metadata: updatedMetadata,
          updatedAt: new Date()
        })
        .where(eq(transactions.id, id))
        .returning();

      if (DB_DEBUG) console.log(`[DB] Updated metadata for transaction: ${id}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error updating metadata for transaction ID ${id}:`, error);
      throw new Error(`Failed to update transaction metadata: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async setTransactionNonce(id: number, nonce: string): Promise<Transaction> {
    try {
      const result = await this.dbInstance.update(transactions)
        .set({
          uniqueId: nonce,
          updatedAt: new Date()
        })
        .where(eq(transactions.id, id))
        .returning();

      if (DB_DEBUG) console.log(`[DB] Set nonce for transaction: ${id}, nonce: ${nonce}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error setting nonce for transaction ID ${id}:`, error);
      throw new Error(`Failed to set transaction nonce: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getTransactionByNonce(nonce: string): Promise<Transaction | undefined> {
    try {
      const result = await this.dbInstance.select().from(transactions).where(eq(transactions.uniqueId, nonce));
      if (DB_DEBUG && result.length) console.log(`[DB] Retrieved transaction by nonce: ${nonce}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error retrieving transaction by nonce ${nonce}:`, error);
      return undefined;
    }
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
    try {
      let query = this.dbInstance
        .select()
        .from(transactions)
        .where(
          and(
            gte(transactions.createdAt, startDate),
            lte(transactions.createdAt, endDate)
          )
        );

      // Apply filters if provided
      if (options?.userId) {
        query = query.where(eq(transactions.userId, options.userId));
      }

      if (options?.type) {
        query = query.where(eq(transactions.type, options.type));
      }

      if (options?.method) {
        query = query.where(eq(transactions.method, options.method));
      }

      if (options?.status) {
        query = query.where(eq(transactions.status, options.status));
      }

      // Order by creation date, newest first
      query = query.orderBy(desc(transactions.createdAt));

      const result = await query;
      if (DB_DEBUG) console.log(`[DB] Retrieved ${result.length} transactions for date range`);
      return result;
    } catch (error) {
      console.error(`[DB] Error retrieving transactions for date range:`, error);
      return [];
    }
  }

  async getTransactionsSummary(
    options?: { 
      userId?: number, 
      type?: string, 
      method?: string, 
      status?: string, 
      startDate?: Date, 
      endDate?: Date 
    }
  ): Promise<{ 
    count: number, 
    totalAmount: number, 
    successfulAmount: number, 
    pendingAmount: number, 
    failedAmount: number 
  }> {
    try {
      let filters = [] as any[];

      // Build filters
      if (options?.userId) {
        filters.push(eq(transactions.userId, options.userId));
      }

      if (options?.type) {
        filters.push(eq(transactions.type, options.type));
      }

      if (options?.method) {
        filters.push(eq(transactions.method, options.method));
      }

      if (options?.startDate) {
        filters.push(gte(transactions.createdAt, options.startDate));
      }

      if (options?.endDate) {
        filters.push(lte(transactions.createdAt, options.endDate));
      }

      // Get all relevant transactions
      const query = this.dbInstance.select().from(transactions);

      // Apply filters if any
      if (filters.length > 0) {
        query.where(and(...filters));
      }

      const result = await query;

      // Calculate summary
      let totalAmount = 0;
      let successfulAmount = 0;
      let pendingAmount = 0;
      let failedAmount = 0;

      for (const tx of result) {
        const amount = parseFloat(tx.amount.toString());
        totalAmount += amount;

        if (tx.status === 'completed') {
          successfulAmount += amount;
        } else if (tx.status === 'pending') {
          pendingAmount += amount;
        } else if (tx.status === 'failed' || tx.status === 'expired') {
          failedAmount += amount;
        }
      }

      if (DB_DEBUG) console.log(`[DB] Generated transaction summary with ${result.length} transactions`);

      return {
        count: result.length,
        totalAmount,
        successfulAmount,
        pendingAmount,
        failedAmount
      };
    } catch (error) {
      console.error(`[DB] Error generating transaction summary:`, error);
      return {
        count: 0,
        totalAmount: 0,
        successfulAmount: 0,
        pendingAmount: 0,
        failedAmount: 0
      };
    }
  }

  // Casino transaction operations
  async getTransactionByUniqueId(uniqueId: string): Promise<Transaction | undefined> {
    try {
      const result = await this.dbInstance.select().from(transactions).where(eq(transactions.uniqueId, uniqueId));
      if (DB_DEBUG && result.length) console.log(`[DB] Retrieved transaction by unique ID: ${uniqueId}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error retrieving transaction by unique ID ${uniqueId}:`, error);
      return undefined;
    }
  }

  async getTransactionByCasinoReference(casinoReference: string): Promise<Transaction | undefined> {
    try {
      const result = await this.dbInstance.select().from(transactions).where(eq(transactions.casinoReference, casinoReference));
      if (DB_DEBUG && result.length) console.log(`[DB] Retrieved transaction by casino reference: ${casinoReference}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error retrieving transaction by casino reference ${casinoReference}:`, error);
      return undefined;
    }
  }

  async getCasinoTransactions(
    userId: number, 
    type?: string, 
    options?: { 
      limit?: number, 
      offset?: number 
    }
  ): Promise<Transaction[]> {
    try {
      let query = this.dbInstance
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            or(
              eq(transactions.type, 'casino_deposit'),
              eq(transactions.type, 'casino_withdraw'),
              eq(transactions.type, 'casino_transfer')
            )
          )
        );

      // Apply type filter if provided
      if (type) {
        query = query.where(eq(transactions.type, type));
      }

      // Order by creation date, newest first
      query = query.orderBy(desc(transactions.createdAt));

      // Apply pagination if provided
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.offset(options.offset);
      }

      const result = await query;
      if (DB_DEBUG) console.log(`[DB] Retrieved ${result.length} casino transactions for user ID: ${userId}`);
      return result;
    } catch (error) {
      console.error(`[DB] Error retrieving casino transactions for user ID ${userId}:`, error);
      return [];
    }
  }

  // QR Payment operations
  async createQrPayment(qrPaymentData: InsertQrPayment): Promise<QrPayment> {
    try {
      const result = await this.dbInstance.insert(qrPayments).values(qrPaymentData).returning();
      if (DB_DEBUG) console.log(`[DB] Created new QR payment: ${result[0].id}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error creating QR payment:`, error);
      throw new Error(`Failed to create QR payment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getQrPayment(id: number): Promise<QrPayment | undefined> {
    try {
      const result = await this.dbInstance.select().from(qrPayments).where(eq(qrPayments.id, id));
      if (DB_DEBUG) console.log(`[DB] Retrieved QR payment by ID: ${id}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error retrieving QR payment by ID ${id}:`, error);
      return undefined;
    }
  }

  async getQrPaymentByReference(reference: string): Promise<QrPayment | undefined> {
    try {
      const result = await this.dbInstance.select().from(qrPayments).where(eq(qrPayments.directPayReference, reference));
      if (DB_DEBUG && result.length) console.log(`[DB] Retrieved QR payment by reference: ${reference}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error retrieving QR payment by reference ${reference}:`, error);
      return undefined;
    }
  }

  async updateQrPaymentStatus(id: number, status: string): Promise<QrPayment> {
    try {
      const result = await this.dbInstance.update(qrPayments)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(eq(qrPayments.id, id))
        .returning();

      if (DB_DEBUG) console.log(`[DB] Updated QR payment status: ${id}, status: ${status}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error updating QR payment status for ID ${id}:`, error);
      throw new Error(`Failed to update QR payment status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getActiveQrPaymentByUserId(userId: number): Promise<QrPayment | undefined> {
    try {
      const result = await this.dbInstance
        .select()
        .from(qrPayments)
        .where(
          and(
            eq(qrPayments.userId, userId),
            eq(qrPayments.status, 'pending')
          )
        )
        .orderBy(desc(qrPayments.createdAt))
        .limit(1);

      if (DB_DEBUG && result.length) console.log(`[DB] Retrieved active QR payment for user ID: ${userId}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error retrieving active QR payment for user ID ${userId}:`, error);
      return undefined;
    }
  }

  getAllQrPayments(): Map<number, QrPayment> {
    // For compatibility with the interface, this returns a Map directly
    // Instead of a Promise<Map> which would break the interface contract
    const qrPaymentMap = new Map<number, QrPayment>();

    try {
      // Start an async process to populate this map but return immediately
      this.refreshQrPaymentsFromDatabase().catch(error => {
        console.error('[DB] Error refreshing QR payments from database:', error);
      });

      if (DB_DEBUG) console.log(`[DB] Returning QR payment map with initial size: ${qrPaymentMap.size}`);
      return qrPaymentMap;
    } catch (error) {
      console.error('[DB] Error in getAllQrPayments:', error);
      return new Map();
    }
  }

  /**
   * Private helper to refresh QR payments from the database
   */
  private async refreshQrPaymentsFromDatabase(): Promise<void> {
    try {
      const result = await this.dbInstance.select().from(qrPayments);
      const qrPaymentMap = new Map<number, QrPayment>();

      for (const payment of result) {
        qrPaymentMap.set(payment.id, payment);
      }

      if (DB_DEBUG) console.log(`[DB] Refreshed ${result.length} QR payments from database`);
    } catch (error) {
      console.error('[DB] Error refreshing QR payments from database:', error);
    }
  }

  // Telegram Payment operations
  async createTelegramPayment(paymentData: InsertTelegramPayment): Promise<TelegramPayment> {
    try {
      const result = await this.dbInstance.insert(telegramPayments).values(paymentData).returning();
      if (DB_DEBUG) console.log(`[DB] Created new Telegram payment: ${result[0].id}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error creating Telegram payment:`, error);
      throw new Error(`Failed to create Telegram payment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getTelegramPayment(id: number): Promise<TelegramPayment | undefined> {
    try {
      const result = await this.dbInstance.select().from(telegramPayments).where(eq(telegramPayments.id, id));
      if (DB_DEBUG) console.log(`[DB] Retrieved Telegram payment by ID: ${id}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error retrieving Telegram payment by ID ${id}:`, error);
      return undefined;
    }
  }

  async getTelegramPaymentByInvoiceCode(invoiceCode: string): Promise<TelegramPayment | undefined> {
    try {
      const result = await this.dbInstance.select().from(telegramPayments).where(eq(telegramPayments.invoiceCode, invoiceCode));
      if (DB_DEBUG && result.length) console.log(`[DB] Retrieved Telegram payment by invoice code: ${invoiceCode}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error retrieving Telegram payment by invoice code ${invoiceCode}:`, error);
      return undefined;
    }
  }

  async getTelegramPaymentByReference(reference: string): Promise<TelegramPayment | undefined> {
    try {
      const result = await this.dbInstance.select().from(telegramPayments).where(eq(telegramPayments.reference, reference));
      if (DB_DEBUG && result.length) console.log(`[DB] Retrieved Telegram payment by reference: ${reference}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error retrieving Telegram payment by reference ${reference}:`, error);
      return undefined;
    }
  }

  async updateTelegramPaymentStatus(id: number, status: string): Promise<TelegramPayment> {
    try {
      const result = await this.dbInstance.update(telegramPayments)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(eq(telegramPayments.id, id))
        .returning();

      if (DB_DEBUG) console.log(`[DB] Updated Telegram payment status: ${id}, status: ${status}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error updating Telegram payment status for ID ${id}:`, error);
      throw new Error(`Failed to update Telegram payment status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getActiveTelegramPaymentByUserId(userId: number): Promise<TelegramPayment | undefined> {
    try {
      const result = await this.dbInstance
        .select()
        .from(telegramPayments)
        .where(
          and(
            eq(telegramPayments.userId, userId),
            eq(telegramPayments.status, 'pending')
          )
        )
        .orderBy(desc(telegramPayments.createdAt))
        .limit(1);

      if (DB_DEBUG && result.length) console.log(`[DB] Retrieved active Telegram payment for user ID: ${userId}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error retrieving active Telegram payment for user ID ${userId}:`, error);
      return undefined;
    }
  }

  getAllTelegramPayments(): Map<number, TelegramPayment> {
    // For compatibility with the interface, this returns a Map directly
    // Instead of a Promise<Map> which would break the interface contract
    const telegramPaymentMap = new Map<number, TelegramPayment>();

    try {
      // Start an async process to populate this map but return immediately
      this.refreshTelegramPaymentsFromDatabase().catch(error => {
        console.error('[DB] Error refreshing Telegram payments from database:', error);
      });

      if (DB_DEBUG) console.log(`[DB] Returning Telegram payment map with initial size: ${telegramPaymentMap.size}`);
      return telegramPaymentMap;
    } catch (error) {
      console.error('[DB] Error in getAllTelegramPayments:', error);
      return new Map();
    }
  }

  /**
   * Private helper to refresh Telegram payments from the database
   */
  private async refreshTelegramPaymentsFromDatabase(): Promise<void> {
    try {
      const result = await this.dbInstance.select().from(telegramPayments);
      const telegramPaymentMap = new Map<number, TelegramPayment>();

      for (const payment of result) {
        telegramPaymentMap.set(payment.id, payment);
      }

      if (DB_DEBUG) console.log(`[DB] Refreshed ${result.length} Telegram payments from database`);
    } catch (error) {
      console.error('[DB] Error refreshing Telegram payments from database:', error);
    }
  }

  // Manual Payment operations
  async createManualPayment(paymentData: InsertManualPayment): Promise<ManualPayment> {
    try {
      const result = await this.dbInstance.insert(manualPayments).values(paymentData).returning();
      if (DB_DEBUG) console.log(`[DB] Created new manual payment: ${result[0].id}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error creating manual payment:`, error);
      throw new Error(`Failed to create manual payment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getManualPayment(id: number): Promise<ManualPayment | undefined> {
    try {
      const result = await this.dbInstance.select().from(manualPayments).where(eq(manualPayments.id, id));
      if (DB_DEBUG) console.log(`[DB] Retrieved manual payment by ID: ${id}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error retrieving manual payment by ID ${id}:`, error);
      return undefined;
    }
  }

  async getManualPaymentByReference(reference: string): Promise<ManualPayment | undefined> {
    try {
      const result = await this.dbInstance.select().from(manualPayments).where(eq(manualPayments.reference, reference));
      if (DB_DEBUG && result.length) console.log(`[DB] Retrieved manual payment by reference: ${reference}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error retrieving manual payment by reference ${reference}:`, error);
      return undefined;
    }
  }

  async updateManualPaymentStatus(id: number, status: string): Promise<ManualPayment> {
    try {
      const result = await this.dbInstance.update(manualPayments)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(eq(manualPayments.id, id))
        .returning();

      if (DB_DEBUG) console.log(`[DB] Updated manual payment status: ${id}, status: ${status}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error updating manual payment status for ID ${id}:`, error);
      throw new Error(`Failed to update manual payment status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async uploadManualPaymentReceipt(id: number, proofImageUrl: string): Promise<ManualPayment> {
    try {
      const result = await this.dbInstance.update(manualPayments)
        .set({
          proofImageUrl,
          updatedAt: new Date()
        })
        .where(eq(manualPayments.id, id))
        .returning();

      if (DB_DEBUG) console.log(`[DB] Uploaded receipt for manual payment: ${id}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error uploading receipt for manual payment ID ${id}:`, error);
      throw new Error(`Failed to upload manual payment receipt: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getActiveManualPaymentByUserId(userId: number): Promise<ManualPayment | undefined> {
    try {
      const result = await this.dbInstance
        .select()
        .from(manualPayments)
        .where(
          and(
            eq(manualPayments.userId, userId),
            eq(manualPayments.status, 'pending')
          )
        )
        .orderBy(desc(manualPayments.createdAt))
        .limit(1);

      if (DB_DEBUG && result.length) console.log(`[DB] Retrieved active manual payment for user ID: ${userId}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error retrieving active manual payment for user ID ${userId}:`, error);
      return undefined;
    }
  }

  async updateManualPayment(id: number, updates: Partial<ManualPayment>): Promise<ManualPayment> {
    try {
      // Ensure updatedAt is set
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      const result = await this.dbInstance.update(manualPayments)
        .set(updateData)
        .where(eq(manualPayments.id, id))
        .returning();

      if (DB_DEBUG) console.log(`[DB] Updated manual payment: ${id}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error updating manual payment ID ${id}:`, error);
      throw new Error(`Failed to update manual payment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getAllManualPayments(): Map<number, ManualPayment> {
    // For compatibility with the interface, this returns a Map directly
    // Instead of a Promise<Map> which would break the interface contract
    const manualPaymentMap = new Map<number, ManualPayment>();

    try {
      // Start an async process to populate this map but return immediately
      this.refreshManualPaymentsFromDatabase().catch(error => {
        console.error('[DB] Error refreshing manual payments from database:', error);
      });

      if (DB_DEBUG) console.log(`[DB] Returning manual payment map with initial size: ${manualPaymentMap.size}`);
      return manualPaymentMap;
    } catch (error) {
      console.error('[DB] Error in getAllManualPayments:', error);
      return new Map();
    }
  }

  /**
   * Private helper to refresh manual payments from the database
   */
  private async refreshManualPaymentsFromDatabase(): Promise<void> {
    try {
      const result = await this.dbInstance.select().from(manualPayments);
      const manualPaymentMap = new Map<number, ManualPayment>();

      for (const payment of result) {
        manualPaymentMap.set(payment.id, payment);
      }

      if (DB_DEBUG) console.log(`[DB] Refreshed ${result.length} manual payments from database`);
    } catch (error) {
      console.error('[DB] Error refreshing manual payments from database:', error);
    }
  }

  // User Preferences operations
  async createUserPreference(preferenceData: InsertUserPreference): Promise<UserPreference> {
    try {
      const result = await this.dbInstance.insert(userPreferences).values(preferenceData).returning();
      if (DB_DEBUG) console.log(`[DB] Created new user preference: ${result[0].id}, key: ${preferenceData.key}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error creating user preference:`, error);
      throw new Error(`Failed to create user preference: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getUserPreference(userId: number, key: string): Promise<UserPreference | undefined> {
    try {
      const result = await this.dbInstance
        .select()
        .from(userPreferences)
        .where(
          and(
            eq(userPreferences.userId, userId),
            eq(userPreferences.key, key)
          )
        );

      if (DB_DEBUG && result.length) console.log(`[DB] Retrieved user preference: ${key} for user ID: ${userId}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error retrieving user preference for user ID ${userId}, key ${key}:`, error);
      return undefined;
    }
  }

  async updateUserPreference(userId: number, key: string, value: any): Promise<UserPreference> {
    try {
      // Check if preference exists
      const existingPreference = await this.getUserPreference(userId, key);

      if (!existingPreference) {
        // Create new preference if it doesn't exist
        console.log(`Creating new user preference in database: userId=${userId}, key=${key}`);
        return await this.createUserPreference({
          userId,
          key,
          value: JSON.stringify(value),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Update existing preference
      console.log(`Updated existing user preference in database: userId=${userId}, key=${key}`);
      const result = await this.dbInstance.update(userPreferences)
        .set({
          value: JSON.stringify(value),
          updatedAt: new Date()
        })
        .where(
          and(
            eq(userPreferences.userId, userId),
            eq(userPreferences.key, key)
          )
        )
        .returning();

      if (DB_DEBUG) console.log(`[DB] Updated user preference: ${key} for user ID: ${userId}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error updating user preference for user ID ${userId}, key ${key}:`, error);
      throw new Error(`Failed to update user preference: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async deleteUserPreference(userId: number, key: string): Promise<boolean> {
    try {
      const result = await this.dbInstance.delete(userPreferences)
        .where(
          and(
            eq(userPreferences.userId, userId),
            eq(userPreferences.key, key)
          )
        )
        .returning();

      if (DB_DEBUG) console.log(`[DB] Deleted user preference: ${key} for user ID: ${userId}`);
      return result.length > 0;
    } catch (error) {
      console.error(`[DB] Error deleting user preference for user ID ${userId}, key ${key}:`, error);
      return false;
    }
  }

  async getUserPreferences(userId: number): Promise<UserPreference[]> {
    try {
      const result = await this.dbInstance
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId));

      if (DB_DEBUG) console.log(`[DB] Retrieved ${result.length} preferences for user ID: ${userId}`);
      return result;
    } catch (error) {
      console.error(`[DB] Error retrieving preferences for user ID ${userId}:`, error);
      return [];
    }
  }

  // Payment Methods operations (admin-managed)
  async createPaymentMethod(methodData: InsertPaymentMethod): Promise<PaymentMethod> {
    try {
      const result = await this.dbInstance.insert(paymentMethods).values(methodData).returning();
      if (DB_DEBUG) console.log(`[DB] Created new payment method: ${result[0].id}, name: ${methodData.name}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error creating payment method:`, error);
      throw new Error(`Failed to create payment method: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getPaymentMethod(id: number): Promise<PaymentMethod | undefined> {
    try {
      const result = await this.dbInstance.select().from(paymentMethods).where(eq(paymentMethods.id, id));
      if (DB_DEBUG) console.log(`[DB] Retrieved payment method by ID: ${id}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error retrieving payment method by ID ${id}:`, error);
      return undefined;
    }
  }

  async getPaymentMethodByName(name: string): Promise<PaymentMethod | undefined> {
    try {
      const result = await this.dbInstance.select().from(paymentMethods).where(eq(paymentMethods.name, name));
      if (DB_DEBUG && result.length) console.log(`[DB] Retrieved payment method by name: ${name}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error retrieving payment method by name ${name}:`, error);
      return undefined;
    }
  }

  async updatePaymentMethod(id: number, updates: Partial<PaymentMethod>): Promise<PaymentMethod> {
    try {
      // Ensure updatedAt is set
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      const result = await this.dbInstance.update(paymentMethods)
        .set(updateData)
        .where(eq(paymentMethods.id, id))
        .returning();

      if (DB_DEBUG) console.log(`[DB] Updated payment method: ${id}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error updating payment method ID ${id}:`, error);
      throw new Error(`Failed to update payment method: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async deletePaymentMethod(id: number): Promise<boolean> {
    try {
      // Instead of deleting, mark as inactive
      const result = await this.dbInstance.update(paymentMethods)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(paymentMethods.id, id))
        .returning();

      if (DB_DEBUG) console.log(`[DB] Marked payment method as inactive: ${id}`);
      return result.length > 0;
    } catch (error) {
      console.error(`[DB] Error deactivating payment method ID ${id}:`, error);
      return false;
    }
  }

  async getPaymentMethods(type?: string, isActive?: boolean): Promise<PaymentMethod[]> {
    try {
      let query = this.dbInstance.select().from(paymentMethods);

      // Apply filters if provided
      if (type) {
        query = query.where(eq(paymentMethods.type, type));
      }

      if (isActive !== undefined) {
        query = query.where(eq(paymentMethods.isActive, isActive));
      }

      // Order by sort order, then name
      query = query.orderBy(asc(paymentMethods.sortOrder), asc(paymentMethods.name));

      const result = await query;
      if (DB_DEBUG) console.log(`[DB] Retrieved ${result.length} payment methods`);
      return result;
    } catch (error) {
      console.error(`[DB] Error retrieving payment methods:`, error);
      return [];
    }
  }

  // User Payment Methods operations (user-managed for withdrawals)
  async createUserPaymentMethod(methodData: InsertUserPaymentMethod): Promise<UserPaymentMethod> {
    try {
      // If this is the first payment method for this user, set as default
      let isDefault = false;

      const existingMethods = await this.getUserPaymentMethodsByUserId(methodData.userId);
      if (!existingMethods.length) {
        isDefault = true;
      }

      const result = await this.dbInstance.insert(userPaymentMethods)
        .values({
          ...methodData,
          isDefault
        })
        .returning();

      if (DB_DEBUG) console.log(`[DB] Created new user payment method: ${result[0].id} for user: ${methodData.userId}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error creating user payment method:`, error);
      throw new Error(`Failed to create user payment method: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getUserPaymentMethod(id: number): Promise<UserPaymentMethod | undefined> {
    try {
      const result = await this.dbInstance.select().from(userPaymentMethods).where(eq(userPaymentMethods.id, id));
      if (DB_DEBUG) console.log(`[DB] Retrieved user payment method by ID: ${id}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error retrieving user payment method by ID ${id}:`, error);
      return undefined;
    }
  }

  async getUserPaymentMethodsByUserId(userId: number, type?: string): Promise<UserPaymentMethod[]> {
    try {
      let query = this.dbInstance.select().from(userPaymentMethods).where(eq(userPaymentMethods.userId, userId));

      // Apply type filter if provided
      if (type) {
        query = query.where(eq(userPaymentMethods.type, type));
      }

      // Order by default first, then creation date (newest first)
      query = query.orderBy(desc(userPaymentMethods.isDefault), desc(userPaymentMethods.createdAt));

      const result = await query;
      if (DB_DEBUG) console.log(`[DB] Retrieved ${result.length} user payment methods for user ID: ${userId}`);
      return result;
    } catch (error) {
      console.error(`[DB] Error retrieving user payment methods for user ID ${userId}:`, error);
      return [];
    }
  }

  async updateUserPaymentMethod(id: number, updates: Partial<UserPaymentMethod>): Promise<UserPaymentMethod> {
    try {
      // Ensure updatedAt is set
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      const result = await this.dbInstance.update(userPaymentMethods)
        .set(updateData)
        .where(eq(userPaymentMethods.id, id))
        .returning();

      if (DB_DEBUG) console.log(`[DB] Updated user payment method: ${id}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error updating user payment method ID ${id}:`, error);
      throw new Error(`Failed to update user payment method: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async deleteUserPaymentMethod(id: number): Promise<boolean> {
    try {
      // Get the method first to check if it's default
      const method = await this.getUserPaymentMethod(id);
      if (!method) return false;

      // Delete the method
      const deleteResult = await this.dbInstance.delete(userPaymentMethods)
        .where(eq(userPaymentMethods.id, id))
        .returning();

      if (deleteResult.length === 0) return false;

      // If deleted method was the default, set a new default if there are other methods
      if (method.isDefault) {
        const otherMethods = await this.getUserPaymentMethodsByUserId(method.userId);
        if (otherMethods.length > 0) {
          await this.dbInstance.update(userPaymentMethods)
            .set({
              isDefault: true,
              updatedAt: new Date()
            })
            .where(eq(userPaymentMethods.id, otherMethods[0].id));
        }
      }

      if (DB_DEBUG) console.log(`[DB] Deleted user payment method: ${id}`);
      return true;
    } catch (error) {
      console.error(`[DB] Error deleting user payment method ID ${id}:`, error);
      return false;
    }
  }

  async setDefaultUserPaymentMethod(userId: number, methodId: number): Promise<UserPaymentMethod> {
    try {
      // Use transaction to ensure consistency
      return await this.dbInstance.transaction(async (tx) => {
        // First, clear default flag on all user's methods
        await tx.update(userPaymentMethods)
          .set({
            isDefault: false,
            updatedAt: new Date()
          })
          .where(eq(userPaymentMethods.userId, userId));

        // Then set new default
        const result = await tx.update(userPaymentMethods)
          .set({
            isDefault: true,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(userPaymentMethods.id, methodId),
              eq(userPaymentMethods.userId, userId)
            )
          )
          .returning();

        if (!result.length) throw new Error(`Payment method with ID ${methodId} not found for user ${userId}`);

        return result[0];
      });
    } catch (error) {
      console.error(`[DB] Error setting default payment method ID ${methodId} for user ID ${userId}:`, error);
      throw new Error(`Failed to set default payment method: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getTransactionByReference(reference: string): Promise<Transaction | undefined> {
    try {
      // Check all possible reference fields
      const result = await this.dbInstance
        .select()
        .from(transactions)
        .where(
          or(
            eq(transactions.paymentReference, reference),
            eq(transactions.transactionId, reference),
            eq(transactions.casinoReference, reference),
            eq(transactions.uniqueId, reference)
          )
        );
      if (DB_DEBUG && result.length) console.log(`[DB] Retrieved transaction by reference: ${reference}`);
      return result[0];
    } catch (error) {
      console.error(`[DB] Error retrieving transaction by reference ${reference}:`, error);
      return undefined;
    }
  }
}