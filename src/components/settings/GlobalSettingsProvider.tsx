
import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AppSettings {
  organization_name: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  favicon_url: string | null;
  footer_text: string | null;
  app_version: string | null;
}

interface SettingsContextType {
  settings: AppSettings | null;
  loading: boolean;
  refetchSettings: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  organization_name: "David's Hope International",
  primary_color: "#9b87f5",
  secondary_color: "#7E69AB",
  logo_url: null,
  favicon_url: null,
  footer_text: "© 2025 David's Hope International. All rights reserved.",
  app_version: "1.0.0"
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
  refetchSettings: async () => {}
});

export const useAppSettings = () => useContext(SettingsContext);

export function GlobalSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAppSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 'general')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching app settings:", error);
        // Use default settings if there was an error
        setSettings(defaultSettings);
        return;
      }
      
      if (data) {
        setSettings(data as AppSettings);
        
        // Apply theme colors to CSS variables
        document.documentElement.style.setProperty('--primary-color', data.primary_color);
        document.documentElement.style.setProperty('--secondary-color', data.secondary_color);
        
        // Apply the custom colors to CSS variables for Tailwind to use
        const root = document.documentElement;
        root.style.setProperty('--color-primary', data.primary_color);
        root.style.setProperty('--color-secondary', data.secondary_color);
        
        // Update favicon if available
        if (data.favicon_url) {
          let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            document.head.appendChild(link);
          }
          link.type = 'image/png';
          link.rel = 'icon';
          link.href = data.favicon_url;
        }
        
        // Set document title to organization name
        if (data.organization_name) {
          document.title = data.organization_name;
        }
      } else {
        // No settings found, use defaults
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error("Error in fetchAppSettings:", error);
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppSettings();
    
    // Subscribe to changes in the app_settings table
    const channel = supabase
      .channel('settings-changes')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'app_settings',
          filter: `id=eq.general`
        }, 
        () => {
          fetchAppSettings();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refetchSettings: fetchAppSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
