import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, Wallet, TrendingUp, ArrowRight } from "lucide-react";
import casinoLogo from "../assets/Logo teammarc.png";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#121212]">
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
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Link href="/auth">
              <Button size="lg" className="text-sm sm:text-base bg-blue-600 hover:bg-blue-700 shadow-lg">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
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
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 thick-shadow">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Secure Transactions</h3>
              <p className="text-gray-600 dark:text-gray-400">
                State-of-the-art encryption and security measures to protect your financial operations
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 thick-shadow">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Fast Deposits</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Instant deposits and quick withdrawals to and from your casino account
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 thick-shadow">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4">
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
          <Link href="/auth">
            <Button size="lg" className="text-sm sm:text-base bg-blue-600 hover:bg-blue-700 shadow-lg">
              Create Account
            </Button>
          </Link>
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