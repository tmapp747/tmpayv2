import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import MobileLayout from '@/components/MobileLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowUpRight, Users, Wallet, PieChart, BarChart3, Calendar, Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

/**
 * Agent Portal page with specialized features for managing players and finances
 */
export default function AgentPortal() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    activeUsers: 23,
    totalTurnover: 158750,
    pendingWithdrawals: 4,
    newSignups: 7,
    totalDeposits: 125000,
    totalWithdrawals: 72000,
  });

  useEffect(() => {
    // Set page title and document name
    document.title = 'Agent Portal | agents.747ph.live';
    
    // Simulate loading stats
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <MobileLayout title="Agent Portal" gradient={true}>
      {/* Agent Information Card */}
      <div className="mb-6 px-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center mr-3">
                <Users size={20} className="text-white" />
              </div>
              <div>
                <span className="block font-bold">{user.username}</span>
                <span className="text-xs text-amber-300">agents.747ph.live</span>
              </div>
            </CardTitle>
            <CardDescription className="text-blue-100/70">
              Agent Dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-white/10 p-3 rounded-lg">
                <div className="text-xs text-blue-100/70 mb-1">Agent Level</div>
                <div className="font-bold text-lg">Gold</div>
              </div>
              <div className="bg-white/10 p-3 rounded-lg">
                <div className="text-xs text-blue-100/70 mb-1">Commission</div>
                <div className="font-bold text-lg">₱ {5200}</div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-white/10 pt-3 flex justify-between">
            <div className="text-sm text-blue-100/70">Players: <span className="text-white font-bold">{stats.activeUsers}</span></div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-blue-200 hover:text-blue-100 p-0 h-auto"
            >
              View Details <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Quick Stats Section */}
      <div className="mb-6 px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-white">Quick Stats</h2>
          <div className="flex items-center gap-1 text-sm text-blue-300">
            <Calendar className="h-4 w-4" />
            <span>Today</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </>
          ) : (
            <>
              <StatsCard 
                title="Active Players"
                value={stats.activeUsers}
                icon={<Users className="h-5 w-5" />}
                change={+3}
                color="blue"
              />
              <StatsCard 
                title="Turnover"
                value={`₱ ${stats.totalTurnover}`}
                icon={<PieChart className="h-5 w-5" />}
                change={+12.5}
                color="green"
              />
              <StatsCard 
                title="New Signups"
                value={stats.newSignups}
                icon={<ArrowUpRight className="h-5 w-5" />}
                change={+2}
                color="purple"
              />
              <StatsCard 
                title="Pending Withdrawals"
                value={stats.pendingWithdrawals}
                icon={<Clock className="h-5 w-5" />}
                change={-1}
                color="amber"
              />
            </>
          )}
        </div>
      </div>

      {/* Agent Actions */}
      <div className="mb-6 px-4">
        <h2 className="text-lg font-medium text-white mb-3">Agent Actions</h2>
        <div className="space-y-3">
          <ActionButton 
            icon={<Users className="h-5 w-5" />}
            title="Manage Players"
            description="View and manage your players"
            color="blue"
          />
          <ActionButton 
            icon={<BarChart3 className="h-5 w-5" />}
            title="Financial Reports"
            description="View detailed financial reports"
            color="green"
          />
          <ActionButton 
            icon={<Wallet className="h-5 w-5" />}
            title="Commission Management"
            description="Track and withdraw commissions"
            color="amber"
          />
          <ActionButton 
            icon={<DollarSign className="h-5 w-5" />}
            title="Bonus Management"
            description="Manage player bonuses and promotions"
            color="purple"
          />
        </div>
      </div>

      {/* Transaction Summary */}
      <div className="mb-8 px-4">
        <h2 className="text-lg font-medium text-white mb-3">Transaction Summary</h2>
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-blue-100/70 mb-1">Total Deposits</div>
              <div className="font-bold text-lg text-emerald-400">₱ {stats.totalDeposits.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-blue-100/70 mb-1">Total Withdrawals</div>
              <div className="font-bold text-lg text-amber-400">₱ {stats.totalWithdrawals.toLocaleString()}</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="text-xs text-blue-100/70 mb-1">Net Position</div>
            <div className="font-bold text-lg text-blue-200">₱ {(stats.totalDeposits - stats.totalWithdrawals).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Domain Indicator */}
      <div className="text-center mb-4 px-4">
        <div className="py-2 px-4 bg-amber-500/20 inline-block rounded-full text-amber-300 text-xs font-medium">
          agents.747ph.live
        </div>
      </div>
    </MobileLayout>
  );
}

// Stats Card Component
function StatsCard({ title, value, icon, change, color }) {
  const colors = {
    blue: "from-blue-500/20 to-blue-600/10 text-blue-300",
    green: "from-emerald-500/20 to-emerald-600/10 text-emerald-300",
    purple: "from-purple-500/20 to-purple-600/10 text-purple-300",
    amber: "from-amber-500/20 to-amber-600/10 text-amber-300",
  };

  const isPositive = change > 0;
  
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-3 backdrop-blur-sm border border-white/10`}>
      <div className="flex justify-between items-start">
        <div className="mb-2">{icon}</div>
        {change !== undefined && (
          <div className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
            {isPositive ? '+' : ''}{change}%
          </div>
        )}
      </div>
      <div className="text-xs text-white/70 mb-1">{title}</div>
      <div className="font-bold text-base text-white">{value}</div>
    </div>
  );
}

// Action Button Component
function ActionButton({ icon, title, description, color }) {
  const colors = {
    blue: "from-blue-500/20 to-blue-600/5",
    green: "from-emerald-500/20 to-emerald-600/5",
    purple: "from-purple-500/20 to-purple-600/5",
    amber: "from-amber-500/20 to-amber-600/5",
  };

  return (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      className={`bg-gradient-to-r ${colors[color]} rounded-xl p-4 border border-white/10 cursor-pointer`}
    >
      <div className="flex items-center">
        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mr-3">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-white font-medium">{title}</h3>
          <p className="text-sm text-blue-100/60">{description}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-white/50" />
      </div>
    </motion.div>
  );
}