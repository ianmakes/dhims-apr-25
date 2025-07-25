import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { AcademicYear } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { CopyIcon, PlusCircle, Edit, Trash2, Star, AlertTriangle, Loader2, Info, MoreHorizontal, ArrowRight, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { logCreate, logUpdate, logDelete, logSystem } from "@/utils/auditLog";

// Update the schema to validate single-year format
const academicYearSchema = z.object({
  year_name: z.string().min(1, {
    message: "Academic year name is required"
  }).regex(/^\d{4}$/, {
    message: "Year must be a 4-digit year (e.g. 2024)"
  }),
  is_current: z.boolean().default(false),
  start_date: z.string().min(1, {
    message: "Start date is required"
  }),
  end_date: z.string().min(1, {
    message: "End date is required"
  })
}).refine(data => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end > start;
}, {
  message: "End date must be after start date",
  path: ["end_date"]
});
type AcademicYearFormValues = z.infer<typeof academicYearSchema>;

// Update the schema for copying academic year data
const copyYearSchema = z.object({
  sourceYearId: z.string().uuid({
    message: "Please select a source academic year"
  }),
  destinationYearId: z.string().uuid().optional(),
  createNewYear: z.boolean().default(false),
  newYearName: z.string().regex(/^\d{4}$/, {
    message: "Year must be a 4-digit year (e.g. 2024)"
  }).optional(),
  newStartDate: z.string().optional(),
  newEndDate: z.string().optional(),
  copyStudentData: z.boolean().default(true),
  copyExamTemplates: z.boolean().default(true),
  copySponsorship: z.boolean().default(true)
}).superRefine((data, ctx) => {
  if (data.createNewYear) {
    if (!data.newYearName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "New academic year name is required",
        path: ["newYearName"]
      });
    }
    if (!data.newStartDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start date is required",
        path: ["newStartDate"]
      });
    }
    if (!data.newEndDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date is required",
        path: ["newEndDate"]
      });
    }
    if (data.newStartDate && data.newEndDate) {
      const start = new Date(data.newStartDate);
      const end = new Date(data.newEndDate);
      if (end <= start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End date must be after start date",
          path: ["newEndDate"]
        });
      }
    }
  } else if (!data.destinationYearId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please select a destination academic year",
      path: ["destinationYearId"]
    });
  }
});
type CopyYearFormValues = z.infer<typeof copyYearSchema>;

// Schema for grade promotion
const gradePromotionSchema = z.object({
  gradePromotionMap: z.record(z.string(), z.string()),
});
type GradePromotionFormValues = z.infer<typeof gradePromotionSchema>;

