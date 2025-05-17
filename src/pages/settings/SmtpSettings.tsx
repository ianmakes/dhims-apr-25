import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { logUpdate } from "@/utils/auditLog";
const emailSettingsSchema = z.object({
  provider: z.enum(["smtp", "resend"]),
  emailFromName: z.string().min(2, {
    message: "From name must be at least 2 characters."
  }),
  emailFromAddress: z.string().email({
    message: "Please enter a valid email address."
  }),
  smtpHost: z.string().min(1, {
    message: "SMTP host is required."
  }).optional().or(z.literal('')),
  smtpPort: z.string().regex(/^\d+$/, {
    message: "SMTP port must be a number."
  }).optional().or(z.literal('')),
  smtpUsername: z.string().min(1, {
    message: "SMTP username is required."
  }).optional().or(z.literal('')),
  smtpPassword: z.string().min(1, {
    message: "SMTP password is required."
  }).optional().or(z.literal('')),
  resendApiKey: z.string().min(1, {
    message: "Resend API key is required."
  }).optional().or(z.literal('')),
  emailNotifications: z.boolean().default(true),
  notifyOnNewStudent: z.boolean().default(true),
  notifyOnNewSponsor: z.boolean().default(true),
  notifyOnSponsorshipChange: z.boolean().default(true)
}).refine(data => {
  // If provider is smtp, then smtp fields are required
  if (data.provider === 'smtp') {
    return !!data.smtpHost && !!data.smtpPort && !!data.smtpUsername && !!data.smtpPassword;
  }
  // If provider is resend, then resend API key is required
  if (data.provider === 'resend') {
    return !!data.resendApiKey;
  }
  return true;
}, {
  message: "Please fill in all required fields for the selected email provider",
  path: ["provider"]
});
type EmailSettingsValues = z.infer<typeof emailSettingsSchema>;
export default function SmtpSettings() {
  const {
    toast
  } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Default form values
  const defaultValues: EmailSettingsValues = {
    provider: "smtp",
    emailFromName: "David's Hope International",
    emailFromAddress: "noreply@davidshope.org",
    smtpHost: "smtp.example.com",
    smtpPort: "587",
    smtpUsername: "smtp-user",
    smtpPassword: "",
    resendApiKey: "",
    emailNotifications: true,
    notifyOnNewStudent: true,
    notifyOnNewSponsor: true,
    notifyOnSponsorshipChange: true
  };
  const form = useForm<EmailSettingsValues>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues
  });
  const watchProvider = form.watch("provider");
  useEffect(() => {
    loadSettings();
  }, []); // Empty dependency array means this effect runs once on mount

  const loadSettings = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('email_settings').select('*').eq('id', 'default').single();
      if (error) {
        // If no settings found, use defaults
        if (error.code === 'PGRST116') return;
        throw error;
      }
      if (data) {
        form.reset({
          provider: data.provider as "smtp" | "resend",
          emailFromName: data.from_name,
          emailFromAddress: data.from_email,
          smtpHost: data.smtp_host || "",
          smtpPort: data.smtp_port || "",
          smtpUsername: data.smtp_username || "",
          smtpPassword: data.smtp_password || "",
          resendApiKey: data.resend_api_key || "",
          emailNotifications: data.notifications_enabled,
          notifyOnNewStudent: data.notify_new_student,
          notifyOnNewSponsor: data.notify_new_sponsor,
          notifyOnSponsorshipChange: data.notify_sponsorship_change
        });
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
    }
  };
  const onSubmit = async (data: EmailSettingsValues) => {
    try {
      setIsSubmitting(true);

      // Save settings to the database
      const {
        error
      } = await supabase.from('email_settings').upsert({
        id: 'default',
        provider: data.provider,
        from_name: data.emailFromName,
        from_email: data.emailFromAddress,
        smtp_host: data.smtpHost || null,
        smtp_port: data.smtpPort || null,
        smtp_username: data.smtpUsername || null,
        smtp_password: data.smtpPassword || null,
        resend_api_key: data.resendApiKey || null,
        notifications_enabled: data.emailNotifications,
        notify_new_student: data.notifyOnNewStudent,
        notify_new_sponsor: data.notifyOnNewSponsor,
        notify_sponsorship_change: data.notifyOnSponsorshipChange
      });
      if (error) throw error;

      // Log the update
      await logUpdate('email_settings', 'default', 'Updated email settings');
      toast({
        title: "Settings updated",
        description: "Email settings have been updated successfully."
      });
    } catch (error: any) {
      console.error('Error saving email settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update email settings",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const testEmailSettings = async () => {
    try {
      setIsTesting(true);
      const formValues = form.getValues();

      // Call test email endpoint or function
      const {
        error
      } = await supabase.functions.invoke('test-email-settings', {
        body: {
          provider: formValues.provider,
          fromName: formValues.emailFromName,
          fromEmail: formValues.emailFromAddress,
          smtpHost: formValues.smtpHost,
          smtpPort: formValues.smtpPort,
          smtpUsername: formValues.smtpUsername,
          smtpPassword: formValues.smtpPassword,
          resendApiKey: formValues.resendApiKey
        }
      });
      if (error) throw error;
      toast({
        title: "Test email sent",
        description: "A test email has been sent successfully."
      });
    } catch (error: any) {
      console.error('Error testing email settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send test email",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };
  return <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-left">Email & SMTP Settings</h3>
        <p className="text-sm text-muted-foreground text-left">
          Configure email server settings for notifications and communications.
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField control={form.control} name="provider" render={({
          field
        }) => <FormItem>
                <FormLabel>Email Provider</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select email provider" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="smtp">SMTP Server</SelectItem>
                    <SelectItem value="resend">Resend.com API</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-left">
                  Select which service to use for sending emails.
                </FormDescription>
                <FormMessage />
              </FormItem>} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="emailFromName" render={({
            field
          }) => <FormItem>
                  <FormLabel>From Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription className="text-left">
                    The name that will appear in email notifications.
                  </FormDescription>
                  <FormMessage />
                </FormItem>} />

            <FormField control={form.control} name="emailFromAddress" render={({
            field
          }) => <FormItem>
                  <FormLabel>From Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormDescription className="text-left">
                    The email address that will be used to send notifications.
                  </FormDescription>
                  <FormMessage />
                </FormItem>} />
          </div>

          {watchProvider === 'smtp' && <div className="space-y-4">
              <h4 className="font-medium">SMTP Server Settings</h4>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="smtpHost" render={({
              field
            }) => <FormItem>
                      <FormLabel>SMTP Host</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="smtpPort" render={({
              field
            }) => <FormItem>
                      <FormLabel>SMTP Port</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="smtpUsername" render={({
              field
            }) => <FormItem>
                      <FormLabel>SMTP Username</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="smtpPassword" render={({
              field
            }) => <FormItem>
                      <FormLabel>SMTP Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
              </div>
            </div>}

          {watchProvider === 'resend' && <div className="space-y-4">
              <h4 className="font-medium">Resend.com API Settings</h4>
              
              <FormField control={form.control} name="resendApiKey" render={({
            field
          }) => <FormItem>
                    <FormLabel>Resend API Key</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormDescription>
                      Get your API key from the <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" className="text-primary underline">Resend dashboard</a>.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>} />
            </div>}

          <Button type="button" variant="outline" onClick={testEmailSettings} disabled={isTesting}>
            {isTesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Test Email Connection
          </Button>

          <Separator />
          <h4 className="text-lg font-medium">Notification Settings</h4>

          <FormField control={form.control} name="emailNotifications" render={({
          field
        }) => <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Email Notifications</FormLabel>
                  <FormDescription>
                    Enable email notifications for system events
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>} />

          <div className="space-y-3">
            <FormField control={form.control} name="notifyOnNewStudent" render={({
            field
          }) => <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>New Student Notifications</FormLabel>
                    <FormDescription>
                      Receive notifications when new students are added
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} disabled={!form.watch("emailNotifications")} />
                  </FormControl>
                </FormItem>} />

            <FormField control={form.control} name="notifyOnNewSponsor" render={({
            field
          }) => <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>New Sponsor Notifications</FormLabel>
                    <FormDescription>
                      Receive notifications when new sponsors are added
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} disabled={!form.watch("emailNotifications")} />
                  </FormControl>
                </FormItem>} />

            <FormField control={form.control} name="notifyOnSponsorshipChange" render={({
            field
          }) => <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Sponsorship Change Notifications</FormLabel>
                    <FormDescription>
                      Receive notifications when sponsorship changes occur
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} disabled={!form.watch("emailNotifications")} />
                  </FormControl>
                </FormItem>} />
          </div>
          
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Email Settings
          </Button>
        </form>
      </Form>
    </div>;
}