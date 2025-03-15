import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * Throw an error if the response is not OK (not 2xx status)
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Import the robust apiRequest from api-client.ts
import { apiRequest as authApiRequest } from './api-client';

/**
 * Enhanced API request function for React Query
 * This handles session-based authentication and proper error handling
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    console.log(`Making API request: ${method} ${url}`);
    
    // Use the enhanced apiRequest that handles session cookies
    const res = await authApiRequest(method, url, data);
    
    // Special handling for 401 responses
    if (res.status === 401) {
      console.log(`Authentication required for: ${method} ${url}`);
      
      // These endpoints are expected to sometimes return 401, so don't throw
      if (url === '/api/user/info' || url === '/api/auth/refresh-token') {
        return res;
      }
    }
    
    // Check for other error responses
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`API Request failed: ${method} ${url}`, error);
    throw error;
  }
}

/**
 * Behavior types for 401 unauthorized responses
 */
type UnauthorizedBehavior = "returnNull" | "throw";

/**
 * Query function factory for React Query
 * This creates a query function with specified behavior for 401 responses
 */
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      console.log(`Making query request: GET ${queryKey[0]}`);
      
      // Use our enhanced apiRequest that handles session auth
      const res = await authApiRequest("GET", queryKey[0] as string);
      
      // Handle 401 unauthorized responses based on configuration
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log(`Silently handling 401 for: GET ${queryKey[0]}`);
        
        // For user info endpoint, just return null on 401 (user not logged in)
        if (queryKey[0] === '/api/user/info') {
          return null;
        }
        
        // For other endpoints with 401, try to refresh the session first
        try {
          // Attempt to refresh the session
          const refreshRes = await authApiRequest("POST", "/api/auth/refresh-token");
          
          // If refresh failed with 401, return null (session expired)
          if (refreshRes.status === 401) {
            console.log("Token refresh failed with status:", refreshRes.status);
            return null;
          }
          
          // Retry the original request after successful refresh
          const retryRes = await authApiRequest("GET", queryKey[0] as string);
          
          // If still 401 after refresh, return null
          if (retryRes.status === 401) {
            return null;
          }
          
          // Parse and return the data from successful retry
          await throwIfResNotOk(retryRes);
          const retryData = await retryRes.json();
          return retryData;
        } catch (refreshError) {
          console.error("Session refresh error:", refreshError);
          return null;
        }
      }
      
      // For non-401 errors or when configured to throw, check response status
      await throwIfResNotOk(res);
      
      // Parse and return the JSON response
      const data = await res.json();
      return data;
    } catch (error) {
      // Special handling for 401 errors when configured to return null
      if (
        error instanceof Error && 
        error.message.startsWith("401:") && 
        unauthorizedBehavior === "returnNull"
      ) {
        console.log(`Handling 401 error for: GET ${queryKey[0]}`);
        return null;
      }
      
      // Otherwise, log and rethrow
      console.error(`Query error: GET ${queryKey[0]}`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
