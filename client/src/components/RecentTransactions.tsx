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
        <tr key={i} className={`${i % 2 === 0 ? 'bg-dark/10' : 'bg-transparent'}`}>
          <td className="px-4 py-4 text-sm">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-dark/20 rounded-full mr-2 animate-pulse"></div>
              <div className="h-4 w-24 animate-shimmer rounded"></div>
            </div>
          </td>
          <td className="px-4 py-4 text-sm">
            <div className="h-6 w-20 bg-dark/20 animate-shimmer rounded-md"></div>
          </td>
          <td className="px-4 py-4 text-sm">
            <div className="h-6 w-28 bg-dark/20 animate-shimmer rounded-md"></div>
          </td>
          <td className="px-4 py-4 text-sm">
            <div className="h-6 w-20 animate-shimmer rounded"></div>
          </td>
          <td className="px-4 py-4 text-sm">
            <div className="h-6 w-20 animate-shimmer rounded-full"></div>
          </td>
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
    
    return data.transactions.slice(0, 4).map((transaction: Transaction, index: number) => (
      <tr 
        key={transaction.id} 
        className={`hover:bg-secondary/5 cursor-pointer transition-all duration-200 transform hover:scale-[1.01] ${index % 2 === 0 ? 'bg-dark/10' : 'bg-transparent'} animate-slideUp`}
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <td className="px-4 py-4 text-sm text-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-dark/30 mr-2">
              {transaction.type.includes('deposit') ? (
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              ) : transaction.type.includes('withdraw') ? (
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              )}
            </div>
            <span>{formatDate(transaction.createdAt)}</span>
          </div>
        </td>
        <td className="px-4 py-4 text-sm text-gray-200 capitalize">
          <span className="bg-dark/20 px-2 py-1 rounded-md">{transaction.type.replace('_', ' ')}</span>
        </td>
        <td className="px-4 py-4 text-sm font-medium">
          <span className="text-white bg-dark/20 px-2 py-1 rounded-md flex items-center w-fit">
            {transaction.method.includes('gcash') ? (
              <span className="w-3 h-3 rounded-full bg-blue-400 mr-1.5"></span>
            ) : transaction.method.includes('crypto') ? (
              <span className="w-3 h-3 rounded-full bg-yellow-400 mr-1.5"></span>
            ) : (
              <span className="w-3 h-3 rounded-full bg-gray-400 mr-1.5"></span>
            )}
            {transaction.method.replace('_', ' ').toUpperCase()}
          </span>
        </td>
        <td className="px-4 py-4 text-sm font-medium">
          <span className={`${transaction.type === 'withdraw' || transaction.type === 'casino_withdraw' ? 'text-red-400' : 'text-green-400'} text-base`}>
            {transaction.type === 'withdraw' || transaction.type === 'casino_withdraw'
              ? '-' + formatCurrency(transaction.amount)
              : '+' + formatCurrency(transaction.amount)
            }
          </span>
        </td>
        <td className="px-4 py-4 text-sm">
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)} transition-all duration-300 hover:shadow-md hover:opacity-90`}>
            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
          </span>
        </td>
      </tr>
    ));
  };

  return (
    <div className="bg-primary rounded-xl shadow-lg overflow-hidden mb-6 border border-secondary/30 hover:shadow-xl hover:shadow-secondary/5 transition-all duration-300 transform hover:-translate-y-1">
      <div className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg text-white font-medium tracking-wide flex items-center">
            <span className="inline-block w-2 h-8 bg-secondary rounded-r-md mr-2"></span>
            Recent Transactions
          </h2>
          <Link 
            href="/history" 
            className="text-secondary text-sm font-medium group flex items-center hover:text-secondary/80 transition-colors duration-200"
          >
            <span>View All</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="ml-1 transform group-hover:translate-x-1 transition-transform duration-200"
            >
              <path d="M5 12h14"></path>
              <path d="M12 5l7 7-7 7"></path>
            </svg>
          </Link>
        </div>
        
        <div className="overflow-x-auto rounded-lg bg-gradient-to-b from-dark/30 to-dark/10">
          <table className="min-w-full divide-y divide-gray-700/50">
            <thead className="bg-dark/40">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Method</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {renderTransactionRows()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RecentTransactions;
