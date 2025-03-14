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
  createdAt: string | Date;
  updatedAt: string | Date;
}

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
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
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  // Initialize user from localStorage if available
  const initialUserData = (() => {
    try {
      const storedData = localStorage.getItem('userData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        return parsedData;
      }
    } catch (e) {
      console.error("Error parsing userData from localStorage:", e);
    }
    return null;
  })();

  const {
    data: userData,
    error,
    isLoading,
  } = useQuery<{ user: User } | null>({
    queryKey: ["/api/user/info"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    initialData: initialUserData,
  });

  const user = userData?.user || null;

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user/info"], { user: data.user });

      // Save user data to localStorage for token persistence
      localStorage.setItem('userData', JSON.stringify({ user: data.user }));

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
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user/info"], { user: data.user });

      // Save user data to localStorage for token persistence
      localStorage.setItem('userData', JSON.stringify({ user: data.user }));

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
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Logout failed");
        return data;
      } catch (e) {
        // If the response isn't JSON, we'll still consider it a success if status is 2xx
        if (res.ok) return { success: true };
        throw new Error("Logout failed");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user/info"], { user: null });

      // Clear user data from localStorage
      localStorage.removeItem('userData');

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
      localStorage.removeItem('userData');
      sessionStorage.removeItem('userData');
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      window.location.href = '/auth';
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
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