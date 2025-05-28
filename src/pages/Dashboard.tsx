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
import { StudentPerformanceChart } from "@/components/dashboard/StudentPerformanceChart";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Stats queries
  const { data: studentCount = 0, refetch: refetchStudents } = useQuery({
    queryKey: ["student-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: sponsorCount = 0, refetch: refetchSponsors } = useQuery({
    queryKey: ["sponsor-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("sponsors")
        .select("*", { count: "exact", head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: examCount = 0, refetch: refetchExams } = useQuery({
    queryKey: ["exam-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("exams")
        .select("*", { count: "exact", head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: unassignedStudents = 0, refetch: refetchUnassigned } = useQuery({
    queryKey: ["unassigned-students"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .is("sponsor_id", null);
      
      if (error) throw error;
      return count || 0;
    },
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
          title="Total Students"
          value={studentCount}
          description="Students in the system"
          icon={<Users className="h-5 w-5 text-wp-primary" />}
          trend={{ value: 12, isPositive: true, label: "from last month" }}
        />
        <StatsCard
          title="Total Sponsors"
          value={sponsorCount}
          description="Active sponsors"
          icon={<UserCircle className="h-5 w-5 text-wp-primary" />}
        />
        <StatsCard
          title="Exams Recorded"
          value={examCount}
          description="Total exams in the system"
          icon={<BookOpen className="h-5 w-5 text-wp-primary" />}
        />
        <StatsCard
          title="Unassigned Students"
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
            <RecentActivityCard />
          </CardContent>
        </Card>

        <Card className="wp-card">
          <CardHeader className="border-b border-wp-gray-200">
            <CardTitle className="text-wp-text-primary">Student Performance</CardTitle>
            <CardDescription>Average performance distribution by grade categories</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <StudentPerformanceChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
