
import { ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";
import BottomNavBar from "./navigation/BottomNavBar";
import { initMobileEnhancements } from "@/lib/mobile-utils";

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showNav?: boolean;
  headerContent?: ReactNode;
  customHeader?: boolean;
  gradient?: boolean;
  padding?: boolean;
}

export const MobileLayout = ({ 
  children, 
  title, 
  showNav = true, 
  headerContent,
  customHeader = false,
  gradient = true,
  padding = true
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
      {customHeader && headerContent}
      
      {title && !customHeader && (
        <header className={cn(
          "sticky top-0 z-40 w-full",
          "backdrop-blur-md bg-[#00174F]/70 px-4 py-4"
        )}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-white">{title}</h1>
            </div>
            {headerContent}
          </div>
        </header>
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
