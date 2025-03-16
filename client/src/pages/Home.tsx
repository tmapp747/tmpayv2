import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import BalanceCard from "@/components/BalanceCard";
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
  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ['/api/user/info'],
  });
  
  // Recent transaction data
  const { data: transactionsData, isLoading: isTransactionsLoading } = useQuery({
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
          {greeting}, {user?.username || "User"}
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
        {/* Balance card with animated effect */}
        <motion.div variants={itemVariants} className="mb-6">
          <BalanceCard />
        </motion.div>
        
        {/* Quick Actions section */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Quick Actions</h2>
            <Button variant="ghost" size="sm" onClick={goToWallet} className="text-primary text-sm">
              See all <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <QuickActions />
        </motion.div>
        
        {/* Dashboard tabs for different views */}
        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="market">Market</TabsTrigger>
            </TabsList>
            
            {/* Overview tab content */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Account summary card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Wallet className="h-5 w-5 mr-2 text-primary" />
                      Account Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-4">
                      <div className="flex justify-between items-center">
                        <dt className="text-sm text-muted-foreground">Wallet Balance</dt>
                        <dd className="font-semibold">{formatCurrency(userData?.user?.balance || 0)}</dd>
                      </div>
                      <div className="flex justify-between items-center">
                        <dt className="text-sm text-muted-foreground">Pending Balance</dt>
                        <dd className="font-semibold">{formatCurrency(userData?.user?.pendingBalance || 0)}</dd>
                      </div>
                      <div className="flex justify-between items-center">
                        <dt className="text-sm text-muted-foreground">Casino Balance</dt>
                        <dd className="font-semibold">
                          {isUserLoading ? 
                            <CircleDashed className="h-4 w-4 animate-spin" /> : 
                            formatCurrency(userData?.user?.casinoBalance || 0)
                          }
                        </dd>
                      </div>
                      <div className="flex justify-between items-center">
                        <dt className="text-sm text-muted-foreground">Account Status</dt>
                        <dd className="inline-flex items-center bg-green-500/10 text-green-500 px-2 py-1 rounded-full text-xs">
                          <Check className="h-3 w-3 mr-1" /> Active
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="outline" size="sm" className="w-full" onClick={goToWallet}>
                      <DollarSign className="h-4 w-4 mr-2" /> 
                      Manage Funds
                    </Button>
                  </CardFooter>
                </Card>
                
                {/* Deposit promo card */}
                <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary-foreground/5 to-background">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <CreditCard className="h-5 w-5 mr-2 text-primary" />
                      Instant Deposits
                    </CardTitle>
                    <CardDescription>
                      Fund your account quickly and safely
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                          <Check className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Secure Payments</h4>
                          <p className="text-xs text-muted-foreground">Using industry-standard encryption</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Instant Processing</h4>
                          <p className="text-xs text-muted-foreground">Funds available within minutes</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" onClick={goToWallet}>
                      Deposit Now
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              
              {/* Recent Transactions Section */}
              <RecentTransactions />
            </TabsContent>
            
            {/* Activity tab content */}
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                    Transaction Activity
                  </CardTitle>
                  <CardDescription>
                    Your recent financial activity and patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {/* Activity metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground mb-1">Total Transactions</div>
                        <div className="text-2xl font-semibold">
                          {isTransactionsLoading ? 
                            <CircleDashed className="h-4 w-4 animate-spin" /> : 
                            transactionsData?.transactions?.length || 0
                          }
                        </div>
                      </div>
                      
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground mb-1">Monthly Deposits</div>
                        <div className="text-2xl font-semibold">
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
                      
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground mb-1">Avg. Transaction</div>
                        <div className="text-2xl font-semibold">
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
                    
                    {/* Activity chart placeholder - would be a real chart in production */}
                    <div className="h-48 bg-muted/30 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <LineChart className="h-10 w-10 text-primary/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Transaction activity visualization</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full" onClick={goToHistory}>
                    View Detailed History
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Market tab content */}
            <TabsContent value="market">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <ArrowUpDown className="h-5 w-5 mr-2 text-primary" />
                    Currency Exchange Rates
                  </CardTitle>
                  <CardDescription>
                    Current rates for supported currencies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {marketTrends.map((currency) => (
                      <div key={currency.name} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                            <Coins className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-medium">{currency.name}</h4>
                            <p className="text-xs text-muted-foreground">Current value: {currency.value}</p>
                          </div>
                        </div>
                        <div className={`flex items-center ${
                          currency.trend === 'up' ? 'text-green-500' : 
                          currency.trend === 'down' ? 'text-red-500' : 'text-blue-500'
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
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                  <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/wallet?tab=exchange")}>
                    Exchange Currency
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
      
      {/* API Testing Section - For Development Only */}
      <div className="mt-6">
        <Card className="border border-border/30">
          <CardContent className="p-4">
            <Button 
              variant="outline" 
              className="w-full border-dashed"
              onClick={toggleApiTester}
            >
              {showApiTester ? "Hide API Testing Tools" : "Show API Testing Tools"}
            </Button>
          </CardContent>
        </Card>
        
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
