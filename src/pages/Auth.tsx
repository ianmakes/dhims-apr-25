
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AuthError } from "@supabase/supabase-js";
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useAppSettings } from "@/components/settings/GlobalSettingsProvider";
import { logLogin } from "@/utils/auditLog";
import { BackgroundSlideshow } from "@/components/auth/BackgroundSlideshow";

const loginSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address"
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters"
  })
});

const resetPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address")
});

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings } = useAppSettings();

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate("/");
      }
    };
    checkSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const resetForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: ""
    }
  });

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password
      });
      if (error) {
        throw error;
      }

      // Log the successful login
      if (data.user) {
        await logLogin(data.user.id, `User ${values.email} logged in successfully`);
      }
      toast({
        title: "Login successful",
        description: "Welcome back!"
      });
    } catch (error) {
      const authError = error as AuthError;

      // Log failed login attempt
      await logLogin('unknown', `Failed login attempt for email: ${values.email}. Error: ${authError?.message}`);
      toast({
        title: "Login failed",
        description: authError?.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (values: z.infer<typeof resetPasswordSchema>) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth?reset=true`
      });
      
      if (error) {
        throw error;
      }

      toast({
        title: "Reset email sent",
        description: "Check your email for a password reset link."
      });
      
      // Switch back to login form
      setShowResetForm(false);
      resetForm.reset();
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: "Reset failed",
        description: authError?.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const organizationName = settings?.organization_name || "David's Hope International";
  const logoUrl = settings?.logo_url;
  const primaryColor = settings?.primary_color || "#9b87f5";

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding and Illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}80 100%)`
      }}>
        {/* Background Slideshow */}
        <BackgroundSlideshow />
        
        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Top Section - Logo and Brand */}
          <div className="space-y-6">
            {/* Description */}
            <div className="space-y-4 max-w-md">
              <h2 className="text-3xl font-bold leading-tight text-left">{organizationName}</h2>
            </div>
          </div>

          {/* Bottom Section - Footer */}
          <div className="space-y-4">
            <div className="h-px bg-white/20 w-full"></div>
            <p className="text-sm opacity-75 text-left">
              {settings?.footer_text || `© ${new Date().getFullYear()} ${organizationName}. All rights reserved.`}
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login/Reset Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo (only shown on small screens) */}
          <div className="lg:hidden text-center space-y-4">
            {logoUrl ? (
              <div className="flex justify-center">
                <img src={logoUrl} alt={`${organizationName} Logo`} className="h-16 w-auto object-contain" />
              </div>
            ) : (
              <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg" style={{
                backgroundColor: primaryColor
              }}>
                {organizationName.split(' ').map(word => word[0]).join('').slice(0, 2)}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-foreground">{organizationName}</h1>
              <p className="text-sm text-muted-foreground">DHI Management System</p>
            </div>
          </div>

          {/* Form Content */}
          <div className="space-y-6">
            {!showResetForm ? (
              <>
                {/* Login Form Header */}
                <div className="space-y-2 text-center lg:text-left">
                  <h2 className="text-3xl font-bold text-foreground">Login</h2>
                  <p className="text-muted-foreground">Sign in to access DHIMS</p>
                </div>

                {/* Login Form */}
                <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-8 space-y-6 border-0 shadow-none px-0">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-foreground/80">Email address</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                  {...field}
                                  placeholder="you@example.com"
                                  type="email"
                                  className="pl-12 h-12 bg-white/80 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent transition-all duration-200 rounded-none"
                                />
                              </div>
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
                            <FormLabel className="text-sm font-medium text-foreground/80">Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                  {...field}
                                  placeholder="Enter your password"
                                  type={showPassword ? "text" : "password"}
                                  className="pl-12 pr-12 h-12 bg-white/80 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent transition-all duration-200 rounded-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button
                        type="submit"
                        style={{
                          backgroundColor: primaryColor,
                          borderColor: primaryColor
                        }}
                        disabled={isLoading}
                        className="w-full h-12 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 border-0 rounded-none"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          "Sign in"
                        )}
                      </Button>
                    </form>
                  </Form>

                  {/* Forgot Password Link */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowResetForm(true)}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors underline"
                    >
                      Forgot your password?
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Reset Password Form Header */}
                <div className="space-y-2 text-center lg:text-left">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowResetForm(false)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h2 className="text-3xl font-bold text-foreground">Reset Password</h2>
                  </div>
                  <p className="text-muted-foreground">Enter your email to receive a reset link</p>
                </div>

                {/* Reset Password Form */}
                <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-8 space-y-6 border-0 shadow-none px-0">
                  <Form {...resetForm}>
                    <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-6">
                      <FormField
                        control={resetForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-foreground/80">Email address</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                  {...field}
                                  placeholder="you@example.com"
                                  type="email"
                                  className="pl-12 h-12 bg-white/80 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent transition-all duration-200 rounded-none"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button
                        type="submit"
                        style={{
                          backgroundColor: primaryColor,
                          borderColor: primaryColor
                        }}
                        disabled={isLoading}
                        className="w-full h-12 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 border-0 rounded-none"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending reset link...
                          </>
                        ) : (
                          "Send reset link"
                        )}
                      </Button>
                    </form>
                  </Form>
                </div>
              </>
            )}
          </div>

          {/* Footer for mobile */}
          <div className="lg:hidden text-center">
            <p className="text-xs text-muted-foreground/60">
              {settings?.footer_text || `© ${new Date().getFullYear()} ${organizationName}. All rights reserved.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
