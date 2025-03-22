/**
 * Enhanced AuthManager with Session Manager Integration
 * 
 * This authentication system uses a combination of:
 * 1. Session cookies for server authentication
 * 2. React Query for client-side state management
 * 3. Session Manager for offline/connectivity detection
 * 
 * Benefits:
 * - More robust handling of network failures
 * - Better detection of server restarts
 * - Cleaner separation of connectivity and auth concerns
 * - Reduced unnecessary API calls when offline
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest, getQueryFn } from '@/lib/queryClient';
import sessionManager from '@/lib/session-manager';

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
  refreshToken: () => Promise<string>;
  loginMutation: any; // UseMutationResult<{ user: User, message: string }, Error, LoginData>;
  logoutMutation: any; // UseMutationResult<{ success: boolean, message: string }, Error, void>;
  registerMutation: any; // UseMutationResult<{ user: User, message: string }, Error, RegisterData>;
  logout: () => Promise<boolean>;
  isOffline: boolean;
  isServerUnreachable: boolean;
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
const refreshToken = async (): Promise<string> => {
  try {
    console.log('🔄 Attempting to refresh authentication session...');
    
    // Immediately return empty string if we already know the session is expired
    if (sessionManager.sessionStatus === 'expired') {
      console.log('⚠️ Session already known to be expired, not attempting refresh');
      return '';
    }
    
    // Try to refresh the token from the server
    const res = await fetch('/api/auth/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies for session auth
    });
    
    console.log('🔄 Refresh token response status:', res.status);
    
    if (!res.ok) {
      // Log detailed error information
      let errorDetails = '';
      try {
        const errorData = await res.json();
        errorDetails = JSON.stringify(errorData);
      } catch (e) {
        // If response isn't JSON, try to get text
        try {
          errorDetails = await res.text();
        } catch (e2) {
          errorDetails = 'Could not parse error response';
        }
      }
      
      console.error('❌ Token refresh failed with status:', res.status, errorDetails);
      
      // For 401/403 errors, mark the session as expired to prevent further attempts
      if (res.status === 401 || res.status === 403) {
        console.log('🔒 User session has expired or is invalid. Session marked as expired.');
        sessionManager.setSessionStatus('expired');
        
        // Clear session indicator in localStorage to help UI show correct state
        localStorage.setItem('sessionState', 'expired');
        
        // Show toast notification about session expiration when appropriate
        if (window.location.pathname !== '/auth' && window.location.pathname !== '/') {
          // Use custom event to trigger toast in components that listen for it
          window.dispatchEvent(new CustomEvent('session-expired', {
            detail: { message: 'Your session has expired. Please log in again.' }
          }));
          
          // Wait a moment before redirecting to allow the toast to be seen
          setTimeout(() => {
            // Clear any session-related data
            localStorage.removeItem('lastActive');
            
            // Redirect to login page
            window.location.href = '/auth';
          }, 1500);
        }
        
        return '';
      }
      
      // For server errors (5xx), don't mark session as expired
      // The server might be restarting or temporarily unavailable
      if (res.status >= 500) {
        console.error('🔥 Server error during token refresh:', res.status);
        // We'll try again later, this could be a temporary server issue
        return '';
      }
      
      throw new Error(`Failed to refresh token: ${res.status} ${errorDetails}`);
    }
    
    const data = await res.json();
    
    // Reset the session status since we successfully refreshed
    sessionManager.setSessionStatus('active');
    
    // Update session state in localStorage
    localStorage.setItem('sessionState', 'active');
    localStorage.setItem('lastActive', Date.now().toString());
    
    console.log('✅ Session refreshed successfully');
    
    return data.accessToken || '';
  } catch (error) {
    console.error('❌ Token refresh failed with error:', error);
    
    // If it's not a network error, mark session as expired
    sessionManager.setSessionStatus('expired');
    
    throw error;
  }
};

// Auth Provider component
function AuthProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isServerUnreachable, setIsServerUnreachable] = useState(sessionManager.isServerUnreachable);
  
  // Fetch user data from server on initial load
  const {
    data: userData,
    error,
    isLoading,
    refetch,
  } = useQuery<{ user: User | null }>({
    queryKey: ["/api/user/info"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    // Don't fetch if we already know the session is expired
    enabled: sessionManager.sessionStatus !== 'expired' && navigator.onLine && !isServerUnreachable,
  });
  
  // Subscribe to session manager events
  useEffect(() => {
    const unsubscribeStatus = sessionManager.subscribe('sessionStatus', 
      (status: 'active' | 'expired' | 'unknown') => {
        console.log('Session status changed to:', status);
        if (status === 'active' && navigator.onLine && !isServerUnreachable) {
          refetch();
        }
      }
    );
    
    const unsubscribeServer = sessionManager.subscribe('serverUnreachable', 
      (unreachable: boolean) => {
        console.log('Server unreachable status changed to:', unreachable);
        setIsServerUnreachable(unreachable);
        if (!unreachable && navigator.onLine && sessionManager.sessionStatus === 'active') {
          refetch();
        }
      }
    );
    
    // Listen for browser online/offline events
    const handleOnlineStatus = () => {
      const isNowOnline = navigator.onLine;
      console.log('Network status changed to:', isNowOnline ? 'online' : 'offline');
      setIsOffline(!isNowOnline);
      
      if (isNowOnline && sessionManager.sessionStatus === 'active') {
        sessionManager.pingServer().then(reachable => {
          if (reachable) {
            refetch();
          }
        });
      }
    };
    
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    // Initial offline check
    setIsOffline(!navigator.onLine);
    
    return () => {
      unsubscribeStatus();
      unsubscribeServer();
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, [refetch]);
  
  // Listen for session expired events from the API client
  useEffect(() => {
    const handleSessionExpired = (event: CustomEvent) => {
      console.log('🔒 Session expired event received');
      sessionManager.setSessionStatus('expired');
      
      // Show toast notification
      toast({
        title: "Session Expired",
        description: event.detail?.message || "Your session has expired. Please log in again.",
        variant: "destructive",
      });
    };
    
    window.addEventListener('session-expired' as any, handleSessionExpired as any);
    return () => window.removeEventListener('session-expired' as any, handleSessionExpired as any);
  }, [toast]);
  
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
      
      // Mark session as active
      sessionManager.setSessionStatus('active');
      
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
      
      // Mark session as active
      sessionManager.setSessionStatus('active');
      
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
      
      // Mark session as expired
      sessionManager.setSessionStatus('expired');
      
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
    onError: (error: any) => {
      console.error("Logout mutation error:", error);
      
      toast({
        title: "Logout failed",
        description: "Error contacting server, but you've been logged out locally",
        variant: "destructive",
      });
      
      // Force logout on frontend even if API call fails
      console.log("Forcing client-side logout due to API error");
      queryClient.setQueryData(["/api/user/info"], { user: null });
      
      // Mark session as expired
      sessionManager.setSessionStatus('expired');
      
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
        refreshToken,
        loginMutation,
        logoutMutation,
        registerMutation,
        logout,
        isOffline,
        isServerUnreachable,
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