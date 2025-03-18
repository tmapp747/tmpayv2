import React, { useState, useEffect } from 'react';

interface SparklesProps {
  className?: string;
  color?: string;
  count?: number;
}

interface SparklePoint {
  id: number;
  x: number;
  y: number;
  size: number;
  alpha: number;
  duration: number;
}

export function Sparkles({ 
  className = "", 
  color = "#10b981", 
  count = 15 
}: SparklesProps) {
  const [sparkles, setSparkles] = useState<SparklePoint[]>([]);

  // Generate new sparkles on mount
  useEffect(() => {
    const newSparkles: SparklePoint[] = [];
    
    for (let i = 0; i < count; i++) {
      newSparkles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.7 + 0.3,
        duration: Math.random() * 2 + 1
      });
    }
    
    setSparkles(newSparkles);
  }, [count]);

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute rounded-full animate-pulse"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            width: `${sparkle.size}px`,
            height: `${sparkle.size}px`,
            backgroundColor: color,
            opacity: sparkle.alpha,
            animationDuration: `${sparkle.duration}s`,
          }}
        />
      ))}
    </div>
  );
}