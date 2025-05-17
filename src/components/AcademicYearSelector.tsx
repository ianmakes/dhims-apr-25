
import { AcademicYearSelectButton } from "./AcademicYearSelectButton";
import { useAcademicYear } from "@/contexts/AcademicYearContext";

export function AcademicYearSelector() {
  const { currentYear, availableYears, isLoading, setCurrentYear } = useAcademicYear();

  if (isLoading) {
    return (
      <div className="flex items-center text-sm px-2 text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!currentYear || availableYears.length === 0) {
    return (
      <div className="flex items-center text-sm px-2 text-muted-foreground">
        No academic years
      </div>
    );
  }

  return (
    <AcademicYearSelectButton 
      currentYear={currentYear}
      availableYears={availableYears} 
      onChange={setCurrentYear}
    />
  );
}
