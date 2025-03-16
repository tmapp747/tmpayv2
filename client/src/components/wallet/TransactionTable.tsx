import { useQuery } from "@tanstack/react-query";
import { transactionsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, getStatusColor, getTransactionTypeIcon, getTransactionTypeColor } from "@/lib/utils";
import { Transaction } from "@/lib/types";
import { motion } from "framer-motion";
import { useState } from "react";
import { 
  ArrowUpDown, 
  Calendar, 
  Download, 
  Filter, 
  History, 
  Loader2, 
  Search,
  AlertCircle,
  Wallet,
  ArrowRightLeft
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TransactionTable = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const { data, isLoading, error } = useQuery<{ transactions: Transaction[] }>({
    queryKey: ['/api/transactions'],
  });
  
  // Handle different filter options
  const getFilteredTransactions = () => {
    if (!data?.transactions) return [];
    
    let filtered = [...data.transactions];
    
    // Apply filter by type
    if (filter !== 'all') {
      filtered = filtered.filter(tx => tx.type.includes(filter));
    }
    
    // Apply search term (if any)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.type.toLowerCase().includes(term) ||
        tx.method.toLowerCase().includes(term) ||
        tx.status.toLowerCase().includes(term) ||
        (tx.paymentReference && tx.paymentReference.toLowerCase().includes(term))
      );
    }
    
    // Apply sorting (newest/oldest)
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
    });
    
    return filtered;
  };
  
  if (error) {
    return (
      <Card className="mb-6 border-2 border-green-800/40 rounded-xl overflow-hidden"
           style={{
             background: 'linear-gradient(145deg, rgba(2, 6, 9, 0.95), rgba(9, 24, 16, 0.97))',
             boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4), 0 5px 10px rgba(0, 0, 0, 0.2), 0 0 20px rgba(16, 185, 129, 0.1)', 
             transform: 'translateZ(0)'
           }}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive/60 mb-3" 
                         style={{filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'}} />
            <h3 className="text-lg font-medium mb-2" style={{textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'}}>
              Error Loading Transactions
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mb-4">
              There was a problem fetching your transaction history. Please try again later.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-2 border-secondary/30"
              style={{
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
                transform: 'translateZ(0)',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
              }}
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const filteredTransactions = getFilteredTransactions();
  
  return (
    <Card className="mb-6 border-2 border-slate-600/30 rounded-xl overflow-hidden relative"
         style={{
           background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.65), rgba(15, 23, 42, 0.7))',
           boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 5px 10px rgba(0, 0, 0, 0.15), 0 0 30px rgba(56, 189, 248, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.05)', 
           transform: 'translateZ(0)',
           backdropFilter: 'blur(10px)'
         }}>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/15 via-blue-400/10 to-amber-300/10 opacity-75 pointer-events-none"></div>
      
      <CardHeader className="pb-2 relative">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg flex items-center text-sky-200" style={{textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'}}>
            <History className="h-5 w-5 mr-2 text-amber-400" style={{filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.3))'}} />
            Transaction History
          </CardTitle>
          
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-sky-400/80" />
              <Input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..." 
                className="pl-8 h-9 w-full sm:w-[160px] text-sm border-2 border-slate-600/30 bg-slate-800/50 text-white"
                style={{
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.1), 0 0 10px rgba(56, 189, 248, 0.15)',
                  background: 'linear-gradient(to right, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.7))'
                }}
              />
            </div>
            
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger 
                className="h-9 w-[130px] border-2 border-slate-600/30 bg-slate-800/50 text-white text-sm"
                style={{
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.1), 0 0 10px rgba(56, 189, 248, 0.15)',
                  background: 'linear-gradient(to right, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.7))'
                }}
              >
                <Filter className="h-3.5 w-3.5 mr-2 text-amber-400/80" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent className="border-slate-700/50 bg-slate-900/90">
                <SelectItem value="all" className="text-white">All Types</SelectItem>
                <SelectItem value="deposit" className="text-white">Deposits</SelectItem>
                <SelectItem value="withdraw" className="text-white">Withdrawals</SelectItem>
                <SelectItem value="transfer" className="text-white">Transfers</SelectItem>
                <SelectItem value="casino" className="text-white">Casino</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')}
              className="h-9 border-2 border-slate-600/30 bg-slate-800/50 text-sky-300"
              style={{
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.1), 0 0 10px rgba(56, 189, 248, 0.15)',
                background: 'linear-gradient(to right, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.7))'
              }}
            >
              <Calendar className="h-3.5 w-3.5 mr-2 text-amber-400/90" />
              {sortDirection === 'desc' ? 'Newest' : 'Oldest'}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              className="h-9 border-2 border-slate-600/30 bg-slate-800/50 text-sky-300"
              style={{
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.1), 0 0 10px rgba(56, 189, 248, 0.15)',
                background: 'linear-gradient(to right, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.7))'
              }}
            >
              <Download className="h-3.5 w-3.5 mr-2 text-amber-400/90" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 relative">
        <div className="overflow-x-auto">
          <table className="w-full divide-y-2 divide-slate-700/30" style={{
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          }}>
            <thead className="bg-slate-800/50" style={{background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.6), rgba(30, 41, 59, 0.5))'}}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-sky-300 tracking-wider" 
                   style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'}}>
                  <div className="flex items-center">
                    Type
                    <ArrowUpDown className="ml-1 h-3 w-3 text-amber-400/90" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-sky-300 tracking-wider"
                   style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'}}>
                  <div className="flex items-center">
                    Date
                    <ArrowUpDown className="ml-1 h-3 w-3 text-amber-400/90" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-sky-300 tracking-wider"
                   style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'}}>
                  Method
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-sky-300 tracking-wider"
                   style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'}}>
                  <div className="flex items-center justify-end">
                    Amount
                    <ArrowUpDown className="ml-1 h-3 w-3 text-amber-400/90" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-sky-300 tracking-wider"
                   style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'}}>
                  Status
                </th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-green-900/20" style={{background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.6), rgba(2, 12, 8, 0.5))'}}>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse bg-black/30 backdrop-blur-sm">
                    <td className="px-4 py-4"><div className="h-4 bg-green-900/30 rounded w-20"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-green-900/30 rounded w-24"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-green-900/30 rounded w-16"></div></td>
                    <td className="px-4 py-4 text-right"><div className="h-4 bg-green-900/30 rounded w-16 ml-auto"></div></td>
                    <td className="px-4 py-4 text-right"><div className="h-4 bg-green-900/30 rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : !filteredTransactions.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="h-10 w-10 text-green-500/40 mb-3" style={{filter: 'drop-shadow(0 0 5px rgba(34, 197, 94, 0.2))'}} />
                      <p className="text-green-300/70">No transactions found</p>
                      <p className="text-xs text-green-300/50 mt-1">
                        {filter !== 'all' 
                          ? `Try changing your filter or search criteria` 
                          : `Your transaction history will appear here when you make transactions`}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction, index) => {
                  const isDeposit = transaction.type.includes('deposit');
                  const isWithdraw = transaction.type.includes('withdraw');
                  
                  return (
                    <motion.tr 
                      key={transaction.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`hover:bg-green-900/10 relative ${index % 2 === 0 ? 'bg-black/40' : 'bg-black/20'}`}
                      style={{
                        boxShadow: index % 2 === 0 ? 'inset 0 1px 0 rgba(255, 255, 255, 0.02), inset 0 -1px 0 rgba(0, 0, 0, 0.1)' : '',
                        isolation: 'isolate',
                        backdropFilter: 'blur(5px)'
                      }}
                    >
                      {/* Hover highlight effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0"></div>
                      
                      <td className="px-4 py-4 relative z-10">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${getTransactionTypeColor(transaction.type)}`}
                               style={{boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1)'}}>
                            {transaction.type.includes('deposit') ? 
                              <Wallet className="h-4 w-4" style={{filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2))'}} /> : 
                              transaction.type.includes('withdraw') ? 
                              <ArrowUpDown className="h-4 w-4" style={{filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2))'}} /> : 
                              <ArrowRightLeft className="h-4 w-4" style={{filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2))'}} />
                            }
                          </div>
                          <span className="font-medium text-sm" style={{textShadow: '0 1px 1px rgba(0, 0, 0, 0.2)'}}>
                            {transaction.type.split('_').map((word: string) => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-4 py-4 relative z-10">
                        <span className="text-sm">
                          {formatDate(transaction.createdAt)}
                        </span>
                      </td>
                      
                      <td className="px-4 py-4 relative z-10">
                        <span className="text-sm capitalize">
                          {transaction.method.replace('_', ' ')}
                        </span>
                      </td>
                      
                      <td className="px-4 py-4 text-right whitespace-nowrap relative z-10">
                        <span className={`font-medium ${
                          isWithdraw ? 'text-red-500' : isDeposit ? 'text-green-500' : 'text-blue-500'
                        }`} style={{
                          textShadow: '0 1px 1px rgba(0, 0, 0, 0.2)',
                          filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1))'
                        }}>
                          {isWithdraw ? '-' : isDeposit ? '+' : ''}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      
                      <td className="px-4 py-4 text-right relative z-10">
                        <span 
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}
                          style={{
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                            textShadow: '0 1px 1px rgba(0, 0, 0, 0.2)'
                          }}
                        >
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Table footer with pagination */}
        <div className="px-4 py-3 border-t border-green-900/30 flex items-center justify-between relative"
             style={{
               background: 'linear-gradient(0deg, rgba(4, 20, 12, 0.8), rgba(2, 12, 8, 0.7))',
               boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.02)'
             }}>
          <div className="text-xs text-green-300/70">
            Showing <span className="font-medium text-green-300">{filteredTransactions.length}</span> transactions
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="h-8 px-3 border-2 border-green-800/40 bg-black/50 text-green-400/70"
                    style={{
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 0 5px rgba(16, 185, 129, 0.1)',
                    }}
                    disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" className="h-8 px-3 border-2 border-green-800/40 bg-black/50 text-green-400/70"
                    style={{
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 0 5px rgba(16, 185, 129, 0.1)',
                    }}
                    disabled>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionTable;