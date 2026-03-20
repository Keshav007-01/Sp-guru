import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import ErrorFallback from "./components/ErrorFallback";

// Enable custom styles in addition to tailwind
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
  :root {
    --color-saffron: #FF9933;
    --color-divine-blue: #4A90E2;
    --color-spiritual: #9C27B0;
    --color-cream-bg: #F8F4E3;
    --color-calm-gray: #333333;
    --color-success: #4CAF50;
    --color-alert: #FF5722;
  }

  /* Custom utility classes */
  .bg-saffron { background-color: var(--color-saffron); }
  .text-saffron { color: var(--color-saffron); }
  .bg-divine-blue { background-color: var(--color-divine-blue); }
  .text-divine-blue { color: var(--color-divine-blue); }
  .bg-spiritual { background-color: var(--color-spiritual); }
  .text-spiritual { color: var(--color-spiritual); }
  .bg-cream-bg { background-color: var(--color-cream-bg); }
  .text-calm-gray { color: var(--color-calm-gray); }
  .bg-calm-gray { background-color: var(--color-calm-gray); }
  .font-sanskrit { font-family: 'Noto Sans Devanagari', sans-serif; }
  .font-poppins { font-family: 'Poppins', sans-serif; }
  .font-nunito { font-family: 'Nunito', sans-serif; }
`;
document.head.appendChild(styleSheet);

// Get the root element
const rootElement = document.getElementById("root");

// Root level error boundary as a class component
class RootErrorBoundary extends React.Component<
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
    console.error("Application failed to load:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error || undefined} />;
    }
    return this.props.children;
  }
}

function initializeApp() {
  try {
    // Get the fallback container
    const fallbackContainer = document.getElementById('fallback-container');
    
    // Log environment and browser information
    const envMode = import.meta.env.MODE === "production" ? "production" : "development";
    console.log(`Application initializing in: ${envMode}`);
    console.log(`Browser: ${navigator.userAgent}`);
    console.log(`Current URL: ${window.location.href}`);
    
    // Check for critical environment variables and report
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };
    
    // Log config presence
    console.log("Environment variables check:", Object.keys(firebaseConfig).reduce((acc, key) => {
      // Only log presence of values, not the actual values for security
      acc[key] = Boolean(firebaseConfig[key as keyof typeof firebaseConfig]);
      return acc;
    }, {} as Record<string, boolean>));
    
    // Display domain information for debugging
    if (envMode === "production") {
      console.log(`Running on domain: ${window.location.hostname}`);
      
      // Check if we're on authorized domain
      const allowedDomains = ['divinemantras108.com', 'www.divinemantras108.com', 'localhost', '127.0.0.1', '.replit.app'];
      const currentDomain = window.location.hostname;
      const isDomainAllowed = allowedDomains.some(domain => 
        domain.startsWith('.') 
          ? currentDomain.endsWith(domain.substring(1)) 
          : currentDomain === domain
      );
      
      console.log(`Domain authorization check: ${isDomainAllowed ? 'Passed' : 'Failed'}`);
      
      if (!isDomainAllowed) {
        console.warn(`Current domain ${currentDomain} is not in the list of authorized domains. This may cause Firebase authentication issues.`);
      }
    }
    
    // Add unhandled promise rejection tracking
    window.addEventListener('unhandledrejection', function(event) {
      console.error('Unhandled Promise Rejection:', event.reason);
      // Display user-friendly error
      if (fallbackContainer) {
        fallbackContainer.innerHTML = `
          <div style="max-width: 500px; padding: 2rem; text-align: center; background-color: white; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <div style="color: #FF9933; font-size: 2rem; margin-bottom: 1rem;">Divine Mantras</div>
            <h1 style="color: #333; font-size: 1.5rem; margin-bottom: 1.5rem;">Something went wrong</h1>
            <p style="color: #666; margin-bottom: 1.5rem;">We encountered an error while processing your request.</p>
            <p style="color: #666; margin-bottom: 1.5rem; font-size: 0.875rem; background-color: #f5f5f5; padding: 1rem; border-radius: 4px; word-break: break-word; text-align: left;">
              ${event.reason?.message || 'Unknown error - Promise rejection'}
            </p>
            <button onclick="window.location.reload()" style="background-color: #FF9933; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer; font-family: inherit;">
              Reload App
            </button>
          </div>
        `;
        fallbackContainer.style.display = 'flex';
      }
    });
    
    // Render the application with our error boundaries
    console.log("Rendering React application...");
    const root = createRoot(rootElement!);
    root.render(
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    );
    console.log("React application rendered successfully");
    
  } catch (error) {
    console.error("Failed to initialize application:", error);
    
    // Get the fallback container
    const fallbackContainer = document.getElementById('fallback-container');
    
    // Display detailed error information
    if (fallbackContainer) {
      fallbackContainer.innerHTML = `
        <div style="max-width: 500px; padding: 2rem; text-align: center; background-color: white; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          <div style="color: #FF9933; font-size: 2rem; margin-bottom: 1rem;">Divine Mantras</div>
          <h1 style="color: #333; font-size: 1.5rem; margin-bottom: 1.5rem;">Application Error</h1>
          <p style="color: #666; margin-bottom: 1rem;">We encountered a critical error while starting the application.</p>
          
          <div style="color: #666; margin-bottom: 1.5rem; font-size: 0.875rem; background-color: #f5f5f5; padding: 1rem; border-radius: 4px; text-align: left;">
            <p style="font-weight: bold; margin-bottom: 0.5rem;">Error details:</p>
            <p style="word-break: break-word;">${error instanceof Error ? error.message : "Unknown error"}</p>
            ${error instanceof Error && error.stack ? `<details>
              <summary style="cursor: pointer; margin-top: 0.5rem;">Technical details</summary>
              <pre style="overflow: auto; margin-top: 0.5rem; font-size: 0.75rem;">${error.stack}</pre>
            </details>` : ''}
          </div>
          
          <p style="color: #666; margin-bottom: 1rem; font-size: 0.875rem;">
            Environment: ${import.meta.env.MODE === "production" ? "Production" : "Development"}<br>
            URL: ${window.location.href}<br>
            Time: ${new Date().toLocaleString()}
          </p>
          
          <button onclick="window.location.reload()" style="background-color: #FF9933; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer; font-family: inherit; margin-right: 0.5rem;">
            Reload App
          </button>
          <a href="/auth" style="display: inline-block; background-color: transparent; color: #FF9933; border: 1px solid #FF9933; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer; font-family: inherit; text-decoration: none;">
            Go to Login
          </a>
        </div>
      `;
      fallbackContainer.style.display = 'flex';
    } else {
      // Extra fallback if even our fallback container is missing
      rootElement!.innerHTML = `
        <div style="display: flex; min-height: 100vh; align-items: center; justify-content: center; font-family: sans-serif; background-color: #F8F4E3;">
          <div style="max-width: 500px; padding: 2rem; text-align: center; background-color: white; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #FF9933; font-size: 2rem; margin-bottom: 1rem;">Divine Mantras</h1>
            <p style="color: #333; margin-bottom: 1.5rem;">Critical application error</p>
            <p style="color: #666; margin-bottom: 1.5rem; font-size: 0.875rem; background-color: #f5f5f5; padding: 1rem; border-radius: 4px; word-break: break-word;">
              ${error instanceof Error ? error.message : "Unknown error"}
            </p>
            <button onclick="window.location.reload()" style="background-color: #FF9933; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer;">
              Reload Application
            </button>
          </div>
        </div>
      `;
    }
  }
}

// Initialize the application
initializeApp();
