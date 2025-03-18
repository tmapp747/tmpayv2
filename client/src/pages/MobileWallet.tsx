import React from 'react';
import { PageHeader } from '@/components/mobile/PageHeader';
import { useAuth } from '@/hooks/use-auth';

const MobileWallet: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHeader title="Wallet" />
      
      <div className="container px-4 pt-4 pb-16">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Wallet</h1>
          <p className="text-sm text-muted-foreground">
            Manage your funds and currencies
          </p>
        </div>
        
        <div className="rounded-lg border border-border p-4 mb-4 bg-card">
          <h2 className="text-xl font-semibold mb-2">Balance</h2>
          <div className="text-3xl font-bold">
            ₱{user ? parseFloat(user.balance).toLocaleString() : '0.00'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileWallet;