
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AcademicYear } from "@/types";
import { useToast } from "@/hooks/use-toast";

type AcademicYearContextType = {
  currentYear: AcademicYear | null;
  academicYears: AcademicYear[];
  isLoading: boolean;
  selectYear: (year: AcademicYear) => void;
  refreshYears: () => Promise<void>;
};

const AcademicYearContext = createContext<AcademicYearContextType | null>(null);

export const useAcademicYear = () => {
  const context = useContext(AcademicYearContext);
  if (!context) {
    throw new Error("useAcademicYear must be used within an AcademicYearProvider");
  }
  return context;
};

export const AcademicYearProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentYear, setCurrentYear] = useState<AcademicYear | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAcademicYears = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('year_name', { ascending: false });

      if (error) throw error;
      
      setAcademicYears(data);
      
      // Find the current academic year (the one marked as current)
      const current = data.find(year => year.is_current);
      if (current) {
        setCurrentYear(current);
      } else if (data.length > 0) {
        // If no year is marked as current, use the most recent one
        setCurrentYear(data[0]);
      }
    } catch (error: any) {
      console.error("Error fetching academic years:", error);
      toast({
        title: "Error",
        description: `Failed to load academic years: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  const selectYear = (year: AcademicYear) => {
    setCurrentYear(year);
  };

  const refreshYears = async () => {
    await fetchAcademicYears();
  };

  return (
    <AcademicYearContext.Provider
      value={{
        currentYear,
        academicYears,
        isLoading,
        selectYear,
        refreshYears
      }}
    >
      {children}
    </AcademicYearContext.Provider>
  );
};
