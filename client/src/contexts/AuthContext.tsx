import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  getAuth,
  Auth
} from 'firebase/auth';
import { auth, isFirebaseAuthAvailable } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  firebaseAuthEnabled: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // Start with true to prevent flashing error messages
  const [firebaseAuthEnabled, setFirebaseAuthEnabled] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let authCheckTimeout: number;
    let unsubscribe = () => {};
    
    try {
      console.log("AuthProvider initializing, checking Firebase config...");
      
      // Check if Firebase config is properly loaded
      const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
      if (!apiKey) {
        console.error("Firebase API key is missing. Environment variables may not be properly loaded.");
        setError(new Error("Firebase configuration is missing or incomplete"));
        setFirebaseAuthEnabled(false);
        setLoading(false);
        return;
      }
      
      console.log("Firebase config loaded, setting up auth state listener...");
      
      // Set up auth state observer
      if (auth) {
        unsubscribe = onAuthStateChanged(auth, 
          (user) => {
            console.log("Auth state changed:", user ? `User logged in: ${user.email}` : "No user");
            setCurrentUser(user);
            setLoading(false);
            
            // If we got here without errors, auth service is working
            setFirebaseAuthEnabled(true);
            
            // Clear any pending timeout since auth is working
            if (authCheckTimeout) {
              clearTimeout(authCheckTimeout);
            }
          },
          (error) => {
            console.error("Auth state change error:", error);
            setError(error);
            setLoading(false);
            
            // Check for configuration errors
            if (error.message?.includes('auth/configuration-not-found') || 
                error.message?.includes('CONFIGURATION_NOT_FOUND')) {
              setFirebaseAuthEnabled(false);
              
              // Show error toast but with less alarming message
              toast({
                title: "Authentication Notice",
                description: "Setting up authentication service...",
                variant: "default",
              });
            } else {
              // Don't show error toast for normal auth errors
              console.warn("Non-critical auth error:", error.message);
            }
          }
        );
        
        // Use our isFirebaseAuthAvailable flag from firebase.ts but don't wait too long
        // This check runs in parallel with auth state setup
        authCheckTimeout = window.setTimeout(() => {
          // Only update if still loading (auth state listener hasn't fired yet)
          if (loading) {
            console.log("Auth availability check result:", isFirebaseAuthAvailable);
            setFirebaseAuthEnabled(isFirebaseAuthAvailable);
            
            // If auth isn't available after checking but we're not showing error yet
            if (!isFirebaseAuthAvailable && loading) {
              setLoading(false);
            }
          }
        }, 2000); // Give more time for auth to initialize
      } else {
        // No auth available, set loading to false
        console.warn("Auth object not available");
        setLoading(false);
      }

      return () => {
        unsubscribe();
        if (authCheckTimeout) {
          clearTimeout(authCheckTimeout);
        }
      };
    } catch (err) {
      console.error("Error in AuthProvider initialization:", err);
      setError(err as Error);
      setLoading(false);
      
      // Only show toast for serious errors
      if (err instanceof Error && 
          !err.message.includes('timeout') && 
          !err.message.includes('network')) {
        toast({
          title: "Authentication System",
          description: "Setting up authentication service...",
          variant: "default",
        });
      }
      
      return () => {
        unsubscribe();
        if (authCheckTimeout) {
          clearTimeout(authCheckTimeout);
        }
      };
    }
  }, [toast]);

  async function signUp(email: string, password: string, displayName: string) {
    try {
      console.log("Starting user registration with email:", email);
      console.log("Firebase auth state before registration:", !!auth);
      
      // Add additional validation
      if (!email || !password) {
        const msg = "Email and password are required";
        console.error(msg);
        toast({
          title: "Registration failed",
          description: msg,
          variant: "destructive",
        });
        throw new Error(msg);
      }
      
      // Check if auth is available
      if (!auth) {
        const msg = "Authentication service is not available";
        console.error(msg);
        toast({
          title: "Registration failed",
          description: msg,
          variant: "destructive",
        });
        throw new Error(msg);
      }
      
      // Attempt to create user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("User created successfully, now updating profile");
      
      // Update user profile with displayName
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
        console.log("User profile updated with displayName:", displayName);
      }
    } catch (error) {
      console.error("Registration error:", error);
      let errorMessage = "Registration failed: ";
      
      if (error instanceof Error) {
        errorMessage += error.message;
        // Check for specific Firebase auth errors
        if (error.message.includes("email-already-in-use")) {
          errorMessage = "This email is already registered. Please try logging in instead.";
        } else if (error.message.includes("invalid-email")) {
          errorMessage = "Please enter a valid email address.";
        } else if (error.message.includes("weak-password")) {
          errorMessage = "Password should be at least 6 characters.";
        } else if (error.message.includes("network")) {
          errorMessage = "Network error. Please check your internet connection.";
        }
      } else {
        errorMessage += "Unknown error occurred";
      }
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  }

  async function logIn(email: string, password: string) {
    try {
      console.log("Attempting login with email:", email);
      console.log("Firebase auth state before login:", !!auth);
      
      // Add additional validation
      if (!email || !password) {
        const msg = "Email and password are required";
        console.error(msg);
        toast({
          title: "Login failed",
          description: msg,
          variant: "destructive",
        });
        throw new Error(msg);
      }
      
      // Check if auth is available
      if (!auth) {
        const msg = "Authentication service is not available";
        console.error(msg);
        toast({
          title: "Login failed",
          description: msg,
          variant: "destructive",
        });
        throw new Error(msg);
      }
      
      // Attempt to sign in
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful for email:", email);
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "Login failed: ";
      
      if (error instanceof Error) {
        errorMessage += error.message;
        // Check for specific Firebase auth errors
        if (error.message.includes("user-not-found") || error.message.includes("wrong-password")) {
          errorMessage = "Invalid email or password.";
        } else if (error.message.includes("too-many-requests")) {
          errorMessage = "Too many failed login attempts. Please try again later.";
        } else if (error.message.includes("network")) {
          errorMessage = "Network error. Please check your internet connection.";
        }
      } else {
        errorMessage += "Unknown error occurred";
      }
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  }

  async function logOut() {
    try {
      if (!auth) {
        console.log("No auth available, skipping logout");
        return;
      }
      await signOut(auth);
    } catch (error) {
      const errorMessage = (error as Error).message;
      toast({
        title: "Logout failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  }

  async function resetPassword(email: string) {
    try {
      if (!auth) {
        const msg = "Authentication service is not available";
        console.error(msg);
        toast({
          title: "Password Reset Failed",
          description: msg,
          variant: "destructive",
        });
        throw new Error(msg);
      }
      
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for further instructions",
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      toast({
        title: "Password Reset Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  }

  async function updateUserProfile(displayName: string, photoURL?: string) {
    if (!currentUser) return;
    
    try {
      await updateProfile(currentUser, { 
        displayName, 
        photoURL: photoURL || currentUser.photoURL 
      });
      
      // Force refresh the user to get the updated profile
      setCurrentUser({ ...currentUser, displayName, photoURL: photoURL || currentUser.photoURL });
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated",
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      toast({
        title: "Profile Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  }

  const value = {
    currentUser,
    loading,
    firebaseAuthEnabled,
    signUp,
    logIn,
    logOut,
    resetPassword,
    updateUserProfile
  };

  // Create a loading state component for better user experience
  const AuthLoadingState = () => (
    <div className="flex items-center justify-center w-full min-h-[50vh]">
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <div className="w-16 h-16 border-4 border-t-amber-500 border-r-amber-700 border-b-amber-900 border-l-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
        <h3 className="text-xl font-semibold mb-2">Loading Authentication...</h3>
        <p className="text-gray-600">Please wait while we verify your credentials.</p>
      </div>
    </div>
  );
  
  // Use a functional component for the error state to simplify rendering
  const AuthErrorState = () => {
    if (!error) return null;
    
    return (
      <div className="flex items-center justify-center w-full min-h-[50vh]">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2">Authentication System Error</h3>
          <p className="text-gray-600 mb-4">
            We're experiencing issues with our authentication service. Please try again later.
          </p>
          <div className="bg-gray-100 p-4 rounded text-sm text-left mb-4 max-h-32 overflow-auto">
            <p className="font-medium">Error details:</p>
            <p className="text-red-600">{error.message}</p>
          </div>
          <div className="flex space-x-2 justify-center">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded">
              Reload Page
            </button>
            {!firebaseAuthEnabled && (
              <button 
                onClick={() => setError(null)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded">
                Try Email Login
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Render the provider with appropriate loading and error states
  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <AuthLoadingState />
      ) : error && !firebaseAuthEnabled ? (
        // Show error, but still render children with limited functionality
        <>
          <AuthErrorState />
          {children}
        </>
      ) : error ? (
        <AuthErrorState />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}