import { useQuery } from "@tanstack/react-query";
import { transactionsApi } from "@/lib/api";
import { Link } from "wouter";
import { formatCurrency, formatDate, getStatusColor, getTransactionTypeIcon, getTransactionMethodIcon } from "@/lib/utils";
import { Transaction } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { 
  Clock, 
  ArrowRightLeft, 
  ChevronRight, 
  SearchX, 
  AlertCircle,
  Wallet,
  History,
  ArrowUpDown
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const RecentTransactions = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/transactions'],
  });
  
  if (error) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive/60 mb-3" />
            <h3 className="text-lg font-medium mb-1">Error Loading Transactions</h3>
            <p className="text-muted-foreground text-sm max-w-md">
              There was a problem fetching your transaction history. Please try again later.
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const renderTransactionRows = () => {
    if (isLoading) {
      return Array(4).fill(0).map((_, i) => (
        <div key={i} className={`flex items-center justify-between p-3 ${i % 2 === 0 ? 'bg-muted/20' : 'bg-transparent'} border-b border-border/10 last:border-0`}>
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center mr-3">
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div>
            <Skeleton className="h-5 w-16 mb-1" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ));
    }
    
    if (!data?.transactions?.length) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <SearchX className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="text-base font-medium mb-1">No Transactions Found</h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            Your transaction history will appear here once you start using your wallet.
          </p>
        </div>
      );
    }
    
    return data.transactions.filter((transaction: Transaction) => {
      // Make sure we have valid data before displaying
      return transaction && transaction.id && transaction.type;
    }).slice(0, 5).map((transaction: Transaction, index: number) => {
      // Determine type colors and icons
      const isDeposit = transaction.type.includes('deposit');
      const isWithdraw = transaction.type.includes('withdraw');
      const isCasino = transaction.type.includes('casino');
      
      const typeColor = isDeposit 
        ? 'text-green-500 bg-green-500/10' 
        : isWithdraw 
          ? 'text-red-500 bg-red-500/10' 
          : 'text-blue-500 bg-blue-500/10';
      
      const methodBg = transaction.method.includes('gcash') 
        ? 'bg-blue-500/10 text-blue-500' 
        : transaction.method.includes('crypto') 
          ? 'bg-yellow-500/10 text-yellow-500' 
          : 'bg-muted/20 text-muted-foreground';
      
      return (
        <motion.div 
          key={transaction.id} 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`flex items-center justify-between p-3 ${index % 2 === 0 ? 'bg-muted/20' : 'bg-transparent'} border-b border-border/10 last:border-0 hover:bg-muted/30 transition-all duration-200`}
        >
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full ${typeColor} flex items-center justify-center mr-3`}>
              {transaction.type.includes('deposit') 
                ? <Wallet className="h-5 w-5" />
                : transaction.type.includes('withdraw')
                  ? <ArrowUpDown className="h-5 w-5" />
                  : <ArrowRightLeft className="h-5 w-5" />
              }
            </div>
            <div>
              <p className="font-medium text-sm">
                {transaction.type.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </p>
              <p className="text-xs text-muted-foreground flex items-center">
                <Clock className="h-3 w-3 mr-1 inline" />
                {formatDate(transaction.createdAt)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`font-medium ${
              isWithdraw ? 'text-red-500' : 'text-green-500'
            }`}>
              {isWithdraw ? '-' : '+'}{formatCurrency(transaction.amount)}
            </p>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getStatusColor(transaction.status)}`}>
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </span>
          </div>
        </motion.div>
      );
    });
  };

  return (
    <Card className="mb-6 overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <History className="h-5 w-5 mr-2 text-primary" />
            Recent Transactions
          </CardTitle>
          <Link 
            href="/history" 
            className="text-primary text-sm group flex items-center hover:underline transition-all duration-200"
          >
            <span>View All</span>
            <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-hidden">
          {renderTransactionRows()}
        </div>
      </CardContent>
      <CardFooter className="py-3 px-4 flex justify-center border-t border-border/10">
        <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
          <Link href="/history">View Transaction History</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RecentTransactions;
