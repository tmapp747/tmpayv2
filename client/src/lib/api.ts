import { apiRequest } from "./queryClient";
import { API_ENDPOINTS } from "./constants";
import type {
  LoginRequest,
  LoginResponse,
  GetUserInfoResponse,
  GetTransactionsResponse,
  GenerateQrCodeRequest,
  GenerateQrCodeResponse,
  CheckPaymentStatusResponse,
  CompletePaymentResponse
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
