import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { getQueryFn,  queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api-client"; // Corrected import
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  email?: string;
  balance: string | number;
  pendingBalance: string | number;
  isVip: boolean;
  casinoId: string;
  casinoUsername?: string;
  casinoClientId?: number;
  topManager?: string;
  immediateManager?: string;
  casinoUserType?: string;
  casinoBalance?: string | number;
  isAuthorized: boolean;
  allowedTopManagers?: string[];
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiry?: Date | string;
  refreshTokenExpiry?: Date | string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  refreshToken: (token: string) => Promise<string>;
  loginMutation: UseMutationResult<{ user: User, message: string }, Error, LoginData>;
  logoutMutation: UseMutationResult<{ success: boolean, message: string }, Error, void>;
  registerMutation: UseMutationResult<{ user: User, message: string }, Error, RegisterData>;
};

type LoginData = {
  username: string;
  password: string;
  userType?: string;
};

type RegisterData = {
  username: string;
  password: string;
  email?: string;
  userType?: string;
  clientId?: number;
  topManager?: string;
  immediateManager?: string;
  casinoUserType?: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  // Session refresh function - using Passport.js sessions
  const refreshAccessToken = async (_: string = '') => {
    try {
      console.log("Attempting to refresh session...");
      // Request with credentials included for session cookies
      const res = await fetch("/api/auth/refresh-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        // No body needed - session is used for authentication
      });
      
      // Handle 401 errors gracefully - user is simply not logged in
      if (res.status === 401) {
        console.log("Session refresh 401 - user not authenticated");
        
        // Don't update state if we're on the auth page already
        if (window.location.pathname !== '/auth') {
          // Clear user data from cache
          queryClient.setQueryData(["/api/user/info"], { user: null });
        }
        
        // Return empty string without throwing for expected 401s
        return '';
      }
      
      // For other non-2xx responses, handle as errors
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Session refresh failed:", errorData.message || res.statusText);
        throw new Error(errorData.message || "Failed to refresh session");
      }
      
      // Parse response data
      let data;
      try {
        data = await res.json();
      } catch (e) {
        console.log("Empty response from refresh endpoint");
        return '';
      }
      
      console.log("Session refreshed successfully");
      // Update the query cache with returned user data
      if (data.user) {
        queryClient.setQueryData(["/api/user/info"], { user: data.user });
      }
      
      // Return empty string as we're not using tokens anymore
      return '';
    } catch (error) {
      console.error("Session refresh failed:", error);
      
      // Only clear user data and redirect if not already on auth page
      if (window.location.pathname !== '/auth' && window.location.pathname !== '/') {
        // If refresh fails, we need to log the user out
        queryClient.setQueryData(["/api/user/info"], { user: null });
        
        // Redirect to login page
        window.location.href = '/auth';
      }
      
      // Always throw for unexpected errors
      throw error;
    }
  };

  // Fetch user data from server on initial load
  const {
    data: userData,
    error,
    isLoading,
  } = useQuery<{ user: User } | null>({
    queryKey: ["/api/user/info"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const user = userData?.user || null;

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Login failed");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user/info"], { user: data.user });

      // No need to save to localStorage - auth handled by server session

      toast({
        title: "Login successful",
        description: "Welcome back to 747 Casino E-Wallet!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/auth/register", userData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Registration failed");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user/info"], { user: data.user });

      // No need to save to localStorage - auth handled by server session

      toast({
        title: "Registration successful",
        description: "Your account has been created and you're now logged in!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout");
      // Handle cases where response might not be JSON
      try {
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Logout failed");
        }
        return await res.json();
      } catch (e) {
        // If the response isn't JSON, we'll still consider it a success if status is 2xx
        if (res.ok) return { success: true };
        if (e instanceof Error) throw e;
        throw new Error("Logout failed");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user/info"], { user: null });

      // Redirect to login page after logout
      window.location.href = '/auth';

      toast({
        title: "Logged out",
        description: "You've been successfully logged out.",
      });
    },
    onError: (error) => {
      console.error("Logout API error:", error);
      toast({
        title: "Logout failed",
        description: "Error contacting server, but you've been logged out locally",
        variant: "destructive",
      });
      // Force logout on frontend even if API call fails
      queryClient.setQueryData(["/api/user/info"], { user: null });
      window.location.href = '/auth';
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        refreshToken: refreshAccessToken,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}