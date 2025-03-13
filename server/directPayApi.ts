import axios from 'axios';

/**
 * API client for interacting with the DirectPay API
 */
export class DirectPayApi {
  private baseUrl: string = 'https://direct-payph.com/api';
  private authToken: string | null = null;
  private authTokenExpiry: Date | null = null;
  private csrfToken: string | null = null;
  private sessionId: string | null = null;
  
  constructor() {}

  /**
   * Get a CSRF token from the DirectPay API
   * @returns The CSRF token
   */
  async getCsrfToken(): Promise<string> {
    try {
      const response = await axios.get(`${this.baseUrl}/csrf_token`);
      
      // Extract the session ID from cookies
      const cookies = response.headers['set-cookie'];
      if (cookies && cookies.length > 0) {
        const sessionIdMatch = cookies[0].match(/PHPSESSID=([^;]+)/);
        if (sessionIdMatch && sessionIdMatch[1]) {
          this.sessionId = sessionIdMatch[1];
        }
      }
      
      // Store the CSRF token and return it
      this.csrfToken = response.data.token;
      
      if (!this.csrfToken) {
        throw new Error('No CSRF token returned from DirectPay API');
      }
      
      return this.csrfToken;
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
      throw new Error('Failed to fetch CSRF token from DirectPay API');
    }
  }

  /**
   * Login to the DirectPay API
   * @param username The username
   * @param password The password
   * @returns The login response
   */
  async login(username: string, password: string): Promise<any> {
    try {
      // Make sure we have a CSRF token
      if (!this.csrfToken) {
        await this.getCsrfToken();
      }
      
      // Set up cookies
      const cookieHeader = this.sessionId ? `PHPSESSID=${this.sessionId}` : '';
      
      const response = await axios.post(
        `${this.baseUrl}/create/login`,
        { username, password },
        {
          headers: {
            'X-CSRF-TOKEN': this.csrfToken,
            'Content-Type': 'application/json',
            'Cookie': cookieHeader
          }
        }
      );
      
      // Extract the bearer token and store it
      if (response.data && response.data.access_token) {
        this.authToken = response.data.access_token;
        
        // Set token expiry (30 minutes from now)
        this.authTokenExpiry = new Date();
        this.authTokenExpiry.setMinutes(this.authTokenExpiry.getMinutes() + 30);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error logging in to DirectPay API:', error);
      throw new Error('Failed to login to DirectPay API');
    }
  }

  /**
   * Generate a GCash QR code for payment
   * @param amount The amount to pay
   * @param webhook The webhook URL to notify of payment completion
   * @param redirectUrl The URL to redirect to after payment
   * @returns The GCash cashIn response
   */
  async generateGCashQR(amount: number, webhook: string, redirectUrl: string): Promise<any> {
    try {
      // Make sure we have a valid auth token
      await this.ensureValidToken();
      
      // Set up cookies
      const cookieHeader = this.sessionId ? `PHPSESSID=${this.sessionId}` : '';
      
      const response = await axios.post(
        `${this.baseUrl}/gcash_cashin`,
        {
          amount: amount.toFixed(2),
          webhook,
          redirectUrl
        },
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json',
            'Cookie': cookieHeader
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error generating GCash QR code:', error);
      throw new Error('Failed to generate GCash QR code from DirectPay API');
    }
  }

  /**
   * Ensure we have a valid auth token
   * @private
   */
  private async ensureValidToken(): Promise<void> {
    const now = new Date();
    
    // If token is expired or not set, get a new one
    if (!this.authToken || !this.authTokenExpiry || now >= this.authTokenExpiry) {
      // For now, we use hardcoded credentials
      // In production, you would store these securely
      await this.login('colorway', 'cassinoroyale@ngInaM0!2@');
    }
  }
}

// Create and export a singleton instance
export const directPayApi = new DirectPayApi();