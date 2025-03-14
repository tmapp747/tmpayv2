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
  private authInProgress: boolean = false;
  private authPromise: Promise<void> | null = null;
  
  constructor() {
    // Generate a random session ID to avoid conflicts
    this.sessionId = this.generateSessionId();
    console.log(`DirectPay API initialized with session ID: ${this.sessionId}`);
  }

  /**
   * Generate a random session ID
   */
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Get a CSRF token from the DirectPay API
   * @returns The CSRF token
   */
  async getCsrfToken(): Promise<string> {
    try {
      console.log(`Fetching CSRF token from ${this.baseUrl}/csrf_token`);
      
      // Add timeout to avoid hanging requests
      const response = await axios.get(`${this.baseUrl}/csrf_token`, {
        headers: {
          'Accept': 'application/json',
          'Cookie': `PHPSESSID=${this.sessionId}`
        },
        timeout: 10000 // 10 second timeout
      });
      
      // Check response before accessing data
      if (!response || !response.data) {
        console.error('Empty response from CSRF token endpoint');
        throw new Error('Empty response from DirectPay API');
      }
      
      console.log('CSRF token response:', response.data);
      
      // Store the CSRF token and return it
      if (response.data && response.data.csrf_token) {
        this.csrfToken = response.data.csrf_token;
        console.log(`Received CSRF token: ${this.csrfToken}`);
      } else {
        console.error('CSRF token response:', response.data);
        throw new Error('No CSRF token returned from DirectPay API');
      }
      
      return this.csrfToken!;
    } catch (error: any) {
      console.error('Error fetching CSRF token:', error.message || error);
      
      // Try with a new session ID if this one fails
      if (error.message && (error.message.includes('timeout') || error.message.includes('network'))) {
        console.log('CSRF token request timed out, trying with new session ID');
        this.sessionId = this.generateSessionId();
        console.log(`New session ID: ${this.sessionId}`);
        return this.getCsrfToken();
      }
      
      throw new Error(`Failed to fetch CSRF token: ${error.message || 'Unknown error'}`);
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
      
      console.log(`Logging in to DirectPay as ${username}...`);
      
      const response = await axios.post(
        `${this.baseUrl}/create/login`,
        { username, password },
        {
          headers: {
            'X-CSRF-TOKEN': this.csrfToken || '',
            'Content-Type': 'application/json',
            'Cookie': `PHPSESSID=${this.sessionId}`,
            'Accept': 'application/json'
          },
          timeout: 15000 // 15 second timeout
        }
      );
      
      // Check if we have a valid response
      if (!response || !response.data) {
        throw new Error('Empty response from DirectPay login endpoint');
      }
      
      console.log('Login response:', response.data);
      
      // Extract the bearer token and store it
      if (response.data && response.data.data && response.data.data.token) {
        this.authToken = response.data.data.token;
        console.log(`Received auth token: ${this.authToken}`);
        
        // Set token expiry (30 minutes from now)
        this.authTokenExpiry = new Date();
        this.authTokenExpiry.setMinutes(this.authTokenExpiry.getMinutes() + 25); // Set to 25 minutes to refresh earlier
        console.log(`Token expires at ${this.authTokenExpiry.toISOString()}`);
      } else {
        console.error('No auth token in response:', response.data);
        throw new Error('No auth token received from DirectPay API');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error logging in to DirectPay API:', error.message || error);
      
      // Reset CSRF token if login fails, to force a refresh on next attempt
      this.csrfToken = null;
      
      throw new Error(`Failed to login to DirectPay API: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Generate a GCash QR code or iframe for payment
   * @param amount The amount to pay
   * @param webhook The webhook URL to notify of payment completion
   * @param redirectUrl The URL to redirect to after payment
   * @returns The GCash cashIn response
   */
  async generateGCashQR(amount: number, webhook: string, redirectUrl: string): Promise<any> {
    try {
      // Make sure we have a valid auth token
      await this.ensureValidToken();
      
      console.log(`Generating GCash payment form for amount: ${amount}, webhook: ${webhook}, redirectUrl: ${redirectUrl}`);
      
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
            'Cookie': `PHPSESSID=${this.sessionId}`,
            'Accept': 'application/json'
          },
          timeout: 15000 // 15 second timeout
        }
      );
      
      // Check for empty response
      if (!response || !response.data) {
        throw new Error('Empty response from DirectPay GCash endpoint');
      }
      
      console.log('GCash payment response:', response.data);
      
      // Check if the response indicates an authentication error
      if (response.data.message && (
          response.data.message.toLowerCase().includes('unauthorized') || 
          response.data.message.toLowerCase().includes('token')
        )) {
        console.log('Authentication token rejected, refreshing...');
        this.authToken = null;
        this.authTokenExpiry = null;
        await this.ensureValidToken();
        // Retry the request once with the new token
        return this.generateGCashQR(amount, webhook, redirectUrl);
      }
      
      // Check if we got a valid response
      if (!response.data.payUrl && !response.data.qrCodeUrl) {
        console.error('Invalid GCash payment response:', response.data);
        
        // If there's a specific error message, return it
        if (response.data.message) {
          throw new Error(`DirectPay API error: ${response.data.message}`);
        }
        
        throw new Error('No payment URL or QR code URL returned from DirectPay API');
      }
      
      const payUrl = response.data.payUrl || '';
      const reference = response.data.reference || '';
      
      // Create iframe HTML if we have a pay URL
      let paymentData = '';
      if (payUrl) {
        // Create an iframe to display the payment URL
        paymentData = `<iframe src="${payUrl}" frameborder="0" style="width:100%; height:600px;"></iframe>`;
      } else if (response.data.qrCodeUrl) {
        // Use QR code URL as fallback
        paymentData = response.data.qrCodeUrl;
      } else {
        throw new Error('No payment URL or QR code URL returned from DirectPay API');
      }
      
      return {
        qrCodeData: paymentData,
        reference: reference,
        payUrl
      };
    } catch (error: any) {
      console.error('Error generating GCash payment:', error.message || error);
      
      // Check if this was an authentication error
      if (error.response && error.response.status === 401) {
        console.log('Authentication token expired during request, refreshing...');
        this.authToken = null;
        this.authTokenExpiry = null;
        await this.ensureValidToken();
        // Retry the request once with the new token
        return this.generateGCashQR(amount, webhook, redirectUrl);
      }
      
      throw new Error(`Failed to generate GCash payment: ${error.message || 'Unknown error'}`);
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
      
      console.log(`Checking payment status for reference: ${reference}`);
      
      const response = await axios.get(
        `${this.baseUrl}/payment_status/${reference}`,
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json',
            'Cookie': `PHPSESSID=${this.sessionId}`,
            'Accept': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );
      
      // Check for empty response
      if (!response || !response.data) {
        return {
          status: 'pending',
          message: 'Empty response from DirectPay API'
        };
      }
      
      console.log('Payment status response:', response.data);
      
      // Check if the response indicates an authentication error
      if (response.data.message && (
          response.data.message.toLowerCase().includes('unauthorized') || 
          response.data.message.toLowerCase().includes('token')
        )) {
        console.log('Authentication token rejected, refreshing...');
        this.authToken = null;
        this.authTokenExpiry = null;
        await this.ensureValidToken();
        // Retry the request once with the new token
        return this.checkPaymentStatus(reference);
      }
      
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
    } catch (error: any) {
      console.error('Error checking payment status:', error.message || error);
      
      // Check if this was an authentication error
      if (error.response && error.response.status === 401) {
        console.log('Authentication token expired during status check, refreshing...');
        this.authToken = null;
        this.authTokenExpiry = null;
        await this.ensureValidToken();
        // Retry the request once with the new token
        return this.checkPaymentStatus(reference);
      }
      
      // If we can't connect to DirectPay, we'll assume the payment is still pending
      return {
        status: 'pending',
        message: `Error checking payment status: ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Ensure we have a valid auth token, with mutex to prevent multiple simultaneous auth attempts
   * @private
   */
  private async ensureValidToken(): Promise<void> {
    const now = new Date();
    
    // If token is missing, expired, or about to expire (within 1 minute), get a new one
    const isExpired = !this.authToken || !this.authTokenExpiry;
    const isAboutToExpire = this.authTokenExpiry && 
      ((this.authTokenExpiry.getTime() - now.getTime()) < 60000); // 1 minute buffer
    
    if (isExpired || isAboutToExpire) {
      // If authentication is already in progress, wait for it to complete
      if (this.authInProgress && this.authPromise) {
        console.log('Authentication already in progress, waiting...');
        await this.authPromise;
        return;
      }
      
      // Start authentication process
      this.authInProgress = true;
      this.authPromise = (async () => {
        try {
          // Use the credentials provided
          const username = process.env.DIRECTPAY_USERNAME || 'directpayuser';
          const password = process.env.DIRECTPAY_PASSWORD || 'DjsSGXqjFrqqfNqkh!@1';
          
          // Only log if this is a new authentication, not a refresh
          if (!this.authToken) {
            console.log(`Authenticating with DirectPay as ${username}...`);
          } else {
            console.log(`Refreshing DirectPay authentication token (expires in ${
              isAboutToExpire ? 'less than 1 minute' : 'expired'
            })...`);
          }
          
          await this.login(username, password);
          console.log(`DirectPay authentication successful, token valid until ${this.authTokenExpiry?.toISOString()}`);
        } catch (error: any) {
          console.error('Failed to authenticate with DirectPay:', error.message || error);
          
          // Reset tokens on authentication failure
          this.authToken = null;
          this.authTokenExpiry = null;
          this.csrfToken = null;
          
          throw new Error(`DirectPay authentication failed: ${error.message || 'Unknown error'}`);
        } finally {
          this.authInProgress = false;
        }
      })();
      
      await this.authPromise;
    }
  }
}

// Create and export a singleton instance
export const directPayApi = new DirectPayApi();