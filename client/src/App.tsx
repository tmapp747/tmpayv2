
import { useEffect } from 'react';
import { Route, useLocation } from 'wouter';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './providers/AuthProvider';
import { Toaster } from './components/ui/toaster';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import WalletPage from './pages/WalletPage';
import ProfilePage from './pages/ProfilePage';
import DepositPage from './pages/DepositPage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="app mobile-container">
          <Route path="/auth" component={AuthPage} />
          <ProtectedRoute path="/" component={DashboardPage} />
          <ProtectedRoute path="/dashboard" component={DashboardPage} />
          <ProtectedRoute path="/wallet" component={WalletPage} />
          <ProtectedRoute path="/profile" component={ProfilePage} />
          <ProtectedRoute path="/deposit" component={DepositPage} />
          <ProtectedRoute path="/history" component={HistoryPage} />
          <Toaster/>
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}
