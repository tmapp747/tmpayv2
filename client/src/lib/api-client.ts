
/**
 * API client utility for making authenticated requests with token refresh
 */

// Track token refresh status to prevent multiple simultaneous refreshes
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

/**
 * Make an authenticated API request with automatic token refresh
 */
export async function apiRequest(
  method: string,
  endpoint: string,
  body?: any,
  headers?: Record<string, string>,
  retry = true
): Promise<Response> {
  // Get auth token from localStorage if available
  const userData = localStorage.getItem('userData');
  let accessToken = '';
  let refreshToken = '';
  let tokenExpiry: Date | null = null;
  
  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      if (parsed.user) {
        accessToken = parsed.user.accessToken || '';
        refreshToken = parsed.user.refreshToken || '';
        
        // Check if we have an expiry date for the access token
        if (parsed.user.accessTokenExpiry) {
          tokenExpiry = new Date(parsed.user.accessTokenExpiry);
        }
      }
    } catch (e) {
      console.error('Error parsing user data from localStorage', e);
    }
  }
  
  // Check if token is expired or will expire in the next minute
  const isTokenExpired = tokenExpiry && tokenExpiry < new Date(Date.now() + 60 * 1000);
  
  // If token is expired and we have a refresh token, refresh it
  if (isTokenExpired && refreshToken && retry) {
    // Use a single refresh request if multiple API calls happen simultaneously
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken(refreshToken);
    }
    
    // Wait for the refresh promise to resolve
    try {
      accessToken = await refreshPromise || '';
    } catch (error) {
      console.error('Error waiting for token refresh:', error);
    }
  }
  
  // Build request options
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
      ...(headers || {}),
    },
    credentials: 'include',
  };
  
  // Add body for non-GET requests
  if (method !== 'GET' && body) {
    options.body = JSON.stringify(body);
  }
  
  // Make the request
  const res = await fetch(endpoint, options);
  
  // If unauthorized and we haven't retried yet, try refreshing token and retrying
  if (res.status === 401 && retry && refreshToken) {
    try {
      // Clear our existing refresh promise to force a new refresh
      isRefreshing = false;
      refreshPromise = null;
      
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
 */
async function refreshAccessToken(refreshToken: string): Promise<string> {
  try {
    const res = await fetch('/api/auth/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    
    if (!res.ok) {
      throw new Error('Failed to refresh token');
    }
    
    const data = await res.json();
    
    // Update local storage
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      const userData = JSON.parse(storedData);
      if (userData.user) {
        userData.user.accessToken = data.accessToken;
        localStorage.setItem('userData', JSON.stringify(userData));
      }
    }
    
    return data.accessToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Clear user data and redirect to login
    localStorage.removeItem('userData');
    window.location.href = '/auth';
    throw error;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
}
