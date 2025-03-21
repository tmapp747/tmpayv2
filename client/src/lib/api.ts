import { apiRequest } from "./api-client";
import { API_ENDPOINTS } from "./constants";
import type {
  LoginRequest,
  LoginResponse,
  GetUserInfoResponse,
  GetTransactionsResponse,
  GenerateQrCodeRequest,
  GenerateQrCodeResponse,
  CheckPaymentStatusResponse,
  CompletePaymentResponse,
  // Casino API types
  CasinoGetUserDetailsRequest, 
  CasinoGetUserDetailsResponse,
  CasinoBalanceRequest,
  CasinoBalanceResponse,
  CasinoDepositRequest,
  CasinoWithdrawRequest,
  CasinoTransferRequest,
  CasinoTransactionResponse,
  CasinoTransactionsRequest,
  CasinoTransactionsResponse,
  CasinoSendMessageRequest,
  CasinoSendMessageResponse,
  CasinoGetHierarchyRequest,
  CasinoGetHierarchyResponse
} from "./types";

// Auth API
export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await apiRequest("POST", API_ENDPOINTS.AUTH.LOGIN, data);
    return await res.json();
  }
};

// User API
export const userApi = {
  getUserInfo: async (): Promise<GetUserInfoResponse> => {
    const res = await apiRequest("GET", API_ENDPOINTS.USER.INFO);
    return await res.json();
  },
  
  // User preferences
  getPreference: async (key: string): Promise<{
    success: boolean;
    exists: boolean;
    value?: any;
    message?: string;
  }> => {
    try {
      const res = await apiRequest("GET", API_ENDPOINTS.USER.PREFERENCES.GET(key));
      return await res.json();
    } catch (error) {
      return { success: false, exists: false, message: "Failed to get preference" };
    }
  },
  
  updatePreference: async (key: string, value: any): Promise<{
    success: boolean;
    message?: string;
  }> => {
    try {
      const res = await apiRequest("POST", API_ENDPOINTS.USER.PREFERENCES.SET(key), { value });
      return await res.json();
    } catch (error) {
      return { success: false, message: "Failed to update preference" };
    }
  },
  
  updatePreferredCurrency: async (currency: string): Promise<{
    success: boolean;
    message?: string;
  }> => {
    const res = await apiRequest("POST", API_ENDPOINTS.USER.PREFERRED_CURRENCY, { currency });
    return await res.json();
  }
};

// Transactions API
export const transactionsApi = {
  getTransactions: async (): Promise<GetTransactionsResponse> => {
    const res = await apiRequest("GET", API_ENDPOINTS.TRANSACTIONS.LIST);
    return await res.json();
  }
};

// Payments API
export const paymentsApi = {
  generateQrCode: async (data: GenerateQrCodeRequest): Promise<GenerateQrCodeResponse> => {
    const res = await apiRequest("POST", API_ENDPOINTS.PAYMENTS.GENERATE_QR, data);
    return await res.json();
  },
  
  checkPaymentStatus: async (referenceId: string): Promise<CheckPaymentStatusResponse> => {
    const res = await apiRequest("GET", API_ENDPOINTS.PAYMENTS.CHECK_STATUS(referenceId));
    return await res.json();
  },
  
  simulatePaymentCompletion: async (directPayReference: string): Promise<CompletePaymentResponse> => {
    const res = await apiRequest("POST", API_ENDPOINTS.PAYMENTS.SIMULATE_COMPLETION, { directPayReference });
    return await res.json();
  }
};

// Casino API
export const casinoApi = {
  // Get user details from 747 Casino
  getUserDetails: async (data: CasinoGetUserDetailsRequest): Promise<CasinoGetUserDetailsResponse> => {
    const res = await apiRequest("POST", API_ENDPOINTS.CASINO.USER_DETAILS, data);
    return await res.json();
  },

  // Get user balance from 747 Casino
  getBalance: async (data: CasinoBalanceRequest): Promise<CasinoBalanceResponse> => {
    const res = await apiRequest("POST", API_ENDPOINTS.CASINO.BALANCE, data);
    return await res.json();
  },
  
  // Get real-time user balance from 747 Casino
  getRealTimeBalance: async (data: CasinoBalanceRequest): Promise<CasinoBalanceResponse> => {
    const res = await apiRequest("POST", API_ENDPOINTS.CASINO.BALANCE_REALTIME, data);
    return await res.json();
  },

  // Deposit funds to 747 Casino
  deposit: async (data: CasinoDepositRequest): Promise<CasinoTransactionResponse> => {
    const res = await apiRequest("POST", API_ENDPOINTS.CASINO.DEPOSIT, data);
    return await res.json();
  },

  // Withdraw funds from 747 Casino
  withdraw: async (data: CasinoWithdrawRequest): Promise<CasinoTransactionResponse> => {
    const res = await apiRequest("POST", API_ENDPOINTS.CASINO.WITHDRAW, data);
    return await res.json();
  },

  // Transfer funds between users in 747 Casino
  transfer: async (data: CasinoTransferRequest): Promise<CasinoTransactionResponse> => {
    const res = await apiRequest("POST", API_ENDPOINTS.CASINO.TRANSFER, data);
    return await res.json();
  },

  // Get transaction history from 747 Casino
  getTransactions: async (username: string): Promise<CasinoTransactionsResponse> => {
    const res = await apiRequest("GET", API_ENDPOINTS.CASINO.TRANSACTIONS(username));
    return await res.json();
  },
  
  // Send message to a user or their manager
  sendMessage: async (data: CasinoSendMessageRequest): Promise<CasinoSendMessageResponse> => {
    const res = await apiRequest("POST", API_ENDPOINTS.CASINO.SEND_MESSAGE, data);
    return await res.json();
  },
  
  // Get user hierarchy information
  getUserHierarchy: async (data: CasinoGetHierarchyRequest): Promise<CasinoGetHierarchyResponse> => {
    const res = await apiRequest("POST", API_ENDPOINTS.CASINO.USER_HIERARCHY, data);
    return await res.json();
  }
};
