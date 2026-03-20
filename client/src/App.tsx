import React, { useEffect, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import DeityMantras from "@/pages/DeityMantras";
import ChantingPage from "@/pages/ChantingPage";
import AuthPage from "@/pages/AuthPage";
import FavoritesPage from "@/pages/FavoritesPage";
import ProfilePage from "@/pages/ProfilePage";
import MeditationPage from "@/pages/MeditationPage";
import BlogPage from "@/pages/BlogPage";
import BlogPostPage from "@/pages/BlogPostPage";
import AllMantrasPage from "@/pages/AllMantrasPage";
import AboutPage from "@/pages/AboutPage";
import LegalPage from "@/pages/LegalPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ErrorFallback from "./components/ErrorFallback";
import { AdProvider, useAds } from "./contexts/AdContext";
import { AuthProvider } from "./contexts/AuthContext";

function Router() {
  return (
    <Switch>
      <Route path="/auth">
        <AuthPage />
      </Route>
      
      {/* Protected Routes */}
      <Route path="/">
        <ProtectedRoute optional={true}>
          <Home />
        </ProtectedRoute>
      </Route>
      
      <Route path="/mantras">
        <ProtectedRoute optional={true}>
          <AllMantrasPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/deity/:deityId">
        {(params) => (
          <ProtectedRoute optional={true}>
            <DeityMantras params={params} />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/chant/:deityId/:mantraId">
        {(params) => (
          <ProtectedRoute optional={true}>
            <ChantingPage params={params} />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/favorites">
        <ProtectedRoute>
          <FavoritesPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/profile">
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/meditation">
        <ProtectedRoute optional={true}>
          <MeditationPage />
        </ProtectedRoute>
      </Route>
      
      {/* Blog Routes */}
      <Route path="/blog">
        <ProtectedRoute optional={true}>
          <BlogPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/blog/:slug">
        {(params) => (
          <ProtectedRoute optional={true}>
            <BlogPostPage />
          </ProtectedRoute>
        )}
      </Route>
      
      {/* About Page */}
      <Route path="/about">
        <AboutPage />
      </Route>
      
      {/* Legal Page */}
      <Route path="/legal">
        <LegalPage />
      </Route>
      
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

// This component is used to handle Google AdSense site verification
function GoogleAdSenseHead() {
  const { adsenseClientId, adsenseEnabled } = useAds();
  
  useEffect(() => {
    // Only add the meta tag if adsense is enabled and we have a valid client ID
    if (adsenseEnabled && adsenseClientId) {
      // Add Google AdSense meta tag for site verification
      const metaTag = document.createElement('meta');
      metaTag.name = 'google-adsense-account';
      metaTag.content = adsenseClientId.replace('ca-', ''); // Remove 'ca-' prefix if present
      document.head.appendChild(metaTag);

      return () => {
        // Cleanup
        const existingMeta = document.querySelector('meta[name="google-adsense-account"]');
        if (existingMeta) {
          document.head.removeChild(existingMeta);
        }
      };
    }
  }, [adsenseClientId, adsenseEnabled]);

  return null;
}

// Error boundary component follows

// Error boundary class component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("App error boundary caught error:", error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error || undefined} 
          resetErrorBoundary={this.resetErrorBoundary}
          message="We encountered an error while loading the application. This might be due to network issues or authentication problems."
        />
      );
    }

    return this.props.children;
  }
}

function App() {
  const [location] = useLocation();

  React.useEffect(() => {
    // Log when App mounts to debug initialization
    console.log("App component mounted");
    
    // Check if environment variables are properly loaded
    const firebaseApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    console.log("Firebase API key available:", !!firebaseApiKey);
    
    return () => {
      console.log("App component unmounted");
    };
  }, []);

  // Wrap everything in an error boundary
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AdProvider>
            <GoogleAdSenseHead />
            <div className="relative overflow-hidden font-nunito text-calmGray min-h-screen flex flex-col">
              <Navbar />
              <main className="container mx-auto px-4 py-8 mb-20 flex-grow">
                <Router />
              </main>
              <Footer />
            </div>
            <Toaster />
          </AdProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
