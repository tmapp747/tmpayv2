import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";
import { Loader2, ExternalLink, QrCode, RefreshCw, AlertCircle } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';

interface QrPayment {
  id: number;
  userId: number;
  transactionId: number;
  qrCodeData: string;
  payUrl: string;
  amount: string | number;
  expiresAt: string;
  directPayReference: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Transaction {
  id: number;
  userId: number;
  type: string;
  method: string;
  amount: string;
  status: string;
  paymentReference: string;
  createdAt: string;
}

/**
 * Card component that checks for any active QR payments and allows users
 * to resume an incomplete payment session
 */
export default function ActiveQRPaymentCard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Query for active QR payments
  const { 
    data, 
    isLoading, 
    isError, 
    refetch 
  } = useQuery<{ 
    success: boolean, 
    hasActivePayment: boolean, 
    qrPayment?: QrPayment, 
    transaction?: Transaction 
  }>({
    queryKey: ['/api/payments/active-qr'],
    retry: 1,
    refetchOnWindowFocus: false,
  });
  
  // No active QR payments
  if (isLoading) {
    return (
      <Card className="w-full mb-4 border-dashed border-muted animate-pulse">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">Checking for active payments...</span>
        </CardContent>
      </Card>
    );
  }
  
  // Error checking for active QR payments
  if (isError) {
    return null; // Don't show anything on error
  }
  
  // No active QR payment found
  if (!data?.hasActivePayment || !data.qrPayment) {
    return null; // Don't show anything if no active payment
  }
  
  // We have an active payment, calculate time remaining
  const qrPayment = data.qrPayment;
  const transaction = data.transaction;
  const expiresAt = new Date(qrPayment.expiresAt);
  const now = new Date();
  const isExpired = now > expiresAt;
  
  // Format the time remaining until expiry
  const timeRemaining = isExpired 
    ? 'Expired' 
    : formatDistanceToNowStrict(expiresAt, { addSuffix: true });
  
  // Handle resuming the payment
  const handleResumePayment = () => {
    if (isExpired) {
      toast({
        title: "Payment Expired",
        description: "This payment link has expired. Please create a new payment.",
        variant: "destructive"
      });
      return;
    }
    
    if (qrPayment.payUrl) {
      // Open the payment URL in a new tab
      window.open(qrPayment.payUrl, '_blank');
      
      // Also navigate to payment status page
      setLocation(`/payment/thank-you?reference=${qrPayment.directPayReference}&amount=${qrPayment.amount}&username=${transaction?.paymentReference?.split('-')[0] || ''}`);
    } else {
      toast({
        title: "Error",
        description: "Payment link not available. Please create a new payment.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Card className="w-full mb-4 border-yellow-500 border-2 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center">
          <QrCode className="h-5 w-5 mr-2 text-yellow-600 dark:text-yellow-400" />
          Active GCash Payment
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Amount:</span>
            <span className="font-medium">{formatCurrency(Number(qrPayment.amount))}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Expires:</span>
            <span className={`text-sm ${isExpired ? 'text-red-500' : 'text-green-600'}`}>
              {timeRemaining}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Reference:</span>
            <span className="text-xs font-mono bg-yellow-100 dark:bg-yellow-900 py-1 px-2 rounded">
              {qrPayment.directPayReference.substring(0, 10)}...
            </span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="w-full space-y-2">
          <Button 
            className="w-full bg-yellow-600 hover:bg-yellow-700" 
            onClick={handleResumePayment}
            disabled={isExpired}
          >
            {isExpired ? (
              <>
                <AlertCircle className="mr-2 h-4 w-4" />
                Expired
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                Resume Payment
              </>
            )}
          </Button>
          
          {isExpired && (
            <Button
              variant="ghost"
              className="w-full text-xs"
              onClick={() => refetch()}
            >
              <RefreshCw className="mr-2 h-3 w-3" />
              Refresh Status
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}