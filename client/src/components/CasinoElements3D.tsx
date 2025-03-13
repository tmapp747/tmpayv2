import React, { useEffect, useRef } from 'react';

/**
 * Casino elements with only dice that rotate slowly and roam around the header
 */
export function CasinoElements3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    let animationFrameId: number;
    const diceElements = containerRef.current?.querySelectorAll('.dice');
    
    if (!diceElements || diceElements.length === 0) return;
    
    const startTime = Date.now();
    
    const animateDice = () => {
      const elapsedTime = (Date.now() - startTime) / 1000; // Convert to seconds
      
      // Get the header dimensions for movement constraints
      const headerHeight = containerRef.current?.clientHeight || 56; // Default to 56px (14rem) if not set
      const headerWidth = containerRef.current?.clientWidth || window.innerWidth;
      
      diceElements.forEach((die, index) => {
        const htmlDie = die as HTMLElement;
        
        // Very slow rotation - one full rotation every ~2 minutes
        const rotateValue = (elapsedTime * (2.5 + index * 0.5)) % 360;
        
        // Extremely restricted horizontal movement within header width
        // Very limited vertical movement to stay within header height
        const maxMoveX = headerWidth * 0.25; // 25% of header width
        const maxMoveY = headerHeight * 0.25; // 25% of header height
        
        // Calculate movement within the header boundaries with very slow movement
        const offsetX = Math.sin(elapsedTime * 0.1 + index * 0.5) * maxMoveX;
        const offsetY = Math.cos(elapsedTime * 0.08 + index * 0.3) * maxMoveY;
        
        // Keep the dice within the header bounds (from center point)
        const centerX = headerWidth / 2;
        const centerY = headerHeight / 2;
        
        // Add a subtle scale variation based on header size
        // Scale dice smaller on smaller screens with less variation
        const diceBaseSize = Math.min(headerHeight * 0.4, 16); // Size based on header height, max 16px
        const scaleBase = diceBaseSize / 20; // Normalize based on the max size
        const scaleVariation = Math.sin(elapsedTime * 0.05) * 0.03; // Less variation
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
      className="relative w-full h-full pointer-events-none overflow-hidden opacity-30 z-10"
    >
      {/* Two dice in the header only - sized proportionally */}
      <div 
        className="dice absolute left-[30%] top-[25%] w-4 h-4 sm:w-6 sm:h-6 bg-white/90 rounded-md border border-gray-300/70 shadow-sm transition-transform duration-5000"
      >
        {/* Dots for number 2 */}
        <div className="w-[3px] h-[3px] sm:w-1.5 sm:h-1.5 bg-black/90 rounded-full absolute top-[3px] left-[3px] sm:top-1 sm:left-1"></div>
        <div className="w-[3px] h-[3px] sm:w-1.5 sm:h-1.5 bg-black/90 rounded-full absolute bottom-[3px] right-[3px] sm:bottom-1 sm:right-1"></div>
      </div>
      
      <div 
        className="dice absolute right-[20%] top-[40%] w-5 h-5 sm:w-7 sm:h-7 bg-white/90 rounded-md border border-gray-300/70 shadow-sm transition-transform duration-5000"
      >
        {/* Dots for number 5 */}
        <div className="w-[2px] h-[2px] sm:w-1 sm:h-1 bg-black/90 rounded-full absolute top-[2px] left-[2px] sm:top-1 sm:left-1"></div>
        <div className="w-[2px] h-[2px] sm:w-1 sm:h-1 bg-black/90 rounded-full absolute top-[2px] right-[2px] sm:top-1 sm:right-1"></div>
        <div className="w-[2px] h-[2px] sm:w-1 sm:h-1 bg-black/90 rounded-full absolute top-[calc(50%-1px)] left-[calc(50%-1px)] sm:top-[calc(50%-2px)] sm:left-[calc(50%-2px)]"></div>
        <div className="w-[2px] h-[2px] sm:w-1 sm:h-1 bg-black/90 rounded-full absolute bottom-[2px] left-[2px] sm:bottom-1 sm:left-1"></div>
        <div className="w-[2px] h-[2px] sm:w-1 sm:h-1 bg-black/90 rounded-full absolute bottom-[2px] right-[2px] sm:bottom-1 sm:right-1"></div>
      </div>
    </div>
  );
}