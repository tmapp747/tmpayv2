import { useEffect } from 'react';
import { Route, useLocation } from 'wouter';
import { ProtectedRoute } from './components/ProtectedRoute';
import MobileWallet from './pages/MobileWallet';
import MobileProfile from './pages/MobileProfile';
import MobileDepositPage from './pages/MobileDepositPage';
import MobileHistoryPage from './pages/MobileHistoryPage';
import MobileDashboard from './pages/MobileDashboard';
import AuthPage from './pages/AuthPage';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";


export default function App() {
  const [location, navigate] = useLocation();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <div className="app">
            <Route path="/auth" component={AuthPage} />
            <ProtectedRoute path="/" component={MobileDashboard} />
            <ProtectedRoute path="/dashboard" component={MobileDashboard} />
            <ProtectedRoute path="/wallet" component={MobileWallet} />
            <ProtectedRoute path="/profile" component={MobileProfile} />
            <ProtectedRoute path="/deposit" component={MobileDepositPage} />
            <ProtectedRoute path="/history" component={MobileHistoryPage} />
            <Toaster/>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}