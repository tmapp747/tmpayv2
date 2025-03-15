import { useState } from "react";
import BalanceCard from "@/components/BalanceCard";
import QuickActions from "@/components/QuickActions";
import RecentTransactions from "@/components/RecentTransactions";
import CasinoApiTester from "@/components/CasinoApiTester";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

const Home = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showApiTester, setShowApiTester] = useState(false);
  
  const goToWallet = () => {
    navigate("/wallet");
  };

  const toggleApiTester = () => {
    setShowApiTester(prev => !prev);
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
      
      {/* API Testing Section - For Development Only */}
      <div className="mt-6">
        <Card className="bg-primary rounded-xl shadow-lg overflow-hidden mb-2 border border-secondary/30">
          <div className="p-4">
            <Button 
              variant="outline" 
              className="w-full border-dashed"
              onClick={toggleApiTester}
            >
              {showApiTester ? "Hide API Testing Tools" : "Show API Testing Tools"}
            </Button>
          </div>
        </Card>
        
        {showApiTester && (
          <div className="my-6">
            <CasinoApiTester />
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
