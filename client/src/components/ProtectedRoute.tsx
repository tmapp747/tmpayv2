import React, { ComponentType, ReactElement } from "react";
import { Route, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface ProtectedRouteProps {
  component: ComponentType<any>;
  path: string;
}

export const ProtectedRoute = ({ component: Component, path, ...rest }: ProtectedRouteProps): ReactElement => {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  return (
    <Route
      path={path}
      {...rest}
      component={(props: any) => {
        // If auth is still loading, show nothing or a loading spinner
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin h-10 w-10 border-4 border-secondary rounded-full border-t-transparent"></div>
            </div>
          );
        }

        // If user is not authenticated, redirect to auth page
        if (!user) {
          // Redirect to auth page with the route they were trying to access
          setTimeout(() => {
            navigate(`/auth?redirect=${path}`);
          }, 100);
          
          return null;
        }

        // If user is authenticated, render the component
        return <Component {...props} />;
      }}
    />
  );
};