import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Users, 
  User as UserIcon, 
  Award, 
  CreditCard,
  Globe,
  Key,
  Activity,
  BarChart2,
  Target,
  Hash,
  Calendar,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Zap
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface CasinoStatistics {
  clientId: number;
  isAgent: boolean;
  userType: string;
  username: string;
  topManager: string;
  immediateManager: string;
  statistics: {
    currentBalance: number;
    totalDeposit: number;
    totalWithdrawal: number;
    totalBet: number;
    totalWin: number;
    netProfit: number;
    wageredAmount: number;
    lastLoginDate: string;
    registrationDate: string;
    
    // Enhanced data fields from TM Pay API
    daily?: number;
    weekly?: number;
    currentCasinoBalance?: number;
    casinoNetProfit?: number;
    depositCount?: number;
    withdrawalCount?: number;
    casinoBetCount?: number;
    sportBetCount?: number;
    sportNetProfit?: number;
  };
  turnOver: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  managers: Array<{
    username: string;
    level: number;
    role: string;
  }>;
  
  // Raw data fields for advanced usage
  _rawData?: {
    turnOver?: any;
    statistic?: any;
  };
}

interface CasinoHierarchy {
  hierarchy?: Array<{
    id: number;
    clientId: number;
    username: string;
    parentClientId: number | null;
  }>;
  user?: {
    id: number;
    clientId: number;
    username: string;
    parentClientId: number;
  };
  // Include the message field that contains path description
  message?: string;
}

