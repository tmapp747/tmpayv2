import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { User, Transaction } from "@/lib/types";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Loader2, Database, Shield, RefreshCw, Users, DollarSign, MessageCircle } from "lucide-react";
import ManagerPerformanceCard from "@/components/admin/manager-dashboard/ManagerPerformanceCard";
import ManagerAnalytics from "@/components/admin/manager-dashboard/ManagerAnalytics";
import UserHierarchyTree from "@/components/admin/manager-dashboard/UserHierarchyTree";
import TokenManagement from "@/components/admin/manager-dashboard/TokenManagement";
import CommunicationHub from "@/components/admin/manager-dashboard/CommunicationHub";
import ManualPaymentReview from "@/components/admin/ManualPaymentReview";

// Enhanced Admin Dashboard component with focused management for the three top managers
export default function EnhancedAdminDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTopManager, setSelectedTopManager] = useState<string>('');
  const [topManagers, setTopManagers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  // Helper function to safely set top managers array
  const safeSetTopManagers = (managers: unknown[]): void => {
    // Ensure all items are strings
    const safeManagers = managers.filter((item): item is string => typeof item === 'string');
    setTopManagers(safeManagers);
    
    // Set the first manager as selected by default
    if (safeManagers.length > 0 && !selectedTopManager) {
      setSelectedTopManager(safeManagers[0]);
    }
  };

  // Fetch admin data for dashboard
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch users
        const usersResponse = await fetch('/api/admin/users');
        if (!usersResponse.ok) {
          throw new Error('Failed to fetch users');
        }
        const usersData = await usersResponse.json();
        setUsers(usersData.users);

        // Extract unique top managers
        const managersList = usersData.users
          .filter((user: User) => user.topManager)
          .map((user: User) => user.topManager as string);
        
        // Deduplicate the list and use safe setter
        const uniqueManagers = Array.from(new Set(managersList));
        safeSetTopManagers(uniqueManagers);

        // Fetch transactions
        const transactionsResponse = await fetch('/api/admin/transactions');
        if (!transactionsResponse.ok) {
          throw new Error('Failed to fetch transactions');
        }
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData.transactions);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load admin dashboard data',
          variant: 'destructive',
        });
        
        // If unauthorized, redirect to admin login
        if (error instanceof Error && error.message.includes('401')) {
          setLocation('/admin/auth');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, [toast, setLocation]);

  // Function to refresh token for a specific manager
  const refreshManagerToken = async (manager: string): Promise<void> => {
    try {
      // In a real implementation, this would call an API endpoint to refresh the token
      toast({
        title: "Refresh initiated",
        description: `Refreshing token for ${manager}...`,
      });
      
      // Simulate token refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success notification
      toast({
        title: "Token refreshed",
        description: `${manager}'s token has been refreshed successfully`,
      });
    } catch (error) {
      console.error(`Error refreshing token for ${manager}:`, error);
      toast({
        variant: "destructive",
        title: "Token refresh failed",
        description: `Failed to refresh token for ${manager}`,
      });
      throw error;
    }
  };

  // Get users for a specific manager
  const getUsersForManager = (manager: string) => {
    return users.filter(user => user.topManager === manager);
  };

  // Get transactions for a specific manager
  const getTransactionsForManager = (manager: string) => {
    const managerUsers = getUsersForManager(manager);
    const userIds = managerUsers.map(user => user.id);
    return transactions.filter(tx => userIds.includes(tx.userId));
  };

  // Calculate user statistics for a manager
  const calculateManagerStats = (manager: string) => {
    const managerUsers = getUsersForManager(manager);
    
    // Calculate deposit and withdrawal transactions
    const managerTransactions = getTransactionsForManager(manager);
    const deposits = managerTransactions.filter(tx => tx.type.includes('deposit'));
    const withdrawals = managerTransactions.filter(tx => tx.type.includes('withdraw'));
    
    // Calculate total amounts
    const totalDeposits = deposits.reduce((sum, tx) => {
      const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount;
      return sum + amount;
    }, 0);
    
    const totalWithdrawals = withdrawals.reduce((sum, tx) => {
      const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount;
      return sum + amount;
    }, 0);
    
    // Simulated active users (in a real implementation, this would come from API)
    const activeUsers = Math.floor(managerUsers.length * 0.6);
    
    // Simulated percentage changes (in a real implementation, these would be calculated from historical data)
    const depositChange = Math.floor(Math.random() * 15) + 1;
    const withdrawalChange = Math.floor(Math.random() * 10) - 5;
    const activeUsersChange = Math.floor(Math.random() * 10) + 1;
    
    // New users in last 24h (simulated)
    const newUsers24h = Math.floor(Math.random() * 3);
    
    return {
      totalUsers: managerUsers.length,
      newUsers24h,
      totalDeposits,
      depositChange,
      totalWithdrawals,
      withdrawalChange,
      activeUsers,
      activeUsersChange
    };
  };

  // Generate transaction data for charts (simulated data)
  const generateTransactionData = (manager: string) => {
    // In a real implementation, this would fetch actual historical data
    const dates = ['Jan 1', 'Jan 2', 'Jan 3', 'Jan 4', 'Jan 5', 'Jan 6', 'Jan 7'];
    
    return dates.map(date => ({
      date,
      deposits: Math.floor(Math.random() * 10000) + 1000,
      withdrawals: Math.floor(Math.random() * 5000) + 500,
      transfers: Math.floor(Math.random() * 3000) + 200
    }));
  };

  // Generate user data for charts (simulated data)
  const generateUserData = (manager: string) => {
    // In a real implementation, this would fetch actual historical data
    const dates = ['Jan 1', 'Jan 2', 'Jan 3', 'Jan 4', 'Jan 5', 'Jan 6', 'Jan 7'];
    
    return dates.map(date => ({
      date,
      newUsers: Math.floor(Math.random() * 10) + 1,
      activeUsers: Math.floor(Math.random() * 50) + 20
    }));
  };

  // Generate distribution data for charts (simulated data)
  const generateDistributionData = (manager: string) => {
    // In a real implementation, this would calculate actual distribution from user data
    return [
      { name: 'Deposits', value: Math.floor(Math.random() * 50000) + 10000, percentage: 45 },
      { name: 'Withdrawals', value: Math.floor(Math.random() * 30000) + 5000, percentage: 25 },
      { name: 'Transfers', value: Math.floor(Math.random() * 20000) + 3000, percentage: 20 },
      { name: 'Casino', value: Math.floor(Math.random() * 10000) + 1000, percentage: 10 }
    ];
  };

  // Generate token info (simulated data)
  const generateTokenInfo = () => {
    return topManagers.map(manager => {
      // Random status for demo purposes
      const statuses: ('valid' | 'expiring' | 'expired' | 'unknown')[] = ['valid', 'expiring', 'expired', 'unknown'];
      const randomStatus = statuses[Math.floor(Math.random() * (statuses.length - 1))]; // Bias toward valid

      // Create expiry time between 1 and 30 minutes from now
      const now = new Date();
      const expiryTime = new Date(now.getTime() + (Math.floor(Math.random() * 29) + 1) * 60 * 1000);
      
      // Create last refreshed time between 1 and 60 minutes ago
      const lastRefreshed = new Date(now.getTime() - (Math.floor(Math.random() * 59) + 1) * 60 * 1000);

      return {
        manager,
        status: randomStatus,
        expiryTime,
        lastRefreshed
      };
    });
  };

  // Generate hierarchy data for tree view (simulated data)
  const generateHierarchyData = (manager: string) => {
    // In a real implementation, this would fetch actual hierarchy data from the API
    // Root node is the manager
    return {
      id: 1,
      clientId: 1001,
      username: manager,
      parentClientId: null,
      type: 'agent' as const,
      balance: 100000,
      children: [
        {
          id: 2,
          clientId: 1002,
          username: `Agent_${manager}_1`,
          parentClientId: 1001,
          type: 'agent' as const,
          balance: 50000,
          children: [
            {
              id: 5,
              clientId: 1005,
              username: `Player_${manager}_A`,
              parentClientId: 1002,
              type: 'player' as const,
              balance: 5000,
            },
            {
              id: 6,
              clientId: 1006,
              username: `Player_${manager}_B`,
              parentClientId: 1002,
              type: 'player' as const,
              balance: 7500,
            }
          ]
        },
        {
          id: 3,
          clientId: 1003,
          username: `Agent_${manager}_2`,
          parentClientId: 1001,
          type: 'agent' as const,
          balance: 30000,
          children: [
            {
              id: 7,
              clientId: 1007,
              username: `Player_${manager}_C`,
              parentClientId: 1003,
              type: 'player' as const,
              balance: 3000,
            }
          ]
        },
        {
          id: 4,
          clientId: 1004,
          username: `Agent_${manager}_3`,
          parentClientId: 1001,
          type: 'agent' as const,
          balance: 20000,
          children: [
            {
              id: 8,
              clientId: 1008,
              username: `Player_${manager}_D`,
              parentClientId: 1004,
              type: 'player' as const,
              balance: 2000,
            },
            {
              id: 9,
              clientId: 1009,
              username: `Player_${manager}_E`,
              parentClientId: 1004,
              type: 'player' as const,
              balance: 1500,
            },
            {
              id: 10,
              clientId: 1010,
              username: `Player_${manager}_F`,
              parentClientId: 1004,
              type: 'player' as const,
              balance: 4000,
            }
          ]
        }
      ]
    };
  };

  // Generate messages for communication hub (simulated data)
  const generateMessages = (manager: string) => {
    const now = new Date();
    return [
      {
        id: '1',
        sender: `Agent_${manager}_1`,
        recipient: manager,
        subject: 'Payment Issue',
        content: 'We are having issues with payments for Player_A. Can you help resolve this?',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
        isRead: false
      },
      {
        id: '2',
        sender: `Agent_${manager}_2`,
        recipient: manager,
        subject: 'New VIP Player',
        content: 'We have a new high-value player who needs VIP status. Please advise.',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        isRead: true
      },
      {
        id: '3',
        sender: 'System',
        recipient: manager,
        subject: 'Token Expiry Warning',
        content: 'Your authentication token will expire in 1 hour. Please refresh it.',
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
        isRead: true
      }
    ];
  };

  // Generate notifications for communication hub (simulated data)
  const generateNotifications = (manager: string) => {
    const now = new Date();
    return [
      {
        id: '1',
        type: 'transaction' as const,
        title: 'Large Withdrawal',
        description: `Player_${manager}_E has requested a withdrawal of ₱10,000.`,
        timestamp: new Date(now.getTime() - 15 * 60 * 1000), // 15 minutes ago
        isRead: false
      },
      {
        id: '2',
        type: 'user' as const,
        title: 'New Agent Added',
        description: `Agent_${manager}_4 has been added to your network.`,
        timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
        isRead: false
      },
      {
        id: '3',
        type: 'system' as const,
        title: 'System Maintenance',
        description: 'Scheduled maintenance in 2 hours. Service may be interrupted.',
        timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
        isRead: true
      }
    ];
  };

  // Generate users for communication hub (simulated data)
  const generateCommunicationUsers = (manager: string) => {
    return [
      { id: 1, username: `Agent_${manager}_1`, type: 'agent' },
      { id: 2, username: `Agent_${manager}_2`, type: 'agent' },
      { id: 3, username: `Agent_${manager}_3`, type: 'agent' },
      { id: 4, username: `Player_${manager}_A`, type: 'player' },
      { id: 5, username: `Player_${manager}_B`, type: 'player' },
      { id: 6, username: `Player_${manager}_C`, type: 'player' },
      { id: 7, username: `Player_${manager}_D`, type: 'player' },
      { id: 8, username: `Player_${manager}_E`, type: 'player' },
      { id: 9, username: `Player_${manager}_F`, type: 'player' }
    ];
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-xl font-semibold">Loading enhanced admin dashboard...</p>
          <p className="text-muted-foreground">Please wait while we fetch manager data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Enhanced Admin Dashboard</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-1"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setLocation('/admin/auth')}
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Manager Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topManagers.map(manager => {
          const stats = calculateManagerStats(manager);
          return (
            <ManagerPerformanceCard
              key={manager}
              manager={manager}
              totalUsers={stats.totalUsers}
              newUsers24h={stats.newUsers24h}
              totalDeposits={stats.totalDeposits}
              depositChange={stats.depositChange}
              totalWithdrawals={stats.totalWithdrawals}
              withdrawalChange={stats.withdrawalChange}
              activeUsers={stats.activeUsers}
              activeUsersChange={stats.activeUsersChange}
              isSelected={selectedTopManager === manager}
              onSelect={() => setSelectedTopManager(manager)}
              onRefresh={() => refreshManagerToken(manager)}
            />
          );
        })}
      </div>

      {/* Selected Manager Dashboard */}
      {selectedTopManager && (
        <div className="p-4 bg-background rounded-lg border shadow-sm">
          <div className="mb-4">
            <h2 className="text-2xl font-bold mb-2">{selectedTopManager} Dashboard</h2>
            <p className="text-muted-foreground">
              Detailed management interface for {selectedTopManager}'s casino network
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">
                <Database className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="hierarchy">
                <Users className="h-4 w-4 mr-2" />
                Hierarchy
              </TabsTrigger>
              <TabsTrigger value="tokens">
                <Shield className="h-4 w-4 mr-2" />
                Tokens
              </TabsTrigger>
              <TabsTrigger value="communications">
                <MessageCircle className="h-4 w-4 mr-2" />
                Communications
              </TabsTrigger>
              <TabsTrigger value="payments">
                <DollarSign className="h-4 w-4 mr-2" />
                Manual Payments
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <ManagerAnalytics 
                manager={selectedTopManager}
                transactionData={generateTransactionData(selectedTopManager)}
                userData={generateUserData(selectedTopManager)}
                distributionData={generateDistributionData(selectedTopManager)}
              />
            </TabsContent>

            <TabsContent value="hierarchy" className="mt-6">
              <UserHierarchyTree 
                manager={selectedTopManager}
                hierarchyData={generateHierarchyData(selectedTopManager)}
                onUserSelect={(user) => {
                  toast({
                    title: "User selected",
                    description: `${user.username} (${user.type}) - Client ID: ${user.clientId}`,
                  });
                }}
              />
            </TabsContent>

            <TabsContent value="tokens" className="mt-6">
              <TokenManagement 
                tokens={generateTokenInfo()}
                onRefresh={refreshManagerToken}
              />
            </TabsContent>

            <TabsContent value="communications" className="mt-6">
              <CommunicationHub 
                manager={selectedTopManager}
                users={generateCommunicationUsers(selectedTopManager)}
                messages={generateMessages(selectedTopManager)}
                notifications={generateNotifications(selectedTopManager)}
              />
            </TabsContent>

            <TabsContent value="payments" className="mt-6">
              <ManualPaymentReview />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}