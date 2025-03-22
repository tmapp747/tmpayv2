import React from 'react';
import { useLocation } from 'wouter';
import MobilePaymentStatus from '../components/mobile/MobilePaymentStatus';

export default function PaymentStatusPage() {
  const [location] = useLocation();
  
  // Parse query parameters
  const params = new URLSearchParams(window.location.search);
  const reference = params.get('reference');
  const transactionId = params.get('id') ? Number(params.get('id')) : undefined;
  
  return (
    <div className="container mx-auto px-4 py-6">
      <MobilePaymentStatus 
        reference={reference || undefined} 
        transactionId={transactionId} 
      />
    </div>
  );
}