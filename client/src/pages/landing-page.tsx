import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, Wallet, TrendingUp, ArrowRight, Dice6 } from "lucide-react";
import casinoLogo from "../assets/Logo teammarc.png";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Header with logo and sign in button */}
      <header className="relative w-full h-16 border-b shadow-sm flex items-center px-4 md:px-6 justify-between">
        <div className="flex items-center space-x-2">
          <img src={casinoLogo} alt="Casino Logo" className="w-8 h-8" />
          <span className="font-medium text-lg">Casino E-Wallet</span>
        </div>
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <Link href="/admin/auth">
            <Button size="sm" variant="ghost">
              Admin
            </Button>
          </Link>
          <Link href="/auth">
            <Button size="sm" variant="outline">
              Sign In
            </Button>
          </Link>
        </div>
      </header>
      
      {/* Main content - single section SPA */}
      <main className="py-10 md:py-16 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Hero area */}
          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Casino Financial Gateway
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8">
              The secure and efficient payment platform designed exclusively for casino players and agents
            </p>
            <Link href="/auth">
              <Button 
                size="lg" 
                className="text-sm sm:text-base shadow-md"
              >
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16">
            <div className="p-6 rounded-xl shadow-md border transition-all duration-300">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Transactions</h3>
              <p>
                State-of-the-art encryption and security measures to protect your financial operations
              </p>
            </div>
            
            <div className="p-6 rounded-xl shadow-md border transition-all duration-300">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Wallet className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Deposits</h3>
              <p>
                Instant deposits and quick withdrawals to and from your casino account
              </p>
            </div>
            
            <div className="p-6 rounded-xl shadow-md border transition-all duration-300">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Updates</h3>
              <p>
                Monitor your transactions and balance in real-time with instant notifications
              </p>
            </div>
          </div>
          
          {/* CTA area */}
          <div className="max-w-3xl mx-auto text-center p-8 rounded-2xl shadow-lg border">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Ready to manage your casino finances?
            </h2>
            <p className="mb-6">
              Join the secure payment platform for trusted casino transactions
            </p>
            <Link href="/auth">
              <Button size="lg">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-6 border-t mt-10">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center mb-2">
            <img src={casinoLogo} alt="Casino Logo" className="w-6 h-6" />
            <span className="ml-2 font-medium">Casino E-Wallet</span>
          </div>
          <p className="text-sm opacity-70">
            &copy; {new Date().getFullYear()} Casino. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}