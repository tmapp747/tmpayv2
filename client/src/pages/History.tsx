import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { transactionsApi } from "@/lib/api";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { Transaction } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SearchIcon, FilterIcon } from "lucide-react";

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
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="text-center text-gray-300 py-8">
            Error loading transactions. Please try again later.
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const renderTransactionRows = () => {
    if (isLoading) {
      return Array(5).fill(0).map((_, i) => (
        <tr key={i} className="hover:bg-dark/40">
          <td className="px-4 py-3 text-sm"><Skeleton className="h-4 w-24" /></td>
          <td className="px-4 py-3 text-sm"><Skeleton className="h-4 w-20" /></td>
          <td className="px-4 py-3 text-sm"><Skeleton className="h-4 w-20" /></td>
          <td className="px-4 py-3 text-sm"><Skeleton className="h-4 w-20" /></td>
          <td className="px-4 py-3 text-sm"><Skeleton className="h-4 w-32" /></td>
          <td className="px-4 py-3 text-sm"><Skeleton className="h-6 w-20 rounded-full" /></td>
        </tr>
      ));
    }
    
    const transactions = filteredTransactions();
    
    if (!transactions.length) {
      return (
        <tr>
          <td colSpan={6} className="px-4 py-8 text-center text-gray-300">
            No transactions found matching your filters.
          </td>
        </tr>
      );
    }
    
    return transactions.map((transaction: Transaction) => (
      <tr key={transaction.id} className="hover:bg-dark/40">
        <td className="px-4 py-3 text-sm text-gray-200">
          {formatDate(transaction.createdAt)}
        </td>
        <td className="px-4 py-3 text-sm text-gray-200 capitalize">
          {transaction.type}
        </td>
        <td className="px-4 py-3 text-sm text-gray-200">
          {transaction.method.replace('_', ' ').toUpperCase()}
        </td>
        <td className="px-4 py-3 text-sm text-white font-medium">
          {transaction.type === 'withdraw' 
            ? '-' + formatCurrency(transaction.amount)
            : '+' + formatCurrency(transaction.amount)
          }
        </td>
        <td className="px-4 py-3 text-sm text-gray-200">
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
      <Card className="bg-primary border-secondary/30 shadow-lg mb-6">
        <CardHeader>
          <CardTitle className="text-white text-xl">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Label htmlFor="search" className="text-gray-300 text-sm mb-2 block">Search</Label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Transaction ID, Reference..."
                  className="pl-10 bg-dark/50 border-gray-600 text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="type-filter" className="text-gray-300 text-sm mb-2 block">Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger id="type-filter" className="bg-dark/50 border-gray-600 text-white">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-primary border-gray-600">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdraw">Withdraw</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status-filter" className="text-gray-300 text-sm mb-2 block">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="status-filter" className="bg-dark/50 border-gray-600 text-white">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="bg-primary border-gray-600">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Transaction ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 bg-dark/20">
                {renderTransactionRows()}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default History;
