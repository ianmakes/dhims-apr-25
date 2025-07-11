
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
  isCurrentYear: (year?: string) => boolean;
  canModifyData: (recordYear?: string) => boolean;
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
  refreshSettings: async () => {},
  isCurrentYear: () => false,
  canModifyData: () => false
});

// Helper function to convert hex to HSL
const hexToHsl = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export function GlobalSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<AcademicYear | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Initialize with current calendar year if no academic year is found
  useEffect(() => {
    if (!currentAcademicYear && !selectedAcademicYear) {
      const currentYear = new Date().getFullYear();
      setSelectedAcademicYear(currentYear.toString());
    }
  }, [currentAcademicYear, selectedAcademicYear]);
  
  // Helper functions
  const isCurrentYear = (year?: string) => {
    if (!year) return false;
    return year === currentAcademicYear?.year_name;
  };
  
  const canModifyData = (recordYear?: string) => {
    // Can modify data if viewing current year or if no record year specified
    if (!recordYear) return true;
    return selectedAcademicYear === recordYear;
  };
  
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
        
        // Convert hex colors to HSL for CSS custom properties
        const primaryHsl = hexToHsl(settingsToUse.primary_color);
        const secondaryHsl = hexToHsl(settingsToUse.secondary_color);
        
        // Set CSS custom properties for dynamic theming
        document.documentElement.style.setProperty('--color-primary', settingsToUse.primary_color);
        document.documentElement.style.setProperty('--color-secondary', settingsToUse.secondary_color);
        document.documentElement.style.setProperty('--primary', primaryHsl);
        document.documentElement.style.setProperty('--primary-foreground', '0 0% 100%');
        
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
      refreshSettings,
      isCurrentYear,
      canModifyData
    }}>
      {children}
    </GlobalSettingsContext.Provider>
  );
}

export const useAppSettings = () => useContext(GlobalSettingsContext);
