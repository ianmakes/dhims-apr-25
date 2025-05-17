
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { AcademicYear } from "@/types";

interface AcademicYearContextType {
  currentYear: AcademicYear | null;
  availableYears: AcademicYear[];
  isLoading: boolean;
  setCurrentYear: (year: AcademicYear) => Promise<void>;
}

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined);

export function AcademicYearProvider({ children }: { children: ReactNode }) {
  const [currentYear, setCurrentYear] = useState<AcademicYear | null>(null);
  const { toast } = useToast();

  const { data: availableYears = [], isLoading } = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .order("year_name", { ascending: false });

      if (error) throw error;
      return data as AcademicYear[];
    },
  });

  // Fetch the current academic year when available years are loaded
  useEffect(() => {
    if (availableYears.length > 0 && !currentYear) {
      const current = availableYears.find(year => year.is_current) || availableYears[0];
      setCurrentYear(current);
    }
  }, [availableYears, currentYear]);

  // Update the current year in the database and local state
  const handleSetCurrentYear = async (year: AcademicYear) => {
    try {
      // Update the database to mark this year as current
      const { error } = await supabase
        .from("academic_years")
        .update({ is_current: true })
        .eq("id", year.id);

      if (error) throw error;

      // Update local state
      setCurrentYear(year);
      
      toast({
        title: "Academic Year Updated",
        description: `Switched to ${year.year_name} academic year.`
      });
      
      // Reload the page to ensure all data is refreshed
      window.location.reload();
    } catch (error: any) {
      console.error("Error updating current academic year:", error);
      toast({
        title: "Error",
        description: `Failed to update academic year: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  return (
    <AcademicYearContext.Provider
      value={{
        currentYear,
        availableYears,
        isLoading,
        setCurrentYear: handleSetCurrentYear
      }}
    >
      {children}
    </AcademicYearContext.Provider>
  );
}

export function useAcademicYear() {
  const context = useContext(AcademicYearContext);
  if (context === undefined) {
    throw new Error("useAcademicYear must be used within an AcademicYearProvider");
  }
  return context;
}
