import React from 'react';
import { PageHeader } from '@/components/mobile/PageHeader';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

const MobileProfile: React.FC = () => {
  const { user, logoutMutation } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHeader title="Profile" />
      
      <div className="container px-4 pt-4 pb-16">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Your Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account information
          </p>
        </div>
        
        <div className="rounded-lg border border-border p-5 mb-4 bg-card">
          <div className="flex items-center space-x-4 mb-6">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-semibold text-primary">
              {user?.username?.slice(0, 1).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="font-medium text-lg">{user?.username || 'User'}</div>
              <div className="text-sm text-muted-foreground">{user?.email || 'No email provided'}</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-muted-foreground">Username</span>
              <span className="font-medium">{user?.username || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-muted-foreground">Casino ID</span>
              <span className="font-medium">{user?.casinoClientId || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-muted-foreground">Account Type</span>
              <span className="font-medium capitalize">{user?.role || 'player'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Preferred Currency</span>
              <span className="font-medium">{user?.preferredCurrency || 'PHP'}</span>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={() => logoutMutation.mutate()}
          variant="destructive"
          className="w-full"
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
        </Button>
      </div>
    </div>
  );
};

export default MobileProfile;