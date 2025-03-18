
/**
 * API client utility for making authenticated requests with token refresh
 * Enhanced with better session recovery and error handling
 */

// Track token refresh status to prevent multiple simultaneous refreshes
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

// Track authentication state for smart handling
let isAuthenticated = false;
let authenticationChecked = false;

// Map auth routes to their correct endpoints
const AUTH_ROUTE_MAPPING: Record<string, string> = {
  '/api/auth/login': '/api/login',       // Map client /auth/login to server /login
  '/api/auth/logout': '/api/logout',     // Map client /auth/logout to server /logout
  '/api/auth/refresh-token': '/api/refresh-token', // Map client refresh token to server endpoint
};

/**
 * Make an authenticated API request with automatic token refresh
 * Uses server-side session cookies for authentication with improved error recovery
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
  
  // If we have authenticated before but got a server restart,
  // try to refresh session first for better UX
  if (isAuthenticated && !authenticationChecked && retry && 
      endpoint !== '/api/auth/refresh-token' && endpoint !== '/api/refresh-token') {
    console.log('Previous session detected, attempting to validate before request');
    try {
      authenticationChecked = true;
      await refreshAccessToken();
    } catch (e) {
      console.log('Session validation failed, proceeding with original request');
    }
  }
  
  try {
    // Make the request with credentials to ensure cookies are sent
    const res = await fetch(mappedEndpoint, options);
    
    // Log response status for debugging
    console.log(`API Response status: ${res.status} for ${method} ${endpoint}`);
    
    // Update authentication state tracking based on response
    if (res.ok) {
      // On successful requests to authenticated endpoints, update our tracking
      if (endpoint !== '/api/auth/login' && endpoint !== '/api/login') {
        isAuthenticated = true;
      }
    }
    
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
          isAuthenticated = false;
          
          // Redirect non-public page access to auth
          const isAuthEndpoint = endpoint.includes('/api/auth/') || endpoint.includes('/api/login');
          if (!isAuthEndpoint && window.location.pathname !== '/auth' && window.location.pathname !== '/') {
            console.log('Unauthorized access to protected endpoint, redirecting to login');
            window.location.href = '/auth';
          }
          
          // If refresh failed, return the original 401 response
          return res;
        }
      } catch (error) {
        console.error('Error during session refresh:', error);
        isAuthenticated = false;
        
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
 * Enhanced with better recovery from server restarts
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
      
      // Update authenticated state tracking
      if (res.status === 401) {
        console.log('User session has expired or is invalid. User needs to login again.');
        isAuthenticated = false;
        
        // Don't redirect on regular API calls using refresh
        if (window.location.pathname !== '/auth' && window.location.pathname !== '/' && 
            window.location.pathname.includes('/mobile')) {
          console.log('Session expired, redirecting to auth page');
          window.location.href = '/auth';
        }
        
        return '';
      }
      
      throw new Error(`Failed to refresh token: ${res.status} ${errorDetails}`);
    }
    
    const data = await res.json();
    
    // Update authentication state tracking
    isAuthenticated = true;
    console.log('Session refreshed successfully');
    
    return data.accessToken || '';
  } catch (error) {
    console.error('Token refresh failed with error:', error);
    isAuthenticated = false;
    
    // Don't redirect on failed refresh during regular API calls
    // Only redirect if user explicitly attempts to access a protected route
    if (window.location.pathname !== '/auth' && window.location.pathname !== '/' && 
        window.location.pathname.includes('/mobile')) {
      console.log('Authentication failed, redirecting to login page');
      setTimeout(() => {
        window.location.href = '/auth';
      }, 100);
    }
    
    throw error;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
}
