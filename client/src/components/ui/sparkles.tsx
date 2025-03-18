"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SparklesProps {
  className?: string;
  children?: React.ReactNode;
  color?: string;
  size?: number;
  count?: number;
  speed?: number;
  overlap?: boolean;
  fadeOut?: boolean;
  isActive?: boolean; // Control if animation is active
}

/**
 * A component that renders sparkles animation around its children
 * 
 * @param className Classes to apply to the wrapper
 * @param children Content to display with the sparkles
 * @param color Color of the sparkles (default: gold/yellow)
 * @param size Size of the sparkles (default: 10px)
 * @param count Number of sparkles to display (default: 30)
 * @param speed Animation speed factor (default: 1)
 * @param overlap Whether sparkles can overlap the content (default: false)
 * @param fadeOut Whether sparkles should fade out (default: true)
 * @param isActive Whether the animation is active (default: true)
 */
export const Sparkles = ({
  className,
  children,
  color = "#FFD700",
  size = 10,
  count = 30,
  speed = 1,
  overlap = false,
  fadeOut = true,
  isActive = true,
}: SparklesProps) => {
  const [sparkles, setSparkles] = useState<Array<{ id: number; left: number; top: number; scale: number; delay: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Create initial sparkles
  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    
    const container = containerRef.current;
    const { width, height } = container.getBoundingClientRect();
    
    const newSparkles = [];
    for (let i = 0; i < count; i++) {
      newSparkles.push({
        id: i,
        left: Math.random() * 100, // percent
        top: Math.random() * 100, // percent
        scale: Math.random() * 0.5 + 0.5, // 0.5-1
        delay: Math.random() * 1000 // ms
      });
    }
    setSparkles(newSparkles);
  }, [count, isActive]);

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-block", className)}
    >
      {isActive && sparkles.map(spark => (
        <span
          key={spark.id}
          className={cn(
            "absolute rounded-full pointer-events-none",
            overlap ? "z-10" : "z-0"
          )}
          style={{
            left: `${spark.left}%`,
            top: `${spark.top}%`,
            width: `${size * spark.scale}px`,
            height: `${size * spark.scale}px`,
            background: color,
            boxShadow: `0 0 ${size / 2}px ${color}`,
            animation: `
              sparkle-${fadeOut ? "fade" : "pulse"} ${1.5 / speed}s ease-in-out ${spark.delay}ms infinite,
              sparkle-move ${3 / speed}s ease-in-out ${spark.delay}ms infinite
            `,
          }}
        />
      ))}
      <div className={overlap ? "" : "relative z-10"}>
        {children}
      </div>
      
      <style>
        {`
        @keyframes sparkle-fade {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes sparkle-pulse {
          0%, 100% { opacity: 0.8; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        
        @keyframes sparkle-move {
          0% { transform: translateY(0) scale(0); }
          50% { transform: translateY(-20px) scale(1); }
          100% { transform: translateY(-30px) scale(0); }
        }
        `}
      </style>
    </div>
  );
};

export default Sparkles;