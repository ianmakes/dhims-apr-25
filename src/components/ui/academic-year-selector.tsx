
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppSettings } from "@/components/settings/GlobalSettingsProvider";

interface AcademicYearSelectorProps {
  value?: string | null;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showAllOption?: boolean;
}

export function AcademicYearSelector({ 
  value, 
  onValueChange, 
  placeholder = "Select academic year",
  className,
  showAllOption = false
}: AcademicYearSelectorProps) {
  const { currentAcademicYear } = useAppSettings();

  const { data: academicYears = [] } = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) {
        console.error("Error fetching academic years:", error);
        throw error;
      }

      return data || [];
    },
  });

  const handleValueChange = (newValue: string) => {
    if (newValue === "all") {
      onValueChange("");
    } else {
      onValueChange(newValue);
    }
  };

  return (
    <Select value={value || (showAllOption ? "all" : "")} onValueChange={handleValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {showAllOption && <SelectItem value="all">All Years</SelectItem>}
        {academicYears.map((year) => (
          <SelectItem key={year.id} value={year.year_name}>
            {year.year_name}
            {year.is_current && " (Current)"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
