import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { ArrowUp, Plus, ArrowRight, RefreshCw, Coins, Wallet, BadgeDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { userApi } from "@/lib/api";
import { useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import gsap from "gsap";

// Component for animated coins
const AnimatedCoin = ({ 
  x, 
  y,
  delay = 0,
  duration = 1.5, 
  isDeposit = true, 
  onComplete 
}: { 
  x: number; 
  y: number;
  delay?: number;
  duration?: number;
  isDeposit?: boolean;
  onComplete?: () => void;
}) => {
  // Random position adjustments
  const randomX = Math.random() * 100 - 50;
  const randomY = Math.random() * 20 - 10;
  
  // Random rotation
  const rotation = Math.random() * 720 - 360;
  
  // Choose a random coin color
  const coinColors = [
    "text-yellow-400", // Gold
    "text-yellow-300", // Light gold
    "text-gray-300",   // Silver
    "text-yellow-500", // Deep gold
  ];
  const coinColor = coinColors[Math.floor(Math.random() * coinColors.length)];
  
  // Animation variants
  const variants = {
    initial: { 
      opacity: 0,
      scale: 0.2,
      x: isDeposit ? -50 : 50,
      y: isDeposit ? 100 : -100,
      rotate: 0
    },
    animate: { 
      opacity: [0, 1, 1, 0.8, 0],
      scale: [0.2, 1.2, 1, 0.8, 0.5],
      x: [isDeposit ? -50 : 50, randomX, x],
      y: [isDeposit ? 100 : -100, randomY, y],
      rotate: rotation,
      transition: { 
        duration: duration,
        delay: delay,
        ease: "easeInOut" 
      }
    }
  };

  return (
    <motion.div
      className="absolute z-10 pointer-events-none"
      variants={variants}
      initial="initial"
      animate="animate"
      onAnimationComplete={onComplete}
    >
      {Math.random() > 0.5 ? (
        <Coins className={`w-6 h-6 ${coinColor} drop-shadow-lg`} />
      ) : (
        <BadgeDollarSign className={`w-6 h-6 ${coinColor} drop-shadow-lg`} />
      )}
    </motion.div>
  );
};

// Component for animated balance change
const AnimatedBalanceChange = ({ 
  prevBalance,
  newBalance,
  isLoading
}: { 
  prevBalance: number;
  newBalance: number;
  isLoading: boolean;
}) => {
  const controls = useAnimation();

  useEffect(() => {
    if (!isLoading && prevBalance !== newBalance) {
      controls.start({
        scale: [1, 1.1, 1],
        color: ["#ffffff", "#38bdf8", "#ffffff"],
        transition: { duration: 0.5 }
      });
    }
  }, [newBalance, prevBalance, isLoading, controls]);

  return (
    <motion.div 
      animate={controls}
      className="text-4xl font-bold text-white tracking-tight"
      style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
    >
      {isLoading ? (
        <div className="animate-shimmer rounded h-10 w-36"></div>
      ) : (
        formatCurrency(newBalance)
      )}
    </motion.div>
  );
};

// Main BalanceCard component
const BalanceCard = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/user/info'],
  });
  
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const [previousBalance, setPreviousBalance] = useState(0);
  const [isBalanceUpdated, setIsBalanceUpdated] = useState(false);
  const [coins, setCoins] = useState<{ id: number; x: number; y: number; delay: number; isDeposit: boolean }[]>([]);
  const [nextCoinId, setNextCoinId] = useState(0);
  
  // Track previous balance for animation
  useEffect(() => {
    if (!isLoading && data?.user?.balance !== undefined) {
      // Check if this is an actual update (not initial load)
      if (previousBalance !== 0 && previousBalance !== data.user.balance) {
        setIsBalanceUpdated(true);
        showCoinAnimation(previousBalance < data.user.balance);
        
        // Reset flag after animation
        const timer = setTimeout(() => {
          setIsBalanceUpdated(false);
        }, 3000);
        
        return () => clearTimeout(timer);
      }
      
      setPreviousBalance(data.user.balance);
    }
  }, [data?.user?.balance, isLoading]);
  
  // Function to create coin animations based on balance change
  const showCoinAnimation = (isDeposit: boolean) => {
    if (!cardRef.current) return;
    
    // Get card dimensions and position
    const cardRect = cardRef.current.getBoundingClientRect();
    const centerX = cardRect.width / 2;
    const centerY = cardRect.height / 3;
    
    // Create multiple coins with varied animation parameters
    const numCoins = Math.floor(Math.random() * 5) + 8; // 8-12 coins
    const newCoins = [];
    
    for (let i = 0; i < numCoins; i++) {
      // Randomized positions around the balance display
      const coinX = centerX + (Math.random() * 60 - 30);
      const coinY = centerY + (Math.random() * 40 - 20);
      const delay = Math.random() * 0.3;
      
      newCoins.push({
        id: nextCoinId + i,
        x: coinX,
        y: coinY,
        delay,
        isDeposit
      });
    }
    
    setCoins(newCoins);
    setNextCoinId(nextCoinId + numCoins);
    
    // Play coin sound
    playCoinSound();
  };
  
  // Function to play coin sound
  const playCoinSound = () => {
    // Simple sound effect using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      
      // Quick frequency changes for coin-like sound
      oscillator.frequency.exponentialRampToValueAtTime(
        400,
        audioContext.currentTime + 0.1
      );
      
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.2
      );
      
      // Stop after sound completes
      setTimeout(() => {
        oscillator.stop();
      }, 200);
    } catch (e) {
      console.log('Sound effect not supported');
    }
  };
  
  // Function to remove a coin after animation completes
  const removeCoin = (id: number) => {
    setCoins(prevCoins => prevCoins.filter(coin => coin.id !== id));
  };
  
  // Handle card hover for interactive effect
  useEffect(() => {
    if (!cardRef.current) return;
    
    const card = cardRef.current;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const moveX = (x - centerX) / 25;
      const moveY = (y - centerY) / 25;
      
      gsap.to(card, {
        rotationY: moveX,
        rotationX: -moveY,
        transformPerspective: 1000,
        duration: 0.4,
        ease: "power2.out"
      });
    };
    
    const handleMouseLeave = () => {
      gsap.to(card, {
        rotationY: 0,
        rotationX: 0,
        duration: 0.7,
        ease: "elastic.out(1, 0.5)"
      });
    };
    
    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);
  
  const handleRefresh = async () => {
    try {
      const oldBalance = data?.user?.balance || 0;
      await refetch();
      
      toast({
        title: "Balance refreshed",
        description: "Your balance has been updated.",
      });
      
      // Animation will be triggered by the useEffect watching balance changes
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error refreshing",
        description: "There was an error refreshing your balance.",
      });
    }
  };
  
  const handleDeposit = () => {
    navigate("/wallet");
  };

  return (
    <div 
      ref={cardRef}
      className="bg-primary rounded-xl shadow-lg overflow-hidden mb-6 border border-secondary/30 hover:shadow-xl hover:shadow-secondary/5 transition-all duration-300 transform hover:-translate-y-1 relative"
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Animated coins */}
      {coins.map(coin => (
        <AnimatedCoin
          key={coin.id}
          x={coin.x}
          y={coin.y}
          delay={coin.delay}
          isDeposit={coin.isDeposit}
          onComplete={() => removeCoin(coin.id)}
        />
      ))}
      
      <div className="bg-gradient-to-br from-primary via-primary to-dark p-6 relative">
        {/* Background glow effect */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-50 rounded-t-xl"
          animate={isBalanceUpdated ? {
            opacity: [0.5, 0.8, 0.5],
            scale: [1, 1.02, 1],
            transition: { duration: 1.5, repeat: 0 }
          } : {}}
        ></motion.div>
        
        <div className="relative flex justify-between items-center mb-4">
          <motion.h2 
            className="text-lg text-white font-medium tracking-wide flex items-center"
            animate={{ x: [0, 2, 0], opacity: [1, 1, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          >
            <Wallet className="h-5 w-5 mr-2 text-secondary" /> Total Balance
          </motion.h2>
          
          <Button 
            variant="outline" 
            size="sm"
            className="text-sm px-3 py-1 rounded-full bg-secondary/20 text-secondary font-semibold border-secondary/30 hover:bg-secondary/40 hover:scale-105 transition-all"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : 'group-hover:animate-spin'}`} /> 
            Refresh
          </Button>
        </div>
        
        <div className="relative flex items-end space-x-2 mb-4">
          <AnimatedBalanceChange 
            prevBalance={previousBalance}
            newBalance={data?.user?.balance || 0}
            isLoading={isLoading}
          />
          
          <AnimatePresence>
            {isBalanceUpdated && data?.user?.balance > previousBalance && (
              <motion.span 
                className="text-green-400 mb-1 text-sm bg-green-500/10 px-2 py-1 rounded-full"
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <ArrowUp className="h-3 w-3 inline mr-1" /> 
                +{formatCurrency(data.user.balance - previousBalance)}
              </motion.span>
            )}
            
            {isBalanceUpdated && data?.user?.balance < previousBalance && (
              <motion.span 
                className="text-red-400 mb-1 text-sm bg-red-500/10 px-2 py-1 rounded-full"
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <ArrowUp className="h-3 w-3 inline mr-1 rotate-180" /> 
                -{formatCurrency(previousBalance - data.user.balance)}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        
        <div className="relative flex space-x-4 pt-4">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              className="flex-1 bg-gradient-to-br from-secondary to-secondary/80 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-xl hover:from-secondary hover:to-secondary/90 transition-all duration-300 w-full"
              onClick={handleDeposit}
            >
              <Plus className="h-5 w-5 mr-2 transition-transform group-hover:rotate-180 duration-300" /> 
              Deposit
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="outline"
              className="flex-1 bg-primary/80 backdrop-blur-sm border border-secondary/50 text-white font-bold py-3 px-4 rounded-xl shadow hover:shadow-lg hover:bg-primary/50 hover:border-secondary transition-all duration-300 w-full"
            >
              <ArrowRight className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform" /> 
              Transfer
            </Button>
          </motion.div>
        </div>
      </div>
      
      <div className="bg-dark/50 backdrop-blur-sm p-5 border-t border-secondary/30">
        <div className="flex flex-wrap md:flex-nowrap justify-between text-sm gap-4">
          <motion.div 
            className="bg-dark/30 rounded-lg p-3 flex-1 hover:bg-dark/50 transition-colors duration-200"
            whileHover={{ scale: 1.03, backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
          >
            <span className="text-gray-400 block mb-1">Available for Play</span>
            <span className="text-white font-medium text-lg">
              {isLoading ? (
                <div className="h-6 w-24 animate-shimmer rounded"></div>
              ) : (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {formatCurrency(data?.user?.balance || 0)}
                </motion.span>
              )}
            </span>
          </motion.div>
          
          <motion.div 
            className="bg-dark/30 rounded-lg p-3 flex-1 hover:bg-dark/50 transition-colors duration-200"
            whileHover={{ scale: 1.03, backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
          >
            <span className="text-gray-400 block mb-1">Pending Deposits</span>
            <span className="text-white font-medium text-lg">
              {isLoading ? (
                <div className="h-6 w-24 animate-shimmer rounded"></div>
              ) : (
                <motion.span
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {formatCurrency(data?.user?.pendingBalance || 0)}
                </motion.span>
              )}
            </span>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
