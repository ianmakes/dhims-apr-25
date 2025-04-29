
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  BookOpen, 
  Users, 
  UserCircle,
  BarChart2,
  Calendar,
  RefreshCcw
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { supabase } from "@/integrations/supabase/client";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { currentYear } = useAcademicYear();

  // Stats queries
  const { data: studentCount = 0, refetch: refetchStudents } = useQuery({
    queryKey: ["student-count", currentYear?.id],
    queryFn: async () => {
      if (!currentYear) return 0;
      
      const { count, error } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("current_academic_year", parseInt(currentYear.year_name));
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!currentYear,
  });

  const { data: sponsorCount = 0, refetch: refetchSponsors } = useQuery({
    queryKey: ["sponsor-count", currentYear?.id],
    queryFn: async () => {
      if (!currentYear) return 0;
      
      const { count, error } = await supabase
        .from("sponsors")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .lte("start_date", currentYear.end_date);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!currentYear,
  });

  const { data: examCount = 0, refetch: refetchExams } = useQuery({
    queryKey: ["exam-count", currentYear?.id],
    queryFn: async () => {
      if (!currentYear) return 0;
      
      const { count, error } = await supabase
        .from("exams")
        .select("*", { count: "exact", head: true })
        .eq("academic_year", currentYear.year_name);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!currentYear,
  });

  const { data: unassignedStudents = 0, refetch: refetchUnassigned } = useQuery({
    queryKey: ["unassigned-students", currentYear?.id],
    queryFn: async () => {
      if (!currentYear) return 0;
      
      const { count, error } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("current_academic_year", parseInt(currentYear.year_name))
        .is("sponsor_id", null);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!currentYear,
  });

  // Query for student trends over time
  const { data: studentsByYear } = useQuery({
    queryKey: ["students-by-year"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("current_academic_year, id")
        .order("current_academic_year", { ascending: true });
      
      if (error) throw error;
      
      const yearCounts: Record<string, number> = {};
      data.forEach(student => {
        const year = student.current_academic_year?.toString() || "Unknown";
        yearCounts[year] = (yearCounts[year] || 0) + 1;
      });
      
      return Object.entries(yearCounts).map(([year, count]) => ({ 
        year, 
        count
      }));
    }
  });

  const refreshAll = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchStudents(),
      refetchSponsors(),
      refetchExams(),
      refetchUnassigned()
    ]);
    setIsRefreshing(false);
  };

  // Determine if we're showing year-specific data
  const yearSpecificLabel = currentYear ? ` (${currentYear.year_name})` : '';

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard" 
        description="Welcome to David's Hope International Management System"
        actions={
          <Button 
            onClick={refreshAll} 
            disabled={isRefreshing}
            variant="outline"
            className="text-wp-primary"
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={`Students${yearSpecificLabel}`}
          value={studentCount}
          description="Students in the system"
          icon={<Users className="h-5 w-5 text-wp-primary" />}
          trend={{ value: 12, isPositive: true, label: "from last month" }}
        />
        <StatsCard
          title={`Sponsors${yearSpecificLabel}`}
          value={sponsorCount}
          description="Active sponsors"
          icon={<UserCircle className="h-5 w-5 text-wp-primary" />}
        />
        <StatsCard
          title={`Exams${yearSpecificLabel}`}
          value={examCount}
          description="Total exams in the system"
          icon={<BookOpen className="h-5 w-5 text-wp-primary" />}
        />
        <StatsCard
          title={`Unassigned Students${yearSpecificLabel}`}
          value={unassignedStudents}
          description="Students needing sponsors"
          icon={<Calendar className="h-5 w-5 text-wp-warning" />}
          color="warning"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="wp-card">
          <CardHeader className="border-b border-wp-gray-200">
            <CardTitle className="text-wp-text-primary">Recent Activity</CardTitle>
            <CardDescription>Recent events and changes in the system</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <RecentActivityCard academicYear={currentYear} />
          </CardContent>
        </Card>

        <Card className="wp-card">
          <CardHeader className="border-b border-wp-gray-200">
            <CardTitle className="text-wp-text-primary">Student Enrollment Trends</CardTitle>
            <CardDescription>Student numbers by academic year</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            {!studentsByYear ? (
              <Skeleton className="h-[300px] w-full" />
            ) : studentsByYear.length > 0 ? (
              <div className="h-[300px] relative">
                <div className="absolute inset-0 flex items-end">
                  {studentsByYear.map((item, index) => (
                    <div 
                      key={item.year} 
                      className="relative flex flex-col items-center mx-2 flex-1"
                    >
                      <div 
                        className="w-full bg-primary rounded-t"
                        style={{ 
                          height: `${Math.max(30, (item.count / Math.max(...studentsByYear.map(i => i.count))) * 250)}px`
                        }}
                      />
                      <div className="mt-2 text-xs font-medium">{item.year}</div>
                      <div className="text-xs text-muted-foreground">{item.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center border border-dashed border-wp-gray-300 rounded p-4 bg-wp-gray-50">
                <div className="text-center">
                  <BarChart2 className="h-10 w-10 text-wp-gray-400 mx-auto mb-2" />
                  <p className="text-wp-text-secondary text-sm">No student data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
