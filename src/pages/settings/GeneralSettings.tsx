
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, X } from "lucide-react";
import { useAppSettings } from "@/components/settings/GlobalSettingsProvider";
import { logUpdate } from "@/utils/auditLog";

const generalSettingsSchema = z.object({
  organization_name: z.string().min(1, "Organization name is required"),
  primary_color: z.string().min(1, "Primary color is required"),
  secondary_color: z.string().min(1, "Secondary color is required"),
  footer_text: z.string().optional(),
  app_version: z.string().optional(),
});

type GeneralSettingsFormValues = z.infer<typeof generalSettingsSchema>;

export default function GeneralSettings() {
  const { toast } = useToast();
  const { settings, refreshSettings } = useAppSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);

  const form = useForm<GeneralSettingsFormValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      organization_name: "",
      primary_color: "#9b87f5",
      secondary_color: "#7E69AB",
      footer_text: "",
      app_version: "",
    }
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        organization_name: settings.organization_name || "",
        primary_color: settings.primary_color || "#9b87f5",
        secondary_color: settings.secondary_color || "#7E69AB",
        footer_text: settings.footer_text || "",
        app_version: settings.app_version || "",
      });
    }
  }, [settings, form]);

  const handleSubmit = async (values: GeneralSettingsFormValues) => {
    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('app_settings')
        .upsert([{
          id: 'main',
          ...values,
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Log the settings update
      await logUpdate('app_settings', 'main', 
        `Updated general settings: ${Object.keys(values).join(', ')}`
      );

      toast({
        title: "Settings updated",
        description: "Your general settings have been saved successfully."
      });

      await refreshSettings();
    } catch (error: any) {
      console.error("Error updating settings:", error);
      toast({
        title: "Error",
        description: `Failed to update settings: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'favicon') => {
    try {
      if (type === 'logo') {
        setIsUploadingLogo(true);
      } else {
        setIsUploadingFavicon(true);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('Application Assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('Application Assets')
        .getPublicUrl(filePath);

      const updateData = type === 'logo' 
        ? { logo_url: data.publicUrl }
        : { favicon_url: data.publicUrl };

      const { error: updateError } = await supabase
        .from('app_settings')
        .upsert([{
          id: 'main',
          ...updateData,
          updated_at: new Date().toISOString()
        }]);

      if (updateError) throw updateError;

      // Log the file upload
      await logUpdate('app_settings', 'main', `Updated ${type}: ${fileName}`);

      toast({
        title: `${type === 'logo' ? 'Logo' : 'Favicon'} updated`,
        description: `Your ${type} has been uploaded successfully.`
      });

      await refreshSettings();
    } catch (error: any) {
      console.error(`Error uploading ${type}:`, error);
      toast({
        title: "Upload failed",
        description: `Failed to upload ${type}: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      if (type === 'logo') {
        setIsUploadingLogo(false);
      } else {
        setIsUploadingFavicon(false);
      }
    }
  };

  const handleRemoveFile = async (type: 'logo' | 'favicon') => {
    try {
      const updateData = type === 'logo' 
        ? { logo_url: null }
        : { favicon_url: null };

      const { error } = await supabase
        .from('app_settings')
        .upsert([{
          id: 'main',
          ...updateData,
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Log the file removal
      await logUpdate('app_settings', 'main', `Removed ${type}`);

      toast({
        title: `${type === 'logo' ? 'Logo' : 'Favicon'} removed`,
        description: `Your ${type} has been removed successfully.`
      });

      await refreshSettings();
    } catch (error: any) {
      console.error(`Error removing ${type}:`, error);
      toast({
        title: "Error",
        description: `Failed to remove ${type}: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-left">General Settings</CardTitle>
          <CardDescription className="text-left">
            Configure your organization's basic information and branding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="organization_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter organization name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="primary_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Color</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input {...field} placeholder="#9b87f5" />
                          <input
                            type="color"
                            value={field.value}
                            onChange={field.onChange}
                            className="w-12 h-10 border border-input rounded cursor-pointer"
                          />
                        </div>
                      </FormControl>
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
                      <FormControl>
                        <div className="flex gap-2">
                          <Input {...field} placeholder="#7E69AB" />
                          <input
                            type="color"
                            value={field.value}
                            onChange={field.onChange}
                            className="w-12 h-10 border border-input rounded cursor-pointer"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="footer_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Footer Text</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="© 2024 Your Organization. All rights reserved."
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      This text will appear in the footer of your application
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
                      Current version of your application
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Logo Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-left">Logo</CardTitle>
          <CardDescription className="text-left">
            Upload your organization's logo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {settings?.logo_url && (
              <div className="flex items-center gap-4">
                <img 
                  src={settings.logo_url} 
                  alt="Current logo" 
                  className="h-16 w-auto object-contain border rounded"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleRemoveFile('logo')}
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            )}
            
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'logo');
                }}
                className="hidden"
                id="logo-upload"
              />
              <label htmlFor="logo-upload">
                <Button 
                  variant="outline" 
                  disabled={isUploadingLogo}
                  asChild
                >
                  <span className="cursor-pointer">
                    {isUploadingLogo ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        {settings?.logo_url ? 'Update Logo' : 'Upload Logo'}
                      </>
                    )}
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Favicon Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-left">Favicon</CardTitle>
          <CardDescription className="text-left">
            Upload your organization's favicon (appears in browser tabs)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {settings?.favicon_url && (
              <div className="flex items-center gap-4">
                <img 
                  src={settings.favicon_url} 
                  alt="Current favicon" 
                  className="h-8 w-8 object-contain border rounded"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleRemoveFile('favicon')}
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            )}
            
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'favicon');
                }}
                className="hidden"
                id="favicon-upload"
              />
              <label htmlFor="favicon-upload">
                <Button 
                  variant="outline" 
                  disabled={isUploadingFavicon}
                  asChild
                >
                  <span className="cursor-pointer">
                    {isUploadingFavicon ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        {settings?.favicon_url ? 'Update Favicon' : 'Upload Favicon'}
                      </>
                    )}
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
