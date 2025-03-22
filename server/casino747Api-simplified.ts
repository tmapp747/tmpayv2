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
   * 
   * This implements the actual messaging API integration to notify managers about
   * successful deposits from their players. In production, we rely on the user's
   * established hierarchy information as they're already logged in.
   * 
   * @param username The player's username who made the deposit
   * @param details The deposit details including amount, method, etc.
   * @param managerOverride Optional parameter to directly specify the manager (for testing)
   * @param userInfo Optional user object with hierarchy info (to avoid redundant DB lookups)
   * @returns Object with success flag, delivered status, messageId (if sent), and status message
   */
  async sendDepositNotification(
    username: string, 
    details: {
      amount: number;
      currency: string;
      method: string;
      reference: string;
      timestamp: Date;
    },
    managerOverride?: string,
    userInfo?: {
      immediateManager?: string;
      topManager?: string;
    }
  ): Promise<{
    success: boolean;
    delivered: boolean;
    messageId?: string;
    message: string;
    timedOut?: boolean;
  }> {
    try {
      // Validate input parameters
      if (!username || username.trim() === '') {
        return {
          success: false,
          delivered: false,
          message: "Username is required for sending notification"
        };
      }

      if (!details || typeof details.amount !== 'number' || !details.timestamp) {
        return {
          success: false,
          delivered: false,
          message: "Invalid deposit details provided"
        };
      }

      console.log(`📧 [CASINO747] Sending deposit notification for player: ${username}`);
      
      // Use manager override if provided, otherwise use provided userInfo or fetch from database
      let finalManager: string | undefined = managerOverride;
      let topManager = 'Marcthepogi';
      
      if (!managerOverride) {
        // Check if user info was provided (from active session)
        if (userInfo && userInfo.immediateManager) {
          console.log(`ℹ️ [CASINO747] Using provided user info with immediate manager: ${userInfo.immediateManager}`);
          finalManager = userInfo.immediateManager;
          topManager = userInfo.topManager || 'Marcthepogi';
        } else {
          console.log(`🔍 [CASINO747] No user info provided, looking up from database`);
          
          // Step 1: Get user details including hierarchy information from the database
          const dbUserInfo = await storage.getUserByUsername(username);
          
          if (!dbUserInfo) {
            console.log(`⚠️ [CASINO747] User info not found in database, using default manager: Platalyn`);
            finalManager = 'Platalyn'; // Default fallback when no user info exists
          } else {
            // Step 2: Extract immediate manager information
            const immediateManager = dbUserInfo.immediateManager;
            topManager = dbUserInfo.topManager || 'Marcthepogi';
            
            // If user has no immediate manager, try to get hierarchy info first
            if (!immediateManager) {
              try {
                console.log(`ℹ️ [CASINO747] No immediate manager found for ${username}, fetching hierarchy info`);
                // Try to fetch hierarchy info to get the manager
                await this.getUserHierarchy(username, false);
                
                // After getting hierarchy info, fetch the user again
                const updatedUser = await storage.getUserByUsername(username);
                if (updatedUser && updatedUser.immediateManager) {
                  console.log(`✅ [CASINO747] Found immediate manager for ${username}: ${updatedUser.immediateManager}`);
                  finalManager = updatedUser.immediateManager;
                } else {
                  console.log(`⚠️ [CASINO747] Still no immediate manager found for ${username} after hierarchy lookup`);
                  finalManager = 'Platalyn'; // Default fallback
                }
              } catch (hierarchyError) {
                console.error(`❌ [CASINO747] Failed to get hierarchy info: ${hierarchyError}`);
                finalManager = 'Platalyn'; // Default fallback on error
              }
            } else {
              finalManager = immediateManager;
            }
          }
        }
        
        // Double-check the final manager value for safety
        if (!finalManager) {
          finalManager = 'Platalyn';
        }
      } else {
        console.log(`ℹ️ [CASINO747] Using provided manager override: ${managerOverride}`);
      }
      
      // If still no manager, we can't send a notification
      if (!finalManager) {
        console.log(`ℹ️ [CASINO747] User ${username} has no immediate manager. Notification skipped.`);
        return {
          success: true,
          delivered: false,
          message: "User has no immediate manager to notify"
        };
      }
      
      // Step 3: Get authentication token using top manager
      let authToken: string;
      try {
        authToken = await this.getTopManagerToken(topManager);
      } catch (tokenError) {
        console.error(`❌ [CASINO747] Failed to get auth token for sending notification:`, tokenError);
        return {
          success: false,
          delivered: false,
          message: `Authentication error: ${tokenError instanceof Error ? tokenError.message : 'Token unavailable'}`
        };
      }
      
      // Format the amount value properly
      const formattedAmount = typeof details.amount === 'number' 
        ? details.amount.toFixed(2) 
        : parseFloat(details.amount.toString()).toFixed(2);
      
      // Step 4: Format date properly with fallback
      let formattedDate: string;
      try {
        formattedDate = new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        }).format(details.timestamp);
      } catch (dateError) {
        console.warn(`⚠️ [CASINO747] Error formatting date, using current time instead:`, dateError);
        formattedDate = new Date().toLocaleString('en-US');
      }
      
      // Step 5: Create notification message with HTML formatting
      const subject = `Deposit Notification for Player ${username}`;
      
      // Enhanced HTML template with better formatting and mobile responsiveness
      const message = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deposit Notification - 747 eWallet</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background: #FFFFFF;
      border-radius: 10px;
      box-shadow: 0 4px 8px rgba(12, 31, 63, 0.15);
      overflow: hidden;
    }
    .header {
      background-color: #0C1F3F;
      padding: 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 26px;
      font-weight: bold;
      line-height: 1.4;
    }
    .green {
      color: #00A678;
    }
    .white {
      color: #FFFFFF;
    }
    .body {
      padding: 25px;
      color: #333333;
      line-height: 1.6;
    }
    .body h2 {
      color: #00A678;
      font-size: 22px;
      margin-top: 0;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
    }
    .details {
      margin-top: 20px;
      font-size: 16px;
    }
    .details p {
      margin: 10px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #f0f0f0;
    }
    .details p:last-child {
      border-bottom: none;
    }
    .success-box {
      background-color: #E8F9F1;
      border-left: 5px solid #00A678;
      padding: 20px;
      margin: 25px 0;
      border-radius: 0 4px 4px 0;
    }
    .footer {
      background-color: #0C1F3F;
      color: #FFFFFF;
      text-align: center;
      padding: 20px;
      font-size: 14px;
    }
    .footer a {
      color: #00A678;
      text-decoration: none;
      font-weight: bold;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    .highlight {
      font-weight: bold;
      color: #00A678;
    }
    @media only screen and (max-width: 480px) {
      .email-container {
        margin: 10px;
        width: auto;
      }
      .body {
        padding: 15px;
      }
    }
    </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1><span class="green">747</span><span class="white"> e-Wallet</span></h1>
    </div>
    <div class="body">
      <h2>✅ Deposit Successful!</h2>
      <p>Dear <strong>${finalManager}</strong>,</p>
      <p>Your player <strong>${username}</strong> has successfully deposited funds to their account. The transaction has been completed and the funds have been credited to the player's casino wallet.</p>
      
      <div class="success-box">
        <div class="details">
          <p><strong>Username:</strong> ${username}</p>
          <p><strong>Amount:</strong> <span class="highlight">₱${formattedAmount}</span></p>
          <p><strong>Payment Method:</strong> ${details.method}</p>
          <p><strong>Reference:</strong> ${details.reference}</p>
          <p><strong>Date & Time:</strong> ${formattedDate}</p>
          <p><strong>Status:</strong> ✅ Payment Completed</p>
          <p><strong>Casino Wallet:</strong> ✅ Funds Added</p>
        </div>
      </div>

      <p>The player has been notified of the successful transaction. If they have any questions, please assist them through your agent portal.</p>
      <p>Thank you for using 747 e-Wallet services!</p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} 747 eWallet Casino | <a href="https://747ph.live/support">Contact Support</a>
    </div>
  </div>
