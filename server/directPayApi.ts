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
  
  constructor() {
    // Fixed session ID for testing as provided
    this.sessionId = 'tj8jtvbkv1puebr46h3901f8q8';
  }

  /**
   * Get a CSRF token from the DirectPay API
   * @returns The CSRF token
   */
  async getCsrfToken(): Promise<string> {
    try {
      console.log(`Fetching CSRF token from ${this.baseUrl}/csrf_token`);
      const response = await axios.get(`${this.baseUrl}/csrf_token`, {
        headers: {
          'Accept': 'application/json',
          'Cookie': `PHPSESSID=${this.sessionId}`
        }
      });
      
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
          }
        }
      );
      
      console.log('Login response:', response.data);
      
      // Extract the bearer token and store it
      if (response.data && response.data.data && response.data.data.token) {
        this.authToken = response.data.data.token;
        console.log(`Received auth token: ${this.authToken}`);
        
        // Set token expiry (30 minutes from now)
        this.authTokenExpiry = new Date();
        this.authTokenExpiry.setMinutes(this.authTokenExpiry.getMinutes() + 30);
        console.log(`Token expires at ${this.authTokenExpiry.toISOString()}`);
      } else {
        console.error('No auth token in response:', response.data);
        throw new Error('No auth token received from DirectPay API');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error logging in to DirectPay API:', error);
      throw new Error('Failed to login to DirectPay API');
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
          }
        }
      );
      
      console.log('GCash payment response:', response.data);
      
      // Check if we got a valid response
      if (!response.data || !response.data.payUrl) {
        console.error('Invalid GCash payment response:', response.data);
        throw new Error('Invalid response from DirectPay API');
      }
      
      const payUrl = response.data.payUrl;
      const reference = response.data.reference || '';
      
      // Create iframe HTML if we have a pay URL
      let paymentData = '';
      if (payUrl) {
        // Create an iframe to display the payment URL
        paymentData = `<iframe src="${payUrl}" frameborder="0" style="width:100%; height:100%;"></iframe>`;
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
    } catch (error) {
      console.error('Error generating GCash payment:', error);
      throw new Error('Failed to generate GCash payment from DirectPay API');
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
          }
        }
      );
      
      console.log('Payment status response:', response.data);
      
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