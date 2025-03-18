/**
 * Mobile-specific utility functions for enhancing the user experience
 * on mobile devices.
 */

/**
 * Checks if the current device is a mobile device based on screen width and user agent
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check screen width
  const isNarrowScreen = window.innerWidth < 768;
  
  // Check user agent
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(userAgent);
  
  // Check touch capabilities
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return isNarrowScreen || isMobileAgent || hasTouch;
}

/**
 * Checks if the current device is iOS
 */
export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/i.test(userAgent) && !window.MSStream;
}

/**
 * Sets up iOS-specific visual viewport adjustments
 * This helps fix issues with the iOS keyboard and viewport
 */
export function setupIOSViewport(): void {
  if (typeof window === 'undefined') return;
  
  if (isIOSDevice()) {
    // Use visual viewport API if available
    if (window.visualViewport) {
      const viewportHandler = () => {
        // Adjust the height when keyboard appears
        const visibleHeight = window.visualViewport!.height;
        document.documentElement.style.setProperty('--viewport-height', `${visibleHeight}px`);
      };
      
      window.visualViewport.addEventListener('resize', viewportHandler);
      window.visualViewport.addEventListener('scroll', viewportHandler);
      
      // Initial call
      viewportHandler();
    } else {
      // Fallback for older iOS versions
      window.addEventListener('resize', () => {
        document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
      });
      
      // Initial call
      document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
    }
  }
}

/**
 * Apply haptic feedback on iOS devices (if supported)
 */
export function hapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light'): void {
  // Use navigator.vibrate for Android
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'heavy':
        navigator.vibrate([10, 30, 10]);
        break;
    }
  }
  
  // For iOS we need to use AudioContext for a small "click" sound as a hacky haptic feedback
  if (isIOSDevice()) {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Set properties based on feedback type
      switch (type) {
        case 'light':
          gainNode.gain.value = 0.1;
          oscillator.frequency.value = 200;
          break;
        case 'medium':
          gainNode.gain.value = 0.2;
          oscillator.frequency.value = 300;
          break;
        case 'heavy':
          gainNode.gain.value = 0.3;
          oscillator.frequency.value = 400;
          break;
      }
      
      // Very short duration to simulate a tap
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 5);
    } catch (error) {
      console.warn('Haptic feedback via audio not supported', error);
    }
  }
}

/**
 * Adds app-like swipe navigation for going back
 */
export function setupSwipeNavigation(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  
  let startX: number;
  let startTime: number;
  
  const handleTouchStart = (e: TouchEvent) => {
    startX = e.touches[0].clientX;
    startTime = Date.now();
  };
  
  const handleTouchEnd = (e: TouchEvent) => {
    if (!startX) return;
    
    const endX = e.changedTouches[0].clientX;
    const diffX = endX - startX;
    const diffTime = Date.now() - startTime;
    
    // If swiped more than 30% of screen width from left edge and fast enough
    if (
      diffX > window.innerWidth * 0.3 && 
      diffTime < 300 && 
      startX < window.innerWidth * 0.1
    ) {
      // Provide haptic feedback
      hapticFeedback('medium');
      
      // Go back in history
      window.history.back();
    }
    
    startX = 0;
  };
  
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchend', handleTouchEnd, { passive: true });
}

/**
 * Initialize all mobile enhancements
 */
export function initMobileEnhancements(): void {
  if (isMobileDevice()) {
    setupIOSViewport();
    setupSwipeNavigation();
    
    // Add a utility class to the body
    if (typeof document !== 'undefined') {
      document.body.classList.add('is-mobile-device');
      
      if (isIOSDevice()) {
        document.body.classList.add('is-ios-device');
      }
    }
  }
}