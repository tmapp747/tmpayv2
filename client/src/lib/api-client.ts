
/**
 * API client utility for making authenticated requests with token refresh
 * Enhanced with offline detection and session expiration handling
 * Now uses the centralized session manager for better state management
 */
import sessionManager from './session-manager';

// Track token refresh status to prevent multiple simultaneous refreshes
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

/**
 * Make an authenticated API request with automatic token refresh
 * Enhanced with offline detection and robust error handling
 */
export async function apiRequest(
  method: string,
  endpoint: string,
  body?: any,
  headers?: Record<string, string>,
  retry = true
): Promise<Response> {
  // Check for network connectivity first
  if (!navigator.onLine) {
    console.log(`⚠️ Network offline, cannot make request: ${method} ${endpoint}`);
    // Return a synthetic offline response
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Network offline',
      offline: true
    }), {
      status: 503,
      headers: {'Content-Type': 'application/json'}
    });
  }
  
  // Check if server is known to be unreachable (after multiple failed attempts)
  if (sessionManager.isServerUnreachable && !endpoint.includes('/api/auth/refresh-token')) {
    console.log(`⚠️ Server unreachable, cannot make request: ${method} ${endpoint}`);
    // Return a synthetic server unreachable response
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Server unreachable or restarting',
      serverDown: true
    }), {
      status: 503,
      headers: {'Content-Type': 'application/json'}
    });
  }
  
  // Check if session is known to be expired
  if (sessionManager.sessionStatus === 'expired' && 
      !endpoint.includes('/api/auth/login') && 
      !endpoint.includes('/api/auth/refresh-token')) {
    console.log(`⚠️ Session known to be expired, not making request: ${method} ${endpoint}`);
    // Return a synthetic session expired response
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Session expired',
      sessionExpired: true
    }), {
      status: 401,
      headers: {'Content-Type': 'application/json'}
    });
  }
  
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
  console.log(`API Request: ${method} ${endpoint}`);
  if (body && method !== 'GET') {
    // Avoid logging potentially sensitive data
    console.log('Request body type:', typeof body);
  }
  
  try {
    // Make the request with credentials to ensure cookies are sent
    const res = await fetch(endpoint, options);
    
    // Reset server unreachable status on any successful response
    if (res.status !== 502 && res.status !== 503 && res.status !== 504) {
      sessionManager.setServerUnreachable(false);
    }
    
    // Log response status for debugging
    console.log(`API Response status: ${res.status} for ${method} ${endpoint}`);
    
    // Handle server errors that might indicate restart or maintenance
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      console.log(`⚠️ Server error ${res.status} detected, may be restarting`);
      
      // After 3 consecutive server errors, mark server as unreachable to reduce unnecessary requests
      const consecutiveErrors = (parseInt(localStorage.getItem('serverErrorCount') || '0') + 1);
      localStorage.setItem('serverErrorCount', consecutiveErrors.toString());
      
      if (consecutiveErrors >= 3) {
        console.log('❌ Server appears to be down or restarting, marking as unreachable');
        sessionManager.setServerUnreachable(true);
        
        // Set a timeout to reset the unreachable status after 30 seconds to allow retry
        setTimeout(() => {
          sessionManager.setServerUnreachable(false);
          localStorage.setItem('serverErrorCount', '0');
          console.log('🔄 Server unreachable status reset, will attempt reconnection');
        }, 30000);
      }
      
      return res;
    } else {
      // Reset consecutive error count on successful response
      localStorage.setItem('serverErrorCount', '0');
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
          // If refresh failed, mark session as expired to prevent further requests
          sessionManager.setSessionStatus('expired');
          // If refresh failed, return the original 401 response
          return res;
        }
      } catch (error) {
        console.error('Error during session refresh:', error);
        // On error, mark session as expired
        sessionManager.setSessionStatus('expired');
        // Return the original 401 response
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
    
    // If the fetch completely fails, likely due to network issues or CORS
    // Mark as offline or server unreachable based on navigator.onLine
    if (navigator.onLine) {
      console.log('❌ Server appears to be unreachable');
      sessionManager.setServerUnreachable(true);
      
      // Set a timeout to reset the unreachable status after 30 seconds
      setTimeout(() => {
        sessionManager.setServerUnreachable(false);
        console.log('🔄 Server unreachable status reset, will attempt reconnection');
      }, 30000);
    } else {
      console.log('❌ Device is offline');
      // sessionManager automatically tracks online status via navigator.onLine
    }
    
    // Return a synthetic error response
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Network error',
      offline: !navigator.onLine,
      serverDown: navigator.onLine
    }), {
      status: 503,
      headers: {'Content-Type': 'application/json'}
    });
  }
}

/**
 * Helper function to refresh an access token
 * Uses server session-based authentication instead of localStorage
 * Enhanced with better session expiration handling
 */
async function refreshAccessToken(): Promise<string> {
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
        
        // Show toast notification about session expiration when appropriate
        if (window.location.pathname !== '/auth' && window.location.pathname !== '/') {
          // Use custom event to trigger toast in components that listen for it
          window.dispatchEvent(new CustomEvent('session-expired', {
            detail: { message: 'Your session has expired. Please log in again.' }
          }));
          
          // Wait a moment before redirecting to allow the toast to be seen
          setTimeout(() => {
            // Redirect to login page through the session manager
            sessionManager.redirectToLogin();
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
    
    // Update last active timestamp
    sessionManager.updateLastActiveTimestamp();
    
    console.log('✅ Session refreshed successfully');
    
    return data.accessToken || '';
  } catch (error) {
    console.error('❌ Token refresh failed with error:', error);
    
    // Check if this is a network error (server unreachable)
    if (error instanceof TypeError && (error.message.includes('network') || error.message.includes('fetch'))) {
      console.log('📡 Network error during refresh, server may be restarting');
      sessionManager.setServerUnreachable(true);
      
      // Set a timeout to reset the unreachable status after 30 seconds
      setTimeout(() => {
        sessionManager.setServerUnreachable(false);
        console.log('🔄 Server unreachable status reset, will attempt reconnection');
      }, 30000);
      
      return '';
    }
    
    // If it's not a network error, mark session as expired
    sessionManager.setSessionStatus('expired');
    
    throw error;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
}
