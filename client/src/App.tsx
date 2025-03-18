import { useEffect } from 'react';
import { Route, useLocation } from 'wouter';
import { ProtectedRoute } from './components/ProtectedRoute';
import DepositPage from "./pages/DepositPage";
import WalletPage from "./pages/WalletPage";
import ProfilePage from "./pages/ProfilePage";
import HistoryPage from "./pages/HistoryPage";
import DashboardPage from "./pages/DashboardPage";
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
            <ProtectedRoute path="/" component={DashboardPage} />
            <ProtectedRoute path="/dashboard" component={DashboardPage} />
            <ProtectedRoute path="/wallet" component={WalletPage} />
            <ProtectedRoute path="/profile" component={ProfilePage} />
            <ProtectedRoute path="/deposit" component={DepositPage} />
            <ProtectedRoute path="/history" component={HistoryPage} />
            <Toaster/>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}