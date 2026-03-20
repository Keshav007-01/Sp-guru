import { useAuth } from '@/contexts/AuthContext';
import { Redirect, useLocation } from 'wouter';
import { Loader2, AlertTriangle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  optional?: boolean; // When true, allows access without authentication
}

export default function ProtectedRoute({ children, optional = false }: ProtectedRouteProps) {
  const { currentUser, loading } = useAuth();
  const [location, navigate] = useLocation();
  const [redirecting, setRedirecting] = useState(false);

  // Add debugging logs
  useEffect(() => {
    console.log("ProtectedRoute rendering, auth state:", { 
      loading, 
      isAuthenticated: !!currentUser,
      optional,
      user: currentUser ? {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName
      } : null
    });
  }, [loading, currentUser, optional]);

  // Handle navigation in useEffect to avoid React errors
  useEffect(() => {
    if (!loading && !currentUser && !optional && location !== '/auth') {
      console.log("No authenticated user found, navigating to /auth");
      setRedirecting(true);
      // Small delay to avoid React rendering issues
      setTimeout(() => {
        navigate('/auth');
      }, 10);
    }
  }, [loading, currentUser, navigate, location, optional]);

  if (loading || (redirecting && !optional)) {
    return (
      <div className="flex h-screen items-center justify-center flex-col">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-gray-500">
          {loading ? "Loading authentication..." : "Redirecting to login..."}
        </p>
      </div>
    );
  }

  // If this is an optional route, allow access even without authentication
  if (optional) {
    return <>{children}</>;
  }

  // If we're already on the auth page, don't try to redirect again
  if (!currentUser && location !== '/auth') {
    return (
      <div className="flex h-screen items-center justify-center flex-col">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-gray-500">Redirecting to login...</p>
      </div>
    );
  }

  // User is authenticated, render children
  if (currentUser) {
    console.log("User is authenticated, rendering protected content");
    return <>{children}</>;
  }

  // Fallback error state
  return (
    <div className="flex h-screen items-center justify-center p-6">
      <Alert variant="destructive" className="max-w-md">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle>Authentication Error</AlertTitle>
        <AlertDescription className="mt-2">
          There was a problem with the authentication system. 
          <div className="mt-4">
            <Button onClick={() => navigate("/auth")}>
              Go to Login Page
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}