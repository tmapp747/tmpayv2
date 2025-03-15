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
    // Use the more robust apiRequest that handles token refresh
    const res = await authApiRequest(method, url, data);
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
      // Use our enhanced apiRequest that handles tokens and refreshes
      const res = await authApiRequest("GET", queryKey[0] as string);
      
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }
      
      // For consistency, still use our error handler
      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // If this is a 401 and we're configured to just return null, do that
      if (
        error instanceof Error && 
        error.message.startsWith("401:") && 
        unauthorizedBehavior === "returnNull"
      ) {
        return null;
      }
      
      // Otherwise, rethrow
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
