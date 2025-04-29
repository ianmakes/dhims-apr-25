
import React from "react";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export function AcademicYearSelector() {
  const { currentYear, academicYears, isLoading, selectYear } = useAcademicYear();

  if (isLoading) {
    return <Skeleton className="h-9 w-[180px]" />;
  }

  if (!academicYears.length) {
    return <div className="text-muted-foreground text-sm">No academic years available</div>;
  }

  return (
    <Select
      value={currentYear?.id}
      onValueChange={(value) => {
        const year = academicYears.find(y => y.id === value);
        if (year) selectYear(year);
      }}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select year">
          {currentYear?.year_name || "Select Year"}
          {currentYear?.is_current && " (Current)"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {academicYears.map((year) => (
          <SelectItem key={year.id} value={year.id}>
            {year.year_name} {year.is_current && "(Current)"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
