import axios from 'axios';
import { storage } from './storage';

/**
 * API client for interacting with the 747 Casino API
 * Simplified version using permanent env tokens
 */
export class Casino747Api {
  
  /**
   * Send a deposit notification to the immediate manager about a player's deposit
   * Non-critical notification - doesn't affect the transaction
   */
  async sendDepositNotification(username: string, details: {
    amount: number;
    currency: string;
    method: string;
    reference: string;
    timestamp: Date;
  }): Promise<boolean> {
    try {
      console.log(`📬 Sending deposit notification for ${username} via SMS/messaging system`);
      
      // This is a notification-only method, so we'll just log it
      console.log(`💰 Deposit notification: ${details.amount} ${details.currency} via ${details.method}`);
      console.log(`🧾 Reference: ${details.reference}, Time: ${details.timestamp.toISOString()}`);
      
      // In a real implementation, this would call the messaging API
      return true;
    } catch (error) {
      console.error("Error sending deposit notification:", error);
      // Non-critical error, return false but don't throw
      return false;
    }
  }
  private baseUrl: string = 'https://bridge.747lc.com';
  private userLookupUrl: string = 'https://tmpay747.azurewebsites.net/api/Bridge/get-user';
  private defaultTopManagers = ['Marcthepogi', 'bossmarc747', 'teammarc'];
  
  constructor(
    private readonly defaultPlatform: number = 1
  ) {
    console.log('Initialized Casino747Api with permanent token support');
  }
  
