import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Wallet from "@/pages/wallet/WalletPage";
import History from "@/pages/History";
import Profile from "@/pages/Profile";
import EmeraldProfile from "@/pages/EmeraldProfile";
import AuthPage from "@/pages/auth-page";
import MobileAuthPage from "@/pages/mobile-auth-page";
import LandingPage from "@/pages/landing-page";
import PaymentThankYou from "@/pages/payment-thank-you";
import ColorComparison from "@/pages/ColorComparison";
import MobileDashboard from "@/pages/MobileDashboard";
import MobileWallet from "@/pages/MobileWallet";
import MobileProfile from "@/pages/MobileProfile";
import MobileDepositPage from "@/pages/mobile-deposit";
import Layout from "@/components/Layout";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ProtectedAdminRoute } from "@/lib/protected-admin-route";
import AdminAuth from "@/pages/admin/admin-auth";
import AdminDashboard from "@/pages/admin/admin-dashboard";
import EnhancedAdminDashboard from "@/pages/admin/enhanced-admin-dashboard";
import { ThemeProvider } from "@/hooks/use-theme";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect } from "react";
import { useLocation } from "wouter";

function Router() {
  const isMobile = useIsMobile();
  const [location, navigate] = useLocation();

  // Redirect to appropriate version based on device
  useEffect(() => {
    // Only redirect specific routes and only on initial page load or direct navigation
    if (isMobile) {
      if (location === "/dashboard") navigate("/mobile");
      if (location === "/wallet") navigate("/mobile-wallet");
      if (location === "/profile") navigate("/mobile-profile");
      if (location === "/auth") navigate("/mobile/auth");
      
      // This fixes the issue with mobile-auth not redirecting to /mobile
      if ((location === "/mobile-auth" || location === "/mobile/auth") && sessionStorage.getItem("redirectToMobile")) {
        sessionStorage.removeItem("redirectToMobile");
        navigate("/mobile");
      }
    } else {
      // Redirect mobile routes to desktop if on desktop
      if (location === "/mobile") navigate("/dashboard");
      if (location === "/mobile-wallet") navigate("/wallet");
      if (location === "/mobile-profile") navigate("/profile");
      if (location === "/mobile/auth") navigate("/auth");
    }
  }, [isMobile, location, navigate]);

  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/mobile-auth" component={MobileAuthPage} />
      <Route path="/mobile/auth" component={MobileAuthPage} />
      <ProtectedRoute path="/dashboard" component={() => (
        <Layout>
          <Home />
        </Layout>
      )} />
      <ProtectedRoute path="/wallet" component={() => (
        <Layout>
          <Wallet />
        </Layout>
      )} />
      <ProtectedRoute path="/history" component={() => (
        <Layout>
          <History />
        </Layout>
      )} />
      <ProtectedRoute path="/profile" component={() => (
        <Layout>
          <Profile />
        </Layout>
      )} />
      <ProtectedRoute path="/profile-emerald" component={() => (
        <Layout>
          <EmeraldProfile />
        </Layout>
      )} />
      {/* Payment routes */}
      <Route path="/payment/thank-you" component={PaymentThankYou} />
      
      {/* Color comparison route */}
      <Route path="/color-comparison" component={() => (
        <Layout>
          <ColorComparison />
        </Layout>
      )} />
      
      {/* Mobile-optimized routes */}
      <ProtectedRoute path="/mobile" component={MobileDashboard} />
      <ProtectedRoute path="/mobile/wallet" component={MobileWallet} />
      <ProtectedRoute path="/mobile-wallet" component={MobileWallet} />
      <ProtectedRoute path="/mobile/profile" component={MobileProfile} />
      <ProtectedRoute path="/mobile-profile" component={MobileProfile} />
      <ProtectedRoute path="/mobile/deposit" component={MobileDepositPage} />
      <ProtectedRoute path="/mobile-deposit" component={MobileDepositPage} />
      
      {/* Admin routes */}
      <Route path="/admin/auth" component={AdminAuth} />
      <ProtectedAdminRoute path="/admin/dashboard" component={AdminDashboard} />
      <ProtectedAdminRoute path="/admin/enhanced-dashboard" component={EnhancedAdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          {/* VideoIntro component removed */}
          <Router />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
