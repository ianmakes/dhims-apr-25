
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  BookOpen, 
  Users, 
  UserCircle,
  BarChart2,
  CalendarDays,
  RefreshCcw
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AcademicYearSelector } from "@/components/dashboard/AcademicYearSelector";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { AcademicYearStats } from "@/components/dashboard/AcademicYearStats";

export default function Dashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { selectedYear } = useAcademicYear();
  const selectedYearNumber = selectedYear ? parseInt(selectedYear.year_name) : undefined;

  // Stats queries with academic year filtering
  const { data: studentCount = 0, refetch: refetchStudents } = useQuery({
    queryKey: ["student-count", selectedYearNumber],
    queryFn: async () => {
      if (!selectedYearNumber) return 0;

      const { count, error } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("current_academic_year", selectedYearNumber);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!selectedYearNumber,
  });

  const { data: sponsorCount = 0, refetch: refetchSponsors } = useQuery({
    queryKey: ["sponsor-count", selectedYear?.id],
    queryFn: async () => {
      if (!selectedYear) return 0;

      const { count, error } = await supabase
        .from("sponsors")
        .select("*", { count: "exact", head: true })
        .gte("start_date", selectedYear.start_date)
        .lte("start_date", selectedYear.end_date);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!selectedYear,
  });

  const { data: examCount = 0, refetch: refetchExams } = useQuery({
    queryKey: ["exam-count", selectedYear?.year_name],
    queryFn: async () => {
      if (!selectedYear?.year_name) return 0;

      const { count, error } = await supabase
        .from("exams")
        .select("*", { count: "exact", head: true })
        .eq("academic_year", selectedYear.year_name);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!selectedYear?.year_name,
  });

  const { data: unassignedStudents = 0, refetch: refetchUnassigned } = useQuery({
    queryKey: ["unassigned-students", selectedYearNumber],
    queryFn: async () => {
      if (!selectedYearNumber) return 0;

      const { count, error } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .is("sponsor_id", null)
        .eq("current_academic_year", selectedYearNumber);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!selectedYearNumber,
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

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard" 
        description="Welcome to David's Hope International Management System"
        actions={
          <div className="flex items-center space-x-4">
            <AcademicYearSelector />
            <Button 
              onClick={refreshAll} 
              disabled={isRefreshing}
              variant="outline"
              className="text-wp-primary"
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value={studentCount}
          description={selectedYear ? `Students in ${selectedYear.year_name}` : "Students in the system"}
          icon={<Users className="h-5 w-5 text-wp-primary" />}
        />
        <StatsCard
          title="Sponsors"
          value={sponsorCount}
          description={selectedYear ? `Sponsors in ${selectedYear.year_name}` : "Active sponsors"}
          icon={<UserCircle className="h-5 w-5 text-wp-primary" />}
        />
        <StatsCard
          title="Exams Recorded"
          value={examCount}
          description={selectedYear ? `Exams in ${selectedYear.year_name}` : "Total exams recorded"}
          icon={<BookOpen className="h-5 w-5 text-wp-primary" />}
        />
        <StatsCard
          title="Unassigned Students"
          value={unassignedStudents}
          description="Students needing sponsors"
          icon={<CalendarDays className="h-5 w-5 text-wp-warning" />}
          color="warning"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AcademicYearStats />

        <Card className="wp-card">
          <CardHeader className="border-b border-wp-gray-200">
            <CardTitle className="text-wp-text-primary">Recent Activity</CardTitle>
            <CardDescription>Recent events and changes in the system</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <RecentActivityCard />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
