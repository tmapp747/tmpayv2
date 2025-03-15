import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Import the robust apiRequest from api-client.ts
import { apiRequest as authApiRequest } from './api-client';

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    console.log(`Making API request: ${method} ${url}`);
    // Use the more robust apiRequest that handles session auth
    const res = await authApiRequest(method, url, data);
    
    // If we get a 401, log it for debugging but don't throw if it's expected
    if (res.status === 401) {
      console.log(`Authentication required for: ${method} ${url}`);
      // For specific endpoints that are always called when not logged in, 
      // we don't want to throw an error
      if (url === '/api/user/info' || url === '/api/auth/refresh-token') {
        return res;
      }
    }
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`API Request failed: ${method} ${url}`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      console.log(`Making query request: GET ${queryKey[0]}`);
      
      // Use our enhanced apiRequest that handles session auth
      const res = await authApiRequest("GET", queryKey[0] as string);
      
      // If 401 and configured to return null, do so silently
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log(`Silently handling 401 for: GET ${queryKey[0]}`);
        
        // For user info and other auth-related endpoints, just return null on 401
        if (queryKey[0] === '/api/user/info') {
          return null;
        }
        
        // For other endpoints with 401, try to refresh the session first
        try {
          // Attempt to refresh the session
          await authApiRequest("POST", "/api/auth/refresh-token");
          
          // Retry the original request
          const retryRes = await authApiRequest("GET", queryKey[0] as string);
          
          // If still 401, return null
          if (retryRes.status === 401) {
            return null;
          }
          
          // Otherwise parse and return the data
          const retryData = await retryRes.json();
          return retryData;
        } catch (refreshError) {
          console.error("Error checking intro video status:", refreshError);
          return null;
        }
      }
      
      // For consistency, still use our error handler for non-401 errors
      await throwIfResNotOk(res);
      
      // Parse and return the JSON response
      const data = await res.json();
      return data;
    } catch (error) {
      // If this is a 401 and we're configured to just return null, do that
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
