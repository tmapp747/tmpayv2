/**
 * Emerald Theme Utility Functions and Constants
 * This file contains shared styling elements for the emerald theme to maintain consistency across all pages
 */

export const emeraldTheme = {
  // Card styling
  card: {
    base: "border-emerald-700/30 bg-emerald-900/30 backdrop-blur-sm shadow-xl transition-all duration-300 hover:scale-[1.005] hover:border-yellow-500/40",
    styles: { 
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1), 0 6px 12px rgba(0, 0, 0, 0.1)',
    }
  },
  
  // Card header styling
  cardHeader: {
    base: "border-b border-emerald-700/30 bg-emerald-900/40",
  },
  
  // Card title styling
  cardTitle: {
    base: "text-emerald-100",
    styles: { textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }
  },
  
  // Input field styling
  input: {
    base: "bg-emerald-900/60 border-emerald-700/50 text-white focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/30 transition-all duration-300",
    styles: { 
      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
    }
  },
  
  // Label styling
  label: {
    base: "text-emerald-200 mb-1.5"
  },
  
  // Select field styling
  select: {
    base: "bg-emerald-900/70 border border-emerald-700/50 text-white rounded p-2 text-sm focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/30 transition-all duration-300 hover:border-yellow-500/40",
    styles: { 
      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
      cursor: 'pointer',
    }
  },
  
  // Primary button styling
  button: {
    primary: {
      base: "relative overflow-hidden group bg-gradient-to-br from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white shadow-lg border border-yellow-500/20",
      styles: { 
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2), 0 0 20px rgba(16, 185, 129, 0.15)',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
      },
      shimmer: "absolute inset-0 w-full h-full bg-gradient-to-r from-yellow-300/0 via-yellow-300/30 to-yellow-300/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
    },
    yellow: {
      base: "mt-4 relative overflow-hidden bg-gradient-to-r from-yellow-500/80 to-yellow-600/80 hover:from-yellow-400/90 hover:to-yellow-500/90 text-emerald-950 border border-yellow-400/60 group-hover:scale-105 transition-transform duration-300",
      styles: { 
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2), 0 0 15px rgba(250, 204, 21, 0.2)',
      },
      shimmer: "absolute inset-0 w-full h-full bg-gradient-to-r from-yellow-300/0 via-yellow-100/30 to-yellow-300/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
    }
  },
  
  // Separator styling
  separator: {
    base: "bg-emerald-700/30"
  },
  
  // Panel styling
  panel: {
    base: "bg-emerald-800/30 p-4 rounded-lg border border-emerald-700/40 hover:border-yellow-500/30 hover:bg-emerald-800/50 transition-all duration-300 transform hover:-translate-y-1",
    styles: { 
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      cursor: 'pointer',
    }
  },
  
  // Icon styling
  icon: {
    base: "text-emerald-300 transition-transform duration-300 group-hover:scale-110",
    styles: { filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' }
  },
  
  // Yellow accent icon
  yellowIcon: {
    base: "text-yellow-300",
    styles: { filter: 'drop-shadow(0 0 2px rgba(250, 204, 21, 0.5))' }
  },
  
  // Background effects
  backgroundEffects: {
    gradientOverlay: "absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-yellow-400/10 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
  },
  
  // Feature highlight
  featureHighlight: {
    base: "bg-emerald-800/30 p-5 rounded-lg border border-emerald-700/40 hover:border-yellow-500/40 transition-all duration-300 hover:bg-emerald-800/50 group transform hover:scale-[1.02]",
    styles: { 
      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.1)',
      cursor: 'pointer',
    },
    iconContainer: "mr-4 mt-1 bg-yellow-500/10 p-2 rounded-full transition-all duration-300 group-hover:bg-yellow-500/20 group-hover:scale-110"
  },
  
  // Header card styling for profile and info sections
  headerCard: {
    base: "rounded-xl shadow-lg overflow-hidden mb-6 border border-yellow-500/20 relative",
    styles: {
      background: 'linear-gradient(145deg, rgba(4, 120, 87, 0.9), rgba(5, 150, 105, 0.8))',
      boxShadow: '0 10px 25px rgba(16, 185, 129, 0.25), 0 10px 10px rgba(0, 0, 0, 0.1), 0 0 40px rgba(16, 185, 129, 0.2)'
    },
    glowEffects: [
      "absolute -top-24 -right-24 w-48 h-48 bg-emerald-300/20 rounded-full blur-3xl",
      "absolute top-10 right-10 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl",
      "absolute -bottom-32 -left-32 w-64 h-64 bg-teal-300/10 rounded-full blur-3xl",
      "absolute bottom-10 right-20 w-24 h-24 bg-yellow-300/10 rounded-full blur-2xl"
    ]
  },
  
  // Avatar styling
  avatar: {
    container: "relative",
    glow: "absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 via-yellow-300 to-emerald-500 blur-sm opacity-50 animate-pulse",
    base: "h-24 w-24 bg-white/10 ring-4 ring-yellow-400/30 relative z-10",
    styles: { boxShadow: '0 0 20px rgba(250, 204, 21, 0.3)' },
    fallback: "text-white text-2xl bg-emerald-800 border-2 border-yellow-500/20",
    fallbackStyles: { textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }
  },
  
  // Tab styling
  tabs: {
    list: "grid grid-cols-3 bg-gradient-to-r from-emerald-900/80 to-black/75 border border-yellow-500/20 p-1",
    listStyles: { 
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 0 15px rgba(16, 185, 129, 0.15)',
    },
    trigger: "data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-700/80 data-[state=active]:to-emerald-900/90 data-[state=active]:border-yellow-500/30 data-[state=active]:text-yellow-300 text-emerald-100/70 data-[state=active]:border",
    triggerStyles: { 
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
      boxShadow: 'data-[state=active]:0 0 10px rgba(16, 185, 129, 0.3)'
    }
  },
  
  // Balance panel styling
  balancePanel: {
    base: "relative bg-gradient-to-br from-emerald-900/90 to-black/80 p-3 rounded-lg backdrop-blur-sm border border-yellow-500/20",
    styles: { 
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 0 15px rgba(16, 185, 129, 0.2)',
    },
    titleText: "text-emerald-100/90 text-sm",
    valueText: "text-yellow-300 font-bold text-lg",
    valueStyles: { textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)' }
  }
};

type ComponentWithBase = {
  base: string;
  styles?: Record<string, string | number>;
};

/**
 * Helper function to combine class names and styles from the emerald theme
 */
export function emeraldComponent(componentKey: keyof typeof emeraldTheme, additionalClasses: string = '') {
  // Handle button specially since it has nested structure
  if (componentKey === 'button') {
    const primaryButton = (emeraldTheme.button as any).primary as ComponentWithBase;
    return {
      className: `${primaryButton.base} ${additionalClasses}`,
      style: primaryButton.styles || {}
    };
  }
  
  // For other components
  const component = emeraldTheme[componentKey] as ComponentWithBase;
  
  if (!component.base) {
    console.warn(`Component ${componentKey} does not have a base class`);
    return { className: additionalClasses, style: {} };
  }
  
  return {
    className: `${component.base} ${additionalClasses}`,
    style: component.styles || {}
  };
}