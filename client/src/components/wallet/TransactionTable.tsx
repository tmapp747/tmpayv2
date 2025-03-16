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
  AlertCircle
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
      <Card className="mb-6 border-2 border-secondary/20 rounded-xl overflow-hidden"
           style={{
             boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 5px 10px rgba(0, 0, 0, 0.2)', 
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
    <Card className="mb-6 border-2 border-secondary/20 rounded-xl overflow-hidden relative"
         style={{
           boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 5px 10px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.05)', 
           transform: 'translateZ(0)'
         }}>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 opacity-50 pointer-events-none"></div>
      
      <CardHeader className="pb-2 relative">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg flex items-center" style={{textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'}}>
            <History className="h-5 w-5 mr-2 text-primary" style={{filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.3))'}} />
            Transaction History
          </CardTitle>
          
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..." 
                className="pl-8 h-9 w-full sm:w-[160px] text-sm border-2 border-secondary/20 bg-card/80"
                style={{
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(0, 0, 0, 0.1)'
                }}
              />
            </div>
            
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger 
                className="h-9 w-[130px] border-2 border-secondary/20 bg-card/80 text-sm"
                style={{
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(0, 0, 0, 0.1)'
                }}
              >
                <Filter className="h-3.5 w-3.5 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="deposit">Deposits</SelectItem>
                <SelectItem value="withdraw">Withdrawals</SelectItem>
                <SelectItem value="transfer">Transfers</SelectItem>
                <SelectItem value="casino">Casino</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')}
              className="h-9 border-2 border-secondary/20 bg-card/80"
              style={{
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Calendar className="h-3.5 w-3.5 mr-2" />
              {sortDirection === 'desc' ? 'Newest' : 'Oldest'}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              className="h-9 border-2 border-secondary/20 bg-card/80"
              style={{
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Download className="h-3.5 w-3.5 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 relative">
        <div className="overflow-x-auto">
          <table className="w-full divide-y-2 divide-border/30" style={{
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          }}>
            <thead className="bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground tracking-wider" 
                   style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'}}>
                  <div className="flex items-center">
                    Type
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground tracking-wider"
                   style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'}}>
                  <div className="flex items-center">
                    Date
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground tracking-wider"
                   style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'}}>
                  Method
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground tracking-wider"
                   style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'}}>
                  <div className="flex items-center justify-end">
                    Amount
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground tracking-wider"
                   style={{textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'}}>
                  Status
                </th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-border/20 bg-background/50">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4"><div className="h-4 bg-muted rounded w-20"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-muted rounded w-24"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-muted rounded w-16"></div></td>
                    <td className="px-4 py-4 text-right"><div className="h-4 bg-muted rounded w-16 ml-auto"></div></td>
                    <td className="px-4 py-4 text-right"><div className="h-4 bg-muted rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : !filteredTransactions.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="h-10 w-10 text-muted-foreground/40 mb-3" />
                      <p className="text-muted-foreground">No transactions found</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
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
                      className={`hover:bg-muted/40 relative ${index % 2 === 0 ? 'bg-muted/10' : ''}`}
                      style={{
                        boxShadow: index % 2 === 0 ? 'inset 0 1px 0 rgba(255, 255, 255, 0.02), inset 0 -1px 0 rgba(0, 0, 0, 0.05)' : '',
                        isolation: 'isolate'
                      }}
                    >
                      {/* Hover highlight effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0"></div>
                      
                      <td className="px-4 py-4 relative z-10">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${getTransactionTypeColor(transaction.type)}`}
                               style={{boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1)'}}>
                            {getTransactionTypeIcon(transaction.type)}
                          </div>
                          <span className="font-medium text-sm" style={{textShadow: '0 1px 1px rgba(0, 0, 0, 0.2)'}}>
                            {transaction.type.split('_').map(word => 
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
        <div className="px-4 py-3 border-t border-border/20 flex items-center justify-between relative"
             style={{boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.03)'}}>
          <div className="text-xs text-muted-foreground">
            Showing <span className="font-medium">{filteredTransactions.length}</span> transactions
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="h-8 px-3 border-2 border-secondary/20"
                    style={{
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                    }}
                    disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" className="h-8 px-3 border-2 border-secondary/20"
                    style={{
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
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