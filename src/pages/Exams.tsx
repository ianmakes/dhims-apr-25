
import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Upload, Eye } from 'lucide-react';

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Main } from "@/components/ui/main";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { supabase } from "@/integrations/supabase/client";
import { AddEditExamModal } from '@/components/exams/AddEditExamModal';
import { ImportStudentScoresModal } from '@/components/exams/ImportStudentScoresModal';
import { useAcademicYear } from '@/contexts/AcademicYearContext';

// Define the DBExam type to match the database structure
interface DBExam {
  id: string;
  name: string;
  term: string;
  academic_year: string;
  exam_date: string;
  created_at: string;
  updated_at: string;
  max_score: number;
  passing_score: number;
  is_active: boolean;
  created_by?: string;
  updated_by?: string;
}

const Exams = () => {
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [examId, setExamId] = useState<string | null>(null);
  const [examToDelete, setExamToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentYear } = useAcademicYear();

  // Fetch exams
  const { data: exams, isLoading, isError } = useQuery({
    queryKey: ['exams', currentYear?.id],
    queryFn: async () => {
      let query = supabase.from('exams').select('*');
      
      if (currentYear?.year_name) {
        query = query.eq('academic_year', currentYear.year_name);
      }
      
      const { data, error } = await query.order('created_at', { 
        ascending: false 
      });

      if (error) {
        throw new Error(error.message);
      }

      return data as DBExam[];
    },
  });

  // Delete exam mutation
  const deleteExamMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast({
        title: "Success",
        description: "Exam deleted successfully.",
      });
      setExamToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setExamToDelete(null);
    },
  });

  const handleExamSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['exams'] });
  };

  const handleImportComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['exams'] });
  };

  return (
    <Main>
      <div className="md:flex md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            Exams
            {currentYear && (
              <span className="ml-2 text-sm text-muted-foreground">
                ({currentYear.year_name})
              </span>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage exams and student scores.
          </p>
        </div>
        <Button onClick={() => setIsAddEditModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Exam
        </Button>
      </div>

      <Separator className="my-6" />

      <Card>
        <CardHeader>
          <CardTitle>Exam List</CardTitle>
          <CardDescription>View, edit, and manage exams.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[300px]" />
            </div>
          ) : isError ? (
            <p className="text-red-500">Error loading exams.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Name</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Exam Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams?.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.name}</TableCell>
                      <TableCell>{exam.term}</TableCell>
                      <TableCell>{new Date(exam.exam_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => window.location.href = `/exams/${exam.id}`}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => {
                            setExamId(exam.id);
                            setIsImportModalOpen(true);
                          }}>
                            <Upload className="h-4 w-4" />
                            <span className="sr-only">Import</span>
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => {
                            setExamId(exam.id);
                            setIsAddEditModalOpen(true);
                          }}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setExamToDelete(exam.id)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {exams && exams.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No exams found for the selected academic year.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Exam Modal */}
      <AddEditExamModal
        open={isAddEditModalOpen}
        onOpenChange={setIsAddEditModalOpen}
        examId={examId || undefined}
        onSave={handleExamSaved}
      />

      {/* Import Student Scores Modal */}
      <ImportStudentScoresModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        examId={examId || ''}
        onSuccess={handleImportComplete}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={examToDelete !== null} onOpenChange={(open) => {
        if (!open) setExamToDelete(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the exam and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setExamToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteExamMutation.isPending}
              onClick={() => {
                if (examToDelete) {
                  deleteExamMutation.mutate(examToDelete);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Main>
  );
};

export default Exams;
