
import { Badge } from "@/components/ui/badge";
import { StudentExamScore } from "@/types/database";
import { GradeIndicator } from "./GradeIndicator";

interface ExamResultsTableProps {
  examScores: StudentExamScore[];
  calculateGrade: (score: number) => string;
  getGradeCategory: (score: number) => string;
  gradeColors: Record<string, string>;
}

export const ExamResultsTable: React.FC<ExamResultsTableProps> = ({
  examScores,
  calculateGrade,
  getGradeCategory,
  gradeColors
}) => {
  return (
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
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {examScores.map((score, idx) => {
            // Only render if we have exam data
            if (!score.exam) {
              return null;
            }
            
            // Calculate percentage 
            const percentage = score.exam?.max_score 
              ? Math.round((score.score / score.exam.max_score) * 100) 
              : 0;
            
            // Determine performance category
            const performanceCategory = getGradeCategory(percentage);
            
            // Determine badge variant based on performance category
            const badgeVariant = 
              performanceCategory === "Exceeding Expectation" ? "success" :
              performanceCategory === "Meeting Expectation" ? "default" :
              performanceCategory === "Approaching Expectation" ? "warning" : "destructive";
              
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
                    <GradeIndicator 
                      grade={calculateGrade(percentage)}
                      color={gradeColors[calculateGrade(percentage)]}
                    />
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {!score.did_not_sit && (
                    <Badge variant={badgeVariant as any}>
                      {performanceCategory}
                    </Badge>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
