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
      <Card className="mb-6 overflow-hidden border-2 border-emerald-700/30 relative" 
         style={{ 
           background: 'linear-gradient(145deg, rgba(5, 45, 35, 0.9), rgba(4, 50, 40, 0.8))',
           boxShadow: '0 10px 25px rgba(16, 185, 129, 0.15), 0 10px 10px rgba(0, 0, 0, 0.1), 0 0 30px rgba(16, 185, 129, 0.1)'
         }}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3"
                style={{
                  boxShadow: '0 10px 25px rgba(16, 185, 129, 0.1), inset 0 2px 5px rgba(255, 255, 255, 0.05)'
                }}>
              <AlertCircle className="h-10 w-10 text-yellow-300/80" 
                style={{ filter: 'drop-shadow(0 2px 5px rgba(0, 0, 0, 0.4))' }} />
              
              {/* Decorative animated ring */}
              <div className="absolute inset-0 rounded-full border border-yellow-500/20 animate-ping opacity-60"></div>
            </div>
            <h3 className="text-lg font-medium mb-1 text-emerald-200" style={{textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'}}>
              Error Loading Transactions
            </h3>
            <p className="text-emerald-300/80 text-sm max-w-md" style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'}}>
              There was a problem fetching your transaction history. Please try again later.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4 bg-emerald-800/50 border-emerald-600/30 text-emerald-100 hover:bg-emerald-700/60 hover:text-yellow-300"
              onClick={() => window.location.reload()}
              style={{
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 0 15px rgba(16, 185, 129, 0.1)',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
              }}>
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
        <div key={i} className={`flex items-center justify-between p-3 ${i % 2 === 0 ? 'bg-emerald-900/30' : 'bg-emerald-950/20'} 
        border-b border-emerald-800/30 last:border-0`}>
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-emerald-800/50 flex items-center justify-center mr-3"
                 style={{
                   boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
                 }}>
              <Skeleton className="h-6 w-6 rounded-full bg-emerald-700/60" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-1 bg-emerald-700/40" />
              <Skeleton className="h-3 w-16 bg-emerald-700/30" />
            </div>
          </div>
          <div className="text-right">
            <Skeleton className="h-5 w-16 mb-1 bg-emerald-700/40" />
            <Skeleton className="h-3 w-12 bg-emerald-700/30 rounded-full" />
          </div>
        </div>
      ));
    }
    
    if (!data?.transactions?.length) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center relative">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-yellow-500/5 opacity-70"></div>
          
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
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center relative"
                  style={{
                    boxShadow: '0 10px 25px rgba(16, 185, 129, 0.15), inset 0 2px 5px rgba(255, 255, 255, 0.05)',
                    transform: 'translateZ(20px)'
                  }}>
                <SearchX className="h-12 w-12 text-emerald-300/50" 
                        style={{ filter: 'drop-shadow(0 2px 5px rgba(0, 0, 0, 0.3))' }} />
                
                {/* Decorative animated ring */}
                <div className="absolute inset-0 rounded-full border border-yellow-500/20 animate-ping opacity-60"></div>
              </div>
            </motion.div>
            
            <h3 className="text-base font-medium mb-1 text-emerald-200" 
                style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)' }}>
              No Transactions Found
            </h3>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-emerald-300/80 text-sm max-w-xs px-4 mx-auto"
              style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}
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
                className="bg-emerald-800/50 border-emerald-600/30 text-emerald-100 hover:bg-emerald-700/60 hover:text-yellow-300"
                style={{
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 0 15px rgba(16, 185, 129, 0.1)',
                  transform: 'translateZ(0)',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
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
        ? 'text-emerald-400 bg-emerald-500/20' 
        : isWithdraw 
          ? 'text-yellow-400 bg-yellow-500/20' 
          : 'text-emerald-300 bg-emerald-500/15';
      
      const methodBg = transaction.method.includes('gcash') 
        ? 'bg-emerald-500/20 text-emerald-400' 
        : transaction.method.includes('crypto') 
          ? 'bg-yellow-500/20 text-yellow-400' 
          : 'bg-emerald-800/30 text-emerald-300';
      
      return (
        <motion.div 
          key={transaction.id} 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`flex items-center justify-between p-3 ${index % 2 === 0 ? 'bg-emerald-900/30' : 'bg-emerald-950/20'} 
                    border-b border-emerald-800/30 last:border-0 hover:bg-emerald-800/40 transition-all duration-200 relative`}
          style={{
            boxShadow: index % 2 === 0 ? 'inset 0 1px 1px rgba(0, 0, 0, 0.1), inset 0 -1px 0 rgba(255, 255, 255, 0.02)' : ''
          }}
        >
          {/* Hover highlight effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          
          <div className="flex items-center relative z-10">
            <div 
              className={`w-10 h-10 rounded-full ${typeColor} flex items-center justify-center mr-3 relative`}
              style={{
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
                transform: 'translateZ(5px)'
              }}
            >
              {/* Subtle glow effect */}
              <div className="absolute inset-0 rounded-full bg-white opacity-10"></div>
              
              {transaction.type.includes('deposit') 
                ? <Wallet className="h-5 w-5" style={{filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))'}} />
                : transaction.type.includes('withdraw')
                  ? <ArrowUpDown className="h-5 w-5" style={{filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))'}} />
                  : <ArrowRightLeft className="h-5 w-5" style={{filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))'}} />
              }
            </div>
            <div>
              <p className="font-medium text-sm text-emerald-200" style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)'}}>
                {transaction.type.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </p>
              <p className="text-xs text-emerald-300/70 flex items-center">
                <Clock className="h-3 w-3 mr-1 inline text-emerald-400/80" />
                {formatDate(transaction.createdAt)}
              </p>
            </div>
          </div>
          
          <div className="text-right relative z-10">
            <p 
              className={`font-medium ${
                isWithdraw ? 'text-yellow-300' : 'text-emerald-300'
              }`}
              style={{
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
                filter: `drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2))`
              }}
            >
              {isWithdraw ? '-' : '+'}{formatCurrency(transaction.amount)}
            </p>
            <span 
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-800/60 border border-emerald-600/30 text-emerald-100`}
              style={{
                boxShadow: '0 3px 6px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
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
