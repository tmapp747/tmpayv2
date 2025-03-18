import React from 'react';
import MobileGCashDeposit from '@/components/mobile/MobileGCashDeposit';
import { PageHeader } from '@/components/mobile/PageHeader';
import { useAuth } from '@/hooks/use-auth';

const MobileDepositPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHeader title="Deposit" />
      
      <div className="container px-4 pt-4 pb-16">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Deposit Funds</h1>
          <p className="text-sm text-muted-foreground">
            Select your preferred payment method and amount
          </p>
        </div>
        
        <MobileGCashDeposit />
      </div>
    </div>
  );
};

export default MobileDepositPage;