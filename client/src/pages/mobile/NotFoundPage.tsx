import React from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center p-4 text-white">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-xl p-8 flex flex-col items-center gap-6 shadow-lg border border-white/20">
        <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-10 w-10 text-yellow-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-center">Page Not Found</h1>
        
        <p className="text-center text-white/70">
          Sorry, the page you are looking for doesn't exist or has been moved.
        </p>
        
        <div className="w-full mt-4">
          <Button 
            onClick={() => navigate('/mobile')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}