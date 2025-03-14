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
        {/* Clean solid background */}
        <div className="absolute inset-0 bg-black"></div>
      </div>
      
      {/* Header - fully responsive with mobile adjustments */}
      <header className="relative w-full h-14 sm:h-16 bg-[#1A1A25] border-b border-gray-800 shadow-sm flex items-center px-3 sm:px-4 md:px-8 justify-between">
        {/* Dice confined to header area only */}
        <div className="absolute inset-0 overflow-hidden">
          {showFloatingElements && <CasinoElements3D />}
        </div>
        
        <div className="flex items-center space-x-2 z-10">
          <img src={casinoLogo} alt="747 Casino Logo" className="w-7 h-7 sm:w-8 sm:h-8" />
          <span className="font-medium text-base sm:text-lg text-blue-600 dark:text-blue-400">747 Casino E-Wallet</span>
        </div>
        <div className="z-10 flex items-center space-x-2">
          <Link href="/admin/auth">
            <Button size="sm" variant="ghost" className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80">
              Admin
            </Button>
          </Link>
          <Link href="/auth">
            <Button size="sm" variant="outline" className="glass-card text-xs sm:text-sm border-blue-200/50 dark:border-blue-800/50 shadow-sm hover:shadow-md transition-all duration-300">
              Sign In
            </Button>
          </Link>
        </div>
      </header>
      
      {/* Hero Section with Dark Gunmetal Background */}
      <section className="py-12 md:py-20 px-4 relative bg-[#161616]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#161616] to-[#101010]"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="px-8 py-6 mb-6 bg-[#1A1A25] border border-gray-800 rounded-xl shadow-lg">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white">
              <span className="text-yellow-400 relative">
                Casino Financial Gateway
                <span className="absolute -bottom-2 left-0 w-full h-1 bg-yellow-400/20 rounded"></span>
              </span>
            </h1>
            <p className="text-gray-200 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-medium">
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
      
      {/* Features Section with Dark Solid Background */}
      <section className="relative py-12 md:py-16 px-4 bg-black border-y border-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-yellow-400">
            Why Choose Our E-Wallet
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl shadow-lg border border-gray-800 bg-black transition-all duration-300 hover:border-gray-700">
              <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center mb-4 animate-float border border-gray-800">
                <Shield className="h-6 w-6 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-yellow-400">Secure Transactions</h3>
              <p className="text-white font-medium">
                State-of-the-art encryption and security measures to protect your financial operations
              </p>
            </div>
            
            <div className="p-6 rounded-xl shadow-lg border border-gray-800 bg-black transition-all duration-300 hover:border-gray-700 relative overflow-hidden">
              <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center mb-4 animate-float border border-gray-800" style={{ animationDelay: '0.2s' }}>
                <Wallet className="h-6 w-6 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-yellow-400">Fast Deposits</h3>
              <p className="text-white font-medium">
                Instant deposits and quick withdrawals to and from your casino account
              </p>
              <div className="floating dice hidden md:block absolute -right-5 -bottom-5 w-10 h-10 opacity-30">
                <Dices className="h-8 w-8 text-yellow-400" />
              </div>
            </div>
            
            <div className="p-6 rounded-xl shadow-lg border border-gray-800 bg-black transition-all duration-300 hover:border-gray-700">
              <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center mb-4 animate-float border border-gray-800" style={{ animationDelay: '0.4s' }}>
                <TrendingUp className="h-6 w-6 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-yellow-400">Real-time Updates</h3>
              <p className="text-white font-medium">
                Monitor your transactions and balance in real-time with instant notifications
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section with Dark Navy Background */}
      <section className="py-12 md:py-20 px-4 relative overflow-hidden bg-[#0A0F1C]">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1C] to-[#0A1018]"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="p-8 md:p-12 rounded-2xl mb-8 inline-block bg-[#161621] border border-gray-800 shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-yellow-400">
              Ready to manage your casino finances?
            </h2>
            <p className="text-white font-medium mb-8">
              Join the secure payment platform for 747 Casino
            </p>
            <div className="relative">
              <Link href="/auth">
                <Button size="lg" className="casino-button text-sm sm:text-base shadow-lg z-10 relative transition-all duration-300 bg-black hover:bg-[#101010] text-yellow-400">
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
      
      {/* Dark Footer */}
      <footer className="py-8 border-t border-gray-800 bg-[#121212]">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center mb-4">
            <img src={casinoLogo} alt="747 Casino Logo" className="w-8 h-8" />
            <span className="ml-2 font-medium text-yellow-400">747 Casino E-Wallet</span>
          </div>
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} 747 Casino. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}