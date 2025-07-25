import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BarChart2, Bookmark, Check, Download, Edit, Info, Save, Trash2, Upload, User, X, Search, FileDown, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, Cell, PieChart, Pie, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { ExamWithScores, StudentForExam, ExamGrade } from "@/types/exam";
import { ImportStudentScoresModal } from "@/components/exams/ImportStudentScoresModal";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

// Get grade based on score percentage
const getGrade = (score: number): ExamGrade => {
  if (score >= 80) return ExamGrade.EXCEEDING;
  if (score >= 50) return ExamGrade.MEETING;
  if (score >= 40) return ExamGrade.APPROACHING;
  return ExamGrade.BELOW;
};

// Get color based on grade
const getGradeColor = (grade: string): string => {
  switch (grade) {
    case ExamGrade.EXCEEDING:
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case ExamGrade.MEETING:
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case ExamGrade.APPROACHING:
      return "bg-amber-100 text-amber-800 hover:bg-amber-200";
    case ExamGrade.BELOW:
      return "bg-red-100 text-red-800 hover:bg-red-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
};
export default function ExamDetail() {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    toast
  } = useToast();
  const [activeTab, setActiveTab] = useState("scores");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<{
    [key: string]: number | boolean;
  }>({});
  const [isEditExamOpen, setIsEditExamOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [examData, setExamData] = useState<ExamWithScores | null>(null);
  const [allStudents, setAllStudents] = useState<StudentForExam[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Fetch exam details with scores
  const {
    data: examDataQuery,
    isLoading: isLoadingExam
  } = useQuery({
    queryKey: ['exam', id],
    queryFn: async () => {
      try {
        const {
          data: exam,
          error
        } = await supabase.from('exams').select(`
            *,
            student_exam_scores (
              id,
              score,
              did_not_sit,
              student:students (
                id,
                name,
                current_grade,
                admission_number
              )
            )
          `).eq('id', id).single();
        if (error) throw error;
        return exam;
      } catch (error) {
        console.error("Error fetching exam data:", error);
        throw error;
      }
    }
  });

  // Fetch all students for the student scores tab
  const {
    data: studentsData,
    isLoading: isLoadingStudents
  } = useQuery({
    queryKey: ['students-for-exam'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('students').select('id, name, current_grade, admission_number').eq('status', 'Active').order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // Effect to update local state when query data is available
  useEffect(() => {
    if (examDataQuery) {
      setExamData(examDataQuery as ExamWithScores);
    }
  }, [examDataQuery]);

  // Effect to merge students with their scores
  useEffect(() => {
    if (studentsData && examData?.student_exam_scores) {
      const scoreMap = new Map(examData.student_exam_scores.map(score => [score.student?.id, {
        examScoreId: score.id,
        score: score.score,
        didNotSit: score.did_not_sit || false
      }]));
      const mergedStudents = studentsData.map(student => {
        const scoreData = scoreMap.get(student.id);
        return {
          id: student.id,
          name: student.name,
          admission_number: student.admission_number,
          current_grade: student.current_grade,
          hasScore: !!scoreData,
          examScoreId: scoreData?.examScoreId,
          score: scoreData?.score || null,
          didNotSit: scoreData?.didNotSit || false
        };
      });
      setAllStudents(mergedStudents);

      // Initialize edit data with current scores
      if (isEditing) {
        const newEditData: {
          [key: string]: number | boolean;
        } = {};
        mergedStudents.forEach(student => {
          if (student.hasScore) {
            newEditData[`score_${student.id}`] = student.score || 0;
            newEditData[`dns_${student.id}`] = student.didNotSit || false;
          }
        });
        setEditData(newEditData);
      }
    }
  }, [studentsData, examData, isEditing]);

  // Save scores mutation
  const updateScores = useMutation({
    mutationFn: async (studentScores: Array<{
      studentId: string;
      score: number;
      didNotSit: boolean;
    }>) => {
      const scoresToUpsert = studentScores.map(({
        studentId,
        score,
        didNotSit
      }) => {
        const existingScore = allStudents.find(s => s.id === studentId);
        return {
          id: existingScore?.examScoreId,
          // Use existing ID if available, otherwise undefined for insert
          exam_id: id,
          student_id: studentId,
          score,
          did_not_sit: didNotSit
        };
      });

      // Filter out scores that haven't changed
      const changedScores = scoresToUpsert.filter(newScore => {
        const existingStudent = allStudents.find(s => s.id === newScore.student_id);
        if (!existingStudent?.hasScore) return true; // New score
        return existingStudent.score !== newScore.score || existingStudent.didNotSit !== newScore.did_not_sit;
      });
      if (changedScores.length === 0) {
        return {
          message: "No changes detected"
        };
      }

      // Clean up scores for upsert (remove undefined IDs)
      const cleanScores = changedScores.map(score => {
        if (score.id === undefined) {
          const {
            id,
            ...rest
          } = score;
          return rest;
        }
        return score;
      });
      const {
        error
      } = await supabase.from('student_exam_scores').upsert(cleanScores);
      if (error) throw error;
      return {
        message: `Updated ${changedScores.length} student scores`
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['exam', id]
      });
      setIsEditing(false);
      toast({
        title: "Scores Saved",
        description: "Student scores have been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update exam mutation
  const updateExam = useMutation({
    mutationFn: async (examUpdateData: any) => {
      const {
        data,
        error
      } = await supabase.from('exams').update(examUpdateData).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({
        queryKey: ['exam', id]
      });
      setExamData(data as ExamWithScores);
      setIsEditExamOpen(false);
      toast({
        title: "Exam Updated",
        description: "Exam details have been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete exam mutation
  const deleteExam = useMutation({
    mutationFn: async () => {
      const {
        error
      } = await supabase.from('exams').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      navigate('/exams');
      toast({
        title: "Exam Deleted",
        description: "The exam has been deleted successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Download as PDF
  const downloadAsPDF = () => {
    if (!examData) return;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const element = document.getElementById('student-scores-table');
    const headerElement = document.getElementById('exam-header-info');
    if (!element || !headerElement) return;

    // First capture the header info
    html2canvas(headerElement).then(headerCanvas => {
      const headerImgData = headerCanvas.toDataURL('image/png');
      const headerImgProps = pdf.getImageProperties(headerImgData);
      const headerPageWidth = pdf.internal.pageSize.getWidth();
      const headerPageHeight = headerImgProps.height * headerPageWidth / headerImgProps.width;
      pdf.addImage(headerImgData, 'PNG', 0, 0, headerPageWidth, headerPageHeight);

      // Then capture the table
      html2canvas(element).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const imgProps = pdf.getImageProperties(imgData);
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = imgProps.height * pageWidth / imgProps.width;

        // Add new page for table if needed
        if (headerPageHeight > 20) {
          pdf.addPage();
        } else {
          // Add some spacing after the header
          pdf.addImage(imgData, 'PNG', 0, headerPageHeight + 10, pageWidth, pageHeight);
        }
        pdf.save(`${examData.name.replace(/\s+/g, '_')}_results.pdf`);
      });
    });
  };

  // Export scores to CSV
  const exportScores = () => {
    if (!examData || !allStudents.length) return;

    // Prepare CSV content
    const headers = ['Admission Number', 'Student Name', 'Grade Level', 'Score', 'Status', 'Performance'];
    const rows = allStudents.map(student => {
      const hasScore = student.hasScore;
      const score = student.score;
      const didNotSit = student.didNotSit;
      const status = didNotSit ? 'Did Not Sit' : hasScore ? 'Present' : 'Not Assessed';
      const performance = didNotSit ? 'N/A' : hasScore && score !== null ? getGrade(score) : 'N/A';
      return [student.admission_number, student.name, student.current_grade || 'N/A', didNotSit ? 'DNS' : score !== null ? score : '', status, performance];
    });

    // Add exam details as header in the CSV
    const examDetails = [['Exam Name', examData.name], ['Academic Year', examData.academic_year], ['Term', examData.term], ['Exam Date', new Date(examData.exam_date).toLocaleDateString()], ['Maximum Score', examData.max_score], ['Passing Score', examData.passing_score], [''] // Empty row before data
    ];

    // Convert to CSV
    const csvContent = [...examDetails.map(row => row.join(',')), headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    // Create download link
    const blob = new Blob([csvContent], {
      type: 'text/csv'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${examData.name.replace(/\s+/g, '_')}_scores.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  if (isLoadingExam || !examData) {
    return <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading exam details...</p>
        </div>
      </div>;
  }

  // Prepare student data for display
  const studentsWithScores = allStudents.map(student => ({
    id: student.id,
    studentId: student.id,
    admissionNumber: student.admission_number || 'N/A',
    name: student.name,
    grade: student.current_grade || 'N/A',
    score: student.score,
    didNotSit: student.didNotSit,
    status: student.didNotSit ? 'Did Not Sit' : getGrade(student.score || 0)
  }));

  // Calculate statistics
  const scoredStudents = studentsWithScores.filter(s => s.score !== null && !s.didNotSit);
  const scores = scoredStudents.map(s => s.score || 0);
  const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
  const passRate = scores.length > 0 ? scoredStudents.filter(s => (s.score || 0) >= examData.passing_score).length / scores.length * 100 : 0;

  // Performance distribution data for radar chart
  const performanceData = [{
    category: "Performance Categories",
    [ExamGrade.EXCEEDING]: studentsWithScores.filter(s => !s.didNotSit && (s.score || 0) >= 80).length,
    [ExamGrade.MEETING]: studentsWithScores.filter(s => !s.didNotSit && (s.score || 0) >= 50 && (s.score || 0) < 80).length,
    [ExamGrade.APPROACHING]: studentsWithScores.filter(s => !s.didNotSit && (s.score || 0) >= 40 && (s.score || 0) < 50).length,
    [ExamGrade.BELOW]: studentsWithScores.filter(s => !s.didNotSit && (s.score || 0) < 40).length,
    "Did Not Sit": studentsWithScores.filter(s => s.didNotSit).length
  }];

  // Score distribution data
  const scoreDistribution = [{
    range: "0-20",
    count: studentsWithScores.filter(s => !s.didNotSit && (s.score || 0) >= 0 && (s.score || 0) <= 20).length
  }, {
    range: "21-40",
    count: studentsWithScores.filter(s => !s.didNotSit && (s.score || 0) > 20 && (s.score || 0) <= 40).length
  }, {
    range: "41-60",
    count: studentsWithScores.filter(s => !s.didNotSit && (s.score || 0) > 40 && (s.score || 0) <= 60).length
  }, {
    range: "61-80",
    count: studentsWithScores.filter(s => !s.didNotSit && (s.score || 0) > 60 && (s.score || 0) <= 80).length
  }, {
    range: "81-100",
    count: studentsWithScores.filter(s => !s.didNotSit && (s.score || 0) > 80 && (s.score || 0) <= 100).length
  }, {
    range: "Did Not Sit",
    count: studentsWithScores.filter(s => s.didNotSit).length
  }];
  const handleEditExam = (e: React.FormEvent) => {
    e.preventDefault();
    updateExam.mutate({
      name: examData.name,
      academic_year: examData.academic_year,
      term: examData.term,
      exam_date: examData.exam_date,
      max_score: examData.max_score,
      passing_score: examData.passing_score
    });
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const {
      name,
      value
    } = e.target;
    setExamData((prev: any) => ({
      ...prev,
      [name]: value
    }));
  };
  const handleScoreChange = (studentId: string, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    const clampedValue = Math.min(Math.max(numValue, 0), examData.max_score);
    setEditData(prev => ({
      ...prev,
      [`score_${studentId}`]: clampedValue,
      // If score is entered, automatically set didNotSit to false
      [`dns_${studentId}`]: false
    }));
  };
  const handleDidNotSitChange = (studentId: string, checked: boolean) => {
    setEditData(prev => ({
      ...prev,
      [`dns_${studentId}`]: checked,
      // Ensure we're using the correct type (number) for the score
      [`score_${studentId}`]: checked ? 0 : prev[`score_${studentId}`] !== undefined ? prev[`score_${studentId}`] : 0
    }));
  };
  const saveScores = () => {
    const scoresToUpdate = allStudents.map(student => {
      const scoreKey = `score_${student.id}`;
      const dnsKey = `dns_${student.id}`;

      // Explicitly convert to the correct types
      const score = typeof editData[scoreKey] === 'number' ? editData[scoreKey] as number : student.score || 0;
      const didNotSit = typeof editData[dnsKey] === 'boolean' ? editData[dnsKey] as boolean : student.didNotSit;
      return {
        studentId: student.id,
        score,
        didNotSit
      };
    });
    updateScores.mutate(scoresToUpdate);
  };
  const cancelEditing = () => {
    // Reset edit data
    setEditData({});
    setIsEditing(false);
  };

  // Filter students based on search term
  const filteredStudents = studentsWithScores.filter(student => student.name.toLowerCase().includes(searchTerm.toLowerCase()) || student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()));
  return <div className="space-y-6 fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate('/exams')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{examData.name}</h1>
            <p className="text-muted-foreground text-left">{examData.term} • {examData.academic_year}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <Dialog open={isEditExamOpen} onOpenChange={setIsEditExamOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit Exam
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Edit Exam</DialogTitle>
                <DialogDescription>
                  Update the exam details. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditExam}>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Exam Name</Label>
                    <Input id="name" name="name" value={examData.name} onChange={handleInputChange} required />
                  </div>
                  <div className="col-span-1">
                    <Label htmlFor="academic_year">Academic Year</Label>
                    <select id="academic_year" name="academic_year" value={examData.academic_year} onChange={handleInputChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                      <option value="2023-2024">2023-2024</option>
                      <option value="2022-2023">2022-2023</option>
                      <option value="2021-2022">2021-2022</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <Label htmlFor="term">Term</Label>
                    <select id="term" name="term" value={examData.term} onChange={handleInputChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                      <option value="Term 1">Term 1</option>
                      <option value="Term 2">Term 2</option>
                      <option value="Term 3">Term 3</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <Label htmlFor="exam_date">Exam Date</Label>
                    <Input id="exam_date" name="exam_date" type="date" value={examData.exam_date} onChange={handleInputChange} required />
                  </div>
                  <div className="col-span-1">
                    <Label htmlFor="max_score">Maximum Score</Label>
                    <Input id="max_score" name="max_score" type="number" value={examData.max_score} onChange={handleInputChange} min="1" required />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="passing_score">Passing Score</Label>
                    <Input id="passing_score" name="passing_score" type="number" value={examData.passing_score} onChange={handleInputChange} min="1" max={examData.max_score} required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditExamOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this exam?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the exam "{examData.name}" and all associated student scores.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteExam.mutate()} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
                  Delete Exam
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Two-column layout - Overview card and Tabs card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overview Card */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-left">Exam Overview</CardTitle>
            <CardDescription className="text-left">Key information about this exam</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* General Information */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 text-left">General Information</h3>
              <div className="bg-muted/40 p-4 rounded-md space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Exam Name</span>
                  <span className="font-medium">{examData.name}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Academic Year</span>
                  <span className="font-medium">{examData.academic_year}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Term</span>
                  <span className="font-medium">{examData.term}</span>
                </div>
              </div>
            </div>

            {/* Exam Parameters */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 text-left">Exam Parameters</h3>
              <div className="bg-muted/40 p-4 rounded-md space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Exam Date</span>
                  <span className="font-medium">{new Date(examData.exam_date).toLocaleDateString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Maximum Score</span>
                  <span className="font-medium">{examData.max_score}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Passing Score</span>
                  <span className="font-medium">
                    {examData.passing_score} ({(examData.passing_score / examData.max_score * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Thresholds */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 text-left">Performance Thresholds</h3>
              <div className="bg-muted/40 p-4 rounded-md space-y-2">
                <div className="p-2 bg-green-50 border border-green-100 rounded-md">
                  <div className="font-medium text-green-800">{ExamGrade.EXCEEDING}</div>
                  <div className="text-sm text-green-700">80% and above</div>
                </div>
                <div className="p-2 bg-blue-50 border border-blue-100 rounded-md">
                  <div className="font-medium text-blue-800">{ExamGrade.MEETING}</div>
                  <div className="text-sm text-blue-700">50% to 79%</div>
                </div>
                <div className="p-2 bg-amber-50 border border-amber-100 rounded-md">
                  <div className="font-medium text-amber-800">{ExamGrade.APPROACHING}</div>
                  <div className="text-sm text-amber-700">40% to 49%</div>
                </div>
                <div className="p-2 bg-red-50 border border-red-100 rounded-md">
                  <div className="font-medium text-red-800">{ExamGrade.BELOW}</div>
                  <div className="text-sm text-red-700">Below 40%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="border-b">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="flex h-10 items-center justify-start gap-2 rounded-none border-b border-transparent bg-transparent p-0 w-full">
                  <TabsTrigger value="scores" className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-none bg-transparent px-3 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">
                    Student Scores
                  </TabsTrigger>
                  <TabsTrigger value="details" className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-none bg-transparent px-3 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">
                    Details
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} className="w-full">
              <TabsContent value="scores" className="space-y-6 mt-0">
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                    <div className="relative w-full sm:max-w-sm">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="search" placeholder="Search students by name or admission #..." className="pl-8 w-full" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <div className="dropdown relative">
                        <Button variant="outline" className="flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          <span>Export</span>
                        </Button>
                        <div className="dropdown-content absolute hidden bg-white rounded-md shadow-lg z-10 mt-2 right-0 min-w-[160px] border p-1 group-hover:block">
                          <Button variant="ghost" onClick={exportScores} className="w-full justify-start mb-1">
                            <FileText className="mr-2 h-4 w-4" />
                            <span>CSV</span>
                          </Button>
                          <Button variant="ghost" onClick={downloadAsPDF} className="w-full justify-start">
                            <FileDown className="mr-2 h-4 w-4" />
                            <span>PDF</span>
                          </Button>
                        </div>
                      </div>
                      <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Import
                      </Button>
                      {isEditing ? <>
                          <Button variant="outline" onClick={cancelEditing} disabled={updateScores.isPending}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                          <Button onClick={saveScores} disabled={updateScores.isPending}>
                            {updateScores.isPending ? <>
                                <span className="animate-spin mr-2">⚬</span>
                                Saving...
                              </> : <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Scores
                              </>}
                          </Button>
                        </> : <Button onClick={() => setIsEditing(true)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Enter Scores
                        </Button>}
                    </div>
                  </div>

                  <div id="exam-header-info" className="hidden">
                    <h1 className="text-2xl font-bold">{examData.name}</h1>
                    <p>{examData.term} • {examData.academic_year}</p>
                    <p>Exam Date: {new Date(examData.exam_date).toLocaleDateString()}</p>
                    <p>Maximum Score: {examData.max_score}</p>
                    <p>Passing Score: {examData.passing_score}</p>
                    <p>Average Score: {averageScore.toFixed(1)}%</p>
                    <p>Pass Rate: {passRate.toFixed(1)}%</p>
                  </div>

                  <div className="rounded-md border">
                    <div id="student-scores-table">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Admission #</TableHead>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Grade Level</TableHead>
                            <TableHead className="text-center">Score</TableHead>
                            <TableHead className="text-center">Did Not Sit</TableHead>
                            <TableHead className="text-center">Performance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoadingStudents ? <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                <div className="flex justify-center items-center">
                                  <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                                  Loading students...
                                </div>
                              </TableCell>
                            </TableRow> : filteredStudents.length === 0 ? <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                No students found. Try a different search term.
                              </TableCell>
                            </TableRow> : filteredStudents.map(student => <TableRow key={student.id}>
                                <TableCell className="font-mono text-sm">{student.admissionNumber}</TableCell>
                                <TableCell>{student.name}</TableCell>
                                <TableCell>{student.grade}</TableCell>
                                <TableCell className="text-center">
                                  {isEditing ? <Input type="number" value={editData[`score_${student.id}`] !== undefined ? editData[`score_${student.id}`] as number : student.score || 0} onChange={e => handleScoreChange(student.id, e.target.value)} min={0} max={examData.max_score} className="w-20 text-center mx-auto" disabled={editData[`dns_${student.id}`] === true} /> : student.didNotSit ? <span className="text-muted-foreground">DNS</span> : <span>{student.score !== null ? student.score : "-"}</span>}
                                </TableCell>
                                <TableCell className="text-center">
                                  {isEditing ? <Checkbox checked={editData[`dns_${student.id}`] !== undefined ? editData[`dns_${student.id}`] as boolean : student.didNotSit} onCheckedChange={checked => handleDidNotSitChange(student.id, !!checked)} className="mx-auto" /> : student.didNotSit ? <Check className="h-4 w-4 mx-auto text-primary" /> : <span>-</span>}
                                </TableCell>
                                <TableCell className="text-center">
                                  {student.didNotSit ? <span className="text-muted-foreground">N/A</span> : <Badge className={getGradeColor(student.status)}>
                                      {student.status}
                                    </Badge>}
                                </TableCell>
                              </TableRow>)}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>

                <ImportStudentScoresModal open={isImportModalOpen} onOpenChange={setIsImportModalOpen} examId={id || ''} onSuccess={() => {
                queryClient.invalidateQueries({
                  queryKey: ['exam', id]
                });
                toast({
                  title: "Scores Imported",
                  description: "Student scores have been imported successfully."
                });
              }} />
              </TabsContent>

              <TabsContent value="details" className="space-y-6 mt-0">
                <div className="grid gap-6 md:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                      <BarChart2 className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{averageScore.toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground">
                        Out of {examData.max_score} points
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
                      <Bookmark className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{highestScore}%</div>
                      <p className="text-xs text-muted-foreground">
                        By {studentsWithScores.find(s => s.score === highestScore)?.name || "N/A"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-sm font-medium">Lowest Score</CardTitle>
                      <Bookmark className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{lowestScore}%</div>
                      <p className="text-xs text-muted-foreground">
                        By {studentsWithScores.find(s => s.score === lowestScore)?.name || "N/A"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                      <User className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{passRate.toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground">
                        {studentsWithScores.filter(s => !s.didNotSit && (s.score || 0) >= examData.passing_score).length} out of {scores.length} students
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 grid-cols-1">
                  <Card>
                    <CardHeader>
                      <CardTitle>Score Distribution</CardTitle>
                      <CardDescription>
                        Distribution of student scores by range
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={scoreDistribution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="range" />
                            <YAxis allowDecimals={false} />
                            <RechartsTooltip />
                            <Legend />
                            <Bar dataKey="count" name="Number of Students" fill="#3b82f6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Categories</CardTitle>
                      <CardDescription>
                        Distribution of students by performance category
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ChartContainer className="h-80" config={{
                        exceeding: {
                          label: "Exceeding Expectation",
                          theme: {
                            light: "#22c55e",
                            dark: "#22c55e"
                          }
                        },
                        meeting: {
                          label: "Meeting Expectation",
                          theme: {
                            light: "#3b82f6",
                            dark: "#3b82f6"
                          }
                        },
                        approaching: {
                          label: "Approaching Expectation",
                          theme: {
                            light: "#f59e0b",
                            dark: "#f59e0b"
                          }
                        },
                        below: {
                          label: "Below Expectation",
                          theme: {
                            light: "#ef4444",
                            dark: "#ef4444"
                          }
                        },
                        didNotSit: {
                          label: "Did Not Sit",
                          theme: {
                            light: "#94a3b8",
                            dark: "#94a3b8"
                          }
                        }
                      }}>
                          <PieChart>
                            <Pie data={[{
                            name: ExamGrade.EXCEEDING,
                            value: studentsWithScores.filter(s => !s.didNotSit && (s.score || 0) >= 80).length
                          }, {
                            name: ExamGrade.MEETING,
                            value: studentsWithScores.filter(s => !s.didNotSit && (s.score || 0) >= 50 && (s.score || 0) < 80).length
                          }, {
                            name: ExamGrade.APPROACHING,
                            value: studentsWithScores.filter(s => !s.didNotSit && (s.score || 0) >= 40 && (s.score || 0) < 50).length
                          }, {
                            name: ExamGrade.BELOW,
                            value: studentsWithScores.filter(s => !s.didNotSit && (s.score || 0) < 40).length
                          }, {
                            name: "Did Not Sit",
                            value: studentsWithScores.filter(s => s.didNotSit).length
                          }]} cx="50%" cy="50%" innerRadius={80} outerRadius={100} dataKey="value" nameKey="name" labelLine={false}>
                              {[{
                              name: ExamGrade.EXCEEDING,
                              value: studentsWithScores.filter(s => !s.didNotSit && (s.score || 0) >= 80).length
                            }, {
                              name: ExamGrade.MEETING,
                              value: studentsWithScores.filter(s => !s.didNotSit && (s.score || 0) >= 50 && (s.score || 0) < 80).length
                            }, {
                              name: ExamGrade.APPROACHING,
                              value: studentsWithScores.filter(s => !s.didNotSit && (s.score || 0) >= 40 && (s.score || 0) < 50).length
                            }, {
                              name: ExamGrade.BELOW,
                              value: studentsWithScores.filter(s => !s.didNotSit && (s.score || 0) < 40).length
                            }, {
                              name: "Did Not Sit",
                              value: studentsWithScores.filter(s => s.didNotSit).length
                            }].map((entry, index) => <Cell key={`cell-${index}`} fill={entry.name === ExamGrade.EXCEEDING ? "var(--color-exceeding)" : entry.name === ExamGrade.MEETING ? "var(--color-meeting)" : entry.name === ExamGrade.APPROACHING ? "var(--color-approaching)" : entry.name === ExamGrade.BELOW ? "var(--color-below)" : "var(--color-didNotSit)"} />)}
                            </Pie>
                            <RechartsTooltip content={({
                            active,
                            payload
                          }) => {
                            if (active && payload && payload.length) {
                              return <ChartTooltipContent className="bg-white p-2 border rounded shadow-sm" payload={payload} />;
                            }
                            return null;
                          }} />
                            <Legend />
                          </PieChart>
                        </ChartContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-left">Performance Analysis</CardTitle>
                    <CardDescription className="text-left">Detailed exam performance analytics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-lg font-medium mb-4 text-left">Score Summary</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="flex flex-col space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Average</span>
                              <span className="font-medium">{averageScore.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Median</span>
                              <span className="font-medium">
                                {scores.length > 0 ? scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)] : 0}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Standard Deviation</span>
                              <span className="font-medium">
                                {scores.length > 0 ? Math.sqrt(scores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / scores.length).toFixed(1) : 0}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Pass Rate</span>
                              <span className="font-medium">{passRate.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Students Assessed</span>
                              <span className="font-medium">{scores.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Students Not Present</span>
                              <span className="font-medium">{studentsWithScores.filter(s => s.didNotSit).length}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-4">Performance Distribution</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[{
                            name: "Exceeding",
                            value: studentsWithScores.filter(s => !s.didNotSit && s.status === ExamGrade.EXCEEDING).length
                          }, {
                            name: "Meeting",
                            value: studentsWithScores.filter(s => !s.didNotSit && s.status === ExamGrade.MEETING).length
                          }, {
                            name: "Approaching",
                            value: studentsWithScores.filter(s => !s.didNotSit && s.status === ExamGrade.APPROACHING).length
                          }, {
                            name: "Below",
                            value: studentsWithScores.filter(s => !s.didNotSit && s.status === ExamGrade.BELOW).length
                          }]}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis allowDecimals={false} />
                              <RechartsTooltip />
                              <Legend />
                              <Bar dataKey="value" name="Students" fill="#3b82f6" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <style>{`
        .dropdown:hover .dropdown-content {
          display: block;
        }
      `}</style>
    </div>;
}