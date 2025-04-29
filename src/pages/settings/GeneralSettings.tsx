
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { logUpdate } from "@/utils/auditLog";

const generalSettingsSchema = z.object({
  organizationName: z.string().min(2, {
    message: "Organization name must be at least 2 characters.",
  }),
  primaryColor: z.string().min(1, {
    message: "Primary color is required.",
  }),
  secondaryColor: z.string().min(1, {
    message: "Secondary color is required.",
  }),
  themeMode: z.enum(["light", "dark", "system"], {
    required_error: "Please select a theme mode.",
  }),
  footerText: z.string().optional(),
  version: z.string().optional(),
});

type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>;

export default function GeneralSettings() {
  const { toast } = useToast();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  
  // Default form values
  const defaultValues: GeneralSettingsValues = {
    organizationName: "David's Hope International",
    primaryColor: "#9b87f5",
    secondaryColor: "#7E69AB",
    themeMode: "light",
    footerText: "© 2025 David's Hope International. All rights reserved.",
    version: "1.0.0",
  };

  const form = useForm<GeneralSettingsValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 'general')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setSettings(data);
        
        form.reset({
          organizationName: data.organization_name,
          primaryColor: data.primary_color,
          secondaryColor: data.secondary_color,
          themeMode: data.theme_mode as "light" | "dark" | "system",
          footerText: data.footer_text || "",
          version: data.app_version || "",
        });
        
        if (data.logo_url) {
          setLogoPreview(data.logo_url);
        }
        
        if (data.favicon_url) {
          setFaviconPreview(data.favicon_url);
        }
      }
    } catch (error) {
      console.error('Error loading app settings:', error);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFaviconFile(file);
      setFaviconPreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File, bucket: string, folder: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);
      
    if (error) throw error;
    
    const { data: publicUrl } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
      
    return publicUrl.publicUrl;
  };

  const onSubmit = async (data: GeneralSettingsValues) => {
    try {
      setIsSubmitting(true);
      
      // Upload logo and favicon if provided
      let logoUrl = settings?.logo_url || null;
      let faviconUrl = settings?.favicon_url || null;
      
      if (logoFile) {
        logoUrl = await uploadImage(logoFile, 'app-assets', 'logos');
      }
      
      if (faviconFile) {
        faviconUrl = await uploadImage(faviconFile, 'app-assets', 'favicons');
      }
      
      // Save settings to database
      const { error } = await supabase.from('app_settings').upsert({
        id: 'general',
        organization_name: data.organizationName,
        primary_color: data.primaryColor,
        secondary_color: data.secondaryColor,
        theme_mode: data.themeMode,
        footer_text: data.footerText,
        app_version: data.version,
        logo_url: logoUrl,
        favicon_url: faviconUrl,
      });

      if (error) throw error;
      
      // Log the update to audit log
      await logUpdate('app_settings', 'general', 'Updated general settings');
      
      toast({
        title: "Settings updated",
        description: "General settings have been updated successfully.",
      });
      
      // Fetch updated settings
      fetchSettings();
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="organizationName"
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

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Application Logo</label>
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <div className="h-16 w-auto border rounded flex items-center justify-center p-2">
                    <img src={logoPreview} alt="Logo preview" className="h-full w-auto object-contain" />
                  </div>
                )}
                <div className="flex-1">
                  <Input 
                    id="logo-upload" 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoChange}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommended size: 200x60px. PNG or SVG with transparent background.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Application Favicon</label>
              <div className="flex items-center gap-4">
                {faviconPreview && (
                  <div className="h-10 w-10 border rounded flex items-center justify-center p-1">
                    <img src={faviconPreview} alt="Favicon preview" className="h-full w-full object-contain" />
                  </div>
                )}
                <div className="flex-1">
                  <Input 
                    id="favicon-upload" 
                    type="file" 
                    accept="image/png,image/jpeg" 
                    onChange={handleFaviconChange}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommended size: 32x32px or 64x64px. PNG or JPG format.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="primaryColor"
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
                    The main color used throughout the application.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="secondaryColor"
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
                    Used for accents and highlights.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="themeMode"
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
            name="footerText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Footer Text</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>
                  Text displayed in the footer of the application.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="version"
            render={({ field }) => (
              <FormItem>
                <FormLabel>App Version</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>
                  Version number displayed in the sidebar and login page.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save General Settings"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
