import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronRight, Smartphone, ArrowRight, LaptopIcon } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { motion, AnimatePresence } from "framer-motion";
import HeroSection from "@/components/landing/HeroSection";
import "../assets/casino-animations.css";
import teamMarcLogo from "../assets/Logo teammarc.png";

export default function LandingPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [, setLocation] = useLocation();
  const [showMobilePromo, setShowMobilePromo] = useState(false);
  const isMobile = window.innerWidth < 768;
  
  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
    
    // Show mobile promo for mobile devices after a delay
    if (isMobile) {
      const timer = setTimeout(() => {
        setShowMobilePromo(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, setLocation, isMobile]);
  
  return (
    <div className={`min-h-screen flex flex-col ${theme === "dark" ? "dark" : "light"}`}>
      {/* Header */}
      <header className="fixed top-0 w-full h-14 z-40 backdrop-blur-md border-b border-border/30 flex items-center px-3 md:px-5 justify-between bg-card/80 text-card-foreground">
        <div className="flex items-center space-x-1.5">
          <div className="w-8 h-8 overflow-hidden flex items-center justify-center">
            <img src={teamMarcLogo} alt="TeamMARC" className="h-6 w-auto object-contain" />
          </div>
          <span className="font-medium text-base">TeamMARC</span>
        </div>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <Link href={isMobile ? "/mobile-auth" : "/auth"}>
            <Button 
              size="sm" 
              style={{
                background: "linear-gradient(to bottom, #3b82f6, #2563eb)",
                borderColor: "#3b82f6",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
              }}
              className="text-white border hover:border-blue-400 text-xs py-1 h-8"
            >
              Sign In
            </Button>
          </Link>
        </div>
      </header>
      
      {/* Mobile promo banner overlay */}
      <AnimatePresence>
        {showMobilePromo && isMobile && (
          <motion.div 
            className="fixed inset-x-0 top-14 z-50 px-4 py-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <motion.div 
              className="relative bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-lg p-3 flex items-center justify-between"
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex-1">
                <p className="text-white font-medium text-xs">
                  Try our new mobile banking interface!
                </p>
              </div>
              <Link href="/mobile-auth">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-white border-white/40 bg-white/10 hover:bg-white/20 text-xs h-7 py-0 px-2"
                >
                  Try Now <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
              <button 
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black/30 rounded-full flex items-center justify-center text-white text-xs"
                onClick={() => setShowMobilePromo(false)}
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
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
        
        {/* Render the new HeroSection component */}
        <HeroSection isMobile={isMobile} />
      </main>
    </div>
  );
}