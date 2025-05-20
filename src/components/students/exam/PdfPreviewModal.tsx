
import { Button } from "@/components/ui/button";
import { gradeColors } from "./ExamGradeUtils";
import { StudentExamsPDF } from "@/components/students/StudentExamsPDF";

interface ProcessedExamData {
  examName: string;
  term: string;
  score: number;
  maxScore: number;
  percentage: number;
  grade: string;
  date: string;
}

interface PdfPreviewModalProps {
  showPDFPreview: boolean;
  togglePDFPreview: () => void;
  studentName: string;
  processedData: ProcessedExamData[];
  termData: { term: string; average: number }[];
  trendData: { name: string; percentage: number; term?: string }[];
}

export function PdfPreviewModal({
  showPDFPreview,
  togglePDFPreview,
  studentName,
  processedData,
  termData,
  trendData,
  selectedYear
}: PdfPreviewModalProps & { selectedYear: string }) {
  if (!showPDFPreview) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="p-4 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
          <h2 className="text-xl font-bold">Exam Results PDF Preview</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={togglePDFPreview}>
              Close
            </Button>
            <StudentExamsPDF 
              studentName={studentName} 
              examData={processedData} 
              termData={termData} 
              trendData={trendData} 
            />
          </div>
        </div>
        <div className="p-6">
          {/* PDF Preview Content */}
          <div className="border p-8 bg-white shadow-sm">
            <div className="flex justify-between items-start mb-6 pb-6 border-b">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{studentName}</h1>
                <p className="text-gray-600">Academic Year: {selectedYear || "All Years"}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">Exam Results Report</p>
                <p className="text-gray-500 text-sm">Generated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
            
            {/* Summary Statistics */}
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-3">Performance Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm text-gray-500">Average Score</div>
                  <div className="text-xl font-bold">
                    {processedData.length > 0 ? Math.round(processedData.reduce((sum, item) => sum + item.percentage, 0) / processedData.length) : 0}%
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm text-gray-500">Highest Score</div>
                  <div className="text-xl font-bold">
                    {processedData.length > 0 ? Math.max(...processedData.map(item => item.percentage)) : 0}%
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm text-gray-500">Exams Taken</div>
                  <div className="text-xl font-bold">{processedData.length}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm text-gray-500">Performance Trend</div>
                  <div className="text-xl font-bold text-green-600">
                    {processedData.length > 1 ? processedData[processedData.length - 1].percentage > processedData[0].percentage ? "↑ Improving" : "↓ Declining" : "—"}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sample of the results table */}
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-3">Exam Results</h2>
              <table className="min-w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Exam</th>
                    <th className="border p-2 text-left">Term</th>
                    <th className="border p-2 text-left">Score</th>
                    <th className="border p-2 text-left">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {processedData.slice(0, 3).map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border p-2">{item.examName}</td>
                      <td className="border p-2">{item.term}</td>
                      <td className="border p-2">{item.percentage}%</td>
                      <td className="border p-2">
                        <span 
                          className="px-2 py-1 rounded-full text-xs font-medium text-white" 
                          style={{backgroundColor: gradeColors[item.grade]}}
                        >
                          {item.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {processedData.length > 3 && (
                    <tr>
                      <td colSpan={4} className="border p-2 text-center text-gray-500 italic">
                        ... and {processedData.length - 3} more exam(s)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Sample charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-bold mb-3">Performance Trend</h2>
                <div className="bg-gray-50 p-3 rounded-md h-40 flex items-center justify-center">
                  [Line chart showing performance over time]
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3">Term Averages</h2>
                <div className="bg-gray-50 p-3 rounded-md h-40 flex items-center justify-center">
                  [Bar chart showing term averages]
                </div>
              </div>
            </div>
            
            {/* Recommendations section */}
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <h2 className="text-lg font-bold mb-2">Recommendations</h2>
              <p className="text-gray-700">
                This report provides a snapshot of the student's academic performance across exams.
                For a full academic assessment, please refer to the complete term reports and consult
                with the academic advisors.
              </p>
            </div>
            
            {/* Footer */}
            <div className="mt-8 pt-4 border-t text-center text-gray-500 text-sm">
              <p>David's Hope International - Student Exam Report</p>
              <p>This is a preview of the PDF report that will be generated.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
