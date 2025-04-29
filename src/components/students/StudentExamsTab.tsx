
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, FileImage, FilePdf, FileText, ChevronRight, ChevronLeft, ZoomIn, ZoomOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentExamScore } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import * as XLSX from 'xlsx';

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
  studentId: string;
}

export function StudentExamsTab({ studentName, studentId }: StudentExamsTabProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const pdfExportRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Get available academic years
  const { data: academicYears = [], isLoading: loadingYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      // First, get the exams the student has taken
      const { data: examScores, error } = await supabase
        .from('student_exam_scores')
        .select('exam_id')
        .eq('student_id', studentId);
      
      if (error) throw error;
      
      if (!examScores || examScores.length === 0) {
        return ["2024"];
      }
      
      // Then get details about those exams
      const examIds = examScores.map(score => score.exam_id).filter(Boolean);
      
      if (examIds.length === 0) {
        return ["2024"];
      }
      
      const { data: exams, error: examsError } = await supabase
        .from('exams')
        .select('academic_year')
        .in('id', examIds);
      
      if (examsError) throw examsError;
      
      const uniqueYears = Array.from(
        new Set(
          exams
            ?.map(exam => exam.academic_year)
            .filter(Boolean) || []
        )
      ).sort().reverse();
      
      return uniqueYears.length ? uniqueYears : ["2024"];
    }
  });

  const [selectedYear, setSelectedYear] = useState<string>("");
  
  // Set initial selected year once data is loaded
  useEffect(() => {
    if (academicYears.length > 0 && !selectedYear) {
      setSelectedYear(academicYears[0]);
    }
  }, [academicYears]);
  
  // Get student exam scores
  const { data: examScores = [], isLoading: loadingScores } = useQuery<StudentExamScore[]>({
    queryKey: ['student-exams', studentId, selectedYear],
    queryFn: async () => {
      if (!studentId) throw new Error('Student ID is required');
      
      // First, get exam scores for this student
      const { data: scores, error: scoresError } = await supabase
        .from('student_exam_scores')
        .select('*')
        .eq('student_id', studentId);
        
      if (scoresError) throw scoresError;
      
      if (!scores || scores.length === 0) {
        return [];
      }

      // Get exam details for each score
      const examIds = scores.map(score => score.exam_id).filter(Boolean);
      
      if (examIds.length === 0) {
        return scores as StudentExamScore[];
      }
      
      const { data: exams, error: examsError } = await supabase
        .from('exams')
        .select('*')
        .in('id', examIds);
      
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
      return selectedYear 
        ? enrichedScores.filter(score => score.exam?.academic_year === selectedYear)
        : enrichedScores;
    },
    enabled: !!studentId
  });
  
  // Process exam data for charts
  const processedData = examScores
    .filter(score => score.exam) // Only include scores that have exam data
    .map(score => {
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

  // Calculate overall statistics
  const overallStats = {
    total: processedData.length,
    averagePercentage: processedData.length > 0 
      ? Math.round(processedData.reduce((sum, item) => sum + item.percentage, 0) / processedData.length) 
      : 0,
    highestScore: processedData.length > 0 
      ? Math.max(...processedData.map(item => item.percentage))
      : 0,
    lowestScore: processedData.length > 0 
      ? Math.min(...processedData.map(item => item.percentage))
      : 0,
  };

  const categoryDistribution = processedData.reduce((acc, item) => {
    const category = getGradeCategory(item.percentage);
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryDistributionData = Object.entries(categoryDistribution).map(([category, count]) => ({
    category,
    count,
    percentage: Math.round((count / processedData.length) * 100)
  }));

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const container = pdfExportRef.current;
      if (!container) {
        throw new Error("Export container not found");
      }

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pdfWidth;
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      pdf.save(`${studentName}_Exam_Report.pdf`);
      
      toast({
        title: "Export complete",
        description: "Exam report has been exported as PDF",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Export failed",
        description: "Failed to export exam report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportImage = async () => {
    setIsExporting(true);
    try {
      const container = pdfExportRef.current;
      if (!container) {
        throw new Error("Export container not found");
      }

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      // Create a download link
      const link = document.createElement('a');
      link.download = `${studentName}_Exam_Report.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast({
        title: "Export complete",
        description: "Exam report has been exported as image",
      });
    } catch (error) {
      console.error("Error exporting image:", error);
      toast({
        title: "Export failed",
        description: "Failed to export exam report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      // Prepare data for export
      const data = examScores
        .filter(score => score.exam) // Only include scores that have exam data
        .map(score => {
          const percentage = score.exam?.max_score 
            ? Math.round((score.score / score.exam.max_score) * 100) 
            : 0;
          
          return {
            'Exam Name': score.exam?.name || "Unknown",
            'Term': score.exam?.term || "Unknown",
            'Date': score.exam?.exam_date 
              ? new Date(score.exam.exam_date).toLocaleDateString() 
              : "Unknown",
            'Score': score.did_not_sit ? "Did not sit" : score.score,
            'Max Score': score.exam?.max_score || "N/A",
            'Percentage': score.did_not_sit ? "N/A" : `${percentage}%`,
            'Grade': score.did_not_sit ? "N/A" : calculateGrade(percentage),
            'Performance': score.did_not_sit ? "N/A" : getGradeCategory(percentage)
          };
        });
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Exam Results");
      
      // Save file
      XLSX.writeFile(wb, `${studentName}_Exam_Results.xlsx`);
      
      toast({
        title: "Export complete",
        description: "Exam results have been exported as Excel",
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast({
        title: "Export failed",
        description: "Failed to export exam results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" /> Export Results
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsPdfPreviewOpen(true)}>
                  <FilePdf className="mr-2 h-4 w-4" /> Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportImage}>
                  <FileImage className="mr-2 h-4 w-4" /> Export as Image
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV}>
                  <FileText className="mr-2 h-4 w-4" /> Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                      
                      // Determine badge color based on performance category
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

      {/* PDF Preview Dialog */}
      <Dialog open={isPdfPreviewOpen} onOpenChange={setIsPdfPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Exam Report Preview</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleZoomOut} disabled={zoomLevel <= 0.5}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="mx-2">{Math.round(zoomLevel * 100)}%</span>
                <Button size="sm" variant="outline" onClick={handleZoomIn} disabled={zoomLevel >= 2}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex justify-center p-4 bg-gray-100 rounded-md">
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPdfPreviewOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleExportPDF} 
              disabled={isExporting}
              className="gap-2"
            >
              {isExporting ? "Generating..." : "Generate PDF"}
              <Download className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
