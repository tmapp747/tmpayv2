import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSwipe } from '@/hooks/use-swipe';
import SuccessScreen from '@/components/mobile/SuccessScreen';
import { 
  CreditCard, 
  Upload, 
  ChevronLeft, 
  X, 
  AlertCircle, 
  Info, 
  CheckCircle,
  Loader2,
  BanknoteIcon
} from 'lucide-react';
import { generateTransactionReference } from '@/lib/utils';

// Manual payment schema
const manualPaymentSchema = z.object({
  amount: z.coerce.number()
    .min(100, "Minimum deposit is ₱100")
    .max(100000, "Maximum deposit is ₱100,000"),
  paymentMethod: z.string()
    .min(1, "Payment method is required"),
  notes: z.string()
    .optional(),
});

type ManualPaymentFormValues = z.infer<typeof manualPaymentSchema>;

// Define payment method type that comes from the API
interface PaymentMethod {
  id: number;
  name: string;
  type: string;
  isActive: boolean;
  accountName: string;
  accountNumber: string;
  bankName?: string | null;
  instructions?: string | null;
}

export default function MobileManualDeposit() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedPaymentMethodDetails, setSelectedPaymentMethodDetails] = useState<PaymentMethod | null>(null);
  
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch available payment methods from the server
  const { data: paymentMethodsData, isLoading: isLoadingPaymentMethods } = useQuery({
    queryKey: ['/api/payment-methods'],
    queryFn: async () => {
      const response = await fetch('/api/payment-methods?isActive=true');
      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }
      return response.json();
    }
  });

  // Setup form
  const form = useForm<ManualPaymentFormValues>({
    resolver: zodResolver(manualPaymentSchema),
    defaultValues: {
      amount: 0,
      paymentMethod: "",
      notes: "",
    },
  });
  
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
    form.setValue("amount", value);
  };

  // Set first payment method as default when data is loaded
  useEffect(() => {
    if (paymentMethodsData?.methods?.length > 0 && !form.watch("paymentMethod")) {
      const firstMethod = paymentMethodsData.methods[0];
      form.setValue("paymentMethod", firstMethod.id.toString());
      setSelectedPaymentMethodDetails(firstMethod);
    }
  }, [paymentMethodsData, form]);

  // Update selected payment method details when payment method changes
  useEffect(() => {
    const methodId = form.watch("paymentMethod");
    if (methodId && paymentMethodsData?.methods) {
      const selectedMethod = paymentMethodsData.methods.find(
        (method: PaymentMethod) => method.id.toString() === methodId
      );
      if (selectedMethod) {
        setSelectedPaymentMethodDetails(selectedMethod);
      }
    }
  }, [form.watch("paymentMethod"), paymentMethodsData]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProofImage(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle form submission
  const onSubmit = async (data: ManualPaymentFormValues) => {
    if (!proofImage) {
      toast({
        title: "Missing proof of payment",
        description: "Please upload a screenshot of your payment",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("amount", data.amount.toString());
      formData.append("paymentMethod", data.paymentMethod);
      if (data.notes) formData.append("notes", data.notes);
      formData.append("proofImage", proofImage);
      formData.append("reference", generateTransactionReference());
      
      const response = await fetch("/api/payments/manual/submit", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit manual payment");
      }
      
      const responseData = await response.json();
      
      // Update success data
      setSuccessData({
        amount: data.amount,
        newBalance: responseData.transaction?.id || "Pending",
        transactionId: responseData.transaction?.id || "Pending",
        timestamp: new Date().toISOString(),
        paymentMethod: selectedPaymentMethodDetails?.name || data.paymentMethod,
      });
      
      setIsSuccess(true);
      
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      
    } catch (error) {
      console.error("Manual payment error:", error);
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
                <CreditCard className="h-4 w-4 mr-2 text-blue-300" />
                Manual Payment Instructions
              </h3>
              <ol className="text-sm text-blue-100 space-y-2 list-decimal pl-5">
                <li>Select or enter your desired amount</li>
                <li>Choose your payment method</li>
                <li>Make payment through your selected method</li>
                <li>Upload a screenshot of your payment receipt</li>
                <li>Submit for manual verification (24-48 hour processing)</li>
              </ol>
              <div className="mt-2 flex items-start bg-blue-900/30 rounded-md p-2 text-xs text-blue-100">
                <Info className="h-4 w-4 mr-2 flex-shrink-0 text-blue-300 mt-0.5" />
                <span>Manual payments require verification by our team and may take up to 48 hours to process.</span>
              </div>
            </div>
            
            {/* Amount Selection */}
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
                        ? "bg-blue-600 border-blue-400 text-white"
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
                  value={form.watch("amount") || ""}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
                      setSelectedAmount(value);
                    } else {
                      setSelectedAmount(null);
                    }
                    form.setValue("amount", e.target.value ? parseFloat(e.target.value) : 0);
                  }}
                  className="w-full bg-white/10 border border-white/20 rounded-lg pl-8 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                  placeholder="Custom amount"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50">₱</span>
              </div>
              
              {form.formState.errors.amount && (
                <p className="mt-1 text-red-400 text-sm flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>
            
            {/* Payment Method Selection */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-3">Payment Method</label>
              
              {isLoadingPaymentMethods ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-400 mr-2" />
                  <span className="text-white/80">Loading payment methods...</span>
                </div>
              ) : paymentMethodsData?.methods?.length > 0 ? (
                <div className="space-y-2">
                  {paymentMethodsData.methods.map((method: PaymentMethod) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => {
                        form.setValue("paymentMethod", method.id.toString());
                        setSelectedPaymentMethodDetails(method);
                      }}
                      className={`w-full p-3 rounded-lg border text-left transition-all flex items-center ${
                        form.watch("paymentMethod") === method.id.toString()
                          ? "bg-blue-600 border-blue-400 text-white"
                          : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                      }`}
                    >
                      <span className="flex-1">{method.name}</span>
                      {form.watch("paymentMethod") === method.id.toString() && (
                        <CheckCircle className="h-5 w-5 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-orange-950/30 p-4 rounded-lg border border-orange-500/30 text-center">
                  <AlertCircle className="h-5 w-5 mx-auto mb-2 text-orange-400" />
                  <p className="text-orange-200 text-sm">No payment methods available</p>
                  <p className="text-orange-200/70 text-xs mt-1">
                    Please try again later or contact support
                  </p>
                </div>
              )}
              
              {form.formState.errors.paymentMethod && (
                <p className="mt-1 text-red-400 text-sm flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {form.formState.errors.paymentMethod.message}
                </p>
              )}
            </div>
            
            {/* Selected Payment Method Details (if available) */}
            {selectedPaymentMethodDetails && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <h4 className="text-sm font-medium text-white/90 mb-2 flex items-center">
                  <BanknoteIcon className="h-4 w-4 mr-2 text-blue-300" />
                  Payment Details
                </h4>
                
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-white/60">Account Name:</span>
                    <span className="text-white col-span-2">{selectedPaymentMethodDetails.accountName}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-white/60">Account Number:</span>
                    <span className="text-white col-span-2">{selectedPaymentMethodDetails.accountNumber}</span>
                  </div>
                  
                  {selectedPaymentMethodDetails.bankName && (
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-white/60">Bank:</span>
                      <span className="text-white col-span-2">{selectedPaymentMethodDetails.bankName}</span>
                    </div>
                  )}
                  
                  {selectedPaymentMethodDetails.instructions && (
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <span className="text-white/60 block mb-1">Instructions:</span>
                      <p className="text-white/90">{selectedPaymentMethodDetails.instructions}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Payment Proof Upload */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-3">Upload Payment Proof</label>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange}
                ref={fileInputRef}
              />
              
              {!previewUrl ? (
                <div 
                  className="border-2 border-dashed border-white/20 rounded-lg p-6 flex flex-col items-center justify-center min-h-[120px] cursor-pointer hover:border-blue-400/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-white/40 mb-2" />
                  <p className="text-sm text-white/60 text-center">
                    Click to upload screenshot of payment
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    JPG, PNG or WEBP (max 5MB)
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <img 
                    src={previewUrl} 
                    alt="Payment proof" 
                    className="w-full h-auto max-h-[200px] object-contain rounded-lg border border-white/20" 
                  />
                  <button
                    type="button"
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                    onClick={() => {
                      setPreviewUrl(null);
                      setProofImage(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              
              {!proofImage && isSubmitting && (
                <p className="mt-1 text-red-400 text-sm flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Please upload proof of your payment
                </p>
              )}
            </div>
            
            {/* Notes Input */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-3">Additional Notes (Optional)</label>
              <textarea
                value={form.watch("notes") || ""}
                onChange={(e) => form.setValue("notes", e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent min-h-[80px] resize-none"
                placeholder="Add any details about your payment..."
              />
            </div>
            
            {/* Submit Button */}
            <button
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting || !paymentMethodsData?.methods?.length}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 py-4 rounded-xl text-white font-medium shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-70 flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : null}
              {isSubmitting ? "Processing..." : "Submit Payment"}
            </button>
            
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