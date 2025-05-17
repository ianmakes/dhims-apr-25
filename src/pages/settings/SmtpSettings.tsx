
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioItem } from "@/components/ui/radio-group";

const emailSettingsSchema = z.object({
  from_name: z.string().min(2, {
    message: "From name must be at least 2 characters."
  }),
  from_email: z.string().email({
    message: "Please enter a valid email address."
  }),
  provider: z.enum(["smtp", "resend"], {
    required_error: "Please select an email provider."
  }),
  smtp_host: z.string().optional(),
  smtp_port: z.string().optional(),
  smtp_username: z.string().optional(),
  smtp_password: z.string().optional(),
  resend_api_key: z.string().optional(),
  notifications_enabled: z.boolean().default(true),
  notify_new_student: z.boolean().default(true),
  notify_new_sponsor: z.boolean().default(true),
  notify_sponsorship_change: z.boolean().default(true),
});

type EmailSettingsValues = z.infer<typeof emailSettingsSchema>;

export default function SmtpSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  const form = useForm<EmailSettingsValues>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      from_name: "David's Hope International",
      from_email: "noreply@davidshope.org",
      provider: "smtp",
      smtp_host: "",
      smtp_port: "",
      smtp_username: "",
      smtp_password: "",
      resend_api_key: "",
      notifications_enabled: true,
      notify_new_student: true,
      notify_new_sponsor: true,
      notify_sponsorship_change: true,
    }
  });

  // Watch the provider value to conditionally render fields
  const provider = form.watch("provider");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('email_settings')
          .select('*')
          .eq('id', 'default')
          .single();
          
        if (error) {
          console.error('Error fetching email settings:', error);
          return;
        }
        
        if (data) {
          form.reset({
            from_name: data.from_name || "David's Hope International",
            from_email: data.from_email || "noreply@davidshope.org",
            provider: data.provider as "smtp" | "resend",
            smtp_host: data.smtp_host || "",
            smtp_port: data.smtp_port || "",
            smtp_username: data.smtp_username || "",
            smtp_password: data.smtp_password || "",
            resend_api_key: data.resend_api_key || "",
            notifications_enabled: data.notifications_enabled || true,
            notify_new_student: data.notify_new_student || true,
            notify_new_sponsor: data.notify_new_sponsor || true,
            notify_sponsorship_change: data.notify_sponsorship_change || true,
          });
        }
      } catch (error) {
        console.error('Error in fetchEmailSettings:', error);
      }
    };
    
    fetchSettings();
  }, [form]);

  const onSubmit = async (data: EmailSettingsValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('email_settings')
        .upsert({
          id: 'default',
          from_name: data.from_name,
          from_email: data.from_email,
          provider: data.provider,
          smtp_host: data.smtp_host,
          smtp_port: data.smtp_port,
          smtp_username: data.smtp_username,
          smtp_password: data.smtp_password,
          resend_api_key: data.resend_api_key,
          notifications_enabled: data.notifications_enabled,
          notify_new_student: data.notify_new_student,
          notify_new_sponsor: data.notify_new_sponsor,
          notify_sponsorship_change: data.notify_sponsorship_change,
        });
      
      if (error) throw error;
      
      toast({
        title: "Email settings updated",
        description: "Your email settings have been saved successfully."
      });
    } catch (error: any) {
      console.error('Error updating email settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update email settings.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testEmailSettings = async () => {
    setIsTesting(true);
    try {
      // Invoke edge function to test email settings
      const { data, error } = await supabase.functions.invoke('test-email-settings');
      
      if (error) throw error;
      
      toast({
        title: "Test email sent",
        description: "Please check your inbox to verify the email was delivered."
      });
    } catch (error: any) {
      console.error('Error testing email settings:', error);
      toast({
        title: "Failed to send test email",
        description: error.message || "Please check your email configuration.",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Email & SMTP Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure email server settings for system notifications.
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email Provider Card */}
            <Card>
              <CardHeader>
                <CardTitle>Email Provider</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Provider</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioItem value="smtp" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              SMTP Server
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioItem value="resend" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Resend.com API
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormDescription>
                        Select the method to send emails.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                        The name that will appear in email notifications.
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
                        The email address that will be used to send notifications.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* SMTP or API Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {provider === "smtp" ? "SMTP Configuration" : "Resend API Configuration"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {provider === "smtp" ? (
                  <>
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
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                ) : (
                  <FormField
                    control={form.control}
                    name="resend_api_key"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resend API Key</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormDescription>
                          Get your API key from the Resend dashboard.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={testEmailSettings}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Test Email Settings
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Notification Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="notifications_enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Email Notifications</FormLabel>
                        <FormDescription>
                          Enable email notifications for system events
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

                <FormField
                  control={form.control}
                  name="notify_new_student"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>New Student Notifications</FormLabel>
                        <FormDescription>
                          Receive notifications when new students are added
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!form.watch("notifications_enabled")}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notify_new_sponsor"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>New Sponsor Notifications</FormLabel>
                        <FormDescription>
                          Receive notifications when new sponsors are added
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!form.watch("notifications_enabled")}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notify_sponsorship_change"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Sponsorship Change Notifications</FormLabel>
                        <FormDescription>
                          Receive notifications when sponsorship changes occur
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!form.watch("notifications_enabled")}
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
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Email Settings
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
