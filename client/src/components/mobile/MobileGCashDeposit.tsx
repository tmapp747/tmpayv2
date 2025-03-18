import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import QRCode from 'react-qr-code';

const formSchema = z.object({
  amount: z.string().min(1, "Amount is required").transform(value => {
    const numberValue = Number(value);
    return !isNaN(numberValue) ? numberValue : 0;
  }),
});

export const MobileGCashDeposit: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [qrData, setQrData] = useState<{ 
    qrContent: string; 
    payUrl: string; 
    referenceId: string;
    transactionId: number;
  } | null>(null);
  const [processing, setProcessing] = useState(false);

  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '100',
    },
  });

  // Generate QR code mutation
  const generateQrMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await fetch('/api/payments/gcash/generate-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate QR code');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setQrData({
        qrContent: data.qrContent,
        payUrl: data.payUrl,
        referenceId: data.referenceId,
        transactionId: data.transactionId,
      });
      // Start polling the payment status
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Function to check payment status
  const checkPaymentStatus = async () => {
    if (!qrData?.referenceId) return;
    
    try {
      setProcessing(true);
      const response = await fetch(`/api/payments/gcash/status/${qrData.referenceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }

      const data = await response.json();
      if (data.status === 'completed' || data.status === 'success') {
        toast({
          title: 'Payment Completed',
          description: 'Your GCash payment has been processed successfully!',
        });
        setQrData(null);
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      } else if (data.status === 'failed' || data.status === 'expired') {
        toast({
          title: 'Payment Failed',
          description: 'Your GCash payment has failed or expired. Please try again.',
          variant: 'destructive',
        });
        setQrData(null);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setProcessing(false);
    }
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (values.amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount greater than 0',
        variant: 'destructive',
      });
      return;
    }

    generateQrMutation.mutate(values.amount);
  };

  // Reset form
  const handleReset = () => {
    setQrData(null);
    form.reset();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>GCash Deposit</CardTitle>
        <CardDescription>Deposit funds via GCash QR code</CardDescription>
      </CardHeader>
      <CardContent>
        {!qrData ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (PHP)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter amount" 
                        type="number" 
                        min="1"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full"
                disabled={generateQrMutation.isPending}
              >
                {generateQrMutation.isPending ? 'Generating QR...' : 'Generate QR Code'}
              </Button>
            </form>
          </Form>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-white p-3 rounded">
              <QRCode 
                value={qrData.qrContent || qrData.payUrl} 
                size={200} 
                className="h-40 w-40"
              />
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Reference: {qrData.referenceId}</p>
              <p className="text-sm font-medium">
                Scan the QR code with your GCash app or click the button below to open GCash
              </p>
            </div>

            <div className="flex flex-col w-full space-y-2">
              <Button
                className="w-full"
                onClick={() => window.open(qrData.payUrl, '_blank')}
              >
                Open in GCash App
              </Button>
              
              <Button
                variant="outline"
                className="w-full" 
                onClick={checkPaymentStatus}
                disabled={processing}
              >
                {processing ? 'Checking...' : 'Check Payment Status'}
              </Button>
              
              <Button
                variant="ghost"
                className="w-full" 
                onClick={handleReset}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MobileGCashDeposit;