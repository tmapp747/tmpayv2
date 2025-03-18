
/**
 * API client utility for making authenticated requests with token refresh
 */

// Track token refresh status to prevent multiple simultaneous refreshes
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

// Map auth routes to their correct endpoints
const AUTH_ROUTE_MAPPING: Record<string, string> = {
  '/api/auth/login': '/api/login',       // Map client /auth/login to server /login
  '/api/auth/logout': '/api/logout',     // Map client /auth/logout to server /logout
};

/**
 * Make an authenticated API request with automatic token refresh
 * Uses server-side session cookies for authentication
 */
export async function apiRequest(
  method: string,
  endpoint: string,
  body?: any,
  headers?: Record<string, string>,
  retry = true
): Promise<Response> {
  // Map endpoint to correct server path if needed
  const mappedEndpoint = AUTH_ROUTE_MAPPING[endpoint] || endpoint;
  
  // Always ensure we use session cookies and the right content type
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    credentials: 'include', // Always include cookies for session-based auth
  };
  
  // Add body for non-GET requests
  if (method !== 'GET' && body) {
    options.body = JSON.stringify(body);
  }
  
  // Log the request details for debugging
  console.log(`API Request: ${method} ${endpoint}${mappedEndpoint !== endpoint ? ` (mapped to ${mappedEndpoint})` : ''}`);
  if (body && method !== 'GET') {
    // Avoid logging potentially sensitive data
    console.log('Request body type:', typeof body);
  }
  
  try {
    // Make the request with credentials to ensure cookies are sent
    const res = await fetch(mappedEndpoint, options);
    
    // Log response status for debugging
    console.log(`API Response status: ${res.status} for ${method} ${endpoint}`);
    
    // If unauthorized and we haven't retried yet, try refreshing token via server
    if (res.status === 401 && retry) {
      console.log('Authentication required, attempting to refresh session');
      
      try {
        // Prevent multiple simultaneous refresh attempts
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = refreshAccessToken();
        }
        
        // Wait for the refresh attempt to complete
        const refreshResult = await refreshPromise;
        
        // Check if refresh was successful
        if (refreshResult) {
          console.log('Session refresh successful, retrying original request');
          // Retry the request (without allowing further retries to prevent loops)
          return await apiRequest(method, endpoint, body, headers, false);
        } else {
          console.log('Session refresh failed, not retrying original request');
          // If refresh failed, return the original 401 response
          return res;
        }
      } catch (error) {
        console.error('Error during session refresh:', error);
        // On error, return the original 401 response
        return res;
      } finally {
        // Reset refresh state
        isRefreshing = false;
        refreshPromise = null;
      }
    }
    
    return res;
  } catch (error) {
    console.error(`Network error during API request: ${method} ${endpoint}`, error);
    throw error;
  }
}

/**
 * Helper function to refresh an access token
 * Uses server session-based authentication instead of localStorage
 */
async function refreshAccessToken(): Promise<string> {
  try {
    console.log('Attempting to refresh authentication session...');
    
    // Use direct fetch here since apiRequest would cause circular reference
    const refreshEndpoint = '/api/auth/refresh-token';
    const mappedRefreshEndpoint = AUTH_ROUTE_MAPPING[refreshEndpoint] || refreshEndpoint;
    
    const res = await fetch(mappedRefreshEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies for session auth
    });
    
    console.log('Refresh token response status:', res.status);
    
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
      
      console.error('Token refresh failed with status:', res.status, errorDetails);
      
      // Don't throw for expected 401 errors during session validation
      if (res.status === 401) {
        console.log('User session has expired or is invalid. User needs to login again.');
        return '';
      }
      
      throw new Error(`Failed to refresh token: ${res.status} ${errorDetails}`);
    }
    
    const data = await res.json();
    
    // No need to update localStorage - sessions are handled by the server
    console.log('Session refreshed successfully');
    
    return data.accessToken || '';
  } catch (error) {
    console.error('Token refresh failed with error:', error);
    
    // Don't redirect on failed refresh during regular API calls
    // Only redirect if user explicitly attempts to access a protected route
    if (window.location.pathname !== '/auth' && window.location.pathname !== '/') {
      console.log('Redirecting to login page due to authentication failure');
      window.location.href = '/auth';
    }
    
    throw error;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
}
