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
  const { data, isLoading, error } = useQuery<{ transactions: Transaction[] }>({
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
        <div className="flex flex-col items-center justify-center py-8 text-center relative">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-70"></div>
          
          <div className="relative z-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20 
              }}
              className="mb-4 relative"
            >
              <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center relative"
                  style={{
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), inset 0 2px 5px rgba(255, 255, 255, 0.05)',
                    transform: 'translateZ(20px)'
                  }}>
                <SearchX className="h-12 w-12 text-muted-foreground/40" 
                        style={{ filter: 'drop-shadow(0 2px 5px rgba(0, 0, 0, 0.2))' }} />
                
                {/* Decorative animated ring */}
                <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping opacity-60"></div>
              </div>
            </motion.div>
            
            <h3 className="text-base font-medium mb-1" 
                style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>
              No Transactions Found
            </h3>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground text-sm max-w-xs px-4 mx-auto"
              style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' }}
            >
              Your transaction history will appear here once you start using your wallet.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4"
            >
              <Button 
                variant="outline" 
                size="sm" 
                asChild
                className="border-2 border-secondary/30"
                style={{
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                  transform: 'translateZ(0)',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                }}
              >
                <Link href="/wallet">Go to Wallet</Link>
              </Button>
            </motion.div>
          </div>
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
          className={`flex items-center justify-between p-3 ${index % 2 === 0 ? 'bg-muted/20' : 'bg-transparent'} 
                    border-b border-border/20 last:border-0 hover:bg-muted/30 transition-all duration-200 relative`}
          style={{
            boxShadow: index % 2 === 0 ? 'inset 0 1px 1px rgba(0, 0, 0, 0.05), inset 0 -1px 0 rgba(255, 255, 255, 0.05)' : ''
          }}
        >
          {/* Hover highlight effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          
          <div className="flex items-center relative z-10">
            <div 
              className={`w-10 h-10 rounded-full ${typeColor} flex items-center justify-center mr-3 relative`}
              style={{
                boxShadow: '0 3px 6px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
                transform: 'translateZ(5px)'
              }}
            >
              {/* Subtle glow effect */}
              <div className="absolute inset-0 rounded-full bg-white opacity-10"></div>
              
              {transaction.type.includes('deposit') 
                ? <Wallet className="h-5 w-5" style={{filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'}} />
                : transaction.type.includes('withdraw')
                  ? <ArrowUpDown className="h-5 w-5" style={{filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'}} />
                  : <ArrowRightLeft className="h-5 w-5" style={{filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'}} />
              }
            </div>
            <div>
              <p className="font-medium text-sm" style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'}}>
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
          
          <div className="text-right relative z-10">
            <p 
              className={`font-medium ${
                isWithdraw ? 'text-red-500' : 'text-green-500'
              }`}
              style={{
                textShadow: '0 1px 1px rgba(0, 0, 0, 0.2)',
                filter: `drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1))`
              }}
            >
              {isWithdraw ? '-' : '+'}{formatCurrency(transaction.amount)}
            </p>
            <span 
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getStatusColor(transaction.status)}`}
              style={{
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                textShadow: '0 1px 1px rgba(0, 0, 0, 0.2)'
              }}
            >
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </span>
          </div>
        </motion.div>
      );
    });
  };

  return (
    <Card className="mb-6 overflow-hidden border-2 border-emerald-700/30 relative" 
         style={{ 
           background: 'linear-gradient(145deg, rgba(5, 45, 35, 0.9), rgba(4, 50, 40, 0.8))',
           boxShadow: '0 10px 25px rgba(16, 185, 129, 0.15), 0 10px 10px rgba(0, 0, 0, 0.1), 0 0 30px rgba(16, 185, 129, 0.1)',
           transform: 'translateZ(0)',
           transition: 'all 0.3s ease',
         }}>
      {/* Enhanced background glow effects */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl"></div>
      <div className="absolute top-10 right-10 w-32 h-32 bg-yellow-400/5 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
      
      <CardHeader className="pb-2 relative">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center text-emerald-200" style={{textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'}}>
            <History className="h-5 w-5 mr-2 text-yellow-400" style={{filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.5))'}} />
            Recent Transactions
          </CardTitle>
          <Link 
            href="/history" 
            className="text-emerald-300 hover:text-yellow-300 text-sm group flex items-center transition-all duration-200 px-3 py-1 rounded-full bg-emerald-800/50 border border-emerald-600/30"
            style={{
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
            }}
          >
            <span>View All</span>
            <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" 
                         style={{filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4))'}} />
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 relative">
        <div className="overflow-hidden">
          {renderTransactionRows()}
        </div>
      </CardContent>
      
      <CardFooter className="py-3 px-4 flex justify-center border-t border-emerald-800/50 relative"
                 style={{
                   boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                 }}>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full sm:w-auto relative bg-emerald-800/50 border-emerald-600/30 text-emerald-100 hover:bg-emerald-700/60 hover:text-yellow-300" 
          asChild
          style={{
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 0 15px rgba(16, 185, 129, 0.1)',
            transform: 'translateZ(0)',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
          }}>
          <Link href="/history">View Transaction History</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RecentTransactions;
