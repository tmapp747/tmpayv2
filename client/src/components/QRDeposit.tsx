import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { paymentsApi } from "@/lib/api";
import { 
  formatCurrency, 
  isValidAmount, 
  getTimeRemaining, 
  isDevelopmentMode 
} from "@/lib/utils";
import { DEPOSIT_AMOUNTS, LIMITS, PAYMENT_STATUS } from "@/lib/constants";
import { InfoIcon, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { QrPayment } from "@/lib/types";
import PaymentProcessingModal from "./PaymentProcessingModal";
import SuccessNotificationModal from "./SuccessNotificationModal";

const QRDeposit = () => {
  const [amount, setAmount] = useState<number>(1000);
  const [showProcessingModal, setShowProcessingModal] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [activeQrPayment, setActiveQrPayment] = useState<QrPayment | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [newBalance, setNewBalance] = useState<string | number>(0);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);
  
  // Status check interval reference
  const statusCheckIntervalRef = useRef<number | null>(null);
  
  const { toast } = useToast();
  const inDevMode = isDevelopmentMode();
  
  // Query for user info
  const { data: userData } = useQuery({
    queryKey: ['/api/user/info'],
  });
  
  // Mutation for generating QR code
  const generateQrMutation = useMutation({
    mutationFn: (data: { amount: number }) => paymentsApi.generateQrCode(data),
    onSuccess: (data) => {
      if (data.success) {
        setActiveQrPayment(data.qrPayment);
        toast({
          title: "QR Code Generated",
          description: "Scan this QR code with your GCash app to make a deposit",
        });
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error generating QR code",
        description: error.message || "Something went wrong",
      });
    }
  });
  
  // Mutation for simulating payment completion (for demo purposes)
  const completePaymentMutation = useMutation({
    mutationFn: (directPayReference: string) => paymentsApi.simulatePaymentCompletion(directPayReference),
    onSuccess: (data) => {
      if (data.success) {
        setNewBalance(data.newBalance);
        setShowProcessingModal(false);
        setShowSuccessModal(true);
        // Invalidate user info to refresh balance
        queryClient.invalidateQueries({ queryKey: ['/api/user/info'] });
        queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error processing payment",
        description: error.message || "Something went wrong",
      });
      setShowProcessingModal(false);
    }
  });
  
  // Mutation for checking payment status
  const checkPaymentStatusMutation = useMutation({
    mutationFn: (referenceId: string) => paymentsApi.checkPaymentStatus(referenceId),
    onSuccess: (data) => {
      if (data.success && data.status === PAYMENT_STATUS.COMPLETED) {
        // Payment is complete
        if (data.qrPayment) {
          const paymentAmount = parseFloat(data.qrPayment.amount.toString());
          setNewBalance(userData?.user?.balance || 0);
          setShowProcessingModal(false);
          setShowSuccessModal(true);
          // Clear the status check interval
          if (statusCheckIntervalRef.current) {
            clearInterval(statusCheckIntervalRef.current);
            statusCheckIntervalRef.current = null;
          }
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['/api/user/info'] });
          queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
        }
      } else if (data.status === PAYMENT_STATUS.FAILED) {
        // Payment failed
        toast({
          variant: "destructive",
          title: "Payment Failed",
          description: data.message || "Your payment has failed. Please try again.",
        });
        setShowProcessingModal(false);
        // Clear the status check interval
        if (statusCheckIntervalRef.current) {
          clearInterval(statusCheckIntervalRef.current);
          statusCheckIntervalRef.current = null;
        }
      }
      // For pending status, we continue checking
      setIsCheckingStatus(false);
    },
    onError: (error: any) => {
      console.error("Error checking payment status:", error);
      setIsCheckingStatus(false);
    }
  });
  
  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setAmount(value);
    }
  };
  
  // Handle preset amount clicks
  const handlePresetAmount = (value: number) => {
    setAmount(value);
  };
  
  // Handle generate QR code
  const handleGenerateQR = () => {
    if (!isValidAmount(amount, LIMITS.MIN_DEPOSIT, LIMITS.MAX_DEPOSIT)) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: `Amount must be between ${formatCurrency(LIMITS.MIN_DEPOSIT)} and ${formatCurrency(LIMITS.MAX_DEPOSIT)}`,
      });
      return;
    }
    
    generateQrMutation.mutate({ amount });
  };
  
  // Handle checking payment status
  const startCheckingPaymentStatus = () => {
    if (!activeQrPayment?.directPayReference) return;
    
    setShowProcessingModal(true);
    setIsCheckingStatus(true);
    
    // Check immediately
    checkPaymentStatusMutation.mutate(activeQrPayment.directPayReference);
    
    // Set up interval to check payment status every 5 seconds
    const intervalId = window.setInterval(() => {
      if (activeQrPayment?.directPayReference) {
        checkPaymentStatusMutation.mutate(activeQrPayment.directPayReference);
      } else {
        // Clear interval if no payment is active
        clearInterval(intervalId);
      }
    }, 5000);
    
    // Store interval ID for cleanup
    statusCheckIntervalRef.current = intervalId;
  };
  
  // Handle simulating payment process (only in development mode)
  const handleSimulatePayment = () => {
    if (!activeQrPayment?.directPayReference) return;
    
    setShowProcessingModal(true);
    
    // Simulate processing time then complete the payment
    setTimeout(() => {
      completePaymentMutation.mutate(activeQrPayment.directPayReference!);
    }, 3000);
  };
  
  // Close success modal and reset
  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    setActiveQrPayment(null);
  };
  
  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
      }
    };
  }, []);
  
  // Update timer for QR code expiration
  useEffect(() => {
    if (!activeQrPayment) return;
    
    // Start checking payment status automatically when QR is generated
    startCheckingPaymentStatus();
    
    const interval = setInterval(() => {
      const remaining = getTimeRemaining(activeQrPayment.expiresAt);
      setTimeRemaining(remaining);
      
      if (remaining === "Expired") {
        clearInterval(interval);
        toast({
          variant: "destructive",
          title: "QR Code Expired",
          description: "The QR code has expired. Please generate a new one.",
        });
        setActiveQrPayment(null);
        
        // Clear payment check interval when QR expires
        if (statusCheckIntervalRef.current) {
          clearInterval(statusCheckIntervalRef.current);
          statusCheckIntervalRef.current = null;
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [activeQrPayment, toast]);

  return (
    <>
      <div className="bg-primary rounded-xl shadow-lg overflow-hidden mb-6 border border-secondary/30">
        <div className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg text-white font-medium">QR Code Deposit</h2>
            <div className="bg-accent/20 text-accent px-3 py-1 rounded-full text-sm font-medium">
              <CheckCircle className="h-3 w-3 inline mr-1" /> DirectPay
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row">
            <div className="w-full lg:w-1/2 p-4">
              <p className="text-gray-300 mb-4">
                {activeQrPayment && activeQrPayment.qrCodeData.includes('<iframe') 
                  ? "Complete your GCash payment using the form below to deposit funds to your 747 casino wallet."
                  : "Scan this QR code with your GCash app to make a deposit to your 747 casino wallet."
                }
              </p>
              
              <div className="bg-white p-3 rounded-lg mx-auto max-w-xs qr-scanner">
                <div className="text-center text-dark font-bold mb-2 text-sm">
                  <div className="fas fa-mobile-alt mr-1"></div> GCash Payment
                </div>
                <div className="flex justify-center">
                  {activeQrPayment ? (
                    activeQrPayment.qrCodeData.includes('<iframe') ? (
                      <div className="payment-iframe-container w-full h-72 overflow-hidden">
                        <div 
                          className="w-full h-full"
                          dangerouslySetInnerHTML={{ __html: activeQrPayment.qrCodeData }}
                        />
                        <div className="text-center text-dark text-xs mt-2 bg-accent/10 p-1 rounded">
                          <span className="font-medium">Complete payment in the window above</span>
                        </div>
                      </div>
                    ) : (
                      <img 
                        src={activeQrPayment.qrCodeData} 
                        className="w-44 h-44" 
                        alt="QR Code" 
                      />
                    )
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center bg-gray-200">
                      <span className="text-gray-500 text-sm">
                        Click "Generate QR Code" to start
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-center text-dark text-xs mt-2">
                  Deposit to: {userData?.user?.username || "Loading..."}
                </div>
                {activeQrPayment && (
                  <div className="text-center text-dark text-xs mt-1">
                    Expires in: {timeRemaining}
                  </div>
                )}
              </div>
              
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300 text-sm">Amount:</span>
                  <span className="text-white font-medium">{formatCurrency(amount)}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300 text-sm">Fee:</span>
                  <span className="text-white font-medium">{formatCurrency(0)}</span>
                </div>
                <div className="border-t border-gray-600 my-2"></div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Total:</span>
                  <span className="text-white font-bold">{formatCurrency(amount)}</span>
                </div>
              </div>
            </div>
            
            <div className="w-full lg:w-1/2 p-4 lg:border-l lg:border-gray-700">
              <h3 className="text-md font-medium text-white mb-4">Enter Deposit Amount</h3>
              
              <div className="mb-4">
                <label className="block text-gray-300 text-sm mb-2" htmlFor="amount">
                  Amount (PHP)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white font-medium">₱</span>
                  <Input
                    id="amount"
                    type="number"
                    className="bg-dark/50 border border-gray-600 text-white w-full py-3 px-4 pl-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                    placeholder="0.00"
                    min={LIMITS.MIN_DEPOSIT}
                    max={LIMITS.MAX_DEPOSIT}
                    value={amount}
                    onChange={handleAmountChange}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                {DEPOSIT_AMOUNTS.map((option) => (
                  <Button
                    key={option.value}
                    variant="outline"
                    className="bg-dark/50 hover:bg-dark/80 text-white py-2 rounded-lg border border-gray-600"
                    onClick={() => handlePresetAmount(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              
              <div className="bg-secondary/10 rounded-lg p-3 mb-4">
                <div className="flex items-start">
                  <InfoIcon className="text-secondary mt-1 mr-2 h-4 w-4" />
                  <div className="text-xs text-gray-300">
                    <p className="mb-1">After payment, your balance will be updated automatically within 2 minutes.</p>
                    <p>Minimum: {formatCurrency(LIMITS.MIN_DEPOSIT)} | Maximum: {formatCurrency(LIMITS.MAX_DEPOSIT)}</p>
                  </div>
                </div>
              </div>
              
              {activeQrPayment ? (
                <>
                  {inDevMode ? (
                    <Button
                      className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-3 px-4 rounded-lg shadow-sm transition duration-300"
                      onClick={handleSimulatePayment}
                    >
                      {/* This button is for demo purposes */}
                      Simulate Payment Completion
                    </Button>
                  ) : (
                    <div className="p-3 bg-accent/10 rounded-lg text-center text-sm text-gray-300">
                      <Loader2 className="animate-spin h-5 w-5 inline-block mr-2" />
                      {isCheckingStatus ? (
                        <span>Checking payment status...</span>
                      ) : activeQrPayment?.qrCodeData.includes('<iframe') ? (
                        <span>Complete the payment form to continue</span>
                      ) : (
                        <span>Scan QR code with GCash app to complete payment</span>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <Button
                  className="w-full bg-secondary hover:bg-secondary/90 text-white font-bold py-3 px-4 rounded-lg shadow-sm transition duration-300"
                  onClick={handleGenerateQR}
                  disabled={generateQrMutation.isPending}
                >
                  {generateQrMutation.isPending ? "Generating..." : "Generate QR Code"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment Processing Modal */}
      <PaymentProcessingModal
        isOpen={showProcessingModal}
        onClose={() => setShowProcessingModal(false)}
        amount={amount}
        reference={activeQrPayment?.directPayReference || ""}
      />
      
      {/* Success Notification Modal */}
      <SuccessNotificationModal
        isOpen={showSuccessModal}
        onClose={handleCloseSuccess}
        amount={amount}
        newBalance={newBalance}
        transactionId={`TXN${Math.floor(Math.random() * 10000000)}`}
      />
    </>
  );
};

export default QRDeposit;
