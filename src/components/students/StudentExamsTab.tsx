import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, FileImage, FileText, FileIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentExamScore } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { StudentExamsPDF } from "./StudentExamsPDF";
import html2canvas from "html2canvas";

const gradeColors = {
  "EE": "#4ade80",
  "ME": "#3b82f6",
  "AE": "#f97316",
  "BE": "#b91c1c"
};

// Updated to use the new grading system
const calculateGrade = (score: number) => {
  if (score >= 80) return "EE";
  if (score >= 50) return "ME";
  if (score >= 40) return "AE";
  return "BE";
};

const getGradeDescription = (grade: string) => {
  switch (grade) {
    case "EE":
      return "Exceeding Expectation";
    case "ME":
      return "Meeting Expectation";
    case "AE":
      return "Approaching Expectation";
    case "BE":
      return "Below Expectation";
    default:
      return "Unknown";
  }
};

const getGradeCategory = (score: number) => {
  if (score >= 80) return "Exceeding Expectation";
  if (score >= 50) return "Meeting Expectation";
  if (score >= 40) return "Approaching Expectation";
  return "Below Expectation";
};

interface StudentExamsTabProps {
  studentName: string;
  studentId: string;
}

export function StudentExamsTab({
  studentName,
  studentId
}: StudentExamsTabProps) {
  const { toast } = useToast();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);

  // Fetch current academic year from settings
  const { data: currentAcademicYear } = useQuery({
    queryKey: ['current-academic-year'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academic_years')
        .select('year_name')
        .eq('is_current', true)
        .single();
      
      if (error) {
        console.error("Error fetching current academic year:", error);
        return null;
      }
      
      return data?.year_name || null;
    }
  });

  // Get available academic years
  const {
    data: academicYears = [],
    isLoading: loadingYears
  } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      // First, get the exams the student has taken
      const {
        data: examScores,
        error
      } = await supabase.from('student_exam_scores').select('exam_id').eq('student_id', studentId);
      if (error) throw error;
      if (!examScores || examScores.length === 0) {
        return ["2024"];
      }

      // Then get details about those exams
      const examIds = examScores.map(score => score.exam_id).filter(Boolean);
      if (examIds.length === 0) {
        return ["2024"];
      }
      const {
        data: exams,
        error: examsError
      } = await supabase.from('exams').select('academic_year').in('id', examIds);
      if (examsError) throw examsError;
      const uniqueYears = Array.from(new Set(exams?.map(exam => exam.academic_year).filter(Boolean) || [])).sort().reverse();
      return uniqueYears.length ? uniqueYears : ["2024"];
    }
  });
  
  const [selectedYear, setSelectedYear] = useState<string>("");

  // Set initial selected year to current academic year once data is loaded
  useEffect(() => {
    if (currentAcademicYear && academicYears.includes(currentAcademicYear)) {
      setSelectedYear(currentAcademicYear);
    } else if (academicYears.length > 0 && !selectedYear) {
      setSelectedYear(academicYears[0]);
    }
  }, [academicYears, currentAcademicYear]);

  // Get student exam scores
  const {
    data: examScores = [],
    isLoading: loadingScores
  } = useQuery<StudentExamScore[]>({
    queryKey: ['student-exams', studentId, selectedYear],
    queryFn: async () => {
      if (!studentId) throw new Error('Student ID is required');

      // First, get exam scores for this student
      const {
        data: scores,
        error: scoresError
      } = await supabase.from('student_exam_scores').select('*').eq('student_id', studentId);
      if (scoresError) throw scoresError;
      if (!scores || scores.length === 0) {
        return [];
      }

      // Get exam details for each score
      const examIds = scores.map(score => score.exam_id).filter(Boolean);
      if (examIds.length === 0) {
        return scores as StudentExamScore[];
      }
      const {
        data: exams,
        error: examsError
      } = await supabase.from('exams').select('*').in('id', examIds);
      if (examsError) throw examsError;

      // Join exam details with scores
      const enrichedScores = scores.map(score => {
        const examDetails = exams?.find(exam => exam.id === score.exam_id);
        return {
          ...score,
          exam: examDetails
        } as StudentExamScore;
      });

      // Filter by selected academic year if one is selected
      return selectedYear ? enrichedScores.filter(score => score.exam?.academic_year === selectedYear) : enrichedScores;
    },
    enabled: !!studentId
  });

  // Process exam data for charts
  const processedData = examScores.filter(score => score.exam) // Only include scores that have exam data
  .map(score => {
    // Calculate percentage 
    const percentage = score.exam?.max_score ? Math.round(score.score / score.exam.max_score * 100) : 0;
    return {
      examName: score.exam?.name || "Unknown",
      term: score.exam?.term || "Unknown",
      score: score.score,
      maxScore: score.exam?.max_score || 100,
      percentage,
      grade: calculateGrade(percentage),
      date: score.exam?.exam_date ? new Date(score.exam.exam_date).toLocaleDateString() : "Unknown date"
    };
  });

  // Prepare trend data - sort by exam date chronologically
  const trendData = [...processedData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(item => ({
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
  }, {} as Record<string, {
    total: number;
    count: number;
  }>);
  const termData = Object.entries(termGroups).map(([term, {
    total,
    count
  }]) => ({
    term,
    average: Math.round(total / count)
  }));

  // Export to CSV
  const exportToCSV = () => {
    if (!processedData.length) {
      toast({
        title: "No data to export",
        description: "There are no exam records to export.",
        variant: "destructive"
      });
      return;
    }

    // CSV Headers
    const headers = ["Exam Name", "Term", "Date", "Score", "Out of", "Percentage", "Grade"];

    // CSV Rows
    const csvRows = [headers.join(","), ...processedData.map(item => [`"${item.examName}"`,
    // Quote strings to handle commas in names
    `"${item.term}"`, `"${item.date}"`, item.score, item.maxScore, `${item.percentage}%`, item.grade].join(","))];

    // Create CSV content
    const csvContent = csvRows.join("\n");

    // Create and download the file
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${studentName.replace(/\s+/g, "_")}_exam_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Export Successful",
      description: "Exam results have been exported to CSV."
    });
  };

  // Export to PNG Image
  const exportToImage = async () => {
    try {
      const element = document.getElementById('student-exams-data');
      if (!element) {
        throw new Error("Element not found");
      }
      toast({
        title: "Generating Image",
        description: "Please wait while we generate the image..."
      });
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${studentName.replace(/\s+/g, "_")}_exam_results.png`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "Export Successful",
        description: "Exam results have been exported as an image."
      });
    } catch (error) {
      console.error("Error exporting to image:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export exam results as an image.",
        variant: "destructive"
      });
    }
  };

  const togglePDFPreview = () => {
    setShowPDFPreview(!showPDFPreview);
  };

  return <div className="py-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-left">Exam Performance</CardTitle>
            <CardDescription>
              View {studentName}'s academic performance
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {loadingYears ? <Skeleton className="h-10 w-36" /> : <Select 
                value={selectedYear} 
                onValueChange={setSelectedYear}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map(year => (
                    <SelectItem key={year} value={year || "all"}>
                      {year || "All"} 
                      {year === currentAcademicYear && " (Current)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" /> Export Results
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={togglePDFPreview}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Generate PDF Report</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToImage}>
                  <FileImage className="mr-2 h-4 w-4" />
                  <span>Export as Image</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToCSV}>
                  <FileIcon className="mr-2 h-4 w-4" />
                  <span>Export as CSV</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-6" id="student-exams-data">
          {/* Exam Records Table */}
          <div>
            <h3 className="font-medium mb-4 text-lg">
              Exam Results - {selectedYear || "All Years"}
              {selectedYear === currentAcademicYear && " (Current Year)"}
            </h3>
            
            {loadingScores ? <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div> : examScores.length > 0 ? <div className="border rounded-lg overflow-hidden">
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
                      // Only render if we have exam data
                      if (!score.exam) {
                        return null;
                      }

                      // Calculate percentage 
                      const percentage = score.exam?.max_score ? Math.round(score.score / score.exam.max_score * 100) : 0;
                      const grade = calculateGrade(percentage);
                      return <tr key={score.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {score.exam?.name || "Unknown"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {score.exam?.term || "Unknown"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {score.exam?.exam_date ? new Date(score.exam.exam_date).toLocaleDateString() : "Unknown date"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {score.did_not_sit ? <Badge variant="destructive">Did not sit</Badge> : <span>{score.score} / {score.exam?.max_score || "?"}</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {score.did_not_sit ? "-" : <span>{percentage}%</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {!score.did_not_sit && <div className="text-xs font-medium px-2 py-1 rounded-full text-center" style={{
                                color: 'white',
                                backgroundColor: gradeColors[grade],
                                width: 'fit-content',
                                minWidth: '2.5rem'
                              }}>
                                {grade} ({getGradeDescription(grade)})
                              </div>}
                          </td>
                        </tr>;
                    })}
                  </tbody>
                </table>
              </div> : <div className="text-center p-10 border rounded-lg bg-muted/10">
                <p className="text-muted-foreground">No exam records found for {selectedYear ? `${studentName} in ${selectedYear}` : studentName}</p>
              </div>}
          </div>

          {/* Performance Charts */}
          {examScores.length > 0 && <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {/* Trend Chart */}
              <Card className="p-4">
                <h3 className="font-medium mb-2">Performance Trends</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5
                }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="percentage" name="Score %" stroke="#8884d8" activeDot={{
                    r: 8
                  }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Term Average Chart */}
              <Card className="p-4">
                <h3 className="font-medium mb-2">Term Performance</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={termData} margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5
                }}>
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
            </div>}
        </CardContent>
      </Card>

      {/* PDF Preview Modal */}
      {showPDFPreview && <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
              <h2 className="text-xl font-bold">Exam Results PDF Preview</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={togglePDFPreview}>
                  Close
                </Button>
                <StudentExamsPDF studentName={studentName} examData={processedData} termData={termData} trendData={trendData} />
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
                      {processedData.slice(0, 3).map((item, idx) => <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border p-2">{item.examName}</td>
                          <td className="border p-2">{item.term}</td>
                          <td className="border p-2">{item.percentage}%</td>
                          <td className="border p-2">
                            <span className="px-2 py-1 rounded-full text-xs font-medium text-white" style={{
                        backgroundColor: gradeColors[item.grade]
                      }}>
                              {item.grade}
                            </span>
                          </td>
                        </tr>)}
                      {processedData.length > 3 && <tr>
                          <td colSpan={4} className="border p-2 text-center text-gray-500 italic">
                            ... and {processedData.length - 3} more exam(s)
                          </td>
                        </tr>}
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
        </div>}
    </div>;
}
