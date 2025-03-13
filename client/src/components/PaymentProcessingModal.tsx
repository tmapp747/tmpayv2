import { useState, useEffect } from "react";
import { Loader, CheckIcon, AlertCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { paymentsApi } from "@/lib/api";
import { PAYMENT_STATUS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

interface PaymentProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  reference: string;
}

const PaymentProcessingModal = ({ 
  isOpen, 
  onClose, 
  amount, 
  reference 
}: PaymentProcessingModalProps) => {
  const [status, setStatus] = useState<string>("processing");
  const [progress, setProgress] = useState<number>(66); // 1/3 = initiated, 2/3 = processing, 3/3 = completed
  const [statusMessage, setStatusMessage] = useState<string>("Please wait while we verify your payment with DirectPay.");
  
  const { toast } = useToast();
  
  // Mutation for checking payment status
  const checkPaymentStatusMutation = useMutation({
    mutationFn: (referenceId: string) => paymentsApi.checkPaymentStatus(referenceId),
    onSuccess: (data) => {
      if (data.success) {
        if (data.status === PAYMENT_STATUS.COMPLETED) {
          setStatus("completed");
          setProgress(100);
          setStatusMessage("Payment has been successfully processed!");
        } else if (data.status === PAYMENT_STATUS.FAILED) {
          setStatus("failed");
          setProgress(66);
          setStatusMessage("Payment has failed. Please try again.");
        } else {
          // Still processing
          setStatusMessage("Still waiting for payment confirmation...");
        }
      }
    },
    onError: (error: any) => {
      console.error("Error checking payment status:", error);
      setStatusMessage("Error checking status. Please wait...");
    }
  });
  
  // Check status when modal opens or reference changes
  useEffect(() => {
    if (isOpen && reference) {
      const interval = setInterval(() => {
        checkPaymentStatusMutation.mutate(reference);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [isOpen, reference]);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-primary w-full max-w-md mx-4 rounded-xl overflow-hidden shadow-2xl border border-secondary/30">
        <div className="p-5">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto bg-secondary/20 rounded-full flex items-center justify-center mb-4">
              {status === "completed" ? (
                <CheckIcon className="text-secondary text-3xl h-10 w-10" />
              ) : status === "failed" ? (
                <AlertCircle className="text-red-500 text-3xl h-10 w-10" />
              ) : (
                <Loader className="text-secondary text-3xl h-8 w-8 animate-spin" />
              )}
            </div>
            <h3 className="text-xl font-bold text-white">
              {status === "completed" 
                ? "Payment Successful!" 
                : status === "failed" 
                  ? "Payment Failed" 
                  : "Processing Payment..."}
            </h3>
            <p className="text-gray-300 mt-2">{statusMessage}</p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-dark/30 rounded-lg p-4">
              <div className="flex justify-between mb-1">
                <span className="text-gray-300 text-sm">Payment Reference:</span>
                <span className="text-white font-medium text-sm" id="paymentRef">{reference || "Generating..."}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300 text-sm">Amount:</span>
                <span className="text-white font-medium text-sm" id="paymentAmount">₱ {amount.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="bg-dark/30 rounded-lg p-4">
              <h4 className="text-white text-sm font-medium mb-3">Payment Status</h4>
              <div className="relative">
                {/* Progress Bar */}
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-dark">
                  <div 
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${status === "failed" ? "bg-red-500" : "bg-secondary"}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                {/* Steps */}
                <div className="flex justify-between text-xs text-gray-300">
                  <div className="text-center">
                    <div className="w-6 h-6 mx-auto bg-secondary rounded-full flex items-center justify-center mb-1">
                      <CheckIcon className="text-white text-xs h-3 w-3" />
                    </div>
                    <div>Initiated</div>
                  </div>
                  <div className="text-center">
                    <div className="w-6 h-6 mx-auto bg-secondary rounded-full flex items-center justify-center mb-1">
                      <CheckIcon className="text-white text-xs h-3 w-3" />
                    </div>
                    <div>Processing</div>
                  </div>
                  <div className="text-center">
                    <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center mb-1 
                      ${status === "completed" ? "bg-secondary" : status === "failed" ? "bg-red-500" : "bg-gray-600"}`}
                    >
                      {status === "completed" ? (
                        <CheckIcon className="text-white text-xs h-3 w-3" />
                      ) : status === "failed" ? (
                        <AlertCircle className="text-white text-xs h-3 w-3" />
                      ) : (
                        <Loader className="text-gray-400 text-xs h-3 w-3 animate-spin" />
                      )}
                    </div>
                    <div>Completed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-center">
            <button 
              className="px-4 py-2 bg-dark hover:bg-dark/70 text-white rounded-lg text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessingModal;
