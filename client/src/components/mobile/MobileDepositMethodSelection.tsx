import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { CreditCard, QrCode, Wallet, Repeat, ArrowRight } from 'lucide-react';

// Define payment method types
export type PaymentMethodType = 'gcash' | 'manual' | 'paygram';

interface PaymentMethodOption {
  id: PaymentMethodType;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

interface PaymentMethodCardProps {
  method: PaymentMethodOption;
  onSelect: (methodId: PaymentMethodType) => void;
}

const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({ method, onSelect }) => {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className={`relative rounded-xl overflow-hidden border p-4 cursor-pointer ${method.color}`}
      onClick={() => onSelect(method.id)}
    >
      <div className="flex items-center space-x-3">
        <div className="bg-white/20 p-3 rounded-full">{method.icon}</div>
        <div className="flex-1">
          <h3 className="font-medium text-white text-lg">{method.name}</h3>
          <p className="text-white/70 text-sm">{method.description}</p>
        </div>
        <ArrowRight className="h-5 w-5 text-white/70" />
      </div>
    </motion.div>
  );
};

interface MobileDepositMethodSelectionProps {
  onSelectMethod: (method: PaymentMethodType) => void;
}

export default function MobileDepositMethodSelection({ onSelectMethod }: MobileDepositMethodSelectionProps) {
  const [, navigate] = useLocation();

  // Define payment methods
  const paymentMethods: PaymentMethodOption[] = [
    {
      id: 'gcash',
      name: 'GCash QR',
      icon: <QrCode className="h-6 w-6 text-white" />,
      description: 'Fast processing with QR code payment',
      color: 'bg-gradient-to-r from-blue-600 to-blue-700 border-blue-500/50',
    },
    {
      id: 'manual',
      name: 'Manual Payment',
      icon: <CreditCard className="h-6 w-6 text-white" />,
      description: 'Upload proof of payment for verification',
      color: 'bg-gradient-to-r from-purple-600 to-purple-700 border-purple-500/50',
    },
    {
      id: 'paygram',
      name: 'Paygram',
      icon: <Repeat className="h-6 w-6 text-white" />,
      description: 'Crypto deposits with PHPT/USDT',
      color: 'bg-gradient-to-r from-emerald-600 to-emerald-700 border-emerald-500/50',
    },
  ];

  return (
    <div className="px-4 pb-6 pt-5 space-y-6">
      <div className="bg-white/5 rounded-xl p-4 backdrop-blur-md mb-6">
        <h3 className="font-medium text-white mb-2 flex items-center">
          <Wallet className="h-4 w-4 mr-2 text-blue-300" />
          Choose Payment Method
        </h3>
        <p className="text-sm text-blue-100">
          Select your preferred method to deposit funds to your account
        </p>
      </div>

      <div className="space-y-4">
        {paymentMethods.map((method) => (
          <PaymentMethodCard 
            key={method.id} 
            method={method} 
            onSelect={onSelectMethod} 
          />
        ))}
      </div>
    </div>
  );
}