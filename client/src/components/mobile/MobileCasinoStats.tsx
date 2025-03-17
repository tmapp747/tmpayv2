import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, TrendingUp, TrendingDown, DollarSign, Clock, Users, Award, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { User } from "@/lib/types";

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
}

export default function MobileCasinoStats() {
  const [activeTab, setActiveTab] = useState<'stats' | 'hierarchy'>('stats');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  // Fetch user data
  const { data: userData } = useQuery<{ user: User }>({
    queryKey: ['/api/user/info'],
    retry: 1,
  });

  // Fetch casino statistics
  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery<CasinoStatistics>({
    queryKey: ['/api/casino/user-stats', userData?.user?.username],
    queryFn: async () => {
      if (!userData?.user?.username) throw new Error("Username not available");
      
      console.log("Fetching stats for user:", userData.user.username);
      const response = await fetch(`/api/casino/user-stats/${userData.user.username}`);
      
      if (!response.ok) {
        console.error("Failed to fetch stats:", response.status, response.statusText);
        throw new Error("Failed to fetch casino statistics");
      }
      
      return response.json();
    },
    enabled: !!userData?.user?.username,
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 2,
  });

  // Fetch hierarchy data
  const { data: hierarchyData, isLoading: hierarchyLoading, error: hierarchyError } = useQuery<{ success: boolean, hierarchy: CasinoHierarchy }>({
    queryKey: ['/api/casino/user-hierarchy'],
    queryFn: async () => {
      if (!userData?.user?.username) throw new Error("Username not available");
      
      const response = await fetch('/api/casino/user-hierarchy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: userData.user.username,
          isAgent: userData.user.casinoUserType === 'agent'
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch hierarchy data");
      }
      
      return response.json();
    },
    enabled: !!userData?.user?.username,
    refetchInterval: 60000, // Refresh every minute
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
    if (hierarchyLoading) {
      return <div className="flex justify-center py-6">
        <div className="animate-spin w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>;
    }
    
    if (hierarchyError || !hierarchyData?.success) {
      return <div className="text-center py-4 text-red-400">
        Unable to load hierarchy data
      </div>;
    }
    
    const { hierarchy } = hierarchyData;
    
    // Organize hierarchy data
    const topLevelNodes = hierarchy.hierarchy?.filter(node => !node.parentClientId) || [];
    const otherNodes = hierarchy.hierarchy?.filter(node => node.parentClientId) || [];
    
    // Find the current user node
    const currentUser = hierarchy.user;
    
    // Define the node type for better TypeScript support
    interface HierarchyNode {
      id: number;
      clientId: number;
      username: string;
      parentClientId: number | null;
      children?: HierarchyNode[];
    }
    
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
    const renderNode = (node: HierarchyNode, level: number = 0, isCurrentUser: boolean = false) => {
      const paddingLeft = level * 16;
      // Color gradient from darker to lighter blue based on hierarchy level
      const bgColor = isCurrentUser 
        ? 'bg-blue-800/50' 
        : level === 0 
          ? 'bg-[#002366]' 
          : level === 1
            ? 'bg-[#001f52]'
            : 'bg-[#001849]';
      
      // Render the appropriate icon based on role in hierarchy
      const renderIcon = () => {
        if (level === 0) {
          return <Award className="h-4 w-4 text-white" />;  // Top level (company)
        } else if (level === 1) {
          return <CreditCard className="h-4 w-4 text-white" />; // Direct reports (top managers)
        } else if (isCurrentUser) {
          return <Users className="h-4 w-4 text-white" />; // Current user
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
                <p className="font-medium">{node.username}</p>
                <p className="text-xs opacity-70">ID: {node.clientId}</p>
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
      if (!hierarchy.hierarchy || hierarchy.hierarchy.length === 0) {
        return null;
      }
      
      // Count total nodes and depth of hierarchy
      const totalNodes = hierarchy.hierarchy.length;
      const userDepthInHierarchy = hierarchy.message?.split('->').length || 0;
      
      return (
        <div className="mb-4 bg-[#001849] rounded-xl p-4 shadow-md">
          <h3 className="font-medium mb-2">Hierarchy Summary</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs opacity-70">Total Members</p>
              <p className="font-medium">{totalNodes}</p>
            </div>
            <div>
              <p className="text-xs opacity-70">Your Level</p>
              <p className="font-medium">{userDepthInHierarchy > 0 ? userDepthInHierarchy : 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs opacity-70">Direct Manager</p>
              <p className="font-medium text-sm truncate">
                {hierarchy.hierarchy.find(n => n.clientId === currentUser?.parentClientId)?.username || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs opacity-70">Top Level</p>
              <p className="font-medium text-sm truncate">
                {topLevelNodes.length > 0 ? topLevelNodes[0].username : 'N/A'}
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

  return (
    <div className="rounded-xl overflow-hidden bg-[#001030] shadow-lg">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-800">
        <button
          className={`flex-1 py-3 text-center font-medium text-sm ${activeTab === 'stats' ? 'bg-[#001849] text-white' : 'text-gray-400'}`}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
        <button
          className={`flex-1 py-3 text-center font-medium text-sm ${activeTab === 'hierarchy' ? 'bg-[#001849] text-white' : 'text-gray-400'}`}
          onClick={() => setActiveTab('hierarchy')}
        >
          Hierarchy
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {activeTab === 'stats' ? renderStatistics() : renderHierarchy()}
      </div>
    </div>
  );
}