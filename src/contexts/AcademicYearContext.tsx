
import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AcademicYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface AcademicYearContextType {
  years: AcademicYear[];
  currentYear: AcademicYear | null;
  setCurrentYear: (year: AcademicYear) => void;
  isLoading: boolean;
  error: Error | null;
  fetchYears: () => Promise<void>;
}

const AcademicYearContext = createContext<AcademicYearContextType>({
  years: [],
  currentYear: null,
  setCurrentYear: () => {},
  isLoading: true,
  error: null,
  fetchYears: async () => {},
});

export const useAcademicYear = () => useContext(AcademicYearContext);

export const AcademicYearProvider = ({ children }: { children: ReactNode }) => {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [currentYear, setCurrentYear] = useState<AcademicYear | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchYears = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('year_name', { ascending: false });

      if (error) throw error;

      setYears(data || []);
      
      // Find current year
      const current = data?.find(year => year.is_current) || data?.[0] || null;
      if (current) {
        setCurrentYear(current);
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Set current year function
  const handleSetCurrentYear = async (year: AcademicYear) => {
    try {
      setCurrentYear(year);
      
      // If the year isn't already marked as current, update in database
      if (!year.is_current) {
        await supabase
          .from('academic_years')
          .update({ is_current: true })
          .eq('id', year.id);
          
        // Refresh years after update
        fetchYears();
      }
    } catch (error) {
      console.error('Error setting current academic year:', error);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  return (
    <AcademicYearContext.Provider
      value={{
        years,
        currentYear,
        setCurrentYear: handleSetCurrentYear,
        isLoading,
        error,
        fetchYears,
      }}
    >
      {children}
    </AcademicYearContext.Provider>
  );
};
