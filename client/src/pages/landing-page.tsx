import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Wallet, CreditCard, Shield, Award } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { motion } from "framer-motion";
import "../assets/casino-animations.css";

export default function LandingPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [, setLocation] = useLocation();
  const [playVideo, setPlayVideo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Handle responsive design detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);
  
  // Handle video playback
  const handlePlayVideo = () => {
    setPlayVideo(true);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(err => {
          console.error("Video playback error:", err);
        });
      }
    }, 100);
  };
  
  const handleCloseVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setPlayVideo(false);
  };
  
  // Animated feature items
  const featureItems = [
    { 
      icon: <Wallet className="h-7 w-7 mb-2 text-primary" />, 
      title: "Instant Deposits", 
      description: "Fund your account in seconds with our seamless GCash integration",
      delay: 0.2
    },
    { 
      icon: <CreditCard className="h-7 w-7 mb-2 text-primary" />, 
      title: "Secure Payments", 
      description: "Advanced encryption and authentication protect your transactions",
      delay: 0.4
    },
    { 
      icon: <Shield className="h-7 w-7 mb-2 text-primary" />, 
      title: "Protected Transfers", 
      description: "Safely move funds between your wallet and casino accounts",
      delay: 0.6
    },
    { 
      icon: <Award className="h-7 w-7 mb-2 text-primary" />, 
      title: "VIP Perks", 
      description: "Enjoy exclusive benefits and premium features for valued users",
      delay: 0.8
    }
  ];
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };
  
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
          <span className="font-medium text-lg">747 E-Wallet</span>
        </div>
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <Link href="/auth">
            <Button size="sm" variant="outline" className="hover:border-primary hover:bg-primary/10">
              Sign In
            </Button>
          </Link>
        </div>
      </header>
      
      {/* Hero section with background video overlay */}
      <main className="flex-1 flex flex-col items-center relative pt-16">
        {/* Video background with overlay */}
        <div className="absolute inset-0 overflow-hidden z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center" 
            style={{ 
              backgroundImage: 'url(/images/casino-cards-chips.jpg)', 
              filter: 'blur(2px)',
              transform: 'scale(1.05)'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90 z-10" />
        </div>
        
        {/* Hero content with animations */}
        <div className="relative z-20 flex flex-col items-center px-4 py-16 md:py-24 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="mb-8">
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-6 text-white">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-amber-500 jackpot-text">
                  747 Premium
                </span>
                <br />
                <span className="text-white">E-Wallet</span>
              </h1>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-xl md:text-2xl max-w-2xl mx-auto mb-8 text-gray-300"
              >
                The ultimate financial platform for serious casino players
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="flex flex-col md:flex-row justify-center gap-4 mt-8"
              >
                <Link href="/auth">
                  <Button 
                    size="lg" 
                    className="text-base shadow-lg casino-button bg-amber-500 hover:bg-amber-600 text-black pulse-button w-full md:w-auto"
                  >
                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-base border-2 border-white/20 bg-transparent hover:bg-white/10 text-white mt-3 md:mt-0 w-full md:w-auto"
                  onClick={handlePlayVideo}
                >
                  <Play className="mr-2 h-5 w-5" /> Watch Demo
                </Button>
              </motion.div>
              
              {/* Floating casino chips animation elements */}
              <div className="absolute top-20 left-10 hidden md:block">
                <div className="relative w-16 h-16 rounded-full bg-amber-500 floating" style={{ animationDelay: "0s" }}>
                  <div className="absolute inset-2 rounded-full bg-amber-700 flex items-center justify-center text-white font-bold">
                    747
                  </div>
                </div>
              </div>
              <div className="absolute bottom-20 right-10 hidden md:block">
                <div className="relative w-12 h-12 rounded-full bg-blue-500 floating" style={{ animationDelay: "0.5s" }}>
                  <div className="absolute inset-1 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-xs">
                    VIP
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Features section below hero */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-6xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4"
          >
            {featureItems.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:border-primary/30 hover:bg-white/10 transition-all duration-300 card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {feature.icon}
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-300 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
          
          {/* Video modal */}
          {playVideo && (
            <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
              <button 
                onClick={handleCloseVideo}
                className="absolute top-4 right-4 text-white opacity-70 hover:opacity-100 text-sm px-3 py-1 rounded-full border border-white/30 hover:bg-white/10 transition-all z-10"
              >
                Close
              </button>
              
              <div className="relative w-full max-w-4xl aspect-video">
                <video 
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  playsInline
                  src={isMobile ? "/videos/intro-mobile.mp4" : "/videos/intro-autoplay.mp4"}
                  poster="/videos/intro-small.gif"
                />
              </div>
            </div>
          )}
          
          <div className="mt-16 opacity-70 text-sm text-white relative z-20">
            &copy; {new Date().getFullYear()} 747 Casino. All rights reserved.
          </div>
        </div>
      </main>
    </div>
  );
}