import axios from 'axios';

/**
 * API client for interacting with the 747 Casino API
 */
export class Casino747Api {
  private baseUrl: string = 'https://bridge.747lc.com';
  private userLookupUrl: string = 'https://tmpay747.azurewebsites.net/api/Bridge/get-user';
  private authToken: string | null = null;
  private authTokenExpiry: Date | null = null;
  
  constructor(
    private readonly apiKey: string = '', 
    private readonly defaultPlatform: number = 1
  ) {}

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
      
      return response.data;
    } catch (error) {
      console.error('Error transferring funds:', error);
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
    // In a real implementation, you would:
    // 1. Check if existing token is still valid
    // 2. If not, request a new token
    // 3. Store and return the token
    
    // For now, we'll use a mapping of hardcoded tokens
    // In production, you would implement proper token management
    const tokenMap: Record<string, string> = {
      'Marcthepogi': 'e726f734-0b50-4ca2-b8d7-bca385955acf'
      // Add more tokens as needed
    };

    // Get user details to find the top manager
    const userDetails = await this.getUserDetails(username);
    const topManager = userDetails.topManager;
    
    // Return the token for the top manager
    if (tokenMap[topManager]) {
      return tokenMap[topManager];
    }

    throw new Error(`No auth token available for manager: ${topManager}`);
  }
}

// Create and export a singleton instance
export const casino747Api = new Casino747Api();