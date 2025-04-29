
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, Star, AlertTriangle, Loader2, CopyIcon, BarChart } from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Types for Academic Year
type AcademicYear = {
  id: string;
  year_name: string; // Now just a single year like "2024"
  is_current: boolean;
  start_date: string; // Will be January 1st of the year
  end_date: string;   // Will be December 31st of the year
  created_at?: string;
  updated_at?: string;
};

// Types for stats
type YearStats = {
  year: string;
  students_count: number;
  sponsors_count: number;
};

const academicYearSchema = z.object({
  year_name: z.string().min(1, {
    message: "Academic year is required"
  }).regex(/^\d{4}$/, {
    message: "Year must be a 4-digit year (e.g., 2024)"
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

// Schema for copying academic year data
const copyYearSchema = z.object({
  sourceYearId: z.string().uuid({
    message: "Please select a source academic year"
  }),
  destinationYearId: z.string().uuid().optional(),
  createNewYear: z.boolean().default(false),
  newYearName: z.string().regex(/^\d{4}$/, {
    message: "Year must be a 4-digit year (e.g., 2024)"
  }).optional(),
  newStartDate: z.string().optional(),
  newEndDate: z.string().optional(),
  copyStudentData: z.boolean().default(true),
  copyExamTemplates: z.boolean().default(true),
  copySponsorship: z.boolean().default(true),
  autoPromoteStudents: z.boolean().default(false),
  promoteStudentGrades: z.boolean().default(false)
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

// CBC Grade progression mapping
const cbcGradeProgression: Record<string, { grade: string, category: string }> = {
  "Playgroup": { grade: "PP1", category: "Pre-Primary" },
  "PP1": { grade: "PP2", category: "Pre-Primary" },
  "PP2": { grade: "Grade 1", category: "Lower Primary" },
  "Grade 1": { grade: "Grade 2", category: "Lower Primary" },
  "Grade 2": { grade: "Grade 3", category: "Lower Primary" },
  "Grade 3": { grade: "Grade 4", category: "Upper Primary" },
  "Grade 4": { grade: "Grade 5", category: "Upper Primary" },
  "Grade 5": { grade: "Grade 6", category: "Upper Primary" },
  "Grade 6": { grade: "Grade 7", category: "Junior Secondary" },
  "Grade 7": { grade: "Grade 8", category: "Junior Secondary" },
  "Grade 8": { grade: "Grade 9", category: "Junior Secondary" },
  "Grade 9": { grade: "Grade 10", category: "Senior Secondary" },
  "Grade 10": { grade: "Grade 11", category: "Senior Secondary" },
  "Grade 11": { grade: "Grade 12", category: "Senior Secondary" },
  "Grade 12": { grade: "Grade 12", category: "Senior Secondary" }, // No further progression
  "SNE": { grade: "SNE", category: "Special Needs Education" } // Stays in SNE
};

export default function AcademicYearsSettings() {
  const { toast } = useToast();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [yearStats, setYearStats] = useState<YearStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [yearToSetCurrent, setYearToSetCurrent] = useState<AcademicYear | null>(null);
  const [copyProgress, setCopyProgress] = useState(0);
  const [isCopying, setIsCopying] = useState(false);

  const form = useForm<AcademicYearFormValues>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: {
      year_name: new Date().getFullYear().toString(),
      is_current: false,
      start_date: `${new Date().getFullYear()}-01-01`,
      end_date: `${new Date().getFullYear()}-12-31`
    }
  });
  
  const copyForm = useForm<CopyYearFormValues>({
    resolver: zodResolver(copyYearSchema),
    defaultValues: {
      sourceYearId: "",
      destinationYearId: "",
      createNewYear: false,
      newYearName: (new Date().getFullYear() + 1).toString(),
      newStartDate: `${new Date().getFullYear() + 1}-01-01`,
      newEndDate: `${new Date().getFullYear() + 1}-12-31`,
      copyStudentData: true,
      copyExamTemplates: true,
      copySponsorship: true,
      autoPromoteStudents: false,
      promoteStudentGrades: false
    }
  });

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (academicYears.length > 0) {
      fetchYearStatistics();
    }
  }, [academicYears]);

  useEffect(() => {
    if (!isDialogOpen) {
      setEditingYear(null);
      form.reset({
        year_name: new Date().getFullYear().toString(),
        is_current: false,
        start_date: `${new Date().getFullYear()}-01-01`,
        end_date: `${new Date().getFullYear()}-12-31`
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

  const fetchAcademicYears = async () => {
    setIsLoading(true);
    try {
      const { data: academicYearsData, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('year_name', { ascending: false });
      
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

  const fetchYearStatistics = async () => {
    setIsStatsLoading(true);
    try {
      const stats: YearStats[] = [];
      
      // For each academic year, fetch student and sponsor counts
      for (const year of academicYears) {
        // Get year as a number for comparison
        const yearNum = parseInt(year.year_name);
        
        // Count students enrolled in this academic year
        const { count: studentCount, error: studentError } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('current_academic_year', yearNum);
        
        if (studentError) throw studentError;
        
        // Count sponsors who started in this academic year
        const { count: sponsorCount, error: sponsorError } = await supabase
          .from('sponsors')
          .select('*', { count: 'exact', head: true })
          .gte('start_date', year.start_date)
          .lte('start_date', year.end_date);
        
        if (sponsorError) throw sponsorError;
        
        stats.push({
          year: year.year_name,
          students_count: studentCount || 0,
          sponsors_count: sponsorCount || 0
        });
      }
      
      setYearStats(stats);
    } catch (error: any) {
      console.error("Error fetching year statistics:", error);
      toast({
        title: "Error",
        description: `Failed to fetch statistics: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsStatsLoading(false);
    }
  };

  const handleSubmit = async (values: AcademicYearFormValues) => {
    try {
      let response;
      
      // Ensure dates are for the full year
      const startDate = `${values.year_name}-01-01`;
      const endDate = `${values.year_name}-12-31`;
      
      if (editingYear) {
        response = await supabase.from('academic_years').update({
          year_name: values.year_name,
          is_current: values.is_current,
          start_date: startDate,
          end_date: endDate,
          updated_at: new Date().toISOString()
        }).eq('id', editingYear.id);
      } else {
        response = await supabase.from('academic_years').insert([{
          year_name: values.year_name,
          is_current: values.is_current,
          start_date: startDate,
          end_date: endDate
        }]);
      }
      
      if (response.error) throw response.error;
      
      toast({
        title: editingYear ? "Updated" : "Created",
        description: `Academic year ${values.year_name} has been ${editingYear ? "updated" : "created"} successfully.`
      });
      
      await fetchAcademicYears();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error saving academic year:", error);
      toast({
        title: "Error",
        description: `Failed to save academic year: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (academicYear: AcademicYear) => {
    try {
      const { error } = await supabase.from('academic_years').delete().eq('id', academicYear.id);
      if (error) throw error;
      
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
      // Update the academic year to be current
      const { error } = await supabase
        .from('academic_years')
        .update({
          is_current: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', yearToSetCurrent.id);
      
      if (error) throw error;
      
      toast({
        title: "Current Year Updated",
        description: `${yearToSetCurrent.year_name} is now set as the current academic year.`
      });
      
      setYearToSetCurrent(null);
      await fetchAcademicYears();
    } catch (error: any) {
      console.error("Error updating current academic year:", error);
      toast({
        title: "Error",
        description: `Failed to update current academic year: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const promoteStudentsGrade = async (destYear: string) => {
    try {
      // Get all students
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('status', 'Active');
      
      if (studentsError) throw studentsError;
      
      // Update each student's grade based on the CBC progression
      for (const student of students || []) {
        if (student.current_grade) {
          const nextGradeInfo = cbcGradeProgression[student.current_grade];
          
          if (nextGradeInfo) {
            await supabase
              .from('students')
              .update({
                current_grade: nextGradeInfo.grade,
                cbc_category: nextGradeInfo.category,
                current_academic_year: parseInt(destYear),
                updated_at: new Date().toISOString()
              })
              .eq('id', student.id);
          }
        }
      }
      
      toast({
        title: "Students Promoted",
        description: "All active students have been promoted to the next grade level."
      });
      
    } catch (error: any) {
      console.error("Error promoting students:", error);
      toast({
        title: "Error",
        description: `Failed to promote students: ${error.message}`,
        variant: "destructive"
      });
      throw error; // Rethrow to handle in the calling function
    }
  };

  const handleCopyYear = async (values: CopyYearFormValues) => {
    setIsCopying(true);
    setCopyProgress(0);
    try {
      // Step 1: Get source year data
      const sourceYear = academicYears.find(year => year.id === values.sourceYearId);
      if (!sourceYear) {
        throw new Error("Source academic year not found");
      }
      setCopyProgress(10);
      
      let destinationYearId: string;
      let destinationYear: string;

      // Step 2: Create new year if specified
      if (values.createNewYear) {
        if (!values.newYearName || !values.newStartDate || !values.newEndDate) {
          throw new Error("New year details are missing");
        }
        
        const startDate = `${values.newYearName}-01-01`;
        const endDate = `${values.newYearName}-12-31`;
        
        const { data, error } = await supabase
          .from('academic_years')
          .insert([{
            year_name: values.newYearName,
            is_current: false,
            start_date: startDate,
            end_date: endDate
          }])
          .select()
          .single();
        
        if (error) throw error;
        destinationYearId = data.id;
        destinationYear = values.newYearName;
        setCopyProgress(30);
      } else {
        if (!values.destinationYearId) {
          throw new Error("Destination year not selected");
        }
        const destYear = academicYears.find(year => year.id === values.destinationYearId);
        if (!destYear) {
          throw new Error("Destination academic year not found");
        }
        destinationYearId = values.destinationYearId;
        destinationYear = destYear.year_name;
        setCopyProgress(30);
      }

      // Step 3: Copy student data if selected
      if (values.copyStudentData) {
        // Get students from source year
        const { data: sourceStudents, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('current_academic_year', parseInt(sourceYear.year_name));
        
        if (studentError) throw studentError;
        
        // For each student, create a new entry for the destination year
        for (const student of sourceStudents || []) {
          // Create new student record with updated academic year
          const newStudent = {
            ...student,
            id: undefined, // Remove ID to generate new one
            current_academic_year: parseInt(destinationYear),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          await supabase.from('students').insert([newStudent]);
        }
        setCopyProgress(60);
      }

      // Step 4: Copy exam templates if selected
      if (values.copyExamTemplates) {
        // Get exam templates from source year
        const { data: sourceExams, error: examsError } = await supabase
          .from('exams')
          .select('*')
          .eq('academic_year', sourceYear.year_name);
          
        if (examsError) throw examsError;
        
        // For each exam, create a new template for the destination year
        for (const exam of sourceExams || []) {
          const newExam = {
            ...exam,
            id: undefined, // Remove ID to generate new one
            academic_year: destinationYear,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          await supabase.from('exams').insert([newExam]);
        }
        setCopyProgress(80);
      }

      // Step 5: Copy sponsorship information if selected
      if (values.copySponsorship) {
        // Get sponsorships from source year
        const { data: sourceStudents, error: sponsorshipError } = await supabase
          .from('students')
          .select('*, sponsor:sponsors(*)')
          .eq('current_academic_year', parseInt(sourceYear.year_name))
          .not('sponsor_id', 'is', null);
          
        if (sponsorshipError) throw sponsorshipError;
        
        // Update destination year students with sponsor relationships
        for (const student of sourceStudents || []) {
          // Find corresponding student in destination year
          const { data: destStudent } = await supabase
            .from('students')
            .select('id')
            .eq('current_academic_year', parseInt(destinationYear))
            .eq('admission_number', student.admission_number)
            .single();
            
          if (destStudent) {
            // Update with sponsor relationship
            await supabase
              .from('students')
              .update({
                sponsor_id: student.sponsor_id,
                sponsored_since: student.sponsored_since,
                updated_at: new Date().toISOString()
              })
              .eq('id', destStudent.id);
          }
        }
        setCopyProgress(95);
      }
      
      // Step 6: Promote students if selected
      if (values.promoteStudentGrades) {
        await promoteStudentsGrade(destinationYear);
      }

      // Complete the process
      setCopyProgress(100);
      await fetchAcademicYears();
      await fetchYearStatistics();
      
      toast({
        title: "Data Copied Successfully",
        description: `Data has been copied from ${sourceYear.year_name} to ${destinationYear}.`
      });
      
      setTimeout(() => {
        setIsCopyDialogOpen(false);
        setIsCopying(false);
        copyForm.reset();
      }, 1000);
      
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

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PP');
  };

  const watchCreateNewYear = copyForm.watch("createNewYear");
  const watchSourceYearId = copyForm.watch("sourceYearId");
  const watchPromoteStudentGrades = copyForm.watch("promoteStudentGrades");

  // Get current year for comparison in stats
  const currentYear = academicYears.find(year => year.is_current)?.year_name || "";

  const studentSponsorRatio = () => {
    const currentYearStat = yearStats.find(stat => stat.year === currentYear);
    if (!currentYearStat || !currentYearStat.sponsors_count) {
      return 'N/A';
    }
    return (currentYearStat.students_count / currentYearStat.sponsors_count).toFixed(1);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-left">Academic Years</h3>
          <p className="text-sm text-muted-foreground text-left">
            Manage academic years and set the current year.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <CopyIcon className="mr-2 h-4 w-4" />
                Copy Year Data
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Copy Academic Year Data</DialogTitle>
                <DialogDescription>
                  Copy data from one academic year to another. Select what data you want to copy.
                </DialogDescription>
              </DialogHeader>
              <Form {...copyForm}>
                <form onSubmit={copyForm.handleSubmit(handleCopyYear)} className="space-y-4">
                  {/* Source Year Selection */}
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
                  
                  {/* Create New Year Toggle */}
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

                  {/* Conditional fields for destination */}
                  {watchCreateNewYear ? (
                    <>
                      {/* New Year Name */}
                      <FormField
                        control={copyForm.control}
                        name="newYearName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Academic Year</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g. 2025" disabled={isCopying} />
                            </FormControl>
                            <FormDescription>
                              Enter a 4-digit year (e.g., 2025)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* These fields are hidden because we always set Jan 1 - Dec 31 for the year */}
                      <input type="hidden" {...copyForm.register("newStartDate")} value={`${copyForm.watch("newYearName") || new Date().getFullYear()}-01-01`} />
                      <input type="hidden" {...copyForm.register("newEndDate")} value={`${copyForm.watch("newYearName") || new Date().getFullYear()}-12-31`} />
                    </>
                  ) : (
                    /* Existing Year Selection */
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
                              {academicYears.filter(year => year.id !== watchSourceYearId).map(year => (
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
                  
                  {/* Student promotion options */}
                  <div className="space-y-4 border rounded-md p-4">
                    <h4 className="font-medium">Student Promotion</h4>
                    
                    <FormField
                      control={copyForm.control}
                      name="promoteStudentGrades"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange} 
                              disabled={isCopying}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Promote Students to Next Grade</FormLabel>
                            <FormDescription>
                              Automatically promote students to the next grade level following CBC progression.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    {watchPromoteStudentGrades && (
                      <div className="ml-7 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-700">
                          Students will be promoted based on the CBC progression system:
                          <br />
                          Pre-Primary (Playgroup → PP1 → PP2) →
                          Lower Primary (Grade 1 → 2 → 3) →
                          Upper Primary (Grade 4 → 5 → 6) →
                          Junior Secondary (Grade 7 → 8 → 9) →
                          Senior Secondary (Grade 10 → 11 → 12)
                          <br />
                          Special Needs Education (SNE) students will remain in the SNE category.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Data to copy section */}
                  <div className="space-y-4 border rounded-md p-4">
                    <h4 className="font-medium">What data to copy?</h4>
                    
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
                              Copy student records to the new academic year.
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
                  
                  {/* Progress indicator */}
                  {isCopying && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Copying data...</span>
                        <span>{copyProgress}%</span>
                      </div>
                      <Progress value={copyProgress} />
                    </div>
                  )}
                  
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline" disabled={isCopying}>
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isCopying}>
                      {isCopying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Copying...
                        </>
                      ) : "Copy Data"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Academic Year
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle>
                  {editingYear ? "Edit" : "Add"} Academic Year
                </DialogTitle>
                <DialogDescription>
                  Enter the academic year details. Years are defined as calendar years (e.g., 2024).
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
                          Enter a 4-digit year (e.g., 2024).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="is_current"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Current Academic Year</FormLabel>
                          <FormDescription>
                            Set as the current academic year.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {/* Hidden fields - we don't show these because we force Jan 1 - Dec 31 */}
                  <input type="hidden" {...form.register("start_date")} value={`${form.watch("year_name") || new Date().getFullYear()}-01-01`} />
                  <input type="hidden" {...form.register("end_date")} value={`${form.watch("year_name") || new Date().getFullYear()}-12-31`} />
                  
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit">{editingYear ? "Update" : "Create"}</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Year</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {academicYears.find(year => year.is_current)?.year_name || "Not Set"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isStatsLoading ? "Loading..." : "Academic calendar year"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isStatsLoading 
                ? "Loading..." 
                : yearStats.find(stat => stat.year === currentYear)?.students_count || "0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Enrolled students for {currentYear || "current year"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sponsors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isStatsLoading 
                ? "Loading..." 
                : yearStats.find(stat => stat.year === currentYear)?.sponsors_count || "0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active sponsors for {currentYear || "current year"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Student-Sponsor Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isStatsLoading ? "Loading..." : studentSponsorRatio()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Students per sponsor on average
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Chart Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart className="h-5 w-5 mr-2" />
            Academic Year Statistics
          </CardTitle>
          <CardDescription>
            Comparison of students and sponsors across academic years
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {isStatsLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={[...yearStats].reverse()}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="students_count" name="Students" fill="#3b82f6" />
                  <Bar dataKey="sponsors_count" name="Sponsors" fill="#10b981" />
                </RechartsBarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Academic Years Table */}
      <Card>
        <CardHeader>
          <CardTitle>Academic Years</CardTitle>
          <CardDescription>
            Manage your academic years. The current academic year is highlighted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : academicYears.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No academic years found. Click "Add Academic Year" to create one.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Sponsors</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {academicYears.map((academicYear) => {
                    const yearStat = yearStats.find(stat => stat.year === academicYear.year_name);
                    
                    return (
                      <TableRow 
                        key={academicYear.id}
                        className={academicYear.is_current ? "bg-blue-50" : ""}
                      >
                        <TableCell className="font-medium">
                          {academicYear.year_name}
                        </TableCell>
                        <TableCell>
                          {academicYear.is_current ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Current
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {parseInt(academicYear.year_name) > new Date().getFullYear() ? "Future" : "Past"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(academicYear.start_date)}</TableCell>
                        <TableCell>{formatDate(academicYear.end_date)}</TableCell>
                        <TableCell>{yearStat?.students_count || 0}</TableCell>
                        <TableCell>{yearStat?.sponsors_count || 0}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {!academicYear.is_current && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setYearToSetCurrent(academicYear)}
                                  >
                                    <Star className="h-4 w-4 mr-1" />
                                    Set Current
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Set Current Academic Year</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to set {academicYear.year_name} as the current academic year? This will update all relevant data to reflect this change.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleSetCurrent}>
                                      Continue
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingYear(academicYear);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Academic Year</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the {academicYear.year_name} academic year? This action cannot be undone, and may affect student records and other data.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(academicYear)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
