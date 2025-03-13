import React, { useEffect, useRef } from 'react';

/**
 * Casino elements with only dice that rotate slowly and roam around the page in the background
 */
export function CasinoElements3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId: number;
    let startTime = Date.now();
    
    const animateDice = () => {
      if (!containerRef.current) return;
      
      const currentTime = Date.now();
      const elapsedTime = (currentTime - startTime) / 1000; // time in seconds
      const dice = containerRef.current.querySelectorAll('.dice');
      
      dice.forEach((die, index) => {
        const htmlDie = die as HTMLElement;
        
        // Very slow rotation - one full rotation every ~2 minutes
        const rotateValue = (elapsedTime * (3 + index)) % 360;
        
        // Slow horizontal and vertical movement based on sine and cosine for a gentle roaming effect
        // Each die follows a different path based on its index
        const offsetX = Math.sin(elapsedTime * 0.2 + index * 0.5) * 5;
        const offsetY = Math.cos(elapsedTime * 0.15 + index * 0.7) * 5;
        
        // Add a subtle scale variation
        const scaleBase = 0.95 + (index * 0.02);
        const scaleVariation = Math.sin(elapsedTime * 0.1) * 0.05;
        const scaleValue = scaleBase + scaleVariation;
        
        htmlDie.style.transform = `translate(${offsetX}px, ${offsetY}px) rotate(${rotateValue}deg) scale(${scaleValue})`;
      });
      
      // Continue the animation
      animationFrameId = requestAnimationFrame(animateDice);
    };
    
    // Start the animation
    animateDice();
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-40 z-10"
    >
      {/* Dice positioned in less intrusive locations with slow transitions */}
      <div 
        className="dice absolute left-[5%] top-[10%] w-16 h-16 bg-white/90 rounded-md border border-gray-300/70 shadow-lg transition-transform duration-5000"
      >
        {/* Dots for number 2 */}
        <div className="w-3 h-3 bg-black/90 rounded-full absolute top-3 left-3"></div>
        <div className="w-3 h-3 bg-black/90 rounded-full absolute bottom-3 right-3"></div>
      </div>
      
      <div 
        className="dice absolute right-[10%] top-[40%] w-14 h-14 bg-white/90 rounded-md border border-gray-300/70 shadow-lg transition-transform duration-5000"
      >
        {/* Dots for number 6 */}
        <div className="w-2.5 h-2.5 bg-black/90 rounded-full absolute top-2 left-2"></div>
        <div className="w-2.5 h-2.5 bg-black/90 rounded-full absolute top-2 right-2"></div>
        <div className="w-2.5 h-2.5 bg-black/90 rounded-full absolute top-[calc(50%-5px)] left-2"></div>
        <div className="w-2.5 h-2.5 bg-black/90 rounded-full absolute top-[calc(50%-5px)] right-2"></div>
        <div className="w-2.5 h-2.5 bg-black/90 rounded-full absolute bottom-2 left-2"></div>
        <div className="w-2.5 h-2.5 bg-black/90 rounded-full absolute bottom-2 right-2"></div>
      </div>
      
      <div 
        className="dice absolute left-[75%] bottom-[20%] w-20 h-20 bg-white/90 rounded-md border border-gray-300/70 shadow-lg transition-transform duration-5000"
      >
        {/* Dots for number 5 */}
        <div className="w-3.5 h-3.5 bg-black/90 rounded-full absolute top-3 left-3"></div>
        <div className="w-3.5 h-3.5 bg-black/90 rounded-full absolute top-3 right-3"></div>
        <div className="w-3.5 h-3.5 bg-black/90 rounded-full absolute top-[calc(50%-7px)] left-[calc(50%-7px)]"></div>
        <div className="w-3.5 h-3.5 bg-black/90 rounded-full absolute bottom-3 left-3"></div>
        <div className="w-3.5 h-3.5 bg-black/90 rounded-full absolute bottom-3 right-3"></div>
      </div>
      
      <div 
        className="dice absolute right-[70%] bottom-[65%] w-12 h-12 bg-white/90 rounded-md border border-gray-300/70 shadow-lg transition-transform duration-5000"
      >
        {/* Dots for number 4 */}
        <div className="w-2.5 h-2.5 bg-black/90 rounded-full absolute top-2 left-2"></div>
        <div className="w-2.5 h-2.5 bg-black/90 rounded-full absolute top-2 right-2"></div>
        <div className="w-2.5 h-2.5 bg-black/90 rounded-full absolute bottom-2 left-2"></div>
        <div className="w-2.5 h-2.5 bg-black/90 rounded-full absolute bottom-2 right-2"></div>
      </div>
      
      {/* Add an extra die in a different area */}
      <div 
        className="dice absolute left-[40%] top-[75%] w-18 h-18 bg-white/90 rounded-md border border-gray-300/70 shadow-lg transition-transform duration-5000"
      >
        {/* Dots for number 3 */}
        <div className="w-3 h-3 bg-black/90 rounded-full absolute top-2 left-2"></div>
        <div className="w-3 h-3 bg-black/90 rounded-full absolute top-[calc(50%-6px)] left-[calc(50%-6px)]"></div>
        <div className="w-3 h-3 bg-black/90 rounded-full absolute bottom-2 right-2"></div>
      </div>
    </div>
  );
}