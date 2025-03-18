import React from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  hideBackButton?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  onBack, 
  hideBackButton = false
}) => {
  const [, navigate] = useLocation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="bg-primary sticky top-0 z-10 border-b border-border/50">
      <div className="container flex items-center h-14 px-4">
        {!hideBackButton && (
          <button 
            onClick={handleBack}
            className="mr-3 text-foreground/70 hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-lg font-semibold text-foreground truncate">
          {title}
        </h1>
      </div>
    </div>
  );
};