
import axios from 'axios';
import https from 'https';
import { setTimeout } from 'timers/promises';

// Create a new HTTPS agent that allows self-signed certificates
const httpsAgent = new https.Agent({
  rejectUnauthorized: false // Set to true in production
});

// Rate limiting utility
class RateLimiter {
  private timestamps: number[] = [];
  private maxRequests: number;
  private interval: number; // in milliseconds

  constructor(maxRequests: number = 5, interval: number = 1000) {
    this.maxRequests = maxRequests;
    this.interval = interval;
  }

  async throttle(): Promise<void> {
    const now = Date.now();
    
    // Remove timestamps outside the current interval window
    this.timestamps = this.timestamps.filter(timestamp => now - timestamp < this.interval);
    
    if (this.timestamps.length >= this.maxRequests) {
      // Calculate delay needed to satisfy rate limit
      const oldestTimestamp = this.timestamps[0];
      const delay = this.interval - (now - oldestTimestamp);
      
      if (delay > 0) {
        console.log(`Rate limit reached, waiting ${delay}ms before next request`);
        await setTimeout(delay);
      }
    }
    
    // Add current timestamp to the list
    this.timestamps.push(Date.now());
  }
}

class DirectPayApi {
  private baseUrl: string;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  private csrfToken: string | null = null;
  private cookies: string[] = [];
  private phpSessionId: string | null = null;
  private username: string;
  private password: string;
  private rateLimiter: RateLimiter;

  constructor() {
    // Ensure the base URL is properly formatted without trailing slash
    const apiUrl = process.env.DIRECTPAY_API_URL || 'https://direct-payph.com/api';
    this.baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    
    console.log('DirectPay API Base URL:', this.baseUrl);
    
    this.username = process.env.DIRECTPAY_USERNAME || 'colorway';
    this.password = process.env.DIRECTPAY_PASSWORD || 'cassinoroyale@ngInaM0!2@';
    
    // Initialize rate limiter - 5 requests per second maximum
    this.rateLimiter = new RateLimiter(5, 1000);
  }

  /**
   * Get CSRF token from DirectPay
   */
  private async getCsrfToken(): Promise<string> {
    try {
      console.log('Getting CSRF token from DirectPay...');
      
      // Apply rate limiting before making the request
      await this.rateLimiter.throttle();
      
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
          
          // Apply rate limiting before making the request
          await this.rateLimiter.throttle();
          
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
          await new Promise<void>(resolve => {
            setTimeout(() => resolve(), waitTime);
          });
          
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
      // First ensure we're authenticated
      const token = await this.authenticate();

      console.log('Generating GCash payment with params:', {
        amount,
        webhookUrl,
        redirectUrl
      });

      // Use the correct endpoint for GCash cash-in
      const gcashEndpoint = `${this.baseUrl}/gcash_cashin`;
      console.log('GCash payment endpoint:', gcashEndpoint);
      
      // Make sure amount is properly formatted as a float with 2 decimal places
      const formattedAmount = parseFloat(amount.toFixed(2));
      
      console.log('Sending request to DirectPay API with the following data:');
      console.log(`- Amount: ${formattedAmount}`);
      console.log(`- Webhook URL: ${webhookUrl}`);
      console.log(`- Redirect URL: ${redirectUrl}`);
      console.log(`- Authorization: Bearer ${token.substring(0, 5)}...${token.substring(token.length - 5)}`);
      console.log(`- PHP Session ID: ${this.phpSessionId ? this.phpSessionId.substring(0, 5) + '...' : 'null'}`);
      
      // Apply rate limiting before making the request
      await this.rateLimiter.throttle();
      
      const response = await axios.post(gcashEndpoint, {
        amount: formattedAmount,
        webhook: webhookUrl,
        redirectUrl: redirectUrl
      }, {
        httpsAgent,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cookie': this.phpSessionId ? `PHPSESSID=${this.phpSessionId}` : ''
        },
        withCredentials: true,
        timeout: 30000 // 30 second timeout
      });

      // Log detailed response information
      console.log('GCash payment response status:', response.status);
      console.log('GCash payment response data:', JSON.stringify(response.data, null, 2));
      
      // Ensure we have data to work with
      if (!response.data) {
        throw new Error('Empty response from DirectPay API');
      }
      
      // Deep inspect the response to find the payment URL and reference
      const inspectResponseForKey = (obj: any, key: string): any => {
        if (!obj || typeof obj !== 'object') return null;
        
        // Direct property match
        if (key in obj) return obj[key];
        
        // Look for a property that contains the key as substring (case insensitive)
        for (const prop in obj) {
          if (prop.toLowerCase().includes(key.toLowerCase())) {
            return obj[prop];
          }
        }
        
        // Check nested objects including arrays
        for (const prop in obj) {
          if (typeof obj[prop] === 'object') {
            const result = inspectResponseForKey(obj[prop], key);
            if (result) return result;
          }
        }
        
        return null;
      };
      
      // Look for payment URL using various possible keys
      let payUrl = inspectResponseForKey(response.data, 'pay_url') || 
                   inspectResponseForKey(response.data, 'payUrl') ||
                   inspectResponseForKey(response.data, 'link') ||
                   inspectResponseForKey(response.data, 'url');
      
      // Look for reference using various possible keys
      let reference = inspectResponseForKey(response.data, 'reference') || 
                     inspectResponseForKey(response.data, 'reference_id') ||
                     inspectResponseForKey(response.data, 'transactionId') ||
                     inspectResponseForKey(response.data, 'id');
      
      // If reference is still not found, generate a fallback
      if (!reference) {
        reference = `dp_${Date.now()}`;
        console.warn('No reference found in API response, generated fallback:', reference);
      }
      
      // Log what we found
      console.log('Extracted payment URL:', payUrl);
      console.log('Extracted reference:', reference);
      
      // Verify we have the required payment URL
      if (!payUrl) {
        console.error('Full API response:', response.data);
        throw new Error('No payment URL received from DirectPay API');
      }

      // Set expiry to 30 minutes from now
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      // Use the payment URL as QR code data or generate QR code
      const qrCodeData = payUrl;

      return {
        qrCodeData,
        reference,
        payUrl,
        expiresAt
      };
    } catch (err) {
      const error = err as any; // Type casting for better error handling
      console.error('DirectPay GCash payment generation error:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw new Error('Failed to generate GCash payment link: ' + (error.message || 'Unknown error'));
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
      
      // Apply rate limiting before making the request
      await this.rateLimiter.throttle();
      
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
