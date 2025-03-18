
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/format';

export const TransactionCard = ({ transaction }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-dark-card rounded-xl p-4 mb-3 border border-gray-800"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${getStatusColor(transaction.status)}`}>
            <Icon name={getStatusIcon(transaction.status)} className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium text-white">{transaction.type}</h3>
            <p className="text-sm text-gray-400">{formatDate(transaction.createdAt)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold text-white">{formatCurrency(transaction.amount)}</p>
          <p className="text-sm text-gray-400">{transaction.status}</p>
        </div>
      </div>
    </motion.div>
  );
};
