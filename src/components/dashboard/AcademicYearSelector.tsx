
import React from 'react';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AcademicYear } from '@/types';
import { CalendarDays } from 'lucide-react';

export function AcademicYearSelector() {
  const { academicYears, selectedYear, setSelectedYear, currentAcademicYear, isLoading } = useAcademicYear();
  
  if (isLoading || academicYears.length === 0) {
    return null;
  }

  const handleYearChange = (yearId: string) => {
    const year = academicYears.find(y => y.id === yearId) || null;
    setSelectedYear(year);
  };

  return (
    <div className="flex items-center space-x-2">
      <Select 
        value={selectedYear?.id || ''} 
        onValueChange={handleYearChange}
      >
        <SelectTrigger className="w-[180px]">
          <div className="flex items-center">
            <CalendarDays className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Select Year" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {academicYears.map((year) => (
            <SelectItem key={year.id} value={year.id}>
              {year.year_name} {year.is_current && " (Current)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedYear && currentAcademicYear && selectedYear.id !== currentAcademicYear.id && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setSelectedYear(currentAcademicYear)}
        >
          Reset to Current
        </Button>
      )}
    </div>
  );
}
