import axios from 'axios';
import { storage } from './storage';

/**
 * API client for interacting with the 747 Casino API
 */
export class Casino747Api {
  private baseUrl: string = 'https://bridge.747lc.com';
  private userLookupUrl: string = 'https://tmpay747.azurewebsites.net/api/Bridge/get-user';
  private tokenCacheMap: Map<string, { token: string, expiry: Date }> = new Map();
  
  constructor(
    private readonly apiKey: string = '', 
    private readonly defaultPlatform: number = 1,
    private readonly tokenExpiryMinutes: number = 30
  ) {
    // Initialize tokens for allowed top managers
    this.initTokens();
  }
  
  /**
   * Initialize auth tokens for all top managers when the API client is created
   * This ensures we have valid tokens ready for immediate use
   */
  private async initTokens() {
    try {
      // List of our allowed top managers
      const allowedTopManagers = ['Marcthepogi', 'bossmarc747', 'teammarc'];
      
      // Initialize tokens for each manager
      for (const manager of allowedTopManagers) {
        try {
          // Check if we already have a token from a user in the database
          const user = await storage.getUserByTopManager(manager);
          
          if (user && user.casinoAuthToken && user.casinoAuthTokenExpiry) {
            // If token exists but is expired or close to expiry, refresh it
            const now = new Date();
            // If token expires in less than 5 minutes, refresh it
            const expiryBuffer = new Date(now.getTime() + 5 * 60 * 1000);
            
            if (user.casinoAuthTokenExpiry < expiryBuffer) {
              console.log(`Token for ${manager} is close to expiry, refreshing...`);
              const { token, expiry } = await this.fetchNewAuthToken(manager);
              await storage.updateUserCasinoAuthToken(user.id, token, expiry);
              this.tokenCacheMap.set(manager, { token, expiry });
            } else {
              // Token is still valid, cache it
              console.log(`Using existing valid token for ${manager}`);
              this.tokenCacheMap.set(manager, { 
                token: user.casinoAuthToken, 
                expiry: user.casinoAuthTokenExpiry 
              });
            }
          } else {
            // No token exists for this manager, create one
            console.log(`No token found for ${manager}, generating new one...`);
            const { token, expiry } = await this.fetchNewAuthToken(manager);
            
            if (user) {
              await storage.updateUserCasinoAuthToken(user.id, token, expiry);
            }
            
            this.tokenCacheMap.set(manager, { token, expiry });
          }
        } catch (error) {
          console.error(`Error initializing token for ${manager}:`, error);
          // Continue with other managers even if one fails
        }
      }
      
      console.log('Finished initializing casino API tokens');
    } catch (error) {
      console.error('Error during token initialization:', error);
      // Don't throw error here as it would break the constructor
    }
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
      console.log(`👑 Getting auth token for top manager: ${topManager}`);
      
      // Get fresh auth token using the top manager
      const authToken = await this.getTopManagerToken(topManager);
      
      if (!authToken) {
        throw new Error(`Could not obtain valid auth token for manager ${topManager}`);
      }
      
      console.log(`🔑 Successfully obtained auth token for ${topManager}`);
      
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
        // For 401/403 errors, clear the token cache to force refresh next time
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.error('Authentication error with casino API. Clearing token cache.');
          this.tokenCacheMap.clear();
        }
        
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
   * Generate a crypto deposit address for a user
   * @param clientId The client ID of the user
   * @param ticker The cryptocurrency ticker (e.g., "USDT")
   */
  async generateCryptoAddress(clientId: number, ticker: string) {
    try {
      // Get user details first to determine the correct authToken
      const userDetails = await this.getUserDetails(clientId.toString());
      const authToken = await this.getAuthToken(userDetails.username);
      
      const response = await axios.post(`${this.baseUrl}/payments/generate-cryptapi-address`, {
        authToken,
        platform: this.defaultPlatform,
        clientId,
        ticker
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error generating crypto address:', error);
      throw new Error('Failed to generate crypto address from 747 Casino API');
    }
  }

  /**
   * Process a withdrawal for a user
   * @param clientId The client ID of the user
   * @param amount The amount to withdraw
   * @param currency The currency ID (1 for USD)
   * @param destinationNetwork The destination network (e.g., "ETH")
   * @param address The destination address
   */
  /**
   * Make a GCash deposit request to the casino
   * @param clientId The client ID making the deposit
   * @param amount Deposit amount (default 100)
   * @param currency Currency code (default PHP)
   */
  async makeDeposit(clientId: number, amount: number = 100, currency: string = "PHP") {
    try {
      console.log(`[CASINO747] Making deposit request for client ${clientId}`);
      const authToken = await this.getAuthToken('system');
      
      const response = await axios.post(`${this.baseUrl}/payments/deposit`, {
        authToken,
        platform: this.defaultPlatform,
        clientId,
        amount,
        currency
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      console.log(`[CASINO747] Deposit request response:`, response.data);
      return response.data.transactionId;
    } catch (error) {
      console.error('[CASINO747] Error making deposit:', error);
      throw new Error('Failed to initiate casino deposit');
    }
  }

  /**
   * Generate a GCash QR code for payment
   * @param clientId The client ID for payment
   * @param amount Payment amount 
   */
  async generateGcashQR(clientId: number, amount: number = 100) {
    try {
      console.log(`[CASINO747] Generating GCash QR for client ${clientId}`);
      const authToken = await this.getAuthToken('system');
      
      const response = await axios.post(`${this.baseUrl}/payments/generate-gcash-qr`, {
        authToken,
        platform: this.defaultPlatform,
        clientId,
        amount
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      return response.data.qrCodeUrl;
    } catch (error) {
      console.error('[CASINO747] Error generating QR:', error);
      throw new Error('Failed to generate GCash QR code');
    }
  }

  /**
   * Check the status of a GCash payment
   * @param transactionId The transaction ID to check
   */
  async checkGcashPaymentStatus(transactionId: string) {
    try {
      console.log(`[CASINO747] Checking payment status for ${transactionId}`);
      const authToken = await this.getAuthToken('system');
      
      const response = await axios.post(`${this.baseUrl}/payments/check-gcash-status`, {
        authToken,
        platform: this.defaultPlatform,
        transactionId
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      return response.data.status;
    } catch (error) {
      console.error('[CASINO747] Error checking payment status:', error);
      throw new Error('Failed to check payment status');
    }
  }

  /**
   * Update the casino deposit status
   * @param clientId The client ID
   * @param newStatus The new status to set
   */
  async updateCasinoStatus(clientId: number, newStatus: string) {
    try {
      console.log(`[CASINO747] Updating casino status for client ${clientId} to ${newStatus}`);
      const authToken = await this.getAuthToken('system');
      
      const response = await axios.post(`${this.baseUrl}/casino/update-status`, {
        authToken,
        platform: this.defaultPlatform,
        clientId,
        status: newStatus
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      return response.data;
    } catch (error) {
      console.error('[CASINO747] Error updating casino status:', error);
      throw new Error('Failed to update casino status');
    }
  }

  async withdrawFunds(
    clientId: number, 
    amount: number, 
    currency: number = 1,
    destinationCurrency: number = 1,
    destinationNetwork: string = "ETH",
    address: string
  ) {
    try {
      // Get user details first to determine the correct authToken
      const userDetails = await this.getUserDetails(clientId.toString());
      const authToken = await this.getAuthToken(userDetails.username);
      
      // Generate a unique ID for this transaction
      const uniqueId = Date.now();
      
      const response = await axios.post(`${this.baseUrl}/payments/withdraw`, {
        authToken,
        platform: this.defaultPlatform,
        amount,
        currency,
        destinationCurrency,
        destinationNetwork,
        address,
        uniqueId,
        clientId
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      throw new Error('Failed to process withdrawal with 747 Casino API');
    }
  }

  /**
   * Get transaction history for a user
   * @param username The username of the user
   * @param currency The currency (e.g., "USD")
   */
  async getTransactionHistory(username: string, currency: string = "USD") {
    try {
      // Make sure we have a valid auth token
      const authToken = await this.getAuthToken(username);
      
      const response = await axios.post(`${this.baseUrl}/statistics/transactions-by-client-username`, {
        authToken,
        currency,
        username
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      throw new Error('Failed to fetch transaction history from 747 Casino API');
    }
  }

  /**
   * Transfer funds between users in the casino system
   * @param amount The amount to transfer
   * @param toClientId The recipient's client ID
   * @param toUsername The recipient's username
   * @param currency The currency (e.g., "USD")
   * @param fromUsername The sender's username
   * @param comment Optional comment for the transfer
   */
  async transferFunds(
    amount: number,
    toClientId: number,
    toUsername: string,
    currency: string = "php", // Changed default to "php" instead of "USD"
    fromUsername: string,
    comment: string = "Transfer from e-wallet"
  ) {
    try {
      // Make sure we have a valid auth token - this is a critical step
      console.log(`🔑 [CASINO747] Getting auth token for user: ${fromUsername}`);
      const authToken = await this.getAuthToken(fromUsername);
      
      if (!authToken) {
        console.error(`❌ [CASINO747] Failed to get auth token for ${fromUsername}`);
        throw new Error(`Failed to obtain auth token for ${fromUsername}`);
      }
      
      console.log(`✅ [CASINO747] Successfully obtained auth token for ${fromUsername}`);
      
      // Generate a unique nonce for this transaction
      const nonce = `NONCE-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      
      console.log(`💰 [CASINO747] Transfer attempt: Amount ${amount} ${currency} to ${toUsername} (ID: ${toClientId}) from ${fromUsername}`);
      
      // Prepare the exact request payload as specified in the API documentation
      const requestPayload = {
        authToken: authToken,
        platform: this.defaultPlatform,
        amount: amount,
        toAgent: false,
        currency: currency.toLowerCase(), // Ensure lowercase as per example
        nonce: nonce,
        clientId: toClientId,
        username: toUsername,
        comment: comment
      };
      
      console.log(`📝 [CASINO747] Transfer payload:`, {
        ...requestPayload, 
        authToken: "***REDACTED***" // Hide token for security
      });
      
      // Add timeout and retry logic for reliability
      let attempts = 0;
      const maxAttempts = 3;
      let lastError = null;
      
      while (attempts < maxAttempts) {
        try {
          attempts++;
          console.log(`🔄 [CASINO747] Transfer attempt ${attempts}/${maxAttempts}`);
          
          // Set up the exact request format as required by the API
          const response = await axios.post(`${this.baseUrl}/Default/Transfer`, requestPayload, {
            headers: {
              'accept': 'text/plain',
              'Content-Type': 'application/json'
            },
            timeout: 15000 // 15 second timeout
          });
          
          console.log(`✅ [CASINO747] Transfer response:`, response.data);
          
          // Special handling for the 747 Casino API response format
          // The API returns { status: 0, message: 'ok' } for success
          if (response.data && response.data.status === 0 && response.data.message === 'ok') {
            console.log(`✅ [CASINO747] Transfer successful with status 0 and message 'ok'`);
            
            // Success - break out of retry loop
            return {
              success: true,
              transactionId: `TRF-${Date.now()}`,
              message: 'Transfer completed successfully',
              newBalance: amount // We don't get new balance in the response, so just use the amount as an approximation
            };
          }
          
          // Check for specific error conditions in successful response
          if (response.data && (response.data.error || (response.data.hasOwnProperty('success') && !response.data.success))) {
            console.error(`❌ [CASINO747] API returned error in response body:`, response.data);
            throw new Error(response.data.error || 'API reported transfer failure');
          }
          
          // Success - break out of retry loop
          return {
            ...response.data,
            success: true, // Explicitly mark as successful
            transactionId: response.data.transactionId || `TRF-${Date.now()}`,
            newBalance: response.data.newBalance || amount // If no balance is returned, use the amount
          };
        } catch (attemptError) {
          lastError = attemptError;
          console.error(`❌ [CASINO747] Transfer attempt ${attempts} failed:`, attemptError);
          
          // Only retry on network errors or 5xx server errors
          if (axios.isAxiosError(attemptError)) {
            if (!attemptError.response || attemptError.response.status >= 500) {
              console.log(`🔄 [CASINO747] Will retry transfer after delay...`);
              await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds before retry
              continue;
            }
          }
          
          // For 4xx errors or other issues, fail immediately
          break;
        }
      }
      
      // If we get here, all attempts failed
      console.error(`❌ [CASINO747] All ${maxAttempts} transfer attempts failed`);
      throw lastError || new Error('Failed to transfer funds after multiple attempts');
    } catch (error) {
      console.error('❌ [CASINO747] Error transferring funds:', error);
      
      // Provide detailed error information
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('Transfer API response error:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            headers: error.response.headers
          });
        } else if (error.request) {
          console.error('Transfer API request error (no response):', {
            message: error.message,
            config: error.config
          });
        } else {
          console.error('Transfer API request setup error:', error.message);
        }
      }
      
      // Create a descriptive error message
      const errorMessage = axios.isAxiosError(error) && error.response 
        ? `Casino API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
        : 'Failed to transfer funds using 747 Casino API';
        
      throw new Error(errorMessage);
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
  async sendMessage(username: string, subject: string, message: string) {
    try {
      // Get user details to check if they are a player or agent
      const userDetails = await this.getUserDetails(username);
      
      // If the user is a player, send the message to their immediate manager
      const recipientUsername = userDetails.isAgent ? username : userDetails.immediateManager;
      
      // Make sure we have a valid auth token based on the top manager
      const authToken = await this.getAuthToken(userDetails.topManager);
      
      console.log(`[CASINO747] Sending message to ${recipientUsername} with subject: ${subject}`);
      
      // Create the request payload exactly as specified in the API documentation
      const requestPayload = {
        authToken,
        platform: this.defaultPlatform,
        username: recipientUsername,
        subject,
        message
      };
      
      const response = await axios.post(`${this.baseUrl}/Default/SendMessage`, requestPayload, {
        headers: {
          'accept': 'text/plain',
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`[CASINO747] Message sent successfully to ${recipientUsername}`);
      
      return response.data;
    } catch (error) {
      console.error('[CASINO747] Error sending message:', error);
      
      // Provide detailed error information
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('[CASINO747] Message API response error:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          });
        } else if (error.request) {
          console.error('[CASINO747] Message API request error (no response):', {
            message: error.message
          });
        }
      }
      
      throw new Error('Failed to send message using 747 Casino API');
    }
  }
  
  /**
   * Send a deposit notification to a player's manager with formatted HTML content
   * 
   * This method creates a beautifully formatted HTML notification about a completed deposit
   * transaction and sends it to the appropriate manager (usually the immediate manager).
   * 
   * @param playerUsername The username of the player who made the deposit
   * @param transactionDetails Object containing transaction details
   * @param transactionDetails.amount The amount deposited
   * @param transactionDetails.currency The currency code (default: PHP)
   * @param transactionDetails.method The payment method used (e.g., "GCash QR", "Direct GCash")
   * @param transactionDetails.reference The transaction reference ID
   * @param transactionDetails.timestamp The timestamp of the transaction
   * @returns The API response data
   */
  async sendDepositNotification(
    playerUsername: string, 
    transactionDetails: {
      amount: number | string;
      currency?: string;
      method?: string;
      reference?: string;
      timestamp?: Date | string;
    }
  ) {
    try {
      // Format details for the notification
      const {
        amount,
        currency = "PHP",
        method = "GCash",
        reference = "",
        timestamp = new Date()
      } = transactionDetails;
      
      // Format the date string
      const formattedDate = typeof timestamp === 'string' 
        ? new Date(timestamp).toLocaleString() 
        : timestamp.toLocaleString();
      
      // Format the amount with commas and decimal places
      const formattedAmount = typeof amount === 'number'
        ? amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : amount;
      
      // Create an HTML message with a card-style layout
      const htmlMessage = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Deposit Notification - 747 eWallet</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { width: 100%; max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #2c3e50, #1a252f); color: white; padding: 20px; text-align: center; }
        .logo { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .content { padding: 20px; }
        .card { border: 1px solid #eaeaea; border-radius: 6px; padding: 15px; margin-bottom: 20px; }
        .card-header { border-bottom: 1px solid #eaeaea; padding-bottom: 10px; margin-bottom: 15px; }
        .card-title { font-size: 18px; font-weight: bold; margin: 0; color: #2c3e50; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .detail-label { color: #7f8c8d; font-size: 14px; }
        .detail-value { font-weight: bold; color: #2c3e50; font-size: 14px; }
        .amount { font-size: 24px; font-weight: bold; color: #27ae60; text-align: center; margin: 15px 0; }
        .status { display: inline-block; background-color: #27ae60; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; }
        .footer { background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #95a5a6; }
        .button { display: inline-block; background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">747 E-LOADING WALLET</div>
            <div>Deposit Notification</div>
        </div>
        
        <div class="content">
            <p>Dear Manager,</p>
            
            <p>A player under your management has successfully completed a deposit transaction. The funds have been transferred to their casino wallet.</p>
            
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Transaction Details</h2>
                </div>
                
                <div class="amount">${currency} ${formattedAmount}</div>
                
                <div class="detail-row">
                    <span class="detail-label">Player Username:</span>
                    <span class="detail-value">${playerUsername}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Payment Method:</span>
                    <span class="detail-value">${method}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Reference ID:</span>
                    <span class="detail-value">${reference}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Timestamp:</span>
                    <span class="detail-value">${formattedDate}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="status">COMPLETED</span>
                </div>
            </div>
            
            <p>Please visit the casino dashboard to view more details about this transaction or to assist the player if needed.</p>
            
            <div style="text-align: center;">
                <a href="https://bridge.747lc.com/dashboard" class="button">View Dashboard</a>
            </div>
        </div>
        
        <div class="footer">
            <p>This is an automated notification from the 747 E-Loading Wallet system. Please do not reply to this message.</p>
            <p>© ${new Date().getFullYear()} 747 Casino. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
      `;
      
      // Create the subject line
      const subject = `Deposit Notification for Player ${playerUsername}`;
      
      // Send the HTML notification
      return await this.sendMessage(playerUsername, subject, htmlMessage);
      
    } catch (error) {
      console.error('[CASINO747] Error sending deposit notification:', error);
      throw new Error('Failed to send deposit notification');
    }
  }
  
  /**
   * Get a user's hierarchy from the 747 API
   * @param username The username to lookup
   * @param isAgent Whether the user is an agent (true) or player (false)
   * @returns The hierarchy details including top managers and immediate managers
   */
  async getUserHierarchy(username: string, isAgent: boolean): Promise<{
    hierarchy: Array<{
      id: number;
      clientId: number;
      username: string;
      parentClientId: number | null;
    }>;
    user: {
      id: number;
      clientId: number;
      username: string;
      parentClientId: number;
    };
    status: number;
    message: string;
  }> {
    try {
      console.log(`[CASINO747] Getting hierarchy for user: ${username}, isAgent: ${isAgent}`);
      
      // Make sure we have a valid auth token based on the user
      const authToken = await this.getAuthToken(username);
      
      // Use POST with authToken in body instead of GET with query parameters
      // as per the API specification
      const requestPayload = {
        authToken,
        platform: this.defaultPlatform,
        username,
        isAgent
      };
      
      console.log(`[CASINO747] Hierarchy request payload:`, {
        ...requestPayload,
        authToken: "***REDACTED***" // Hide token for security
      });
      
      const response = await axios.post(
        `${this.baseUrl}/Default/GetHierarchy`,
        requestPayload,
        {
          headers: {
            'accept': 'text/plain',
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`[CASINO747] Hierarchy response:`, response.data);
      
      return response.data;
    } catch (error) {
      console.error(`[CASINO747] Error fetching hierarchy for ${username}:`, error);
      
      // Provide detailed error information
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('[CASINO747] Hierarchy API response error:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          });
        } else if (error.request) {
          console.error('[CASINO747] Hierarchy API request error (no response):', {
            message: error.message
          });
        }
      }
      
      throw new Error('Failed to fetch user hierarchy from 747 Casino API');
    }
  }

  /**
   * Get the auth token for a specific user
   * @param username The username to get the auth token for
   * @private
   */
  /**
   * Helper method to get a token for a specific top manager
   * @param topManager The top manager username
   * @private
   */
  private async getTopManagerToken(topManager: string): Promise<string> {
    console.log(`🔑 [CASINO747] Getting token for top manager: ${topManager}`);
    
    // Normalize to lowercase for consistency in comparisons
    const topManagerLower = topManager.toLowerCase();
    
    // 1. Check if we have a cached token for this top manager that's not expired
    if (this.tokenCacheMap.has(topManagerLower)) {
      const cachedData = this.tokenCacheMap.get(topManagerLower)!;
      if (cachedData.expiry > new Date()) {
        console.log(`✅ [CASINO747] Using cached auth token for top manager: ${topManager}`);
        return cachedData.token;
      } else {
        console.log(`⏰ [CASINO747] Cached token expired for top manager: ${topManager}`);
        this.tokenCacheMap.delete(topManagerLower);
      }
    }
    
    // 2. Look for a user in storage with this top manager that has a valid token
    const user = await storage.getUserByTopManager(topManager);
    
    if (user && user.casinoAuthToken && user.casinoAuthTokenExpiry && user.casinoAuthTokenExpiry > new Date()) {
      console.log(`✅ [CASINO747] Using stored auth token for top manager: ${topManager} from user ${user.username}`);
      // Cache the token
      this.tokenCacheMap.set(topManagerLower, {
        token: user.casinoAuthToken,
        expiry: user.casinoAuthTokenExpiry
      });
      return user.casinoAuthToken;
    }
    
    // 3. If no valid token exists, get it from environment secrets
    console.log(`🔄 [CASINO747] Getting auth token from environment for top manager: ${topManager}`);
    
    // Get the token based on normalized top manager name
    let token: string | undefined;
    
    if (topManagerLower === 'marcthepogi') {
      token = process.env.CASINO_TOKEN_MARCTHEPOGI || 'e726f734-0b50-4ca2-b8d7-bca385955acf'; // Fallback token
      console.log(`✅ [CASINO747] Using ${token === process.env.CASINO_TOKEN_MARCTHEPOGI ? 'environment' : 'fallback'} token for Marcthepogi`);
    } else if (topManagerLower === 'bossmarc747' || topManagerLower === 'bossmarc') {
      token = process.env.CASINO_TOKEN_BOSSMARC747;
      console.log(`✅ [CASINO747] Using environment token for Bossmarc747: ${token ? 'Found' : 'Not found'}`);
    } else if (topManagerLower === 'teammarc') {
      token = process.env.CASINO_TOKEN_TEAMMARC;
      console.log(`✅ [CASINO747] Using environment token for Teammarc: ${token ? 'Found' : 'Not found'}`);
    }
    
    if (!token) {
      throw new Error(`No auth token found in environment for manager: ${topManager}`);
    }
    
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + this.tokenExpiryMinutes);
    
    // 4. Store the new token in the database if we have a user
    if (user) {
      await storage.updateUserCasinoAuthToken(user.id, token, expiryDate);
    }
    
    // 5. Cache the token
    this.tokenCacheMap.set(topManager, {
      token,
      expiry: expiryDate
    });
    
    return token;
  }

  private async getAuthToken(username: string): Promise<string> {
    try {
      // Special handling for "system" user - use Marcthepogi as the default top manager
      if (username.toLowerCase() === "system") {
        const defaultTopManager = "Marcthepogi";
        console.log(`🔑 Using default top manager (${defaultTopManager}) for system user`);
        return this.getTopManagerToken(defaultTopManager);
      }
      
      // 1. For regular users, get the user details to find the top manager
      const userDetails = await this.getUserDetails(username);
      const topManager = userDetails.topManager;
      
      if (!topManager) {
        throw new Error(`No top manager found for user: ${username}`);
      }
      
      // 2. Check if we have a cached token for this top manager that's not expired
      if (this.tokenCacheMap.has(topManager)) {
        const cachedData = this.tokenCacheMap.get(topManager)!;
        if (cachedData.expiry > new Date()) {
          console.log(`Using cached auth token for top manager: ${topManager}`);
          return cachedData.token;
        } else {
          console.log(`Cached token expired for top manager: ${topManager}`);
          this.tokenCacheMap.delete(topManager);
        }
      }
      
      // 3. Look for a user in storage with this top manager that has a valid token
      const user = await storage.getUserByTopManager(topManager);
      
      if (user && user.casinoAuthToken && user.casinoAuthTokenExpiry && user.casinoAuthTokenExpiry > new Date()) {
        console.log(`Using stored auth token for top manager: ${topManager} from user ${user.username}`);
        // Cache the token
        this.tokenCacheMap.set(topManager, {
          token: user.casinoAuthToken,
          expiry: user.casinoAuthTokenExpiry
        });
        return user.casinoAuthToken;
      }
      
      // 4. If no valid token exists, get it from environment secrets
      console.log(`Getting auth token from environment for top manager: ${topManager}`);
      
      // Make the comparison case-insensitive
      const topManagerLower = topManager.toLowerCase();
      let token: string | undefined;
      
      if (topManagerLower === 'marcthepogi' || topManagerLower === 'marcthepogi') {
        token = process.env.CASINO_TOKEN_MARCTHEPOGI;
      } else if (topManagerLower === 'bossmarc747' || topManagerLower === 'bossmarc') {
        token = process.env.CASINO_TOKEN_BOSSMARC747;
      } else if (topManagerLower === 'teammarc' || topManagerLower === 'teammarc') {
        token = process.env.CASINO_TOKEN_TEAMMARC;
      }
      
      if (!token) {
        throw new Error(`No auth token found in environment for manager: ${topManager}`);
      }
      const expiryDate = new Date();
      expiryDate.setMinutes(expiryDate.getMinutes() + this.tokenExpiryMinutes);
      
      // 5. Store the new token in the database if we have a user
      if (user) {
        await storage.updateUserCasinoAuthToken(user.id, token, expiryDate);
      }
      
      // 6. Cache the token
      this.tokenCacheMap.set(topManager, {
        token,
        expiry: expiryDate
      });
      
      return token;
    } catch (error) {
      console.error(`Error getting auth token for user ${username}:`, error);
      throw new Error(`Failed to get auth token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * In a real production implementation, this method would call the actual
   * 747 Casino API to get a new auth token.
   * @param topManager The top manager username
   * @private
   */
  private async fetchNewAuthToken(topManager: string): Promise<{ token: string, expiry: Date }> {
    // This is a placeholder for the real implementation
    // In a real environment, you would:
    // 1. Make a POST request to the auth endpoint with manager credentials
    // 2. Get the token and expiry from the response
    // 3. Return them
    
    try {
      // Simulate API call
      console.log(`Fetching new auth token for manager: ${topManager}`);
      
      // Make the comparison case-insensitive
      const topManagerLower = topManager.toLowerCase();
      let token: string | undefined;
      
      if (topManagerLower === 'marcthepogi') {
        token = process.env.CASINO_TOKEN_MARCTHEPOGI;
        console.log(`DEBUG: Attempting to fetch token for Marcthepogi: ${token ? 'Token found' : 'No token in env'}`);
        // For debugging - show limited part of token if available
        if (token) {
          console.log(`Marcthepogi token starts with: ${token.substring(0, 5)}... and ends with: ...${token.substring(token.length - 5)}`);
        }
      } else if (topManagerLower === 'bossmarc747' || topManagerLower === 'bossmarc') {
        token = process.env.CASINO_TOKEN_BOSSMARC747;
        console.log(`DEBUG: Attempting to fetch token for bossmarc747: ${token ? 'Token found' : 'No token in env'}`);
      } else if (topManagerLower === 'teammarc') {
        token = process.env.CASINO_TOKEN_TEAMMARC;
        console.log(`DEBUG: Attempting to fetch token for teammarc: ${token ? 'Token found' : 'No token in env'}`);
      }
      
      if (!token) {
        throw new Error(`No auth token found in environment for manager: ${topManager}`);
      }
      
      // Calculate expiry (30 minutes from now)
      const expiryDate = new Date();
      expiryDate.setMinutes(expiryDate.getMinutes() + this.tokenExpiryMinutes);
      
      return {
        token,
        expiry: expiryDate
      };
    } catch (error) {
      console.error(`Error fetching new auth token for manager ${topManager}:`, error);
      throw new Error(`Failed to fetch new auth token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Create and export a singleton instance
export const casino747Api = new Casino747Api();