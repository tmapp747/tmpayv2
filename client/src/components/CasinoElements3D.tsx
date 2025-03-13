import React from 'react';

/**
 * A simplified version of CasinoElements3D that uses CSS animations
 * instead of 3D rendering to avoid potential errors with three.js
 */
export function CasinoElements3D() {
  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
      {/* Casino Chips */}
      <div 
        className="absolute left-[10%] top-[20%] w-12 h-3 bg-red-600 rounded-full animate-float"
        style={{ animationDelay: '0s' }}
      />
      <div 
        className="absolute right-[15%] top-[30%] w-12 h-3 bg-blue-600 rounded-full animate-float"
        style={{ animationDelay: '0.3s' }}
      />
      <div 
        className="absolute left-[25%] bottom-[25%] w-12 h-3 bg-green-600 rounded-full animate-float"
        style={{ animationDelay: '0.6s' }}
      />
      
      {/* Dice */}
      <div 
        className="absolute left-[20%] top-[50%] w-10 h-10 bg-white rounded-md border border-gray-300 shadow-md flex items-center justify-center dice"
        style={{ animationDelay: '0.2s' }}
      >
        <div className="w-2 h-2 bg-black rounded-full absolute top-1.5 left-1.5"></div>
        <div className="w-2 h-2 bg-black rounded-full absolute bottom-1.5 right-1.5"></div>
      </div>
      <div 
        className="absolute right-[30%] bottom-[40%] w-10 h-10 bg-white rounded-md border border-gray-300 shadow-md flex items-center justify-center dice"
        style={{ animationDelay: '0.7s' }}
      >
        <div className="w-2 h-2 bg-black rounded-full absolute top-1.5 left-1.5"></div>
        <div className="w-2 h-2 bg-black rounded-full absolute bottom-1.5 right-1.5"></div>
      </div>
      
      {/* Cards */}
      <div 
        className="absolute left-[5%] bottom-[15%] w-12 h-16 bg-white rounded-md border border-gray-300 shadow-md card"
        style={{ animationDelay: '0.4s' }}
      />
      <div 
        className="absolute right-[5%] top-[15%] w-12 h-16 bg-white rounded-md border border-gray-300 shadow-md card"
        style={{ animationDelay: '0.8s' }}
      />
      
      {/* Gold Sphere (Jackpot) */}
      <div 
        className="absolute left-[45%] top-[40%] w-16 h-16 bg-yellow-400 rounded-full shadow-lg animate-pulse jackpot-text"
        style={{ boxShadow: '0 0 15px rgba(228, 180, 0, 0.8)' }}
      >
        <div className="flex items-center justify-center h-full text-yellow-800 font-bold text-2xl">
          747
        </div>
      </div>
    </div>
  );
}