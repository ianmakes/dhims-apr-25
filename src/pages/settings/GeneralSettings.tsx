import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import { logUpdate } from "@/utils/auditLog";
import { Loader2, Upload, Palette, Building2, FileText, Sparkles } from "lucide-react";
import { useAppSettings } from "@/components/settings/GlobalSettingsProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DangerousOperations } from "@/components/settings/DangerousOperations";

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
  footer_text: z.string().optional(),
  app_version: z.string().optional()
});

type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>;

export default function GeneralSettings() {
  const { toast } = useToast();
  const { refreshSettings } = useAppSettings();
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
    footer_text: "© 2025 David's Hope International. All rights reserved.",
    app_version: "1.0.0"
  };
  
  const form = useForm<GeneralSettingsValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues
  });
  
  useEffect(() => {
    fetchSettings();
  }, []);
  
  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('app_settings').select('*').eq('id', 'general').single();
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      if (data) {
        setSettings(data);
        form.reset({
          organization_name: data.organization_name,
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
          footer_text: data.footer_text || "",
          app_version: data.app_version || ""
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
    const {
      data,
      error
    } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) throw error;
    const {
      data: publicUrl
    } = supabase.storage.from(bucket).getPublicUrl(fileName);
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
        theme_mode: 'light', // Default to light mode
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
      
      // Refresh global settings
      await refreshSettings();
      
      toast({
        title: "Settings updated",
        description: "General settings have been updated successfully."
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
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-2xl font-semibold">General Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure your organization and application settings
          </p>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-8">
            
            {/* Organization Information */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Organization Information</CardTitle>
                </div>
                <CardDescription>
                  Basic information about your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="organization_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Organization Name</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-10" />
                        </FormControl>
                        <FormDescription>
                          This will be displayed throughout the application
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
                        <FormLabel className="text-sm font-medium">Application Version</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="1.0.0" className="h-10" />
                        </FormControl>
                        <FormDescription>
                          Version number displayed in the sidebar
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Appearance & Branding */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Appearance & Branding</CardTitle>
                </div>
                <CardDescription>
                  Customize colors and branding assets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                
                {/* Color Settings */}
                <div className="space-y-6">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Colors</h4>
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="primary_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Primary Color</FormLabel>
                          <div className="flex gap-3">
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type="color" 
                                  {...field} 
                                  className="w-14 h-10 p-1 border rounded cursor-pointer" 
                                />
                              </div>
                            </FormControl>
                            <Input 
                              value={field.value} 
                              onChange={field.onChange} 
                              className="flex-1 h-10 font-mono text-sm"
                              placeholder="#000000"
                            />
                          </div>
                          <FormDescription>
                            Main color used for buttons and highlights
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
                          <FormLabel className="text-sm font-medium">Secondary Color</FormLabel>
                          <div className="flex gap-3">
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type="color" 
                                  {...field} 
                                  className="w-14 h-10 p-1 border rounded cursor-pointer" 
                                />
                              </div>
                            </FormControl>
                            <Input 
                              value={field.value} 
                              onChange={field.onChange} 
                              className="flex-1 h-10 font-mono text-sm"
                              placeholder="#000000"
                            />
                          </div>
                          <FormDescription>
                            Used for accents and secondary elements
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />
                
                {/* Logo & Favicon */}
                <div className="space-y-6">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Assets</h4>
                  <div className="grid gap-8 md:grid-cols-2">
                    
                    {/* Logo Upload */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Application Logo</label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Recommended: 200x60px, PNG or SVG with transparent background
                        </p>
                      </div>
                      
                      {logoPreview && (
                        <div className="p-4 border-2 border-dashed border-muted rounded-lg bg-muted/10">
                          <img 
                            src={logoPreview} 
                            alt="Logo preview" 
                            className="h-16 w-auto object-contain mx-auto"
                          />
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleLogoClick}
                          className="flex-1"
                        >
                          <Upload className="h-4 w-4 mr-2" />
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
                    </div>
                    
                    {/* Favicon Upload */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Favicon</label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Recommended: 32x32px or 64x64px, PNG, JPG or ICO
                        </p>
                      </div>
                      
                      {faviconPreview && (
                        <div className="p-4 border-2 border-dashed border-muted rounded-lg bg-muted/10 flex justify-center">
                          <img
                            src={faviconPreview}
                            alt="Favicon preview"
                            className="h-8 w-8 object-contain"
                          />
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <input
                          ref={faviconInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/x-icon"
                          onChange={handleFaviconChange}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleFaviconClick}
                          className="flex-1"
                        >
                          <Upload className="h-4 w-4 mr-2" />
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
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Footer Information */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Footer Information</CardTitle>
                </div>
                <CardDescription>
                  Text displayed in the footer of the application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="footer_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Footer Text</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="© 2025 Your Organization. All rights reserved."
                          rows={3}
                          className="resize-none"
                        />
                      </FormControl>
                      <FormDescription>
                        This text will appear at the bottom of your application
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Add Dangerous Operations */}
            <DangerousOperations />
          </div>
          
          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              size="lg"
              className="min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
