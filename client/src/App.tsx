
import { Route, useLocation, Router, Switch } from 'wouter';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './hooks/use-auth';
import { Toaster } from './components/ui/toaster';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

// Mobile Pages
import MobileAuthPage from './pages/mobile-auth-page';
import MobileDashboardPage from './pages/MobileDashboard';
import MobileWalletPage from './pages/MobileWallet';
import MobileProfilePage from './pages/MobileProfile';
import MobileDepositPage from './pages/MobileDepositPage';
import MobileHistoryPage from './pages/MobileHistoryPage';
import MobileThankYouPage from './pages/mobile/MobileThankYouPage';

export default function App() {
  const [location] = useLocation();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="app mobile-container">
          {/* Default route redirects to the mobile version */}
          <Route path="/">
            {() => {
              window.location.href = "/mobile";
              return null;
            }}
          </Route>

          {/* Authentication route */}
          <Route path="/auth" component={MobileAuthPage} />

          {/* Protected Mobile routes */}
          <Route path="/mobile">
            {(params) => (
              <ProtectedRoute>
                <MobileDashboardPage />
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/mobile/dashboard">
            {(params) => (
              <ProtectedRoute>
                <MobileDashboardPage />
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/mobile/wallet">
            {(params) => (
              <ProtectedRoute>
                <MobileWalletPage />
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/mobile/profile">
            {(params) => (
              <ProtectedRoute>
                <MobileProfilePage />
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/mobile/deposit">
            {(params) => (
              <ProtectedRoute>
                <MobileDepositPage />
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/mobile/history">
            {(params) => (
              <ProtectedRoute>
                <MobileHistoryPage />
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/mobile/thank-you">
            {(params) => (
              <ProtectedRoute>
                <MobileThankYouPage />
              </ProtectedRoute>
            )}
          </Route>
          
          <Toaster/>
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}
