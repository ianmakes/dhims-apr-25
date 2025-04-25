
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const gradeColors = {
  "A": "#4ade80",
  "A-": "#86efac",
  "B+": "#a3e635",
  "B": "#facc15",
  "B-": "#fde047",
  "C+": "#fdba74",
  "C": "#fb923c",
  "C-": "#f97316",
  "D+": "#f87171",
  "D": "#ef4444",
  "D-": "#dc2626",
  "E": "#b91c1c",
};

const calculateGrade = (score: number) => {
  if (score >= 80) return "A";
  if (score >= 75) return "A-";
  if (score >= 70) return "B+";
  if (score >= 65) return "B";
  if (score >= 60) return "B-";
  if (score >= 55) return "C+";
  if (score >= 50) return "C";
  if (score >= 45) return "C-";
  if (score >= 40) return "D+";
  if (score >= 35) return "D";
  if (score >= 30) return "D-";
  return "E";
};

const getGradeCategory = (score: number) => {
  if (score >= 80) return "Exceeding Expectation";
  if (score >= 50) return "Meeting Expectation";
  if (score >= 40) return "Approaching Expectation";
  return "Below Expectation";
};

interface StudentExamScore {
  id: string;
  student_id: string;
  exam_id: string;
  score: number;
  did_not_sit: boolean;
  created_at: string;
  exam: {
    id: string;
    name: string;
    term: string;
    academic_year: string;
    exam_date: string;
    max_score: number;
    passing_score: number;
  }
}

interface StudentExamsTabProps {
  studentName: string;
  studentId: string;
}

export function StudentExamsTab({ studentName, studentId }: StudentExamsTabProps) {
  // Get available academic years
  const { data: academicYears = [], isLoading: loadingYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const { data: examData } = await supabase
        .from('student_exam_scores')
        .select('exam(academic_year)')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      
      if (!examData?.length) return ["2024"];
      
      // Get unique academic years
      const uniqueYears = Array.from(new Set(examData.map(item => 
        item.exam?.academic_year
      ).filter(Boolean))).sort().reverse();
      
      return uniqueYears.length ? uniqueYears : ["2024"];
    }
  });

  const [selectedYear, setSelectedYear] = useState<string>("");
  
  // Set initial selected year once data is loaded
  if (academicYears.length > 0 && !selectedYear) {
    setSelectedYear(academicYears[0]);
  }
  
  // Get student exam scores
  const { data: examScores = [], isLoading: loadingScores } = useQuery({
    queryKey: ['student-exams', studentId, selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_exam_scores')
        .select(`
          *,
          exam (
            id, name, term, academic_year, exam_date, max_score, passing_score
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const typedData = data as StudentExamScore[];
      
      // Filter by selected academic year if one is selected
      return selectedYear 
        ? typedData.filter(score => score.exam?.academic_year === selectedYear)
        : typedData;
    },
    enabled: !!studentId
  });
  
  // Process exam data for charts
  const processedData = examScores.map(score => {
    // Calculate percentage 
    const percentage = score.exam?.max_score 
      ? Math.round((score.score / score.exam.max_score) * 100) 
      : 0;
      
    return {
      examName: score.exam?.name || "Unknown",
      term: score.exam?.term || "Unknown",
      score: score.score,
      maxScore: score.exam?.max_score || 100,
      percentage,
      date: score.exam?.exam_date 
        ? new Date(score.exam.exam_date).toLocaleDateString() 
        : "Unknown date"
    };
  });
  
  // Prepare trend data - sort by exam date chronologically
  const trendData = [...processedData]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((item) => ({
      name: item.examName,
      percentage: item.percentage,
      term: item.term
    }));
    
  // Prepare term-based average data
  const termGroups = processedData.reduce((acc, item) => {
    if (!acc[item.term]) {
      acc[item.term] = {
        total: 0,
        count: 0
      };
    }
    acc[item.term].total += item.percentage;
    acc[item.term].count++;
    return acc;
  }, {} as Record<string, { total: number, count: number }>);
  
  const termData = Object.entries(termGroups).map(([term, { total, count }]) => ({
    term,
    average: Math.round(total / count)
  }));

  return (
    <div className="py-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Exam Performance</CardTitle>
            <CardDescription>
              View {studentName}'s academic performance
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {loadingYears ? (
              <Skeleton className="h-10 w-36" />
            ) : (
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map(year => (
                    <SelectItem key={year} value={year}>{year} Academic Year</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" /> Export Results
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Exam Records Table */}
          <div>
            <h3 className="font-medium mb-4 text-lg">
              Exam Results - {selectedYear || "All Years"}
            </h3>
            
            {loadingScores ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : examScores.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {examScores.map((score, idx) => {
                      // Calculate percentage 
                      const percentage = score.exam?.max_score 
                        ? Math.round((score.score / score.exam.max_score) * 100) 
                        : 0;
                        
                      return (
                        <tr key={score.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {score.exam?.name || "Unknown"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {score.exam?.term || "Unknown"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {score.exam?.exam_date 
                              ? new Date(score.exam.exam_date).toLocaleDateString() 
                              : "Unknown date"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {score.did_not_sit ? (
                              <Badge variant="destructive">Did not sit</Badge>
                            ) : (
                              <span>{score.score} / {score.exam?.max_score || "?"}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {score.did_not_sit ? "-" : (
                              <span>{percentage}%</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {!score.did_not_sit && (
                              <div 
                                className="text-xs font-medium px-2 py-1 rounded-full text-center w-8"
                                style={{ 
                                  color: 'white', 
                                  backgroundColor: gradeColors[calculateGrade(percentage)] 
                                }}
                              >
                                {calculateGrade(percentage)}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-10 border rounded-lg bg-muted/10">
                <p className="text-muted-foreground">No exam records found for {studentName}</p>
              </div>
            )}
          </div>

          {/* Performance Charts */}
          {examScores.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {/* Trend Chart */}
              <Card className="p-4">
                <h3 className="font-medium mb-2">Performance Trends</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={trendData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="percentage" name="Score %" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Term Average Chart */}
              <Card className="p-4">
                <h3 className="font-medium mb-2">Term Performance</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={termData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="term" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="average" name="Term Average %" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
