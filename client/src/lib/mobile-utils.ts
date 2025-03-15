// Mobile utility functions to enhance mobile experience

/**
 * Checks if the current device is a mobile device
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Checks if the current device is iOS
 */
export function isIOSDevice(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

/**
 * Sets up iOS-specific visual viewport adjustments
 * This helps fix issues with the iOS keyboard and viewport
 */
export function setupIOSViewport(): void {
  if (!isIOSDevice()) return;
  
  const originalHeight = window.innerHeight;
  
  window.addEventListener('focusin', (e) => {
    // Check if the focused element is an input or textarea
    if (
      e.target instanceof HTMLInputElement || 
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      // Add a small delay to allow the keyboard to fully open
      setTimeout(() => {
        // Add a class to the body to adjust the layout when keyboard is open
        document.body.classList.add('keyboard-open');
        
        // Scroll the element into view with some padding
        const element = e.target as HTMLElement;
        element.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 300);
    }
  });
  
  window.addEventListener('focusout', () => {
    // Remove the keyboard-open class when focus is lost
    document.body.classList.remove('keyboard-open');
    
    // Reset scroll position to prevent content from being stuck
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 50);
  });
  
  // Listen for visual viewport changes (iOS Safari)
  if ('visualViewport' in window) {
    window.visualViewport?.addEventListener('resize', () => {
      // Calculate how much the keyboard is taking up
      const keyboardHeight = originalHeight - window.visualViewport!.height;
      
      if (keyboardHeight > 150) {
        // Keyboard is likely open
        document.body.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
        document.body.classList.add('keyboard-open');
      } else {
        // Keyboard is likely closed
        document.body.classList.remove('keyboard-open');
      }
    });
  }
}

/**
 * Apply haptic feedback on iOS devices (if supported)
 */
export function hapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light'): void {
  if (!isIOSDevice()) return;
  
  // Check if navigator has haptic feedback support
  if ('vibrate' in navigator) {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'heavy':
        navigator.vibrate([20, 30, 20]);
        break;
    }
  }
}

/**
 * Adds app-like swipe navigation for going back
 */
export function setupSwipeNavigation(): void {
  let startX: number;
  let endX: number;
  const threshold = 100; // Minimum swipe distance
  
  document.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
  }, { passive: true });
  
  document.addEventListener('touchend', (e) => {
    endX = e.changedTouches[0].clientX;
    
    // If swipe right from left edge, go back
    if (startX < 30 && endX - startX > threshold) {
      window.history.back();
    }
  }, { passive: true });
}

/**
 * Initialize all mobile enhancements
 */
export function initMobileEnhancements(): void {
  if (isMobileDevice()) {
    setupIOSViewport();
    setupSwipeNavigation();
    
    // Add meta tags dynamically if needed
    const existingThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!existingThemeColor) {
      const themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';
      themeColorMeta.content = '#000000';
      document.head.appendChild(themeColorMeta);
    }
    
    // Apply class to body for mobile-specific styles
    document.body.classList.add('mobile-device');
    
    if (isIOSDevice()) {
      document.body.classList.add('ios-device');
    } else {
      document.body.classList.add('android-device');
    }
  }
}