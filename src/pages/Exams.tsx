import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart2, BookOpen, ChartBar, Edit, Eye, Plus, Search, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ExamWithScores } from "@/types/exam";
import { DataTable } from "@/components/data-display/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
const terms = ["Term 1", "Term 2", "Term 3"];
interface ExamFormData {
  name: string;
  academicYear: string;
  term: string;
  examDate: string;
  maxScore: string;
  passingScore: string;
  isActive: boolean;
}
export default function Exams() {
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [isAddExamOpen, setIsAddExamOpen] = useState(false);
  const [isEditExamOpen, setIsEditExamOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamWithScores | null>(null);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [formData, setFormData] = useState<ExamFormData>({
    name: "",
    academicYear: "",
    term: "Term 1",
    examDate: "",
    maxScore: "100",
    passingScore: "40",
    isActive: true
  });

  // Fetch academic years from settings
  const {
    data: academicYearsData = []
  } = useQuery({
    queryKey: ['academicYears'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('academic_years').select('*').order('start_date', {
        ascending: false
      });
      if (error) throw error;
      return data;
    }
  });

  // Get the current academic year
  const currentAcademicYear = academicYearsData.find(year => year.is_current);

  // Set default academic year when data is loaded
  useEffect(() => {
    if (currentAcademicYear) {
      setFormData(prev => ({
        ...prev,
        academicYear: currentAcademicYear.year_name
      }));
    }
  }, [currentAcademicYear]);

  // Get selected academic year dates for calendar constraints
  const selectedAcademicYearDates = academicYearsData.find(year => year.year_name === formData.academicYear);

  // Fetch exams
  const {
    data: exams = [],
    isLoading
  } = useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const {
        data: exams,
        error
      } = await supabase.from('exams').select(`
          *,
          student_exam_scores (
            score,
            did_not_sit
          )
        `);
      if (error) throw error;
      return exams.map(exam => ({
        ...exam,
        studentsTaken: exam.student_exam_scores?.filter((s: any) => !s.did_not_sit)?.length || 0,
        averageScore: exam.student_exam_scores?.filter((s: any) => !s.did_not_sit)?.length ? exam.student_exam_scores.filter((s: any) => !s.did_not_sit).reduce((acc: number, curr: any) => acc + curr.score, 0) / exam.student_exam_scores.filter((s: any) => !s.did_not_sit).length : 0,
        passRate: exam.student_exam_scores?.filter((s: any) => !s.did_not_sit)?.length ? exam.student_exam_scores.filter((s: any) => !s.did_not_sit && s.score >= exam.passing_score).length / exam.student_exam_scores.filter((s: any) => !s.did_not_sit).length * 100 : 0
      })) as ExamWithScores[];
    }
  });

  // Create exam mutation
  const createExam = useMutation({
    mutationFn: async (examData: ExamFormData) => {
      const {
        data,
        error
      } = await supabase.from('exams').insert({
        name: examData.name,
        academic_year: examData.academicYear,
        term: examData.term,
        exam_date: examData.examDate,
        max_score: parseInt(examData.maxScore),
        passing_score: parseInt(examData.passingScore),
        is_active: examData.isActive
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['exams']
      });
      setIsAddExamOpen(false);
      toast({
        title: "Exam Added",
        description: `${formData.name} has been added successfully.`
      });
      resetForm();
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
    mutationFn: async (examData: ExamFormData & {
      id: string;
    }) => {
      const {
        error
      } = await supabase.from('exams').update({
        name: examData.name,
        academic_year: examData.academicYear,
        term: examData.term,
        exam_date: examData.examDate,
        max_score: parseInt(examData.maxScore),
        passing_score: parseInt(examData.passingScore),
        is_active: examData.isActive
      }).eq('id', examData.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['exams']
      });
      setIsEditExamOpen(false);
      toast({
        title: "Exam Updated",
        description: "The exam has been updated successfully."
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
    mutationFn: async (id: string) => {
      const {
        error
      } = await supabase.from('exams').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['exams']
      });
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

  // Bulk delete exams mutation
  const bulkDeleteExams = useMutation({
    mutationFn: async (ids: string[]) => {
      const {
        error
      } = await supabase.from('exams').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['exams']
      });
      toast({
        title: "Exams Deleted",
        description: `${selectedExams.length} exam(s) have been deleted successfully.`
      });
      setSelectedExams([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Bulk toggle exam status mutation
  const bulkToggleExamStatus = useMutation({
    mutationFn: async ({
      ids,
      isActive
    }: {
      ids: string[];
      isActive: boolean;
    }) => {
      const {
        error
      } = await supabase.from('exams').update({
        is_active: isActive
      }).in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['exams']
      });
      toast({
        title: variables.isActive ? "Exams Activated" : "Exams Deactivated",
        description: `${selectedExams.length} exam(s) have been ${variables.isActive ? "activated" : "deactivated"} successfully.`
      });
      setSelectedExams([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      name,
      checked
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createExam.mutate(formData);
  };
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExam) {
      updateExam.mutate({
        ...formData,
        id: editingExam.id
      });
    }
  };
  const resetForm = () => {
    setFormData({
      name: "",
      academicYear: currentAcademicYear ? currentAcademicYear.year_name : "",
      term: "Term 1",
      examDate: "",
      maxScore: "100",
      passingScore: "40",
      isActive: true
    });
  };
  const handleEditExam = (exam: ExamWithScores) => {
    setEditingExam(exam);
    setFormData({
      name: exam.name,
      academicYear: exam.academic_year,
      term: exam.term,
      examDate: exam.exam_date,
      maxScore: exam.max_score.toString(),
      passingScore: exam.passing_score.toString(),
      isActive: exam.is_active ?? true
    });
    setIsEditExamOpen(true);
  };
  const handleRowSelectionChange = (ids: string[]) => {
    setSelectedExams(ids);
  };

  // Define bulk actions
  const bulkActions = [{
    label: "Delete Selected",
    action: (ids: string[]) => bulkDeleteExams.mutate(ids)
  }, {
    label: "Deactivate Selected",
    action: (ids: string[]) => bulkToggleExamStatus.mutate({
      ids,
      isActive: false
    })
  }, {
    label: "Activate Selected",
    action: (ids: string[]) => bulkToggleExamStatus.mutate({
      ids,
      isActive: true
    })
  }];

  // Define table columns
  const columns: ColumnDef<ExamWithScores>[] = [{
    id: "select",
    header: ({
      table
    }) => <Checkbox checked={table.getIsAllPageRowsSelected() || table.getIsSomePageRowsSelected() && "indeterminate" as any} onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)} aria-label="Select all" />,
    cell: ({
      row
    }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={value => row.toggleSelected(!!value)} aria-label="Select row" onClick={e => e.stopPropagation()} />,
    enableSorting: false,
    enableHiding: false
  }, {
    accessorKey: "name",
    header: "Name",
    cell: ({
      row
    }) => <span className="font-medium text-primary hover:underline">
        {row.original.name}
      </span>
  }, {
    accessorKey: "term",
    header: "Term"
  }, {
    accessorKey: "academic_year",
    header: "Academic Year"
  }, {
    accessorKey: "exam_date",
    header: "Exam Date",
    cell: ({
      row
    }) => format(new Date(row.original.exam_date), "PPP")
  }, {
    accessorKey: "studentsTaken",
    header: "Students Taken"
  }, {
    accessorKey: "averageScore",
    header: "Average",
    cell: ({
      row
    }) => `${row.original.averageScore?.toFixed(1)}%`
  }, {
    accessorKey: "status",
    header: "Status",
    cell: ({
      row
    }) => <div className={`px-2 py-1 rounded-full text-xs font-medium inline-block
          ${row.original.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {row.original.is_active ? 'Active' : 'Inactive'}
        </div>
  }, {
    id: "actions",
    cell: ({
      row
    }) => <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={e => {
          e.stopPropagation();
          navigate(`/exams/${row.original.id}`);
        }}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={e => {
          e.stopPropagation();
          handleEditExam(row.original);
        }}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={e => {
          e.stopPropagation();
          deleteExam.mutate(row.original.id);
        }}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
  }];

  // Handle row click to navigate to exam details
  const handleRowClick = (exam: ExamWithScores) => {
    navigate(`/exams/${exam.id}`);
  };

  // Filter exams based on search term and filters
  const filteredExams = exams.filter(exam => (selectedYear ? exam.academic_year === selectedYear : true) && (selectedTerm ? exam.term === selectedTerm : true) && (searchTerm ? exam.name.toLowerCase().includes(searchTerm.toLowerCase()) : true));

  // Calculate statistics
  const totalExams = exams.length;
  const activeExams = exams.filter(exam => exam.is_active).length;
  const totalStudentsTaken = exams.reduce((acc, exam) => acc + (exam.studentsTaken || 0), 0);
  const highestScore = exams.length > 0 ? Math.max(...exams.map(exam => exam.averageScore || 0)) : 0;
  const averagePassRate = exams.length > 0 ? exams.reduce((acc, exam) => acc + (exam.passRate || 0), 0) / exams.length : 0;
  return <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-left">Exams</h1>
          <p className="text-muted-foreground">Manage and track student examinations</p>
        </div>
        <Dialog open={isAddExamOpen} onOpenChange={setIsAddExamOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Add New Exam</DialogTitle>
              <DialogDescription>
                Enter the details for the new exam. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-5 py-4">
                <div className="col-span-2">
                  <Label htmlFor="name" className="mb-3 block">Exam Name</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Math Midterm Exam" required />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="academicYear" className="mb-3 block">Academic Year</Label>
                  <Select value={formData.academicYear} onValueChange={value => setFormData(prev => ({
                  ...prev,
                  academicYear: value
                }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Academic Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYearsData.map(year => <SelectItem key={year.id} value={year.year_name || "default"}>
                          {year.year_name} {year.is_current ? "(Current)" : ""}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  <Label htmlFor="term" className="mb-3 block">Term</Label>
                  <Select value={formData.term} onValueChange={value => setFormData(prev => ({
                  ...prev,
                  term: value
                }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Term" />
                    </SelectTrigger>
                    <SelectContent>
                      {terms.map(term => <SelectItem key={term} value={term || "term1"}>
                          {term}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  <Label htmlFor="examDate" className="mb-3 block">Exam Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formData.examDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.examDate ? format(new Date(formData.examDate), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={formData.examDate ? new Date(formData.examDate) : undefined} onSelect={date => {
                      if (date) {
                        setFormData(prev => ({
                          ...prev,
                          examDate: date.toISOString().split('T')[0]
                        }));
                      }
                    }} disabled={date => {
                      if (!selectedAcademicYearDates) return false;
                      const startDate = new Date(selectedAcademicYearDates.start_date);
                      const endDate = new Date(selectedAcademicYearDates.end_date);
                      return date < startDate || date > endDate;
                    }} initialFocus className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="col-span-1">
                  <Label htmlFor="maxScore" className="mb-3 block">Maximum Score</Label>
                  <Input id="maxScore" name="maxScore" type="number" value={formData.maxScore} onChange={handleInputChange} min="1" required />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="passingScore" className="mb-3 block">Passing Score</Label>
                  <Input id="passingScore" name="passingScore" type="number" value={formData.passingScore} onChange={handleInputChange} min="1" max={formData.maxScore} required />
                </div>
                <div className="col-span-1 flex items-center space-x-2">
                  <Checkbox id="isActive" name="isActive" checked={formData.isActive} onCheckedChange={checked => {
                  setFormData(prev => ({
                    ...prev,
                    isActive: checked === true
                  }));
                }} />
                  <Label htmlFor="isActive" className="mb-0">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddExamOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Exam</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex space-x-4 mb-4">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Academic Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {academicYearsData.map(year => <SelectItem key={year.id} value={year.year_name || "default_year"}>{year.year_name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={selectedTerm} onValueChange={setSelectedTerm}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Term" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Terms</SelectItem>
            {terms.map(term => <SelectItem key={term} value={term || "default_term"}>{term}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExams}</div>
            <p className="text-xs text-muted-foreground">
              {activeExams} currently active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Average Pass Rate</CardTitle>
            <BarChart2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averagePassRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Across all active exams
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Highest Exam Average</CardTitle>
            <ChartBar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highestScore.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              From {totalStudentsTaken} total attempts
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-left">Exams</CardTitle>
          <CardDescription className="text-left">
            Manage all exams in the system. Click on an exam to see details and student scores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          

          <DataTable columns={columns} data={filteredExams} isLoading={isLoading} searchColumn="name" onRowSelectionChange={handleRowSelectionChange} bulkActions={bulkActions} onRowClick={handleRowClick} />
        </CardContent>
      </Card>

      {/* Edit Exam Dialog */}
      <Dialog open={isEditExamOpen} onOpenChange={setIsEditExamOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Exam</DialogTitle>
            <DialogDescription>
              Update the details for this exam. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid grid-cols-2 gap-5 py-4">
              <div className="col-span-2">
                <Label htmlFor="name" className="mb-3 block">Exam Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Math Midterm Exam" required />
              </div>
              <div className="col-span-1">
                <Label htmlFor="academicYear" className="mb-3 block">Academic Year</Label>
                <Select value={formData.academicYear} onValueChange={value => setFormData(prev => ({
                ...prev,
                academicYear: value
              }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Academic Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYearsData.map(year => <SelectItem key={year.id} value={year.year_name || "default_year_edit"}>
                        {year.year_name} {year.is_current ? "(Current)" : ""}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1">
                <Label htmlFor="term" className="mb-3 block">Term</Label>
                <Select value={formData.term} onValueChange={value => setFormData(prev => ({
                ...prev,
                term: value
              }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Term" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.map(term => <SelectItem key={term} value={term || "default_term_edit"}>
                        {term}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1">
                <Label htmlFor="examDate" className="mb-3 block">Exam Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formData.examDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.examDate ? format(new Date(formData.examDate), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={formData.examDate ? new Date(formData.examDate) : undefined} onSelect={date => {
                    if (date) {
                      setFormData(prev => ({
                        ...prev,
                        examDate: date.toISOString().split('T')[0]
                      }));
                    }
                  }} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="col-span-1">
                <Label htmlFor="maxScore" className="mb-3 block">Maximum Score</Label>
                <Input id="maxScore" name="maxScore" type="number" value={formData.maxScore} onChange={handleInputChange} min="1" required />
              </div>
              <div className="col-span-1">
                <Label htmlFor="passingScore" className="mb-3 block">Passing Score</Label>
                <Input id="passingScore" name="passingScore" type="number" value={formData.passingScore} onChange={handleInputChange} min="1" max={formData.maxScore} required />
              </div>
              <div className="col-span-1 flex items-center space-x-2">
                <Checkbox id="isActive" name="isActive" checked={formData.isActive} onCheckedChange={checked => {
                setFormData(prev => ({
                  ...prev,
                  isActive: checked === true
                }));
              }} />
                <Label htmlFor="isActive" className="mb-0">Active</Label>
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
    </div>;
}
