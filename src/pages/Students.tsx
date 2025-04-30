
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Pencil, Trash2, Plus, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Main } from '@/components/ui/main';
import { AddEditStudentModal } from '@/components/students/AddEditStudentModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AcademicYearLabel } from '@/components/common/AcademicYearLabel';

type Student = {
  id: string;
  name: string;
  admission_number: string;
  gender: string;
  current_grade: string;
  status: string;
};

export default function Students() {
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<string | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedAcademicYear } = useAcademicYear();
  
  // Fetch students
  const { data: students, isLoading } = useQuery({
    queryKey: ['students', selectedAcademicYear?.id],
    queryFn: async () => {
      let query = supabase.from('students').select('*');
      
      // Filter by academic year if one is selected
      if (selectedAcademicYear) {
        const currentYear = parseInt(selectedAcademicYear.year_name.split('-')[0]);
        query = query.eq('current_academic_year', currentYear);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as Student[];
    },
    enabled: !!selectedAcademicYear
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['students']
      });
      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
      setStudentToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      setStudentToDelete(null);
    },
  });

  // Filter students based on search term
  const filteredStudents = students?.filter(student => {
    if (!searchTerm) return true;
    const searchTermLower = searchTerm.toLowerCase();
    return (
      student.name.toLowerCase().includes(searchTermLower) ||
      student.admission_number.toLowerCase().includes(searchTermLower) ||
      (student.current_grade && student.current_grade.toLowerCase().includes(searchTermLower))
    );
  });

  return (
    <Main>
      <div className="md:flex md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight flex items-center">
            Students
            <AcademicYearLabel />
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage student records and information
          </p>
        </div>
        <Button onClick={() => setIsAddEditModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </div>

      <Separator className="my-6" />

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search students..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>
            View and manage all students
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[300px]" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Admission Number</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No students found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents?.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.admission_number}</TableCell>
                        <TableCell>{student.gender}</TableCell>
                        <TableCell>{student.current_grade}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            student.status === 'Active' ? 'bg-green-100 text-green-800' :
                            student.status === 'Inactive' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {student.status || 'Unknown'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/students/${student.id}`}>
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setStudentToEdit(student.id);
                                setIsAddEditModalOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setStudentToDelete(student.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddEditStudentModal
        open={isAddEditModalOpen}
        onOpenChange={setIsAddEditModalOpen}
        student={studentToEdit ? { id: studentToEdit } : undefined}
        onSuccess={() => {
          queryClient.invalidateQueries({
            queryKey: ['students']
          });
          setStudentToEdit(null);
        }}
      />

      <AlertDialog
        open={studentToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setStudentToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this student?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the student record
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (studentToDelete) {
                deleteStudentMutation.mutate(studentToDelete);
              }
            }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Main>
  );
}
