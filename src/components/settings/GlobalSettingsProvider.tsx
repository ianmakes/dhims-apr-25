
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AppSettings {
  id?: string;
  organization_name: string;
  primary_color: string;
  secondary_color: string;
  theme_mode?: string;
  footer_text?: string;
  app_version?: string;
  logo_url?: string;
  favicon_url?: string;
  updated_at?: string;
  updated_by?: string;
}

interface GlobalSettingsContextType {
  settings: AppSettings | null;
  loading: boolean;
  error: Error | null;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  organization_name: "David's Hope International",
  primary_color: "#9b87f5",
  secondary_color: "#7E69AB",
  theme_mode: "light",
  footer_text: "© 2025 David's Hope International. All rights reserved."
};

const GlobalSettingsContext = createContext<GlobalSettingsContextType>({
  settings: defaultSettings,
  loading: false,
  error: null,
  refreshSettings: async () => {}
});

export function GlobalSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 'general')
        .single();
      
      if (error) {
        // If no settings exist, use default settings
        if (error.code === 'PGRST116') {
          setSettings(defaultSettings);
        } else {
          console.error("Error fetching app settings:", error);
          setError(new Error(error.message));
        }
        return;
      }
      
      setSettings(data as AppSettings);
      
      // Apply colors to document root to make them globally available
      if (data) {
        document.documentElement.style.setProperty('--color-primary', data.primary_color);
        document.documentElement.style.setProperty('--color-secondary', data.secondary_color);
        
        // Set favicon if available
        if (data.favicon_url) {
          const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (link) {
            link.href = data.favicon_url;
          } else {
            const newLink = document.createElement('link');
            newLink.rel = 'icon';
            newLink.href = data.favicon_url;
            document.head.appendChild(newLink);
          }
        }
      }
    } catch (err) {
      const error = err as Error;
      console.error("Error in fetchSettings:", error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };
  
  const refreshSettings = async () => {
    await fetchSettings();
  };
  
  useEffect(() => {
    fetchSettings();
  }, []);
  
  return (
    <GlobalSettingsContext.Provider value={{ settings, loading, error, refreshSettings }}>
      {children}
    </GlobalSettingsContext.Provider>
  );
}

export const useAppSettings = () => useContext(GlobalSettingsContext);
