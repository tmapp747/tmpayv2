import React from 'react';
import MobileLayout from '@/components/MobileLayout';
import { ChevronLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import MobilePaymentMethods from '@/components/mobile/MobilePaymentMethods';

export default function MobilePaymentMethodsPage() {
  const [, navigate] = useLocation();
  
  // Back button for left side of header
  const backButton = (
    <button 
      className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
      onClick={() => navigate('/mobile/profile')}
    >
      <ChevronLeft className="h-5 w-5 text-white" />
    </button>
  );
  
  return (
    <MobileLayout
      title="Payment Methods"
      showNav={true}
      headerContent={backButton}
      transparentHeader={true}
    >
      <div className="p-4 pb-20">
        <MobilePaymentMethods />
      </div>
    </MobileLayout>
  );
}