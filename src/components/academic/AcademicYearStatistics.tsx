
import { useState, useEffect } from "react";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowDownIcon, ArrowUpIcon, UserCircle, BookOpen, Users } from "lucide-react";

type YearStats = {
  studentCount: number;
  sponsorCount: number;
  examCount: number;
  newStudents: number;
  newSponsors: number;
  studentChangePercent: number;
  sponsorChangePercent: number;
  examChangePercent: number;
};

export function AcademicYearStatistics() {
  const { currentYear, academicYears } = useAcademicYear();
  const [stats, setStats] = useState<YearStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!currentYear) return;

    const fetchStatistics = async () => {
      setIsLoading(true);
      try {
        // Get previous year (if any)
        const currentIndex = academicYears.findIndex(y => y.id === currentYear.id);
        const previousYear = currentIndex < academicYears.length - 1 ? academicYears[currentIndex + 1] : null;

        // Fetch student count for current year
        const { count: studentCount, error: studentsError } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('current_academic_year', parseInt(currentYear.year_name));
        
        if (studentsError) throw studentsError;

        // Fetch students created during this academic year
        const { count: newStudents, error: newStudentsError } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', currentYear.start_date)
          .lte('created_at', currentYear.end_date);
        
        if (newStudentsError) throw newStudentsError;

        // Fetch sponsor count that were active during this year
        const { count: sponsorCount, error: sponsorsError } = await supabase
          .from('sponsors')
          .select('*', { count: 'exact', head: true })
          .lte('start_date', currentYear.end_date)
          .eq('status', 'active');
          
        if (sponsorsError) throw sponsorsError;

        // Fetch new sponsors added this year
        const { count: newSponsors, error: newSponsorsError } = await supabase
          .from('sponsors')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', currentYear.start_date)
          .lte('created_at', currentYear.end_date);
          
        if (newSponsorsError) throw newSponsorsError;

        // Fetch exams for this academic year
        const { count: examCount, error: examsError } = await supabase
          .from('exams')
          .select('*', { count: 'exact', head: true })
          .eq('academic_year', currentYear.year_name);
          
        if (examsError) throw examsError;

        // Get previous year stats for comparison (if available)
        let prevStudentCount = 0;
        let prevSponsorCount = 0;
        let prevExamCount = 0;

        if (previousYear) {
          // Previous year student count
          const { count: prevStudents } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('current_academic_year', parseInt(previousYear.year_name));
          
          prevStudentCount = prevStudents || 0;

          // Previous year sponsor count
          const { count: prevSponsors } = await supabase
            .from('sponsors')
            .select('*', { count: 'exact', head: true })
            .lte('start_date', previousYear.end_date)
            .eq('status', 'active');
          
          prevSponsorCount = prevSponsors || 0;

          // Previous year exam count
          const { count: prevExams } = await supabase
            .from('exams')
            .select('*', { count: 'exact', head: true })
            .eq('academic_year', previousYear.year_name);
          
          prevExamCount = prevExams || 0;
        }

        // Calculate percent changes
        const studentChangePercent = prevStudentCount ? ((studentCount - prevStudentCount) / prevStudentCount) * 100 : 0;
        const sponsorChangePercent = prevSponsorCount ? ((sponsorCount - prevSponsorCount) / prevSponsorCount) * 100 : 0;
        const examChangePercent = prevExamCount ? ((examCount - prevExamCount) / prevExamCount) * 100 : 0;

        setStats({
          studentCount: studentCount || 0,
          sponsorCount: sponsorCount || 0,
          examCount: examCount || 0,
          newStudents: newStudents || 0,
          newSponsors: newSponsors || 0,
          studentChangePercent,
          sponsorChangePercent,
          examChangePercent
        });
      } catch (error: any) {
        console.error("Error fetching statistics:", error);
        toast({
          title: "Error",
          description: `Failed to load statistics: ${error.message}`,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatistics();
  }, [currentYear, academicYears]);

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="w-full h-[120px] rounded-lg" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return <div className="text-muted-foreground">No statistics available</div>;
  }

  const formatChange = (value: number) => {
    const isPositive = value > 0;
    const Icon = isPositive ? ArrowUpIcon : ArrowDownIcon;
    const colorClass = isPositive ? "text-green-500" : value < 0 ? "text-red-500" : "text-gray-500";
    
    return (
      <div className={`flex items-center ${colorClass}`}>
        {value !== 0 && <Icon className="w-4 h-4 mr-1" />}
        <span>{Math.abs(value).toFixed(1)}%</span>
      </div>
    );
  };

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.studentCount}</div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <div>
              <span className="font-medium text-foreground">+{stats.newStudents}</span> new this year
            </div>
            <div className="flex items-center">
              <span className="mr-1">vs prev. year:</span> 
              {formatChange(stats.studentChangePercent)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <UserCircle className="w-4 h-4 mr-2" />
            Sponsors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.sponsorCount}</div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <div>
              <span className="font-medium text-foreground">+{stats.newSponsors}</span> new this year
            </div>
            <div className="flex items-center">
              <span className="mr-1">vs prev. year:</span> 
              {formatChange(stats.sponsorChangePercent)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <BookOpen className="w-4 h-4 mr-2" />
            Exams
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.examCount}</div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <div>
              <span className="font-medium text-foreground">&nbsp;</span>
            </div>
            <div className="flex items-center">
              <span className="mr-1">vs prev. year:</span> 
              {formatChange(stats.examChangePercent)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
