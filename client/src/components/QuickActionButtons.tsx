import React from 'react';
import { Link } from 'wouter';
import { ArrowLeftRight, Download, CreditCard } from 'lucide-react';

interface ActionButton {
  icon: React.ElementType;
  label: string;
  path: string;
  color?: string;
}

export default function QuickActionButtons() {
  const actions: ActionButton[] = [
    {
      icon: ArrowLeftRight,
      label: 'Transfer',
      path: '/wallet/transfer',
    },
    {
      icon: Download,
      label: 'Receive',
      path: '/wallet/receive',
    },
    {
      icon: CreditCard,
      label: 'Payment',
      path: '/wallet/payment',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mt-6 px-1">
      {actions.map((action, index) => {
        const Icon = action.icon;
        
        return (
          <Link
            key={index}
            href={action.path}
            className="flex flex-col items-center bg-card-dark py-4 px-2 rounded-xl hover:bg-accent transition-colors"
          >
            <div className="w-12 h-12 flex items-center justify-center bg-primary-dark rounded-lg mb-2">
              <Icon size={22} className="text-primary-light" />
            </div>
            <span className="text-sm font-medium text-white">{action.label}</span>
          </Link>
        );
      })}
    </div>
  );
}