</body>
</html>`;
      
      // Step 6: Send notification to immediate manager with timeout protection
      console.log(`📤 [CASINO747] Sending deposit notification to ${finalManager} for player ${username}`);
      
      // Create timeout promise to ensure we don't hang indefinitely
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('API request timed out after 15 seconds')), 15000);
      });
      
      try {
        // Race the actual API call against the timeout
        const response = await Promise.race([
          axios.post(`${this.baseUrl}/Default/SendMessage`, {
            authToken,
            platform: this.defaultPlatform,
            username: finalManager,
            subject,
            message
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'text/plain'
            }
          }),
          timeoutPromise
        ]);
        
        console.log(`✅ [CASINO747] Deposit notification sent successfully to ${finalManager}`);
        return {
          success: true,
          delivered: true,
          messageId: response.data?.messageId || `msg_${Date.now()}`,
          message: "Notification sent successfully"
        };
      } catch (apiError) {
        // Check if this was a timeout error
        if (apiError instanceof Error && apiError.message.includes('timed out')) {
          console.warn(`⏱️ [CASINO747] Notification request timed out after 15 seconds`);
          return {
            success: true, // Consider it possibly successful since the message might still be delivered
            delivered: false,
            timedOut: true,
            message: `Request timed out, notification status unknown`
          };
        }
        
        // Handle other API errors
        console.error(`❌ [CASINO747] Error sending notification to ${finalManager}:`, apiError);
        
        if (axios.isAxiosError(apiError)) {
          return {
            success: false,
            delivered: false,
            message: `API error (${apiError.response?.status || 'unknown'}): ${
              apiError.response?.data?.message || apiError.message || 'Unknown error'
            }`
          };
        } else {
          return {
            success: false,
            delivered: false,
            message: `Failed to send notification: ${apiError instanceof Error ? apiError.message : 'API error'}`
          };
        }
      }
    } catch (error) {
      console.error(`❌ [CASINO747] Error in sendDepositNotification:`, error);
      
      // Notification failures should be logged but not stop the transaction
      return {
        success: false,
        delivered: false,
        message: `Error processing notification: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
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
   * Get user details from the 747 API using the direct API endpoint
   * This uses the optimized direct API endpoint: https://tmpay747.azurewebsites.net/api/Bridge/get-user/{username}
   * which provides comprehensive user statistics including:
   * - Current balance
   * - Detailed betting statistics
   * - Complete turnover information
   * - Manager hierarchy
   * 
   * @param username The username to look up
   */
  async getUserDetails(username: string) {
    try {
      console.log(`📊 [CASINO747] Fetching detailed user data for ${username} from TM Pay API`);
      
      // Make direct API call to the optimized endpoint
      const response = await axios.get(`${this.userLookupUrl}/${username}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*'
        },
        timeout: 10000 // 10-second timeout for better reliability
      });
      
      // Log successful response
      console.log(`✅ [CASINO747] Successfully fetched data for ${username} from TM Pay API`);
      
      // Log detailed stats for debugging
      if (response.data && response.data.turnOver) {
        console.log(`📈 [STATS] ${username} - Balance: ${response.data.turnOver.currentBalance}, Bets: ${response.data.turnOver.totalBetAmount}, Deposits: ${response.data.turnOver.depositAmount}`);
      }
      
      return response.data;
    } catch (error) {
      // Enhanced error logging
      console.error(`❌ [CASINO747] Error fetching user details for ${username}:`, error);
      
      // Detailed error output based on error type
      if (axios.isAxiosError(error)) {
        console.error(`API Error: ${error.message}`);
        if (error.response) {
          console.error(`Response status: ${error.response.status}`);
          console.error(`Response data:`, error.response.data);
        }
      }
      
      throw new Error(`Failed to fetch user details from TM Pay API: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    
    // Function to get token from environment with proper logging
    const getTokenFromEnv = (envVar: string, managerName: string): string | undefined => {
      const token = process.env[envVar];
      console.log(`🔄 [CASINO747] Getting auth token from environment for ${managerName} using ${envVar}`);
      
      if (token) {
        console.log(`✅ [CASINO747] Found token for ${managerName} in environment variable ${envVar}`);
        return token;
      }
      
      console.log(`❌ [CASINO747] No token found in ${envVar} for ${managerName}`);
      return undefined;
    };
    
    // Try to get the specific token for this manager first
    if (topManagerLower === 'marcthepogi') {
      secretToken = getTokenFromEnv('CASINO_TOKEN_MARCTHEPOGI', topManager);
    } else if (topManagerLower === 'bossmarc747' || topManagerLower === 'bossmarc') {
      secretToken = getTokenFromEnv('CASINO_TOKEN_BOSSMARC747', topManager);
    } else if (topManagerLower === 'teammarc') {
      secretToken = getTokenFromEnv('CASINO_TOKEN_TEAMMARC', topManager);
    }
    
    // If we didn't find a token for the requested manager, try the default managers
    if (!secretToken) {
      console.log(`⚠️ [CASINO747] No specific token found for ${topManager}, trying fallback tokens...`);
      
      // Try each of our default managers' tokens in order
      for (const fallbackManager of this.defaultTopManagers) {
        if (fallbackManager.toLowerCase() === 'marcthepogi') {
          secretToken = getTokenFromEnv('CASINO_TOKEN_MARCTHEPOGI', fallbackManager);
        } else if (fallbackManager.toLowerCase() === 'bossmarc747') {
          secretToken = getTokenFromEnv('CASINO_TOKEN_BOSSMARC747', fallbackManager);
        } else if (fallbackManager.toLowerCase() === 'teammarc') {
          secretToken = getTokenFromEnv('CASINO_TOKEN_TEAMMARC', fallbackManager);
        }
        
        if (secretToken) {
          console.log(`🔄 [CASINO747] Using ${fallbackManager}'s token as fallback for ${topManager}`);
          break;
        }
      }
    }
    
    // Final check if we found a token
    if (!secretToken) {
      console.error(`❌ [CASINO747] No token found for ${topManager} or any fallback managers`);
      throw new Error(`No auth token found for ${topManager} or any fallback managers. Check environment variables.`);
    }
    
    console.log(`🔑 [CASINO747] Successfully obtained auth token for ${topManager}`);
    return secretToken;
  }
}

// Create and export a singleton instance
export const casino747Api = new Casino747Api();