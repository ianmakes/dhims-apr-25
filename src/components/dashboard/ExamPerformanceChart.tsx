
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  averageScore: {
    label: "Average Score",
    color: "#2271b1",
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
            academic_year,
            exam_date
          )
        `)
        .order('exam(exam_date)', { ascending: false });
        
      if (error) {
        console.error("Error fetching exam scores:", error);
        throw error;
      }

      if (!examScores || examScores.length === 0) {
        return [];
      }

      // Group by exam and calculate average scores
      const examGroups: Record<string, { scores: number[], maxScore: number, academicYear: string, examDate: string }> = {};
      
      examScores.forEach(score => {
        if (score.exam?.name && score.exam.max_score) {
          const examKey = score.exam.name;
          if (!examGroups[examKey]) {
            examGroups[examKey] = {
              scores: [],
              maxScore: score.exam.max_score,
              academicYear: score.exam.academic_year,
              examDate: score.exam.exam_date || ''
            };
          }
          examGroups[examKey].scores.push(score.score);
        }
      });

      // Calculate averages and convert to percentages
      const result = Object.entries(examGroups)
        .map(([examName, data]) => {
          const avgScore = data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length;
          const percentage = (avgScore / data.maxScore) * 100;
          
          return {
            exam: examName.length > 15 ? examName.substring(0, 15) + "..." : examName,
            fullName: examName,
            averageScore: Math.round(percentage),
            studentCount: data.scores.length,
            academicYear: data.academicYear
          };
        })
        .sort((a, b) => b.averageScore - a.averageScore)
        .slice(0, 6); // Show top 6 performing exams

      console.log("Exam performance data:", result);
      return result;
    },
  });

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <Skeleton className="h-full w-full rounded-md" />
      </div>
    );
  }

  if (!examPerformance || examPerformance.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-wp-text-secondary text-sm">No exam performance data available</p>
          <p className="text-xs text-wp-text-secondary mt-1">Add exam scores to view performance analytics</p>
        </div>
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={examPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f1" />
          <XAxis 
            dataKey="exam" 
            tick={{ fontSize: 11, fill: '#646970' }}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: '#646970' }}
            domain={[0, 100]}
            label={{ 
              value: 'Average Score (%)', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle', fill: '#646970', fontSize: '12px' }
            }}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name, props) => [
                  `${value}% (${props.payload?.studentCount || 0} students)`,
                  props.payload?.fullName || "Exam"
                ]}
                labelFormatter={() => ""}
              />
            }
          />
          <Bar 
            dataKey="averageScore" 
            fill="#2271b1" 
            radius={[4, 4, 0, 0]}
            stroke="#1d2327"
            strokeWidth={0.5}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
