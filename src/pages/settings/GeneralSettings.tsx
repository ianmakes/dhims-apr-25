
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
import { Loader2, Upload, Palette, Building2, FileText, Sparkles, Save } from "lucide-react";
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
        theme_mode: 'light',
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
        title: "Settings saved successfully",
        description: "Your changes have been applied successfully."
      });

      // Apply theme changes to document
      document.documentElement.style.setProperty('--color-primary', data.primary_color);
      document.documentElement.style.setProperty('--color-secondary', data.secondary_color);

      // Fetch updated settings
      fetchSettings();
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error saving settings",
        description: error.message || "Failed to update settings",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-8 max-w-4xl">
      <div className="text-left">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">General Settings</h1>
            <p className="text-muted-foreground">
              Configure your organization details and application preferences
            </p>
          </div>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-8">
            
            {/* Organization Information */}
            <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-gray-50/50">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-xl text-gray-900">Organization Information</CardTitle>
                    <CardDescription className="text-gray-600">
                      Basic details about your organization
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="organization_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700">Organization Name</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-11 focus:ring-2 focus:ring-primary/20" />
                        </FormControl>
                        <FormDescription className="text-left">
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
                        <FormLabel className="text-sm font-semibold text-gray-700">Application Version</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="1.0.0" className="h-11 focus:ring-2 focus:ring-primary/20" />
                        </FormControl>
                        <FormDescription className="text-left">
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
            <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-purple-50/30">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Palette className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-xl text-gray-900">Appearance & Branding</CardTitle>
                    <CardDescription className="text-gray-600">
                      Customize colors and branding assets
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                
                {/* Color Settings */}
                <div className="space-y-6">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Color Scheme</h4>
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="primary_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-gray-700">Primary Color</FormLabel>
                          <div className="flex gap-3">
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type="color" 
                                  {...field} 
                                  className="w-16 h-11 p-1 border-2 rounded-lg cursor-pointer" 
                                />
                              </div>
                            </FormControl>
                            <Input 
                              value={field.value} 
                              onChange={field.onChange} 
                              className="flex-1 h-11 font-mono text-sm focus:ring-2 focus:ring-primary/20"
                              placeholder="#000000"
                            />
                          </div>
                          <FormDescription className="text-left">
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
                          <FormLabel className="text-sm font-semibold text-gray-700">Secondary Color</FormLabel>
                          <div className="flex gap-3">
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type="color" 
                                  {...field} 
                                  className="w-16 h-11 p-1 border-2 rounded-lg cursor-pointer" 
                                />
                              </div>
                            </FormControl>
                            <Input 
                              value={field.value} 
                              onChange={field.onChange} 
                              className="flex-1 h-11 font-mono text-sm focus:ring-2 focus:ring-primary/20"
                              placeholder="#000000"
                            />
                          </div>
                          <FormDescription className="text-left">
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
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Brand Assets</h4>
                  <div className="grid gap-8 md:grid-cols-2">
                    
                    {/* Logo Upload */}
                    <div className="space-y-4">
                      <div className="text-left">
                        <label className="text-sm font-semibold text-gray-700">Application Logo</label>
                        <p className="text-xs text-gray-500 mt-1">
                          Recommended: 200x60px, PNG or SVG with transparent background
                        </p>
                      </div>
                      
                      {logoPreview && (
                        <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
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
                          className="flex-1 h-11 border-2 hover:border-primary/50"
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
                            className="h-11 px-4"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Favicon Upload */}
                    <div className="space-y-4">
                      <div className="text-left">
                        <label className="text-sm font-semibold text-gray-700">Favicon</label>
                        <p className="text-xs text-gray-500 mt-1">
                          Recommended: 32x32px or 64x64px, PNG, JPG or ICO
                        </p>
                      </div>
                      
                      {faviconPreview && (
                        <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors flex justify-center">
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
                          className="flex-1 h-11 border-2 hover:border-primary/50"
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
                            className="h-11 px-4"
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
            <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-green-50/30">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-xl text-gray-900">Footer Information</CardTitle>
                    <CardDescription className="text-gray-600">
                      Text displayed in the footer of the application
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="footer_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">Footer Text</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="© 2025 Your Organization. All rights reserved."
                          rows={4}
                          className="resize-none focus:ring-2 focus:ring-primary/20"
                        />
                      </FormControl>
                      <FormDescription className="text-left">
                        This text will appear at the bottom of your application
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              size="lg"
              className="min-w-[160px] h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Dangerous Operations Section */}
      <Separator className="my-12" />
      <DangerousOperations />
    </div>
  );
}
