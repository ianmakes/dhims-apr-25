
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

interface AcademicYear {
  id: string;
  year_name: string;
  is_current: boolean;
  start_date: string;
  end_date: string;
}

interface GlobalSettingsContextType {
  settings: AppSettings | null;
  currentAcademicYear: AcademicYear | null;
  selectedAcademicYear: string | null;
  setSelectedAcademicYear: (year: string) => void;
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
  currentAcademicYear: null,
  selectedAcademicYear: null,
  setSelectedAcademicYear: () => {},
  loading: false,
  error: null,
  refreshSettings: async () => {}
});

export function GlobalSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<AcademicYear | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      // Fetch app settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 'general')
        .single();
      
      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error("Error fetching app settings:", settingsError);
        setError(new Error(settingsError.message));
      } else {
        setSettings(settingsData || defaultSettings);
      }
      
      // Fetch current academic year
      const { data: academicYearData, error: academicYearError } = await supabase
        .from('academic_years')
        .select('*')
        .eq('is_current', true)
        .single();
      
      if (academicYearError && academicYearError.code !== 'PGRST116') {
        console.error("Error fetching current academic year:", academicYearError);
      } else if (academicYearData) {
        setCurrentAcademicYear(academicYearData as AcademicYear);
        // Set selected academic year to current if not already set
        if (!selectedAcademicYear) {
          setSelectedAcademicYear(academicYearData.year_name);
        }
      }
      
      // Apply colors to document root
      if (settingsData || defaultSettings) {
        const settingsToUse = settingsData || defaultSettings;
        document.documentElement.style.setProperty('--color-primary', settingsToUse.primary_color);
        document.documentElement.style.setProperty('--color-secondary', settingsToUse.secondary_color);
        
        // Set favicon if available
        if (settingsToUse.favicon_url) {
          const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (link) {
            link.href = settingsToUse.favicon_url;
          } else {
            const newLink = document.createElement('link');
            newLink.rel = 'icon';
            newLink.href = settingsToUse.favicon_url;
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
    <GlobalSettingsContext.Provider value={{ 
      settings, 
      currentAcademicYear,
      selectedAcademicYear,
      setSelectedAcademicYear,
      loading, 
      error, 
      refreshSettings 
    }}>
      {children}
    </GlobalSettingsContext.Provider>
  );
}

export const useAppSettings = () => useContext(GlobalSettingsContext);
