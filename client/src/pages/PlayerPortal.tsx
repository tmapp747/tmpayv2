import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import MobileLayout from '@/components/MobileLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Wallet, BarChart3, CalendarClock, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

/**
 * Player Portal page with specialized features for players
 */
export default function PlayerPortal() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    balance: 300,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    vipLevel: 1,
    vipPoints: 240,
    lastDeposit: '2023-03-15',
    lastWithdrawal: '2023-03-10',
    totalGames: 56,
    totalWins: 24,
    totalLosses: 32,
  });

  useEffect(() => {
    // Set page title and document name
    document.title = 'Player Portal | 747ph.live';
    
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
    <MobileLayout title="Player Portal" gradient={true}>
      {/* Player Information Card */}
      <div className="mb-6 px-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4.5C10.6193 4.5 9.5 5.61929 9.5 7C9.5 8.38071 10.6193 9.5 12 9.5C13.3807 9.5 14.5 8.38071 14.5 7C14.5 5.61929 13.3807 4.5 12 4.5Z" fill="white"/>
                  <path d="M12 11.5C9.49997 11.5 7.5 13.5 7.5 16V20.5H16.5V16C16.5 13.5 14.5 11.5 12 11.5Z" fill="white"/>
                </svg>
              </div>
              <div>
                <span className="block font-bold">{user.username}</span>
                <span className="text-xs text-blue-300">747ph.live</span>
              </div>
            </CardTitle>
            <CardDescription className="text-blue-100/70">
              Player Dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-white/10 p-3 rounded-lg">
                <div className="text-xs text-blue-100/70 mb-1">Balance</div>
                <div className="font-bold text-lg">₱ {user.balance}</div>
              </div>
              <div className="bg-white/10 p-3 rounded-lg">
                <div className="text-xs text-blue-100/70 mb-1">VIP Level</div>
                <div className="font-bold text-lg">Level {stats.vipLevel}</div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-white/10 pt-3 flex justify-between">
            <div className="text-sm text-blue-100/70">VIP Points: <span className="text-white font-bold">{stats.vipPoints}</span></div>
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

      {/* Quick Actions */}
      <div className="mb-6 px-4">
        <h2 className="text-lg font-medium text-white mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <ActionButton 
            icon={<ArrowUpRight className="h-5 w-5" />}
            title="Deposit"
            color="green"
          />
          <ActionButton 
            icon={<ArrowDownRight className="h-5 w-5" />}
            title="Withdraw"
            color="amber"
          />
          <ActionButton 
            icon={<Wallet className="h-5 w-5" />}
            title="Transfer"
            color="blue"
          />
          <ActionButton 
            icon={<BarChart3 className="h-5 w-5" />}
            title="History"
            color="purple"
          />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mb-6 px-4">
        <h2 className="text-lg font-medium text-white mb-3">Recent Activity</h2>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <TransactionItem 
              type="deposit"
              amount={200}
              date="Today, 14:25"
              status="completed"
            />
            <TransactionItem 
              type="game"
              amount={-50}
              date="Today, 12:10"
              status="completed"
              game="Lucky Spin"
            />
            <TransactionItem 
              type="deposit"
              amount={150}
              date="Yesterday, 20:35"
              status="completed"
            />
            <TransactionItem 
              type="withdraw"
              amount={-100}
              date="Mar 18, 15:20"
              status="completed"
            />
          </div>
        )}
        
        <div className="mt-4 text-center">
          <Button variant="outline" size="sm" className="border-white/20 text-white/70 hover:text-white bg-white/5 hover:bg-white/10">
            View All Activity
          </Button>
        </div>
      </div>

      {/* Gaming Stats */}
      <div className="mb-8 px-4">
        <h2 className="text-lg font-medium text-white mb-3">Gaming Stats</h2>
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-blue-100/70 mb-1">Games</div>
              <div className="font-bold text-lg text-white">{stats.totalGames}</div>
            </div>
            <div>
              <div className="text-xs text-blue-100/70 mb-1">Wins</div>
              <div className="font-bold text-lg text-emerald-400">{stats.totalWins}</div>
            </div>
            <div>
              <div className="text-xs text-blue-100/70 mb-1">Losses</div>
              <div className="font-bold text-lg text-red-400">{stats.totalLosses}</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex justify-between items-center">
              <div className="text-xs text-blue-100/70">Win Rate</div>
              <div className="font-medium text-sm text-white">{((stats.totalWins / stats.totalGames) * 100).toFixed(1)}%</div>
            </div>
            <div className="mt-2 bg-white/10 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full" 
                style={{ width: `${(stats.totalWins / stats.totalGames) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Domain Indicator */}
      <div className="text-center mb-4 px-4">
        <div className="py-2 px-4 bg-blue-500/20 inline-block rounded-full text-blue-300 text-xs font-medium">
          747ph.live
        </div>
      </div>
    </MobileLayout>
  );
}

// Action Button Component
function ActionButton({ icon, title, color }) {
  const colors = {
    blue: "bg-blue-500/20 text-blue-300",
    green: "bg-emerald-500/20 text-emerald-300",
    purple: "bg-purple-500/20 text-purple-300",
    amber: "bg-amber-500/20 text-amber-300",
  };

  return (
    <motion.div 
      whileTap={{ scale: 0.95 }}
      className={`${colors[color]} rounded-xl p-3 flex flex-col items-center justify-center text-center h-24 backdrop-blur-sm border border-white/10 cursor-pointer`}
    >
      <div className="mb-2">{icon}</div>
      <div className="font-medium">{title}</div>
    </motion.div>
  );
}

// Transaction Item Component
function TransactionItem({ type, amount, date, status, game = null }) {
  // Set up icon and colors based on transaction type
  let icon = <Wallet className="h-5 w-5" />;
  let color = "text-blue-400";
  let bgColor = "bg-blue-500/10";
  let sign = "";
  
  if (type === "deposit") {
    icon = <ArrowUpRight className="h-5 w-5" />;
    color = "text-emerald-400";
    bgColor = "bg-emerald-500/10";
    sign = "+";
  } else if (type === "withdraw") {
    icon = <ArrowDownRight className="h-5 w-5" />;
    color = "text-amber-400";
    bgColor = "bg-amber-500/10";
  } else if (type === "game") {
    icon = <BarChart3 className="h-5 w-5" />;
    color = amount > 0 ? "text-emerald-400" : "text-red-400";
    bgColor = amount > 0 ? "bg-emerald-500/10" : "bg-red-500/10";
    sign = amount > 0 ? "+" : "";
  }

  // Format status label
  let statusIcon = null;
  let statusColor = "text-white/50";
  
  if (status === "pending") {
    statusIcon = <Clock className="h-3 w-3 mr-1" />;
    statusColor = "text-amber-300";
  } else if (status === "completed") {
    statusColor = "text-white/50";
  } else if (status === "failed") {
    statusColor = "text-red-400";
  }

  return (
    <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/10">
      <div className="flex items-center">
        <div className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center mr-3`}>
          <div className={color}>{icon}</div>
        </div>
        <div className="flex-1">
          <div className="flex justify-between">
            <div className="font-medium text-white capitalize">{type}</div>
            <div className={color}>{sign}₱{Math.abs(amount)}</div>
          </div>
          <div className="flex justify-between mt-1">
            <div className="text-xs text-white/50">{game ? game : date}</div>
            <div className={`text-xs ${statusColor} flex items-center`}>
              {statusIcon}{status}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}