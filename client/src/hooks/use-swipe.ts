import { useEffect, useRef, useState } from 'react';

type SwipeDirection = 'left' | 'right' | 'up' | 'down' | null;

interface SwipeOptions {
  threshold?: number; // Minimum distance traveled to be considered swipe
  minVelocity?: number; // Minimum velocity required to be considered swipe
  timeout?: number; // Maximum time allowed to be considered swipe (ms)
}

/**
 * Hook to detect swipe gestures on touch devices
 * 
 * @param elementRef Ref to the element to detect swipes on. If not provided, will use document.
 * @param options Configuration options for swipe detection
 * @returns An object containing the current swipe direction and reset function
 */
export function useSwipe(
  elementRef?: React.RefObject<HTMLElement>,
  options?: SwipeOptions
) {
  const [direction, setDirection] = useState<SwipeDirection>(null);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const startTime = useRef<number | null>(null);
  
  const defaultOptions = {
    threshold: 50, // px
    minVelocity: 0.3, // px/ms
    timeout: 300, // ms
    ...options,
  };
  
  const reset = () => {
    setDirection(null);
  };
  
  useEffect(() => {
    const target = elementRef?.current || document;
    
    const handleTouchStart = (e: Event) => {
      const touchEvent = e as TouchEvent;
      startX.current = touchEvent.touches[0].clientX;
      startY.current = touchEvent.touches[0].clientY;
      startTime.current = Date.now();
    };
    
    const handleTouchEnd = (e: Event) => {
      const touchEvent = e as TouchEvent;
      if (
        startX.current === null ||
        startY.current === null ||
        startTime.current === null
      ) {
        return;
      }
      
      const endX = touchEvent.changedTouches[0].clientX;
      const endY = touchEvent.changedTouches[0].clientY;
      const deltaX = endX - startX.current;
      const deltaY = endY - startY.current;
      const timeTaken = Date.now() - startTime.current;
      
      // Reset start values
      startX.current = null;
      startY.current = null;
      startTime.current = null;
      
      // If the gesture is too slow, don't consider it a swipe
      if (timeTaken > defaultOptions.timeout) {
        return;
      }
      
      // Calculate velocity
      const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / timeTaken;
      
      // If velocity is too low, don't consider it a swipe
      if (velocity < defaultOptions.minVelocity) {
        return;
      }
      
      // Determine direction of swipe
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) < defaultOptions.threshold) {
          return;
        }
        
        if (deltaX > 0) {
          setDirection('right');
        } else {
          setDirection('left');
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) < defaultOptions.threshold) {
          return;
        }
        
        if (deltaY > 0) {
          setDirection('down');
        } else {
          setDirection('up');
        }
      }
    };
    
    // Add event listeners
    target.addEventListener('touchstart', handleTouchStart, { passive: true });
    target.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Cleanup event listeners
    return () => {
      target.removeEventListener('touchstart', handleTouchStart);
      target.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, defaultOptions]);
  
  return { direction, reset };
}

export default useSwipe;