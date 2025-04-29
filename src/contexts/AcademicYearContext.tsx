
import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AcademicYear } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

interface AcademicYearContextType {
  currentAcademicYear: AcademicYear | null;
  setCurrentAcademicYear: (year: AcademicYear | null) => void;
  academicYears: AcademicYear[];
  isLoading: boolean;
}

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined);

export const AcademicYearProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentAcademicYear, setCurrentAcademicYear] = useState<AcademicYear | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAcademicYears = async () => {
      setIsLoading(true);
      try {
        // First, try to get the current academic year
        const { data: currentYearData, error: currentYearError } = await supabase
          .from('academic_years')
          .select('*')
          .eq('is_current', true)
          .single();

        if (currentYearError && currentYearError.code !== 'PGRST116') {
          throw currentYearError;
        }

        // Then fetch all academic years
        const { data: allYears, error: allYearsError } = await supabase
          .from('academic_years')
          .select('*')
          .order('year_name', { ascending: false });

        if (allYearsError) {
          throw allYearsError;
        }

        setAcademicYears(allYears || []);

        // Set current year if found or use most recent year
        if (currentYearData) {
          setCurrentAcademicYear(currentYearData);
        } else if (allYears && allYears.length > 0) {
          setCurrentAcademicYear(allYears[0]); // Use the most recent year as fallback
        }

      } catch (error: any) {
        console.error('Error fetching academic years:', error);
        toast({
          title: "Error loading academic years",
          description: error.message || "Please try again later",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAcademicYears();
  }, [toast]);

  return (
    <AcademicYearContext.Provider value={{
      currentAcademicYear,
      setCurrentAcademicYear,
      academicYears,
      isLoading
    }}>
      {children}
    </AcademicYearContext.Provider>
  );
};

export const useAcademicYear = (): AcademicYearContextType => {
  const context = useContext(AcademicYearContext);
  if (context === undefined) {
    throw new Error('useAcademicYear must be used within an AcademicYearProvider');
  }
  return context;
};
