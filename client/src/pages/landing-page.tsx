import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, Wallet, TrendingUp, ArrowRight, CreditCard, DollarSign, Dice6 } from "lucide-react";
import casinoLogo from "../assets/Logo teammarc.png";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Simple dark gradient background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black to-dark-DEFAULT"></div>
      
      {/* Header - clean and minimal */}
      <header className="relative w-full h-14 sm:h-16 bg-black border-b border-gray-800 shadow-sm flex items-center px-4 justify-between">
        <div className="flex items-center space-x-2">
          <img src={casinoLogo} alt="747 Casino Logo" className="w-7 h-7 sm:w-8 sm:h-8" />
          <span className="font-medium text-base sm:text-lg text-lime-400">747 Casino E-Wallet</span>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/admin/auth">
            <Button size="sm" variant="ghost" className="text-xs sm:text-sm text-gray-300 hover:text-lime-400">
              Admin
            </Button>
          </Link>
          <Link href="/auth">
            <Button size="sm" variant="outline" className="text-xs sm:text-sm bg-dark-darker text-lime-400 border-lime-500/30 hover:bg-lime-500 hover:text-black">
              Sign In
            </Button>
          </Link>
        </div>
      </header>
      
      {/* Hero Section with Dark Background */}
      <section className="py-12 md:py-20 px-4 relative bg-black">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-DEFAULT to-dark-darker"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="px-8 py-6 mb-6 bg-dark-card border border-gray-800 rounded-xl shadow-lg card-gradient">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white">
              <span className="text-lime-400 relative">
                Casino Financial Gateway
                <span className="absolute -bottom-2 left-0 w-full h-1 bg-lime-400/20 rounded"></span>
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
                className="text-sm sm:text-base shadow-lg bg-dark-darker hover:bg-lime-500 hover:text-black text-lime-400 border border-lime-500/30 transition-all duration-300"
              >
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <div className="floating coin hidden md:block absolute -right-12 top-0 w-10 h-10 bg-lime-400 rounded-full border-4 border-lime-500 opacity-80">
              <div className="text-center font-bold text-black">$</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section with Dark Solid Background */}
      <section className="relative py-12 md:py-16 px-4 bg-dark-DEFAULT border-y border-gray-700">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-lime-400">
            Why Choose Our E-Wallet
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl shadow-lg border border-gray-800 bg-dark-card transition-all duration-300 hover:border-gray-700">
              <div className="w-12 h-12 rounded-full bg-dark-darker flex items-center justify-center mb-4 animate-float border border-gray-800">
                <Shield className="h-6 w-6 text-lime-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-lime-400">Secure Transactions</h3>
              <p className="text-white font-medium">
                State-of-the-art encryption and security measures to protect your financial operations
              </p>
            </div>
            
            <div className="p-6 rounded-xl shadow-lg border border-gray-800 bg-dark-card transition-all duration-300 hover:border-gray-700 relative overflow-hidden card-gradient">
              <div className="w-12 h-12 rounded-full bg-dark-darker flex items-center justify-center mb-4 animate-float border border-gray-800" style={{ animationDelay: '0.2s' }}>
                <Wallet className="h-6 w-6 text-lime-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-lime-400">Fast Deposits</h3>
              <p className="text-white font-medium">
                Instant deposits and quick withdrawals to and from your casino account
              </p>
              <div className="floating dice hidden md:block absolute -right-5 -bottom-5 w-10 h-10 opacity-50">
                <Dice6 className="h-8 w-8 text-lime-400" />
              </div>
            </div>
            
            <div className="p-6 rounded-xl shadow-lg border border-gray-800 bg-dark-card transition-all duration-300 hover:border-gray-700">
              <div className="w-12 h-12 rounded-full bg-dark-darker flex items-center justify-center mb-4 animate-float border border-gray-800" style={{ animationDelay: '0.4s' }}>
                <TrendingUp className="h-6 w-6 text-lime-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-lime-400">Real-time Updates</h3>
              <p className="text-white font-medium">
                Monitor your transactions and balance in real-time with instant notifications
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section with Dark Navy Background */}
      <section className="py-12 md:py-20 px-4 relative overflow-hidden bg-dark-navy">
        <div className="absolute inset-0 bg-gradient-to-t from-dark-navy to-dark-DEFAULT opacity-60"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="p-8 md:p-12 rounded-2xl mb-8 inline-block bg-dark-card border border-gray-800 shadow-xl card-gradient">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-lime-400">
              Ready to manage your casino finances?
            </h2>
            <p className="text-white font-medium mb-8">
              Join the secure payment platform for 747 Casino
            </p>
            <div className="relative">
              <Link href="/auth">
                <Button size="lg" className="shadow-lg z-10 relative transition-all duration-300 bg-dark-darker hover:bg-lime-500 hover:text-black text-lime-400 border border-lime-500/30">
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
      <footer className="py-8 border-t border-gray-800 bg-dark-charcoal">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center mb-4">
            <img src={casinoLogo} alt="747 Casino Logo" className="w-8 h-8" />
            <span className="ml-2 font-medium text-lime-400">747 Casino E-Wallet</span>
          </div>
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} 747 Casino. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}