import { useState, useEffect } from "react";
import { Redirect, Route } from "wouter";
import { Loader2 } from "lucide-react";

export function ProtectedAdminRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        // Use the new server-side authentication check endpoint
        const response = await fetch("/api/admin/auth-status", {
          method: 'GET',
          credentials: 'include', // Important for session cookies
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.isAdmin) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Admin auth check error:", error);
        setIsAdmin(false);
      }
    };

    checkAdminAuth();
  }, []);

  if (isAdmin === null) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!isAdmin) {
    return (
      <Route path={path}>
        <Redirect to="/admin/auth" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}