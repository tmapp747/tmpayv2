import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ExternalLink, Copy, Check, QrCode, RefreshCw, Download } from "lucide-react";

interface Transaction {
  id: number;
  userId: number;
  type: string;
  method: string;
  amount: string;
  status: string;
  paymentReference: string;
  createdAt: string;
  metadata?: Record<string, any>;
  updatedAt?: string;
}

interface QrPayment {
  id: number;
  userId: number;
  transactionId: number;
  qrCodeData?: string;
  payUrl?: string;
  amount: string | number;
  expiresAt: string;
  directPayReference: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: number | null;
}

export default function TransactionDetailsModal({ open, onOpenChange, transactionId }: Props) {
  const { toast } = useToast();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [qrPayment, setQrPayment] = useState<QrPayment | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  
  // Fetch transaction details whenever the modal opens with a valid transaction ID
  useEffect(() => {
    if (open && transactionId) {
      fetchTransactionDetails(transactionId);
    } else {
      // Reset state when modal closes
      setTransaction(null);
      setQrPayment(null);
    }
  }, [open, transactionId]);
  
  // Fetch transaction and associated payment details
  const fetchTransactionDetails = async (id: number) => {
    setLoading(true);
    try {
      // Fetch transaction details
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch transaction details');
      }
      
      const data = await response.json();
      setTransaction(data.transaction);
      
      // Check if there's QR payment data
      if (data.qrPayment) {
        setQrPayment(data.qrPayment);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      toast({
        title: "Error",
        description: "Failed to load transaction details",
        variant: "destructive",
      });
      setLoading(false);
    }
  };
  
  // Copy reference to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
    
    toast({
      title: "Copied!",
      description: "Reference copied to clipboard",
    });
  };
  
  // Helper function to open payment URL
  const openPaymentUrl = () => {
    if (qrPayment?.payUrl) {
      window.open(qrPayment.payUrl, '_blank');
    } else {
      toast({
        title: "Error",
        description: "Payment URL not available",
        variant: "destructive",
      });
    }
  };
  
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
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Download QR Code as image
  const downloadQrCode = () => {
    if (!qrPayment?.qrCodeData) {
      toast({
        title: "Error",
        description: "QR code data not available",
        variant: "destructive",
      });
      return;
    }
    
    // Create a temporary canvas to draw the QR code
    const canvas = document.createElement('canvas');
    const qrImage = new Image();
    qrImage.onload = () => {
      canvas.width = qrImage.width;
      canvas.height = qrImage.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(qrImage, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `qr-payment-${transaction?.paymentReference || 'gcash'}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    };
    
    qrImage.src = qrPayment.qrCodeData;
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Transaction Details
            {transaction && getStatusBadge(transaction.status)}
          </DialogTitle>
          <DialogDescription>
            View complete details of your transaction
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-5/6" />
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : transaction ? (
          <div className="space-y-6">
            {/* Basic transaction details */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <span className="font-semibold">{formatCurrency(Number(transaction.amount))}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Type:</span>
                <span>{transaction.type === 'deposit' ? 'Deposit' : transaction.type}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Method:</span>
                <span>{transaction.method === 'gcash' ? 'GCash' : transaction.method}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Date:</span>
                <span>{formatDate(new Date(transaction.createdAt))}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Reference:</span>
                <div className="flex items-center">
                  <span className="text-xs font-mono bg-muted py-1 px-2 rounded mr-2">
                    {transaction.paymentReference}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(transaction.paymentReference)}
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* QR Code section if available */}
            {qrPayment && qrPayment.qrCodeData && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Payment QR Code</h4>
                
                <div className="flex flex-col items-center">
                  <div className="p-2 border rounded-md bg-white">
                    <img 
                      src={qrPayment.qrCodeData} 
                      alt="GCash QR Code" 
                      className="w-44 h-44"
                    />
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-2">
                    <span>Expires: {formatDate(new Date(qrPayment.expiresAt))}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 justify-center">
                  {qrPayment.payUrl && (
                    <Button 
                      className="bg-[#0074E0] hover:bg-[#005BB1] text-white"
                      onClick={openPaymentUrl}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Pay with GCash
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={downloadQrCode}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download QR
                  </Button>
                </div>
              </div>
            )}
            
            {/* Status history if available */}
            {transaction.metadata?.statusHistory && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Status Timeline</h4>
                
                <div className="space-y-2">
                  {transaction.metadata.statusHistory.map((status: any, index: number) => (
                    <div key={index} className="flex items-start text-sm border-l-2 border-emerald-500 pl-3 pb-3">
                      <div>
                        <p className="font-medium">{status.status}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(new Date(status.timestamp))}
                        </p>
                        {status.note && (
                          <p className="text-xs mt-1">{status.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No transaction data available</p>
          </div>
        )}
        
        <DialogFooter className="sm:justify-between">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="mr-auto"
          >
            Close
          </Button>
          
          {transactionId && (
            <Button 
              variant="outline" 
              onClick={() => fetchTransactionDetails(transactionId)}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}