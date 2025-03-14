
import axios from 'axios';
import https from 'https';

// Create a new HTTPS agent that allows self-signed certificates
const httpsAgent = new https.Agent({
  rejectUnauthorized: false // Set to true in production
});

class DirectPayApi {
  private baseUrl: string;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  private csrfToken: string | null = null;
  private cookies: string[] = [];
  private phpSessionId: string | null = null;
  private username: string;
  private password: string;

  constructor() {
    // Ensure the base URL is properly formatted without trailing slash
    const apiUrl = process.env.DIRECTPAY_API_URL || 'https://direct-payph.com/api';
    this.baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    
    console.log('DirectPay API Base URL:', this.baseUrl);
    
    this.username = process.env.DIRECTPAY_USERNAME || 'colorway';
    this.password = process.env.DIRECTPAY_PASSWORD || 'cassinoroyale@ngInaM0!2@';
  }

  /**
   * Get CSRF token from DirectPay
   */
  private async getCsrfToken(): Promise<string> {
    try {
      console.log('Getting CSRF token from DirectPay...');
      
      // Use the exact endpoint from the curl example
      const csrfEndpoint = `${this.baseUrl}/csrf_token`;
      console.log('CSRF token endpoint:', csrfEndpoint);
      
      const response = await axios.get(csrfEndpoint, {
        httpsAgent,
        withCredentials: true,
        timeout: 10000 // 10 second timeout
      });
      
      console.log('CSRF token response:', response.data);
      
      if (response.headers['set-cookie']) {
        this.cookies = response.headers['set-cookie'];
        
        // Extract PHP session ID from cookies
        const sessionCookie = this.cookies.find(cookie => cookie.startsWith('PHPSESSID='));
        if (sessionCookie) {
          this.phpSessionId = sessionCookie.split(';')[0].split('=')[1];
          console.log('Got PHP session ID:', this.phpSessionId);
        }
      }
      
      // Check for token in different possible response formats
      let token = null;
      if (response.data.token) {
        token = response.data.token;
      } else if (response.data.csrf_token) {
        token = response.data.csrf_token;
      } else if (response.data.data && response.data.data.token) {
        token = response.data.data.token;
      }
      
      if (!token) {
        throw new Error('No CSRF token received from DirectPay API');
      }
      
      this.csrfToken = token;
      console.log('Successfully received CSRF token:', this.csrfToken);
      
      return token;
    } catch (error) {
      console.error('DirectPay CSRF token error:', error);
      throw new Error('Failed to get CSRF token from DirectPay API');
    }
  }

