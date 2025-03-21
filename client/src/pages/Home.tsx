import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import RadiantBalanceCard from "@/components/RadiantBalanceCard";
import QuickActions from "@/components/QuickActions";
import RecentTransactions from "@/components/RecentTransactions";
import CasinoApiTester from "@/components/CasinoApiTester";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import { formatCurrency, formatDate } from "@/lib/utils";
import { emeraldTheme } from "@/lib/emerald-theme";
import { 
  EmeraldCard, 
  EmeraldButton, 
  EmeraldTabs, 
  EmeraldFeatureHighlight, 
  EmeraldPanel 
} from "@/lib/theme-utils";

// Icons
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpDown, 
  Wallet, 
  Calendar, 
  CircleDashed,
  CreditCard,
  Coins,
  AlertCircle,
  Bell,
  ArrowUpRight,
  RefreshCw,
  ChevronRight,
  BarChart3,
  Clock,
  DollarSign,
  Check,
  X,
  LineChart
} from "lucide-react";

// Type for market trend data
interface MarketTrend {
  name: string;
  change: number;
  value: string;
  trend: "up" | "down" | "neutral";
}

// Dashboard component with enhanced visuals and functionality
const Home = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showApiTester, setShowApiTester] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showNotification, setShowNotification] = useState(false);
  
  // Use React Query to fetch user data
  const { data: userData, isLoading: isUserLoading } = useQuery<{ user: { 
    username: string;
    balance: number | string;
    pendingBalance: number | string;
    casinoBalance?: number | string;
    isVip: boolean;
    casinoUsername?: string;
  } }>({
    queryKey: ['/api/user/info'],
  });
  
  // Recent transaction data
  const { data: transactionsData, isLoading: isTransactionsLoading } = useQuery<{ 
    transactions: Array<{
      id: number;
      type: string;
      amount: string | number;
      status: string;
      createdAt: string | Date;
    }>
  }>({
    queryKey: ['/api/transactions'],
  });
  
  // Get current date for greeting
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good Morning" : currentHour < 18 ? "Good Afternoon" : "Good Evening";
  
  // Placeholder market trends data - would be fetched from an API in production
  const marketTrends: MarketTrend[] = [
    { name: "PHP", change: 0.8, value: "₱54.20", trend: "up" },
    { name: "USDT", change: -0.2, value: "$1.00", trend: "down" },
    { name: "PHPT", change: 0.0, value: "₱56.05", trend: "neutral" },
  ];
  
  // Navigation handlers
  const goToWallet = () => navigate("/wallet");
  const goToHistory = () => navigate("/history");
  const toggleApiTester = () => setShowApiTester(prev => !prev);
  
  // Show welcome notification after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNotification(true);
      // Auto-hide after 6 seconds
      setTimeout(() => setShowNotification(false), 6000);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Animation variants for cards and containers
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };
  
  return (
    <div className="pb-10">
      {/* Welcome greeting header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold mb-1">
          <span style={{ textShadow: '0.5px 0.5px 1px black, -0.5px -0.5px 1px black, 0.5px -0.5px 1px black, -0.5px 0.5px 1px black' }} className="text-secondary">{greeting}</span>, <span className="text-secondary" style={{ textShadow: '0.5px 0.5px 1px black, -0.5px -0.5px 1px black, 0.5px -0.5px 1px black, -0.5px 0.5px 1px black' }}>{user?.username || "User"}</span>
        </h1>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </motion.div>
      
      {/* Notification toast */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: "spring", damping: 20 }}
            className="relative mb-6 p-4 bg-primary/20 backdrop-blur-sm border border-primary/20 rounded-lg shadow-lg"
          >
            <div className="flex items-start">
              <Bell className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">Welcome to your enhanced dashboard!</h3>
                <p className="text-sm text-muted-foreground">
                  Check out the new features and improved design. Your financial information is now more accessible and easier to understand.
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-full" 
                onClick={() => setShowNotification(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main dashboard content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Radiant Balance card with vibrant colors */}
        <motion.div variants={itemVariants} className="mb-6">
          <RadiantBalanceCard />
        </motion.div>
        
        {/* Quick Actions section */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold"><span className="text-secondary" style={{ textShadow: '0.5px 0.5px 1px black, -0.5px -0.5px 1px black, 0.5px -0.5px 1px black, -0.5px 0.5px 1px black' }}>Quick Actions</span></h2>
            <Button variant="ghost" size="sm" onClick={goToWallet} className="text-primary text-sm">
              See all <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <QuickActions />
        </motion.div>
        
        {/* Dashboard tabs for different views */}
        <motion.div variants={itemVariants}>
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="mb-8"
          >
            <TabsList className="mb-4 bg-emerald-900/60 border border-emerald-700/40 p-1 backdrop-blur-sm shadow-lg">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-1.5 data-[state=active]:bg-emerald-700/40 data-[state=active]:text-yellow-300 data-[state=active]:shadow-md"
              >
                <Wallet className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="activity"
                className="flex items-center gap-1.5 data-[state=active]:bg-emerald-700/40 data-[state=active]:text-yellow-300 data-[state=active]:shadow-md"
              >
                <BarChart3 className="h-4 w-4" />
                Activity
              </TabsTrigger>
              <TabsTrigger 
                value="market"
                className="flex items-center gap-1.5 data-[state=active]:bg-emerald-700/40 data-[state=active]:text-yellow-300 data-[state=active]:shadow-md"
              >
                <ArrowUpDown className="h-4 w-4" />
                Market
              </TabsTrigger>
            </TabsList>
            
            {/* Overview tab content */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Account summary card with emerald theme */}
                <EmeraldCard title="Account Summary" headerClassName="border-emerald-700/40">
                  <dl className="space-y-4">
                    <div className="flex justify-between items-center">
                      <dt className="text-sm text-emerald-200">Wallet Balance</dt>
                      <dd className="font-semibold text-yellow-300 text-shadow-sm">{formatCurrency(userData?.user?.balance || 0)}</dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-sm text-emerald-200">Pending Balance</dt>
                      <dd className="font-semibold text-yellow-300 text-shadow-sm">{formatCurrency(userData?.user?.pendingBalance || 0)}</dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-sm text-emerald-200">Casino Balance</dt>
                      <dd className="font-semibold text-yellow-300 text-shadow-sm">
                        {isUserLoading ? 
                          <CircleDashed className="h-4 w-4 animate-spin" /> : 
                          formatCurrency(userData?.user?.casinoBalance || 0)
                        }
                      </dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-sm text-emerald-200">Account Status</dt>
                      <dd className="inline-flex items-center bg-emerald-600/30 border border-emerald-500/30 text-emerald-100 px-2 py-1 rounded-full text-xs">
                        <Check className="h-3 w-3 mr-1 text-yellow-300" /> Active
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4">
                    <EmeraldButton
                      icon={<DollarSign className="h-4 w-4" />}
                      onClick={goToWallet}
                      className="w-full text-sm"
                    >
                      Manage Funds
                    </EmeraldButton>
                  </div>
                </EmeraldCard>
                
                {/* Deposit promo card */}
                <EmeraldCard 
                  title="Instant Deposits" 
                  className="backdrop-blur-md relative overflow-hidden"
                  headerClassName="border-yellow-500/20"
                >
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl"></div>
                  <div className="absolute top-20 left-10 w-24 h-24 bg-yellow-400/10 rounded-full blur-2xl"></div>
                  
                  <p className="text-sm text-emerald-200 mb-4">Fund your account quickly and safely</p>
                  
                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-yellow-300">
                        <Check className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-emerald-100">Secure Payments</h4>
                        <p className="text-xs text-emerald-300/80">Using industry-standard encryption</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-yellow-300">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-emerald-100">Instant Processing</h4>
                        <p className="text-xs text-emerald-300/80">Funds available within minutes</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <EmeraldButton 
                      variant="yellow"
                      onClick={goToWallet}
                      className="w-full"
                    >
                      Deposit Now
                    </EmeraldButton>
                  </div>
                </EmeraldCard>
              </div>
              
              {/* Recent Transactions Section */}
              <RecentTransactions />
            </TabsContent>
            
            {/* Activity tab content with emerald theme */}
            <TabsContent value="activity">
              <EmeraldCard title="Transaction Activity" headerClassName="border-emerald-700/40">
                <p className="text-sm text-emerald-200 mb-6">Your recent financial activity and patterns</p>
                
                <div className="space-y-8">
                  {/* Activity metrics with emerald styling */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-emerald-900/40 border border-emerald-700/40 rounded-lg p-3 transition-all duration-300 hover:border-yellow-500/30 hover:bg-emerald-800/50">
                      <div className="text-xs text-emerald-300 mb-1">Total Transactions</div>
                      <div className="text-2xl font-semibold text-yellow-300 text-shadow-sm">
                        {isTransactionsLoading ? 
                          <CircleDashed className="h-4 w-4 animate-spin" /> : 
                          transactionsData?.transactions?.length || 0
                        }
                      </div>
                    </div>
                    
                    <div className="bg-emerald-900/40 border border-emerald-700/40 rounded-lg p-3 transition-all duration-300 hover:border-yellow-500/30 hover:bg-emerald-800/50">
                      <div className="text-xs text-emerald-300 mb-1">Monthly Deposits</div>
                      <div className="text-2xl font-semibold text-yellow-300 text-shadow-sm">
                        {isTransactionsLoading ? 
                          <CircleDashed className="h-4 w-4 animate-spin" /> : 
                          formatCurrency(
                            transactionsData?.transactions
                              ?.filter((t: any) => t.type === 'deposit' && 
                                new Date(t.createdAt).getMonth() === new Date().getMonth())
                              ?.reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0) || 0
                          )
                        }
                      </div>
                    </div>
                    
                    <div className="bg-emerald-900/40 border border-emerald-700/40 rounded-lg p-3 transition-all duration-300 hover:border-yellow-500/30 hover:bg-emerald-800/50">
                      <div className="text-xs text-emerald-300 mb-1">Avg. Transaction</div>
                      <div className="text-2xl font-semibold text-yellow-300 text-shadow-sm">
                        {isTransactionsLoading ? 
                          <CircleDashed className="h-4 w-4 animate-spin" /> : 
                          formatCurrency(
                            (transactionsData?.transactions?.reduce((sum: number, t: any) => 
                              sum + parseFloat(t.amount), 0) || 0) / 
                              (transactionsData?.transactions?.length || 1)
                          )
                        }
                      </div>
                    </div>
                  </div>
                  
                  {/* Activity chart placeholder with emerald styling */}
                  <div className="h-48 bg-emerald-900/30 backdrop-blur-sm border border-emerald-700/40 rounded-lg flex items-center justify-center relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-400/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-5 left-10 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl"></div>
                    
                    <div className="text-center relative z-10">
                      <LineChart className="h-10 w-10 text-yellow-500/50 mx-auto mb-2" />
                      <p className="text-sm text-emerald-200">Transaction activity visualization</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <EmeraldButton 
                    icon={<ArrowUpRight className="h-4 w-4" />}
                    onClick={goToHistory}
                    className="w-full"
                  >
                    View Detailed History
                  </EmeraldButton>
                </div>
              </EmeraldCard>
            </TabsContent>
            
            {/* Market tab content with emerald theme */}
            <TabsContent value="market">
              <EmeraldCard title="Currency Exchange Rates" headerClassName="border-emerald-700/40" className="relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-yellow-400/5 rounded-full blur-3xl"></div>
                
                <p className="text-sm text-emerald-200 mb-6">Current rates for supported currencies</p>
                
                <div className="space-y-4 relative z-10">
                  {marketTrends.map((currency) => (
                    <div 
                      key={currency.name} 
                      className="flex items-center justify-between p-3 bg-emerald-900/40 border border-emerald-700/40 rounded-lg transition-all duration-300 hover:border-yellow-500/30 hover:bg-emerald-800/50"
                    >
                      <div className="flex items-center">
                        <div className="h-9 w-9 rounded-full bg-emerald-700/50 border border-emerald-600/50 flex items-center justify-center text-yellow-300 mr-3">
                          <Coins className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-emerald-100">{currency.name}</h4>
                          <p className="text-xs text-emerald-300/80">Current value: {currency.value}</p>
                        </div>
                      </div>
                      <div className={`flex items-center ${
                        currency.trend === 'up' ? 'text-green-400' : 
                        currency.trend === 'down' ? 'text-red-400' : 'text-blue-400'
                      }`}>
                        {currency.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : currency.trend === 'down' ? (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 mr-1" />
                        )}
                        <span>{currency.change > 0 ? '+' : ''}{currency.change}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 relative z-10">
                  <EmeraldButton 
                    variant="yellow"
                    icon={<ArrowUpDown className="h-4 w-4" />}
                    onClick={() => navigate("/wallet?tab=exchange")}
                    className="w-full"
                  >
                    Exchange Currency
                  </EmeraldButton>
                </div>
              </EmeraldCard>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
      
      {/* API Testing Section - For Development Only */}
      <div className="mt-6">
        <EmeraldCard className="backdrop-blur-sm border-yellow-500/20">
          <EmeraldButton 
            variant={showApiTester ? "primary" : "yellow"}
            icon={showApiTester ? <X className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
            className="w-full"
            onClick={toggleApiTester}
          >
            {showApiTester ? "Hide API Testing Tools" : "Show API Testing Tools"}
          </EmeraldButton>
        </EmeraldCard>
        
        <AnimatePresence>
          {showApiTester && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="my-6 overflow-hidden"
            >
              <CasinoApiTester />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Home;
