
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { Badge } from '@/components/ui/badge';

export function AcademicYearLabel() {
  const { selectedAcademicYear } = useAcademicYear();
  
  if (!selectedAcademicYear) return null;

  return (
    <Badge variant="outline" className="ml-2">
      {selectedAcademicYear.year_name}
    </Badge>
  );
}
