import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

export default function MobileBankingPage() {
  const [, navigate] = useLocation();
  
  useEffect(() => {
    // Redirect to payment methods page
    navigate('/mobile/payment-methods');
  }, [navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#001138] to-[#002D87]">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-white mx-auto mb-4" />
        <p className="text-white text-lg">Redirecting to Payment Methods...</p>
      </div>
    </div>
  );
}