
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = {
  excellent: "#10b981", // green
  good: "#3b82f6", // blue
  average: "#f59e0b", // yellow
  poor: "#ef4444", // red
  noData: "#9ca3af" // gray
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
  const { data: performanceData, isLoading } = useQuery({
    queryKey: ["student-performance-analytics"],
    queryFn: async () => {
      console.log("Fetching student performance analytics...");
      
      // Get all students
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

      // Get exam scores for all students
      const { data: examScores, error: scoresError } = await supabase
        .from("student_exam_scores")
        .select(`
          student_id,
          score,
          exam:exams(max_score)
        `);
        
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
        { name: "Excellent (80-100%)", value: excellent, color: COLORS.excellent },
        { name: "Good (60-79%)", value: good, color: COLORS.good },
        { name: "Average (40-59%)", value: average, color: COLORS.average },
        { name: "Poor (0-39%)", value: poor, color: COLORS.poor },
        { name: "No Exam Data", value: noData, color: COLORS.noData },
      ].filter(item => item.value > 0); // Only show categories with data

      console.log("Performance data:", result);
      return result;
    },
  });

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <Skeleton className="h-48 w-48 rounded-full" />
      </div>
    );
  }

  if (!performanceData || performanceData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-wp-text-secondary text-sm">No performance data available</p>
        </div>
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={performanceData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
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
                formatter={(value, name) => [
                  `${value} student${value !== 1 ? 's' : ''}`,
                  name
                ]}
              />
            }
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry) => (
              <span style={{ color: entry.color }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
