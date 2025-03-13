import BalanceCard from "@/components/BalanceCard";
import QuickActions from "@/components/QuickActions";
import RecentTransactions from "@/components/RecentTransactions";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

const Home = () => {
  const [, navigate] = useLocation();
  
  const goToWallet = () => {
    navigate("/wallet");
  };

  return (
    <div>
      <BalanceCard />
      
      <div className="mb-6">
        <h2 className="text-lg font-medium text-white mb-4">Quick Actions</h2>
        <QuickActions />
      </div>
      
      <div className="bg-primary rounded-xl shadow-lg overflow-hidden mb-6 border border-secondary/30">
        <div className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg text-white font-medium">Make a Deposit</h2>
            <div className="bg-accent/20 text-accent px-3 py-1 rounded-full text-sm font-medium">
              Instant
            </div>
          </div>
          
          <p className="text-gray-300 mb-6">
            Deposit funds to your 747 Casino wallet and start playing your favorite games. Multiple payment methods available.
          </p>
          
          <Button 
            className="bg-secondary hover:bg-secondary/90 text-white font-bold py-3 px-6 rounded-lg shadow-sm"
            onClick={goToWallet}
          >
            Deposit Now
          </Button>
        </div>
      </div>
      
      <RecentTransactions />
    </div>
  );
};

export default Home;
