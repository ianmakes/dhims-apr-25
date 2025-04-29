
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AcademicYear } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AcademicYearContextType {
  currentAcademicYear: AcademicYear | null;
  selectedYear: AcademicYear | null;
  setSelectedYear: (year: AcademicYear | null) => void;
  academicYears: AcademicYear[];
  isLoading: boolean;
  error: Error | null;
}

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined);

export function AcademicYearProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  
  // Fetch all academic years
  const { 
    data: academicYears = [], 
    isLoading,
    error 
  } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('year_name', { ascending: false });
      
      if (error) throw error;
      return data as AcademicYear[];
    }
  });

  // Find the current academic year
  const currentAcademicYear = academicYears.find(year => year.is_current) || null;

  // If no year is selected, use the current academic year
  useEffect(() => {
    if (!selectedYear && currentAcademicYear && !isLoading) {
      setSelectedYear(currentAcademicYear);
    }
  }, [currentAcademicYear, selectedYear, isLoading]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading academic years",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  }, [error, toast]);

  const value = {
    currentAcademicYear,
    selectedYear,
    setSelectedYear,
    academicYears,
    isLoading,
    error: error as Error | null
  };

  return (
    <AcademicYearContext.Provider value={value}>
      {children}
    </AcademicYearContext.Provider>
  );
}

export function useAcademicYear() {
  const context = useContext(AcademicYearContext);
  if (context === undefined) {
    throw new Error('useAcademicYear must be used within an AcademicYearProvider');
  }
  return context;
}
