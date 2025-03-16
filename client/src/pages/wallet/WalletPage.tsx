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
            <Card className="border-2 border-green-900/30 rounded-xl overflow-hidden relative"
                  style={{
                    background: 'radial-gradient(circle at top right, rgba(20, 83, 45, 0.9), rgba(0, 0, 0, 0.85))',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4), 0 5px 10px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05)', 
                    transform: 'translateZ(0)'
                  }}>
              {/* Subtle gradient overlay with green glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-black/10 opacity-80 pointer-events-none"></div>
              {/* Extra radiant effect */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 rounded-full blur-3xl pointer-events-none"></div>
              
              <CardHeader className="pb-2 relative">
                <CardTitle className="text-lg flex items-center text-green-300" style={{textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'}}>
                  <Wallet className="h-5 w-5 mr-2 text-green-400" style={{filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.5))'}} />
                  Your Balance
                </CardTitle>
              </CardHeader>
              
              <CardContent className="relative">
                <div className="flex flex-col">
                  <div className="mb-4">
                    <div className="text-4xl font-bold flex items-end text-white" style={{
                      textShadow: '0 0 10px rgba(74, 222, 128, 0.5), 0 2px 4px rgba(0, 0, 0, 0.5)',
                      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
                    }}>
                      {formatCurrency(userData?.user?.balance || 0)}
                    </div>
                    <p className="text-sm text-green-300/80">Available Balance</p>
                  </div>
                  
                  {userData && userData.user && typeof userData.user.pendingBalance !== 'undefined' && Number(userData.user.pendingBalance) > 0 && (
                    <div className="p-3 rounded-lg mb-3 relative overflow-hidden"
                         style={{
                           background: 'linear-gradient(135deg, rgba(65, 117, 5, 0.3), rgba(22, 78, 99, 0.3))',
                           border: '1px solid rgba(74, 222, 128, 0.2)',
                           boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 4px 8px rgba(0, 0, 0, 0.2)'
                         }}>
                      {/* Ambient glow effect */}
                      <div className="absolute -top-6 -right-6 w-12 h-12 bg-green-500/30 rounded-full blur-xl"></div>
                      <div className="flex items-center relative z-10">
                        <RefreshCw className="h-4 w-4 mr-2 text-green-400 animate-spin" style={{animationDuration: '3s', filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))'}} />
                        <div>
                          <div className="text-sm font-medium text-white" style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)'}}>
                            Pending: {formatCurrency(userData?.user?.pendingBalance || 0)}
                          </div>
                          <p className="text-xs text-green-300/80">Transactions in progress</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="p-3 rounded-lg flex items-center justify-between"
                         style={{
                           background: 'linear-gradient(135deg, rgba(20, 83, 45, 0.8), rgba(0, 0, 0, 0.7))',
                           border: '2px solid rgba(74, 222, 128, 0.3)',
                           boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 0 15px rgba(74, 222, 128, 0.1)',
                           transform: 'translateZ(0)'
                         }}>
                      <div>
                        <p className="text-xs text-green-300/70 mb-1">Deposits</p>
                        <p className="text-sm font-medium text-white" style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)'}}>+₱0.00</p>
                      </div>
                      <ArrowDown className="h-4 w-4 text-green-400" style={{filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4))'}} />
                    </div>
                    
                    <div className="p-3 rounded-lg flex items-center justify-between"
                         style={{
                           background: 'linear-gradient(135deg, rgba(20, 83, 45, 0.8), rgba(0, 0, 0, 0.7))',
                           border: '2px solid rgba(74, 222, 128, 0.15)',
                           boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 0 15px rgba(220, 38, 38, 0.1)',
                           transform: 'translateZ(0)'
                         }}>
                      <div>
                        <p className="text-xs text-green-300/70 mb-1">Withdrawals</p>
                        <p className="text-sm font-medium text-white" style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)'}}>-₱0.00</p>
                      </div>
                      <ArrowUp className="h-4 w-4 text-green-400" style={{filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4))'}} />
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