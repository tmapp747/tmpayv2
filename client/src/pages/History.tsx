import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { transactionsApi } from "@/lib/api";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { Transaction } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SearchIcon, FilterIcon, ShieldAlert, FileX } from "lucide-react";

const History = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/transactions'],
  });
  
  // Filter transactions based on search and filters
  const filteredTransactions = () => {
    if (!data?.transactions) return [];
    
    return data.transactions.filter((transaction: Transaction) => {
      // Filter by search term
      const searchMatch = 
        transaction.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.paymentReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.amount.toString().includes(searchTerm.toLowerCase());
      
      // Filter by type
      const typeMatch = filterType === "all" || transaction.type === filterType;
      
      // Filter by status
      const statusMatch = filterStatus === "all" || transaction.status === filterStatus;
      
      return searchMatch && typeMatch && statusMatch;
    });
  };
  
  if (error) {
    return (
      <div className="rounded-xl shadow-lg overflow-hidden mb-6 border border-emerald-700/40 relative"
        style={{
          background: 'linear-gradient(145deg, rgba(5, 45, 35, 0.9), rgba(4, 50, 40, 0.8))',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.15), 0 10px 10px rgba(0, 0, 0, 0.1), 0 0 30px rgba(16, 185, 129, 0.1)'
        }}
      >
        <div className="p-6 relative z-10">
          <div className="text-center text-emerald-200 py-8 flex flex-col items-center justify-center">
            <div className="mb-4 bg-emerald-800/50 rounded-full h-12 w-12 flex items-center justify-center">
              <ShieldAlert className="h-6 w-6 text-yellow-300" />
            </div>
            <p>Error loading transactions. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }
  
  const renderTransactionRows = () => {
    if (isLoading) {
      return Array(5).fill(0).map((_, i) => (
        <tr key={i} className="bg-emerald-900/20">
          <td className="px-4 py-3 text-sm"><Skeleton className="h-4 w-24 bg-emerald-700/30" /></td>
          <td className="px-4 py-3 text-sm"><Skeleton className="h-4 w-20 bg-emerald-700/30" /></td>
          <td className="px-4 py-3 text-sm"><Skeleton className="h-4 w-20 bg-emerald-700/30" /></td>
          <td className="px-4 py-3 text-sm"><Skeleton className="h-4 w-20 bg-emerald-700/30" /></td>
          <td className="px-4 py-3 text-sm"><Skeleton className="h-4 w-32 bg-emerald-700/30" /></td>
          <td className="px-4 py-3 text-sm"><Skeleton className="h-6 w-20 rounded-full bg-emerald-700/30" /></td>
        </tr>
      ));
    }
    
    const transactions = filteredTransactions();
    
    if (!transactions.length) {
      return (
        <tr>
          <td colSpan={6} className="px-4 py-8 text-center">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="bg-emerald-800/40 rounded-full h-10 w-10 flex items-center justify-center">
                <FileX className="h-5 w-5 text-yellow-300" />
              </div>
              <p className="text-emerald-200">No transactions found matching your filters.</p>
            </div>
          </td>
        </tr>
      );
    }
    
    return transactions.map((transaction: Transaction) => (
      <tr key={transaction.id} className="hover:bg-emerald-900/50 transition-colors duration-200">
        <td className="px-4 py-3 text-sm text-emerald-200">
          {formatDate(transaction.createdAt)}
        </td>
        <td className="px-4 py-3 text-sm text-emerald-200 capitalize">
          {transaction.type}
        </td>
        <td className="px-4 py-3 text-sm text-emerald-200">
          {transaction.method.replace('_', ' ').toUpperCase()}
        </td>
        <td className="px-4 py-3 text-sm font-medium">
          {transaction.type === 'withdraw' 
            ? <span className="text-red-300">-{formatCurrency(transaction.amount)}</span>
            : <span className="text-yellow-300 text-shadow-sm">+{formatCurrency(transaction.amount)}</span>
          }
        </td>
        <td className="px-4 py-3 text-sm text-emerald-200">
          {transaction.transactionId || '-'}
        </td>
        <td className="px-4 py-3 text-sm">
          <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(transaction.status)}`}>
            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
          </span>
        </td>
      </tr>
    ));
  };

  return (
    <div>
      {/* Transaction History Card - Enhanced Emerald Theme */}
      <div className="rounded-xl shadow-lg overflow-hidden mb-6 border border-emerald-700/40 relative"
        style={{
          background: 'linear-gradient(145deg, rgba(5, 45, 35, 0.9), rgba(4, 50, 40, 0.8))',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.15), 0 10px 10px rgba(0, 0, 0, 0.1), 0 0 30px rgba(16, 185, 129, 0.1)'
        }}
      >
        {/* Enhanced background glow effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-yellow-400/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-20 w-24 h-24 bg-yellow-300/5 rounded-full blur-2xl"></div>
        
        <div className="p-6 border-b border-emerald-700/30 bg-emerald-900/40 relative z-10">
          <h2 className="text-xl font-semibold text-yellow-300 text-shadow-sm">
            Transaction History
          </h2>
        </div>
        
        <div className="p-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Label htmlFor="search" className="text-emerald-200 text-sm mb-2 block">Search</Label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-300/70 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Transaction ID, Reference..."
                  className="pl-10 bg-emerald-900/40 border-emerald-700/40 text-emerald-100 placeholder:text-emerald-400/50 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/30"
                  style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="type-filter" className="text-emerald-200 text-sm mb-2 block">Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger 
                  id="type-filter" 
                  className="bg-emerald-900/40 border-emerald-700/40 text-emerald-100 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/30"
                  style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)' }}
                >
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-emerald-900/95 border-emerald-700/40 backdrop-blur-sm">
                  <SelectItem value="all" className="text-emerald-100 focus:bg-emerald-800/80 focus:text-yellow-300">All Types</SelectItem>
                  <SelectItem value="deposit" className="text-emerald-100 focus:bg-emerald-800/80 focus:text-yellow-300">Deposit</SelectItem>
                  <SelectItem value="withdraw" className="text-emerald-100 focus:bg-emerald-800/80 focus:text-yellow-300">Withdraw</SelectItem>
                  <SelectItem value="transfer" className="text-emerald-100 focus:bg-emerald-800/80 focus:text-yellow-300">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status-filter" className="text-emerald-200 text-sm mb-2 block">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger 
                  id="status-filter" 
                  className="bg-emerald-900/40 border-emerald-700/40 text-emerald-100 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/30"
                  style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)' }}
                >
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="bg-emerald-900/95 border-emerald-700/40 backdrop-blur-sm">
                  <SelectItem value="all" className="text-emerald-100 focus:bg-emerald-800/80 focus:text-yellow-300">All Statuses</SelectItem>
                  <SelectItem value="completed" className="text-emerald-100 focus:bg-emerald-800/80 focus:text-yellow-300">Completed</SelectItem>
                  <SelectItem value="pending" className="text-emerald-100 focus:bg-emerald-800/80 focus:text-yellow-300">Pending</SelectItem>
                  <SelectItem value="failed" className="text-emerald-100 focus:bg-emerald-800/80 focus:text-yellow-300">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-emerald-800/70">
              <thead>
                <tr className="bg-emerald-900/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-emerald-200 uppercase tracking-wider">Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-emerald-200 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-emerald-200 uppercase tracking-wider">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-emerald-200 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-emerald-200 uppercase tracking-wider">Transaction ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-emerald-200 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-800/40 bg-emerald-950/30">
                {renderTransactionRows()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;
