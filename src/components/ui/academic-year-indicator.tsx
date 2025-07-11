import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAppSettings } from "@/components/settings/GlobalSettingsProvider";

interface AcademicYearIndicatorProps {
  year?: string;
  showIcon?: boolean;
  variant?: "default" | "secondary" | "outline";
  className?: string;
}

export function AcademicYearIndicator({ 
  year, 
  showIcon = true, 
  variant = "outline",
  className 
}: AcademicYearIndicatorProps) {
  const { selectedAcademicYear, isCurrentYear } = useAppSettings();
  
  const displayYear = year || selectedAcademicYear;
  
  if (!displayYear) return null;

  const isCurrent = isCurrentYear(displayYear);
  const badgeVariant = isCurrent ? "default" : variant;
  
  return (
    <Badge 
      variant={badgeVariant} 
      className={`${className} ${isCurrent ? 'bg-green-100 text-green-800 border-green-200' : ''}`}
    >
      {showIcon && <Calendar className="w-3 h-3 mr-1" />}
      {displayYear}
      {isCurrent && " (Current)"}
    </Badge>
  );
}