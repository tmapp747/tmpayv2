import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { ArrowUp, Plus, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { userApi } from "@/lib/api";
import { useLocation } from "wouter";

const BalanceCard = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/user/info'],
  });
  
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const handleRefresh = async () => {
    try {
      await refetch();
      toast({
        title: "Balance refreshed",
        description: "Your balance has been updated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error refreshing",
        description: "There was an error refreshing your balance.",
      });
    }
  };
  
  const handleDeposit = () => {
    navigate("/wallet");
  };

  return (
    <div className="bg-primary rounded-xl shadow-lg overflow-hidden mb-6 border border-secondary/30 hover:shadow-xl hover:shadow-secondary/5 transition-all duration-300 transform hover:-translate-y-1">
      <div className="bg-gradient-to-br from-primary via-primary to-dark p-6 relative">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-50 rounded-t-xl"></div>
        
        <div className="relative flex justify-between items-center mb-4">
          <h2 className="text-lg text-white font-medium tracking-wide">Total Balance</h2>
          <Button 
            variant="outline" 
            size="sm"
            className="text-sm px-3 py-1 rounded-full bg-secondary/20 text-secondary font-semibold border-secondary/30 hover:bg-secondary/40 hover:scale-105 transition-all"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : 'group-hover:animate-spin'}`} /> 
            Refresh
          </Button>
        </div>
        
        <div className="relative flex items-end space-x-2 mb-4">
          <h1 className="text-4xl font-bold text-white tracking-tight" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            {isLoading ? (
              <div className="animate-shimmer rounded h-10 w-36"></div>
            ) : (
              <div className="animate-slideUp">{formatCurrency(data?.user?.balance || 0)}</div>
            )}
          </h1>
          <span className="text-accent mb-1 text-sm bg-accent/10 px-2 py-1 rounded-full animate-float">
            <ArrowUp className="h-3 w-3 inline mr-1" /> +₱850.00
          </span>
        </div>
        
        <div className="relative flex space-x-4 pt-4">
          <Button 
            className="flex-1 bg-gradient-to-br from-secondary to-secondary/80 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-xl hover:from-secondary hover:to-secondary/90 transition-all duration-300 transform hover:scale-[1.02] active:scale-95"
            onClick={handleDeposit}
          >
            <Plus className="h-5 w-5 mr-2 transition-transform group-hover:rotate-180 duration-300" /> 
            Deposit
          </Button>
          <Button 
            variant="outline"
            className="flex-1 bg-primary/80 backdrop-blur-sm border border-secondary/50 text-white font-bold py-3 px-4 rounded-xl shadow hover:shadow-lg hover:bg-primary/50 hover:border-secondary transition-all duration-300 transform hover:scale-[1.02] active:scale-95"
          >
            <ArrowRight className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform" /> 
            Transfer
          </Button>
        </div>
      </div>
      
      <div className="bg-dark/50 backdrop-blur-sm p-5 border-t border-secondary/30">
        <div className="flex flex-wrap md:flex-nowrap justify-between text-sm gap-4">
          <div className="bg-dark/30 rounded-lg p-3 flex-1 hover:bg-dark/50 transition-colors duration-200">
            <span className="text-gray-400 block mb-1">Available for Play</span>
            <span className="text-white font-medium text-lg">
              {isLoading ? (
                <div className="h-6 w-24 animate-shimmer rounded"></div>
              ) : (
                <span className="animate-slideRight">{formatCurrency(data?.user?.balance || 0)}</span>
              )}
            </span>
          </div>
          <div className="bg-dark/30 rounded-lg p-3 flex-1 hover:bg-dark/50 transition-colors duration-200">
            <span className="text-gray-400 block mb-1">Pending Deposits</span>
            <span className="text-white font-medium text-lg">
              {isLoading ? (
                <div className="h-6 w-24 animate-shimmer rounded"></div>
              ) : (
                <span className="animate-slideLeft">{formatCurrency(data?.user?.pendingBalance || 0)}</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
