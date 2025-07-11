import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAcademicYearFilter } from "@/hooks/useAcademicYearFilter";

interface AcademicYearWarningProps {
  recordYear?: string;
  className?: string;
}

export function AcademicYearWarning({ recordYear, className }: AcademicYearWarningProps) {
  const { getCrossYearWarning } = useAcademicYearFilter();
  const warning = getCrossYearWarning(recordYear);

  if (!warning) return null;

  return (
    <Alert className={`border-amber-200 bg-amber-50 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        {warning}
      </AlertDescription>
    </Alert>
  );
}