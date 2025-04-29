
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AcademicYear = {
  id: string;
  year_name: string;
  is_current: boolean;
  start_date: string;
  end_date: string;
};

interface AcademicYearContextType {
  academicYears: AcademicYear[];
  currentAcademicYear: AcademicYear | null;
  selectedAcademicYear: AcademicYear | null;
  setSelectedAcademicYear: (year: AcademicYear | null) => void;
  isLoading: boolean;
}

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined);

export const AcademicYearProvider = ({ children }: { children: ReactNode }) => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<AcademicYear | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<AcademicYear | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('academic_years')
          .select('*')
          .order('year_name', { ascending: false });

        if (error) {
          throw error;
        }

        if (data) {
          setAcademicYears(data);
          
          // Find the current academic year
          const current = data.find(year => year.is_current);
          if (current) {
            setCurrentAcademicYear(current);
            setSelectedAcademicYear(current);
          } else if (data.length > 0) {
            // If no current year is set, default to the most recent one
            setSelectedAcademicYear(data[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching academic years:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAcademicYears();
  }, []);

  return (
    <AcademicYearContext.Provider
      value={{
        academicYears,
        currentAcademicYear,
        selectedAcademicYear,
        setSelectedAcademicYear,
        isLoading
      }}
    >
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
