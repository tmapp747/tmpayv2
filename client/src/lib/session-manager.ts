/**
 * Session Manager Utility
 * 
 * This utility provides a centralized way to manage session state,
 * handling network connectivity issues and server restarts gracefully.
 * It works together with the api-client.ts and authentication hooks
 * to provide a seamless user experience.
 */

// Types for session manager
export type SessionStatus = 'active' | 'expired' | 'unknown';
export type NetworkStatus = 'online' | 'offline' | 'server-unreachable';

// Session events that components can listen for
export const SESSION_EVENTS = {
  SESSION_EXPIRED: 'session-expired',
  NETWORK_STATUS_CHANGED: 'network-status-changed',
  SERVER_STATUS_CHANGED: 'server-status-changed',
};

// Class for managing session and network state
class SessionManager {
  private _sessionStatus: SessionStatus = 'unknown';
  private _networkStatus: NetworkStatus = navigator.onLine ? 'online' : 'offline';
  private _lastActivity: number = Date.now();
  private _serverUnreachableSince: number | null = null;
  private _sessionExpiryTimestamp: number | null = null;
  private _checkInterval: NodeJS.Timeout | null = null;
  private _reconnectAttempts: number = 0;
  private _maxReconnectAttempts: number = 5;
  
  constructor() {
    // Initialize session state from localStorage if available
    const sessionState = localStorage.getItem('sessionState');
    if (sessionState === 'active') {
      this._sessionStatus = 'active';
      const lastActiveStr = localStorage.getItem('lastActive');
      if (lastActiveStr) {
        this._lastActivity = parseInt(lastActiveStr, 10);
      }
    } else if (sessionState === 'expired') {
      this._sessionStatus = 'expired';
    }
    
    // Set up listeners for network events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Start background check interval
    this.startBackgroundChecks();
  }
  
  /**
   * Gets the current session status
   */
  get sessionStatus(): SessionStatus {
    return this._sessionStatus;
  }
  
  /**
   * Gets the current network status
   */
  get networkStatus(): NetworkStatus {
    return this._networkStatus;
  }
  
  /**
   * Update the session status
   */
  setSessionStatus(status: SessionStatus): void {
    const previous = this._sessionStatus;
    this._sessionStatus = status;
    
    // Persist session state to localStorage
    localStorage.setItem('sessionState', status);
    
    // Update last activity timestamp for active sessions
    if (status === 'active') {
      this._lastActivity = Date.now();
      localStorage.setItem('lastActive', this._lastActivity.toString());
      this._sessionExpiryTimestamp = null;
    } else if (status === 'expired') {
      this._sessionExpiryTimestamp = Date.now();
    }
    
    // Only dispatch event if status changed
    if (previous !== status) {
      // Dispatch custom event for components to listen for
      window.dispatchEvent(new CustomEvent(SESSION_EVENTS.SESSION_EXPIRED, {
        detail: { 
          previous, 
          current: status, 
          message: status === 'expired' ? 'Your session has expired. Please log in again.' : undefined
        }
      }));
    }
  }
  
  /**
   * Update the network status
   */
  setNetworkStatus(status: NetworkStatus): void {
    const previous = this._networkStatus;
    this._networkStatus = status;
    
    // Track server unreachable time
    if (status === 'server-unreachable' && this._serverUnreachableSince === null) {
      this._serverUnreachableSince = Date.now();
      this._reconnectAttempts = 0;
    } else if (status === 'online') {
      this._serverUnreachableSince = null;
      this._reconnectAttempts = 0;
    }
    
    // Only dispatch event if status changed
    if (previous !== status) {
      // Dispatch custom event for components to listen for
      window.dispatchEvent(new CustomEvent(SESSION_EVENTS.NETWORK_STATUS_CHANGED, {
        detail: { previous, current: status }
      }));
    }
  }
  
  /**
   * Handle online event from the browser
   */
  private handleOnline(): void {
    console.log('🌐 Network connection detected');
    this.setNetworkStatus('online');
    
    // Schedule a ping to check if server is actually available
    setTimeout(() => this.pingServer(), 1000);
  }
  
  /**
   * Handle offline event from the browser
   */
  private handleOffline(): void {
    console.log('❌ Network connection lost');
    this.setNetworkStatus('offline');
  }
  
  /**
   * Ping the server to check if it's reachable
   */
  async pingServer(): Promise<boolean> {
    try {
      // Use a lightweight endpoint for ping
      const response = await fetch('/api/ping', { 
        method: 'GET', 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (response.ok) {
        // Server is reachable and responding
        console.log('✅ Server connection verified');
        this.setNetworkStatus('online');
        return true;
      } else {
        // Server is reachable but returning errors
        console.log(`⚠️ Server responding with error: ${response.status}`);
        this._reconnectAttempts++;
        
        if (this._reconnectAttempts >= this._maxReconnectAttempts) {
          this.setNetworkStatus('server-unreachable');
        }
        
        return false;
      }
    } catch (error) {
      // Server is unreachable
      console.error('❌ Failed to connect to server:', error);
      this._reconnectAttempts++;
      
      if (this._reconnectAttempts >= this._maxReconnectAttempts) {
        this.setNetworkStatus('server-unreachable');
      }
      
      return false;
    }
  }
  
  /**
   * Start background checks for session and network status
   */
  private startBackgroundChecks(): void {
    // Clear any existing interval
    if (this._checkInterval) {
      clearInterval(this._checkInterval);
    }
    
    // Set up new interval (every 30 seconds)
    this._checkInterval = setInterval(() => {
      // If server has been unreachable for too long, attempt reconnection
      if (this._networkStatus === 'server-unreachable' && this._serverUnreachableSince) {
        const timeUnreachable = Date.now() - this._serverUnreachableSince;
        // Try to reconnect every 2 minutes
        if (timeUnreachable > 2 * 60 * 1000) {
          console.log('🔄 Attempting to reconnect to server...');
          this.pingServer();
          this._serverUnreachableSince = Date.now(); // Reset the timer
        }
      }
      
      // Check for session activity
      if (this._sessionStatus === 'active') {
        const inactiveTime = Date.now() - this._lastActivity;
        // If no activity for 15 minutes, ping the server
        if (inactiveTime > 15 * 60 * 1000) {
          this.pingServer();
          this._lastActivity = Date.now(); // Reset the timer even on failed ping
        }
      }
    }, 30000);
  }
  
  /**
   * Record user activity to prevent session timeouts
   */
  recordActivity(): void {
    if (this._sessionStatus === 'active') {
      this._lastActivity = Date.now();
      localStorage.setItem('lastActive', this._lastActivity.toString());
    }
  }
  
  /**
   * Handle server restart detection
   */
  notifyServerRestarting(): void {
    console.log('🔄 Server restart detected');
    this.setNetworkStatus('server-unreachable');
    
    // Set a timeout to check if server is back up
    setTimeout(() => {
      console.log('🔄 Checking if server is back up after restart...');
      this.pingServer();
    }, 5000);
  }
  
  /**
   * Check if the session has expired
   */
  checkSessionExpiry(): boolean {
    if (this._sessionExpiryTimestamp) {
      return true;
    }
    
    return this._sessionStatus === 'expired';
  }
  
  /**
   * Cleanup resources when component unmounts
   */
  dispose(): void {
    if (this._checkInterval) {
      clearInterval(this._checkInterval);
      this._checkInterval = null;
    }
    
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
  }
}

// Create a singleton instance
export const sessionManager = new SessionManager();

// Export a hook for React components to use
export default sessionManager;