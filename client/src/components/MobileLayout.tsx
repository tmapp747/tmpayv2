
import { ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";
import BottomNavBar from "./navigation/BottomNavBar";
import { initMobileEnhancements } from "@/lib/mobile-utils";
import MobileHeader from "./MobileHeader";

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showNav?: boolean;
  headerContent?: ReactNode;
  customHeader?: boolean;
  gradient?: boolean;
  padding?: boolean;
  transparentHeader?: boolean;
  showLogout?: boolean;
}

export const MobileLayout = ({ 
  children, 
  title, 
  showNav = true, 
  headerContent,
  customHeader = false,
  gradient = true,
  padding = true,
  transparentHeader = false,
  showLogout = true
}: MobileLayoutProps) => {
  // Initialize mobile enhancements (status bar handling, viewport adjustments)
  useEffect(() => {
    initMobileEnhancements();
  }, []);

  return (
    <div className={cn(
      "mobile-container min-h-screen", 
      gradient ? "bg-gradient-to-b from-[#001138] to-[#002D87]" : "bg-background",
      padding ? "px-4" : ""
    )}
    style={{
      paddingBottom: showNav ? 'calc(env(safe-area-inset-bottom, 16px) + 80px)' : 'env(safe-area-inset-bottom, 16px)',
      paddingTop: 'env(safe-area-inset-top, 0px)'
    }}>
      {/* Use custom header if provided */}
      {customHeader && headerContent}
      
      {/* Use the universal MobileHeader component when title is provided and no custom header */}
      {title && !customHeader && (
        <MobileHeader 
          title={title} 
          transparent={transparentHeader}
          showLogout={showLogout}
          customClassName={padding ? "-mx-4 px-4" : ""}
        />
      )}
      
      <main className={cn(
        "flex-1",
        !padding && !customHeader && title ? "mt-4" : "",
        showNav ? "pb-16" : ""
      )}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {showNav && <BottomNavBar />}
    </div>
  );
};

export default MobileLayout;
