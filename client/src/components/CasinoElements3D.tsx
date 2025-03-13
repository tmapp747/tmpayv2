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
        
        // Scale based on scroll position - zoom in/out effect
        const scaleValue = 1 + (scrollPosition * 0.0005); 
        
        // Rotation based on scroll position
        const rotateValue = scrollPosition * (0.1 + index * 0.05);
        
        htmlDie.style.transform = `scale(${scaleValue}) rotate(${rotateValue}deg)`;
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
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden"
    >
      {/* Dice with different designs */}
      <div 
        className="dice absolute left-[15%] top-[20%] w-14 h-14 bg-white rounded-md border border-gray-300 shadow-md transition-transform duration-300"
      >
        {/* Dots for number 2 */}
        <div className="w-3 h-3 bg-black rounded-full absolute top-2 left-2"></div>
        <div className="w-3 h-3 bg-black rounded-full absolute bottom-2 right-2"></div>
      </div>
      
      <div 
        className="dice absolute right-[20%] top-[30%] w-12 h-12 bg-white rounded-md border border-gray-300 shadow-md transition-transform duration-300"
      >
        {/* Dots for number 6 */}
        <div className="w-2.5 h-2.5 bg-black rounded-full absolute top-2 left-2"></div>
        <div className="w-2.5 h-2.5 bg-black rounded-full absolute top-2 right-2"></div>
        <div className="w-2.5 h-2.5 bg-black rounded-full absolute top-[calc(50%-4px)] left-2"></div>
        <div className="w-2.5 h-2.5 bg-black rounded-full absolute top-[calc(50%-4px)] right-2"></div>
        <div className="w-2.5 h-2.5 bg-black rounded-full absolute bottom-2 left-2"></div>
        <div className="w-2.5 h-2.5 bg-black rounded-full absolute bottom-2 right-2"></div>
      </div>
      
      <div 
        className="dice absolute left-[40%] bottom-[25%] w-16 h-16 bg-white rounded-md border border-gray-300 shadow-md transition-transform duration-300"
      >
        {/* Dots for number 5 */}
        <div className="w-3 h-3 bg-black rounded-full absolute top-2.5 left-2.5"></div>
        <div className="w-3 h-3 bg-black rounded-full absolute top-2.5 right-2.5"></div>
        <div className="w-3 h-3 bg-black rounded-full absolute top-[calc(50%-6px)] left-[calc(50%-6px)]"></div>
        <div className="w-3 h-3 bg-black rounded-full absolute bottom-2.5 left-2.5"></div>
        <div className="w-3 h-3 bg-black rounded-full absolute bottom-2.5 right-2.5"></div>
      </div>
      
      <div 
        className="dice absolute right-[35%] bottom-[45%] w-10 h-10 bg-white rounded-md border border-gray-300 shadow-md transition-transform duration-300"
      >
        {/* Dots for number 4 */}
        <div className="w-2 h-2 bg-black rounded-full absolute top-2 left-2"></div>
        <div className="w-2 h-2 bg-black rounded-full absolute top-2 right-2"></div>
        <div className="w-2 h-2 bg-black rounded-full absolute bottom-2 left-2"></div>
        <div className="w-2 h-2 bg-black rounded-full absolute bottom-2 right-2"></div>
      </div>
    </div>
  );
}