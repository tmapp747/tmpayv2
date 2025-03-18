import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { 
  User, LogOut, Settings, ChevronRight, Bell, 
  Moon, Sun, HelpCircle, Shield, CreditCard, ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/hooks/use-theme';
import MobileLayout from '@/components/MobileLayout';

export default function MobileProfile() {
  const { user, logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  const [, navigate] = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  
  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#001138] to-[#002D87]">
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold text-white mb-4">Authentication Required</h2>
          <p className="text-white/70 mb-6">Please sign in to access your profile</p>
          <Button
            onClick={() => navigate('/mobile-auth')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }
  
  // Custom header with settings button
  const headerContent = (
    <div className="flex items-center space-x-2">
      <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
        <Settings className="h-5 w-5 text-white" />
      </button>
    </div>
  );
  
  return (
    <MobileLayout
      title="Profile"
      headerContent={headerContent}
      showNav={true}
    >
      <div className="space-y-6 pt-5">
        {/* Profile Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-br from-blue-600/30 to-blue-800/30 backdrop-blur-md rounded-2xl p-6 border border-white/10"
        >
          <div className="flex items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xl font-semibold mr-4">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{user.username}</h2>
              <p className="text-blue-300 text-sm">
                Member since {new Date(user.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
              <div className="mt-1 flex items-center">
                <span className={`px-2 py-0.5 rounded-full text-xs ${user.isVip ? 'bg-amber-500/30 text-amber-300' : 'bg-blue-500/30 text-blue-300'}`}>
                  {user.isVip ? 'VIP Member' : 'Standard'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-xs text-white/70">Balance</p>
              <p className="text-lg font-semibold text-white">₱{Number(user.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-xs text-white/70">Casino Balance</p>
              <p className="text-lg font-semibold text-white">₱{user.casinoBalance ? Number(user.casinoBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</p>
            </div>
          </div>
        </motion.div>
        
        {/* Options Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="space-y-4"
        >
          <h3 className="text-white font-medium text-lg">Account</h3>
          
          <div className="space-y-2">
            <motion.div 
              className="bg-white/5 backdrop-blur-md rounded-xl p-3 flex items-center justify-between"
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-full bg-blue-600/30 flex items-center justify-center mr-3">
                  <User className="h-5 w-5 text-blue-400" />
                </div>
                <span className="text-white">Personal Information</span>
              </div>
              <ChevronRight className="h-5 w-5 text-white/50" />
            </motion.div>
            
            <motion.div 
              className="bg-white/5 backdrop-blur-md rounded-xl p-3 flex items-center justify-between"
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-full bg-purple-600/30 flex items-center justify-center mr-3">
                  <Bell className="h-5 w-5 text-purple-400" />
                </div>
                <span className="text-white">Notifications</span>
              </div>
              <ChevronRight className="h-5 w-5 text-white/50" />
            </motion.div>
            
            <motion.div 
              className="bg-white/5 backdrop-blur-md rounded-xl p-3 flex items-center justify-between"
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-full bg-green-600/30 flex items-center justify-center mr-3">
                  <CreditCard className="h-5 w-5 text-green-400" />
                </div>
                <span className="text-white">Payment Methods</span>
              </div>
              <ChevronRight className="h-5 w-5 text-white/50" />
            </motion.div>
          </div>
        </motion.div>
        
        {/* Security Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="space-y-4"
        >
          <h3 className="text-white font-medium text-lg">Security</h3>
          
          <div className="space-y-2">
            <motion.div 
              className="bg-white/5 backdrop-blur-md rounded-xl p-3 flex items-center justify-between"
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-full bg-red-600/30 flex items-center justify-center mr-3">
                  <Shield className="h-5 w-5 text-red-400" />
                </div>
                <span className="text-white">Security Settings</span>
              </div>
              <ChevronRight className="h-5 w-5 text-white/50" />
            </motion.div>
            
            <motion.div 
              className="bg-white/5 backdrop-blur-md rounded-xl p-3 flex items-center justify-between"
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-full bg-teal-600/30 flex items-center justify-center mr-3">
                  <ShieldCheck className="h-5 w-5 text-teal-400" />
                </div>
                <span className="text-white">Privacy</span>
              </div>
              <ChevronRight className="h-5 w-5 text-white/50" />
            </motion.div>
          </div>
        </motion.div>
        
        {/* Preferences Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="space-y-4"
        >
          <h3 className="text-white font-medium text-lg">Preferences</h3>
          
          <div className="space-y-2">
            <motion.button 
              className="w-full bg-white/5 backdrop-blur-md rounded-xl p-3 flex items-center justify-between"
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowThemeModal(true)}
            >
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-full bg-indigo-600/30 flex items-center justify-center mr-3">
                  {theme === 'dark' ? 
                    <Moon className="h-5 w-5 text-indigo-400" /> : 
                    <Sun className="h-5 w-5 text-amber-400" />
                  }
                </div>
                <span className="text-white">Appearance</span>
              </div>
              <div className="flex items-center">
                <span className="text-white/50 mr-2 text-sm capitalize">{theme} Mode</span>
                <ChevronRight className="h-5 w-5 text-white/50" />
              </div>
            </motion.button>
            
            <motion.div 
              className="bg-white/5 backdrop-blur-md rounded-xl p-3 flex items-center justify-between"
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-full bg-cyan-600/30 flex items-center justify-center mr-3">
                  <HelpCircle className="h-5 w-5 text-cyan-400" />
                </div>
                <span className="text-white">Help & Support</span>
              </div>
              <ChevronRight className="h-5 w-5 text-white/50" />
            </motion.div>
            
            <motion.button 
              className="w-full bg-white/5 backdrop-blur-md rounded-xl p-3 flex items-center justify-between"
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowLogoutConfirm(true)}
            >
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-full bg-pink-600/30 flex items-center justify-center mr-3">
                  <LogOut className="h-5 w-5 text-pink-400" />
                </div>
                <span className="text-white">Logout</span>
              </div>
            </motion.button>
          </div>
        </motion.div>
      </div>
      
      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#001138] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-xl font-semibold text-white mb-3">Confirm Logout</h3>
              <p className="text-white/70 mb-6">Are you sure you want to log out of your account?</p>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline" 
                  className="flex-1 border-white/20 text-white/70 hover:text-white hover:bg-white/5"
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Theme Modal */}
      <AnimatePresence>
        {showThemeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#001138] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-xl font-semibold text-white mb-2">Appearance</h3>
              <p className="text-white/70 mb-6">Choose your preferred theme mode</p>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-yellow-600/20 flex items-center justify-center mr-4">
                      <Sun className="h-5 w-5 text-yellow-400" />
                    </div>
                    <span className="text-white text-lg">Light Mode</span>
                  </div>
                  <Switch 
                    checked={theme === 'light'}
                    onCheckedChange={() => setTheme('light')}
                    className="data-[state=checked]:bg-yellow-600"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center mr-4">
                      <Moon className="h-5 w-5 text-blue-400" />
                    </div>
                    <span className="text-white text-lg">Dark Mode</span>
                  </div>
                  <Switch 
                    checked={theme === 'dark'}
                    onCheckedChange={() => setTheme('dark')}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/10">
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setShowThemeModal(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}