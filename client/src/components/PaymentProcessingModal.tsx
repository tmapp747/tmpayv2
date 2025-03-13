import { Loader, CheckIcon } from "lucide-react";

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-primary w-full max-w-md mx-4 rounded-xl overflow-hidden shadow-2xl border border-secondary/30">
        <div className="p-5">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto bg-secondary/20 rounded-full flex items-center justify-center mb-4">
              <Loader className="text-secondary text-3xl h-8 w-8 animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-white" id="processStatus">Processing Payment...</h3>
            <p className="text-gray-300 mt-2" id="processMessage">Please wait while we verify your payment with DirectPay.</p>
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
                  <div className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-secondary transition-all duration-500 w-2/3"></div>
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
                    <div className="w-6 h-6 mx-auto bg-gray-600 rounded-full flex items-center justify-center mb-1">
                      <Loader className="text-gray-400 text-xs h-3 w-3 animate-spin" />
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
