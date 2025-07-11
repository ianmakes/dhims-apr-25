import { useAppSettings } from "@/components/settings/GlobalSettingsProvider";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";

/**
 * Custom hook for applying academic year filtering to Supabase queries
 * Automatically filters data by the currently selected academic year
 */
export function useAcademicYearFilter() {
  const { selectedAcademicYear, isCurrentYear, canModifyData } = useAppSettings();

  /**
   * Applies academic year filtering to a Supabase query
   * @param query - The Supabase query builder
   * @param columnName - The column name to filter by (defaults to 'academic_year_recorded')
   * @returns The filtered query
   */
  const applyAcademicYearFilter = (
    query: any,
    columnName: string = 'academic_year_recorded'
  ) => {
    if (selectedAcademicYear && selectedAcademicYear !== "all") {
      return query.eq(columnName, selectedAcademicYear);
    }
    return query;
  };

  /**
   * Gets the current academic year for new record creation
   * @returns The selected academic year or current year
   */
  const getCurrentAcademicYear = () => {
    return selectedAcademicYear || new Date().getFullYear().toString();
  };

  /**
   * Validates if a record can be modified based on its academic year
   * @param recordYear - The academic year of the record
   * @returns Boolean indicating if the record can be modified
   */
  const canModifyRecord = (recordYear?: string) => {
    return canModifyData(recordYear);
  };

  /**
   * Gets warning message for cross-year modifications
   * @param recordYear - The academic year of the record
   * @returns Warning message or null
   */
  const getCrossYearWarning = (recordYear?: string) => {
    if (!recordYear || !selectedAcademicYear) return null;
    
    if (recordYear !== selectedAcademicYear) {
      return `This record belongs to ${recordYear}, but you're viewing ${selectedAcademicYear}. Changes may not be visible in the current view.`;
    }
    
    return null;
  };

  return {
    selectedAcademicYear,
    applyAcademicYearFilter,
    getCurrentAcademicYear,
    canModifyRecord,
    getCrossYearWarning,
    isCurrentYear,
    canModifyData
  };
}