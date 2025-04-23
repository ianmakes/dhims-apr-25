import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DataTable } from "@/components/data-display/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Eye, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { AddEditStudentModal } from "@/components/students/AddEditStudentModal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Student {
  id: string;
  admission_number: string;
  name: string;
  current_grade: string;
  gender: string;
  admission_date: string;
  sponsor_id?: string;
  status: string;
  profile_image_url?: string;
  [key: string]: any; // Allow for additional properties
}

// Define columns for DataTable
const columns = [
  {
    accessorKey: "admission_number",
    header: "ADM No.",
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      return (
        <Link to={`/students/${row.original.id}`} className="text-primary hover:underline">
          {row.getValue("name")}
        </Link>
      );
    },
  },
  {
    accessorKey: "current_grade",
    header: "Grade",
  },
  {
    accessorKey: "gender",
    header: "Gender",
    cell: ({ row }) => {
      return (
        <div className="capitalize">{row.getValue("gender")}</div>
      );
    },
  },
  {
    accessorKey: "admission_date",
    header: "Admission Date",
    cell: ({ row }) => {
      const date = row.getValue("admission_date");
      return (
        <div>
          {date ? new Date(date).toLocaleDateString() : "N/A"}
        </div>
      );
    },
  },
  {
    accessorKey: "sponsor_id",
    header: "Sponsor",
    cell: ({ row }) => {
      const sponsorId = row.getValue("sponsor_id");
      return (
        <div>
          {sponsorId ? (
            <div className="inline-flex items-center justify-center rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-700">
              <span>Sponsored</span>
            </div>
          ) : (
            <div className="inline-flex items-center justify-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-sm font-medium text-yellow-700">
              <span>Unsponsored</span>
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status");
      return (
        <div className="capitalize">
          {status === "Active" ? (
            <div className="inline-flex items-center justify-center rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-700">
              <span>Active</span>
            </div>
          ) : status === "Inactive" ? (
            <div className="inline-flex items-center justify-center rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-700">
              <span>Inactive</span>
            </div>
          ) : (
            <div className="inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-700">
              <span>{status}</span>
            </div>
          )}
        </div>
      );
    },
  },
];

export default function Students() {
  const [grade, setGrade] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [sponsored, setSponsored] = useState<string>("all");
  const [academicYear, setAcademicYear] = useState<string>("2024");
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch students data from Supabase
  const { data: students = [], isLoading, error } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Student[];
    },
  });

  // Mutation for adding a student
  const addStudentMutation = useMutation({
    mutationFn: async (studentData: any) => {
      const { data, error } = await supabase
        .from('students')
        .insert([{
          ...studentData,
          created_by: user?.id,
          updated_by: user?.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({
        title: "Student added",
        description: "New student has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding student",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for updating a student
  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { data: updatedData, error } = await supabase
        .from('students')
        .update({
          ...data,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updatedData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({
        title: "Student updated",
        description: "Student has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating student",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting a student
  const deleteStudentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({
        title: "Student deleted",
        description: "Student has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting student",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter students based on filters
  const filteredStudents = students.filter((student) => {
    if (grade && grade !== "all" && student.current_grade !== grade) return false;
    if (status && status !== "all" && student.status !== status) return false;
    if (sponsored === "sponsored" && !student.sponsor_id) return false;
    if (sponsored === "unsponsored" && student.sponsor_id) return false;
    return true;
  });

  // Updated Add Student Modal logic
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const handleAddStudent = (data: any) => {
    // Attach academic year id to save record in current academic year
    data.academic_year_id = null; // set this to the currentYear id if available, can be updated on settings integration
    addStudentMutation.mutate(data);
  };

  const handleEditStudent = (data: any) => {
    if (selectedStudent) {
      updateStudentMutation.mutate({ id: selectedStudent.id, data });
    }
  };

  const handleDeleteStudent = () => {
    if (selectedStudent) {
      deleteStudentMutation.mutate(selectedStudent.id);
      setIsDeleteAlertOpen(false);
    }
  };

  const handleOpenEditModal = (student: Student) => {
    setSelectedStudent(student);
    setIsEditStudentModalOpen(true);
  };

  const handleOpenDeleteAlert = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteAlertOpen(true);
  };

  // Updated columns with edit/delete actions
  const columnsWithActions = [
    ...columns, 
    {
      id: "actions",
      cell: ({ row }) => {
        const student = row.original;
        
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(student.id)}
                >
                  Copy student ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link
                    to={`/students/${student.id}`}
                    className="flex items-center"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    <span>View</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOpenEditModal(student)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => handleOpenDeleteAlert(student)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground">
            Manage and track all students in the system
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="academicYear" className="text-sm font-medium">
              Academic Year:
            </label>
            <Select
              value={academicYear}
              onValueChange={setAcademicYear}
            >
              <SelectTrigger id="academicYear" className="w-36">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
                <SelectItem value="2021">2021</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setIsAddStudentModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Filter section */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="grade" className="text-sm font-medium">
            Grade:
          </label>
          <Select
            value={grade}
            onValueChange={setGrade}
          >
            <SelectTrigger id="grade" className="w-28">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"].map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="status" className="text-sm font-medium">
            Status:
          </label>
          <Select
            value={status}
            onValueChange={setStatus}
          >
            <SelectTrigger id="status" className="w-32">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Graduated">Graduated</SelectItem>
              <SelectItem value="Transferred">Transferred</SelectItem>
              <SelectItem value="Suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="sponsored" className="text-sm font-medium">
            Sponsored:
          </label>
          <Select
            value={sponsored}
            onValueChange={setSponsored}
          >
            <SelectTrigger id="sponsored" className="w-40">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="sponsored">Sponsored</SelectItem>
              <SelectItem value="unsponsored">Unsponsored</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Students table */}
      <DataTable
        columns={columnsWithActions}
        data={filteredStudents}
        searchColumn="name"
        searchPlaceholder="Search students..."
        isLoading={isLoading}
      />

      {/* Add Student Modal */}
      <AddEditStudentModal
        open={isAddStudentModalOpen}
        onOpenChange={setIsAddStudentModalOpen}
        onSubmit={handleAddStudent}
        isLoading={addStudentMutation.isLoading}
      />

      {/* Edit Student Modal */}
      {selectedStudent && (
        <AddEditStudentModal
          open={isEditStudentModalOpen}
          onOpenChange={setIsEditStudentModalOpen}
          student={selectedStudent as any}
          onSubmit={handleEditStudent}
          isLoading={updateStudentMutation.isLoading}
        />
      )}

      {/* Delete Student Alert */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the student record
              and remove their data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteStudent} 
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
