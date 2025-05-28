
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
  RefreshCcw,
  GraduationCap,
  Heart,
  TrendingUp,
  Award
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { StudentPerformanceChart } from "@/components/dashboard/StudentPerformanceChart";
import { RecentSponsorshipsCard } from "@/components/dashboard/RecentSponsorshipsCard";
import { ExamPerformanceCard } from "@/components/dashboard/ExamPerformanceCard";
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

  const { data: activeSponsors = 0, refetch: refetchActiveSponsors } = useQuery({
    queryKey: ["active-sponsors"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("sponsors")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
      
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: averageExamScore = 0, refetch: refetchAvgScore } = useQuery({
    queryKey: ["average-exam-score"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_exam_scores")
        .select(`
          score,
          exam:exams(max_score)
        `);
      
      if (error) throw error;
      
      if (!data || data.length === 0) return 0;
      
      const validScores = data.filter(item => item.exam?.max_score);
      if (validScores.length === 0) return 0;
      
      const totalPercentage = validScores.reduce((sum, item) => {
        const percentage = (item.score / item.exam!.max_score!) * 100;
        return sum + percentage;
      }, 0);
      
      return Math.round(totalPercentage / validScores.length);
    },
  });

  const { data: gradeDistribution = 0, refetch: refetchGradeDistribution } = useQuery({
    queryKey: ["grade-distribution"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("current_grade")
        .eq("status", "Active");
      
      if (error) throw error;
      
      const grades = data?.filter(s => s.current_grade) || [];
      return grades.length;
    },
  });

  const { data: recentExams = 0, refetch: refetchRecentExams } = useQuery({
    queryKey: ["recent-exams"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count, error } = await supabase
        .from("exams")
        .select("*", { count: "exact", head: true })
        .gte("exam_date", thirtyDaysAgo.toISOString());
      
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
      refetchUnassigned(),
      refetchActiveSponsors(),
      refetchAvgScore(),
      refetchGradeDistribution(),
      refetchRecentExams()
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
          title="Active Sponsors"
          value={activeSponsors}
          description="Currently active sponsors"
          icon={<Heart className="h-5 w-5 text-wp-primary" />}
          trend={{ value: 8, isPositive: true, label: "from last month" }}
        />
        <StatsCard
          title="Unassigned Students"
          value={unassignedStudents}
          description="Students needing sponsors"
          icon={<Calendar className="h-5 w-5 text-wp-warning" />}
          color="warning"
        />
        <StatsCard
          title="Average Exam Score"
          value={`${averageExamScore}%`}
          description="Overall student performance"
          icon={<Award className="h-5 w-5 text-wp-success" />}
          color="success"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Exams"
          value={examCount}
          description="Exams in the system"
          icon={<BookOpen className="h-5 w-5 text-wp-primary" />}
        />
        <StatsCard
          title="Recent Exams"
          value={recentExams}
          description="Exams in last 30 days"
          icon={<TrendingUp className="h-5 w-5 text-wp-primary" />}
        />
        <StatsCard
          title="Students with Grades"
          value={gradeDistribution}
          description="Students assigned to grades"
          icon={<GraduationCap className="h-5 w-5 text-wp-primary" />}
        />
        <StatsCard
          title="Total Sponsors"
          value={sponsorCount}
          description="All sponsors in system"
          icon={<UserCircle className="h-5 w-5 text-wp-primary" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
            <CardDescription>Performance distribution by grade categories</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <StudentPerformanceChart />
          </CardContent>
        </Card>

        <Card className="wp-card">
          <CardHeader className="border-b border-wp-gray-200">
            <CardTitle className="text-wp-text-primary">Recent Sponsorships</CardTitle>
            <CardDescription>Latest students who received sponsors</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <RecentSponsorshipsCard />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <Card className="wp-card">
          <CardHeader className="border-b border-wp-gray-200">
            <CardTitle className="text-wp-text-primary">Exam Performance Overview</CardTitle>
            <CardDescription>Average performance across recent exams</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <ExamPerformanceCard />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
