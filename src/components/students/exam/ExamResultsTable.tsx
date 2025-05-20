
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StudentExamScore } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import { calculateGrade, getGradeDescription, gradeColors } from "./ExamGradeUtils";

interface ExamResultsTableProps {
  examScores: StudentExamScore[];
  isLoading: boolean;
  selectedYear: string;
  studentName: string;
}

export function ExamResultsTable({
  examScores,
  isLoading,
  selectedYear,
  studentName
}: ExamResultsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (examScores.length === 0) {
    return (
      <div className="text-center p-10 border rounded-lg bg-muted/10">
        <p className="text-muted-foreground">
          No exam records found for {selectedYear ? `${studentName} in ${selectedYear}` : studentName}
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Exam Name</TableHead>
            <TableHead>Term</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Percentage</TableHead>
            <TableHead>Grade</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {examScores.map((score, idx) => {
            // Only render if we have exam data
            if (!score.exam) {
              return null;
            }

            // Calculate percentage 
            const percentage = score.exam?.max_score ? Math.round(score.score / score.exam.max_score * 100) : 0;
            const grade = calculateGrade(percentage);

            return (
              <TableRow key={score.id}>
                <TableCell className="font-medium">
                  {score.exam?.name || "Unknown"}
                </TableCell>
                <TableCell>
                  {score.exam?.term || "Unknown"}
                </TableCell>
                <TableCell>
                  {score.exam?.exam_date ? new Date(score.exam.exam_date).toLocaleDateString() : "Unknown date"}
                </TableCell>
                <TableCell>
                  {score.did_not_sit ? (
                    <Badge variant="destructive">Did not sit</Badge>
                  ) : (
                    <span>{score.score} / {score.exam?.max_score || "?"}</span>
                  )}
                </TableCell>
                <TableCell>
                  {score.did_not_sit ? "-" : <span>{percentage}%</span>}
                </TableCell>
                <TableCell>
                  {!score.did_not_sit && (
                    <div
                      className="text-xs font-medium px-2 py-1 rounded-full text-center text-white"
                      style={{
                        backgroundColor: gradeColors[grade],
                        width: 'fit-content',
                        minWidth: '2.5rem'
                      }}
                    >
                      {grade} ({getGradeDescription(grade)})
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
