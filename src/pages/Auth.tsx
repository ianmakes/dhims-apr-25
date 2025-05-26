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
import { Loader2, Mail, Lock } from "lucide-react";
import { useAppSettings } from "@/components/settings/GlobalSettingsProvider";
import { logLogin } from "@/utils/auditLog";
const loginSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address"
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters"
  })
});
export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    settings
  } = useAppSettings();

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const {
        data
      } = await supabase.auth.getSession();
      if (data.session) {
        navigate("/");
      }
    };
    checkSession();
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
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
  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    try {
      setIsLoading(true);
      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
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
  const organizationName = settings?.organization_name || "David's Hope International";
  const logoUrl = settings?.logo_url;
  const primaryColor = settings?.primary_color || "#9b87f5";
  return <div className="min-h-screen flex">
      {/* Left Side - Branding and Illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{
      background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}80 100%)`
    }}>
        {/* Background Illustration */}
        <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1200&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }} />
        
        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Top Section - Logo and Brand */}
          <div className="space-y-6">
            {/* Logo */}
            
            
            {/* Description */}
            <div className="space-y-4 max-w-md">
              <h2 className="text-3xl font-bold leading-tight text-left">David's Hope International</h2>
              <p className="opacity-90 leading-relaxed text-left text-sm">DHI Management System</p>
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

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo (only shown on small screens) */}
          <div className="lg:hidden text-center space-y-4">
            {logoUrl ? <div className="flex justify-center">
                <img src={logoUrl} alt={`${organizationName} Logo`} className="h-16 w-auto object-contain" />
              </div> : <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg" style={{
            backgroundColor: primaryColor
          }}>
                {organizationName.split(' ').map(word => word[0]).join('').slice(0, 2)}
              </div>}
            <div>
              <h1 className="text-xl font-bold text-foreground">{organizationName}</h1>
              <p className="text-sm text-muted-foreground">DHI Management System</p>
            </div>
          </div>

          {/* Login Form */}
          <div className="space-y-6">
            <div className="space-y-2 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-foreground">Login</h2>
              <p className="text-muted-foreground">Sign in to access your account</p>
            </div>

            <Card className="border shadow-lg">
              <CardContent className="p-6 space-y-6">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
                    <FormField control={loginForm.control} name="email" render={({
                    field
                  }) => <FormItem>
                          <FormLabel className="text-sm font-medium">Email address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                              <Input placeholder="you@example.com" type="email" className="pl-10 h-11 bg-background border-border focus:border-primary/50 focus:ring-primary/20" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    
                    <FormField control={loginForm.control} name="password" render={({
                    field
                  }) => <FormItem>
                          <FormLabel className="text-sm font-medium">Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                              <Input placeholder="Enter your password" type="password" className="pl-10 h-11 bg-background border-border focus:border-primary/50 focus:ring-primary/20" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    
                    <Button type="submit" className="w-full h-11 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200" style={{
                    backgroundColor: primaryColor,
                    borderColor: primaryColor
                  }} disabled={isLoading}>
                      {isLoading ? <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </> : "Sign in"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Footer for mobile */}
          <div className="lg:hidden text-center">
            <p className="text-xs text-muted-foreground/60">
              {settings?.footer_text || `© ${new Date().getFullYear()} ${organizationName}. All rights reserved.`}
            </p>
          </div>
        </div>
      </div>
    </div>;
}