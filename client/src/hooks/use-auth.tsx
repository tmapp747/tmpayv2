import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { getQueryFn, queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api-client"; 
import { useToast } from "@/hooks/use-toast";

// Types for user data
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

// Auth context type definition
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  refreshToken: (token: string) => Promise<string>;
  loginMutation: UseMutationResult<{ user: User, message: string }, Error, LoginData>;
  logoutMutation: UseMutationResult<{ success: boolean, message: string }, Error, void>;
  registerMutation: UseMutationResult<{ user: User, message: string }, Error, RegisterData>;
  logout: () => Promise<boolean>;
};

// Login form data type
type LoginData = {
  username: string;
  password: string;
  userType?: string;
};

// Registration form data type
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

// Create the auth context
const AuthContext = createContext<AuthContextType | null>(null);

// Session refresh function - using Passport.js sessions
const refreshSession = async (): Promise<string> => {
  try {
    console.log("Attempting to refresh session...");
    const res = await fetch("/api/auth/refresh-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: 'include', // Include cookies for session auth
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
      
      // Redirect to login page for unauthorized access
      window.location.href = '/auth';
    }
    
    // Always throw for unexpected errors
    throw error;
  }
};

// Auth Provider component
function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

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

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log("Initiating login request for user:", credentials.username);
      
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      
      if (!res.ok) {
        console.error("Login failed with status:", res.status);
        let errorMessage = "Login failed";
        
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
          console.error("Login error details:", errorData);
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }
        
        throw new Error(errorMessage);
      }
      
      console.log("Login response received successfully");
      const responseData = await res.json();
      console.log("Login successful, user data received");
      
      return responseData;
    },
    onSuccess: (data) => {
      console.log("Login successful, updating application state");
      queryClient.setQueryData(["/api/user/info"], { user: data.user });
      
      // No need to save to localStorage - auth handled by server session
      toast({
        title: "Login successful",
        description: "Welcome back to 747 Casino E-Wallet!",
      });
      
      // Immediately trigger a user info fetch to ensure we have the latest data
      console.log("Refreshing user data after login");
      queryClient.invalidateQueries({ queryKey: ["/api/user/info"] });
    },
    onError: (error: Error) => {
      console.error("Login mutation error:", error);
      
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      console.log("Initiating registration for user:", userData.username);
      
      const res = await apiRequest("POST", "/api/auth/register", userData);
      
      if (!res.ok) {
        console.error("Registration failed with status:", res.status);
        let errorMessage = "Registration failed";
        
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
          console.error("Registration error details:", errorData);
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }
        
        throw new Error(errorMessage);
      }
      
      console.log("Registration response received successfully");
      const responseData = await res.json();
      console.log("Registration successful, user data received");
      
      return responseData;
    },
    onSuccess: (data) => {
      console.log("Registration successful, updating application state");
      queryClient.setQueryData(["/api/user/info"], { user: data.user });

      // No need to save to localStorage - auth handled by server session
      toast({
        title: "Registration successful",
        description: "Your account has been created and you're now logged in!",
      });
      
      // Immediately trigger a user info fetch to ensure we have the latest data
      console.log("Refreshing user data after registration");
      queryClient.invalidateQueries({ queryKey: ["/api/user/info"] });
    },
    onError: (error: Error) => {
      console.error("Registration mutation error:", error);
      
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log("Initiating logout request");
      
      const res = await apiRequest("POST", "/api/auth/logout");
      console.log("Logout response status:", res.status);
      
      // Handle cases where response might not be JSON
      try {
        if (!res.ok) {
          console.error("Logout failed with status:", res.status);
          let errorMessage = "Logout failed";
          
          try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorMessage;
            console.error("Logout error details:", errorData);
          } catch (e) {
            console.error("Failed to parse error response:", e);
          }
          
          throw new Error(errorMessage);
        }
        
        console.log("Logout response received successfully");
        return await res.json();
      } catch (e) {
        // If the response isn't JSON, we'll still consider it a success if status is 2xx
        if (res.ok) {
          console.log("Logout successful (non-JSON response)");
          return { success: true };
        }
        if (e instanceof Error) throw e;
        throw new Error("Logout failed");
      }
    },
    onSuccess: () => {
      console.log("Logout successful, clearing application state");
      queryClient.setQueryData(["/api/user/info"], { user: null });

      // Clear query cache for user-specific data
      queryClient.removeQueries({ queryKey: ["/api/user"] });
      queryClient.removeQueries({ queryKey: ["/api/transactions"] });
      queryClient.removeQueries({ queryKey: ["/api/payments"] });
      
      console.log("Redirecting to login page after logout");
      // Redirect to login page after logout
      window.location.href = '/auth';

      toast({
        title: "Logged out",
        description: "You've been successfully logged out.",
      });
    },
    onError: (error) => {
      console.error("Logout mutation error:", error);
      
      toast({
        title: "Logout failed",
        description: "Error contacting server, but you've been logged out locally",
        variant: "destructive",
      });
      
      // Force logout on frontend even if API call fails
      console.log("Forcing client-side logout due to API error");
      queryClient.setQueryData(["/api/user/info"], { user: null });
      
      // Clear query cache for user-specific data
      queryClient.removeQueries({ queryKey: ["/api/user"] });
      queryClient.removeQueries({ queryKey: ["/api/transactions"] });
      queryClient.removeQueries({ queryKey: ["/api/payments"] });
      
      window.location.href = '/auth';
    },
  });

  // Simple logout function for components to use
  const logout = async (): Promise<boolean> => {
    try {
      await logoutMutation.mutateAsync();
      return true;
    } catch (error) {
      console.error("Logout failed:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        refreshToken: refreshSession,
        loginMutation,
        logoutMutation,
        registerMutation,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}

// Export components and hooks
export { AuthProvider, useAuth };