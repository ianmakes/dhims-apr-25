import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { AcademicYear } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, Star, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

const academicYearSchema = z.object({
  year_name: z.string().min(1, { message: "Academic year name is required" }).regex(/^\d{4}-\d{4}$/, {
    message: "Year must be in format YYYY-YYYY (e.g. 2023-2024)",
  }),
  is_current: z.boolean().default(false),
  start_date: z.string().min(1, { message: "Start date is required" }),
  end_date: z.string().min(1, { message: "End date is required" }),
}).refine((data) => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end > start;
}, {
  message: "End date must be after start date",
  path: ["end_date"],
});

type AcademicYearFormValues = z.infer<typeof academicYearSchema>;

export default function AcademicYearsSettings() {
  const { toast } = useToast();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [yearToSetCurrent, setYearToSetCurrent] = useState<AcademicYear | null>(null);

  const form = useForm<AcademicYearFormValues>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: {
      year_name: "",
      is_current: false,
      start_date: "",
      end_date: "",
    },
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
        end_date: "",
      });
    }
  }, [isDialogOpen, form]);

  useEffect(() => {
    if (editingYear) {
      form.reset({
        year_name: editingYear.year_name,
        is_current: editingYear.is_current,
        start_date: editingYear.start_date.split('T')[0],
        end_date: editingYear.end_date.split('T')[0],
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
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (values: AcademicYearFormValues) => {
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
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingYear.id);
      } else {
        response = await supabase
          .from('academic_years')
          .insert([{
            year_name: values.year_name,
            is_current: values.is_current,
            start_date: values.start_date,
            end_date: values.end_date,
          }]);
      }

      if (response.error) throw response.error;

      toast({
        title: editingYear ? "Updated" : "Created",
        description: `Academic year ${values.year_name} has been ${editingYear ? "updated" : "created"} successfully.`,
      });

      await fetchAcademicYears();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error saving academic year:", error);
      toast({
        title: "Error",
        description: `Failed to save academic year: ${error.message}`,
        variant: "destructive",
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
        description: `Academic year ${academicYear.year_name} has been deleted.`,
      });

      await fetchAcademicYears();
    } catch (error: any) {
      console.error("Error deleting academic year:", error);
      toast({
        title: "Error",
        description: `Failed to delete academic year: ${error.message}`,
        variant: "destructive",
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

      toast({
        title: "Current Year Updated",
        description: `${yearToSetCurrent.year_name} is now set as the current academic year. Student grades have been automatically promoted to the next level.`,
      });

      setYearToSetCurrent(null);
      await fetchAcademicYears();
    } catch (error: any) {
      console.error("Error updating current academic year:", error);
      toast({
        title: "Error",
        description: `Failed to update current academic year: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PP');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Academic Years</h3>
          <p className="text-sm text-muted-foreground">
            Manage academic years and set the current year.
          </p>
        </div>
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
                {editingYear
                  ? "Update the details of this academic year."
                  : "Create a new academic year for the school."}
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
                        <Input {...field} placeholder="e.g. 2023-2024" />
                      </FormControl>
                      <FormDescription>
                        Format: YYYY-YYYY (e.g. 2023-2024)
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
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
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

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-6">Loading academic years...</div>
          ) : academicYears.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6">
              <p className="text-muted-foreground mb-4">No academic years found</p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                variant="outline"
                size="sm"
              >
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
                {academicYears.map((year) => (
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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setYearToSetCurrent(year)}
                              >
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
          <CardTitle>How Academic Years Work</CardTitle>
          <CardDescription>Important information about academic year management</CardDescription>
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
            <h4 className="font-medium">Academic Year Impact:</h4>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>All new data entered will be associated with the current academic year</li>
              <li>Reports will default to the current academic year</li>
              <li>Student grades will automatically increment when changing the academic year</li>
              <li>Previous years' data is preserved and can be accessed from reports</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
