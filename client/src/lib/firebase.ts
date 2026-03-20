import { initializeApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { 
  getAuth, 
  Auth,
  fetchSignInMethodsForEmail,
  browserSessionPersistence,
  indexedDBLocalPersistence,
  setPersistence,
  inMemoryPersistence,
  signInWithEmailAndPassword
} from 'firebase/auth';

// Custom error class for Firebase configuration issues
class FirebaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FirebaseConfigError';
  }
}

// Verbose logging for debugging
console.log("Firebase initialization starting...");

// Function to safely check environment variables
function getEnvVar(key: string): string | undefined {
  const value = import.meta.env[key];
  console.log(`Env var ${key} is ${value ? 'present' : 'missing'}`);
  return value;
}

// Check required Firebase config variables
const apiKey = getEnvVar('VITE_FIREBASE_API_KEY');
const authDomain = getEnvVar('VITE_FIREBASE_AUTH_DOMAIN');
const projectId = getEnvVar('VITE_FIREBASE_PROJECT_ID');
const appId = getEnvVar('VITE_FIREBASE_APP_ID');

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
// Initialize this to true by default to prevent initial error flash
let isFirebaseAuthAvailable = true;

// Create a detailed object for debugging config issues
const configDebug = {
  apiKey: !!apiKey,
  authDomain: !!authDomain,
  projectId: !!projectId,
  storageBucket: !!getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: !!getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: !!appId,
  measurementId: !!getEnvVar('VITE_FIREBASE_MEASUREMENT_ID')
};

console.log("Firebase config prepared:", configDebug);

try {
  if (!apiKey || !projectId || !appId) {
    throw new FirebaseConfigError('Missing required Firebase configuration');
  }

  // Create the full Firebase configuration object with fallbacks for optional values
  const firebaseConfig: FirebaseOptions = {
    apiKey,
    // Use default Firebase domain pattern if authDomain is not provided
    authDomain: authDomain || `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET') || `${projectId}.appspot.com`,
    messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId,
    measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID')
  };

  // Initialize Firebase
  console.log("Initializing Firebase app...");
  app = initializeApp(firebaseConfig);
  console.log("Firebase app initialized successfully");

  // Initialize Auth
  console.log("Initializing Firebase auth...");
  auth = getAuth(app);
  
  // Set application environment context for debugging
  console.log("Application initializing in:", import.meta.env.MODE || 'development');
  
  if (auth) {
    console.log("Auth configuration:", {
      currentUser: auth.currentUser ? auth.currentUser.email : "No user",
      tenantId: auth.tenantId || "No tenant ID",
      appName: auth.app.name
    });
    
    // Set persistence based on environment
    const persistence = import.meta.env.MODE === 'production' 
      ? indexedDBLocalPersistence // Use IndexedDB in production for longer sessions
      : browserSessionPersistence; // Use session persistence in development (clears on tab close)
    
    // Set persistence without waiting for it to complete
    setPersistence(auth, persistence)
      .then(() => {
        console.log("Auth persistence set successfully");
      })
      .catch(error => {
        // Just log the error, don't disable authentication
        console.warn("Non-critical: Error setting auth persistence:", error);
      });
    
    // Verify the Auth service is working by testing a method
    // This check is performed in the background and won't block UI
    fetchSignInMethodsForEmail(auth, 'test@example.com')
      .then(() => {
        console.log("Firebase Authentication service verified successfully");
        isFirebaseAuthAvailable = true;
      })
      .catch(error => {
        console.warn("Firebase Authentication service verification failed, but continuing:", error);
        // Even if verification fails, we'll still try to use auth
        // Only set to false for severe configuration errors
        if (error.code === 'auth/configuration-not-found' || 
            error.code === 'auth/project-not-found') {
          isFirebaseAuthAvailable = false;
          console.error("Critical Firebase authentication configuration error:", error.code);
        }
      });
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
  app = null;
  auth = null;
  isFirebaseAuthAvailable = false;
}

// Get browser information for debugging
try {
  console.log("Browser:", navigator.userAgent);
  console.log("Current URL:", window.location.href);
  
  // Log environment variables availability (not values)
  console.log("Environment variables check:", {
    apiKey: !!apiKey,
    authDomain: !!authDomain,
    projectId: !!projectId,
    appId: !!appId
  });
} catch (e) {
  console.log("Environment info not available in this context");
}

console.log("Rendering React application...");

// Export initialized Firebase services
export { app, auth, isFirebaseAuthAvailable };

// Add a general app status check
try {
  setTimeout(() => {
    console.log("React application rendered successfully");
    console.log("Page fully loaded");
  }, 1000);
} catch (e) {
  console.error("Error in page load tracking:", e);
}