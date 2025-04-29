
import React from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";
import { StudentExamScore } from "@/types/database";

interface ExportPreviewProps {
  pdfExportRef: React.RefObject<HTMLDivElement>;
  zoomLevel: number;
  studentName: string;
  selectedYear: string;
  examScores: StudentExamScore[];
  trendData: Array<{name: string; percentage: number; term: string}>;
  termData: Array<{term: string; average: number}>;
  overallStats: {
    total: number;
    averagePercentage: number;
    highestScore: number;
    lowestScore: number;
  };
  categoryDistributionData: Array<{category: string; count: number; percentage: number}>;
  calculateGrade: (score: number) => string;
  getGradeCategory: (score: number) => string;
}

export const ExportPreview: React.FC<ExportPreviewProps> = ({
  pdfExportRef,
  zoomLevel,
  studentName,
  selectedYear,
  examScores,
  trendData,
  termData,
  overallStats,
  categoryDistributionData,
  calculateGrade,
  getGradeCategory
}) => {
  return (
    <div 
      style={{ 
        transform: `scale(${zoomLevel})`, 
        transformOrigin: 'top center',
        transition: 'transform 0.2s'
      }}
      className="bg-white shadow-lg"
    >
      <div ref={pdfExportRef} className="p-8 w-[210mm]">
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center gap-4">
            <img 
              src="/lovable-uploads/4fe39649-bf54-408f-9b41-7aa63810a53c.png" 
              alt="School Logo" 
              className="h-16"
            />
            <div>
              <h1 className="text-2xl font-bold">David's Hope</h1>
              <p className="text-sm text-gray-500">Student Exam Report</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold">{new Date().toLocaleDateString()}</p>
            <p className="text-sm text-gray-500">Academic Year: {selectedYear}</p>
          </div>
        </div>
        
        <div className="my-6">
          <h2 className="text-xl font-bold">{studentName}</h2>
          <div className="flex gap-6 mt-2">
            <p><span className="font-medium">Admission #:</span> {examScores[0]?.student_id}</p>
            <p><span className="font-medium">Year:</span> {selectedYear}</p>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="font-bold border-b mb-2 pb-1">Performance Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded p-3">
              <p className="text-sm text-gray-500">Average Score</p>
              <p className="text-2xl font-bold">{overallStats.averagePercentage}%</p>
              <p className="text-sm">
                Grade: <span className="font-medium">{calculateGrade(overallStats.averagePercentage)}</span>
              </p>
              <p className="text-sm">
                Performance: <span className="font-medium">{getGradeCategory(overallStats.averagePercentage)}</span>
              </p>
            </div>
            <div className="border rounded p-3">
              <p className="text-sm text-gray-500">Score Range</p>
              <p className="text-lg font-bold">Highest: {overallStats.highestScore}%</p>
              <p className="text-lg font-bold">Lowest: {overallStats.lowestScore}%</p>
              <p className="text-sm">Total Exams: {overallStats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="font-bold border-b mb-4 pb-1">Performance Trends</h3>
          <div className="h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="percentage" name="Score %" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Term Performance</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={termData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="term" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="average" name="Term Average %" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Performance Distribution</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryDistributionData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" name="Number of Exams" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="font-bold border-b mb-4 pb-1">Detailed Exam Results</h3>
          <table className="min-w-full divide-y divide-gray-200 border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">%</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {examScores.filter(score => score.exam).map((score, idx) => {
                const percentage = score.exam?.max_score 
                  ? Math.round((score.score / score.exam.max_score) * 100) 
                  : 0;
                  
                return (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">{score.exam?.name || "Unknown"}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">{score.exam?.term || "Unknown"}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      {score.did_not_sit ? "DNP" : `${score.score}/${score.exam?.max_score}`}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      {score.did_not_sit ? "-" : `${percentage}%`}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      {score.did_not_sit ? "-" : calculateGrade(percentage)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      {score.did_not_sit ? "-" : getGradeCategory(percentage)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-8 border-t pt-4">
          <div className="flex justify-between text-sm">
            <div>
              <p className="mb-1"><span className="font-medium">Grading System:</span></p>
              <p>Exceeding Expectation: 80-100%</p>
              <p>Meeting Expectation: 50-79%</p>
              <p>Approaching Expectation: 40-49%</p>
              <p>Below Expectation: 0-39%</p>
            </div>
            <div className="text-right">
              <p><span className="font-medium">Report Generated:</span> {new Date().toLocaleString()}</p>
              <p><span className="font-medium">David's Hope</span></p>
              <p>www.davidshope.org</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
