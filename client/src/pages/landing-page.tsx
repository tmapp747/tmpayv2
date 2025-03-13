import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, Wallet, TrendingUp, ArrowRight, Dices, CreditCard, DollarSign } from "lucide-react";
import casinoLogo from "../assets/Logo teammarc.png";
import casinoBg from "../assets/casino-background.svg";
import { CasinoElements3D } from "@/components/CasinoElements3D";

export default function LandingPage() {
  const [showFloatingElements, setShowFloatingElements] = useState(false);
  
  // Delay the floating elements to ensure proper loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFloatingElements(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="min-h-screen bg-white dark:bg-black relative overflow-hidden">
      {/* Background image with casino-themed elements */}
      <div className="absolute inset-0 z-0">
        {/* Clean solid background with subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-gray-900"></div>
      </div>
      
      {/* Glassmorphism Header - fully responsive with mobile adjustments */}
      <header className="relative w-full h-14 sm:h-16 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200/70 dark:border-gray-800/70 shadow-sm flex items-center px-3 sm:px-4 md:px-8 justify-between">
        {/* Dice confined to header area only */}
        <div className="absolute inset-0 overflow-hidden">
          {showFloatingElements && <CasinoElements3D />}
        </div>
        
        <div className="flex items-center space-x-2 z-10">
          <img src={casinoLogo} alt="747 Casino Logo" className="w-7 h-7 sm:w-8 sm:h-8" />
          <span className="font-medium text-base sm:text-lg text-blue-600 dark:text-blue-400">747 Casino E-Wallet</span>
        </div>
        <div className="z-10">
          <Link href="/auth">
            <Button size="sm" variant="outline" className="glass-card text-xs sm:text-sm border-blue-200/50 dark:border-blue-800/50 shadow-sm hover:shadow-md transition-all duration-300">
              Sign In
            </Button>
          </Link>
        </div>
      </header>
      
      {/* Hero Section with Glassmorphism */}
      <section className="py-12 md:py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/30 to-transparent dark:from-blue-900/10 dark:to-transparent"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="glass-panel inline-block px-8 py-6 mb-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 text-gray-900 dark:text-white">
              <span className="text-blue-600 dark:text-blue-400 relative">
                Casino Financial Gateway
                <span className="absolute -bottom-2 left-0 w-full h-1 bg-blue-500/20 rounded"></span>
              </span>
            </h1>
            <p className="text-gray-800 dark:text-gray-200 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-medium">
              The secure and efficient payment platform designed exclusively for 747 Casino players and agents
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16 relative z-10">
            <Link href="/auth">
              <Button 
                size="lg" 
                className="casino-button text-sm sm:text-base shadow-lg"
              >
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <div className="floating coin hidden md:block absolute -right-12 top-0 w-10 h-10 bg-yellow-400 rounded-full border-4 border-yellow-500 opacity-70">
              <div className="text-center font-bold text-yellow-800">$</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section with Glassmorphism Cards */}
      <section className="relative py-12 md:py-16 px-4 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-black pattern-overlay">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Why Choose Our E-Wallet
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card glass-card-shine p-6 rounded-xl shadow-lg border border-white/20 dark:border-white/5 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-blue-100/80 dark:bg-blue-900/30 flex items-center justify-center mb-4 animate-float backdrop-blur-sm">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Secure Transactions</h3>
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                State-of-the-art encryption and security measures to protect your financial operations
              </p>
            </div>
            
            <div className="glass-card glass-card-shine p-6 rounded-xl shadow-lg border border-white/20 dark:border-white/5 transition-all duration-300 relative overflow-hidden">
              <div className="w-12 h-12 rounded-full bg-blue-100/80 dark:bg-blue-900/30 flex items-center justify-center mb-4 animate-float backdrop-blur-sm" style={{ animationDelay: '0.2s' }}>
                <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Fast Deposits</h3>
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                Instant deposits and quick withdrawals to and from your casino account
              </p>
              <div className="floating dice hidden md:block absolute -right-5 -bottom-5 w-10 h-10 opacity-30">
                <Dices className="h-8 w-8 text-red-500" />
              </div>
            </div>
            
            <div className="glass-card glass-card-shine p-6 rounded-xl shadow-lg border border-white/20 dark:border-white/5 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-blue-100/80 dark:bg-blue-900/30 flex items-center justify-center mb-4 animate-float backdrop-blur-sm" style={{ animationDelay: '0.4s' }}>
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Real-time Updates</h3>
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                Monitor your transactions and balance in real-time with instant notifications
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section with Premium Glass */}
      <section className="py-12 md:py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="premium-glass p-8 md:p-12 rounded-2xl mb-8 inline-block">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900 dark:text-white">
              Ready to manage your casino finances?
            </h2>
            <p className="text-gray-700 dark:text-gray-300 font-medium mb-8">
              Join the secure payment platform for 747 Casino
            </p>
            <div className="relative">
              <Link href="/auth">
                <Button size="lg" className="casino-button text-sm sm:text-base shadow-lg z-10 relative transition-all duration-300">
                  <span className="flex items-center">
                    <CreditCard className="mr-2 h-5 w-5" /> 
                    Create Account
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Glassmorphism Footer */}
      <footer className="py-8 border-t border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-black/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center mb-4">
            <img src={casinoLogo} alt="747 Casino Logo" className="w-8 h-8" />
            <span className="ml-2 font-medium text-blue-600 dark:text-blue-400">747 Casino E-Wallet</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            &copy; {new Date().getFullYear()} 747 Casino. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}