import { useState, useEffect } from "react";
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
  Key
} from "lucide-react";
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
  // Include the message field that contains path description
  message?: string;
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
  const { data: hierarchyData, isLoading: hierarchyLoading, error: hierarchyError } = useQuery<{ 
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
    queryKey: ['/api/casino/user-hierarchy'],
    queryFn: async () => {
      if (!userData?.user?.username) throw new Error("Username not available");
      
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
        throw new Error("Failed to fetch hierarchy data");
      }
      
      const json = await response.json();
      // Add detailed logging of response data
      console.log("Hierarchy API Response:", JSON.stringify(json, null, 2));
      return json;
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
    // Add more detailed debugging
    console.log("Hierarchy State:", {
      loading: hierarchyLoading,
      error: hierarchyError,
      data: hierarchyData
    });
    
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
    // Get user role based on hierarchy level
    const getUserRole = (level: number): string => {
      const roles = [
        "Casino Owner",
        "Continental Manager",
        "Country Manager",
        "Regional Manager",
        "City Manager",
        "Area Manager",
        "Agent",
        "Player"
      ];
      
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
      
      // Get the role name
      const roleName = getUserRole(level);
      
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
                <p className="font-medium">{node.username}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs opacity-70">ID: {node.clientId}</p>
                  <span className="text-xs bg-blue-900/60 px-1.5 py-0.5 rounded-sm whitespace-nowrap">{roleName}</span>
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
      
      // Get user's role based on position
      const userRole = userIndex >= 0 ? getUserRole(userIndex) : 'Player';
      
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