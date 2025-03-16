import { useQuery } from "@tanstack/react-query";
import { userApi, transactionsApi } from "@/lib/api";
import { motion } from "framer-motion";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DepositForm from "@/components/wallet/DepositForm";
import TransactionTable from "@/components/wallet/TransactionTable";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/lib/types";
import { Briefcase, Wallet, ArrowDown, ArrowUp, RefreshCw, ChevronDown } from "lucide-react";

function WalletPage() {
  const [activeTab, setActiveTab] = useState("balance");
  const { toast } = useToast();
  
  // Get user info
  const { data: userData, isLoading: isUserLoading } = useQuery<{ success: boolean, user: User }>({
    queryKey: ['/api/user/info'],
  });
  
  // Get balance for 3D animation effect
  const animatedValue = {
    balance: userData?.user?.balance || 0,
    pendingBalance: userData?.user?.pendingBalance || 0
  };
  
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold flex items-center mb-2" style={{textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'}}>
          <Briefcase className="h-8 w-8 mr-3 text-primary" style={{filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.3))'}} />
          My Wallet
        </h1>
        <p className="text-muted-foreground">Manage your funds, make deposits, and track your transactions</p>
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Balance and Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Balance Card with 3D styling */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="border-2 border-secondary/20 rounded-xl overflow-hidden relative"
                  style={{
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 5px 10px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.05)', 
                    transform: 'translateZ(0)'
                  }}>
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 opacity-50 pointer-events-none"></div>
              
              <CardHeader className="pb-2 relative">
                <CardTitle className="text-lg flex items-center" style={{textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'}}>
                  <Wallet className="h-5 w-5 mr-2 text-primary" style={{filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.3))'}} />
                  Your Balance
                </CardTitle>
              </CardHeader>
              
              <CardContent className="relative">
                <div className="flex flex-col">
                  <div className="mb-4">
                    <div className="text-3xl font-bold flex items-end" style={{
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
                    }}>
                      {formatCurrency(userData?.user?.balance || 0)}
                    </div>
                    <p className="text-sm text-muted-foreground">Available Balance</p>
                  </div>
                  
                  {userData?.user?.pendingBalance > 0 && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-3"
                         style={{boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 2px 5px rgba(0, 0, 0, 0.1)'}}>
                      <div className="flex items-center">
                        <RefreshCw className="h-4 w-4 mr-2 text-yellow-500 animate-spin" style={{animationDuration: '3s'}} />
                        <div>
                          <div className="text-sm font-medium">Pending: {formatCurrency(userData?.user?.pendingBalance || 0)}</div>
                          <p className="text-xs text-muted-foreground">Transactions in progress</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="bg-card p-3 border-2 border-green-500/20 rounded-lg flex items-center justify-between"
                         style={{
                           boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
                           transform: 'translateZ(0)'
                         }}>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Deposits</p>
                        <p className="text-sm font-medium" style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'}}>+₱0.00</p>
                      </div>
                      <ArrowDown className="h-4 w-4 text-green-500" style={{filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))'}} />
                    </div>
                    
                    <div className="bg-card p-3 border-2 border-red-500/20 rounded-lg flex items-center justify-between"
                         style={{
                           boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
                           transform: 'translateZ(0)'
                         }}>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Withdrawals</p>
                        <p className="text-sm font-medium" style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'}}>-₱0.00</p>
                      </div>
                      <ArrowUp className="h-4 w-4 text-red-500" style={{filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))'}} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Deposit Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <DepositForm />
          </motion.div>
        </div>
        
        {/* Right column - Transactions */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6 bg-muted/30 p-1 border-2 border-secondary/20 rounded-lg"
                       style={{
                         boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
                         transform: 'translateZ(0)'
                       }}>
                <TabsTrigger value="balance" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-secondary/30">
                  Recent Activity
                </TabsTrigger>
                <TabsTrigger value="transactions" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-secondary/30">
                  All Transactions
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="balance" className="space-y-4 mt-0">
                <TransactionTable />
              </TabsContent>
              
              <TabsContent value="transactions" className="space-y-4 mt-0">
                <TransactionTable />
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default WalletPage;