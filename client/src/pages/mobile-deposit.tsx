import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { initMobileEnhancements } from "@/lib/mobile-utils";
import MobileGCashDeposit from "@/components/mobile/MobileGCashDeposit";
import BottomNavBar from "@/components/navigation/BottomNavBar";

export default function MobileDepositPage() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();

  // Initialize mobile enhancements
  useEffect(() => {
    initMobileEnhancements();
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !location.includes('/mobile/auth')) {
      navigate('/mobile/auth');
    }
  }, [user, navigate, location]);

  return (
    <ProtectedRoute>
      <div className="mobile-app-container">
        <MobileGCashDeposit />
        <BottomNavBar />
      </div>
    </ProtectedRoute>
  );
}