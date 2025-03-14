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
      // Make sure we have a valid auth token
      const authToken = await this.getAuthToken(username);
      
      const response = await axios.post(`${this.baseUrl}/account/get-balances`, {
        authToken,
        platform: this.defaultPlatform,
        clientId,
        username
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching user balance:', error);
      throw new Error('Failed to fetch balance from 747 Casino API');
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
    currency: string = "USD",
    fromUsername: string,
    comment: string = "Transfer from e-wallet"
  ) {
    try {
      // Make sure we have a valid auth token
      const authToken = await this.getAuthToken(fromUsername);
      
      console.log(`[CASINO747] Transfer attempt: Amount ${amount} ${currency} to ${toUsername} (ID: ${toClientId}) from ${fromUsername}`);
      console.log(`[CASINO747] Transfer payload: ${JSON.stringify({
        authToken: "***", // Hide token for security
        platform: this.defaultPlatform,
        amount,
        toAgent: false,
        currency,
        clientId: toClientId,
        username: toUsername,
        comment
      })}`);
      
      const response = await axios.post(`${this.baseUrl}/Default/Transfer`, {
        authToken,
        platform: this.defaultPlatform,
        amount,
        toAgent: false,
        currency,
        clientId: toClientId,
        username: toUsername,
        comment
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`[CASINO747] Transfer response: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
      console.error('Error transferring funds:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Transfer API response error:', error.response.status, error.response.data);
      } else if (axios.isAxiosError(error)) {
        console.error('Transfer API request error:', error.message);
      }
      throw new Error('Failed to transfer funds using 747 Casino API');
    }
  }

  /**
   * Send a message to a user or their manager
   * @param username The username of the recipient (or player's manager)
   * @param subject The subject of the message
   * @param message The message content
   */
  async sendMessage(username: string, subject: string, message: string) {
    try {
      // Get user details to check if they are a player or agent
      const userDetails = await this.getUserDetails(username);
      
      // If the user is a player, send the message to their immediate manager
      const recipientUsername = userDetails.isAgent ? username : userDetails.immediateManager;
      
      // Make sure we have a valid auth token based on the top manager
      const authToken = await this.getAuthToken(userDetails.topManager);
      
      const response = await axios.post(`${this.baseUrl}/Default/SendMessage`, {
        authToken,
        platform: this.defaultPlatform,
        username: recipientUsername,
        subject,
        message
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message using 747 Casino API');
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
      const response = await axios.get(
        `${this.baseUrl}/Default/GetHierarchy?username=${encodeURIComponent(username)}&isAgent=${isAgent}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching hierarchy for ${username}:`, error);
      throw new Error('Failed to fetch user hierarchy from 747 Casino API');
    }
  }

  /**
   * Get the auth token for a specific user
   * @param username The username to get the auth token for
   * @private
   */
  private async getAuthToken(username: string): Promise<string> {
    try {
      // 1. First, get the user details to find the top manager
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
      
      let token: string | undefined;
      switch (topManager) {
        case 'Marcthepogi':
          token = process.env.CASINO_TOKEN_MARCTHEPOGI;
          break;
        case 'bossmarc747':
          token = process.env.CASINO_TOKEN_BOSSMARC747;
          break;
        case 'teammarc':
          token = process.env.CASINO_TOKEN_TEAMMARC;
          break;
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
      
      let token: string | undefined;
      switch (topManager) {
        case 'Marcthepogi':
          token = process.env.CASINO_TOKEN_MARCTHEPOGI;
          break;
        case 'bossmarc747':
          token = process.env.CASINO_TOKEN_BOSSMARC747;
          break;
        case 'teammarc':
          token = process.env.CASINO_TOKEN_TEAMMARC;
          break;
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