
import React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { cn } from '@/lib/utils';

export function AcademicYearSelector() {
  const { academicYears, selectedAcademicYear, setSelectedAcademicYear, isLoading } = useAcademicYear();

  if (isLoading) {
    return (
      <Button variant="outline" className="h-9 w-[160px] justify-between" disabled>
        <span className="opacity-50">Loading years...</span>
        <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
      </Button>
    );
  }

  if (!academicYears.length) {
    return (
      <Button variant="outline" className="h-9 w-[160px] justify-between" disabled>
        <span className="opacity-50">No academic years</span>
        <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-9 w-[160px] justify-between">
          <span>{selectedAcademicYear?.year_name || "Select Year"}</span>
          <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {academicYears.map((year) => (
          <DropdownMenuItem
            key={year.id}
            onClick={() => setSelectedAcademicYear(year)}
            className={cn(
              "cursor-pointer flex items-center justify-between",
              selectedAcademicYear?.id === year.id && "font-medium bg-accent"
            )}
          >
            <span>{year.year_name} {year.is_current && "(Current)"}</span>
            {selectedAcademicYear?.id === year.id && (
              <Check className="h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
