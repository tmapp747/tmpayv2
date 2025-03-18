import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowUpRight, ChevronDown, ChevronUp, Eye, Filter, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import TransactionDetailsModal from "./TransactionDetailsModal";

interface Transaction {
  id: number;
  userId: number;
  type: string;
  method: string;
  amount: string;
  status: string;
  paymentReference: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export default function TransactionTable() {
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Query to fetch transactions
  const { data, isLoading, error } = useQuery<{ success: boolean, transactions: Transaction[] }>({
    queryKey: ['/api/transactions'],
    retry: 1,
  });
  
  // No transactions or loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">Error loading transactions</p>
      </div>
    );
  }
  
  if (!data?.transactions || data.transactions.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">No transactions yet</p>
      </div>
    );
  }
  
  // Sort transactions by date (newest first)
  const transactions = [...data.transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  // Helper to determine status badge color
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'expired':
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Expired</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="animate-pulse">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-slate-500 border-slate-500">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Get transaction type and method friendly names
  const getTypeName = (type: string) => {
    switch (type.toLowerCase()) {
      case 'deposit':
        return 'Deposit';
      case 'withdrawal':
        return 'Withdraw';
      case 'transfer':
        return 'Transfer';
      default:
        return type;
    }
  };
  
  const getMethodName = (method: string) => {
    switch (method.toLowerCase()) {
      case 'gcash':
      case 'gcash_qr':
        return 'GCash';
      case 'telegram':
        return 'PHPT';
      case 'manual':
        return 'Manual';
      default:
        return method;
    }
  };
  
  // Open transaction details modal
  const handleViewTransaction = (transactionId: number) => {
    setSelectedTransactionId(transactionId);
    setModalOpen(true);
  };
  
  return (
    <>
      <Table className="border rounded-lg overflow-hidden">
        <TableCaption>Recent transaction history</TableCaption>
        <TableHeader>
          <TableRow className="bg-emerald-900/30 border-b border-emerald-800/30">
            <TableHead className="font-medium text-emerald-100">Date</TableHead>
            <TableHead className="font-medium text-emerald-100">Type</TableHead>
            <TableHead className="font-medium text-emerald-100">Method</TableHead>
            <TableHead className="font-medium text-emerald-100 text-right">Amount</TableHead>
            <TableHead className="font-medium text-emerald-100">Status</TableHead>
            <TableHead className="font-medium text-emerald-100 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow 
              key={transaction.id}
              className="hover:bg-emerald-900/10 border-b border-emerald-900/10 cursor-pointer"
              onClick={() => handleViewTransaction(transaction.id)}
            >
              <TableCell className="font-mono text-xs">
                {formatDate(new Date(transaction.createdAt))}
              </TableCell>
              <TableCell>
                {getTypeName(transaction.type)}
              </TableCell>
              <TableCell>
                {getMethodName(transaction.method)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(Number(transaction.amount))}
              </TableCell>
              <TableCell>
                {getStatusBadge(transaction.status)}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost" 
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewTransaction(transaction.id);
                  }}
                >
                  <Eye size={16} className="text-emerald-500" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Transaction details modal */}
      <TransactionDetailsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        transactionId={selectedTransactionId}
      />
    </>
  );
}