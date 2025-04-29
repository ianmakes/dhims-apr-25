
import { useState, useEffect } from "react";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

type YearTrend = {
  year_name: string;
  students: number;
  sponsors: number;
  exams: number;
};

type GenderDistribution = {
  gender: string;
  count: number;
  color: string;
};

export function AcademicYearCharts() {
  const { academicYears } = useAcademicYear();
  const [yearTrends, setYearTrends] = useState<YearTrend[]>([]);
  const [genderDistribution, setGenderDistribution] = useState<GenderDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!academicYears.length) return;

    const fetchChartData = async () => {
      setIsLoading(true);
      try {
        const trends: YearTrend[] = [];
        
        // Sort years in ascending order for the chart
        const sortedYears = [...academicYears].sort((a, b) => 
          a.year_name.localeCompare(b.year_name)
        );
        
        // Get last 5 years at most
        const recentYears = sortedYears.slice(-5);
        
        for (const year of recentYears) {
          // Get student count for this year
          const { count: studentCount, error: studentsError } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('current_academic_year', parseInt(year.year_name));
          
          if (studentsError) throw studentsError;

          // Get sponsor count for this year
          const { count: sponsorCount, error: sponsorsError } = await supabase
            .from('sponsors')
            .select('*', { count: 'exact', head: true })
            .lte('start_date', year.end_date)
            .eq('status', 'active');
          
          if (sponsorsError) throw sponsorsError;

          // Get exam count for this year
          const { count: examCount, error: examsError } = await supabase
            .from('exams')
            .select('*', { count: 'exact', head: true })
            .eq('academic_year', year.year_name);
          
          if (examsError) throw examsError;

          trends.push({
            year_name: year.year_name,
            students: studentCount || 0,
            sponsors: sponsorCount || 0,
            exams: examCount || 0
          });
        }

        setYearTrends(trends);
        
        // Also fetch gender distribution for the pie chart
        // Using the latest year for this
        const currentYearId = sortedYears[sortedYears.length - 1]?.year_name;
        if (currentYearId) {
          const { data: maleStudents, error: maleError } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('current_academic_year', parseInt(currentYearId))
            .eq('gender', 'male');
            
          if (maleError) throw maleError;
          
          const { data: femaleStudents, error: femaleError } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('current_academic_year', parseInt(currentYearId))
            .eq('gender', 'female');
            
          if (femaleError) throw femaleError;
          
          const { data: otherStudents, error: otherError } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('current_academic_year', parseInt(currentYearId))
            .eq('gender', 'other');
            
          if (otherError) throw otherError;
          
          setGenderDistribution([
            { gender: 'Male', count: maleStudents?.length || 0, color: '#3b82f6' },
            { gender: 'Female', count: femaleStudents?.length || 0, color: '#ec4899' },
            { gender: 'Other', count: otherStudents?.length || 0, color: '#8b5cf6' }
          ]);
        }

      } catch (error: any) {
        console.error("Error fetching chart data:", error);
        toast({
          title: "Error",
          description: `Failed to load chart data: ${error.message}`,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [academicYears]);

  if (isLoading) {
    return <Skeleton className="w-full h-[350px]" />;
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Academic Year Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="trends">
          <TabsList>
            <TabsTrigger value="trends">Year-over-Year Trends</TabsTrigger>
            <TabsTrigger value="gender">Current Gender Distribution</TabsTrigger>
          </TabsList>
          <TabsContent value="trends" className="pt-4">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={yearTrends}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year_name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="students" name="Students" fill="#3b82f6" />
                  <Bar dataKey="sponsors" name="Sponsors" fill="#8b5cf6" />
                  <Bar dataKey="exams" name="Exams" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          <TabsContent value="gender" className="pt-4">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="gender"
                  >
                    {genderDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} students`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
