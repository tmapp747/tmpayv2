import { ReactNode } from "react";
import MobileNavigation from "./MobileNavigation";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";

type LayoutProps = {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { theme } = useTheme();

  return (
    <div className={cn(
      "mobile-container flex min-h-screen pb-16 font-inter mobile-safe-area",
      "text-foreground bg-background transition-colors duration-300",
      "max-w-[100vw] overflow-x-hidden",
      theme === "dark" ? "dark" : "light"
    )} 
    style={{ 
      height: 'var(--app-height, 100vh)',
      width: '100%', 
      maxWidth: '100vw',
      overflowX: 'hidden',
      paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 64px)',
    }}
    data-theme={theme}>
      <main className="flex-1 flex flex-col overflow-x-hidden max-w-full relative">
        {children}
      </main>
      <MobileNavigation />
    </div>
  );
}