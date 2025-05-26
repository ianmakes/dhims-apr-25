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
        error
      } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password
      });
      if (error) {
        throw error;
      }
      toast({
        title: "Login successful",
        description: "Welcome back!"
      });
    } catch (error) {
      const authError = error as AuthError;
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
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4" style={{
    background: `linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--background)) 50%, ${primaryColor}10 100%)`
  }}>
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-8 space-y-6">
          {/* Logo */}
          {logoUrl ? <div className="flex justify-center">
              <img src={logoUrl} alt={`${organizationName} Logo`} className="h-16 w-auto object-contain" />
            </div> : <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg" style={{
          backgroundColor: primaryColor
        }}>
              {organizationName.split(' ').map(word => word[0]).join('').slice(0, 2)}
            </div>}
          
          {/* Organization Name and Description */}
          <div className="space-y-2">
            
            <p className="text-lg text-muted-foreground font-medium">DHI Management System</p>
            <p className="text-muted-foreground/80 text-xs">
              Sign in to your account to continue
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-left">Welcome Back</CardTitle>
            <CardDescription className="text-muted-foreground text-left">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
                <FormField control={loginForm.control} name="email" render={({
                field
              }) => <FormItem>
                      <FormLabel className="text-sm font-medium">Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input placeholder="you@example.com" type="email" className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20" {...field} />
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
                          <Input placeholder="Enter your password" type="password" className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20" {...field} />
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
                    </> : "Sign In"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground/60">
            {settings?.footer_text || `© ${new Date().getFullYear()} ${organizationName}. All rights reserved.`}
          </p>
        </div>
      </div>
    </div>;
}