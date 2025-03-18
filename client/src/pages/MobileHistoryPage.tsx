import React from 'react';
import { PageHeader } from '@/components/mobile/PageHeader';
import { useAuth } from '@/hooks/use-auth';

const MobileHistoryPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHeader title="Transaction History" />
      
      <div className="container px-4 pt-4 pb-16">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Transaction History</h1>
          <p className="text-sm text-muted-foreground">
            View your recent deposits and withdrawals
          </p>
        </div>
        
        <div className="rounded-lg border border-border p-4 mb-4">
          <p className="text-center text-muted-foreground py-8">
            Your transaction history will appear here
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileHistoryPage;