import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Wallet, RefreshCw, TrendingUp, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";

interface User {
  id: number;
  username: string;
  balance: string | number;
  pendingBalance: string | number;
  casinoBalance?: string | number;
  casinoClientId?: number;
  casinoUsername?: string;
}

const PurpleBalanceCard = () => {
  const [isRefreshingCasino, setIsRefreshingCasino] = useState(false);
  const [animateAmount, setAnimateAmount] = useState(false);
  
  const { data, isLoading, error } = useQuery<{ user: User }>({
    queryKey: ['/api/user/info'],
  });
  
  const { data: casinoBalanceData, refetch } = useQuery<{ success: boolean; balance: number }>({
    queryKey: ['/api/casino/balance-realtime'],
    enabled: data?.user && !!data.user.casinoClientId,
  });
  
  const handleRefreshCasinoBalance = async () => {
    setIsRefreshingCasino(true);
    await refetch();
    setTimeout(() => setIsRefreshingCasino(false), 800);
  };
  
  useEffect(() => {
    setAnimateAmount(true);
    const timeout = setTimeout(() => setAnimateAmount(false), 1000);
    return () => clearTimeout(timeout);
  }, [data?.user?.balance]);
  
  if (isLoading) {
    return (
      <div className="rounded-2xl border-2 border-purple-800/20 p-5 relative overflow-hidden"
           style={{
             background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.8), rgba(112, 26, 117, 0.9))',
             boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3), 0 5px 15px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
             transform: 'translateZ(0)'
           }}>
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 -left-24 w-48 h-48 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <Skeleton className="h-8 w-32 mb-6 bg-purple-300/20" />
        <Skeleton className="h-12 w-48 mb-3 bg-purple-300/20" />
        <Skeleton className="h-4 w-24 mb-6 bg-purple-300/20" />
        <div className="flex gap-4">
          <Skeleton className="h-20 w-1/2 bg-purple-300/20" />
          <Skeleton className="h-20 w-1/2 bg-purple-300/20" />
        </div>
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className="rounded-2xl border-2 border-purple-800/20 p-5 bg-gradient-to-br from-purple-900/80 to-fuchsia-900/70">
        <p className="text-red-300">Error loading balance</p>
      </div>
    );
  }
  
  const { user } = data;
  const casinoBalance = casinoBalanceData?.balance || user.casinoBalance || 0;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border-2 border-purple-800/20 p-5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.8), rgba(112, 26, 117, 0.9))',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3), 0 5px 15px rgba(0, 0, 0, 0.2), 0 0 40px rgba(192, 132, 252, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
        transform: 'translateZ(0)'
      }}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 via-purple-400/5 to-purple-800/10 opacity-80 pointer-events-none"></div>
      
      {/* Extra radiant effect */}
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <Wallet className="h-5 w-5 mr-2 text-fuchsia-300" style={{filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.3))'}} />
            <h3 className="text-fuchsia-100 font-medium" style={{textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'}}>
              Wallet Balance
            </h3>
          </div>
          <div className="flex">
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 px-2 rounded-full text-fuchsia-300 hover:text-white hover:bg-purple-700/50"
              onClick={handleRefreshCasinoBalance}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingCasino ? 'animate-spin' : ''}`} 
                         style={{filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4))'}} />
            </Button>
          </div>
        </div>
        
        <div className="mb-5">
          <motion.div 
            animate={{ scale: animateAmount ? [1, 1.05, 1] : 1 }}
            transition={{ duration: 0.4 }}
            className="text-3xl font-bold text-white flex items-center"
            style={{
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
              filter: 'drop-shadow(0 0 5px rgba(217, 70, 239, 0.5))'
            }}
          >
            {formatCurrency(user.balance)}
          </motion.div>
          {Number(user.pendingBalance) > 0 && (
            <p className="text-xs text-fuchsia-300/80 mt-1">
              <span className="text-fuchsia-200">+ {formatCurrency(user.pendingBalance)}</span> pending
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-gradient-to-br from-purple-800/70 to-fuchsia-900/60 p-3 border border-purple-700/40"
               style={{boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 4px 10px rgba(0, 0, 0, 0.2)'}}>
            <div className="flex justify-between items-center mb-1.5">
              <p className="text-xs text-fuchsia-300/80" style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'}}>
                Casino Balance
              </p>
              <Coins className="h-3.5 w-3.5 text-fuchsia-400" 
                     style={{filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4))'}} />
            </div>
            <p className="text-lg font-semibold text-white" style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'}}>
              {formatCurrency(casinoBalance)}
            </p>
          </div>
          
          <div className="rounded-xl bg-gradient-to-br from-purple-800/70 to-fuchsia-900/60 p-3 border border-purple-700/40"
               style={{boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 4px 10px rgba(0, 0, 0, 0.2)'}}>
            <div className="flex justify-between items-center mb-1.5">
              <p className="text-xs text-fuchsia-300/80" style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'}}>
                Total Value
              </p>
              <TrendingUp className="h-3.5 w-3.5 text-fuchsia-400" 
                          style={{filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4))'}} />
            </div>
            <p className="text-lg font-semibold text-white" style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'}}>
              {formatCurrency(Number(user.balance) + Number(casinoBalance))}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PurpleBalanceCard;