  /**
   * Authenticates with the DirectPay API and gets an access token
   */
  private async authenticate(): Promise<string> {
    try {
      // Check if we have a valid token
      if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
        return this.token;
      }

      console.log('Authenticating with DirectPay API...');
      
      // Max retries for authentication
      const maxRetries = 3;
      let retryCount = 0;
      let lastError: any = null;
      
      while (retryCount < maxRetries) {
        try {
          // First get CSRF token
          const csrfToken = await this.getCsrfToken();
          
          // Then login with username and password using the exact endpoint from the curl example
          const loginEndpoint = `${this.baseUrl}/create/login`;
          console.log('Login endpoint:', loginEndpoint);
          
          const response = await axios.post(loginEndpoint, {
            username: this.username,
            password: this.password
          }, {
            httpsAgent,
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-TOKEN': csrfToken,
              'Cookie': `PHPSESSID=${this.phpSessionId}`
            },
            withCredentials: true,
            timeout: 20000 // 20 second timeout
          });
          
          // Update cookies if present
          if (response.headers['set-cookie']) {
            this.cookies = response.headers['set-cookie'];
          }

          console.log('Login response:', response.data);
          
          // Extract token from different possible response structures
          let token = null;
          if (response.data.access_token) {
            token = response.data.access_token;
          } else if (response.data.token) {
            token = response.data.token;
          } else if (response.data.data && response.data.data.access_token) {
            token = response.data.data.access_token;
          } else if (response.data.data && response.data.data.token) {
            token = response.data.data.token;
          }
          
          if (!token) {
            throw new Error('No token received from DirectPay API');
          }

          this.token = token;

          // Set token expiry to 25 minutes from now (token typically lasts 30 minutes)
          this.tokenExpiry = new Date(Date.now() + 25 * 60 * 1000);

          console.log('Successfully authenticated with DirectPay API');

          return token;
        } catch (error) {
          lastError = error;
          retryCount++;
          
          if (retryCount >= maxRetries) {
            break;
          }
          
          // Exponential backoff: 1s, 2s, 4s, etc.
          const waitTime = Math.pow(2, retryCount) * 1000;
          console.log(`Authentication attempt ${retryCount} failed, retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          
          // Clear the session ID to get a fresh session
          this.phpSessionId = null;
          this.csrfToken = null;
        }
      }
      
      console.error('All authentication attempts failed:', lastError);
      throw new Error('Failed to authenticate with DirectPay API after multiple attempts');
    } catch (error) {
      console.error('DirectPay authentication error:', error);
      throw new Error('Failed to authenticate with DirectPay API');
    }
  }

  /**
   * Generate a GCash QR code for payment
   */
  async generateGCashQR(amount: number, webhookUrl: string, redirectUrl: string): Promise<{
    qrCodeData: string;
    reference: string;
    payUrl: string;
    expiresAt: Date;
  }> {
    try {
      const token = await this.authenticate();

      console.log('Generating GCash payment with params:', {
        amount,
        webhookUrl,
        redirectUrl
      });

      // Use the exact endpoint from the curl example
      const gcashEndpoint = `${this.baseUrl}/gcash_cashin`;
      console.log('GCash payment endpoint:', gcashEndpoint);
      
      const response = await axios.post(gcashEndpoint, {
        amount: parseFloat(amount.toFixed(2)),
        webhook: webhookUrl,
        redirectUrl: redirectUrl
      }, {
        httpsAgent,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cookie': `PHPSESSID=${this.phpSessionId}`
        },
        withCredentials: true,
        timeout: 30000 // 30 second timeout
      });

      console.log('GCash payment response:', response.data);
      console.log('Response type:', typeof response.data);
      console.log('Response has link property:', 'link' in response.data);
      console.log('Response has status property:', 'status' in response.data);
      
      // Check and extract data from different possible response structures
      let payUrl = null;
      let reference = null;
      
      // Ensure we have data to work with
      if (!response.data) {
        throw new Error('Empty response from DirectPay API');
      }
      
      // Look for payment URL in all possible formats
      if (response.data.pay_url) {
        payUrl = response.data.pay_url;
      } else if (response.data.payUrl) {
        payUrl = response.data.payUrl;
      } else if (response.data.link) {
        payUrl = response.data.link;
      } else if (response.data.data && response.data.data.pay_url) {
        payUrl = response.data.data.pay_url;
      } else if (response.data.data && response.data.data.payUrl) {
        payUrl = response.data.data.payUrl;
      } else if (response.data.data && response.data.data.link) {
        payUrl = response.data.data.link;
      }
      
      // Look for reference in all possible formats
      if (response.data.reference) {
        reference = response.data.reference;
      } else if (response.data.reference_id) {
        reference = response.data.reference_id;
      } else if (response.data.transactionId) {
        reference = response.data.transactionId;
      } else if (response.data.data && response.data.data.reference) {
        reference = response.data.data.reference;
      } else if (response.data.data && response.data.data.reference_id) {
        reference = response.data.data.reference_id;
      } else if (response.data.data && response.data.data.transactionId) {
        reference = response.data.data.transactionId;
      } else {
        // Generate a fallback reference ID
        reference = `dp_${Date.now()}`;
      }
      
      // Verify we have the required data
      if (!payUrl) {
        throw new Error('No payment URL received from DirectPay API');
      }

      // Set expiry to 30 minutes from now
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      // Generate QR code data from payUrl
      const qrCodeData = payUrl;

      return {
        qrCodeData,
        reference,
        payUrl,
        expiresAt
      };
    } catch (error) {
      console.error('DirectPay GCash payment generation error:', error);
      throw new Error('Failed to generate GCash payment link');
    }
  }

  /**
   * Check the status of a payment
   */
  async checkPaymentStatus(reference: string): Promise<{
    status: string;
    transactionId?: string;
  }> {
    try {
      const token = await this.authenticate();

      const statusEndpoint = `${this.baseUrl}/payment/status/${reference}`;
      console.log('Payment status endpoint:', statusEndpoint);
      
      const response = await axios.get(statusEndpoint, {
        httpsAgent,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cookie': `PHPSESSID=${this.phpSessionId}`
        },
        withCredentials: true,
        timeout: 30000 // 30 second timeout
      });

      console.log('Payment status response:', response.data);

      // Normalize the status
      let status = 'pending';
      if (['completed', 'success', 'paid'].includes(response.data.status?.toLowerCase())) {
        status = 'completed';
      } else if (['failed', 'canceled', 'cancelled', 'rejected'].includes(response.data.status?.toLowerCase())) {
        status = 'failed';
      }

      return {
        status,
        transactionId: response.data.transactionId || reference
      };
    } catch (error) {
      console.error('DirectPay payment status check error:', error);
      throw new Error('Failed to check payment status');
    }
  }
}

// Create and export singleton instance
export const directPayApi = new DirectPayApi();