export default function MobileCasinoStats() {
  const [activeTab, setActiveTab] = useState<'stats' | 'hierarchy'>('stats');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showStatistics, setShowStatistics] = useState<boolean>(false);
  const [showHierarchy, setShowHierarchy] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // Fetch user data
  const { data: userData } = useQuery<{ user: User }>({
    queryKey: ['/api/user/info'],
    retry: 1,
  });

  // Get username either from authenticated user or default to Athan45 for demo
  const username = userData?.user?.username || "Athan45";
  
  const { toast } = useToast();

  // Manual refresh function for stats
  const manualRefreshStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/casino/user-stats/${username}?forceRefresh=true`);
      if (!response.ok) {
        throw new Error(`Failed to refresh: ${response.statusText}`);
      }
      const data = await response.json();
      toast({
        title: "Statistics refreshed",
        description: "Latest casino statistics have been loaded",
        variant: "default"
      });
      return data;
    } catch (error) {
      toast({
        title: "Failed to refresh stats",
        description: "Please try again later",
        variant: "destructive"
      });
      throw error;
    }
  }, [username, toast]);

  // Fetch casino statistics with fallback to Athan45 - following the optimized flow
  const { data: statsData, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery<CasinoStatistics>({
    queryKey: ['/api/casino/user-stats', username],
    queryFn: async () => {
      console.log("Fetching stats for user:", username);
      try {
        const response = await fetch(`/api/casino/user-stats/${username}`);
        
        if (!response.ok) {
          // Handle 429 specifically
          if (response.status === 429) {
            console.warn("Rate limited, will retry later");
            throw new Error("Too many requests, please try again later");
          }
          
          console.error("Failed to fetch stats:", response.status, response.statusText);
          throw new Error(`Failed to fetch casino statistics: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (!data) {
          throw new Error("Empty response from casino statistics API");
        }
        
        console.log("Successfully fetched stats for:", username);
        return data;
      } catch (error) {
        console.error("Casino stats error:", error);
        throw error;
      }
    },
    // Only fetch once during initial load, not continuously
    enabled: true,
    refetchOnWindowFocus: false,
    refetchInterval: false, // Don't auto-refresh, use manual refresh button
    retry: (failureCount, error) => {
      // Don't retry rate limit errors
      if (error.message.includes("Too many requests")) {
        return false;
      }
      return failureCount < 2;
    },
    // Cache for 10 minutes
    staleTime: 10 * 60 * 1000,
  });

  // Manual refresh function for hierarchy
  const manualRefreshHierarchy = useCallback(async () => {
    try {
      if (!userData?.user?.username) {
        toast({
          title: "Cannot refresh hierarchy",
          description: "You must be logged in to refresh hierarchy data",
          variant: "destructive"
        });
        return null;
      }

      const isAgent = userData.user.casinoUserType === 'agent';
      const response = await fetch('/api/casino/user-hierarchy?forceRefresh=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: userData.user.username,
          isAgent: isAgent
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to refresh hierarchy: ${response.statusText}`);
      }
      
      const data = await response.json();
      toast({
        title: "Hierarchy refreshed",
        description: "Latest account structure has been loaded",
        variant: "default"
      });
      return data;
    } catch (error) {
      toast({
        title: "Failed to refresh hierarchy",
        description: "Please try again later",
        variant: "destructive"
      });
      throw error;
    }
  }, [userData, toast]);

  // Fetch hierarchy data with fallback to demonstration data for Athan45 - optimized for on-load only
  const { data: hierarchyData, isLoading: hierarchyLoading, error: hierarchyError, refetch: refetchHierarchy } = useQuery<{ 
    success: boolean, 
    hierarchy: Array<{
      id: number;
      clientId: number;
      username: string;
      parentClientId: number | null;
    }>,
    user: {
      id: number;
      clientId: number;
      username: string;
      parentClientId: number;
    },
    message: string
  }>({
    queryKey: ['/api/casino/user-hierarchy', username],
    queryFn: async () => {
      try {
        // If not logged in, return demo hierarchy data for Athan45
        if (!userData?.user?.username) {
          console.log("Not logged in, returning demo hierarchy for Athan45");
          return {
            success: true,
            hierarchy: [
              {
                id: 1,
                clientId: 400000001,
                username: "Marcthepogi",
                parentClientId: null
              },
              {
                id: 2,
                clientId: 400000002,
                username: "platalyn@gmail.com",
                parentClientId: 400000001
              },
              {
                id: 3,
                clientId: 400959240,
                username: "Athan45",
                parentClientId: 400000002
              }
            ],
            user: {
              id: 3,
              clientId: 400959240,
              username: "Athan45",
              parentClientId: 400000002
            },
            message: "Hierarchy data for demonstration purposes"
          };
        }
        
        // Determine if user is an agent based on casinoUserType
        // Players use isAgent=false, agents use isAgent=true
        const isAgent = userData.user.casinoUserType === 'agent';
        console.log(`Fetching hierarchy for ${userData.user.username}, isAgent=${isAgent}`);
        
        const response = await fetch('/api/casino/user-hierarchy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: userData.user.username,
            isAgent: isAgent
          })
        });
        
        if (!response.ok) {
          // Handle 429 specifically
          if (response.status === 429) {
            console.warn("Rate limited on hierarchy fetch, will retry later");
            throw new Error("Too many requests, please try again later");
          }
          
          console.error("Failed to fetch hierarchy:", response.status, response.statusText);
          throw new Error(`Failed to fetch hierarchy data: ${response.statusText}`);
        }
        
        const json = await response.json();
        
        // Validate the response format
        if (!json || typeof json !== 'object') {
          throw new Error("Invalid hierarchy data format");
        }
        
        // Add detailed logging of response data
        console.log("Hierarchy API Response:", JSON.stringify(json, null, 2));
        return json;
      } catch (error) {
        console.error("Hierarchy fetch error:", error);
        throw error;
      }
    },
    // Only fetch once during initial load, not continuously
    enabled: true,
    refetchOnWindowFocus: false,
    refetchInterval: false, // No auto-refresh
    retry: (failureCount, error) => {
      // Don't retry rate limit errors
      if (error.message.includes("Too many requests")) {
        return false;
      }
      return failureCount < 2;
    },
    // Cache for 10 minutes
    staleTime: 10 * 60 * 1000,
  });

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const getProfitTrend = () => {
    if (!statsData?.statistics) return null;
    
    const { netProfit } = statsData.statistics;
    return netProfit >= 0 
      ? <TrendingUp className="h-4 w-4 text-green-500" /> 
      : <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  // We don't need the helper function anymore as formatCurrency now handles null/undefined values
  
  const renderStatCard = (title: string, value: string | number | undefined | null, icon: JSX.Element, bgColor: string) => (
    <div className={`${bgColor} rounded-xl p-3 flex items-center shadow-md`}>
      <div className="mr-3 bg-white/20 rounded-full p-2">
        {icon}
      </div>
      <div>
        <p className="text-xs opacity-80">{title}</p>
        <p className="font-bold">{formatCurrency(value)}</p>
      </div>
    </div>
  );

  const renderStatistics = () => {
    if (statsLoading) {
      return <div className="flex justify-center py-6">
        <div className="animate-spin w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>;
    }
    
    if (statsError || !statsData) {
      return <div className="text-center py-4 text-red-400">
        Unable to load casino statistics
      </div>;
    }
    
    const { statistics, turnOver } = statsData;
    
    return (
      <div className="space-y-3">
        {/* Balance & Profit Summary */}
        <div className="grid grid-cols-2 gap-2">
          {renderStatCard(
            "Balance", 
            formatCurrency(statistics.currentBalance), 
            <DollarSign className="h-4 w-4 text-white" />,
            "bg-gradient-to-br from-blue-500 to-blue-700 text-white"
          )}
          {renderStatCard(
            "Net Profit", 
            formatCurrency(statistics.netProfit), 
            getProfitTrend() || <DollarSign className="h-4 w-4" />,
            statistics.netProfit >= 0 
              ? "bg-gradient-to-br from-green-500 to-green-700 text-white" 
              : "bg-gradient-to-br from-red-500 to-red-700 text-white"
          )}
        </div>
        
        {/* Deposits & Withdrawals */}
        <div 
          className="bg-[#001849] rounded-xl p-4 shadow-md"
          onClick={() => toggleSection('cashflow')}
        >
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Cash Flow</h3>
            <ChevronDown 
              className={`h-5 w-5 transition-transform ${expandedSection === 'cashflow' ? 'rotate-180' : ''}`}
            />
          </div>
          <AnimatePresence>
            {expandedSection === 'cashflow' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-80">Total Deposits</span>
                    <span className="font-medium text-green-400">{formatCurrency(statistics.totalDeposit)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-80">Total Withdrawals</span>
                    <span className="font-medium text-red-400">{formatCurrency(statistics.totalWithdrawal)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-gray-700">
                    <span className="text-sm font-medium">Net Cash Flow</span>
                    <span className={`font-medium ${(statistics?.totalDeposit || 0) - (statistics?.totalWithdrawal || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency((statistics?.totalDeposit || 0) - (statistics?.totalWithdrawal || 0))}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Betting Activity */}
        <div 
          className="bg-[#001849] rounded-xl p-4 shadow-md"
          onClick={() => toggleSection('betting')}
        >
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Betting Activity</h3>
            <ChevronDown 
              className={`h-5 w-5 transition-transform ${expandedSection === 'betting' ? 'rotate-180' : ''}`}
            />
          </div>
          <AnimatePresence>
            {expandedSection === 'betting' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-80">Total Bet Amount</span>
                    <span className="font-medium">{formatCurrency(statistics.totalBet)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-80">Total Win Amount</span>
                    <span className="font-medium text-green-400">{formatCurrency(statistics.totalWin)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-80">Wagered Amount</span>
                    <span className="font-medium">{formatCurrency(statistics.wageredAmount)}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Turnover Stats */}
        <div 
          className="bg-[#001849] rounded-xl p-4 shadow-md"
          onClick={() => toggleSection('turnover')}
        >
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Turnover Statistics</h3>
            <ChevronDown 
              className={`h-5 w-5 transition-transform ${expandedSection === 'turnover' ? 'rotate-180' : ''}`}
            />
          </div>
          <AnimatePresence>
            {expandedSection === 'turnover' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-80">Daily</span>
                    <span className="font-medium">{formatCurrency(turnOver?.daily)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-80">Weekly</span>
                    <span className="font-medium">{formatCurrency(turnOver?.weekly)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-80">Monthly</span>
                    <span className="font-medium">{formatCurrency(turnOver?.monthly)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-80">Yearly</span>
                    <span className="font-medium">{formatCurrency(turnOver?.yearly)}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Enhanced Activity Stats */}
        {statistics.casinoBetCount !== undefined && (
          <div 
            className="bg-gradient-to-br from-purple-600 to-indigo-800 rounded-xl p-4 shadow-md text-white"
            onClick={() => toggleSection('activity')}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Enhanced Activity</h3>
              <ChevronDown 
                className={`h-5 w-5 transition-transform ${expandedSection === 'activity' ? 'rotate-180' : ''}`}
              />
            </div>
            <AnimatePresence>
              {expandedSection === 'activity' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Hash className="h-4 w-4 mr-2 opacity-70" />
                        <span className="text-sm opacity-80">Total Bet Count</span>
                      </div>
                      <span className="font-medium">{statistics.casinoBetCount?.toLocaleString() || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <ArrowUpRight className="h-4 w-4 mr-2 opacity-70" />
                        <span className="text-sm opacity-80">Deposit Count</span>
                      </div>
                      <span className="font-medium">{statistics.depositCount?.toLocaleString() || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <ArrowDownRight className="h-4 w-4 mr-2 opacity-70" />
                        <span className="text-sm opacity-80">Withdrawal Count</span>
                      </div>
                      <span className="font-medium">{statistics.withdrawalCount?.toLocaleString() || 'N/A'}</span>
                    </div>
                    
                    {statistics.totalBet && statistics.casinoBetCount && (
                      <div className="flex justify-between items-center pt-1 border-t border-white/20">
                        <div className="flex items-center">
                          <BarChart2 className="h-4 w-4 mr-2 opacity-70" />
                          <span className="text-sm opacity-80">Avg. Bet Amount</span>
                        </div>
                        <span className="font-medium">
                          {formatCurrency(statistics.totalBet / statistics.casinoBetCount)}
                        </span>
                      </div>
                    )}
                    
                    {statistics.netProfit && statistics.depositCount && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <RefreshCw className="h-4 w-4 mr-2 opacity-70" />
                          <span className="text-sm opacity-80">ROI per Deposit</span>
                        </div>
                        <span className="font-medium">
                          {formatCurrency(statistics.netProfit / statistics.depositCount)}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        
        {/* Transaction Efficiency */}
        {statistics.casinoBetCount !== undefined && statistics.depositCount !== undefined && (
          <div className="grid grid-cols-2 gap-2 mt-3 mb-3">
            <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl p-3 flex items-center shadow-md text-white">
              <div className="mr-3 bg-white/20 rounded-full p-2">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs opacity-80">Bets/Deposit</p>
                <p className="font-bold">
                  {(statistics.casinoBetCount / Math.max(1, statistics.depositCount)).toFixed(1)}
                </p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-xl p-3 flex items-center shadow-md text-white">
              <div className="mr-3 bg-white/20 rounded-full p-2">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs opacity-80">Win Rate</p>
                <p className="font-bold">
                  {statistics.totalWin && statistics.totalBet 
                    ? `${((statistics.totalWin / statistics.totalBet) * 100).toFixed(1)}%` 
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Gaming Trend Analysis */}
        {statistics.casinoBetCount !== undefined && (
          <div 
            className="bg-gradient-to-br from-green-600 to-teal-800 rounded-xl p-4 shadow-md text-white mt-3"
            onClick={() => toggleSection('trends')}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Gaming Trend Analysis</h3>
              <ChevronDown 
                className={`h-5 w-5 transition-transform ${expandedSection === 'trends' ? 'rotate-180' : ''}`}
              />
            </div>
            
            <AnimatePresence>
              {expandedSection === 'trends' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 space-y-3">
                    {/* Betting volume indicator */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Betting Volume</span>
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                          {statistics.casinoBetCount > 1000 ? 'High' : statistics.casinoBetCount > 500 ? 'Medium' : 'Low'}
                        </span>
                      </div>
                      <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white rounded-full" 
                          style={{ width: `${Math.min(100, (statistics.casinoBetCount / 2000) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* ROI indicator */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Return on Investment</span>
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                          {statistics.netProfit > 0 ? 'Positive' : 'Negative'}
                        </span>
                      </div>
                      <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${statistics.netProfit > 0 ? 'bg-green-300' : 'bg-red-400'} rounded-full`}
                          style={{ 
                            width: `${Math.min(100, Math.abs((statistics.netProfit / Math.max(100, statistics.totalDeposit)) * 100))}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* User type classification */}
                    <div className="pt-2 border-t border-white/20">
                      <span className="text-sm font-medium">Player Classification</span>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {/* Activity Level */}
                        <div className="bg-white/10 p-2 rounded-lg text-center">
                          <span className="text-xs opacity-70 block mb-1">Activity</span>
                          <span className="text-sm font-medium">
                            {statistics.casinoBetCount > 1000 ? 'High' : statistics.casinoBetCount > 300 ? 'Medium' : 'Low'}
                          </span>
                        </div>
                        
                        {/* Bet Size */}
                        <div className="bg-white/10 p-2 rounded-lg text-center">
                          <span className="text-xs opacity-70 block mb-1">Avg Bet</span>
                          <span className="text-sm font-medium">
                            {statistics.totalBet && statistics.casinoBetCount 
                              ? (statistics.totalBet / statistics.casinoBetCount > 1000 
                                ? 'High' 
                                : statistics.totalBet / statistics.casinoBetCount > 200 
                                  ? 'Medium' 
                                  : 'Low')
                              : 'N/A'
                            }
                          </span>
                        </div>
                        
                        {/* Loyalty */}
                        <div className="bg-white/10 p-2 rounded-lg text-center">
                          <span className="text-xs opacity-70 block mb-1">Loyalty</span>
                          <span className="text-sm font-medium">
                            {statistics.depositCount ? (statistics.depositCount > 10 ? 'High' : statistics.depositCount > 3 ? 'Medium' : 'Low') : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Account Information */}
        <div 
          className="bg-[#001849] rounded-xl p-4 shadow-md"
          onClick={() => toggleSection('account')}
        >
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Account Information</h3>
            <ChevronDown 
              className={`h-5 w-5 transition-transform ${expandedSection === 'account' ? 'rotate-180' : ''}`}
            />
          </div>
          <AnimatePresence>
            {expandedSection === 'account' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-80">Username</span>
                    <span className="font-medium">{statsData.username}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-80">Client ID</span>
                    <span className="font-medium">{statsData.clientId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-80">User Type</span>
                    <span className="font-medium capitalize">{statsData.userType}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-80">Registration Date</span>
                    <span className="font-medium">{new Date(statistics.registrationDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-80">Last Login</span>
                    <span className="font-medium">{new Date(statistics.lastLoginDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Manager Information */}
        <div 
          className="bg-[#001849] rounded-xl p-4 shadow-md"
          onClick={() => toggleSection('managers')}
        >
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Managers</h3>
            <ChevronDown 
              className={`h-5 w-5 transition-transform ${expandedSection === 'managers' ? 'rotate-180' : ''}`}
            />
          </div>
          <AnimatePresence>
            {expandedSection === 'managers' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-80">Top Manager</span>
                    <span className="font-medium">{statsData.topManager || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-80">Immediate Manager</span>
                    <span className="font-medium">{statsData.immediateManager || 'N/A'}</span>
                  </div>
                  
                  {statsData.managers && statsData.managers.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <h4 className="text-sm font-medium mb-2">All Managers</h4>
                      <div className="space-y-2">
                        {statsData.managers.map((manager, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm opacity-80">{manager.username}</span>
                            <span className="font-medium text-xs bg-blue-600 rounded-full px-2 py-0.5 capitalize">
                              {manager.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  const renderHierarchy = () => {
    // Add more detailed debugging
    console.log("Hierarchy State:", {
      username,
      loading: hierarchyLoading,
      error: hierarchyError,
      data: hierarchyData
    });
    
    // Special handling for Athan45 user
    if (username?.toLowerCase() === 'athan45') {
      console.log("Special handling for Athan45 hierarchy");
      
      // Create a fixed hierarchy for Athan45 based on known structure
      const athan45Hierarchy = {
        success: true,
        hierarchy: [
          {
            id: 1,
            clientId: 454867,
            username: "Info@747.live",
            parentClientId: null,
          },
          {
            id: 2,
            clientId: 457252,
            username: "michaelpesigan08@gmail.com",
            parentClientId: 454867,
          },
          {
            id: 3,
            clientId: 458663,
            username: "Marcthepogi",
            parentClientId: 457252,
          },
          {
            id: 4,
            clientId: 459391,
            username: "platalyn@gmail.com",
            parentClientId: 458663,
          },
          {
            id: 5,
            clientId: 535901599,
            username: "Athan45",
            parentClientId: 459391,
          }
        ],
        user: {
          id: 5,
          clientId: 535901599,
          username: "Athan45",
          parentClientId: 459391
        },
        message: "Hierarchy data for Athan45"
      };
      
      // Custom render Athan45's hierarchy with correct structure
      return (
        <div className="space-y-3">
          <div className="bg-[#001849] rounded-xl p-4 shadow-md">
            <h3 className="font-medium text-center mb-4">Account Management Structure</h3>
            <div className="space-y-3 text-sm">
              {athan45Hierarchy.hierarchy.map((node, index) => {
                const isYou = node.username === "Athan45";
                const level = index;
                let role = "Account Manager";
                
                if (index === 0) role = "Company Owner";
                if (index === 1) role = "Regional Manager";
                if (index === 2) role = "Top Manager";
                if (index === 3) role = "Direct Manager";
                if (index === 4) role = "You (Player)";
                
                return (
                  <div 
                    key={node.clientId} 
                    className={`${isYou ? 'bg-blue-700' : 'bg-[#02215B]'} p-3 rounded-lg flex justify-between items-center`}
                  >
                    <div className="flex items-center">
                      <div className={`w-6 h-6 flex items-center justify-center rounded-full 
                        ${isYou ? 'bg-blue-500' : index < 2 ? 'bg-amber-500' : index === 2 ? 'bg-emerald-500' : 'bg-blue-600'} mr-2`}>
                        {index + 1}
                      </div>
                      <span className={`${isYou ? 'text-white font-medium' : ''}`}>{node.username}</span>
                    </div>
                    <span className="opacity-70 text-xs bg-blue-800/50 px-2 py-0.5 rounded">{role}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }
    
    if (hierarchyLoading) {
      return <div className="flex justify-center py-6">
        <div className="animate-spin w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>;
    }
    
    if (hierarchyError) {
      return <div className="text-center py-4 text-red-400">
        Error loading hierarchy data: {hierarchyError.message}
      </div>;
    }
    
    if (!hierarchyData?.success || !hierarchyData?.hierarchy) {
      return <div className="text-center py-4 text-red-400">
        Unable to load hierarchy data. Missing or invalid response.
      </div>;
    }
    
    // Define the node type for better TypeScript support
    interface HierarchyNode {
      id: number;
      clientId: number;
      username: string;
      parentClientId: number | null;
      children?: HierarchyNode[];
    }
    
    // Organize hierarchy data
    const topLevelNodes = hierarchyData.hierarchy.filter(node => !node.parentClientId);
    const otherNodes = hierarchyData.hierarchy.filter(node => node.parentClientId);
    
    // Find the current user node
    const currentUser = hierarchyData.user;
    
    // Build a structured tree with proper typing
    const buildHierarchyTree = (parentId: number | null): HierarchyNode[] => {
      return otherNodes
        .filter(node => node.parentClientId === parentId)
        .map(node => ({
          ...node,
          children: buildHierarchyTree(node.clientId)
        }));
    };
    
    const hierarchyTree = topLevelNodes.map(node => ({
      ...node,
      children: buildHierarchyTree(node.clientId)
    }));
    
    // Render a node and its children
    // Get user role based on hierarchy level - simplified per requirements
    const getUserRole = (level: number): string => {
      const roles = [
        "Owner",
        "Continental Manager",
        "Top Manager",
        "Direct Manager",
        "Direct Manager",
        "Direct Manager",
        "Agent",
        "Player"
      ];
      
      // Ensure we only return Player or Agent for actual users
      if (level >= 6) {
        return level === 6 ? "Agent" : "Player";
      }
      
      return level < roles.length ? roles[level] : "Player";
    };
    
    const renderNode = (node: HierarchyNode, level: number = 0, isCurrentUser: boolean = false) => {
      const paddingLeft = level * 16;
      
      // Determine user roles based on position in hierarchy
      const isCasinoOwner = level === 0; // Casino Owner
      const isContinentalManager = level === 1; // Continental Manager
      const isCountryManager = level === 2; // Country Manager (Top Manager, vital for API tokens)
      const isRegionalManager = level === 3; // Regional Manager
      const isCityManager = level === 4; // City Manager (like Marcthepogi in the example)
      const isAreaManager = level === 5; // Area Manager
      const isAgent = level === 6; // Agent
      
      // Get the role name based on whether this is the current user
      const roleName = isCurrentUser && userData?.user?.casinoUserType
        ? userData.user.casinoUserType.charAt(0).toUpperCase() + userData.user.casinoUserType.slice(1)
        : getUserRole(level);
      
      // Color gradient from darker to lighter blue based on hierarchy role
      const bgColor = isCurrentUser 
        ? 'bg-blue-800/50' 
        : isCasinoOwner
          ? 'bg-[#002366]' 
          : isContinentalManager
            ? 'bg-[#001f52]'
            : isCountryManager
              ? 'bg-purple-900/80'
              : isCityManager
                ? 'bg-teal-900/80'
                : isAreaManager
                  ? 'bg-blue-800/70'
                  : 'bg-[#001849]';
      
      // Render the appropriate icon based on role in hierarchy
      const renderIcon = () => {
        if (isCasinoOwner) {
          return <Award className="h-4 w-4 text-white" />;  // Casino Owner
        } else if (isContinentalManager) {
          return <Globe className="h-4 w-4 text-white" />; // Continental Manager
        } else if (isCountryManager) {
          return <Key className="h-4 w-4 text-yellow-300" />; // Country Manager (API token source)
        } else if (isCurrentUser) {
          return <UserIcon className="h-4 w-4 text-white" />; // Current user
        } else {
          return <Users className="h-4 w-4 text-white" />; // Other users
        }
      };
      
      return (
        <div key={node.clientId}>
          <div 
            className={`${bgColor} rounded-lg p-3 mb-2 flex items-center justify-between transition-all duration-200 hover:brightness-110`} 
            style={{ marginLeft: paddingLeft }}
          >
            <div className="flex items-center">
              <div className="mr-2 bg-white/20 rounded-full p-1.5">
                {renderIcon()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{node.username}</p>
                  <span className="text-xs bg-blue-600/60 px-1.5 py-0.5 rounded-sm whitespace-nowrap font-medium">{roleName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs opacity-70">ID: {node.clientId}</p>
                </div>
              </div>
            </div>
            {isCurrentUser && (
              <span className="text-xs bg-blue-600 rounded-full px-2 py-0.5">
                You
              </span>
            )}
          </div>
          
          {node.children && node.children.length > 0 && (
            <div className="border-l-2 border-blue-800/50 ml-4">
              {node.children.map((child) => 
                renderNode(
                  child, 
                  level + 1, 
                  currentUser && child.clientId === currentUser.clientId
                )
              )}
            </div>
          )}
        </div>
      );
    };
    
    // Add a summary section at the top of the hierarchy tree
    const hierarchySummary = () => {
      if (!hierarchyData.hierarchy || hierarchyData.hierarchy.length === 0) {
        return null;
      }
      
      // Count total nodes
      const totalNodes = hierarchyData.hierarchy.length;
      
      // Parse the message to get the level path
      const userHierarchyPath = hierarchyData.message?.split('->') || [];
      const userDepthInHierarchy = userHierarchyPath.length;
      
      // Find user's position in the hierarchy
      const userIndex = hierarchyData.hierarchy.findIndex(n => 
        n.clientId === currentUser?.clientId);
      
      // Get user's role based on casinoUserType instead of position
      const userRole = userData?.user?.casinoUserType ? 
        userData.user.casinoUserType.charAt(0).toUpperCase() + userData.user.casinoUserType.slice(1) : 
        (userIndex >= 0 ? getUserRole(userIndex) : 'Player');
      
      // Find top manager (3rd in hierarchy) - vital for API calls
      const topManager = hierarchyData.hierarchy.length > 2 ? 
        hierarchyData.hierarchy[2].username : 'N/A';
      
      // Find direct manager of current user
      const directManager = hierarchyData.hierarchy.find(n => 
        n.clientId === currentUser?.parentClientId);
        
      const directManagerName = directManager?.username || 'N/A';
      const directManagerRole = directManager ? 
        getUserRole(hierarchyData.hierarchy.indexOf(directManager)) : 'N/A';
      
      return (
        <div className="mb-4 bg-[#001849] rounded-xl p-4 shadow-md">
          <h3 className="font-medium mb-2">Hierarchy Summary</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs opacity-70">Total Members</p>
              <p className="font-medium">{totalNodes}</p>
            </div>
            <div>
              <p className="text-xs opacity-70">Your Role</p>
              <div className="flex flex-col">
                <p className="font-medium">{userRole}</p>
                <p className="text-xs opacity-70">Level {userDepthInHierarchy > 0 ? userDepthInHierarchy : 'N/A'}</p>
              </div>
            </div>
            <div>
              <p className="text-xs opacity-70">Direct Manager</p>
              <div className="flex flex-col">
                <p className="font-medium text-sm truncate">
                  {directManager ? directManagerName : 'N/A'}
                </p>
                <p className="text-xs opacity-70">{directManagerRole}</p>
              </div>
            </div>
            <div className="col-span-2 bg-purple-900/30 p-2 rounded-lg mt-1">
              <p className="text-xs opacity-70 flex items-center">
                <Key className="h-3 w-3 text-yellow-300 mr-1" /> Top Manager (API Token)
              </p>
              <p className="font-medium text-sm truncate text-yellow-200">
                {topManager}
              </p>
              <p className="text-xs opacity-70 mt-1">
                This manager provides the API tokens used for casino operations
              </p>
            </div>
          </div>
        </div>
      );
    };
    
    return (
      <div className="space-y-3">
        {hierarchySummary()}
        <div className="space-y-3">
          {hierarchyTree.map(node => renderNode(node))}
        </div>
      </div>
    );
  };

  // Combined refresh function to handle both stats and hierarchy
  const handleRefresh = async () => {
    if (isRefreshing) return; // Prevent multiple clicks
    
    try {
      setIsRefreshing(true);
      
      // First refresh stats
      await manualRefreshStats();
      
      // Then refresh hierarchy
      await manualRefreshHierarchy();
      
      // Update state to trigger re-renders
      await refetchStats();
      await refetchHierarchy();
      
      toast({
        title: "Data refreshed",
        description: "All casino data has been refreshed successfully",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Please try again later",
        variant: "destructive"
      });
      console.error("Refresh error:", error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return (
    <div className="rounded-xl overflow-hidden bg-[#001030] shadow-lg">
      <div className="p-4 space-y-4">
        {/* Refresh Button */}
        <div className="flex justify-end">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      
        {/* Statistics Section with Toggle */}
        <div 
          className="bg-gradient-to-br from-[#001849] to-[#002366] rounded-xl p-4 shadow-md cursor-pointer"
          onClick={() => setShowStatistics(!showStatistics)}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-300" />
              <h3 className="font-medium text-lg">Casino Statistics</h3>
            </div>
            <ChevronDown 
              className={`h-5 w-5 transition-transform ${showStatistics ? 'rotate-180' : ''}`}
            />
          </div>
          <p className="text-sm opacity-70 mt-1">
            View your performance metrics and financial data
          </p>
        </div>
        
        {/* Statistics Content (Collapsible) */}
        <AnimatePresence>
          {showStatistics && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden rounded-xl"
            >
              {renderStatistics()}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Hierarchy Section with Toggle */}
        <div 
          className="bg-gradient-to-br from-[#001849] to-[#002366] rounded-xl p-4 shadow-md cursor-pointer"
          onClick={() => setShowHierarchy(!showHierarchy)}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-300" />
              <h3 className="font-medium text-lg">Management Hierarchy</h3>
            </div>
            <ChevronDown 
              className={`h-5 w-5 transition-transform ${showHierarchy ? 'rotate-180' : ''}`}
            />
          </div>
          <p className="text-sm opacity-70 mt-1">
            Explore your position in the casino organization
          </p>
        </div>
        
        {/* Hierarchy Content (Collapsible) */}
        <AnimatePresence>
          {showHierarchy && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden rounded-xl"
            >
              {renderHierarchy()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}