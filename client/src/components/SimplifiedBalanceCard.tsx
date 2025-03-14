import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { RefreshCw, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { userApi, casinoApi } from "@/lib/api";
import { useLocation } from "wouter";
import { useState } from "react";
import { User } from "@/lib/types";

// Main BalanceCard component
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
      
      if (balanceResponse.success) {
        // Convert string balance to number if needed
        const numericBalance = typeof balanceResponse.balance === 'string' 
          ? parseFloat(balanceResponse.balance) 
          : balanceResponse.balance;
        setCasinoBalance(numericBalance);
      }
    } catch (error) {
      console.error("Error fetching casino balance:", error);
    } finally {
      setIsCasinoBalanceLoading(false);
    }
  };
  
  // Handler for refresh button click
  const handleRefresh = async () => {
    try {
      await refetch();
      await fetchCasinoBalance();
      toast({
        title: "Balance refreshed",
        description: "Your balances have been updated.",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Could not update your balances. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="bg-dark-DEFAULT rounded-xl shadow-lg overflow-hidden mb-6 border border-gray-800">
      <div className="p-6 relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg text-white font-medium tracking-wide flex items-center">
            <Wallet className="h-5 w-5 mr-2 text-lime-400" /> Total Balance
          </h2>
          
          <Button
            variant="outline" 
            size="sm"
            className="text-sm px-3 py-1 rounded-full bg-dark-darker text-lime-400 font-semibold border-lime-500/30"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} /> 
            Refresh
          </Button>
        </div>
        
        <div className="flex items-end space-x-2 mb-4">
          <div className="text-4xl font-bold text-white tracking-tight">
            {isLoading ? (
              <div className="animate-shimmer rounded h-10 w-36"></div>
            ) : (
              formatCurrency(data?.user?.balance || 0)
            )}
          </div>
        </div>
        
        {/* User account details */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-dark-darker p-3 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Wallet ID</div>
            <div className="text-sm text-white font-medium truncate">{data?.user?.id || '—'}</div>
          </div>
          
          <div className="bg-dark-darker p-3 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Casino ID</div>
            <div className="text-sm text-white font-medium truncate">{data?.user?.casinoClientId || '—'}</div>
          </div>
        </div>
      </div>
      
      {/* Casino Balance Section - Only for users with casino info */}
      {data?.user?.casinoUsername && (
        <div className="bg-dark-navy p-4 border-t border-gray-800">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-gray-300">Casino Balance</div>
            <div className="text-lg font-semibold text-lime-400">
              {isCasinoBalanceLoading ? (
                <div className="animate-shimmer h-6 w-20"></div>
              ) : (
                formatCurrency(casinoBalance || 0)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimplifiedBalanceCard;