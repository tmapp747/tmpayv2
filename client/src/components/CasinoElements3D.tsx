import React, { useEffect, useRef } from 'react';

/**
 * Casino elements with only dice that rotate and zoom during scrolling
 */
export function CasinoElements3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDiceOnScroll = () => {
      if (!containerRef.current) return;
      
      const scrollPosition = window.scrollY;
      const dice = containerRef.current.querySelectorAll('.dice');
      
      dice.forEach((die, index) => {
        const htmlDie = die as HTMLElement;
        
        // Scale based on scroll position - subtle zoom effect
        const scaleValue = 1 + (scrollPosition * 0.0002); 
        
        // Rotation based on scroll position - more gentle rotation
        const rotateValue = scrollPosition * (0.05 + index * 0.02);
        
        // Add a small vertical drift for more dimension
        const driftValue = Math.sin(scrollPosition * 0.01 + index) * 5;
        
        htmlDie.style.transform = `scale(${scaleValue}) rotate(${rotateValue}deg) translateY(${driftValue}px)`;
      });
    };
    
    // Initial positioning
    updateDiceOnScroll();
    
    // Add scroll event listener
    window.addEventListener('scroll', updateDiceOnScroll);
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', updateDiceOnScroll);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-25 z-0"
    >
      {/* Dice positioned in less intrusive locations */}
      <div 
        className="dice absolute left-[5%] top-[10%] w-10 h-10 bg-white/80 rounded-md border border-gray-300/50 shadow-md transition-transform duration-300"
      >
        {/* Dots for number 2 */}
        <div className="w-2 h-2 bg-black/70 rounded-full absolute top-2 left-2"></div>
        <div className="w-2 h-2 bg-black/70 rounded-full absolute bottom-2 right-2"></div>
      </div>
      
      <div 
        className="dice absolute right-[10%] top-[40%] w-8 h-8 bg-white/80 rounded-md border border-gray-300/50 shadow-md transition-transform duration-300"
      >
        {/* Dots for number 6 */}
        <div className="w-1.5 h-1.5 bg-black/70 rounded-full absolute top-1.5 left-1.5"></div>
        <div className="w-1.5 h-1.5 bg-black/70 rounded-full absolute top-1.5 right-1.5"></div>
        <div className="w-1.5 h-1.5 bg-black/70 rounded-full absolute top-[calc(50%-3px)] left-1.5"></div>
        <div className="w-1.5 h-1.5 bg-black/70 rounded-full absolute top-[calc(50%-3px)] right-1.5"></div>
        <div className="w-1.5 h-1.5 bg-black/70 rounded-full absolute bottom-1.5 left-1.5"></div>
        <div className="w-1.5 h-1.5 bg-black/70 rounded-full absolute bottom-1.5 right-1.5"></div>
      </div>
      
      <div 
        className="dice absolute left-[80%] bottom-[15%] w-12 h-12 bg-white/80 rounded-md border border-gray-300/50 shadow-md transition-transform duration-300"
      >
        {/* Dots for number 5 */}
        <div className="w-2 h-2 bg-black/70 rounded-full absolute top-2 left-2"></div>
        <div className="w-2 h-2 bg-black/70 rounded-full absolute top-2 right-2"></div>
        <div className="w-2 h-2 bg-black/70 rounded-full absolute top-[calc(50%-4px)] left-[calc(50%-4px)]"></div>
        <div className="w-2 h-2 bg-black/70 rounded-full absolute bottom-2 left-2"></div>
        <div className="w-2 h-2 bg-black/70 rounded-full absolute bottom-2 right-2"></div>
      </div>
      
      <div 
        className="dice absolute right-[85%] bottom-[60%] w-7 h-7 bg-white/80 rounded-md border border-gray-300/50 shadow-md transition-transform duration-300"
      >
        {/* Dots for number 4 */}
        <div className="w-1.5 h-1.5 bg-black/70 rounded-full absolute top-1.5 left-1.5"></div>
        <div className="w-1.5 h-1.5 bg-black/70 rounded-full absolute top-1.5 right-1.5"></div>
        <div className="w-1.5 h-1.5 bg-black/70 rounded-full absolute bottom-1.5 left-1.5"></div>
        <div className="w-1.5 h-1.5 bg-black/70 rounded-full absolute bottom-1.5 right-1.5"></div>
      </div>
    </div>
  );
}