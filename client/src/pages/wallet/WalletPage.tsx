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
import { Briefcase, Wallet, ArrowDown, ArrowUp, RefreshCw, ChevronDown, AlertCircle, ShieldAlert } from "lucide-react";
import NewBalanceCard from "@/components/NewBalanceCard";

function WalletPage() {
  const [activeTab, setActiveTab] = useState("balance");
  const { toast } = useToast();
  
  // Get user info
  const { data: userData, isLoading: isUserLoading, error: userError } = useQuery<{ success: boolean, user: User }>({
    queryKey: ['/api/user/info'],
  });
  
  // Get balance for 3D animation effect
  const animatedValue = {
    balance: userData?.user?.balance || 0,
    pendingBalance: userData?.user?.pendingBalance || 0
  };
  
  // Handle loading and error states
  if (userError) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="rounded-xl shadow-lg overflow-hidden mb-6 border border-emerald-700/40 relative"
          style={{
            background: 'linear-gradient(145deg, rgba(5, 45, 35, 0.9), rgba(4, 50, 40, 0.8))',
            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.15), 0 10px 10px rgba(0, 0, 0, 0.1), 0 0 30px rgba(16, 185, 129, 0.1)'
          }}
        >
          <div className="p-6 relative z-10">
            <div className="text-center text-emerald-200 py-8 flex flex-col items-center justify-center">
              <div className="mb-4 bg-emerald-800/50 rounded-full h-12 w-12 flex items-center justify-center">
                <ShieldAlert className="h-6 w-6 text-yellow-300" />
              </div>
              <p>Error loading wallet data. Please try again later.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold flex items-center mb-2 text-emerald-50" style={{textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'}}>
          <Briefcase className="h-8 w-8 mr-3 text-yellow-400" style={{filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.3))'}} />
          My Wallet
        </h1>
        <p className="text-emerald-300/80">Manage your funds, make deposits, and track your transactions</p>
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Balance and Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Use the NewBalanceCard component */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="w-full"
          >
            <NewBalanceCard className="w-full mx-0" />
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
              <TabsList className="mb-6 p-1 border-2 border-emerald-700/30 rounded-lg"
                       style={{
                         background: 'linear-gradient(145deg, rgba(5, 45, 35, 0.9), rgba(4, 50, 40, 0.8))',
                         boxShadow: '0 10px 25px rgba(16, 185, 129, 0.15), 0 10px 10px rgba(0, 0, 0, 0.1), 0 0 30px rgba(16, 185, 129, 0.1)',
                         transform: 'translateZ(0)'
                       }}>
                <TabsTrigger 
                  value="balance" 
                  className="rounded-md text-emerald-200 data-[state=active]:bg-emerald-900/50 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-emerald-700/40 data-[state=active]:text-yellow-300"
                >
                  Recent Activity
                </TabsTrigger>
                <TabsTrigger 
                  value="transactions" 
                  className="rounded-md text-emerald-200 data-[state=active]:bg-emerald-900/50 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-emerald-700/40 data-[state=active]:text-yellow-300"
                >
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