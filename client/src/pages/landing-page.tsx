import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";

export default function LandingPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [, setLocation] = useLocation();
  
  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);
  
  return (
    <div className={`min-h-screen flex flex-col ${theme === "dark" ? "dark" : "light"}`}>
      {/* Header */}
      <header className="h-16 border-b border-border shadow-sm flex items-center px-4 md:px-6 justify-between bg-card text-card-foreground">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 overflow-hidden">
            <svg viewBox="0 0 200 200" className="h-full w-full">
              <circle cx="100" cy="100" r="90" fill="#1a2b47" />
              <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#b78628" fontSize="60" fontWeight="bold">747</text>
            </svg>
          </div>
          <span className="font-medium text-lg">747 E-Wallet</span>
        </div>
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <Link href="/auth">
            <Button size="sm" variant="outline">
              Sign In
            </Button>
          </Link>
        </div>
      </header>
      
      {/* Hero section that fills the screen */}
      <main className="flex-1 flex items-center justify-center bg-background text-foreground px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-foreground">
              747 E-Wallet
            </h1>
            <p className="text-xl md:text-2xl max-w-2xl mx-auto mb-8 text-muted-foreground">
              Secure and efficient payment platform for casino players
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/auth">
                <Button 
                  size="lg" 
                  className="text-base shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="mt-16 opacity-70 text-sm">
            &copy; {new Date().getFullYear()} 747 Casino. All rights reserved.
          </div>
        </div>
      </main>
    </div>
  );
}