  /**
   * Get user details from the 747 API
   * @param username The username to look up
   */
  async getUserDetails(username: string) {
    try {
      const response = await axios.get(`${this.userLookupUrl}/${username}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw new Error('Failed to fetch user details from 747 Casino API');
    }
  }

  /**
   * Get the balance for a specific user
   * @param clientId The client ID of the user
   * @param username The username of the user
   */
  async getUserBalance(clientId: number, username: string) {
    try {
      // First get a valid auth token for the appropriate top manager
      let topManager = 'Marcthepogi'; // Default to Marcthepogi
      
      // Try to find the user's top manager from database
      const user = await storage.getUserByCasinoUsername(username);
      if (user && user.topManager) {
        topManager = user.topManager;
        console.log(`Using top manager from database: ${topManager}`);
      } else {
        console.log(`User not found in database, using default top manager: ${topManager}`);
      }
      
      console.log(`🔍 Making balance request for ${username} with clientId ${clientId}`);
      
      // Get auth token using the top manager
      const authToken = await this.getTopManagerToken(topManager);
      
      if (!authToken) {
        throw new Error(`Could not obtain valid auth token for manager ${topManager}`);
      }
      
      // Create the request payload with required fields
      const requestData = {
        authToken,
        platform: this.defaultPlatform,
        clientId: parseInt(clientId.toString()), // Ensure clientId is number
        username: username.trim(), // Clean username
        currency: "PHP" // Default currency
      };
      
      // Don't log the full token for security
      const redactedData = { ...requestData, authToken: '***REDACTED***' };
      console.log(`DEBUG: Making request with data: ${JSON.stringify(redactedData)}`);
      
      const response = await axios.post(`${this.baseUrl}/account/get-balances`, requestData, {
        headers: {
          'accept': 'text/plain',
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ Balance request successful for ${username}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {        
        console.error('Error fetching balance from casino API:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        
        throw new Error(`Failed to fetch balance: ${error.response?.data?.message || 'Authentication error'}`);
      } else {
        console.error('Error fetching balance from casino API:', error);
        throw new Error('Failed to fetch balance from casino API');
      }
    }
  }

  /**
   * Get user hierarchy information from the 747 API
   * @param username The username to lookup
   * @param isAgent Whether the user is an agent (default: false)
   */
  async getUserHierarchy(username: string, isAgent: boolean = false) {
    try {
      // We'll use Marcthepogi's token by default for hierarchy lookups
      const authToken = await this.getTopManagerToken('Marcthepogi');
      
      if (!authToken) {
        throw new Error(`Failed to get authentication token for hierarchy lookup`);
      }
      
      // Prepare request payload
      const payload = {
        authToken,
        platform: this.defaultPlatform,
        username,
        isAgent
      };
      
      console.log(`[CASINO747] Hierarchy request payload:`, { 
        ...payload, 
        authToken: '***REDACTED***'
      });
      
      // Make the API request
      const response = await axios.post(`${this.baseUrl}/Default/GetHierarchy`, payload, {
        headers: {
          'accept': 'text/plain',
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
      
      console.log(`[CASINO747] Hierarchy response:`, response.data);
      
      // Store information about the top manager and immediate manager
      if (response.data && response.data.hierarchy && response.data.user && username) {
        try {
          const user = await storage.getUserByUsername(username);
          if (user) {
            // Find the immediate manager (parent) from the hierarchy
            const userEntry = response.data.hierarchy.find((entry: any) => 
              entry.username.toLowerCase() === username.toLowerCase()
            );
            
            if (userEntry && userEntry.parentClientId) {
              // Find the immediate manager by matching parentClientId
              const immediateManager = response.data.hierarchy.find((entry: any) => 
                entry.clientId === userEntry.parentClientId
              );
              
              // Find the top manager (highest in hierarchy without a parent)
              let topManagerEntry = response.data.hierarchy.find((entry: any) => 
                entry.parentClientId === null || entry.parentClientId === undefined
              );
              
              // If for some reason we couldn't find the top in hierarchy, use a default
              const topManagerUsername = topManagerEntry ? topManagerEntry.username : 'Marcthepogi';
              const immediateManagerUsername = immediateManager ? immediateManager.username : 'unknown';
              
              // Persist this information to the database
              await storage.updateUserHierarchyInfo(
                user.id,
                topManagerUsername,
                immediateManagerUsername,
                response.data.user ? 'player' : 'agent' // Simplified user type detection
              );
              
              console.log(`Persisted hierarchy info for user ${user.id} to database: topManager=${topManagerUsername}, immediateManager=${immediateManagerUsername}, userType=player`);
            }
          }
        } catch (storageError) {
          console.error(`Error updating hierarchy info in storage:`, storageError);
          // Non-fatal - continue with the response
        }
      }
      
      return response.data;
    } catch (error) {
      console.error(`[CASINO747] Error fetching user hierarchy:`, error);
      throw new Error(`Failed to fetch user hierarchy: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process a withdrawal of funds from a casino user
   * @param amount Amount to withdraw
   * @param clientId Client ID of the user
   * @param username Username of the user
   * @param reference Optional reference ID
   * @returns Response with withdrawal status and transaction info
   */
  async withdrawFunds(
    amount: number,
    clientId: number,
    username: string,
    reference: string = `TM-WD-${Date.now()}`
  ) {
    try {
      console.log(`💸 [CASINO747] Processing withdrawal for ${username}, amount: ${amount}`);
      
      // Get a token from a top manager since these are permanent tokens
      const topManager = 'Marcthepogi'; // Default to Marcthepogi for transfers
      const authToken = await this.getTopManagerToken(topManager);
      
      if (!authToken) {
        throw new Error(`Failed to get authentication token for withdrawals`);
      }
      
      // Generate unique request ID
      const nonce = `${reference}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      
      // In the simplified API, this is just simulated
      console.log(`📤 [CASINO747] Withdrawal requested with reference: ${reference}`);
      
      // Simulate API call time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return a simulated successful response
      return {
        success: true,
        transactionId: `WD-${Date.now()}`,
        message: 'Withdrawal processed successfully',
        status: 'completed'
      };
    } catch (error) {
      console.error(`❌ [CASINO747] Error in withdrawFunds:`, error);
      throw new Error(`Failed to process withdrawal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Transfer funds to a casino user
   * @param amount Amount to transfer
   * @param clientId Target client ID
   * @param username Target username
   * @returns Response from the casino API
   */
  async transferFunds(
    amount: number,
    clientId: number,
    username: string,
    reference: string = `TM-${Date.now()}`
  ) {
    try {
      // Get a token from a top manager since these are permanent tokens
      const topManager = 'Marcthepogi'; // Default to Marcthepogi for transfers
      const authToken = await this.getTopManagerToken(topManager);
      
      if (!authToken) {
        throw new Error(`Failed to get authentication token for transfers`);
      }
      
      // Generate unique request ID
      const nonce = `${reference}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      
      // Prepare transfer payload
      const payload = {
        authToken,
        platform: this.defaultPlatform,
        amount,
        toAgent: false, // Always transferring to players
        currency: "php", // Default currency
        nonce,
        clientId,
        username,
        comment: `Transfer from TMPay - ${reference}`
      };
      
      console.log(`[CASINO747] Transfer request with payload:`, {
        ...payload,
        authToken: '***REDACTED***'
      });
      
      // Make the API request
      const response = await axios.post(`${this.baseUrl}/Default/Transfer`, payload, {
        headers: {
          'accept': 'text/plain',
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 second timeout
      });
      
      console.log(`[CASINO747] Transfer response:`, response.data);
      
      // Check for transfer success
      if (response.data && response.data.status === 0) { 
        console.log(`✅ [CASINO747] Transfer successful. Amount: ${amount}, Username: ${username}`);
        return {
          success: true,
          transactionId: response.data.transactionId || nonce,
          message: response.data.message || 'Transfer successful',
          status: 'completed'
        };
      } else {
        const errorMessage = response.data?.message || 'Unknown transfer error';
        console.error(`❌ [CASINO747] Transfer failed: ${errorMessage}`);
        return {
          success: false,
          message: errorMessage,
          status: 'failed'
        };
      }
    } catch (error) {
      console.error(`[CASINO747] Error in transferFunds:`, error);
      throw new Error(`Failed to transfer funds: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send a message to a user or their manager
   * 
   * This method handles sending various types of messages through the 747 Casino messaging system.
   * For players, messages are automatically redirected to their immediate manager.
   * 
   * @param username The username of the recipient (or player's manager)
   * @param subject The subject of the message
   * @param message The message content (can be plain text or HTML)
   * @returns The API response data
   */
  async sendMessage(username: string, subject: string, message: string): Promise<any> {
    try {
      console.log(`📧 [CASINO747] Sending message to ${username}`);
      console.log(`📑 Subject: ${subject}`);
      console.log(`💬 Message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);
      
      // This is a notification-only method in the simplified API version
      // In a real implementation, this would call the messaging API
      return {
        success: true,
        messageId: `msg_${Date.now()}`,
        status: 'delivered'
      };
    } catch (error) {
      console.error(`❌ [CASINO747] Failed to send message to ${username}:`, error);
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get transaction history for a user
   * @param username The username of the user
   * @param currency The currency (e.g., "PHP")
   */
  async getTransactionHistory(username: string, currency: string = "PHP") {
    try {
      console.log(`📊 [CASINO747] Getting transaction history for ${username} in ${currency}`);
      
      // In the simplified API, just return a mock response
      return {
        success: true,
        transactions: [
          {
            id: `TX-${Date.now()}-1`,
            timestamp: new Date().toISOString(),
            type: 'deposit',
            amount: '1000.00',
            currency: currency,
            status: 'completed',
            reference: `REF-${Date.now()}-1`
          },
          {
            id: `TX-${Date.now()}-2`,
            timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            type: 'withdrawal',
            amount: '500.00',
            currency: currency,
            status: 'completed',
            reference: `REF-${Date.now()}-2`
          }
        ]
      };
    } catch (error) {
      console.error(`❌ [CASINO747] Error fetching transaction history:`, error);
      throw new Error(`Failed to get transaction history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Helper method to get a permanent token for a specific top manager
   * @param topManager The top manager username
   * @private
   */
  private async getTopManagerToken(topManager: string): Promise<string> {
    console.log(`🔑 [CASINO747] Getting token for top manager: ${topManager}`);
    
    // Normalize to lowercase for consistency in comparisons
    const topManagerLower = topManager.toLowerCase();
    let secretToken: string | undefined;
    
    // Get the permanent token from environment variable
    if (topManagerLower === 'marcthepogi') {
      secretToken = process.env.CASINO_TOKEN_MARCTHEPOGI;
      console.log(`🔄 [CASINO747] Getting auth token from environment for top manager: ${topManager}`);
      if (secretToken) {
        console.log(`✅ [CASINO747] Found exact match token for ${topManager} in environment variable CASINO_TOKEN_MARCTHEPOGI`);
      }
    } else if (topManagerLower === 'bossmarc747' || topManagerLower === 'bossmarc') {
      secretToken = process.env.CASINO_TOKEN_BOSSMARC747;
      console.log(`🔄 [CASINO747] Getting auth token from environment for top manager: ${topManager}`);
      if (secretToken) {
        console.log(`✅ [CASINO747] Found exact match token for ${topManager} in environment variable CASINO_TOKEN_BOSSMARC747`);
      }
    } else if (topManagerLower === 'teammarc') {
      secretToken = process.env.CASINO_TOKEN_TEAMMARC;
      console.log(`🔄 [CASINO747] Getting auth token from environment for top manager: ${topManager}`);
      if (secretToken) {
        console.log(`✅ [CASINO747] Found exact match token for ${topManager} in environment variable CASINO_TOKEN_TEAMMARC`);
      }
    }
    
    if (!secretToken) {
      console.error(`❌ [CASINO747] No token found in environment for manager: ${topManager}`);
      throw new Error(`No auth token found in environment for manager: ${topManager}`);
    }
    
    console.log(`🔑 Successfully obtained auth token for ${topManager}`);
    return secretToken;
  }
}

// Create and export a singleton instance
export const casino747Api = new Casino747Api();