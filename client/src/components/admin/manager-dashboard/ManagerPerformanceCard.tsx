import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Users, 
  CreditCard, 
  Wallet,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ManagerPerformanceCardProps {
  manager: string;
  totalUsers: number;
  newUsers24h: number;
  totalDeposits: number;
  depositChange: number;
  totalWithdrawals: number;
  withdrawalChange: number;
  activeUsers: number;
  activeUsersChange: number;
  isLoading?: boolean;
  onRefresh?: () => void;
  isSelected?: boolean;
  onSelect?: () => void;
}

export default function ManagerPerformanceCard({
  manager,
  totalUsers,
  newUsers24h,
  totalDeposits,
  depositChange,
  totalWithdrawals,
  withdrawalChange,
  activeUsers,
  activeUsersChange,
  isLoading = false,
  onRefresh,
  isSelected = false,
  onSelect,
}: ManagerPerformanceCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  return (
    <Card 
      className={`overflow-hidden transition-all duration-300 ${
        isSelected 
          ? "border-primary shadow-md ring-1 ring-primary" 
          : "hover:shadow-md"
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">{manager}</CardTitle>
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
            Top Manager
          </Badge>
        </div>
        <CardDescription>
          Casino network performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-1 opacity-70" /> Total Users
            </div>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <div className="flex items-center text-xs">
              {newUsers24h > 0 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">+{newUsers24h} new (24h)</span>
                </>
              ) : (
                <span className="text-muted-foreground">No new users (24h)</span>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4 mr-1 opacity-70" /> Total Deposits
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(totalDeposits)}
            </div>
            <div className="flex items-center text-xs">
              {depositChange > 0 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">+{depositChange}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                  <span className="text-red-500">{depositChange}%</span>
                </>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Wallet className="h-4 w-4 mr-1 opacity-70" /> Total Withdrawals
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(totalWithdrawals)}
            </div>
            <div className="flex items-center text-xs">
              {withdrawalChange < 0 ? (
                <>
                  <ArrowDownRight className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">{withdrawalChange}%</span>
                </>
              ) : (
                <>
                  <ArrowUpRight className="h-3 w-3 text-red-500 mr-1" />
                  <span className="text-red-500">+{withdrawalChange}%</span>
                </>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-1 opacity-70" /> Active Users
            </div>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <div className="flex items-center text-xs">
              {activeUsersChange > 0 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">+{activeUsersChange}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                  <span className="text-red-500">{activeUsersChange}%</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="ml-auto"
          onClick={(e) => {
            e.stopPropagation();
            handleRefresh();
          }}
          disabled={isLoading || isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
}