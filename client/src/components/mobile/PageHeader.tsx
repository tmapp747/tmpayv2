import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'wouter';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
  backPath?: string;
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  showBackButton = true,
  backPath = '/',
  children,
  className = '',
}) => {
  const navigate = useNavigate();
  const [location] = useLocation();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      // Default back behavior
      window.history.back();
    }
  };

  return (
    <div className={`flex items-center justify-between py-4 px-4 ${className}`}>
      <div className="flex items-center">
        {showBackButton && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2" 
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-xl font-bold">{title}</h1>
      </div>
      <div>{children}</div>
    </div>
  );
};

export default PageHeader;