import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle, Clock, ExternalLink, RefreshCw, AlertCircle, X } from 'lucide-react';

type StatusBadgeProps = {
  status: string;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

export function StatusBadge({ status, className, showIcon = true, size = 'md' }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return {
          color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
          icon: <CheckCircle className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />,
          label: 'Completed'
        };
      case 'payment_completed':
        return {
          color: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          icon: <CheckCircle className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />,
          label: 'Payment Complete'
        };
      case 'pending':
        return {
          color: 'bg-blue-600 hover:bg-blue-700 text-white',
          icon: <Clock className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />,
          label: 'Pending'
        };
      case 'processing':
        return {
          color: 'bg-indigo-600 hover:bg-indigo-700 text-white',
          icon: <RefreshCw className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1 animate-spin`} />,
          label: 'Processing'
        };
      case 'failed':
        return {
          color: 'bg-red-600 hover:bg-red-700 text-white',
          icon: <AlertCircle className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />,
          label: 'Failed'
        };
      case 'expired':
        return {
          color: 'bg-gray-600 hover:bg-gray-700 text-white',
          icon: <X className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />,
          label: 'Expired'
        };
      case 'canceled':
        return {
          color: 'bg-gray-600 hover:bg-gray-700 text-white',
          icon: <X className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />,
          label: 'Canceled'
        };
      default:
        return {
          color: 'bg-gray-600 hover:bg-gray-700 text-white',
          icon: <ExternalLink className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />,
          label: status
        };
    }
  };

  const { color, icon, label } = getStatusConfig(status);
  
  return (
    <Badge 
      className={cn(
        color, 
        size === 'sm' ? 'text-xs py-0 px-2' : 'text-sm py-1', 
        'flex items-center', 
        className
      )}
    >
      {showIcon && icon}
      {size === 'sm' ? label.substring(0, 3) : label}
    </Badge>
  );
}