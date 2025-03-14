
import axios from 'axios';
import https from 'https';

// Create a new HTTPS agent that allows self-signed certificates
const httpsAgent = new https.Agent({
  rejectUnauthorized: false // Set to true in production
});

class DirectPayApi {
  private apiKey: string;
  private baseUrl: string;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.apiKey = process.env.DIRECTPAY_API_KEY || 'dev_test_key';
    this.baseUrl = process.env.DIRECTPAY_API_URL || 'https://api.directpay.ph/api/v1';
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

      const response = await axios.post(`${this.baseUrl}/auth/login`, {
        apiKey: this.apiKey
      }, {
        httpsAgent,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.data.token) {
        throw new Error('No token received from DirectPay API');
      }

      this.token = response.data.token;

      // Set token expiry to 25 minutes from now (token typically lasts 30 minutes)
      this.tokenExpiry = new Date(Date.now() + 25 * 60 * 1000);

      console.log('Successfully authenticated with DirectPay API');

      return this.token;
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
    payUrl?: string;
  }> {
    try {
      const token = await this.authenticate();

      console.log('Generating GCash QR code with params:', {
        amount,
        webhookUrl,
        redirectUrl
      });

      const response = await axios.post(`${this.baseUrl}/payments/gcash/create`, {
        amount,
        description: '747 Casino E-Wallet Deposit',
        webhookUrl,
        redirectUrl,
        expiryMinutes: 30
      }, {
        httpsAgent,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('GCash QR code response:', response.data);

      // Check if we have the expected data
      if (!response.data.qrCodeData && !response.data.payUrl) {
        throw new Error('No QR code data or payment URL received');
      }

      return {
        qrCodeData: response.data.qrCodeData || response.data.paymentFormHtml || '',
        reference: response.data.reference || response.data.transactionId || String(Date.now()),
        payUrl: response.data.payUrl
      };
    } catch (error) {
      console.error('DirectPay GCash QR generation error:', error);
      throw new Error('Failed to generate GCash QR code');
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

      const response = await axios.get(`${this.baseUrl}/payments/status/${reference}`, {
        httpsAgent,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
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
        transactionId: response.data.transactionId || ''
      };
    } catch (error) {
      console.error('DirectPay payment status check error:', error);
      throw new Error('Failed to check payment status');
    }
  }
}

// Create and export singleton instance
export const directPayApi = new DirectPayApi();
