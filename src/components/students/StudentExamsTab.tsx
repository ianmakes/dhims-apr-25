
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StudentExamScore } from "@/types/database";
import { calculateGrade } from "./exam/ExamGradeUtils";
import { ExamResultsTable } from "./exam/ExamResultsTable";
import { ExamCharts } from "./exam/ExamCharts";
import { PdfPreviewModal } from "./exam/PdfPreviewModal";
import { ExamExportActions } from "./exam/ExamExportActions";

interface StudentExamsTabProps {
  studentName: string;
  studentId: string;
}

export function StudentExamsTab({
  studentName,
  studentId
}: StudentExamsTabProps) {
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
        new Set(exams?.map(exam => exam.academic_year).filter(Boolean) || [])
      ).sort().reverse();
      
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
  }, [academicYears, currentAcademicYear, selectedYear]);

  // Get student exam scores
  const {
    data: examScores = [],
    isLoading: loadingScores
  } = useQuery<StudentExamScore[]>({
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
        ? Math.round(score.score / score.exam.max_score * 100) 
        : 0;
        
      return {
        examName: score.exam?.name || "Unknown",
        term: score.exam?.term || "Unknown",
        score: score.score,
        maxScore: score.exam?.max_score || 100,
        percentage,
        grade: calculateGrade(percentage),
        date: score.exam?.exam_date 
          ? new Date(score.exam.exam_date).toLocaleDateString() 
          : "Unknown date"
      };
    });

  // Prepare trend data - sort by exam date chronologically
  const trendData = [...processedData]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(item => ({
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
  }, {} as Record<string, { total: number; count: number; }>);
  
  const termData = Object.entries(termGroups).map(([term, { total, count }]) => ({
    term,
    average: Math.round(total / count)
  }));

  const togglePDFPreview = () => {
    setShowPDFPreview(!showPDFPreview);
  };

  return (
    <div className="py-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-left">Exam Performance</CardTitle>
            <CardDescription>
              View {studentName}'s academic performance
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {loadingYears ? (
              <Skeleton className="h-10 w-36" />
            ) : (
              <Select 
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
              </Select>
            )}
            <ExamExportActions 
              studentName={studentName} 
              processedData={processedData} 
              togglePDFPreview={togglePDFPreview} 
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6" id="student-exams-data">
          {/* Exam Records Table */}
          <div>
            <h3 className="font-medium mb-4 text-lg">
              Exam Results - {selectedYear || "All Years"}
              {selectedYear === currentAcademicYear && " (Current Year)"}
            </h3>
            
            <ExamResultsTable 
              examScores={examScores}
              isLoading={loadingScores}
              selectedYear={selectedYear}
              studentName={studentName}
            />
          </div>

          {/* Performance Charts */}
          <ExamCharts 
            trendData={trendData}
            termData={termData}
          />
        </CardContent>
      </Card>

      {/* PDF Preview Modal */}
      <PdfPreviewModal 
        showPDFPreview={showPDFPreview}
        togglePDFPreview={togglePDFPreview}
        studentName={studentName}
        processedData={processedData}
        termData={termData}
        trendData={trendData}
        selectedYear={selectedYear}
      />
    </div>
  );
}
