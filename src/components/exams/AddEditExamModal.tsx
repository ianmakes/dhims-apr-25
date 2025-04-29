
import React, { useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAcademicYear } from '@/contexts/AcademicYearContext';

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  academic_year: z.string().min(1, "Academic year is required"),
  term: z.string().min(1, "Term is required"),
  exam_date: z.string().min(1, "Exam date is required"),
  max_score: z.coerce.number().min(1, "Maximum score must be at least 1"),
  passing_score: z.coerce.number().min(0, "Passing score must be at least 0"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddEditExamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId?: string;
  onSave?: () => void;
}

export function AddEditExamModal({ 
  open, 
  onOpenChange, 
  examId, 
  onSave 
}: AddEditExamModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedAcademicYear, academicYears } = useAcademicYear();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      academic_year: selectedAcademicYear?.year_name || "",
      term: "",
      exam_date: new Date().toISOString().split('T')[0],
      max_score: 100,
      passing_score: 50,
      description: "",
    },
  });

  // Fetch exam details if editing
  const { data: examData, isLoading: isExamLoading } = useQuery({
    queryKey: ["exam", examId],
    queryFn: async () => {
      if (!examId) return null;
      
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .eq("id", examId)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!examId,
  });

  // Update form values when exam data is loaded
  useEffect(() => {
    if (examData) {
      form.reset({
        name: examData.name,
        academic_year: examData.academic_year,
        term: examData.term,
        exam_date: examData.exam_date.split('T')[0],
        max_score: examData.max_score,
        passing_score: examData.passing_score,
        description: examData.description || "",
      });
    }
  }, [examData, form]);

  // Save exam mutation
  const saveExamMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (examId) {
        // Update existing exam
        const { error } = await supabase
          .from("exams")
          .update({
            name: values.name,
            academic_year: values.academic_year,
            term: values.term,
            exam_date: values.exam_date,
            max_score: values.max_score,
            passing_score: values.passing_score,
            description: values.description,
            updated_at: new Date().toISOString(),
          })
          .eq("id", examId);
          
        if (error) throw error;
      } else {
        // Create new exam
        const { error } = await supabase
          .from("exams")
          .insert([{
            name: values.name,
            academic_year: values.academic_year,
            term: values.term,
            exam_date: values.exam_date,
            max_score: values.max_score,
            passing_score: values.passing_score,
            description: values.description,
            created_at: new Date().toISOString(),
          }]);
          
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      toast({
        title: examId ? "Exam Updated" : "Exam Created",
        description: examId
          ? "The exam has been updated successfully."
          : "The exam has been created successfully.",
      });
      onOpenChange(false);
      if (onSave) onSave();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    saveExamMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{examId ? "Edit Exam" : "Add New Exam"}</DialogTitle>
          <DialogDescription>
            {examId
              ? "Update the exam information."
              : "Create a new exam for students."}
          </DialogDescription>
        </DialogHeader>

        {isExamLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exam Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Mathematics Mid-Term" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="academic_year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Year</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select academic year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {academicYears.map((year) => (
                            <SelectItem key={year.id} value={year.year_name}>
                              {year.year_name}
                              {year.is_current ? " (Current)" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="term"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Term</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select term" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Term 1">Term 1</SelectItem>
                          <SelectItem value="Term 2">Term 2</SelectItem>
                          <SelectItem value="Term 3">Term 3</SelectItem>
                          <SelectItem value="Final">Final</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="exam_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exam Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="max_score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Score</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        The maximum possible score
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="passing_score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passing Score</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        The minimum score to pass
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Brief description of the exam" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={saveExamMutation.isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saveExamMutation.isLoading}
                >
                  {saveExamMutation.isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {examId ? "Update" : "Create"} Exam
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
