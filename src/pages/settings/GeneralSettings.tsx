
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload } from "lucide-react";

const generalSettingsSchema = z.object({
  organization_name: z.string().min(2, {
    message: "Organization name must be at least 2 characters."
  }),
  primary_color: z.string().min(1, {
    message: "Primary color is required."
  }),
  secondary_color: z.string().min(1, {
    message: "Secondary color is required."
  }),
  theme_mode: z.enum(["light", "dark", "system"], {
    required_error: "Please select a theme mode."
  }),
  footer_text: z.string().optional()
});

type GeneralSettingsFormValues = z.infer<typeof generalSettingsSchema>;

export default function GeneralSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [settings, setSettings] = useState<GeneralSettingsFormValues>({
    organization_name: "David's Hope International",
    primary_color: "#9b87f5",
    secondary_color: "#7E69AB",
    theme_mode: "light",
    footer_text: ""
  });

  const form = useForm<GeneralSettingsFormValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: settings
  });

  // Fetch settings on component mount
  useState(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('*')
          .eq('id', 'general')
          .single();
          
        if (error) {
          console.error('Error fetching settings:', error);
          return;
        }
        
        if (data) {
          form.reset({
            organization_name: data.organization_name || "David's Hope International",
            primary_color: data.primary_color || "#9b87f5",
            secondary_color: data.secondary_color || "#7E69AB",
            theme_mode: data.theme_mode || "light",
            footer_text: data.footer_text || ""
          });
          setSettings(data as GeneralSettingsFormValues);
        }
      } catch (error) {
        console.error('Error in fetchSettings:', error);
      }
    };
    
    fetchSettings();
  }, []);

  const uploadFile = async (file: File, bucket: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);
      
      if (error) throw error;
      
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
        
      return data.publicUrl;
    } catch (error) {
      console.error(`Error uploading to ${bucket}:`, error);
      return null;
    }
  };

  const onSubmit = async (data: GeneralSettingsFormValues) => {
    setIsLoading(true);
    try {
      let logoUrl = undefined;
      let faviconUrl = undefined;
      
      // Upload logo if selected
      if (logoFile) {
        logoUrl = await uploadFile(logoFile, 'app-assets');
      }
      
      // Upload favicon if selected
      if (faviconFile) {
        faviconUrl = await uploadFile(faviconFile, 'app-assets');
      }
      
      // Update settings
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          id: 'general',
          organization_name: data.organization_name,
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
          theme_mode: data.theme_mode,
          footer_text: data.footer_text,
          ...(logoUrl && { logo_url: logoUrl }),
          ...(faviconUrl && { favicon_url: faviconUrl })
        });
      
      if (error) throw error;
      
      toast({
        title: "Settings updated",
        description: "General settings have been updated successfully."
      });
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: error.message || "There was an error updating settings.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">General Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure your organization and application settings.
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Organization Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle>Organization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="organization_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        This will be displayed throughout the application.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="footer_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Footer Text</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Text to display in the footer of the application.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-2">
                  <FormLabel>Logo</FormLabel>
                  <div className="flex items-center gap-4">
                    {settings.logo_url && (
                      <div className="w-40 h-16 bg-muted flex items-center justify-center rounded border">
                        <img 
                          src={settings.logo_url} 
                          alt="Organization Logo" 
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      />
                      <FormDescription>
                        Recommended size: 200x60px
                      </FormDescription>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <FormLabel>Favicon</FormLabel>
                  <div className="flex items-center gap-4">
                    {settings.favicon_url && (
                      <div className="w-10 h-10 bg-muted flex items-center justify-center rounded border">
                        <img 
                          src={settings.favicon_url} 
                          alt="Favicon" 
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFaviconFile(e.target.files?.[0] || null)}
                      />
                      <FormDescription>
                        Recommended size: 32x32px
                      </FormDescription>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appearance Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="theme_mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Theme Mode</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select theme mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the theme mode for the application.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="primary_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Color</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input type="color" {...field} className="w-16 h-10" />
                        </FormControl>
                        <Input 
                          value={field.value} 
                          onChange={field.onChange} 
                          className="flex-1"
                        />
                      </div>
                      <FormDescription>
                        Select the primary color for the application.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="secondary_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secondary Color</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input type="color" {...field} className="w-16 h-10" />
                        </FormControl>
                        <Input 
                          value={field.value} 
                          onChange={field.onChange} 
                          className="flex-1"
                        />
                      </div>
                      <FormDescription>
                        Select the secondary color for the application.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
