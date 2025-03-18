
import { ReactNode } from "react";
import MobileNavigation from "./MobileNavigation";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showNav?: boolean;
}

export const MobileLayout = ({ children, title, showNav = true }: MobileLayoutProps) => {
  return (
    <div className="mobile-container min-h-screen bg-background">
      {title && (
        <header className={cn(
          "sticky top-0 z-40 w-full",
          "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        )}>
          <div className="container h-14 flex items-center">
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
        </header>
      )}
      
      <main className="flex-1 container pb-24">
        {children}
      </main>

      {showNav && <MobileNavigation />}
    </div>
  );
};

export default MobileLayout;
