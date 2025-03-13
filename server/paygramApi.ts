/**
 * API client for interacting with the Paygram API for PHPT payments
 */
import axios from 'axios';
import { randomUUID } from 'crypto';

// Define currency codes according to Paygram API
// These may need to be confirmed with accurate values
const CURRENCY_CODES = {
  PHPT: 11, // PHPT appears to use code 11 based on the API docs
  USDT: 5,  // USDT appears to use code 5 based on the API docs
  BTC: 1    // BTC appears to use code 1 based on the API docs
};

// Invoice status codes
const INVOICE_STATUS = {
  PENDING: 4,
  PAID: 2,
  FAILED: 3,
  EXPIRED: 5
};

export class PaygramApi {
  private baseUrl: string = 'https://api.pay-gram.org';
  private token: string;
  private callbackUrl: string;
  
  constructor(
    token: string = process.env.PAYGRAM_API_TOKEN || '355c3d34-0a30-4de9-8a16-da1b38567c75',
    callbackUrl: string = process.env.PAYGRAM_CALLBACK_URL || 'https://example.com/api/paygram/callback'
  ) {
    this.token = token;
    this.callbackUrl = callbackUrl;
  }
  
  /**
   * Generate a payment URL via Paygram IssueInvoice API
   * @param userId Unique user identifier in our system
   * @param amount The amount to be paid
   * @param currency The currency code (PHPT, USDT)
   * @returns The payment URL and invoice code
   */
  async generatePaymentUrl(
    userId: string,
    amount: number, 
    currency: string = 'PHPT'
  ): Promise<{ payUrl: string | null, invoiceCode: string }> {
    try {
      const requestId = Math.floor(Math.random() * -10000000); // Negative random number as per examples
      const currencyCode = CURRENCY_CODES[currency as keyof typeof CURRENCY_CODES] || CURRENCY_CODES.PHPT;
      
      const response = await axios.post(
        `${this.baseUrl}/${this.token}/IssueInvoice`,
        {
          requestId,
          userCliId: userId,
          currencyCode,
          amount,
          callbackData: this.callbackUrl,
          merchantType: 3 // As seen in the example
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      console.log(`Generated Paygram payment for ${amount} ${currency}, Invoice Code: ${response.data.invoiceCode}`);
      
      return {
        payUrl: response.data.payUrl,
        invoiceCode: response.data.invoiceCode
      };
    } catch (error) {
      console.error('Error generating Paygram payment URL:', error);
      throw new Error('Failed to generate Paygram payment URL');
    }
  }
  
  /**
   * Check the status of a payment via InvoiceInfo API
   * @param userId User ID in our system
   * @param invoiceCode The invoice code returned when generating the payment
   * @returns The payment status and details
   */
  async checkPaymentStatus(userId: string, invoiceCode: string): Promise<{
    status: 'pending' | 'completed' | 'failed' | 'expired',
    isPaid: boolean,
    isRedeemed: boolean,
    amount: number,
    currency: number,
    details: any
  }> {
    try {
      const requestId = Math.floor(Math.random() * -10000000);
      
      const response = await axios.post(
        `${this.baseUrl}/${this.token}/InvoiceInfo`,
        {
          requestId,
          userCliId: userId,
          invoiceCode
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      let status: 'pending' | 'completed' | 'failed' | 'expired' = 'pending';
      
      // Map the Paygram status to our status format
      if (response.data.isPaid) {
        status = 'completed';
      } else if (response.data.status === INVOICE_STATUS.FAILED) {
        status = 'failed';
      } else if (response.data.status === INVOICE_STATUS.EXPIRED) {
        status = 'expired';
      }
      
      return {
        status,
        isPaid: response.data.isPaid,
        isRedeemed: response.data.isRedeemed,
        amount: response.data.amount,
        currency: response.data.currencyCode,
        details: response.data
      };
    } catch (error) {
      console.error('Error checking Paygram payment status:', error);
      throw new Error('Failed to check Paygram payment status');
    }
  }
  
  /**
   * Get user information from Paygram
   * @param userId User ID in our system
   * @returns User details including balances
   */
  async getUserInfo(userId: string): Promise<any> {
    try {
      const requestId = Math.floor(Math.random() * -10000000);
      
      const response = await axios.post(
        `${this.baseUrl}/${this.token}/UserInfo`,
        {
          requestId,
          userCliId: userId
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error getting Paygram user info:', error);
      throw new Error('Failed to get Paygram user info');
    }
  }
  
  /**
   * Set up a user in Paygram
   * @param userId User ID in our system
   * @returns User details
   */
  async setupUser(userId: string): Promise<any> {
    try {
      const requestId = Math.floor(Math.random() * -10000000);
      
      const response = await axios.post(
        `${this.baseUrl}/${this.token}/SetUserInfo`,
        {
          requestId,
          userCliId: userId,
          callbackUrl: this.callbackUrl
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error setting up Paygram user:', error);
      throw new Error('Failed to set up Paygram user');
    }
  }
  
  /**
   * Process a webhook payload from Paygram
   * @param payload The webhook payload
   * @returns Success status
   */
  async processWebhook(payload: any): Promise<boolean> {
    try {
      // Process the payment update
      console.log('Processing Paygram webhook payload:', payload);
      
      // Here you would typically verify the payment status
      // and update your database accordingly
      
      return true;
    } catch (error) {
      console.error('Error processing Paygram webhook:', error);
      return false;
    }
  }
  
  /**
   * Get the available coins/currencies from Paygram
   * @returns List of available currencies and their balances
   */
  async getAvailableCurrencies(): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.token}/GetCirculatingCoins`,
        {},
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      return response.data.coins;
    } catch (error) {
      console.error('Error getting Paygram available currencies:', error);
      throw new Error('Failed to get Paygram available currencies');
    }
  }
  
  /**
   * Pay an invoice (for internal user-to-user transfers)
   * @param userId User ID in our system
   * @param invoiceCode The invoice code to pay
   * @returns Payment result
   */
  async payInvoice(userId: string, invoiceCode: string): Promise<any> {
    try {
      const requestId = Math.floor(Math.random() * -10000000);
      
      const response = await axios.post(
        `${this.baseUrl}/${this.token}/PayInvoice`,
        {
          requestId,
          userCliId: userId,
          invoiceCode
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error paying Paygram invoice:', error);
      throw new Error('Failed to pay Paygram invoice');
    }
  }
}

// Singleton instance
export const paygramApi = new PaygramApi();