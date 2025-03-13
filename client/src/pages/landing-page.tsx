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
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#121212] relative overflow-hidden">
      {/* Background image with casino-themed elements */}
      <div className="absolute inset-0 z-0 opacity-10 dark:opacity-20">
        <img 
          src={casinoBg} 
          alt="Casino Background" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Floating 3D elements */}
      {showFloatingElements && <CasinoElements3D />}
      {/* Header - fully responsive with mobile adjustments */}
      <header className="w-full h-14 sm:h-16 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 shadow-sm flex items-center px-3 sm:px-4 md:px-8 justify-between">
        <div className="flex items-center space-x-2">
          <img src={casinoLogo} alt="747 Casino Logo" className="w-7 h-7 sm:w-8 sm:h-8" />
          <span className="font-medium text-base sm:text-lg text-blue-600">747 Casino E-Wallet</span>
        </div>
        <div>
          <Link href="/auth">
            <Button size="sm" variant="outline" className="text-xs sm:text-sm">
              Sign In
            </Button>
          </Link>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 text-gray-900 dark:text-white">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
              Casino Financial Gateway
            </span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            The secure and efficient payment platform designed exclusively for 747 Casino players and agents
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16 relative z-10">
            <Link href="/auth">
              <Button 
                size="lg" 
                className="casino-button pulse-button text-sm sm:text-base bg-blue-600 hover:bg-blue-700 shadow-lg transform transition-all duration-300"
              >
                Get Started <ArrowRight className="ml-2 h-4 w-4 animate-bounce-subtle" />
              </Button>
            </Link>
            <div className="floating coin hidden md:block absolute -right-12 top-0 w-10 h-10 bg-yellow-400 rounded-full border-4 border-yellow-500">
              <div className="text-center font-bold text-yellow-800">$</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-12 md:py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Why Choose Our E-Wallet
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 thick-shadow card-hover transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4 animate-float">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Secure Transactions</h3>
              <p className="text-gray-600 dark:text-gray-400">
                State-of-the-art encryption and security measures to protect your financial operations
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 thick-shadow card-hover transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4 animate-float" style={{ animationDelay: '0.2s' }}>
                <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Fast Deposits</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Instant deposits and quick withdrawals to and from your casino account
              </p>
              <div className="floating dice hidden md:block absolute -right-5 -bottom-5 w-10 h-10">
                <Dices className="h-8 w-8 text-red-500" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 thick-shadow card-hover transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4 animate-float" style={{ animationDelay: '0.4s' }}>
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Real-time Updates</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Monitor your transactions and balance in real-time with instant notifications
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900 dark:text-white">
            Ready to manage your casino finances?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Join the secure payment platform for 747 Casino
          </p>
          <div className="relative">
            <div className="jackpot-text text-yellow-500 text-3xl font-bold mb-4">JACKPOT ACCESS</div>
            <Link href="/auth">
              <Button size="lg" className="casino-button text-sm sm:text-base bg-blue-600 hover:bg-blue-700 shadow-lg z-10 relative">
                <span className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" /> 
                  Create Account
                  <DollarSign className="ml-2 h-5 w-5 animate-float" />
                </span>
              </Button>
            </Link>
            <div className="floating card hidden md:block absolute -left-16 top-0 rotate-12">
              <div className="w-10 h-14 bg-white rounded-md border border-gray-300 shadow-md flex items-center justify-center">
                <span className="text-red-600 text-xl font-bold">A</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center mb-4">
            <img src={casinoLogo} alt="747 Casino Logo" className="w-8 h-8" />
            <span className="ml-2 font-medium text-blue-600">747 Casino E-Wallet</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} 747 Casino. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}