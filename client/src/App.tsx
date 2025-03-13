import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Wallet from "@/pages/Wallet";
import History from "@/pages/History";
import Profile from "@/pages/Profile";
import AuthPage from "@/pages/auth-page";
import LandingPage from "@/pages/landing-page";
import Layout from "@/components/Layout";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ProtectedAdminRoute } from "@/lib/protected-admin-route";
import AdminAuth from "@/pages/admin/admin-auth";
import AdminDashboard from "@/pages/admin/admin-dashboard";
import VideoIntro from "@/components/VideoIntro";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
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
      {/* Admin routes */}
      <Route path="/admin/auth" component={AdminAuth} />
      <ProtectedAdminRoute path="/admin/dashboard" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <VideoIntro />
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
