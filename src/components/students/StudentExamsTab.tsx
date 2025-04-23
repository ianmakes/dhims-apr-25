
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from "recharts";

const examData = [
  { term: "Term 1", Mathematics: 65, English: 70, Science: 55, SocialStudies: 75 },
  { term: "Term 2", Mathematics: 70, English: 75, Science: 60, SocialStudies: 80 },
  { term: "Term 3", Mathematics: 75, English: 80, Science: 70, SocialStudies: 85 },
  { term: "Term 4", Mathematics: 80, English: 85, Science: 75, SocialStudies: 90 },
];

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
  return (
    <div className="py-4">
      <Card>
        <CardHeader>
          <CardTitle>Exam Performance</CardTitle>
          <CardDescription>
            View {studentName}'s academic performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Performance Charts */}
          <div className="space-y-4">
            <h3 className="font-medium">Performance Trends</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={examData}
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

            <h3 className="font-medium mt-8">Latest Results</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[examData[examData.length - 1]]}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="term" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Mathematics" fill="#8884d8" />
                  <Bar dataKey="English" fill="#82ca9d" />
                  <Bar dataKey="Science" fill="#ffc658" />
                  <Bar dataKey="SocialStudies" fill="#ff7300" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Exam Records */}
          <div className="mt-8">
            <h3 className="font-medium mb-4">Exam Records</h3>
            {examData.map((exam, index) => (
              <div key={index} className="mb-6 border rounded-md p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-lg">{exam.term}</h4>
                  <Badge variant="outline">
                    Average: {((exam.Mathematics + exam.English + exam.Science + exam.SocialStudies) / 4).toFixed(1)}%
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(exam).filter(([key]) => key !== "term").map(([subject, score]) => (
                    <div key={subject} className="border rounded p-3">
                      <div className="text-sm text-muted-foreground">{subject}</div>
                      <div className="text-xl font-bold">{score}%</div>
                      <div
                        className="text-sm font-medium"
                        style={{ color: gradeColors[calculateGrade(score as number)] }}
                      >
                        {calculateGrade(score as number)} ({getGradeCategory(score as number)})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
