import React from 'react';
import { useLocation } from 'wouter';

interface ErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
  message?: string;
}

export default function ErrorFallback({ 
  error, 
  resetErrorBoundary,
  message = "Something went wrong with the application."
}: ErrorFallbackProps) {
  const [_, navigate] = useLocation();
  
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6 bg-cream-bg">
      <div className="max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-amber-600 mb-4">Application Error</h2>
        <p className="mb-4">{message}</p>
        
        {error && (
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40 mb-4">
            {error.message || "Unknown error"}
          </pre>
        )}
        
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
          >
            Reload Application
          </button>
          
          <button
            onClick={() => navigate('/auth')}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Go to Login Page
          </button>
          
          {resetErrorBoundary && (
            <button
              onClick={resetErrorBoundary}
              className="px-4 py-2 border border-amber-500 text-amber-500 rounded hover:bg-amber-50"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}