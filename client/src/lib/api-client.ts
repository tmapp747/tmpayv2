
/**
 * API client utility for making authenticated requests with token refresh
 */

// Track token refresh status to prevent multiple simultaneous refreshes
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

/**
 * Make an authenticated API request with automatic token refresh
 * Now uses server-side session cookies for authentication
 */
export async function apiRequest(
  method: string,
  endpoint: string,
  body?: any,
  headers?: Record<string, string>,
  retry = true
): Promise<Response> {
  // Build request options using session cookies
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    credentials: 'include', // Include cookies for session-based auth
  };
  
  // Add body for non-GET requests
  if (method !== 'GET' && body) {
    options.body = JSON.stringify(body);
  }
  
  // Make the request
  const res = await fetch(endpoint, options);
  
  // If unauthorized and we haven't retried yet, try refreshing token via server
  if (res.status === 401 && retry) {
    try {
      // Attempt server-side token refresh
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken();
      }
      
      // Wait for the refresh token and retry
      await refreshPromise;
      
      // Retry the request (without allowing further retries to prevent loops)
      return await apiRequest(method, endpoint, body, headers, false);
    } catch (error) {
      console.error('Failed to refresh token and retry request:', error);
    }
  }
  
  return res;
}

/**
 * Helper function to refresh an access token
 * Uses server session-based authentication instead of localStorage
 */
async function refreshAccessToken(): Promise<string> {
  try {
    const res = await fetch('/api/auth/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies for session auth
    });
    
    if (!res.ok) {
      console.error('Token refresh failed with status:', res.status);
      // Don't throw for expected 401 errors during session validation
      if (res.status === 401) {
        return '';
      }
      throw new Error('Failed to refresh token');
    }
    
    const data = await res.json();
    
    // No need to update localStorage - sessions are handled by the server
    console.log('Session refreshed successfully');
    
    return data.accessToken || '';
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Don't redirect on failed refresh during regular API calls
    // Only redirect if user explicitly attempts to access a protected route
    if (window.location.pathname !== '/auth' && window.location.pathname !== '/') {
      window.location.href = '/auth';
    }
    throw error;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
}
