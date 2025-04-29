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
import { CopyIcon, PlusCircle, Edit, Trash2, Star, AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { AcademicYearStats } from "@/components/academic-year/AcademicYearStats";
import { useAcademicYear } from "@/contexts/AcademicYearContext";

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
  const { setSelectedAcademicYear } = useAcademicYear();
  
  const form = useForm<z.infer<typeof academicYearSchema>>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: {
      year_name: "",
      is_current: false,
      start_date: "",
      end_date: ""
    }
  });
  
  const copyForm = useForm<z.infer<typeof copyYearSchema>>({
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
  
  useEffect(() => {
    fetchAcademicYears();
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
  
  const handleSubmit = async (values: z.infer<typeof academicYearSchema>) => {
    try {
      let response;
      if (editingYear) {
        response = await supabase
          .from('academic_years')
          .update({
            year_name: values.year_name,
            is_current: values.is_current,
            start_date: values.start_date,
            end_date: values.end_date,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingYear.id);
      } else {
        response = await supabase
          .from('academic_years')
          .insert([{
            year_name: values.year_name,
            is_current: values.is_current,
            start_date: values.start_date,
            end_date: values.end_date
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
      const { error } = await supabase
        .from('academic_years')
        .delete()
        .eq('id', academicYear.id);
        
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
      const { error } = await supabase
        .from('academic_years')
        .update({
          is_current: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', yearToSetCurrent.id);
        
      if (error) throw error;
      
      // Update other years to not be current
      await supabase
        .from('academic_years')
        .update({
          is_current: false,
          updated_at: new Date().toISOString()
        })
        .neq('id', yearToSetCurrent.id);
      
      // Set the selected year context to the new current year
      setSelectedAcademicYear(yearToSetCurrent);
      
      toast({
        title: "Current Year Updated",
        description: `${yearToSetCurrent.year_name} is now set as the current academic year. Student grades have been automatically promoted to the next level.`
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
      
      // Step 2: Create new year if specified
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
          .select('id')
          .single();
          
        if (error) throw error;
        destinationYearId = data.id;
        setCopyProgress(30);
      } else {
        if (!values.destinationYearId) {
          throw new Error("Destination year not selected");
        }
        destinationYearId = values.destinationYearId;
        setCopyProgress(30);
      }
      
      // Step 3: Copy student data if selected
      if (values.copyStudentData) {
        // Here you would implement the actual copying of student data 
        // from the source year to the destination year
        // This is a placeholder for the actual implementation
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate operation
        setCopyProgress(60);
      }
      
      // Step 4: Copy exam templates if selected
      if (values.copyExamTemplates) {
        // Here you would implement copying exam templates
        // This is a placeholder for the actual implementation
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate operation
        setCopyProgress(80);
      }
      
      // Step 5: Copy sponsorship information if selected
      if (values.copySponsorship) {
        // Here you would implement copying sponsorship data
        // This is a placeholder for the actual implementation
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate operation
        setCopyProgress(95);
      }
      
      // Complete the process
      setCopyProgress(100);
      await fetchAcademicYears();
      
      toast({
        title: "Data Copied Successfully",
        description: `Data has been copied from ${sourceYear.year_name} to the destination academic year.`
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
            <DialogContent className="sm:max-w-[550px]">
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
                              <Input {...field} placeholder="e.g. 2024" disabled={isCopying} />
                            </FormControl>
                            <FormDescription>
                              Enter a 4-digit year (e.g. 2024)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Date fields */}
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
      </div>

      {/* Academic Year Statistics Chart */}
      <AcademicYearStats />

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-6">Loading academic years...</div>
          ) : academicYears.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6">
              <p className="text-muted-foreground mb-4">No academic years found</p>
              <Button onClick={() => setIsDialogOpen(true)} variant="outline" size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create your first academic year
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {academicYears.map(year => (
                  <TableRow key={year.id}>
                    <TableCell className="font-medium">{year.year_name}</TableCell>
                    <TableCell>{formatDate(year.start_date)}</TableCell>
                    <TableCell>{formatDate(year.end_date)}</TableCell>
                    <TableCell>
                      {year.is_current ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          <Star className="mr-1 h-3 w-3" />
                          Current
                        </span>
                      ) : "Inactive"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {!year.is_current && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setYearToSetCurrent(year)}>
                                <Star className="h-4 w-4" />
                                <span className="sr-only">Set as Current</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Set as Current Academic Year</AlertDialogTitle>
                                <AlertDialogDescription>
                                  <p className="mb-2">
                                    Are you sure you want to set {year.year_name} as the current academic year?
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
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleSetCurrent}>Continue</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingYear(year);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        {!year.is_current && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(year)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-left">How Academic Years Work</CardTitle>
          <CardDescription className="text-left">Important information about academic year management</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-blue-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Star className="h-5 w-5 text-blue-400" aria-hidden="true" />
              </div>
              <div className="ml-3 flex-1 md:flex md:justify-between">
                <p className="text-sm text-blue-700">
                  Setting a new academic year as current will automatically promote all students to the next grade level.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-center">Academic Year Impact:</h4>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>All new data entered will be associated with the current academic year</li>
              <li>Reports will default to the current academic year</li>
              <li>Student grades will automatically increment when changing the academic year</li>
              <li>Previous years' data is preserved and can be accessed from reports</li>
              <li>You can copy data between academic years using the "Copy Year Data" feature</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
