import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useSwipe } from '@/hooks/use-swipe';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import SuccessScreen from '@/components/mobile/SuccessScreen';
import { 
  Repeat, 
  Copy, 
  ExternalLink, 
  ChevronLeft, 
  DollarSign,
  CheckCircle,
  Info
} from 'lucide-react';

export default function MobilePaygramDeposit() {
  const [amount, setAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [invoiceCode, setInvoiceCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Define interface for transaction success data
  interface SuccessData {
    amount: number;
    newBalance: string | number;
    transactionId: string;
    timestamp: string;
    paymentMethod: string;
    statusUpdatedAt?: string;
    completedAt?: string;
  }
  
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  // Setup swipe back gesture
  const swipeHandlers = useSwipe({
    onSwipeRight: () => {
      if (!isSuccess) {
        navigate("/mobile-deposit");
      }
    },
  });
  
  // Handle displaying amounts in the preset buttons
  const formatDisplayAmount = (value: number | null) => {
    if (value === null || value === undefined) {
      return "0";
    }
    return value.toLocaleString(undefined, { minimumFractionDigits: 0 });
  };
  
  const handlePresetAmountClick = (value: number) => {
    setSelectedAmount(value);
    setAmount(value.toString());
  };
  
  // Handle payment URL generation
  const handleGeneratePayment = async () => {
    if (!selectedAmount || selectedAmount < 100) {
      toast({
        title: "Invalid amount",
        description: "Please enter an amount of at least ₱100",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/payments/paygram/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: selectedAmount }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate payment");
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPaymentUrl(data.paymentUrl);
        setReferenceId(data.reference);
        setInvoiceCode(data.invoiceCode);
        
        // Start polling for status updates
        // pollPaymentStatus(data.reference);
      } else {
        throw new Error(data.message || "Failed to generate payment");
      }
    } catch (error) {
      console.error("Payment generation error:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        toast({
          title: "Copied to clipboard",
          description: "You can now paste it in your payment app",
        });
      },
      (err) => {
        console.error("Could not copy text: ", err);
        toast({
          title: "Copy failed",
          description: "Please try again or copy manually",
          variant: "destructive",
        });
      }
    );
  };
  
  // Open payment URL
  const openPaymentUrl = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
    }
  };
  
  // Mock success for demo purposes
  const handleMockSuccess = () => {
    setIsSuccess(true);
    setSuccessData({
      amount: selectedAmount || 0,
      newBalance: "Updated soon",
      transactionId: referenceId || "Unknown",
      timestamp: new Date().toISOString(),
      paymentMethod: "Paygram",
    });
    queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
  };
  
  return (
    <div {...swipeHandlers}>
      <AnimatePresence mode="wait">
        {isSuccess && successData ? (
          <SuccessScreen 
            amount={successData.amount} 
            transactionId={successData.transactionId}
            timestamp={successData.timestamp}
            completedAt={successData.completedAt}
            statusUpdatedAt={successData.statusUpdatedAt}
            onClose={() => navigate("/mobile/wallet")}
          />
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-4 pb-6 pt-5 space-y-6"
          >
            {/* Instructions */}
            <div className="bg-white/5 rounded-xl p-4 backdrop-blur-md">
              <h3 className="font-medium text-white mb-2 flex items-center">
                <Repeat className="h-4 w-4 mr-2 text-blue-300" />
                Paygram Deposit
              </h3>
              <ol className="text-sm text-blue-100 space-y-2 list-decimal pl-5">
                <li>Select or enter your desired amount</li>
                <li>Generate payment link</li>
                <li>Complete the payment through Paygram</li>
                <li>Wait for confirmation (typically within 5-10 minutes)</li>
              </ol>
              <div className="mt-2 flex items-start bg-blue-900/30 rounded-md p-2 text-xs text-blue-100">
                <Info className="h-4 w-4 mr-2 flex-shrink-0 text-blue-300 mt-0.5" />
                <span>Paygram allows deposits with PHPT or USDT crypto tokens</span>
              </div>
            </div>
            
            {/* Amount Selection */}
            {!paymentUrl && (
              <>
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-3">Select Amount</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[100, 250, 500, 1000, 2500, 5000].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => handlePresetAmountClick(amount)}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          selectedAmount === amount
                            ? "bg-emerald-600 border-emerald-400 text-white"
                            : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                        }`}
                      >
                        ₱{formatDisplayAmount(amount)}
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-4 relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          setSelectedAmount(value);
                        } else {
                          setSelectedAmount(null);
                        }
                      }}
                      className="w-full bg-white/10 border border-white/20 rounded-lg pl-8 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent"
                      placeholder="Custom amount"
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50">₱</span>
                  </div>
                </div>
                
                {/* Generate Button */}
                <button
                  onClick={handleGeneratePayment}
                  disabled={isSubmitting || !selectedAmount || selectedAmount < 100}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 py-4 rounded-xl text-white font-medium shadow-md hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-70 flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : null}
                  {isSubmitting ? "Generating..." : "Generate Payment Link"}
                </button>
              </>
            )}
            
            {/* Payment URL Display */}
            {paymentUrl && (
              <div className="space-y-4">
                <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4">
                  <h4 className="text-lg font-medium text-white flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-emerald-400" />
                    Payment Link Ready
                  </h4>
                  <p className="text-sm text-emerald-100 mt-1">
                    Complete your payment with Paygram
                  </p>
                  
                  <div className="mt-4 space-y-3">
                    {/* Invoice Code */}
                    {invoiceCode && (
                      <div className="bg-emerald-950/50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-emerald-300 font-medium">Invoice Code</span>
                          <button
                            onClick={() => copyToClipboard(invoiceCode)}
                            className="text-emerald-400 hover:text-emerald-300"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="text-emerald-50 mt-1 font-mono text-sm break-all">
                          {invoiceCode}
                        </div>
                      </div>
                    )}
                    
                    {/* Amount */}
                    <div className="bg-emerald-950/50 rounded-lg p-3">
                      <span className="text-xs text-emerald-300 font-medium">Amount</span>
                      <div className="text-emerald-50 mt-1 font-medium text-lg">
                        ₱{formatDisplayAmount(selectedAmount)}
                      </div>
                    </div>
                    
                    {/* Open Payment URL Button */}
                    <button
                      onClick={openPaymentUrl}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg flex items-center justify-center font-medium"
                    >
                      <ExternalLink className="h-5 w-5 mr-2" />
                      Open Payment Page
                    </button>
                    
                    {/* For Demo/Testing Only */}
                    <button
                      onClick={handleMockSuccess}
                      className="w-full bg-white/10 hover:bg-white/15 text-white py-3 rounded-lg flex items-center justify-center font-medium mt-6"
                    >
                      <DollarSign className="h-5 w-5 mr-2" />
                      Mark as Paid (Demo)
                    </button>
                  </div>
                </div>
                
                {/* Note */}
                <div className="bg-white/5 rounded-xl p-4 text-sm text-white/80">
                  <p>After completing your payment, please wait for automatic verification. This typically takes 5-10 minutes.</p>
                </div>
                
                {/* Generate New Button */}
                <button
                  onClick={() => {
                    setPaymentUrl(null);
                    setReferenceId(null);
                    setInvoiceCode(null);
                  }}
                  className="w-full py-3 rounded-xl text-white/70 font-medium border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                >
                  Generate New Payment
                </button>
              </div>
            )}
            
            {/* Back Button */}
            <button
              onClick={() => navigate("/mobile-deposit")}
              className="w-full py-3 rounded-xl text-white/70 font-medium border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center mt-2"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back to Payment Methods
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}