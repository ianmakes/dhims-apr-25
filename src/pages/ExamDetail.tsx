import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  BarChart2, 
  Bookmark, 
  Check, 
  Download, 
  Edit, 
  Info, 
  Save, 
  Trash2, 
  User, 
  X,
  Search 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

// Get grade based on score percentage
const getGrade = (score: number): string => {
  if (score >= 80) return "Exceeding Expectation";
  if (score >= 50) return "Meeting Expectation";
  if (score >= 40) return "Approaching Expectation";
  return "Below Expectation";
};

// Get color based on grade
const getGradeColor = (grade: string): string => {
  switch (grade) {
    case "Exceeding Expectation":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "Meeting Expectation":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "Approaching Expectation":
      return "bg-amber-100 text-amber-800 hover:bg-amber-200";
    case "Below Expectation":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
};

export default function ExamDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<{ [key: string]: number }>({});
  const [isEditExamOpen, setIsEditExamOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch exam details with scores
  const { data: examData, isLoading: isLoadingExam } = useQuery({
    queryKey: ['exam', id],
    queryFn: async () => {
      const { data: exam, error } = await supabase
        .from('exams')
        .select(`
          *,
          student_exam_scores (
            id,
            score,
            student:students (
              id,
              name,
              current_grade
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return exam;
    }
  });

  // Save scores mutation
  const updateScores = useMutation({
    mutationFn: async (scores: { id: string, score: number }[]) => {
      const promises = scores.map(({ id, score }) => 
        supabase
          .from('student_exam_scores')
          .update({ score })
          .eq('id', id)
      );

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam', id] });
      setIsEditing(false);
      toast({
        title: "Scores Saved",
        description: "Student scores have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update exam mutation
  const updateExam = useMutation({
    mutationFn: async (examData: any) => {
      const { data, error } = await supabase
        .from('exams')
        .update(examData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam', id] });
      setIsEditExamOpen(false);
      toast({
        title: "Exam Updated",
        description: "Exam details have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete exam mutation
  const deleteExam = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      navigate('/exams');
      toast({
        title: "Exam Deleted",
        description: "The exam has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  if (isLoadingExam) {
    return <div>Loading...</div>;
  }

  if (!examData) {
    return <div>Exam not found</div>;
  }

  const students = examData.student_exam_scores.map((score: any) => ({
    id: score.id,
    studentId: score.student.id,
    name: score.student.name,
    grade: score.student.current_grade,
    score: score.score,
    status: getGrade(score.score)
  }));

  // Calculate statistics
  const scores = students.map(s => s.score);
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const highestScore = Math.max(...scores);
  const lowestScore = Math.min(...scores);
  const passRate = (students.filter(s => s.score >= examData.passing_score).length / students.length) * 100;

  // Performance distribution data
  const performanceData = [
    {
      name: "Exceeding Expectation",
      value: students.filter(s => s.score >= 80).length,
      color: "#4ade80"
    },
    {
      name: "Meeting Expectation",
      value: students.filter(s => s.score >= 50 && s.score < 80).length,
      color: "#3b82f6"
    },
    {
      name: "Approaching Expectation",
      value: students.filter(s => s.score >= 40 && s.score < 50).length,
      color: "#f59e0b"
    },
    {
      name: "Below Expectation",
      value: students.filter(s => s.score < 40).length,
      color: "#ef4444"
    }
  ];

  // Score distribution data
  const scoreDistribution = [
    { range: "0-20", count: students.filter(s => s.score >= 0 && s.score <= 20).length },
    { range: "21-40", count: students.filter(s => s.score > 20 && s.score <= 40).length },
    { range: "41-60", count: students.filter(s => s.score > 40 && s.score <= 60).length },
    { range: "61-80", count: students.filter(s => s.score > 60 && s.score <= 80).length },
    { range: "81-100", count: students.filter(s => s.score > 80 && s.score <= 100).length }
  ];

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
    const { name, value } = e.target;
    setExamData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleScoreChange = (id: string, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    const clampedValue = Math.min(Math.max(numValue, 0), examData.max_score);
    setEditData((prev) => ({ ...prev, [id]: clampedValue }));
  };

  const saveScores = () => {
    const scoresToUpdate = Object.entries(editData).map(([studentExamScoreId, score]) => ({
      id: studentExamScoreId,
      score: score
    }));
    updateScores.mutate(scoresToUpdate);
  };

  const cancelEditing = () => {
    // Reset edit data to current scores
    const resetEditData = students.reduce((acc, student) => {
      acc[student.id] = student.score;
      return acc;
    }, {} as { [key: string]: number });
    setEditData(resetEditData);
    setIsEditing(false);
  };

  // Filter students based on search term
  const filteredStudents = students.filter(
    (student) => student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate('/exams')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{examData.name}</h1>
            <p className="text-muted-foreground">{examData.subject} • {examData.term} • {examData.academic_year}</p>
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
                    <Input
                      id="name"
                      name="name"
                      value={examData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={examData.subject}
                      onChange={handleInputChange}
                      required
                      disabled
                    />
                  </div>
                  <div className="col-span-1">
                    <Label htmlFor="academic_year">Academic Year</Label>
                    <select
                      id="academic_year"
                      name="academic_year"
                      value={examData.academic_year}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="2023-2024">2023-2024</option>
                      <option value="2022-2023">2022-2023</option>
                      <option value="2021-2022">2021-2022</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <Label htmlFor="term">Term</Label>
                    <select
                      id="term"
                      name="term"
                      value={examData.term}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="Term 1">Term 1</option>
                      <option value="Term 2">Term 2</option>
                      <option value="Term 3">Term 3</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <Label htmlFor="exam_date">Exam Date</Label>
                    <Input
                      id="exam_date"
                      name="exam_date"
                      type="date"
                      value={examData.exam_date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-span-1">
                    <Label htmlFor="max_score">Maximum Score</Label>
                    <Input
                      id="max_score"
                      name="max_score"
                      type="number"
                      value={examData.max_score}
                      onChange={handleInputChange}
                      min="1"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="passing_score">Passing Score</Label>
                    <Input
                      id="passing_score"
                      name="passing_score"
                      type="number"
                      value={examData.passing_score}
                      onChange={handleInputChange}
                      min="1"
                      max={examData.max_score}
                      required
                    />
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
          <Button variant="destructive" onClick={() => deleteExam.mutate()}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Student Scores</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
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
                  By {students.find(s => s.score === highestScore)?.name}
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
                  By {students.find(s => s.score === lowestScore)?.name}
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
                  {students.filter(s => s.score >= examData.passing_score).length} out of {students.length} students
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
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
                      <Tooltip />
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
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={performanceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {performanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Student Scores Tab */}
        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Student Scores</CardTitle>
                <CardDescription>
                  Manage and update student scores for this exam
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={cancelEditing}>
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button onClick={saveScores}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Scores
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Enter Scores
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search students..."
                    className="pl-8 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Grade Level</TableHead>
                      <TableHead className="text-center">Score (out of {examData.max_score})</TableHead>
                      <TableHead className="text-center">Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No students found. Try a different search.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>{student.studentId}</TableCell>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.grade}</TableCell>
                          <TableCell className="text-center">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editData[student.id] || 0}
                                onChange={(e) => handleScoreChange(student.id, e.target.value)}
                                className="w-20 mx-auto text-center"
                                min={0}
                                max={examData.max_score}
                              />
                            ) : (
                              <span>{student.score}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={getGradeColor(student.status)}>
                              {student.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Distribution</CardTitle>
                <CardDescription>
                  Number of students in each performance category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Students" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Score Frequency</CardTitle>
                <CardDescription>
                  Distribution of student scores across ranges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={scoreDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" name="Number of Students" stroke="#3b82f6" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Performance Analysis</CardTitle>
              <CardDescription>
                Understanding performance distribution and improvement areas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Exceeding Expectation (80-100%)</h3>
                  <p className="text-2xl font-bold text-green-600">{performanceData[0].value} students</p>
                  <p className="text-sm text-muted-foreground">
                    {((performanceData[0].value / students.length) * 100).toFixed(0)}% of class
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Meeting Expectation (50-79%)</h3>
                  <p className="text-2xl font-bold text-blue-600">{performanceData[1].value} students</p>
                  <p className="text-sm text-muted-foreground">
                    {((performanceData[1].value / students.length) * 100).toFixed(0)}% of class
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Below Expectation (0-49%)</h3>
                  <p className="text-2xl font-bold text-red-600">{performanceData[2].value + performanceData[3].value} students</p>
                  <p className="text-sm text-muted-foreground">
                    {(((performanceData[2].value + performanceData[3].value) / students.length) * 100).toFixed(0)}% of class
                  </p>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-2">Performance Insights</h3>
                <ul className="space-y-2 list-disc pl-5">
                  <li>
                    <span className="font-medium">{((performanceData[0].value / students.length) * 100).toFixed(0)}% of students</span> achieved excellent results, exceeding expectations for this exam.
                  </li>
                  <li>
                    <span className="font-medium">{((performanceData[1].value / students.length) * 100).toFixed(0)}% of students</span> met expectations, demonstrating adequate understanding of the material.
                  </li>
                  <li>
                    <span className="font-medium">{(((performanceData[2].value + performanceData[3].value) / students.length) * 100).toFixed(0)}% of students</span> performed below expectations, indicating a need for additional support in specific areas.
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exam Information</CardTitle>
              <CardDescription>
                Detailed information about this exam
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Name</h3>
                  <p>{examData.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Subject</h3>
                  <p>{examData.subject}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Academic Year</h3>
                  <p>{examData.academic_year}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Term</h3>
                  <p>{examData.term}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Exam Date</h3>
                  <p>{examData.exam_date}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Maximum Score</h3>
                  <p>{examData.max_score}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Passing Score</h3>
                  <p>{examData.passing_score}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Students Taken</h3>
                  <p>{students.length}</p>
                </div>
              </div>

              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-2">Performance Categories</h3>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-green-50 border border-green-100 rounded-md">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <span>Exceeding Expectation</span>
                    </div>
                    <span>80% - 100%</span>
                  </div>
                  <div className="flex justify-between p-2 bg-blue-50 border border-blue-100 rounded-md">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                      <span>Meeting Expectation</span>
                    </div>
                    <span>50% - 79%</span>
                  </div>
                  <div className="flex justify-between p-2 bg-amber-50 border border-amber-100 rounded-md">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                      <span>Approaching Expectation</span>
                    </div>
                    <span>40% - 49%</span>
                  </div>
                  <div className="flex justify-between p-2 bg-red-50 border border-red-100 rounded-md">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                      <span>Below Expectation</span>
                    </div>
                    <span>0% - 39%</span>
                  </div>
                </div>
              </div>

              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-2">Audit Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Created By</h3>
                    <p>{examData.created_by}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Created At</h3>
                    <p>{examData.created_at}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Updated By</h3>
                    <p>{examData.updated_by}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Updated
