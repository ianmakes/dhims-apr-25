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
import { AcademicYearSelector } from "@/components/ui/academic-year-selector";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppSettings } from "@/components/settings/GlobalSettingsProvider";

export default function Dashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { selectedAcademicYear, setSelectedAcademicYear, currentAcademicYear } = useAppSettings();

  // Initialize selected academic year to current academic year if not set
  useEffect(() => {
    if (!selectedAcademicYear && currentAcademicYear) {
      setSelectedAcademicYear(currentAcademicYear.year_name);
    }
  }, [currentAcademicYear, selectedAcademicYear, setSelectedAcademicYear]);

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
    queryKey: ["exam-count", selectedAcademicYear],
    queryFn: async () => {
      let query = supabase
        .from("exams")
        .select("*", { count: "exact", head: true });
      
      if (selectedAcademicYear) {
        query = query.eq("academic_year", selectedAcademicYear);
      }
      
      const { count, error } = await query;
      
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
    queryKey: ["average-exam-score", selectedAcademicYear],
    queryFn: async () => {
      let query = supabase
        .from("student_exam_scores")
        .select(`
          score,
          exam:exams(max_score, academic_year)
        `);
      
      if (selectedAcademicYear) {
        query = query.eq('exam.academic_year', selectedAcademicYear);
      }

      const { data, error } = await query;
      
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
    queryKey: ["recent-exams", selectedAcademicYear],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      let query = supabase
        .from("exams")
        .select("*", { count: "exact", head: true })
        .gte("exam_date", thirtyDaysAgo.toISOString());
      
      if (selectedAcademicYear) {
        query = query.eq("academic_year", selectedAcademicYear);
      }
      
      const { count, error } = await query;
      
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
    <div className="space-y-8">
      <PageHeader 
        title="Dashboard" 
        description={`Welcome to David's Hope International Management System${selectedAcademicYear ? ` - ${selectedAcademicYear}` : ''}`}
        actions={
          <div className="flex items-center gap-2">
            <AcademicYearSelector
              value={selectedAcademicYear}
              onValueChange={setSelectedAcademicYear}
              placeholder="Filter by year"
              className="w-40"
              showAllOption={true}
            />
            <Button 
              onClick={refreshAll} 
              disabled={isRefreshing}
              variant="outline"
              className="text-wp-primary border-wp-primary hover:bg-wp-primary hover:text-white"
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
          </div>
        }
      />

      {/* Key Metrics Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value={studentCount}
          description="Active students in system"
          icon={<Users className="h-5 w-5" />}
          trend={{ value: 12, isPositive: true, label: "from last month" }}
        />
        <StatsCard
          title="Active Sponsors"
          value={activeSponsors}
          description="Currently sponsoring students"
          icon={<Heart className="h-5 w-5" />}
          trend={{ value: 8, isPositive: true, label: "from last month" }}
        />
        <StatsCard
          title="Unassigned Students"
          value={unassignedStudents}
          description="Students needing sponsors"
          icon={<UserCircle className="h-5 w-5" />}
          color="warning"
        />
        <StatsCard
          title="Average Performance"
          value={`${averageExamScore}%`}
          description="Overall exam performance"
          icon={<Award className="h-5 w-5" />}
          color="success"
        />
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Exams"
          value={examCount}
          description="Exams conducted"
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatsCard
          title="Recent Exams"
          value={recentExams}
          description="Last 30 days"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatsCard
          title="Graded Students"
          value={gradeDistribution}
          description="Students with grade levels"
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatsCard
          title="Total Sponsors"
          value={sponsorCount}
          description="All registered sponsors"
          icon={<UserCircle className="h-5 w-5" />}
        />
      </div>

      {/* Analytics Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="border-wp-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-wp-gray-200 bg-wp-gray-50/50">
            <CardTitle className="text-wp-text-primary flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-wp-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-wp-text-secondary">
              Recent events and system changes
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <RecentActivityCard />
          </CardContent>
        </Card>

        {/* Student Performance */}
        <Card className="border-wp-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-wp-gray-200 bg-wp-gray-50/50">
            <CardTitle className="text-wp-text-primary flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-wp-primary" />
              Student Performance
            </CardTitle>
            <CardDescription className="text-wp-text-secondary">
              Performance distribution by grade categories
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <StudentPerformanceChart />
          </CardContent>
        </Card>

        {/* Recent Sponsorships */}
        <Card className="border-wp-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-wp-gray-200 bg-wp-gray-50/50">
            <CardTitle className="text-wp-text-primary flex items-center gap-2">
              <Heart className="h-5 w-5 text-wp-primary" />
              Recent Sponsorships
            </CardTitle>
            <CardDescription className="text-wp-text-secondary">
              Latest students who received sponsors
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <RecentSponsorshipsCard />
          </CardContent>
        </Card>
      </div>

      {/* Exam Performance Overview */}
      <Card className="border-wp-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="border-b border-wp-gray-200 bg-wp-gray-50/50">
          <CardTitle className="text-wp-text-primary flex items-center gap-2">
            <Award className="h-5 w-5 text-wp-primary" />
            Exam Performance Overview
          </CardTitle>
          <CardDescription className="text-wp-text-secondary">
            Average performance across recent exams
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <ExamPerformanceCard />
        </CardContent>
      </Card>
    </div>
  );
}
