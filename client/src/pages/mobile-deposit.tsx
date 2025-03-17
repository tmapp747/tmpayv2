import React, { useEffect } from "react";
import { useLocation, Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { initMobileEnhancements } from "@/lib/mobile-utils";
import MobileGCashDeposit from "@/components/mobile/MobileGCashDeposit";
import BottomNavBar from "@/components/navigation/BottomNavBar";
import { Loader2 } from "lucide-react";

export default function MobileDepositPage() {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  // Initialize mobile enhancements
  useEffect(() => {
    initMobileEnhancements();
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#001138] to-[#002D87]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Redirect to="/mobile-auth" />;
  }

  return (
    <div className="mobile-app-container">
      <MobileGCashDeposit />
      <BottomNavBar />
    </div>
  );
}