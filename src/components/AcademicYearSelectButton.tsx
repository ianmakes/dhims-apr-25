
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import type { AcademicYear } from "@/types";
import { format } from "date-fns";

interface AcademicYearSelectButtonProps {
  currentYear: AcademicYear;
  availableYears: AcademicYear[];
  onChange: (year: AcademicYear) => Promise<void>;
}

export function AcademicYearSelectButton({
  currentYear,
  availableYears,
  onChange
}: AcademicYearSelectButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleYearChange = async (yearId: string) => {
    if (isLoading) return; // Prevent multiple clicks while loading
    
    const year = availableYears.find(y => y.id === yearId);
    if (!year) return;

    setIsLoading(true);
    await onChange(year);
    setIsLoading(false);
  };

  const formatDateRange = (year: AcademicYear) => {
    const startDate = new Date(year.start_date);
    const endDate = new Date(year.end_date);
    return `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="gap-2 h-8 border-dashed"
        >
          <CalendarIcon className="h-4 w-4" />
          <span className="whitespace-nowrap">{currentYear.year_name} Academic Year</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch Academic Year</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={currentYear.id}
          onValueChange={handleYearChange}
        >
          {availableYears.map((year) => (
            <DropdownMenuRadioItem
              key={year.id}
              value={year.id}
              className="cursor-pointer"
              disabled={isLoading}
            >
              <div className="flex flex-col">
                <span>{year.year_name} {year.is_current && "(Current)"}</span>
                <span className="text-xs text-muted-foreground">{formatDateRange(year)}</span>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Switching years will refresh the page
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
