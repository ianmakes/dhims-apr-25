
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { logUpdate } from "@/utils/auditLog";

const emailFormSchema = z.object({
  provider: z.enum(["smtp", "resend"]),
  from_name: z.string().min(1, { message: "From name is required" }),
  from_email: z.string().email({ message: "Please enter a valid email address" }),
  smtp_host: z.string().optional(),
  smtp_port: z.string().optional(),
  smtp_username: z.string().optional(),
  smtp_password: z.string().optional(),
  resend_api_key: z.string().optional(),
  notifications_enabled: z.boolean().default(true),
  notify_new_student: z.boolean().default(true),
  notify_new_sponsor: z.boolean().default(true),
  notify_sponsorship_change: z.boolean().default(true)
}).refine(data => {
  if (data.provider === 'smtp') {
    return !!data.smtp_host && !!data.smtp_port && !!data.smtp_username;
  }
  if (data.provider === 'resend') {
    return !!data.resend_api_key;
  }
  return true;
}, {
  message: "Please provide all required fields for the selected provider",
  path: ['provider']
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

export default function EmailSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      provider: "smtp",
      from_name: "",
      from_email: "",
      smtp_host: "",
      smtp_port: "",
      smtp_username: "",
      smtp_password: "",
      resend_api_key: "",
      notifications_enabled: true,
      notify_new_student: true,
      notify_new_sponsor: true,
      notify_sponsorship_change: true
    }
  });
  
  const { watch } = form;
  const selectedProvider = watch("provider");
  const notificationsEnabled = watch("notifications_enabled");

  useEffect(() => {
    fetchEmailSettings();
  }, []);

  const fetchEmailSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("email_settings")
        .select("*")
        .eq("id", "default")
        .single();
      
      if (error && error.code !== "PGRST116") {
        throw error;
      }
      
      if (data) {
        setSettings(data);
        form.reset({
          provider: data.provider || "smtp",
          from_name: data.from_name || "",
          from_email: data.from_email || "",
          smtp_host: data.smtp_host || "",
          smtp_port: data.smtp_port || "",
          smtp_username: data.smtp_username || "",
          smtp_password: data.smtp_password || "",
          resend_api_key: data.resend_api_key || "",
          notifications_enabled: data.notifications_enabled ?? true,
          notify_new_student: data.notify_new_student ?? true,
          notify_new_sponsor: data.notify_new_sponsor ?? true,
          notify_sponsorship_change: data.notify_sponsorship_change ?? true
        });
      } else {
        // Apply defaults if no settings found
        form.reset({
          provider: "smtp",
          from_name: "David's Hope International",
          from_email: "noreply@davidshope.org",
          smtp_host: "",
          smtp_port: "587",
          smtp_username: "",
          smtp_password: "",
          resend_api_key: "",
          notifications_enabled: true,
          notify_new_student: true,
          notify_new_sponsor: true,
          notify_sponsorship_change: true
        });
      }
    } catch (error) {
      console.error("Error fetching email settings:", error);
      toast({
        title: "Error",
        description: "Could not load email settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: EmailFormValues) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from("email_settings")
        .upsert({
          id: "default", // Use a fixed ID for the single settings record
          provider: data.provider,
          from_name: data.from_name,
          from_email: data.from_email,
          smtp_host: data.provider === "smtp" ? data.smtp_host : null,
          smtp_port: data.provider === "smtp" ? data.smtp_port : null,
          smtp_username: data.provider === "smtp" ? data.smtp_username : null,
          smtp_password: data.provider === "smtp" ? data.smtp_password : null,
          resend_api_key: data.provider === "resend" ? data.resend_api_key : null,
          notifications_enabled: data.notifications_enabled,
          notify_new_student: data.notify_new_student,
          notify_new_sponsor: data.notify_new_sponsor,
          notify_sponsorship_change: data.notify_sponsorship_change,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;

      // Log the update to audit log
      await logUpdate("email_settings", "default", "Updated email settings");
      
      toast({
        title: "Settings saved",
        description: "Email settings have been updated successfully"
      });
      
      // Refresh settings from server
      fetchEmailSettings();
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testEmailSettings = async () => {
    try {
      setIsTesting(true);
      
      const values = form.getValues();
      
      const payload: any = {
        provider: values.provider,
        fromName: values.from_name,
        fromEmail: values.from_email
      };
      
      if (values.provider === "smtp") {
        payload.smtpHost = values.smtp_host;
        payload.smtpPort = values.smtp_port;
        payload.smtpUsername = values.smtp_username;
        payload.smtpPassword = values.smtp_password;
      } else if (values.provider === "resend") {
        payload.resendApiKey = values.resend_api_key;
      }
      
      const { data: functionData, error: functionError } = await supabase.functions
        .invoke("test-email-settings", {
          body: JSON.stringify(payload)
        });
      
      if (functionError) throw new Error(functionError.message);
      
      if (!functionData.success) {
        throw new Error(functionData.message || "Failed to send test email");
      }
      
      toast({
        title: "Test email sent",
        description: `A test email was sent to ${values.from_email}`
      });
    } catch (error: any) {
      console.error("Error sending test email:", error);
      toast({
        title: "Failed to send test email",
        description: error.message || "Check your email settings and try again",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Email & SMTP</h3>
        <p className="text-muted-foreground text-sm">
          Configure email delivery settings and notification preferences
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Email Provider</CardTitle>
              <CardDescription>
                Choose your email delivery provider and configure its settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Provider</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select email provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="smtp">SMTP Server</SelectItem>
                        <SelectItem value="resend">Resend.com</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the provider you want to use to send emails
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="from_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        The name displayed as the sender of emails
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="from_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormDescription>
                        The email address used to send emails
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Tabs value={selectedProvider} className="mt-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="smtp"
                    onClick={() => form.setValue("provider", "smtp")}
                  >
                    SMTP Configuration
                  </TabsTrigger>
                  <TabsTrigger
                    value="resend"
                    onClick={() => form.setValue("provider", "resend")}
                  >
                    Resend.com
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="smtp" className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="smtp_host"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Host</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="smtp.example.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="smtp_port"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Port</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="587" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="smtp_username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="smtp_password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="resend" className="mt-4">
                  <FormField
                    control={form.control}
                    name="resend_api_key"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resend API Key</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showApiKey ? "text" : "password"}
                              {...field}
                              placeholder="re_1234567890abcdefghijklmnopqrstuv"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowApiKey(!showApiKey)}
                            >
                              {showApiKey ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Sign up at{" "}
                          <a
                            href="https://resend.com"
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary underline hover:no-underline"
                          >
                            resend.com
                          </a>{" "}
                          to get your API key
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end mt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="mr-2"
                  onClick={testEmailSettings}
                  disabled={isTesting || isLoading}
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    "Send Test Email"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure when and how email notifications are sent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="notifications_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Email Notifications</FormLabel>
                      <FormDescription>
                        Enable or disable all email notifications
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className={notificationsEnabled ? "" : "opacity-50 pointer-events-none"}>
                <FormField
                  control={form.control}
                  name="notify_new_student"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>New Student Notifications</FormLabel>
                        <FormDescription>
                          Send notifications when new students are added
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!notificationsEnabled}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notify_new_sponsor"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 mt-2">
                      <div className="space-y-0.5">
                        <FormLabel>New Sponsor Notifications</FormLabel>
                        <FormDescription>
                          Send notifications when new sponsors are added
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!notificationsEnabled}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notify_sponsorship_change"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 mt-2">
                      <div className="space-y-0.5">
                        <FormLabel>Sponsorship Changes</FormLabel>
                        <FormDescription>
                          Send notifications when sponsorship status changes
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!notificationsEnabled}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Email Settings"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
