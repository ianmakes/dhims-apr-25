
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  averageScore: {
    label: "Average Score",
    color: "#3b82f6",
  },
};

export function ExamPerformanceCard() {
  const { data: examPerformance, isLoading } = useQuery({
    queryKey: ["exam-performance"],
    queryFn: async () => {
      console.log("Fetching exam performance data...");
      
      const { data: examScores, error } = await supabase
        .from("student_exam_scores")
        .select(`
          score,
          exam:exams(
            name,
            max_score,
            academic_year
          )
        `);
        
      if (error) {
        console.error("Error fetching exam scores:", error);
        throw error;
      }

      if (!examScores || examScores.length === 0) {
        return [];
      }

      // Group by exam and calculate average scores
      const examGroups: Record<string, { scores: number[], maxScore: number, academicYear: string }> = {};
      
      examScores.forEach(score => {
        if (score.exam?.name && score.exam.max_score) {
          const examKey = `${score.exam.name} (${score.exam.academic_year})`;
          if (!examGroups[examKey]) {
            examGroups[examKey] = {
              scores: [],
              maxScore: score.exam.max_score,
              academicYear: score.exam.academic_year
            };
          }
          examGroups[examKey].scores.push(score.score);
        }
      });

      // Calculate averages and convert to percentages
      const result = Object.entries(examGroups).map(([examName, data]) => {
        const avgScore = data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length;
        const percentage = (avgScore / data.maxScore) * 100;
        
        return {
          exam: examName.length > 20 ? examName.substring(0, 20) + "..." : examName,
          averageScore: Math.round(percentage),
          studentCount: data.scores.length
        };
      }).slice(0, 6); // Show top 6 most recent exams

      console.log("Exam performance data:", result);
      return result;
    },
  });

  if (isLoading) {
    return (
      <div className="h-[200px] flex items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (!examPerformance || examPerformance.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-wp-text-secondary text-sm">No exam performance data available</p>
        </div>
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={examPerformance} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
          <XAxis 
            dataKey="exam" 
            tick={{ fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tick={{ fontSize: 10 }}
            domain={[0, 100]}
            label={{ value: 'Average %', angle: -90, position: 'insideLeft' }}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => [
                  `${value}% (${examPerformance.find(e => e.averageScore === value)?.studentCount || 0} students)`,
                  "Average Score"
                ]}
              />
            }
          />
          <Bar dataKey="averageScore" fill="#3b82f6" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
