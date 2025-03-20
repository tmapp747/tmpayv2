import React, { useState } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import MobileGCashDeposit from "@/components/mobile/MobileGCashDeposit";
import MobileManualDeposit from "@/components/mobile/MobileManualDeposit";
import MobilePaygramDeposit from "@/components/mobile/MobilePaygramDeposit";
import MobileDepositMethodSelection, { PaymentMethodType } from "@/components/mobile/MobileDepositMethodSelection";
import MobileLayout from "@/components/MobileLayout";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function MobileDepositPage() {
  const { user, isLoading } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType | null>(null);

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

  // Handle payment method selection
  const handleSelectMethod = (method: PaymentMethodType) => {
    setSelectedMethod(method);
  };

  // Render the appropriate deposit component based on selected method
  const renderDepositComponent = () => {
    switch (selectedMethod) {
      case 'gcash':
        return <MobileGCashDeposit />;
      case 'manual':
        return <MobileManualDeposit />;
      case 'paygram':
        return <MobilePaygramDeposit />;
      default:
        return <MobileDepositMethodSelection onSelectMethod={handleSelectMethod} />;
    }
  };

  return (
    <MobileLayout 
      title={selectedMethod ? `${selectedMethod.charAt(0).toUpperCase() + selectedMethod.slice(1)} Deposit` : "Deposit"} 
      showNav={true}
      transparentHeader={true}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedMethod || 'selection'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderDepositComponent()}
        </motion.div>
      </AnimatePresence>
    </MobileLayout>
  );
}