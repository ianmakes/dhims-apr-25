import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSettings } from "@/components/settings/GlobalSettingsProvider";

const COLORS = {
  excellent: "#10b981", // green
  good: "#2271b1", // wp-primary blue
  average: "#dba617", // wp-warning
  poor: "#d63638", // wp-error
  noData: "#8c8f94" // wp-gray-500
};

const chartConfig = {
  students: {
    label: "Students",
  },
  excellent: {
    label: "Excellent (80-100%)",
    color: COLORS.excellent,
  },
  good: {
    label: "Good (60-79%)",
    color: COLORS.good,
  },
  average: {
    label: "Average (40-59%)",
    color: COLORS.average,
  },
  poor: {
    label: "Poor (0-39%)",
    color: COLORS.poor,
  },
  noData: {
    label: "No Exam Data",
    color: COLORS.noData,
  },
};

export function StudentPerformanceChart() {
  const { selectedAcademicYear } = useAppSettings();

  const { data: performanceData, isLoading } = useQuery({
    queryKey: ["student-performance-analytics", selectedAcademicYear],
    queryFn: async () => {
      console.log("Fetching student performance analytics for academic year:", selectedAcademicYear);
      
      // Get all active students
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("id")
        .eq("status", "Active");
        
      if (studentsError) {
        console.error("Error fetching students:", studentsError);
        throw studentsError;
      }

      if (!students || students.length === 0) {
        return [];
      }

      // Get exam scores for all students, filtered by academic year if selected
      let examScoresQuery = supabase
        .from("student_exam_scores")
        .select(`
          student_id,
          score,
          exam:exams(max_score, academic_year)
        `);

      // Filter by academic year if one is selected
      if (selectedAcademicYear) {
        examScoresQuery = examScoresQuery.eq('exam.academic_year', selectedAcademicYear);
      }

      const { data: examScores, error: scoresError } = await examScoresQuery;
        
      if (scoresError) {
        console.error("Error fetching exam scores:", scoresError);
        throw scoresError;
      }

      // Calculate performance categories
      const studentPerformance: Record<string, number[]> = {};
      
      // Initialize all students with empty arrays
      students.forEach(student => {
        studentPerformance[student.id] = [];
      });

      // Calculate percentages for each student's exams
      if (examScores && examScores.length > 0) {
        examScores.forEach(score => {
          if (score.exam?.max_score && score.exam.max_score > 0) {
            const percentage = (score.score / score.exam.max_score) * 100;
            if (!studentPerformance[score.student_id]) {
              studentPerformance[score.student_id] = [];
            }
            studentPerformance[score.student_id].push(percentage);
          }
        });
      }

      // Categorize students based on their average performance
      let excellent = 0;
      let good = 0;
      let average = 0;
      let poor = 0;
      let noData = 0;

      Object.entries(studentPerformance).forEach(([studentId, percentages]) => {
        if (percentages.length === 0) {
          noData++;
        } else {
          const avgPercentage = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
          
          if (avgPercentage >= 80) {
            excellent++;
          } else if (avgPercentage >= 60) {
            good++;
          } else if (avgPercentage >= 40) {
            average++;
          } else {
            poor++;
          }
        }
      });

      const result = [
        { name: "Excellent", value: excellent, color: COLORS.excellent, label: "80-100%" },
        { name: "Good", value: good, color: COLORS.good, label: "60-79%" },
        { name: "Average", value: average, color: COLORS.average, label: "40-59%" },
        { name: "Poor", value: poor, color: COLORS.poor, label: "0-39%" },
      ];

      // Only include categories with data
      const filteredResult = result.filter(item => item.value > 0);
      
      // Add no data category if there are students without exam data
      if (noData > 0) {
        filteredResult.push({ name: "No Data", value: noData, color: COLORS.noData, label: "No exams" });
      }

      console.log("Performance data for", selectedAcademicYear, ":", filteredResult);
      return filteredResult;
    },
  });

  if (isLoading) {
    return (
      <div className="h-[280px] flex items-center justify-center">
        <Skeleton className="h-40 w-40 rounded-full" />
      </div>
    );
  }

  if (!performanceData || performanceData.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-wp-text-secondary text-sm">No performance data available</p>
          <p className="text-xs text-wp-text-secondary mt-1">Add exam scores to view analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <ChartContainer config={chartConfig} className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={performanceData}
              cx="50%"
              cy="45%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {performanceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, props) => [
                    `${value} student${value !== 1 ? 's' : ''} (${props.payload?.label})`,
                    name
                  ]}
                />
              }
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry: any) => (
                <span style={{ color: entry.color, fontSize: '12px' }}>
                  {value} ({entry.payload?.label})
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
