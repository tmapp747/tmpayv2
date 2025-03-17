import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { motion } from "framer-motion";
import "../assets/casino-animations.css";
import teamMarcLogo from "../assets/Logo teammarc.png";

export default function LandingPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [, setLocation] = useLocation();
  
  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);
  
  return (
    <div className={`min-h-screen flex flex-col ${theme === "dark" ? "dark" : "light"}`}>
      {/* Header */}
      <header className="fixed top-0 w-full h-16 z-40 backdrop-blur-md border-b border-border/30 flex items-center px-4 md:px-6 justify-between bg-card/80 text-card-foreground">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 overflow-hidden flex items-center justify-center">
            <img src={teamMarcLogo} alt="TeamMARC" className="h-8 w-auto object-contain" />
          </div>
          <span className="font-medium text-lg">TeamMARC</span>
        </div>
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <Link href="/auth">
            <Button 
              size="sm" 
              style={{
                background: "linear-gradient(to bottom, #3b82f6, #2563eb)",
                borderColor: "#3b82f6",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
              }}
              className="text-white border hover:border-blue-400"
            >
              Sign In
            </Button>
          </Link>
        </div>
      </header>
      
      {/* Simple hero section with only logo and buttons */}
      <main className="flex-1 flex flex-col items-center justify-center relative">
        {/* Background with overlay */}
        <div className="absolute inset-0 overflow-hidden z-0 bg-gradient-to-b from-slate-900 to-slate-800">
          {/* Animated background orbs */}
          <motion.div 
            className="absolute top-1/4 -right-28 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
          <motion.div 
            className="absolute bottom-1/4 -left-28 w-96 h-96 rounded-full bg-green-500/10 blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.3, 0.2]
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              repeatType: "reverse",
              delay: 2
            }}
          />
        </div>
        
        {/* Hero content with logo animation */}
        <div className="relative z-20 flex flex-col items-center px-4 w-full">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              duration: 0.8, 
              ease: "easeOut",
              type: "spring",
              stiffness: 100
            }}
            className="flex flex-col items-center justify-center"
          >
            {/* TeamMARC Logo without animation */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-10 relative"
            >
              <img 
                src={teamMarcLogo} 
                alt="TeamMARC Logo" 
                className="w-64 h-auto md:w-80 lg:w-96 object-contain shadow-lg"
              />
            </motion.div>
            
            {/* Brief content about the app */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="max-w-lg text-center mb-8"
            >
              <h2 className="text-white text-lg md:text-xl mb-3">
                Secure Financial Platform for Casino Operations
              </h2>
              <p className="text-gray-300 text-sm md:text-base">
                Manage your casino transactions with our secure e-wallet system. 
                Integrated with GCash for seamless deposits and withdrawals.
              </p>
            </motion.div>
            
            {/* Action buttons */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="flex flex-col md:flex-row justify-center gap-4 mt-6"
            >
              <Link href="/auth">
                <Button 
                  size="lg" 
                  className="text-base shadow-lg bg-green-600 hover:bg-green-700 text-white w-full md:w-auto min-w-[150px] border-2 border-green-500"
                  style={{
                    background: "linear-gradient(to bottom, #22c55e, #16a34a)",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                  }}
                >
                  Login <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              
              <Link href="/auth">
                <Button 
                  size="lg" 
                  className="text-base shadow-lg bg-blue-600 hover:bg-blue-700 text-white w-full md:w-auto min-w-[150px] mt-3 md:mt-0 border-2 border-blue-500"
                  style={{
                    background: "linear-gradient(to bottom, #3b82f6, #2563eb)",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                  }}
                >
                  Sign Up
                </Button>
              </Link>
            </motion.div>
            
            {/* Admin sign-in link and mobile version link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="mt-6 flex space-x-3"
            >
              <Link 
                href="/admin/auth" 
                className="text-sm px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700 text-blue-300 hover:text-blue-200 hover:bg-gray-700/60 transition-all duration-200"
              >
                Admin Sign In
              </Link>
              <Link 
                href="/mobile" 
                className="text-sm px-4 py-2 rounded-full bg-purple-900/50 border border-purple-700 text-purple-300 hover:text-purple-200 hover:bg-purple-800/60 transition-all duration-200"
              >
                Mobile Version
              </Link>
            </motion.div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="mt-16 text-sm text-white/70 text-center"
          >
            &copy; {new Date().getFullYear()} TeamMARC. All rights reserved.
          </motion.div>
        </div>
      </main>
    </div>
  );
}