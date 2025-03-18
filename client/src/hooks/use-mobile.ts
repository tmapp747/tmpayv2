import { useState, useEffect } from 'react';

/**
 * Hook to detect if the current device is a mobile device
 * Uses a combination of screen width and user agent detection
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Function to check if the device is mobile
    const checkMobile = () => {
      // Consider devices with width < 768px as mobile
      const isNarrowScreen = window.innerWidth < 768;
      
      // Also check user agent for mobile device indicators
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(userAgent);
      
      // Touch devices are typically mobile
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Set as mobile if screen is narrow AND either device is mobile or has touch
      setIsMobile(isNarrowScreen && (isMobileDevice || hasTouch));
    };

    // Check initially
    checkMobile();

    // Listen for resize events
    window.addEventListener('resize', checkMobile);

    // Clean up
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

export default useIsMobile;