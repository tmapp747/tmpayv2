import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { CheckCircle, ChevronLeft, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

interface SuccessScreenProps {
  amount: number;
  transactionId: string;
  timestamp: string;
  completedAt?: string;
  statusUpdatedAt?: string;
  onClose: () => void;
}

export default function SuccessScreen({
  amount,
  transactionId,
  timestamp,
  completedAt,
  statusUpdatedAt,
  onClose
}: SuccessScreenProps) {
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  const copyToClipboard = (text: string, label: string = 'Value') => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: `${label} copied`,
          description: "You can now paste it elsewhere",
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="px-4 pb-6 pt-5 space-y-6"
    >
      <div className="bg-gradient-to-b from-emerald-500/20 to-emerald-600/20 backdrop-blur-md rounded-xl p-6 border border-emerald-500/30 text-center">
        <div className="flex justify-center">
          <div className="bg-emerald-500/30 rounded-full p-3 mb-4">
            <CheckCircle className="h-10 w-10 text-emerald-400" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-1">Payment Successful</h2>
        <p className="text-emerald-200 mb-4">Your deposit has been processed</p>
        
        <div className="bg-white/10 rounded-xl p-4 mb-6">
          <h3 className="text-3xl font-bold text-white">{formatCurrency(amount)}</h3>
          <p className="text-emerald-200 text-sm">Has been added to your balance</p>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
            <div className="text-left">
              <p className="text-xs text-emerald-300 font-medium">Transaction ID</p>
              <p className="text-white text-sm truncate max-w-[180px]">{transactionId}</p>
            </div>
            <button 
              onClick={() => copyToClipboard(transactionId, 'Transaction ID')}
              className="text-emerald-400 hover:text-emerald-300"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
            <div className="text-left">
              <p className="text-xs text-emerald-300 font-medium">Date</p>
              <p className="text-white text-sm">{formatDate(timestamp)}</p>
            </div>
          </div>
          
          {completedAt && (
            <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
              <div className="text-left">
                <p className="text-xs text-emerald-300 font-medium">Completed At</p>
                <p className="text-white text-sm">{formatDate(completedAt)}</p>
              </div>
            </div>
          )}
          
          {statusUpdatedAt && (
            <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
              <div className="text-left">
                <p className="text-xs text-emerald-300 font-medium">Status Updated</p>
                <p className="text-white text-sm">{formatDate(statusUpdatedAt)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <button
        onClick={onClose}
        className="w-full py-3 rounded-xl text-white font-medium bg-blue-600 hover:bg-blue-700 transition-all"
      >
        Return to Wallet
      </button>
      
      <button
        onClick={() => window.location.href = "/mobile/wallet"}
        className="w-full py-3 rounded-xl text-white/70 font-medium border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center mt-2"
      >
        <ChevronLeft className="h-5 w-5 mr-1" />
        Back to Wallet
      </button>
    </motion.div>
  );
}