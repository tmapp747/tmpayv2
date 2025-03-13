import { useQuery } from "@tanstack/react-query";
import { transactionsApi } from "@/lib/api";
import { Link } from "wouter";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { Transaction } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

const RecentTransactions = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/transactions'],
  });
  
  if (error) {
    return (
      <div className="bg-primary rounded-xl shadow-lg overflow-hidden mb-6 border border-secondary/30 p-5">
        <div className="text-center text-gray-300 py-8">
          Error loading transactions. Please try again later.
        </div>
      </div>
    );
  }
  
  const renderTransactionRows = () => {
    if (isLoading) {
      return Array(4).fill(0).map((_, i) => (
        <tr key={i} className="hover:bg-dark/40">
          <td className="px-4 py-3 text-sm"><Skeleton className="h-4 w-24" /></td>
          <td className="px-4 py-3 text-sm"><Skeleton className="h-4 w-16" /></td>
          <td className="px-4 py-3 text-sm"><Skeleton className="h-4 w-20" /></td>
          <td className="px-4 py-3 text-sm"><Skeleton className="h-4 w-20" /></td>
          <td className="px-4 py-3 text-sm"><Skeleton className="h-6 w-20 rounded-full" /></td>
        </tr>
      ));
    }
    
    if (!data?.transactions?.length) {
      return (
        <tr>
          <td colSpan={5} className="px-4 py-8 text-center text-gray-300">
            No transactions found.
          </td>
        </tr>
      );
    }
    
    return data.transactions.slice(0, 4).map((transaction: Transaction) => (
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
        <td className="px-4 py-3 text-sm">
          <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(transaction.status)}`}>
            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
          </span>
        </td>
      </tr>
    ));
  };

  return (
    <div className="bg-primary rounded-xl shadow-lg overflow-hidden mb-6 border border-secondary/30">
      <div className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg text-white font-medium">Recent Transactions</h2>
          <Link href="/history" className="text-secondary text-sm font-medium hover:underline">
            View All
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Method</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 bg-dark/20">
              {renderTransactionRows()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RecentTransactions;
