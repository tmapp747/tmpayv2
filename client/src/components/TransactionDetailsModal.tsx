import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, Copy, ExternalLink, File, FileText, QrCode, RefreshCcw, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PAYMENT_STATUS, TRANSACTION_TYPES } from "@/lib/constants";
import { apiRequest } from "@/lib/api-client";
import QRCode from "react-qr-code";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/StatusBadge";
import { Timeline } from "@/components/Timeline";

type TransactionDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  transactionId: number | null;
};

export function TransactionDetailsModal({ isOpen, onClose, transactionId }: TransactionDetailsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("details");
  const [showQRFullscreen, setShowQRFullscreen] = useState(false);

  // Fetch transaction details when transaction ID changes
  const { data, isLoading, error, refetch } = useQuery<{
    success: boolean;
    transaction: any;
    qrPayment?: any;
    telegramPayment?: any;
    manualPayment?: any;
    statusHistory: Array<{ status: string; timestamp: string; note?: string }>;
  }>({
    queryKey: [`/api/transactions/${transactionId}`, transactionId],
    queryFn: async () => {
      if (!transactionId) return { success: false, transaction: null, statusHistory: [] };
      // Fix the parameter order - method should be first, then URL
      const response = await apiRequest('GET', `/api/transactions/${transactionId}`);
      const data = await response.json();
      console.log('Transaction details response:', data);
      return data;
    },
    enabled: !!transactionId && isOpen,
    refetchInterval: 10000, // Poll every 10 seconds for any status updates
  });

  const transaction = data?.transaction;
  const qrPayment = data?.qrPayment;
  const paymentMethod = transaction?.method;
  const statusHistory = transaction?.statusHistory || [];

  // Automatic polling for pending transactions to check for status updates
  useEffect(() => {
    if (!transaction) return;
    
    // Only poll for pending transactions
    if (transaction.status === "pending" || 
        transaction.status === "processing" || 
        (transaction.metadata?.casinoTransferStatus === "pending" && transaction.status === "payment_completed")) {
      const interval = setInterval(() => {
        refetch();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [transaction, refetch]);

  // Handle QR code copying
  const copyQRCodeData = () => {
    if (qrPayment?.qrCodeData) {
      navigator.clipboard.writeText(qrPayment.qrCodeData);
      toast({
        title: "Copied!",
        description: "QR code data copied to clipboard",
      });
    }
  };

  // Handle payment URL opening
  const openPaymentURL = () => {
    if (qrPayment?.payUrl) {
      window.open(qrPayment.payUrl, '_blank');
    }
  };

  // Handle manual payment completion
  const markAsCompleted = async () => {
    try {
      const reference = transaction?.paymentReference || transaction?.reference;
      if (!reference) {
        toast({
          title: "Error",
          description: "No valid payment reference found",
          variant: "destructive",
        });
        return;
      }
      
      const response = await apiRequest('POST', '/api/payments/mark-as-completed', {
        paymentReference: reference
      });
      
      const result = await response.json();
      if (result.success) {
        toast({
          title: "Success!",
          description: "Payment marked as completed",
        });
        // Invalidate transaction queries to reflect the change
        queryClient.invalidateQueries({
          queryKey: [`/api/transactions/${transactionId}`],
        });
        queryClient.invalidateQueries({
          queryKey: ['/api/transactions'],
        });
      }
    } catch (err) {
      console.error('Error marking payment as completed:', err);
      toast({
        title: "Error",
        description: "Failed to mark payment as completed",
        variant: "destructive",
      });
    }
  };

  // Handle transaction cancellation
  const cancelTransaction = async () => {
    try {
      const reference = transaction?.paymentReference || transaction?.reference;
      if (!reference) {
        toast({
          title: "Error",
          description: "No valid payment reference found",
          variant: "destructive",
        });
        return;
      }
      
      const response = await apiRequest('POST', `/api/payments/cancel/${reference}`);
      
      const result = await response.json();
      if (result.success) {
        toast({
          title: "Success!",
          description: "Payment was canceled",
        });
        // Invalidate transaction queries to reflect the change
        queryClient.invalidateQueries({
          queryKey: [`/api/transactions/${transactionId}`],
        });
        queryClient.invalidateQueries({
          queryKey: ['/api/transactions'],
        });
      }
    } catch (err) {
      console.error('Error canceling payment:', err);
      toast({
        title: "Error",
        description: "Failed to cancel payment",
        variant: "destructive",
      });
    }
  };
  
  // Function to check if QR code is expired
  const isQRExpired = () => {
    if (!qrPayment?.expiresAt) return false;
    const expiry = new Date(qrPayment.expiresAt);
    return expiry < new Date();
  };

  // Show QR code if applicable for this transaction
  const showQRCode = qrPayment?.qrCodeData && (
    transaction?.status === "pending" || 
    transaction?.status === "processing" || 
    transaction?.status === "payment_completed"
  );

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent className="bg-emerald-950 border border-emerald-700/30 text-emerald-50 p-0 overflow-hidden max-w-md md:max-w-lg">
          <div className="p-5 text-center">
            <RefreshCcw className="h-8 w-8 text-emerald-400 mx-auto animate-spin mb-3" />
            <p>Loading transaction details...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !transaction) {
    return (
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent className="bg-emerald-950 border border-emerald-700/30 text-emerald-50 p-0 overflow-hidden max-w-md md:max-w-lg">
          <div className="p-5 text-center">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
            <p>Error loading transaction details. Please try again.</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="bg-emerald-950 border border-emerald-700/30 text-emerald-50 p-0 overflow-hidden max-w-md md:max-w-lg">
        <DialogHeader className="p-5 border-b border-emerald-700/30">
          <DialogTitle className="text-lg font-semibold text-emerald-100 flex items-center justify-between">
            <span className="flex items-center">
              {transaction.type === TRANSACTION_TYPES.DEPOSIT 
                ? "Deposit" 
                : transaction.type === TRANSACTION_TYPES.WITHDRAW 
                  ? "Withdrawal" 
                  : "Transaction"} Details
              <StatusBadge status={transaction.status} className="ml-3" />
            </span>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/50" 
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        {/* Tabs for transaction details */}
        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full border-b border-emerald-700/30 bg-emerald-900/30 rounded-none p-0">
            <TabsTrigger 
              value="details" 
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-400 data-[state=active]:bg-transparent text-emerald-300 data-[state=active]:text-emerald-100 hover:text-emerald-100 transition-all"
            >
              Details
            </TabsTrigger>
            <TabsTrigger 
              value="timeline" 
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-400 data-[state=active]:bg-transparent text-emerald-300 data-[state=active]:text-emerald-100 hover:text-emerald-100 transition-all"
            >
              Timeline
            </TabsTrigger>
            {showQRCode && (
              <TabsTrigger 
                value="qrcode" 
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-400 data-[state=active]:bg-transparent text-emerald-300 data-[state=active]:text-emerald-100 hover:text-emerald-100 transition-all"
              >
                QR Code
              </TabsTrigger>
            )}
          </TabsList>
          
          {/* Details Tab */}
          <TabsContent value="details" className="p-5 space-y-4 mt-0">
            <div className="grid grid-cols-1 gap-4">
              {/* Transaction ID and Reference */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-emerald-400 mb-1">Transaction ID</p>
                  <p className="text-sm font-medium text-emerald-100">{transaction.id}</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-400 mb-1">Reference</p>
                  <p className="text-sm font-medium text-emerald-100 flex items-center">
                    {(transaction.paymentReference || transaction.reference || "").substring(0, 12)}... 
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 ml-1 hover:bg-emerald-800/50"
                      onClick={() => {
                        const referenceValue = transaction.paymentReference || transaction.reference || "";
                        navigator.clipboard.writeText(referenceValue);
                        toast({
                          title: "Copied!",
                          description: "Reference copied to clipboard",
                        });
                      }}
                    >
                      <Copy className="h-3 w-3 text-emerald-300" />
                    </Button>
                  </p>
                </div>
              </div>
              
              {/* Amount and Status */}
              <div className="bg-emerald-900/40 rounded-lg p-4 border border-emerald-700/30">
                <h3 className="text-lg font-bold text-emerald-100">
                  {formatCurrency(parseFloat(transaction.amount), transaction.currency || "PHP")}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-emerald-300">
                    {transaction.type === TRANSACTION_TYPES.DEPOSIT ? "Deposit" : "Withdrawal"}
                  </span>
                  <Badge 
                    className={`
                      ${transaction.status === "completed" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
                      ${transaction.status === "payment_completed" ? "bg-yellow-600 hover:bg-yellow-700 text-white" : ""}
                      ${transaction.status === "pending" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
                      ${transaction.status === "processing" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""}
                      ${transaction.status === "failed" ? "bg-red-600 hover:bg-red-700 text-white" : ""}
                      ${transaction.status === "expired" ? "bg-gray-600 hover:bg-gray-700 text-white" : ""}
                    `}
                  >
                    {transaction.status === "payment_completed" ? "Awaiting Transfer" : transaction.status}
                  </Badge>
                </div>
              </div>
              
              {/* Payment Method */}
              <div>
                <p className="text-xs text-emerald-400 mb-1">Payment Method</p>
                <p className="text-sm font-medium text-emerald-100">
                  {paymentMethod === "gcash" ? "GCash" : 
                   paymentMethod === "paygram" ? "Paygram" :
                   paymentMethod === "manual" ? "Manual Bank Transfer" :
                   paymentMethod || "Unknown"}
                </p>
              </div>
              
              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-emerald-400 mb-1">Created</p>
                  <p className="text-sm font-medium text-emerald-100">
                    {formatDate(new Date(transaction.createdAt))}
                  </p>
                </div>
                {transaction.updatedAt && (
                  <div>
                    <p className="text-xs text-emerald-400 mb-1">Last Updated</p>
                    <p className="text-sm font-medium text-emerald-100">
                      {formatDate(new Date(transaction.updatedAt))}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Payment completed timestamp if available */}
              {transaction.metadata?.paymentCompletedAt && (
                <div>
                  <p className="text-xs text-emerald-400 mb-1">Payment Completed</p>
                  <p className="text-sm font-medium text-emerald-100">
                    {formatDate(new Date(transaction.metadata.paymentCompletedAt))}
                  </p>
                </div>
              )}
              
              {/* Casino transfer status if available */}
              {transaction.metadata?.casinoTransferStatus && (
                <div>
                  <p className="text-xs text-emerald-400 mb-1">Casino Transfer</p>
                  <div className="flex items-center">
                    <Badge 
                      className={`
                        ${transaction.metadata.casinoTransferStatus === "completed" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
                        ${transaction.metadata.casinoTransferStatus === "pending" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
                        ${transaction.metadata.casinoTransferStatus === "failed" ? "bg-red-600 hover:bg-red-700 text-white" : ""}
                      `}
                    >
                      {transaction.metadata.casinoTransferStatus}
                    </Badge>
                    
                    {transaction.metadata.casinoTransferStatus === "completed" && transaction.metadata.casinoTransferTimestamp && (
                      <span className="text-xs text-emerald-300 ml-2">
                        {formatDate(new Date(transaction.metadata.casinoTransferTimestamp))}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Action buttons based on payment status */}
              <div className="flex flex-col gap-2 mt-2">
                {/* GCash payment specific section */}
                {qrPayment && transaction.status === "pending" && !isQRExpired() && (
                  <Alert className="bg-yellow-900/30 border-yellow-700/50 text-yellow-100">
                    <AlertDescription className="text-xs">
                      Complete this payment by scanning the QR code in the GCash app.
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Manual payment completion button (for users to manually mark as completed) */}
                {transaction.status === "pending" && (
                  <Button 
                    variant="outline" 
                    onClick={markAsCompleted}
                    className="bg-emerald-800/50 border-emerald-600/30 hover:bg-emerald-700/50 hover:text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    I've Completed This Payment
                  </Button>
                )}
                
                {/* Cancel payment button */}
                {(transaction.status === "pending" || transaction.status === "processing") && (
                  <Button 
                    variant="outline" 
                    onClick={cancelTransaction}
                    className="bg-red-900/30 border-red-700/30 hover:bg-red-800/50 text-red-200 hover:text-white"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel Payment
                  </Button>
                )}
                
                {/* Show QR Code Button */}
                {showQRCode && (
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("qrcode")}
                    className="bg-emerald-800/50 border-emerald-600/30 hover:bg-emerald-700/50 hover:text-white"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    View QR Code
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Timeline Tab */}
          <TabsContent value="timeline" className="p-5 space-y-4 mt-0">
            {statusHistory.length > 0 ? (
              <Timeline items={statusHistory.map((item: any, index: number) => ({
                id: index,
                title: item.status,
                description: item.note || "",
                timestamp: new Date(item.timestamp),
                icon: item.status === "completed" ? CheckCircle :
                      item.status === "payment_completed" ? CheckCircle :
                      item.status === "pending" ? Clock :
                      item.status === "processing" ? RefreshCcw :
                      item.status === "failed" ? AlertCircle :
                      item.status === "expired" ? X :
                      FileText
              }))} />
            ) : (
              <p className="text-sm text-emerald-400">No status history available</p>
            )}
          </TabsContent>
          
          {/* QR Code Tab */}
          {showQRCode && (
            <TabsContent value="qrcode" className="p-5 space-y-4 mt-0">
              <div className="flex flex-col items-center">
                {/* QR Code Display */}
                <div className={`
                  p-4 bg-white rounded-lg 
                  ${isQRExpired() ? 'opacity-50' : ''}
                `}>
                  {qrPayment?.qrCodeData ? (
                    <QRCode
                      value={qrPayment.qrCodeData}
                      size={200}
                      className="mx-auto"
                    />
                  ) : (
                    <div className="h-[200px] w-[200px] bg-gray-200 rounded flex items-center justify-center">
                      <AlertCircle className="h-10 w-10 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Expiry Warning */}
                {isQRExpired() && (
                  <Alert className="bg-red-900/30 border-red-700/50 text-red-100 mt-4">
                    <AlertDescription className="text-xs">
                      This QR code has expired. Please create a new payment.
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Pay URL and QR Code Data */}
                <div className="w-full mt-4 space-y-3">
                  {/* Pay URL Button */}
                  {qrPayment?.payUrl && !isQRExpired() && (
                    <Button 
                      onClick={openPaymentURL}
                      className="w-full bg-emerald-700 hover:bg-emerald-600"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Payment URL
                    </Button>
                  )}
                  
                  {/* Copy QR Code Data */}
                  {qrPayment?.qrCodeData && !isQRExpired() && (
                    <Button 
                      variant="outline" 
                      onClick={copyQRCodeData}
                      className="w-full border-emerald-600/30 bg-emerald-800/50 hover:bg-emerald-700/50"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy QR Code Data
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}