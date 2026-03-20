import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
});

const signupSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters long' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
  confirmPassword: z.string().min(6, { message: 'Confirm password must be at least 6 characters long' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const passwordResetSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;
type PasswordResetFormValues = z.infer<typeof passwordResetSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { logIn, signUp, resetPassword, currentUser, firebaseAuthEnabled } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Add debugging information
  console.log("AuthPage rendering, auth state:", { 
    isLoggedIn: !!currentUser,
    isSubmitting,
    firebaseAuthEnabled
  });

  // Redirect if user is already logged in
  useEffect(() => {
    if (currentUser) {
      console.log("User is already logged in, redirecting to home");
      setLocation('/');
    }
  }, [currentUser, setLocation]);
  
  // Return loading state if user is logged in, to prevent flash of content
  if (currentUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Redirecting...</span>
      </div>
    );
  }
  
  // Handle the case where authentication is not ready yet but not showing error
  if (!firebaseAuthEnabled && !isSubmitting) {
    // Silently retry auth after a delay instead of showing an error
    useEffect(() => {
      const retryTimer = setTimeout(() => {
        console.log("Silently retrying authentication setup");
        window.location.reload();
      }, 3000);
      
      return () => clearTimeout(retryTimer);
    }, []);
  }

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordResetForm = useForm<PasswordResetFormValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: '',
    },
  });

  async function handleLogin(values: LoginFormValues) {
    setIsSubmitting(true);
    try {
      console.log("Starting login for:", values.email);
      await logIn(values.email, values.password);
      console.log("Login successful, redirecting...");
      setLocation('/');
    } catch (error) {
      console.error("Login error in AuthPage:", error);
      // Most errors are handled in the auth context, but we can add additional handling here
      if (!loginForm.formState.errors.root) {
        toast({
          title: 'Login failed',
          description: 'There was a problem logging in. Please check your credentials and try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignup(values: SignupFormValues) {
    setIsSubmitting(true);
    try {
      console.log("Starting user registration for:", values.email);
      await signUp(values.email, values.password, values.name);
      console.log("Registration successful, redirecting...");
      toast({
        title: 'Account created!',
        description: 'Your account has been created successfully. You are now logged in.',
      });
      setLocation('/');
    } catch (error) {
      console.error("Registration error in AuthPage:", error);
      // Most errors are handled in the auth context, but we can add additional handling here
      // This is a fallback in case the error wasn't properly caught in the auth context
      if (!signupForm.formState.errors.root) {
        toast({
          title: 'Registration failed',
          description: 'There was a problem creating your account. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Email/password authentication only

  async function handlePasswordReset(values: PasswordResetFormValues) {
    setIsSubmitting(true);
    try {
      console.log("Starting password reset for:", values.email);
      await resetPassword(values.email);
      console.log("Password reset email sent successfully");
      setShowForgotPassword(false);
      setActiveTab('login');
    } catch (error) {
      console.error("Password reset error in AuthPage:", error);
      // Most errors are handled in the auth context, but we can add additional handling here
      if (!passwordResetForm.formState.errors.root) {
        toast({
          title: 'Password Reset Failed',
          description: 'There was a problem sending the reset link. Please check your email and try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Get the current domain for helpful error messages
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left column - Auth forms */}
      <div className="w-full md:w-1/3 flex items-center justify-center p-4">
        <Card className="w-full max-w-md md:max-w-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Divine Mantras</CardTitle>
            <CardDescription className="text-xs">
              {showForgotPassword 
                ? "Enter your email for password reset" 
                : "Please sign in to continue"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showForgotPassword ? (
              <Form {...passwordResetForm}>
                <form onSubmit={passwordResetForm.handleSubmit(handlePasswordReset)} className="space-y-3">
                  <FormField
                    control={passwordResetForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Send Reset Link
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={() => setShowForgotPassword(false)}>
                    Back to Login
                  </Button>
                </form>
              </Form>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
  
                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-3">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Sign In
                      </Button>
                    </form>
                  </Form>
                  <div className="mt-1 text-center">
                    <Button variant="link" className="text-xs py-0" onClick={() => setShowForgotPassword(true)}>
                      Forgot password?
                    </Button>
                  </div>
                </TabsContent>
  
                <TabsContent value="signup">
                  <Form {...signupForm}>
                    <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-3">
                      <FormField
                        control={signupForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signupForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signupForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Create a password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signupForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirm your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Create Account
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
          
          {/* Testing credentials removed as requested */}
        </Card>
      </div>
      
      {/* Right column - Hero section */}
      <div className="w-full md:w-2/3 bg-gradient-to-br from-orange-100 to-amber-200 hidden md:flex flex-col items-center justify-center p-6 md:p-10 text-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-4 text-amber-800">Begin Your Spiritual Journey</h1>
          <p className="text-base md:text-lg mb-6 text-amber-700">
            Access authentic mantras, guided meditations, and spiritual 
            practices from the Hindu tradition.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white/70 p-3 rounded-lg shadow">
              <h3 className="font-semibold text-amber-800">108 Repetitions</h3>
              <p className="text-xs text-amber-700">Digital mala counter</p>
            </div>
            <div className="bg-white/70 p-3 rounded-lg shadow">
              <h3 className="font-semibold text-amber-800">Audio Guidance</h3>
              <p className="text-xs text-amber-700">Authentic pronunciation</p>
            </div>
            <div className="bg-white/70 p-3 rounded-lg shadow">
              <h3 className="font-semibold text-amber-800">Sacred Knowledge</h3>
              <p className="text-xs text-amber-700">Learn meanings & benefits</p>
            </div>
          </div>
          <p className="text-amber-700 italic text-sm">
            "The mantra becomes one's staff of life and carries one through every ordeal." - Mahatma Gandhi
          </p>
        </div>
      </div>
    </div>
  );
}