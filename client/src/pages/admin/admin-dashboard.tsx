import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { User, Transaction, QrPayment } from "@/lib/types";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { useLocation } from "wouter";

// Admin dashboard component
export default function AdminDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [manualPayments, setManualPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTopManager, setSelectedTopManager] = useState<string | 'all'>('all');
  const [topManagers, setTopManagers] = useState<string[]>([]);

  // Fetch admin data
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
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
        
        // Deduplicate the list
        const uniqueManagers = Array.from(new Set(managersList));
        setTopManagers(uniqueManagers);

        // Fetch transactions
        const transactionsResponse = await fetch('/api/admin/transactions');
        if (!transactionsResponse.ok) {
          throw new Error('Failed to fetch transactions');
        }
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData.transactions);

        // Fetch manual payments
        const manualPaymentsResponse = await fetch('/api/admin/manual-payments');
        if (!manualPaymentsResponse.ok) {
          throw new Error('Failed to fetch manual payments');
        }
        const manualPaymentsData = await manualPaymentsResponse.json();
        setManualPayments(manualPaymentsData.manualPayments);

      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load admin data',
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

  // Handle manual payment approval
  const handleApprovePayment = async (paymentId: number) => {
    try {
      const response = await fetch(`/api/admin/manual-payments/${paymentId}/approve`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to approve payment');
      }
      
      // Update the local state
      setManualPayments(prevPayments => 
        prevPayments.map(payment => 
          payment.id === paymentId 
            ? { ...payment, status: 'approved' } 
            : payment
        )
      );
      
      toast({
        title: 'Success',
        description: 'Payment approved successfully',
      });
    } catch (error) {
      console.error('Error approving payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve payment',
        variant: 'destructive',
      });
    }
  };

  // Handle manual payment rejection
  const handleRejectPayment = async (paymentId: number) => {
    try {
      const response = await fetch(`/api/admin/manual-payments/${paymentId}/reject`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject payment');
      }
      
      // Update the local state
      setManualPayments(prevPayments => 
        prevPayments.map(payment => 
          payment.id === paymentId 
            ? { ...payment, status: 'rejected' } 
            : payment
        )
      );
      
      toast({
        title: 'Success',
        description: 'Payment rejected successfully',
      });
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject payment',
        variant: 'destructive',
      });
    }
  };

  // Filter data by top manager
  const filteredUsers = selectedTopManager === 'all'
    ? users
    : users.filter(user => user.topManager === selectedTopManager);

  const filteredTransactions = selectedTopManager === 'all'
    ? transactions
    : transactions.filter(tx => {
        const user = users.find(u => u.id === tx.userId);
        return user?.topManager === selectedTopManager;
      });

  const filteredManualPayments = selectedTopManager === 'all'
    ? manualPayments
    : manualPayments.filter(payment => {
        const user = users.find(u => u.id === payment.userId);
        return user?.topManager === selectedTopManager;
      });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-semibold">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button 
          variant="outline" 
          onClick={() => {
            // Log out admin
            fetch('/api/admin/logout', { method: 'POST' })
              .then(() => setLocation('/admin/auth'))
              .catch(error => console.error('Logout error:', error));
          }}
        >
          Logout
        </Button>
      </div>

      {/* Top Manager Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button 
          variant={selectedTopManager === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedTopManager('all')}
        >
          All Top Managers
        </Button>
        {topManagers.map(manager => (
          <Button 
            key={manager}
            variant={selectedTopManager === manager ? 'default' : 'outline'}
            onClick={() => setSelectedTopManager(manager)}
          >
            {manager}
          </Button>
        ))}
      </div>

      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Users ({filteredUsers.length})</TabsTrigger>
          <TabsTrigger value="transactions">
            Transactions ({filteredTransactions.length})
          </TabsTrigger>
          <TabsTrigger value="manual-payments">
            Manual Payments ({filteredManualPayments.length})
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Users List</CardTitle>
              <CardDescription>
                Manage all casino users across different top managers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Casino ID</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Casino Balance</TableHead>
                    <TableHead>Top Manager</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.casinoUsername || '-'}</TableCell>
                        <TableCell>{formatCurrency(user.balance)}</TableCell>
                        <TableCell>{user.casinoBalance ? formatCurrency(user.casinoBalance) : '-'}</TableCell>
                        <TableCell>{user.topManager || '-'}</TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transactions History</CardTitle>
              <CardDescription>
                View all financial transactions across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((transaction) => {
                      const user = users.find(u => u.id === transaction.userId);
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.id}</TableCell>
                          <TableCell className="font-medium">{user?.username || 'Unknown'}</TableCell>
                          <TableCell>{transaction.type}</TableCell>
                          <TableCell>{transaction.method}</TableCell>
                          <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(transaction.status)}>
                              {transaction.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Payments Tab */}
        <TabsContent value="manual-payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Payments</CardTitle>
              <CardDescription>
                Review and approve/reject manual payment submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Proof</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredManualPayments.length > 0 ? (
                    filteredManualPayments.map((payment) => {
                      const user = users.find(u => u.id === payment.userId);
                      return (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.id}</TableCell>
                          <TableCell className="font-medium">{user?.username || 'Unknown'}</TableCell>
                          <TableCell>{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>{payment.paymentMethod}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" asChild>
                              <a href={payment.proofImageUrl} target="_blank" rel="noopener noreferrer">
                                View
                              </a>
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(payment.status)}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(payment.createdAt)}</TableCell>
                          <TableCell>
                            {payment.status === 'pending' && (
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleApprovePayment(payment.id)}
                                >
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleRejectPayment(payment.id)}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        No manual payments found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}