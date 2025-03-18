
import { Route, useLocation } from 'wouter';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './providers/AuthProvider';
import { Toaster } from './components/ui/toaster';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

// Mobile Pages
import MobileAuthPage from './pages/mobile/MobileAuthPage';
import MobileDashboardPage from './pages/mobile/MobileDashboardPage';
import MobileWalletPage from './pages/mobile/MobileWalletPage';
import MobileProfilePage from './pages/mobile/MobileProfilePage';
import MobileDepositPage from './pages/mobile/MobileDepositPage';
import MobileHistoryPage from './pages/mobile/MobileHistoryPage';
import MobileThankYouPage from './pages/mobile/MobileThankYouPage';

export default function App() {
  const [location] = useLocation();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="app mobile-container">
          <Route path="/mobile/auth" component={MobileAuthPage} />
          <ProtectedRoute path="/mobile" component={MobileDashboardPage} />
          <ProtectedRoute path="/mobile/dashboard" component={MobileDashboardPage} />
          <ProtectedRoute path="/mobile/wallet" component={MobileWalletPage} />
          <ProtectedRoute path="/mobile/profile" component={MobileProfilePage} />
          <ProtectedRoute path="/mobile/deposit" component={MobileDepositPage} />
          <ProtectedRoute path="/mobile/history" component={MobileHistoryPage} />
          <ProtectedRoute path="/mobile/thank-you" component={MobileThankYouPage} />
          <Toaster/>
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}
