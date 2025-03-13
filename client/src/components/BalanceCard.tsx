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
    <div className="bg-primary rounded-xl shadow-lg overflow-hidden mb-6 border border-secondary/30">
      <div className="bg-gradient-to-r from-primary to-dark p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg text-gray-300 font-medium">Total Balance</h2>
          <Button 
            variant="outline" 
            size="sm"
            className="text-sm px-3 py-1 rounded-full bg-secondary/20 text-secondary font-semibold border-secondary/30 hover:bg-secondary/30"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
        <div className="flex items-end space-x-2 mb-4">
          <h1 className="text-3xl font-bold text-white">
            {isLoading ? "Loading..." : formatCurrency(data?.user?.balance || 0)}
          </h1>
          <span className="text-accent mb-1 text-sm">
            <ArrowUp className="h-3 w-3 inline" /> +₱850.00
          </span>
        </div>
        <div className="flex space-x-4 pt-4">
          <Button 
            className="flex-1 bg-gradient-to-br from-secondary to-secondary/80 text-white font-bold py-3 px-4 rounded-lg shadow-sm hover:from-secondary/90 hover:to-secondary/70 transition duration-300"
            onClick={handleDeposit}
          >
            <Plus className="h-5 w-5 mr-2" /> Deposit
          </Button>
          <Button 
            variant="outline"
            className="flex-1 bg-primary border border-secondary text-white font-bold py-3 px-4 rounded-lg shadow-sm hover:bg-primary/80 transition duration-300"
          >
            <ArrowRight className="h-5 w-5 mr-2" /> Transfer
          </Button>
        </div>
      </div>
      <div className="bg-dark/50 p-4 border-t border-secondary/30">
        <div className="flex justify-between text-sm">
          <div className="text-gray-300">
            <span>Available for Play:</span>
            <span className="text-white font-medium ml-2">
              {isLoading ? "Loading..." : formatCurrency(data?.user?.balance || 0)}
            </span>
          </div>
          <div className="text-gray-300">
            <span>Pending Deposits:</span>
            <span className="text-white font-medium ml-2">
              {isLoading ? "Loading..." : formatCurrency(data?.user?.pendingBalance || 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
