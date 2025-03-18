import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getStatusColor, formatCurrency, getTransactionTypeIcon, truncateText, getTimeAgo } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { PAYMENT_STATUS, TRANSACTION_TYPES } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Copy, ExternalLink, Info, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { StatusBadge } from '@/components/StatusBadge';
import { TransactionDetailsModal } from "./TransactionDetailsModal";

export default function TransactionTable() {
  const { toast } = useToast();
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  // Query for transactions data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/transactions'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Extract transactions from data
  const transactions = data?.transactions || [];
  
  // Handle transaction row click to open details modal
  const handleTransactionClick = (transactionId: number) => {
    setSelectedTransactionId(transactionId);
    setIsDetailsModalOpen(true);
  };
  
  // Handle copy reference to clipboard
  const handleCopyReference = (e: React.MouseEvent, reference: string) => {
    e.stopPropagation(); // Prevent opening modal
    navigator.clipboard.writeText(reference);
    toast({
      title: "Copied!",
      description: "Reference copied to clipboard",
    });
  };
  
  // Loading UI
  if (isLoading) {
    return (
      <Card className="bg-emerald-950 border border-emerald-700/30">
        <CardHeader className="border-b border-emerald-700/30 pb-3">
          <CardTitle className="text-emerald-100 text-lg">
            Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4">
            <div className="space-y-3">
              {[1, 2, 3].map((index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[150px] bg-emerald-800/50" />
                    <Skeleton className="h-3 w-[80px] bg-emerald-800/50" />
                  </div>
                  <Skeleton className="h-8 w-[100px] bg-emerald-800/50" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Error UI
  if (error) {
    return (
      <Card className="bg-emerald-950 border border-emerald-700/30">
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-emerald-100 mb-2">Error Loading Transactions</h3>
            <p className="text-emerald-300 mb-4">
              We couldn't load your transactions. Please try again.
            </p>
            <Button onClick={() => refetch()} variant="outline" className="bg-emerald-800/50 border-emerald-700/30">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Empty state
  if (transactions.length === 0) {
    return (
      <Card className="bg-emerald-950 border border-emerald-700/30">
        <CardContent className="p-6">
          <div className="text-center">
            <Clock className="h-10 w-10 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-emerald-100 mb-2">No Transactions Yet</h3>
            <p className="text-emerald-300">
              Your transaction history will appear here once you make your first deposit.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <>
      <Card className="bg-emerald-950 border border-emerald-700/30">
        <CardHeader className="border-b border-emerald-700/30 pb-3">
          <CardTitle className="text-emerald-100 text-lg">
            Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-emerald-700/30 hover:bg-emerald-900/40">
                  <TableHead className="text-emerald-400">Date</TableHead>
                  <TableHead className="text-emerald-400">Type</TableHead>
                  <TableHead className="text-emerald-400">Method</TableHead>
                  <TableHead className="text-emerald-400">Amount</TableHead>
                  <TableHead className="text-emerald-400">Status</TableHead>
                  <TableHead className="text-emerald-400">Reference</TableHead>
                  <TableHead className="text-emerald-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction: any) => (
                  <TableRow
                    key={transaction.id}
                    className={`cursor-pointer border-emerald-700/30 hover:bg-emerald-900/40 ${getStatusColor(transaction.status)}`}
                    onClick={() => handleTransactionClick(transaction.id)}
                  >
                    <TableCell className="text-emerald-200 text-sm">
                      {getTimeAgo(transaction.createdAt)}
                    </TableCell>
                    <TableCell className="text-emerald-200 text-sm">
                      {transaction.type === TRANSACTION_TYPES.DEPOSIT 
                        ? "Deposit" 
                        : transaction.type === TRANSACTION_TYPES.WITHDRAW 
                          ? "Withdrawal" 
                          : transaction.type}
                    </TableCell>
                    <TableCell className="text-emerald-200 text-sm capitalize">
                      {transaction.method === "gcash" ? "GCash" :
                       transaction.method === "paygram" ? "Paygram" :
                       transaction.method === "manual" ? "Manual" :
                       transaction.method || "Unknown"}
                    </TableCell>
                    <TableCell className="text-emerald-200 text-sm font-medium">
                      {formatCurrency(parseFloat(transaction.amount), transaction.currency || "PHP")}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={transaction.status} size="sm" />
                    </TableCell>
                    <TableCell className="text-emerald-200 text-sm">
                      <div className="flex items-center">
                        <span className="truncate max-w-[80px]">{transaction.reference.substring(0, 10)}...</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-1 hover:bg-emerald-800/50 hover:text-emerald-100"
                          onClick={(e) => handleCopyReference(e, transaction.reference)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-emerald-800/50 hover:text-emerald-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTransactionClick(transaction.id);
                        }}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Transaction Details Modal */}
      <TransactionDetailsModal 
        isOpen={isDetailsModalOpen} 
        onClose={() => setIsDetailsModalOpen(false)} 
        transactionId={selectedTransactionId}
      />
    </>
  );
}