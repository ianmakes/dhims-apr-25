
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
import { useAppSettings } from "@/components/settings/GlobalSettingsProvider";

interface StudentExamsTabProps {
  studentName: string;
  studentId: string;
}

interface AcademicYearOption {
  value: string;
  label: string;
  isCurrent: boolean;
}

export function StudentExamsTab({
  studentName,
  studentId
}: StudentExamsTabProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const { currentAcademicYear } = useAppSettings();

  // Get available academic years that have exam data for this student
  const {
    data: availableYears = [],
    isLoading: loadingYears
  } = useQuery({
    queryKey: ['student-available-years', studentId],
    queryFn: async () => {
      console.log('Fetching available academic years for student:', studentId);
      
      // First get all academic years from the database
      const { data: allYears, error: yearsError } = await supabase
        .from('academic_years')
        .select('*')
        .order('start_date', { ascending: false });
        
      if (yearsError) {
        console.error('Error fetching academic years:', yearsError);
        throw yearsError;
      }

      // Then get years that have exam data for this student
      const { data: examScores, error: scoresError } = await supabase
        .from('student_exam_scores')
        .select('academic_year_recorded')
        .eq('student_id', studentId)
        .not('academic_year_recorded', 'is', null);
        
      if (scoresError) {
        console.error('Error fetching exam scores:', scoresError);
        throw scoresError;
      }

      if (!examScores || examScores.length === 0) {
        console.log('No exam scores found for student');
        return [];
      }

      // Get unique academic years from exam scores
      const yearsWithData = Array.from(
        new Set(examScores.map(score => score.academic_year_recorded).filter(Boolean))
      );

      // Create options array with labels
      const yearOptions: AcademicYearOption[] = yearsWithData.map(yearName => {
        const yearData = allYears?.find(y => y.year_name === yearName);
        return {
          value: yearName,
          label: yearName,
          isCurrent: yearData?.is_current || false
        };
      }).sort((a, b) => {
        // Sort by year, newest first
        return b.value.localeCompare(a.value);
      });
      
      console.log('Available years with data:', yearOptions);
      return yearOptions;
    },
    enabled: !!studentId
  });
  
  const [selectedYear, setSelectedYear] = useState<string>("");

  // Set initial selected year to current academic year if it has data, otherwise first available
  useEffect(() => {
    if (availableYears.length === 0) return;

    // Try to find current academic year in available years
    const currentYear = availableYears.find(year => year.isCurrent);
    
    if (currentYear && !selectedYear) {
      console.log('Setting selected year to current academic year:', currentYear.value);
      setSelectedYear(currentYear.value);
    } else if (!selectedYear && availableYears.length > 0) {
      console.log('Setting selected year to first available year:', availableYears[0].value);
      setSelectedYear(availableYears[0].value);
    }
  }, [availableYears, selectedYear]);

  // Get student exam scores filtered by selected academic year
  const {
    data: examScores = [],
    isLoading: loadingScores
  } = useQuery<StudentExamScore[]>({
    queryKey: ['student-exams', studentId, selectedYear],
    queryFn: async () => {
      if (!studentId) throw new Error('Student ID is required');
      if (!selectedYear) {
        console.log('No year selected, returning empty array');
        return [];
      }

      console.log('Fetching exam scores for student:', studentId, 'year:', selectedYear);

      // Get exam scores for this student for the selected academic year
      const { data: scores, error: scoresError } = await supabase
        .from('student_exam_scores')
        .select(`
          *,
          exam:exams(*)
        `)
        .eq('student_id', studentId)
        .eq('academic_year_recorded', selectedYear);
        
      if (scoresError) {
        console.error('Error fetching exam scores:', scoresError);
        throw scoresError;
      }

      if (!scores || scores.length === 0) {
        console.log('No exam scores found for student in year:', selectedYear);
        return [];
      }

      console.log('Enriched exam scores:', scores);
      return scores as StudentExamScore[];
    },
    enabled: !!studentId && !!selectedYear
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
                  {availableYears.map(yearOption => (
                    <SelectItem key={yearOption.value} value={yearOption.value}>
                      {yearOption.label}
                      {yearOption.isCurrent && " (Current)"}
                    </SelectItem>
                  ))}
                  {availableYears.length === 0 && (
                    <SelectItem value="none" disabled>
                      No exam data available
                    </SelectItem>
                  )}
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
              Exam Results - {selectedYear || "No Year Selected"}
              {availableYears.find(y => y.value === selectedYear)?.isCurrent && " (Current Year)"}
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
