import * as React from "react";

// Constants
const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

/**
 * Enhanced useIsMobile hook that provides additional device information
 * and mobile-specific functionality
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);
  const [isTablet, setIsTablet] = React.useState<boolean>(false);
  const [isPortrait, setIsPortrait] = React.useState<boolean>(false);
  const [deviceInfo, setDeviceInfo] = React.useState<{
    isIOS: boolean;
    isAndroid: boolean;
    isSafari: boolean;
    isChrome: boolean;
  }>({
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false
  });

  // Check for device type and orientation
  React.useEffect(() => {
    // Device detection
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
    const isChrome = /Chrome/.test(ua);
    
    setDeviceInfo({
      isIOS,
      isAndroid,
      isSafari,
      isChrome
    });

    // Media queries for screen size
    const mobileMql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const tabletMql = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_BREAKPOINT - 1}px)`);
    const orientationMql = window.matchMedia('(orientation: portrait)');
    
    // Handler functions
    const handleMobileChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };
    
    const handleTabletChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsTablet(e.matches);
    };
    
    const handleOrientationChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsPortrait(e.matches);
    };
    
    // Initial checks
    handleMobileChange(mobileMql);
    handleTabletChange(tabletMql);
    handleOrientationChange(orientationMql);
    
    // Event listeners
    mobileMql.addEventListener("change", handleMobileChange);
    tabletMql.addEventListener("change", handleTabletChange);
    orientationMql.addEventListener("change", handleOrientationChange);
    
    // Cleanup
    return () => {
      mobileMql.removeEventListener("change", handleMobileChange);
      tabletMql.removeEventListener("change", handleTabletChange);
      orientationMql.removeEventListener("change", handleOrientationChange);
    };
  }, []);

  // Set up iOS-specific visual viewport adjustments
  React.useEffect(() => {
    if (deviceInfo.isIOS) {
      const handleVisualViewport = () => {
        // This fixes iOS keyboard issues with fixed position elements
        const visualViewport = window.visualViewport;
        if (visualViewport) {
          document.documentElement.style.setProperty('--vh', `${visualViewport.height * 0.01}px`);
        }
      };

      // Add visual viewport event listener for iOS
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleVisualViewport);
        handleVisualViewport(); // Initial call
      }

      return () => {
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleVisualViewport);
        }
      };
    }
  }, [deviceInfo.isIOS]);

  // Apply haptic feedback for touch interactions (if supported on the device)
  const hapticFeedback = React.useCallback((intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      switch (intensity) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(20);
          break;
        case 'heavy':
          navigator.vibrate([10, 20, 30]);
          break;
      }
    }
  }, []);

  return {
    isMobile,
    isTablet,
    isPortrait,
    ...deviceInfo,
    hapticFeedback,
    // For backward compatibility
    valueOf: () => isMobile,
    toString: () => String(isMobile),
    [Symbol.toPrimitive]: () => isMobile
  } as unknown as boolean & {
    isMobile: boolean;
    isTablet: boolean;
    isPortrait: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    isSafari: boolean;
    isChrome: boolean;
    hapticFeedback: (intensity?: 'light' | 'medium' | 'heavy') => void;
  };
}

/**
 * Hook to detect device orientation changes
 */
export function useOrientation() {
  const [orientation, setOrientation] = React.useState<'portrait' | 'landscape'>(
    window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  );

  React.useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
}

/**
 * Hook to detect swipe gestures on mobile
 */
export function useSwipe(
  options: {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    threshold?: number;
  } = {}
) {
  const { 
    onSwipeLeft, 
    onSwipeRight, 
    onSwipeUp, 
    onSwipeDown, 
    threshold = 50 
  } = options;
  
  const touchStart = React.useRef<{ x: number; y: number } | null>(null);
  
  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  }, []);
  
  const handleTouchEnd = React.useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    
    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    };
    
    const deltaX = touchEnd.x - touchStart.current.x;
    const deltaY = touchEnd.y - touchStart.current.y;
    
    // Check if the swipe distance exceeds the threshold
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
      // Horizontal swipe
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > threshold) {
      // Vertical swipe
      if (deltaY > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }
    
    touchStart.current = null;
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]);
  
  return {
    handleTouchStart,
    handleTouchEnd
  };
}
