
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Define form schema
const examFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Exam name must be at least 2 characters.',
  }),
  description: z.string().optional(),
  term: z.string({
    required_error: 'Please select a term.',
  }),
  academicYear: z.string({
    required_error: 'Please select an academic year.',
  }),
  date: z.date({
    required_error: 'Please select a date.',
  }),
  maxScore: z.coerce.number().min(1, {
    message: 'Maximum score must be at least 1.',
  }),
  passingScore: z.coerce.number().min(0, {
    message: 'Passing score must be at least 0.',
  }),
});

type ExamFormValues = z.infer<typeof examFormSchema>;

// Update the interface to include onSave prop
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
  onSave,
}: AddEditExamModalProps) {
  const isEditMode = !!examId;
  const { academicYears } = useAcademicYear();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Fetch exam data if in edit mode
  const { data: examData, isLoading: isExamLoading } = useQuery({
    queryKey: ['exam', examId],
    queryFn: async () => {
      if (!examId) return null;
      
      // Get the exam data with description field
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();
        
      if (error) throw error;
      
      // Make sure we return a type that includes 'description'
      return {
        ...data,
        description: data.description || ''
      };
    },
    enabled: isEditMode,
  });

  // Initialize form with default values or exam data
  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      name: '',
      description: '',
      term: '',
      academicYear: '',
      date: new Date(),
      maxScore: 100,
      passingScore: 50,
    },
  });

  // Update form values when exam data is loaded
  useEffect(() => {
    if (examData) {
      form.reset({
        name: examData.name,
        description: examData.description || '',
        term: examData.term,
        academicYear: examData.academic_year,
        date: new Date(examData.exam_date),
        maxScore: examData.max_score,
        passingScore: examData.passing_score,
      });
      setDate(new Date(examData.exam_date));
    }
  }, [examData, form]);

  // Create exam mutation
  const createExamMutation = useMutation({
    mutationFn: async (values: ExamFormValues) => {
      const { data, error } = await supabase
        .from('exams')
        .insert([
          {
            name: values.name,
            description: values.description,
            term: values.term,
            academic_year: values.academicYear,
            exam_date: values.date.toISOString().split('T')[0],
            max_score: values.maxScore,
            passing_score: values.passingScore,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success('Exam created successfully');
      if (onSave) onSave();
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(`Error creating exam: ${error.message}`);
    },
  });

  // Update exam mutation
  const updateExamMutation = useMutation({
    mutationFn: async (values: ExamFormValues) => {
      const { data, error } = await supabase
        .from('exams')
        .update({
          name: values.name,
          description: values.description,
          term: values.term,
          academic_year: values.academicYear,
          exam_date: values.date.toISOString().split('T')[0],
          max_score: values.maxScore,
          passing_score: values.passingScore,
        })
        .eq('id', examId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
      toast.success('Exam updated successfully');
      if (onSave) onSave();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(`Error updating exam: ${error.message}`);
    },
  });

  // Handle form submission
  const onSubmit = (values: ExamFormValues) => {
    if (isEditMode) {
      updateExamMutation.mutate(values);
    } else {
      createExamMutation.mutate(values);
    }
  };

  // Check if any mutation is loading
  const isLoading = createExamMutation.isPending || updateExamMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Exam' : 'Create New Exam'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the exam details below.'
              : 'Fill in the details to create a new exam.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exam Name</FormLabel>
                  <FormControl>
                    <Input placeholder="End of Term Exam" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the exam"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="academicYear"
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
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Exam Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            setDate(date);
                            field.onChange(date);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="maxScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Score</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      The highest possible score for this exam
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passingScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passing Score</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      The minimum score required to pass
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? isEditMode
                    ? 'Updating...'
                    : 'Creating...'
                  : isEditMode
                  ? 'Update Exam'
                  : 'Create Exam'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
