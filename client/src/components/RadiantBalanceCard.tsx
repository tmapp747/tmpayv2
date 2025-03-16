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
 * Radiant Balance Card component with vibrant colors and appealing gradients
 * Designed to match the screenshots while enhancing visual appeal
 */
const RadiantBalanceCard = () => {
  interface UserInfoResponse {
    user: User;
  }
  
  const { data, isLoading, refetch } = useQuery<UserInfoResponse>({
    queryKey: ['/api/user/info'],
  });
  
  // State for casino balance
  const [casinoBalance, setCasinoBalance] = useState<number | null>(null);
  const [isCasinoBalanceLoading, setIsCasinoBalanceLoading] = useState(false);
  
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
    <div className="rounded-xl shadow-lg overflow-hidden mb-6 border dark:border-gray-700/30 border-gray-200/70 hover:shadow-xl transition-all duration-300 backdrop-blur-sm relative">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-emerald-500/5 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-emerald-500/10 z-0"></div>
      
      {/* Main Balance Section with Gradient Background */}
      <div className="bg-gradient-to-br dark:from-gray-800/90 dark:to-gray-900/90 from-white/90 to-gray-50/90 p-6 relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="flex items-center text-lg font-semibold dark:text-white text-gray-800">
            <Wallet className="h-5 w-5 mr-2 text-emerald-500" /> Total Balance
          </h2>
          
          <Button 
            variant="outline" 
            size="sm"
            className="px-3 py-1 rounded-full bg-gradient-to-r from-gray-800 to-black text-white hover:from-gray-700 hover:to-gray-900 shadow-md transition-all"
            onClick={handleRefresh}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} /> 
            Refresh
          </Button>
        </div>
        
        <div className="mb-4">
          <div className="text-4xl font-bold tracking-tight dark:text-white text-gray-800">
            {isLoading ? (
              <div className="animate-pulse h-10 w-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
            ) : (
              formatCurrency(totalBalance)
            )}
          </div>
          <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            Available in your wallet
          </div>
        </div>
        
        <div className="flex space-x-4 pt-2">
          {/* Green Deposit Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
            <Button 
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-2 px-4 rounded-lg text-base shadow-md hover:shadow-lg transition-all"
              onClick={handleDeposit}
            >
              <Plus className="h-4 w-4 mr-2" /> 
              Deposit
            </Button>
          </motion.div>
          
          {/* Blue Transfer Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
            <Button 
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg text-base shadow-md hover:shadow-lg transition-all"
              onClick={handleTransfer}
            >
              <ArrowRight className="h-4 w-4 mr-2" /> 
              Transfer
            </Button>
          </motion.div>
        </div>
      </div>
      
      {/* Secondary Balances (Available + Pending) with Gradient Background */}
      <div className="grid grid-cols-2 gap-px bg-gray-500/30">
        <div className="p-3 bg-gradient-to-br from-green-600/90 to-green-700/90 dark:from-green-600/90 dark:to-green-800/90">
          <div className="text-sm text-white font-medium mb-1 opacity-90">Available for Play</div>
          <div className="text-lg font-semibold text-white flex items-center">
            {formatCurrency(numericTotalBalance - numericPendingBalance)}
            <span className="ml-1 text-xs text-white/70">Ready</span>
          </div>
        </div>
        <div className="p-3 bg-gradient-to-br from-blue-600/90 to-blue-700/90 dark:from-blue-600/90 dark:to-blue-800/90">
          <div className="text-sm text-white font-medium mb-1 opacity-90">Pending Deposits</div>
          <div className="text-lg font-semibold text-white flex items-center">
            {formatCurrency(numericPendingBalance)}
            <span className="ml-1 text-xs text-white/70">Processing</span>
          </div>
        </div>
      </div>
      
      {/* Casino Balance Section with Gradient */}
      <div className="bg-gradient-to-br dark:from-gray-800/90 dark:to-gray-900/90 from-white/90 to-gray-50/90 p-4 relative">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-yellow-500/5 to-orange-500/5 dark:from-amber-500/10 dark:via-yellow-500/10 dark:to-orange-500/10 z-0"></div>
        
        <div className="flex justify-between items-center mb-2 relative z-10">
          <h3 className="text-md font-semibold flex items-center dark:text-white text-gray-800">
            <Coins className="h-4 w-4 mr-2 text-yellow-500 drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]" /> Casino Balance
          </h3>
          
          <div className="flex gap-2">
            {/* Support Message Button */}
            <Button 
              size="sm"
              className="h-8 px-2 py-0 text-xs rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-sm"
              onClick={handleSendMessage}
            >
              <MessageCircle className="h-3.5 w-3.5 mr-1" /> Message Support
            </Button>
            
            {/* Refresh Button */}
            <Button 
              size="sm"
              className="h-8 w-8 p-0 rounded-lg bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-sm backdrop-blur-sm"
              onClick={fetchCasinoBalance}
              disabled={isCasinoBalanceLoading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isCasinoBalanceLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        <div className="bg-gradient-to-br dark:from-amber-900/30 dark:to-amber-800/20 from-amber-100/50 to-amber-200/30 rounded-lg p-3 border border-amber-500/20 shadow-inner backdrop-blur-sm relative z-10">
          <div className="flex justify-between items-center">
            <div className="dark:text-amber-200 text-amber-900 font-medium" style={{ textShadow: '0.5px 0.5px 1px rgba(0,0,0,0.5)' }}>Username: {username}</div>
            <div className="text-xs dark:text-amber-300/70 text-amber-700/70" style={{ textShadow: '0.5px 0.5px 1px rgba(0,0,0,0.5)' }}>Last Updated: {lastUpdated}</div>
          </div>
          
          <div className="mt-1">
            <span className="text-xl font-bold flex items-end dark:text-amber-300 text-amber-800" style={{ textShadow: '0.5px 0.5px 1px rgba(0,0,0,0.8)' }}>
              {isCasinoBalanceLoading ? (
                <div className="animate-pulse h-6 w-16 bg-amber-700/30 dark:bg-amber-600/20 rounded"></div>
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

export default RadiantBalanceCard;