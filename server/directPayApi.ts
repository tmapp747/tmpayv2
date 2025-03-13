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
            'X-CSRF-TOKEN': this.csrfToken || '',
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
      
      // Make sure we have an auth token
      if (!this.authToken) {
        throw new Error('No authentication token available');
      }
      
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
   * Check the status of a payment
   * @param reference The DirectPay reference ID
   * @returns The payment status
   */
  async checkPaymentStatus(reference: string): Promise<{
    status: 'pending' | 'completed' | 'failed' | 'expired';
    transactionId?: string;
    message?: string;
  }> {
    try {
      // Make sure we have a valid auth token
      await this.ensureValidToken();
      
      // Set up cookies
      const cookieHeader = this.sessionId ? `PHPSESSID=${this.sessionId}` : '';
      
      // Make sure we have an auth token
      if (!this.authToken) {
        throw new Error('No authentication token available');
      }
      
      const response = await axios.get(
        `${this.baseUrl}/payment_status/${reference}`,
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json',
            'Cookie': cookieHeader
          }
        }
      );
      
      // Map DirectPay statuses to our internal statuses
      const directPayStatus = response.data.status?.toLowerCase();
      let status: 'pending' | 'completed' | 'failed' | 'expired' = 'pending';
      
      if (directPayStatus === 'success' || directPayStatus === 'completed') {
        status = 'completed';
      } else if (directPayStatus === 'failed' || directPayStatus === 'cancelled') {
        status = 'failed';
      } else if (directPayStatus === 'expired') {
        status = 'expired';
      }
      
      return {
        status,
        transactionId: response.data.transactionId,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error checking payment status:', error);
      
      // If we can't connect to DirectPay, we'll assume the payment is still pending
      return {
        status: 'pending',
        message: 'Unable to check payment status with DirectPay API'
      };
    }
  }

  /**
   * Ensure we have a valid auth token
   * @private
   */
  private async ensureValidToken(): Promise<void> {
    const now = new Date();
    
    // If token is missing, expired, or about to expire (within 1 minute), get a new one
    const isExpired = !this.authToken || !this.authTokenExpiry;
    const isAboutToExpire = this.authTokenExpiry && 
      ((this.authTokenExpiry.getTime() - now.getTime()) < 60000); // 1 minute buffer
    
    if (isExpired || isAboutToExpire) {
      // Get credentials from environment variables
      const username = process.env.DIRECTPAY_USERNAME || 'colorway';
      const password = process.env.DIRECTPAY_PASSWORD || 'cassinoroyale@ngInaM0!2@';
      
      // Only log if this is a new authentication, not a refresh
      if (!this.authToken) {
        console.log(`Authenticating with DirectPay as ${username}...`);
      } else {
        console.log(`Refreshing DirectPay authentication token (expires in ${
          isAboutToExpire ? 'less than 1 minute' : 'expired'
        })...`);
      }
      
      try {
        await this.login(username, password);
        console.log(`DirectPay authentication successful, token valid until ${this.authTokenExpiry?.toISOString()}`);
      } catch (error) {
        console.error('Failed to authenticate with DirectPay:', error);
        throw new Error('DirectPay authentication failed. Please check your credentials.');
      }
    }
  }
}

// Create and export a singleton instance
export const directPayApi = new DirectPayApi();