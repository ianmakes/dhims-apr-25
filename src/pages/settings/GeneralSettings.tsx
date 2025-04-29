
import { useState, useEffect, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { logUpdate } from "@/utils/auditLog";
import { Loader2, Upload } from "lucide-react";

const generalSettingsSchema = z.object({
  organization_name: z.string().min(2, {
    message: "Organization name must be at least 2 characters.",
  }),
  primary_color: z.string().min(1, {
    message: "Primary color is required.",
  }),
  secondary_color: z.string().min(1, {
    message: "Secondary color is required.",
  }),
  theme_mode: z.enum(["light", "dark", "system"], {
    required_error: "Please select a theme mode.",
  }),
  footer_text: z.string().optional(),
  app_version: z.string().optional(),
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
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  
  // Default form values
  const defaultValues: GeneralSettingsValues = {
    organization_name: "David's Hope International",
    primary_color: "#9b87f5",
    secondary_color: "#7E69AB",
    theme_mode: "light",
    footer_text: "© 2025 David's Hope International. All rights reserved.",
    app_version: "1.0.0",
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
          organization_name: data.organization_name,
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
          theme_mode: data.theme_mode as "light" | "dark" | "system",
          footer_text: data.footer_text || "",
          app_version: data.app_version || "",
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

  const handleLogoClick = () => {
    logoInputRef.current?.click();
  };
  
  const handleFaviconClick = () => {
    faviconInputRef.current?.click();
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
      
      // Get current user for audit log
      const { data: { user } } = await supabase.auth.getUser();
      
      // Save settings to database
      const { error } = await supabase.from('app_settings').upsert({
        id: 'general',
        organization_name: data.organization_name,
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
        theme_mode: data.theme_mode,
        footer_text: data.footer_text,
        app_version: data.app_version,
        logo_url: logoUrl,
        favicon_url: faviconUrl,
        updated_at: new Date().toISOString(),
        updated_by: user?.id
      });

      if (error) throw error;
      
      // Log the update to audit log
      await logUpdate('app_settings', 'general', 'Updated general settings');
      
      toast({
        title: "Settings updated",
        description: "General settings have been updated successfully.",
      });
      
      // Apply theme changes to document
      document.documentElement.style.setProperty('--color-primary', data.primary_color);
      document.documentElement.style.setProperty('--color-secondary', data.secondary_color);
      
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

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Application Logo</label>
              <div className="flex flex-col gap-4">
                {logoPreview && (
                  <div className="h-16 w-auto border rounded flex items-center justify-center p-2 bg-white">
                    <img src={logoPreview} alt="Logo preview" className="h-full w-auto object-contain" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input 
                    ref={logoInputRef}
                    id="logo-upload" 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleLogoClick}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {logoPreview ? "Change Logo" : "Upload Logo"}
                  </Button>
                  {logoPreview && (
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        setLogoPreview(null);
                        setLogoFile(null);
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended size: 200x60px. PNG or SVG with transparent background.
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Application Favicon</label>
              <div className="flex flex-col gap-4">
                {faviconPreview && (
                  <div className="h-16 w-16 border rounded flex items-center justify-center p-1 bg-white">
                    <img src={faviconPreview} alt="Favicon preview" className="h-full w-full object-contain" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input 
                    ref={faviconInputRef}
                    id="favicon-upload" 
                    type="file" 
                    accept="image/png,image/jpeg,image/x-icon" 
                    onChange={handleFaviconChange}
                    className="hidden"
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleFaviconClick}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {faviconPreview ? "Change Favicon" : "Upload Favicon"}
                  </Button>
                  {faviconPreview && (
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        setFaviconPreview(null);
                        setFaviconFile(null);
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended size: 32x32px or 64x64px. PNG, JPG or ICO format.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                    The main color used throughout the application.
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
                    Used for accents and highlights.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
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
            name="footer_text"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Footer Text</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="© 2025 Your Organization. All rights reserved."
                    rows={2}
                  />
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
            name="app_version"
            render={({ field }) => (
              <FormItem>
                <FormLabel>App Version</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="1.0.0" />
                </FormControl>
                <FormDescription>
                  Version number displayed in the sidebar and login page.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save General Settings"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