export default function AcademicYearsSettings() {
  const { toast } = useToast();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [yearToSetCurrent, setYearToSetCurrent] = useState<AcademicYear | null>(null);
  const [copyProgress, setCopyProgress] = useState(0);
  const [isCopying, setIsCopying] = useState(false);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<AcademicYear | null>(null);
  const [copyStep, setCopyStep] = useState(1);
  const [studentGrades, setStudentGrades] = useState<string[]>([]);
  const [isPromotingGrades, setIsPromotingGrades] = useState(false);
  
  const form = useForm<AcademicYearFormValues>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: {
      year_name: "",
      is_current: false,
      start_date: "",
      end_date: ""
    }
  });
  
  const copyForm = useForm<CopyYearFormValues>({
    resolver: zodResolver(copyYearSchema),
    defaultValues: {
      sourceYearId: "",
      destinationYearId: "",
      createNewYear: false,
      newYearName: "",
      newStartDate: "",
      newEndDate: "",
      copyStudentData: true,
      copyExamTemplates: true,
      copySponsorship: true
    }
  });

  const gradePromotionForm = useForm<GradePromotionFormValues>({
    resolver: zodResolver(gradePromotionSchema),
    defaultValues: {
      gradePromotionMap: {},
    }
  });
  
  useEffect(() => {
    fetchAcademicYears();
    fetchStudentGrades();
  }, []);
  
  useEffect(() => {
    if (!isDialogOpen) {
      setEditingYear(null);
      form.reset({
        year_name: "",
        is_current: false,
        start_date: "",
        end_date: ""
      });
    }
  }, [isDialogOpen, form]);
  
  useEffect(() => {
    if (editingYear) {
      form.reset({
        year_name: editingYear.year_name,
        is_current: editingYear.is_current,
        start_date: editingYear.start_date.split('T')[0],
        end_date: editingYear.end_date.split('T')[0]
      });
    }
  }, [editingYear, form]);
  
  useEffect(() => {
    const current = academicYears.find(year => year.is_current);
    setCurrentAcademicYear(current || null);
  }, [academicYears]);

  useEffect(() => {
    if (studentGrades.length > 0) {
      const defaultGradeMap: Record<string, string> = {};
      studentGrades.forEach(grade => {
        if (grade === 'Grade 12') {
          defaultGradeMap[grade] = 'Alumni';
        } else if (grade.startsWith('Grade ')) {
          const gradeNum = parseInt(grade.replace('Grade ', ''));
          defaultGradeMap[grade] = `Grade ${gradeNum + 1}`;
        } else {
          defaultGradeMap[grade] = grade; // Keep same if not a numbered grade
        }
      });
      gradePromotionForm.reset({
        gradePromotionMap: defaultGradeMap
      });
    }
  }, [studentGrades, gradePromotionForm]);
  
  const fetchAcademicYears = async () => {
    setIsLoading(true);
    try {
      const { data: academicYearsData, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('year_name');
        
      if (error) throw error;
      setAcademicYears(academicYearsData as AcademicYear[]);
    } catch (error: any) {
      console.error("Error fetching academic years:", error);
      toast({
        title: "Error",
        description: `Failed to fetch academic years: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentGrades = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('current_grade')
        .not('current_grade', 'is', null)
        .order('current_grade');
        
      if (error) throw error;
      
      if (data) {
        // Extract unique grades
        const uniqueGrades = Array.from(new Set(data.map(s => s.current_grade)))
          .filter(Boolean)
          .sort((a, b) => {
            // Sort grades numerically
            const aMatch = a.match(/Grade (\d+)/);
            const bMatch = b.match(/Grade (\d+)/);
            if (aMatch && bMatch) {
              return parseInt(aMatch[1]) - parseInt(bMatch[1]);
            }
            return a.localeCompare(b);
          });
        
        setStudentGrades(uniqueGrades);
      }
    } catch (error: any) {
      console.error("Error fetching student grades:", error);
      toast({
        title: "Error",
        description: `Failed to fetch student grades: ${error.message}`,
        variant: "destructive"
      });
    }
  };
  
  const handleSubmit = async (values: AcademicYearFormValues) => {
    try {
      if (editingYear) {
        // Update existing academic year
        const { error } = await supabase
          .from('academic_years')
          .update({
            year_name: values.year_name,
            start_date: values.start_date,
            end_date: values.end_date,
            is_current: values.is_current,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingYear.id);
          
        if (error) throw error;
        
        await logUpdate('academic_year', editingYear.id, `Updated academic year ${values.year_name}`);
        
        toast({
          title: "Updated",
          description: `Academic year ${values.year_name} has been updated.`
        });
      } else {
        // Create new academic year
        const { data, error } = await supabase
          .from('academic_years')
          .insert([{
            year_name: values.year_name,
            start_date: values.start_date,
            end_date: values.end_date,
            is_current: values.is_current
          }])
          .select()
          .single();
          
        if (error) throw error;
        
        await logCreate('academic_year', data.id, `Created academic year ${values.year_name}`);
        
        toast({
          title: "Created",
          description: `Academic year ${values.year_name} has been created.`
        });
      }
      
      setIsDialogOpen(false);
      await fetchAcademicYears();
      
      // If this year was set as current, reload the app
      if (values.is_current) {
        window.location.reload();
      }
    } catch (error: any) {
      console.error("Error saving academic year:", error);
      toast({
        title: "Error",
        description: `Failed to save academic year: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handlePromoteGrades = async (values: GradePromotionFormValues) => {
    setIsPromotingGrades(true);
    
    try {
      const copyFormValues = copyForm.getValues();
      
      // Update student grades based on the promotion mapping
      for (const [currentGrade, newGrade] of Object.entries(values.gradePromotionMap)) {
        const { error } = await supabase
          .from('students')
          .update({ current_grade: newGrade })
          .eq('current_grade', currentGrade);
          
        if (error) throw error;
      }
      
      await logSystem('grade_promotion', 'students', 'Promoted student grades for new academic year');
      
      // Now proceed with the copy operation
      await handleCopyYear(copyFormValues);
      
      setIsCopyDialogOpen(false);
      setCopyStep(1);
      copyForm.reset();
      
      toast({
        title: "Success",
        description: "Student grades have been promoted and data has been copied successfully."
      });
      
    } catch (error: any) {
      console.error("Error promoting grades:", error);
      toast({
        title: "Error",
        description: `Failed to promote grades: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsPromotingGrades(false);
    }
  };
  
  const handleNextStep = () => {
    // Validate the form before proceeding to next step
    const values = copyForm.getValues();
    
    // Check if source year is selected
    if (!values.sourceYearId) {
      copyForm.setError("sourceYearId", {
        type: "manual",
        message: "Please select a source academic year"
      });
      return;
    }
    
    // Check destination requirements
    if (values.createNewYear) {
      if (!values.newYearName || !values.newStartDate || !values.newEndDate) {
        if (!values.newYearName) {
          copyForm.setError("newYearName", {
            type: "manual", 
            message: "New academic year name is required"
          });
        }
        if (!values.newStartDate) {
          copyForm.setError("newStartDate", {
            type: "manual",
            message: "Start date is required"
          });
        }
        if (!values.newEndDate) {
          copyForm.setError("newEndDate", {
            type: "manual", 
            message: "End date is required"
          });
        }
        return;
      }
      
      // Validate date range
      if (values.newStartDate && values.newEndDate) {
        const start = new Date(values.newStartDate);
        const end = new Date(values.newEndDate);
        if (end <= start) {
          copyForm.setError("newEndDate", {
            type: "manual",
            message: "End date must be after start date"
          });
          return;
        }
      }
    } else if (!values.destinationYearId) {
      copyForm.setError("destinationYearId", {
        type: "manual",
        message: "Please select a destination academic year"
      });
      return;
    }
    
    // If validation passes, proceed to next step
    setCopyStep(2);
  };
  
  const handleCopyYear = async (values: CopyYearFormValues) => {
    setIsCopying(true);
    setCopyProgress(0);
    
    try {
      const sourceYear = academicYears.find(year => year.id === values.sourceYearId);
      if (!sourceYear) {
        throw new Error("Source academic year not found");
      }
      
      setCopyProgress(10);
      let destinationYearId: string;
      let destinationYearName: string;
      
      if (values.createNewYear) {
        if (!values.newYearName || !values.newStartDate || !values.newEndDate) {
          throw new Error("New year details are missing");
        }
        
        const { data, error } = await supabase
          .from('academic_years')
          .insert([{
            year_name: values.newYearName,
            is_current: false,
            start_date: values.newStartDate,
            end_date: values.newEndDate
          }])
          .select('id, year_name')
          .single();
          
        if (error) throw error;
        destinationYearId = data.id;
        destinationYearName = data.year_name;
        
        await logCreate('academic_year', destinationYearId, `Created new academic year ${destinationYearName} during copy operation`);
        setCopyProgress(20);
      } else {
        if (!values.destinationYearId) {
          throw new Error("Destination year not selected");
        }
        destinationYearId = values.destinationYearId;
        const destYear = academicYears.find(year => year.id === destinationYearId);
        destinationYearName = destYear?.year_name || "Unknown";
        setCopyProgress(20);
      }
      
      let copiedItemsCount = 0;
      
      if (values.copyStudentData) {
        // Copy students with updated academic year
        const { data: sourceStudents, error: studentsError } = await supabase
          .from('students')
          .select('*')
          .eq('academic_year_recorded', sourceYear.year_name);
          
        if (studentsError) throw studentsError;
        
        if (sourceStudents && sourceStudents.length > 0) {
          const studentsToInsert = sourceStudents.map(student => ({
            ...student,
            id: undefined, // Let the DB generate new ID
            academic_year_recorded: destinationYearName,
            record_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          
          const { error: insertError } = await supabase
            .from('students')
            .insert(studentsToInsert);
            
          if (insertError) throw insertError;
          copiedItemsCount += sourceStudents.length;
        }
        
        setCopyProgress(40);
      }
      
      if (values.copyExamTemplates) {
        // Copy exams with updated academic year
        const { data: sourceExams, error: examsError } = await supabase
          .from('exams')
          .select('*')
          .eq('academic_year', sourceYear.year_name);
          
        if (examsError) throw examsError;
        
        if (sourceExams && sourceExams.length > 0) {
          const examsToInsert = sourceExams.map(exam => ({
            ...exam,
            id: undefined, // Let the DB generate new ID
            academic_year: destinationYearName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          
          const { error: insertError } = await supabase
            .from('exams')
            .insert(examsToInsert);
            
          if (insertError) throw insertError;
          copiedItemsCount += sourceExams.length;
        }
        
        setCopyProgress(60);
      }
      
      if (values.copySponsorship) {
        // Copy sponsorship relationships - sponsors should remain the same, 
        // but we need to update student references if students were copied
        const { data: sourceSponsors, error: sponsorsError } = await supabase
          .from('sponsors')
          .select('*');
          
        if (sponsorsError) throw sponsorsError;
        
        if (sourceSponsors && sourceSponsors.length > 0) {
          // For simplicity, we'll just log this as copied since sponsors are not year-specific
          copiedItemsCount += sourceSponsors.length;
        }
        
        setCopyProgress(80);
      }
      
      setCopyProgress(95);
      
      await logSystem(
        'data_copy', 
        destinationYearId, 
        `Copied data from ${sourceYear.year_name} to ${destinationYearName}. Items copied: ${copiedItemsCount}. Student data: ${values.copyStudentData}, Exams: ${values.copyExamTemplates}, Sponsorship: ${values.copySponsorship}`
      );
      
      setCopyProgress(100);
      await fetchAcademicYears();
      
      toast({
        title: "Data Copied Successfully",
        description: `Data has been copied from ${sourceYear.year_name} to ${destinationYearName}. ${copiedItemsCount} items copied.`
      });
      
      // Reset copying state
      setIsCopying(false);
      
    } catch (error: any) {
      console.error("Error copying academic year data:", error);
      toast({
        title: "Error",
        description: `Failed to copy data: ${error.message}`,
        variant: "destructive"
      });
      setIsCopying(false);
    }
  };

  const handleDelete = async (academicYear: AcademicYear) => {
    try {
      const { error } = await supabase
        .from('academic_years')
        .delete()
        .eq('id', academicYear.id);
        
      if (error) throw error;
      
      await logDelete('academic_year', academicYear.id, `Deleted academic year ${academicYear.year_name}`);
      
      toast({
        title: "Deleted",
        description: `Academic year ${academicYear.year_name} has been deleted.`
      });
      
      await fetchAcademicYears();
    } catch (error: any) {
      console.error("Error deleting academic year:", error);
      toast({
        title: "Error",
        description: `Failed to delete academic year: ${error.message}`,
        variant: "destructive"
      });
    }
  };
  
  const handleSetCurrent = async () => {
    if (!yearToSetCurrent) return;
    
    try {
      const { error } = await supabase
        .from('academic_years')
        .update({
          is_current: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', yearToSetCurrent.id);
        
      if (error) throw error;
      
      await logSystem('academic_year_change', yearToSetCurrent.id, `Set ${yearToSetCurrent.year_name} as current academic year`);
      
      toast({
        title: "Current Year Updated",
        description: `${yearToSetCurrent.year_name} is now set as the current academic year. Student grades have been automatically promoted to the next level.`
      });
      
      setYearToSetCurrent(null);
      await fetchAcademicYears();
      
      // Reload the app to apply the new academic year context
      window.location.reload();
    } catch (error: any) {
      console.error("Error updating current academic year:", error);
      toast({
        title: "Error",
        description: `Failed to update current academic year: ${error.message}`,
        variant: "destructive"
      });
    }
  };
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy');
  };
  
  const watchCreateNewYear = copyForm.watch("createNewYear");
  const watchSourceYearId = copyForm.watch("sourceYearId");

  const getAllGrades = () => {
    return [
      "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", 
      "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", 
      "Grade 11", "Grade 12", "Alumni"
    ];
  };

  const handleCopyDialogClose = () => {
    setCopyStep(1);
    setIsCopyDialogOpen(false);
    copyForm.reset();
  };

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="h-full">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-left">Academic Years</CardTitle>
                <CardDescription className="text-left mt-1">
                  Manage academic years and set the current year.
                </CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Year
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingYear ? "Edit Academic Year" : "Add New Academic Year"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingYear ? "Update the details of this academic year." : "Create a new academic year for the school."}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="year_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Academic Year</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g. 2024" />
                            </FormControl>
                            <FormDescription>
                              Enter a 4-digit year (e.g. 2024)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="start_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="end_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="is_current"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Set as Current Academic Year</FormLabel>
                              <FormDescription>
                                This will automatically update all student grades to the next level.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">
                          {editingYear ? "Update" : "Create"} Academic Year
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : academicYears.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6">
                <p className="text-muted-foreground mb-4">No academic years found</p>
                <Button onClick={() => setIsDialogOpen(true)} variant="outline" size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create your first academic year
                </Button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left w-1/4">Academic Year</TableHead>
                      <TableHead className="text-left w-1/6">Start Date</TableHead>
                      <TableHead className="text-left w-1/6">End Date</TableHead>
                      <TableHead className="text-left w-1/6">Status</TableHead>
                      <TableHead className="text-right w-1/12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {academicYears.map(year => (
                      <TableRow key={year.id}>
                        <TableCell className="font-medium text-left">{year.year_name}</TableCell>
                        <TableCell className="text-left whitespace-nowrap">{formatDate(year.start_date)}</TableCell>
                        <TableCell className="text-left whitespace-nowrap">{formatDate(year.end_date)}</TableCell>
                        <TableCell className="text-left">
                          {year.is_current ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              <Star className="mr-1 h-3 w-3" />
                              Current
                            </span>
                          ) : "Inactive"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!year.is_current && (
                                <DropdownMenuItem 
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    setYearToSetCurrent(year);
                                  }}
                                >
                                  <Star className="mr-2 h-4 w-4" />
                                  <span>Set as Current</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setEditingYear(year);
                                  setIsDialogOpen(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                              {!year.is_current && (
                                <DropdownMenuItem 
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    handleDelete(year);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="h-full">
          <CardHeader className="border-b">
            <CardTitle className="text-left">Data Management</CardTitle>
            <CardDescription className="text-left mt-1">
              Copy data between academic years
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold mb-2 text-left">Current Academic Year</h4>
                <div className="bg-muted p-4 rounded-md">
                  {currentAcademicYear ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-green-600 mr-2" />
                          <span className="text-green-700 font-medium">{currentAcademicYear.year_name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 text-left">
                          {formatDate(currentAcademicYear.start_date)} - {formatDate(currentAcademicYear.end_date)}
                        </p>
                      </div>
                      <div className="bg-green-100 px-3 py-1 rounded text-green-800 text-sm font-medium">
                        Active
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center text-amber-500">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      <span>No current year set</span>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-left">Copy Year Data</h4>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsCopyDialogOpen(true)}
                  >
                    <CopyIcon className="mr-2 h-4 w-4" />
                    Copy Year Data
                  </Button>
                  <Dialog open={isCopyDialogOpen} onOpenChange={handleCopyDialogClose}>
                    <DialogContent className="sm:max-w-[550px]">
                      <DialogHeader>
                        <DialogTitle>
                          {copyStep === 1 ? "Copy Academic Year Data" : "Move Students to Next Grade"}
                        </DialogTitle>
                        <DialogDescription>
                          {copyStep === 1 
                            ? "Copy data from one academic year to another. Select what data you want to copy."
                            : "Review and adjust the grade levels students will be moved to for the new academic year."
                          }
                        </DialogDescription>
                      </DialogHeader>

                      {copyStep === 1 ? (
                        <Form {...copyForm}>
                          <div className="space-y-4">
                            <FormField
                              control={copyForm.control}
                              name="sourceYearId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Source Academic Year</FormLabel>
                                  <Select value={field.value} onValueChange={field.onChange} disabled={isCopying}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select source academic year" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {academicYears.map(year => (
                                        <SelectItem key={year.id} value={year.id}>
                                          {year.year_name} {year.is_current && "(Current)"}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    Select the academic year from which to copy data.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={copyForm.control}
                              name="createNewYear"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isCopying} />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>Create new academic year</FormLabel>
                                    <FormDescription>
                                      Create a new academic year as the destination.
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              )}
                            />

                            {watchCreateNewYear ? (
                              <>
                                <FormField
                                  control={copyForm.control}
                                  name="newYearName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>New Academic Year</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="e.g. 2024" disabled={isCopying} />
                                      </FormControl>
                                      <FormDescription>
                                        Enter a 4-digit year (e.g. 2024)
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={copyForm.control}
                                    name="newStartDate"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Start Date</FormLabel>
                                        <FormControl>
                                          <Input type="date" {...field} disabled={isCopying} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={copyForm.control}
                                    name="newEndDate"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>End Date</FormLabel>
                                        <FormControl>
                                          <Input type="date" {...field} disabled={isCopying} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </>
                            ) : (
                              <FormField
                                control={copyForm.control}
                                name="destinationYearId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Destination Academic Year</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange} disabled={isCopying}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select destination academic year" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {academicYears
                                          .filter(year => year.id !== watchSourceYearId)
                                          .map(year => (
                                            <SelectItem key={year.id} value={year.id}>
                                              {year.year_name} {year.is_current && "(Current)"}
                                            </SelectItem>
                                          ))}
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>
                                      Select the academic year to which data will be copied.
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}
                            
                            <div className="space-y-4 border rounded-md p-4">
                              <h4 className="font-medium text-left">What data to copy?</h4>
                              
                              <FormField
                                control={copyForm.control}
                                name="copyStudentData"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isCopying} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel>Student Data</FormLabel>
                                      <FormDescription>
                                        Copy student data (excluding grades and scores).
                                      </FormDescription>
                                    </div>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={copyForm.control}
                                name="copyExamTemplates"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isCopying} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel>Exam Templates</FormLabel>
                                      <FormDescription>
                                        Copy exam templates without results.
                                      </FormDescription>
                                    </div>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={copyForm.control}
                                name="copySponsorship"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isCopying} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel>Sponsorship Relationships</FormLabel>
                                      <FormDescription>
                                        Copy student-sponsor relationships.
                                      </FormDescription>
                                    </div>
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <DialogFooter>
                              <Button type="button" variant="outline" disabled={isCopying} onClick={() => setIsCopyDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button 
                                type="button" 
                                onClick={handleNextStep}
                                disabled={isCopying}
                              >
                                Next
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </DialogFooter>
                          </div>
                        </Form>
                      ) : (
                        <Form {...gradePromotionForm}>
                          <form onSubmit={gradePromotionForm.handleSubmit(handlePromoteGrades)} className="space-y-6">
                            <div className="border rounded-md p-4">
                              <h3 className="text-xl font-semibold mb-6 text-center">Move students to Next Grade</h3>
                              
                              <div className="grid grid-cols-[1fr_1fr] gap-6 mb-2">
                                <div className="font-medium text-base text-center">Current Grade</div>
                                <div className="font-medium text-base text-center">Move to Grade</div>
                              </div>
                              
                              <div className="space-y-4 max-h-[300px] overflow-auto pr-2">
                                {studentGrades.map(grade => (
                                  <div key={grade} className="grid grid-cols-[1fr_1fr] gap-6 items-center">
                                    <div className="text-base font-medium text-center">{grade}</div>
                                    <FormField
                                      control={gradePromotionForm.control}
                                      name={`gradePromotionMap.${grade}`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <Select 
                                            value={field.value} 
                                            onValueChange={field.onChange}
                                            disabled={isPromotingGrades}
                                          >
                                            <FormControl>
                                              <SelectTrigger className="h-10">
                                                <SelectValue placeholder="Select Grade" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                              {getAllGrades().map(gradeOption => (
                                                <SelectItem key={gradeOption} value={gradeOption}>
                                                  {gradeOption}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                ))}
                              </div>
                              
                              <div className="mt-6 bg-amber-50 p-4 rounded-md">
                                <div className="flex">
                                  <Info className="h-5 w-5 text-amber-500 mt-1 mr-2 flex-shrink-0" />
                                  <p className="text-base text-amber-700">
                                    <span className="font-semibold">Notes:</span> Grade 12 students will be moved to alumni because grades end at Grade 12.
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <DialogFooter>
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setCopyStep(1)} 
                                disabled={isPromotingGrades}
                              >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                              </Button>
                              <Button 
                                type="submit" 
                                variant="default"
                                disabled={isPromotingGrades}
                              >
                                {isPromotingGrades ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                  </>
                                ) : "Save"}
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="rounded-md bg-blue-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Info className="h-5 w-5 text-blue-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800 text-left">Important Information</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <ul className="list-disc pl-5 mt-1 space-y-1 text-left">
                          <li>Setting a current academic year filters all data across the application</li>
                          <li>New records are automatically associated with the current academic year</li>
                          <li>When changing the current year, student grades are automatically promoted</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <AlertDialog open={!!yearToSetCurrent} onOpenChange={(open) => !open && setYearToSetCurrent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set as Current Academic Year</AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-2">
                Are you sure you want to set {yearToSetCurrent?.year_name} as the current academic year?
              </p>
              <div className="flex items-center text-amber-500 bg-amber-50 p-3 rounded-md mb-2">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <p className="text-sm">
                  This will automatically update all student grades to the next level.
                </p>
              </div>
              <p>This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setYearToSetCurrent(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSetCurrent}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
