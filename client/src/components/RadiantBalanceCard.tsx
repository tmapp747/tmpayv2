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
    <div className="rounded-xl overflow-hidden mb-6 border-2 border-emerald-700/30 hover:border-emerald-600/40 transition-all duration-300 backdrop-blur-sm relative transform hover:scale-[1.01]" 
         style={{ 
           background: 'linear-gradient(145deg, rgba(5, 45, 35, 0.9), rgba(4, 50, 40, 0.8))',
           boxShadow: '0 10px 25px rgba(16, 185, 129, 0.15), 0 10px 10px rgba(0, 0, 0, 0.1), 0 0 30px rgba(16, 185, 129, 0.1)'
         }}>
      {/* Enhanced background glow effects */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl"></div>
      <div className="absolute top-10 right-10 w-32 h-32 bg-yellow-400/5 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-20 w-24 h-24 bg-yellow-300/5 rounded-full blur-2xl"></div>
      
      {/* Main Balance Section */}
      <div className="p-6 relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="flex items-center text-lg font-semibold text-emerald-200" style={{textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'}}>
            <Wallet className="h-5 w-5 mr-2 text-yellow-400" style={{filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.5))'}} /> Total Balance
          </h2>
          
          <Button 
            variant="outline" 
            size="sm"
            className="px-3 py-1 rounded-full bg-emerald-800/50 border-emerald-600/30 text-emerald-100 hover:bg-emerald-700/60 hover:text-yellow-300"
            onClick={handleRefresh}
            style={{
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05)'
            }}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''} text-emerald-300`} style={{filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4))'}} /> 
            Refresh
          </Button>
        </div>
        
        <div className="mb-4">
          <div className="text-4xl font-bold tracking-tight text-yellow-300" style={{
            textShadow: '0 0 10px rgba(252, 211, 77, 0.4), 0 2px 4px rgba(0, 0, 0, 0.5)',
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
          }}>
            {isLoading ? (
              <div className="animate-pulse h-10 w-32 bg-emerald-700/40 rounded"></div>
            ) : (
              formatCurrency(totalBalance)
            )}
          </div>
          <div className="text-sm text-emerald-300 font-medium mt-1">
            Available in your wallet
          </div>
        </div>
        
        <div className="flex space-x-4 pt-2">
          {/* Emerald Deposit Button */}
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-1">
            <Button 
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-medium py-2 px-4 rounded-lg text-base transition-all border border-emerald-500/30"
              onClick={handleDeposit}
              style={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 15px rgba(16, 185, 129, 0.15)',
                transform: 'translateY(-1px)',
                textShadow: '0px 1px 2px rgba(0,0,0,0.3)'
              }}
            >
              <Plus className="h-4 w-4 mr-2 text-emerald-200" style={{filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4))'}} /> 
              Deposit
            </Button>
          </motion.div>
          
          {/* Gold Transfer Button */}
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-1">
            <Button 
              className="w-full bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 text-white font-medium py-2 px-4 rounded-lg text-base transition-all border border-yellow-500/30"
              onClick={handleTransfer}
              style={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 15px rgba(245, 158, 11, 0.15)',
                transform: 'translateY(-1px)',
                textShadow: '0px 1px 2px rgba(0,0,0,0.3)'
              }}
            >
              <ArrowRight className="h-4 w-4 mr-2 text-yellow-200" style={{filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4))'}} /> 
              Transfer
            </Button>
          </motion.div>
        </div>
      </div>
      
      {/* Secondary Balances (Available + Pending) with Emerald Theme */}
      <div className="grid grid-cols-2 gap-px bg-emerald-950/40">
        <div className="p-4 bg-gradient-to-br from-emerald-800/90 to-emerald-900/90 relative overflow-hidden"
             style={{
               boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.2)'
             }}>
          {/* Decorative light effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-300/10 to-transparent"></div>
          
          <div className="text-sm text-emerald-300 font-medium mb-1" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>Available for Play</div>
          <div className="text-lg font-semibold text-yellow-300 flex items-center" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            {formatCurrency(numericTotalBalance - numericPendingBalance)}
            <span className="ml-1 text-xs text-emerald-300/70">Ready</span>
          </div>
        </div>
        <div className="p-4 bg-gradient-to-br from-emerald-800/90 to-emerald-900/90 relative overflow-hidden"
             style={{
               boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.2)'
             }}>
          {/* Decorative light effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-300/10 to-transparent"></div>
          
          <div className="text-sm text-emerald-300 font-medium mb-1" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>Pending Deposits</div>
          <div className="text-lg font-semibold text-emerald-100 flex items-center" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            {formatCurrency(numericPendingBalance)}
            <span className="ml-1 text-xs text-emerald-300/70">Processing</span>
          </div>
        </div>
      </div>
      
      {/* Casino Balance Section with Emerald Theme */}
      <div className="bg-emerald-950/90 p-4 relative">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/5 via-yellow-400/5 to-emerald-500/5 z-0"></div>
        
        <div className="flex justify-between items-center mb-2 relative z-10">
          <h3 className="text-md font-medium flex items-center text-emerald-200" style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'}}>
            <Coins className="h-4 w-4 mr-2 text-yellow-300" style={{filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))'}} /> Casino Balance
          </h3>
          
          <div className="flex gap-2">
            {/* Support Message Button */}
            <Button 
              size="sm"
              className="h-8 px-2 py-0 text-xs rounded-lg bg-emerald-800/50 border-emerald-600/30 text-emerald-100 hover:bg-emerald-700/60 hover:text-yellow-300"
              onClick={handleSendMessage}
              style={{
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 0 15px rgba(16, 185, 129, 0.1)',
                transform: 'translateY(-1px)',
                textShadow: '0px 1px 1px rgba(0,0,0,0.15)'
              }}
            >
              <MessageCircle className="h-3.5 w-3.5 mr-1 text-emerald-300" style={{filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4))'}} /> Message Support
            </Button>
            
            {/* Refresh Button */}
            <Button 
              size="sm"
              className="h-8 w-8 p-0 rounded-lg bg-emerald-800/50 border-emerald-600/30 text-emerald-100 hover:bg-emerald-700/60 hover:text-yellow-300"
              onClick={fetchCasinoBalance}
              disabled={isCasinoBalanceLoading}
              style={{
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 0 15px rgba(16, 185, 129, 0.1)',
                transform: 'translateY(-1px)'
              }}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isCasinoBalanceLoading ? 'animate-spin' : ''} text-emerald-300`} style={{filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4))'}} />
            </Button>
          </div>
        </div>
        
        <div className="bg-emerald-800/30 rounded-lg p-3 border-2 border-yellow-600/20 backdrop-blur-sm relative z-10 transition-all duration-300"
             style={{ 
               boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 0 15px rgba(16, 185, 129, 0.1)',
               transform: 'translateZ(3px)'
             }}>
          <div className="flex justify-between items-center">
            <div className="text-yellow-300/90 font-medium" style={{ textShadow: '0.5px 0.5px 1px rgba(0,0,0,0.4)' }}>
              Username: {username}
            </div>
            <div className="text-xs text-emerald-300/70" style={{ textShadow: '0.5px 0.5px 1px rgba(0,0,0,0.2)' }}>
              Last Updated: {lastUpdated}
            </div>
          </div>
          
          <div className="mt-1">
            <span className="text-xl font-bold flex items-end text-yellow-300" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
              {isCasinoBalanceLoading ? (
                <div className="animate-pulse h-6 w-16 bg-emerald-700/40 rounded"></div>
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