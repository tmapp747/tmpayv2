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
          <div className="w-10 h-10 overflow-hidden">
            <svg viewBox="0 0 200 200" className="h-full w-full">
              <circle cx="100" cy="100" r="90" fill="#1a2b47" />
              <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#b78628" fontSize="60" fontWeight="bold" className="jackpot-text">747</text>
            </svg>
          </div>
          <span className="font-medium text-lg">TeamMARC</span>
        </div>
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <Link href="/auth">
            <Button size="sm" variant="outline" className="hover:border-blue-500 hover:bg-blue-500/10">
              Sign In
            </Button>
          </Link>
        </div>
      </header>
      
      {/* Simple hero section with only logo and buttons */}
      <main className="flex-1 flex flex-col items-center justify-center relative">
        {/* Background with overlay */}
        <div className="absolute inset-0 overflow-hidden z-0 bg-gradient-to-b from-slate-900 to-slate-800" />
        
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
            {/* TeamMARC Logo with animation */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-10 relative"
              whileHover={{ scale: 1.05 }}
            >
              <motion.img 
                src={teamMarcLogo} 
                alt="TeamMARC Logo" 
                className="w-64 h-auto md:w-80 lg:w-96 object-contain"
                animate={{ 
                  boxShadow: ["0 0 0px rgba(59, 130, 246, 0)", "0 0 30px rgba(59, 130, 246, 0.5)", "0 0 0px rgba(59, 130, 246, 0)"]
                }}
                transition={{
                  duration: 3,
                  ease: "easeInOut",
                  repeat: Infinity,
                }}
              />
              <motion.div 
                className="absolute inset-0"
                animate={{
                  background: [
                    "radial-gradient(circle, rgba(22, 163, 74, 0) 0%, rgba(22, 163, 74, 0) 100%)",
                    "radial-gradient(circle, rgba(22, 163, 74, 0.1) 0%, rgba(22, 163, 74, 0) 70%)",
                    "radial-gradient(circle, rgba(22, 163, 74, 0) 0%, rgba(22, 163, 74, 0) 100%)"
                  ]
                }}
                transition={{
                  duration: 4,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
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
                  className="text-base shadow-lg bg-green-600 hover:bg-green-700 text-white pulse-button w-full md:w-auto min-w-[150px]"
                >
                  Login <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              
              <Link href="/auth">
                <Button 
                  size="lg" 
                  className="text-base shadow-lg bg-blue-600 hover:bg-blue-700 text-white w-full md:w-auto min-w-[150px] mt-3 md:mt-0"
                >
                  Sign Up
                </Button>
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