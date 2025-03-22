import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Smartphone, LaptopIcon } from "lucide-react";
import teamMarcLogo from "../../assets/Logo teammarc.png";

interface HeroSectionProps {
  isMobile: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ isMobile }) => {
  return (
    <div className="relative z-20 flex flex-col items-center px-4 w-full pt-20">
      {/* Adding top padding (pt-20) to prevent hiding behind the header */}
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
          className="mb-8 relative"
        >
          <img 
            src={teamMarcLogo} 
            alt="TeamMARC Logo" 
            className="w-56 h-auto md:w-72 lg:w-80 object-contain shadow-lg"
          />
        </motion.div>
        
        {/* Updated content about the app */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="max-w-lg text-center mb-6"
        >
          <h2 className="text-white text-base md:text-lg mb-2">
            Team Marc's Official E-Wallet Platform
          </h2>
          <p className="text-gray-300 text-xs md:text-sm">
            Exclusive for Team Marc's agents and players. Enjoy seamless and fast 
            cash-in and cash-out transactions using GCash payment methods.
          </p>
        </motion.div>
        
        {/* Mobile experience banner for desktop users */}
        {!isMobile && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-3 shadow-md max-w-lg w-full"
          >
            <div className="flex items-center">
              <div className="bg-white/10 rounded-full p-1.5 mr-3">
                <Smartphone className="text-white h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium text-sm">Try Our Mobile Banking Interface</h3>
                <p className="text-white/80 text-xs">Experience our new mobile banking-style interface with smooth animations and gestures.</p>
              </div>
              <Link href="/mobile-auth">
                <Button 
                  className="bg-white text-blue-600 hover:bg-white/90 ml-2 shadow-sm text-xs py-1 h-7" 
                  size="sm"
                >
                  Try Now
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
        
        {/* Action buttons */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="flex flex-col md:flex-row justify-center gap-4 mt-4"
        >
          <Link href={isMobile ? "/mobile-auth" : "/auth"}>
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button 
                size="default" 
                className="text-sm shadow-md bg-green-600 hover:bg-green-700 text-white w-full md:w-auto min-w-[120px] border border-green-500"
                style={{
                  background: "linear-gradient(to bottom, #22c55e, #16a34a)",
                  boxShadow: "0 3px 5px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                }}
              >
                Login <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>
          </Link>
          
          <Link href={isMobile ? "/mobile-auth" : "/auth"}>
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button 
                size="default" 
                className="text-sm shadow-md bg-blue-600 hover:bg-blue-700 text-white w-full md:w-auto min-w-[120px] mt-3 md:mt-0 border border-blue-500"
                style={{
                  background: "linear-gradient(to bottom, #3b82f6, #2563eb)",
                  boxShadow: "0 3px 5px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                }}
              >
                Sign Up
              </Button>
            </motion.div>
          </Link>
        </motion.div>
        
        {/* Admin sign-in link and experience options */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mt-5 flex flex-wrap justify-center gap-2"
        >
          <Link 
            href="/admin/auth" 
            className="text-xs px-3 py-1.5 rounded-full bg-gray-800/50 border border-gray-700 text-blue-300 hover:text-blue-200 hover:bg-gray-700/60 transition-all duration-200"
          >
            Admin Sign In
          </Link>
          <Link 
            href="/mobile" 
            className="text-xs px-3 py-1.5 rounded-full bg-purple-900/50 border border-purple-700 text-purple-300 hover:text-purple-200 hover:bg-purple-800/60 transition-all duration-200 flex items-center"
          >
            <Smartphone className="h-3 w-3 mr-1" /> Mobile App
          </Link>
          <Link 
            href="/dashboard" 
            className="text-xs px-3 py-1.5 rounded-full bg-gray-800/50 border border-gray-700 text-teal-300 hover:text-teal-200 hover:bg-gray-700/60 transition-all duration-200 flex items-center"
          >
            <LaptopIcon className="h-3 w-3 mr-1" /> Desktop Version
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
  );
};

export default HeroSection;