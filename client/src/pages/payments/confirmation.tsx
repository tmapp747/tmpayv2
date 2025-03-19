
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, AlertCircle } from "lucide-react";

export default function PaymentConfirmation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'success' | 'pending' | 'failed'>('pending');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    // Fetch payment status
    const checkPayment = async () => {
      try {
        const response = await fetch(`/api/payments/status/${id}`);
        const data = await response.json();
        setStatus(data.status);
        setAmount(data.amount);
      } catch (error) {
        setStatus('failed');
      }
    };
    
    checkPayment();
  }, [id]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 justify-center">
            {status === 'success' ? (
              <Check className="h-12 w-12 text-green-500" />
            ) : status === 'failed' ? (
              <AlertCircle className="h-12 w-12 text-red-500" />
            ) : (
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            )}
          </div>

          <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">
            {status === 'success' ? 'Payment Successful' : 
             status === 'failed' ? 'Payment Failed' : 
             'Processing Payment'}
          </h1>

          {amount && (
            <p className="text-center text-lg mb-4">
              Amount: ₱{amount}
            </p>
          )}

          <div className="flex justify-center mt-6">
            <Button onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
