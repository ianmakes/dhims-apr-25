
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExamResultsTable } from "./exam-components/ExamResultsTable";

interface StudentExamsTabProps {
  studentName: string;
  studentId: string;
}

// Helper function to determine grade level based on score and max score
function getGrade(score: number, maxScore: number): [string, string, string] {
  // Calculate percentage
  const percentage = (score / maxScore) * 100;
  
  // Return grade based on percentage ranges
  if (percentage >= 80) {
    return ["EE", "Exceeding Expectation", "text-success bg-success/10"];
  } else if (percentage >= 50) {
    return ["ME", "Meeting Expectation", "text-info bg-info/10"];
  } else if (percentage >= 40) {
    return ["AE", "Approaching Expectation", "text-warning bg-warning/10"];
  } else {
    return ["BE", "Below Expectation", "text-destructive bg-destructive/10"];
  }
}

export function StudentExamsTab({ studentName, studentId }: StudentExamsTabProps) {
  const { data: examScores = [], isLoading, error } = useQuery({
    queryKey: ['student-exam-scores', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_exam_scores')
        .select(`
          *,
          exam:exams(
            id,
            name,
            term,
            academic_year,
            exam_date,
            max_score,
            passing_score
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!studentId
  });

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading exam results...</div>;
  }

  if (error) {
    return <div className="text-destructive p-8">Error loading exam results: {(error as Error).message}</div>;
  }

  if (examScores.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Exam Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8">
            <p className="text-muted-foreground">No exam results found for this student.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exam Results</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exam</TableHead>
              <TableHead>Term</TableHead>
              <TableHead>Academic Year</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="text-center">Grade</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {examScores.map((score) => {
              if (!score.exam) return null;
              
              // Get grade information
              const [gradeCode, gradeText, gradeStyle] = score.did_not_sit 
                ? ["DNS", "Did Not Sit", "text-muted-foreground bg-muted"] 
                : getGrade(score.score, score.exam.max_score);
                
              // Calculate score status
              const isPassed = score.did_not_sit 
                ? false 
                : score.score >= score.exam.passing_score;
                
              return (
                <TableRow key={score.id}>
                  <TableCell className="font-medium">{score.exam.name}</TableCell>
                  <TableCell>{score.exam.term}</TableCell>
                  <TableCell>{score.exam.academic_year}</TableCell>
                  <TableCell className="text-right">
                    {score.did_not_sit 
                      ? "N/A" 
                      : `${score.score}/${score.exam.max_score}`}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center">
                      <Badge className={`${gradeStyle} font-bold`} variant="outline">
                        {gradeCode}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{gradeText}</div>
                  </TableCell>
                  <TableCell>
                    {score.did_not_sit ? (
                      <Badge variant="outline" className="bg-muted text-muted-foreground">
                        Did Not Sit
                      </Badge>
                    ) : (
                      <Badge variant={isPassed ? "default" : "destructive"}>
                        {isPassed ? "Passed" : "Failed"}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
