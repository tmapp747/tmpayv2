# Mobile Optimization Guide

This document outlines the mobile optimization strategies implemented in the 747 Casino E-Wallet application to ensure a native-like mobile experience.

## Overview

The application has been optimized for mobile devices with particular attention to:

1. Preventing unwanted zooming and scrolling
2. Handling iOS-specific viewport and keyboard issues
3. Implementing smooth scrolling and native-like interactions
4. Supporting safe areas for modern mobile devices
5. Providing haptic feedback when available

## Meta Tags

The following meta tags have been added to `client/index.html`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="theme-color" content="#000000" />
```

These tags:
- Prevent pinch zooming with `maximum-scale=1.0` and `user-scalable=no`
- Allow full-screen mode when added to home screen with `apple-mobile-web-app-capable`
- Set the iOS status bar style with `apple-mobile-web-app-status-bar-style`
- Define theme color for mobile browsers with `theme-color`
- Enable safe area insets with `viewport-fit=cover`

## CSS Utilities

### Mobile Classes

We've added several utility classes to `client/src/index.css`:

1. **mobile-container**: Base container with proper height and scrolling behavior
2. **mobile-safe-area**: Adds padding for device safe areas (notches, etc.)
3. **mobile-clickable**: Optimizes elements for touch interaction
4. **native-button**: Provides native-like button behavior and feedback

### iOS Height Fix

iOS has issues with the `100vh` height. We've implemented a fix in `client/index.html`:

```javascript
function setAppHeight() {
  const doc = document.documentElement;
  doc.style.setProperty('--app-height', `${window.innerHeight}px`);
}
window.addEventListener('resize', setAppHeight);
window.addEventListener('orientationchange', setAppHeight);
setAppHeight();
```

This dynamically sets a CSS variable that we use instead of `100vh`.

### Preventing Unwanted Behavior

We've added scripts to prevent common mobile web annoyances:

```javascript
// Prevent bounce scroll on iOS
document.addEventListener('touchmove', function(event) {
  if (event.touches.length > 1) {
    event.preventDefault();
  }
}, { passive: false });

// Prevent pull-to-refresh on mobile
document.body.addEventListener('touchstart', function(e) {
  if (e.touches.length === 1 && e.touches[0].clientY <= 10) {
    e.preventDefault();
  }
}, { passive: false });
```

## JavaScript Utilities

We've created a comprehensive set of mobile utilities in `client/src/lib/mobile-utils.ts`:

1. **isMobileDevice()**: Detects if user is on a mobile device
2. **isIOSDevice()**: Specifically detects iOS devices
3. **setupIOSViewport()**: Handles iOS keyboard and viewport issues
4. **hapticFeedback()**: Provides haptic feedback when available
5. **setupSwipeNavigation()**: Adds native-like swipe gestures
6. **initMobileEnhancements()**: Initializes all mobile optimizations

## Keyboard Handling

Mobile keyboards can disrupt layout. We handle this with:

1. **Visual Viewport API** for modern browsers
2. Fallback detection for older devices
3. CSS adjustments when the keyboard is visible
4. Auto-scrolling to keep focused elements in view

```css
.keyboard-open {
  padding-bottom: var(--keyboard-height, 0px);
}

.keyboard-open .fixed-bottom {
  display: none !important;
}
```

## Component-Specific Optimizations

### Layout Component

The main Layout component has been enhanced for mobile with:

1. Sticky header that remains visible during scroll
2. Properly positioned fixed footer navigation
3. Content area with native-like scrolling
4. Safe area insets for modern device compatibility

### Mobile Navigation

The mobile navigation bar has been optimized with:

1. Touch-friendly tap targets
2. Haptic feedback on interaction
3. Safe area insets for modern devices
4. Native-like visual feedback

## Implementation Details

To implement these optimizations in your components:

1. Use the `mobile-container` class for main containers
2. Apply `mobile-safe-area` where appropriate
3. Add `mobile-clickable` to interactive elements
4. Use `native-button` for button elements
5. Consider keyboard interactions for form fields

## Best Practices

When developing for mobile:

1. Test on actual devices whenever possible
2. Pay special attention to iOS Safari behavior
3. Ensure interactive elements are at least 44x44px
4. Remember forms and keyboards need special handling
5. Use device detection to provide platform-specific enhancements

## Future Improvements

Potential future enhancements include:

1. Full PWA support with service workers
2. Native app-like animations and transitions
3. Enhanced touch gesture support
4. Offline functionality
5. Push notification integration