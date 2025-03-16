import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { ArrowUp, Plus, ArrowRight, RefreshCw, Coins, Wallet, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { userApi, casinoApi } from "@/lib/api";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User } from "@/lib/types";

/**
 * Simplified Balance Card component that closely matches the screenshots
 * with support for both light and dark themes
 */
const SimplifiedBalanceCard = () => {
  interface UserInfoResponse {
    user: User;
  }
  
  interface CasinoBalanceResponse {
    success: boolean;
    balance: number;
    currency: string;
  }
  
  const { data, isLoading, refetch } = useQuery<UserInfoResponse>({
    queryKey: ['/api/user/info'],
  });
  
  // State for casino balance
  const [casinoBalance, setCasinoBalance] = useState<number | null>(null);
  const [isCasinoBalanceLoading, setIsCasinoBalanceLoading] = useState(false);
  const [previousBalance, setPreviousBalance] = useState(0);
  
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Fetch casino balance
  const fetchCasinoBalance = async () => {
    if (!data?.user?.casinoClientId || !data?.user?.casinoUsername) return;
    
    setIsCasinoBalanceLoading(true);
    try {
      const balanceResponse = await casinoApi.getRealTimeBalance({
        casinoClientId: data.user.casinoClientId,
        casinoUsername: data.user.casinoUsername
      });
      
      if (balanceResponse.success && typeof balanceResponse.balance === 'number') {
        setCasinoBalance(balanceResponse.balance);
      }
    } catch (error) {
      console.error('Error fetching casino balance:', error);
    } finally {
      setIsCasinoBalanceLoading(false);
    }
  };
  
  // Fetch casino balance on initial load
  useEffect(() => {
    if (data?.user?.casinoClientId && data?.user?.casinoUsername) {
      fetchCasinoBalance();
    }
  }, [data?.user?.casinoClientId, data?.user?.casinoUsername]);
  
  // Refresh all balances
  const handleRefresh = async () => {
    try {
      // Refresh local wallet balance
      await refetch();
      
      // Refresh casino balance if available
      if (data?.user?.casinoClientId && data?.user?.casinoUsername) {
        await fetchCasinoBalance();
      }
      
      toast({
        title: "Balances refreshed",
        description: "Your wallet and casino balances have been updated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error refreshing",
        description: "There was an error refreshing your balances.",
      });
    }
  };
  
  const handleDeposit = () => {
    navigate("/wallet");
  };

  const handleTransfer = () => {
    navigate("/wallet/transfer");
  };
  
  // Send a message to support
  const handleSendMessage = async () => {
    if (!data?.user?.casinoUsername) {
      toast({
        variant: "destructive",
        title: "Cannot send message",
        description: "Your casino account is not properly linked.",
      });
      return;
    }
    
    try {
      await casinoApi.sendMessage({
        username: data.user.casinoUsername,
        subject: "Support Request",
        message: "Hello, I need assistance with my account."
      });
      
      toast({
        title: "Message sent",
        description: "Your message has been sent to customer support.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Message failed",
        description: "Failed to send message. Please try again later.",
      });
    }
  };

  // Calculate display values
  const totalBalance = data?.user?.balance || 0;
  const pendingBalance = data?.user?.pendingBalance || 0;
  const username = data?.user?.casinoUsername || 'Unknown';
  const lastUpdated = new Date().toLocaleTimeString();
  
  // Convert balance to number if it's a string
  const numericTotalBalance = typeof totalBalance === 'string' ? parseFloat(totalBalance) : totalBalance;
  const numericPendingBalance = typeof pendingBalance === 'string' ? parseFloat(pendingBalance) : pendingBalance;
  
  return (
    <div className="rounded-xl overflow-hidden mb-6 border-2 dark:border-gray-700/80 border-gray-200/90 transform hover:scale-[1.01] transition-all duration-300" 
         style={{ 
           boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 15px -6px rgba(0, 0, 0, 0.1), 0 -2px 5px rgba(255, 255, 255, 0.05) inset, 0 2px 3px rgba(0, 0, 0, 0.2)',
           transform: 'translateZ(0)'
         }}>
      {/* Main Balance Section */}
      <div className="p-6 relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="flex items-center text-lg font-medium">
            <Wallet className="h-5 w-5 mr-2" /> Total Balance
          </h2>
          
          <Button 
            variant="outline" 
            size="sm"
            className="px-3 py-1 rounded-full dark:bg-black dark:text-white bg-slate-800 text-white hover:bg-black/80"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} /> 
            Refresh
          </Button>
        </div>
        
        <div className="mb-4">
          <div className="text-4xl font-bold tracking-tight">
            {isLoading ? (
              <div className="animate-pulse h-10 w-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
            ) : (
              formatCurrency(totalBalance)
            )}
          </div>
        </div>
        
        <div className="flex space-x-4 pt-2">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button 
              className="flex-1 dark:bg-black bg-slate-800 text-white font-medium py-2 px-4 rounded-lg w-full text-base transition-all"
              onClick={handleDeposit}
              style={{
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                transform: 'translateY(-1px)',
                textShadow: '0px 1px 2px rgba(0,0,0,0.3)'
              }}
            >
              <Plus className="h-4 w-4 mr-2 drop-shadow-sm" /> 
              Deposit
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button 
              variant="outline"
              className="flex-1 dark:bg-black/80 bg-slate-700 text-white font-medium py-2 px-4 rounded-lg w-full text-base transition-all"
              onClick={handleTransfer}
              style={{
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                transform: 'translateY(-1px)',
                textShadow: '0px 1px 2px rgba(0,0,0,0.3)'
              }}
            >
              <ArrowRight className="h-4 w-4 mr-2 drop-shadow-sm" /> 
              Transfer
            </Button>
          </motion.div>
        </div>
      </div>
      
      {/* Secondary Balances (Available + Pending) */}
      <div className="grid grid-cols-2 gap-1 dark:bg-gray-600 bg-gray-300">
        <div className="p-4 relative overflow-hidden"
             style={{
               boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.15)'
             }}>
          {/* Decorative light effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-white/20 to-transparent"></div>
          
          <div className="text-sm text-gray-100 font-medium mb-1" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>Available for Play</div>
          <div className="text-lg font-semibold text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
            {formatCurrency(numericTotalBalance - numericPendingBalance)}
          </div>
        </div>
        <div className="p-4 relative overflow-hidden"
             style={{
               boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.15)'
             }}>
          {/* Decorative light effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-white/20 to-transparent"></div>
          
          <div className="text-sm text-gray-100 font-medium mb-1" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>Pending Deposits</div>
          <div className="text-lg font-semibold text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
            {formatCurrency(numericPendingBalance)}
          </div>
        </div>
      </div>
      
      {/* Casino Balance Section */}
      <div className="dark:bg-gray-800 bg-gray-200 p-4 relative">
        {/* Background subtle pattern */}
        <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/5 via-amber-500/5 to-orange-500/5 dark:from-yellow-500/10 dark:via-amber-500/10 dark:to-orange-500/10 z-0"></div>
        
        <div className="flex justify-between items-center mb-2 relative z-10">
          <h3 className="text-md font-medium flex items-center">
            <Coins className="h-4 w-4 mr-2 text-yellow-400 drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]" /> Casino Balance
          </h3>
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              size="sm"
              className="h-8 px-2 py-0 text-xs rounded-lg dark:bg-gray-700 bg-gray-300 transition-all"
              onClick={handleSendMessage}
              style={{
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15), 0 1px 2px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                transform: 'translateY(-1px)',
                textShadow: '0px 1px 1px rgba(0,0,0,0.15)'
              }}
            >
              <MessageCircle className="h-3.5 w-3.5 mr-1 drop-shadow-sm" /> Message Support
            </Button>
            
            <Button 
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg dark:bg-gray-700 bg-gray-300 transition-all"
              onClick={fetchCasinoBalance}
              disabled={isCasinoBalanceLoading}
              style={{
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15), 0 1px 2px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                transform: 'translateY(-1px)'
              }}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isCasinoBalanceLoading ? 'animate-spin' : ''} drop-shadow-sm`} />
            </Button>
          </div>
        </div>
        
        <div className="bg-gray-700/30 rounded-lg p-3 border-2 dark:border-amber-700/20 border-amber-500/20 backdrop-blur-sm relative z-10 transition-all duration-300"
             style={{ 
               boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.05), inset 0 -2px 4px rgba(0, 0, 0, 0.1), 0 2px 3px rgba(0, 0, 0, 0.1)',
               transform: 'translateZ(3px)'
             }}>
          <div className="flex justify-between items-center">
            <div className="dark:text-amber-200/90 text-amber-900/90 font-medium" style={{ textShadow: '0.5px 0.5px 1px rgba(0,0,0,0.4)' }}>
              Username: {username}
            </div>
            <div className="text-xs dark:text-amber-300/60 text-amber-700/60" style={{ textShadow: '0.5px 0.5px 1px rgba(0,0,0,0.2)' }}>
              Last Updated: {lastUpdated}
            </div>
          </div>
          
          <div className="mt-1">
            <span className="text-xl font-bold flex items-end dark:text-amber-300 text-amber-800" style={{ textShadow: '0.5px 0.5px 1px rgba(0,0,0,0.6)' }}>
              {isCasinoBalanceLoading ? (
                <div className="animate-pulse h-6 w-16 bg-gray-500 rounded"></div>
              ) : (
                formatCurrency(casinoBalance || 0)
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedBalanceCard;