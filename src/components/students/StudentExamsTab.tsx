
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from "recharts";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Filter } from "lucide-react";

// Mock data for demonstration
const academicYears = ["2024", "2023", "2022"];

const examData = {
  "2024": [
    { term: "Term 1", Mathematics: 65, English: 70, Science: 55, SocialStudies: 75 },
    { term: "Term 2", Mathematics: 70, English: 75, Science: 60, SocialStudies: 80 },
    { term: "Term 3", Mathematics: 75, English: 80, Science: 70, SocialStudies: 85 },
  ],
  "2023": [
    { term: "Term 1", Mathematics: 60, English: 65, Science: 50, SocialStudies: 70 },
    { term: "Term 2", Mathematics: 65, English: 70, Science: 55, SocialStudies: 75 },
    { term: "Term 3", Mathematics: 70, English: 75, Science: 60, SocialStudies: 80 },
    { term: "Term 4", Mathematics: 75, English: 80, Science: 65, SocialStudies: 85 },
  ],
  "2022": [
    { term: "Term 1", Mathematics: 55, English: 60, Science: 45, SocialStudies: 65 },
    { term: "Term 2", Mathematics: 60, English: 65, Science: 50, SocialStudies: 70 },
    { term: "Term 3", Mathematics: 65, English: 70, Science: 55, SocialStudies: 75 },
  ]
};

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

interface StudentExamsTabProps {
  studentName: string;
}

export function StudentExamsTab({ studentName }: StudentExamsTabProps) {
  const [selectedYear, setSelectedYear] = useState<string>(academicYears[0]);
  const currentExamData = examData[selectedYear as keyof typeof examData] || [];

  // Calculate average for each subject across all terms in the selected year
  const subjectAverages = currentExamData.reduce((acc, term) => {
    Object.entries(term).forEach(([key, value]) => {
      if (key !== 'term' && typeof value === 'number') {
        if (!acc[key]) acc[key] = { total: 0, count: 0 };
        acc[key].total += value;
        acc[key].count++;
      }
    });
    return acc;
  }, {} as Record<string, { total: number, count: number }>);

  const averageData = Object.entries(subjectAverages).map(([subject, { total, count }]) => ({
    subject,
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
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" /> Export Results
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Exam Records Table */}
          <div>
            <h3 className="font-medium mb-4 text-lg">Exam Results - {selectedYear}</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mathematics</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">English</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Science</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Social Studies</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentExamData.map((exam, idx) => {
                    const subjects = ['Mathematics', 'English', 'Science', 'SocialStudies'];
                    const average = subjects.reduce((sum, subject) => sum + (exam[subject as keyof typeof exam] as number), 0) / subjects.length;
                    
                    return (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{exam.term}</td>
                        {subjects.map(subject => (
                          <td key={subject} className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="text-gray-900">{exam[subject as keyof typeof exam]}%</div>
                            <div 
                              className="text-xs font-medium" 
                              style={{ color: gradeColors[calculateGrade(exam[subject as keyof typeof exam] as number)] }}
                            >
                              {calculateGrade(exam[subject as keyof typeof exam] as number)}
                            </div>
                          </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{average.toFixed(1)}%</div>
                          <div 
                            className="text-xs font-medium" 
                            style={{ color: gradeColors[calculateGrade(average)] }}
                          >
                            {calculateGrade(average)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {/* Trend Chart */}
            <Card className="p-4">
              <h3 className="font-medium mb-2">Performance Trends</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={currentExamData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="term" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="Mathematics" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="English" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="Science" stroke="#ffc658" />
                    <Line type="monotone" dataKey="SocialStudies" stroke="#ff7300" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Subject Average Chart */}
            <Card className="p-4">
              <h3 className="font-medium mb-2">Subject Performance</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={averageData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="average" fill="#8884d8" name="Average Score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
