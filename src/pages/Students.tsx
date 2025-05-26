import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DataTable } from "@/components/data-display/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, MoreHorizontal, Pencil, Plus, Trash2, Check, X, Filter, FilterX, Upload } from "lucide-react";
import { AddEditStudentModal } from "@/components/students/AddEditStudentModal";
import { ImportStudentsModal } from "@/components/students/ImportStudentsModal";
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

interface AcademicYear {
  id: string;
  year_name: string;
  is_current: boolean;
  start_date: string;
  end_date: string;
}

export default function Students() {
  const [grade, setGrade] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [sponsored, setSponsored] = useState<string>("all");
  const [academicYear, setAcademicYear] = useState<string>("all");
  const [filtersVisible, setFiltersVisible] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [isBulkDeleteAlertOpen, setIsBulkDeleteAlertOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<string>("");

  // Fetch academic years from database
  const {
    data: academicYears = [],
    isLoading: isLoadingYears
  } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      return data as AcademicYear[];
    }
  });

  // Set default academic year to current year if available
  useEffect(() => {
    if (academicYears.length > 0) {
      const currentYear = academicYears.find(year => year.is_current);
      if (currentYear) {
        setAcademicYear(currentYear.year_name);
      } else {
        setAcademicYear(academicYears[0].year_name);
      }
    }
  }, [academicYears]);

  // Fetch students data from Supabase
  const {
    data: students = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('students').select('*').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      return data as Student[];
    }
  });

  // Mutation for adding a student
  const addStudentMutation = useMutation({
    mutationFn: async (studentData: any) => {
      const {
        data,
        error
      } = await supabase.from('students').insert([{
        ...studentData,
        created_by: user?.id,
        updated_by: user?.id
      }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['students']
      });
      toast({
        title: "Student added",
        description: "New student has been added successfully."
      });
    },
    onError: error => {
      toast({
        title: "Error adding student",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation for updating a student
  const updateStudentMutation = useMutation({
    mutationFn: async ({
      id,
      data
    }: {
      id: string;
      data: any;
    }) => {
      const {
        data: updatedData,
        error
      } = await supabase.from('students').update({
        ...data,
        updated_by: user?.id,
        updated_at: new Date().toISOString()
      }).eq('id', id).select().single();
      if (error) throw error;
      return updatedData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['students']
      });
      toast({
        title: "Student updated",
        description: "Student has been updated successfully."
      });
    },
    onError: error => {
      toast({
        title: "Error updating student",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation for deleting a student
  const deleteStudentMutation = useMutation({
    mutationFn: async (id: string) => {
      const {
        error
      } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['students']
      });
      toast({
        title: "Student deleted",
        description: "Student has been deleted successfully."
      });
    },
    onError: error => {
      toast({
        title: "Error deleting student",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation for bulk deleting students
  const bulkDeleteStudentsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('students').delete().in('id', ids);
      if (error) throw error;
      return ids;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['students']
      });
      toast({
        title: "Students deleted",
        description: `${selectedRowIds.length} students have been deleted successfully.`
      });
      setSelectedRowIds([]);
    },
    onError: error => {
      toast({
        title: "Error deleting students",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation for bulk updating students status
  const bulkUpdateStudentsStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[], status: string }) => {
      const { error } = await supabase.from('students')
        .update({ 
          status, 
          updated_by: user?.id, 
          updated_at: new Date().toISOString() 
        })
        .in('id', ids);
      if (error) throw error;
      return ids;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['students']
      });
      toast({
        title: "Students updated",
        description: `${selectedRowIds.length} students have been ${variables.status.toLowerCase()}.`
      });
      setSelectedRowIds([]);
      setBulkActionType("");
    },
    onError: error => {
      toast({
        title: "Error updating students",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Filter students based on filters
  const filteredStudents = students.filter(student => {
    if (grade && grade !== "all" && student.current_grade !== grade) return false;
    if (status && status !== "all" && student.status !== status) return false;
    if (sponsored === "sponsored" && !student.sponsor_id) return false;
    if (sponsored === "unsponsored" && student.sponsor_id) return false;
    if (academicYear !== "all") {
      // Add academic year filtering logic if needed
      // This would require the students table to have an academic_year field
    }
    return true;
  });

  // Reset all filters to default values
  const clearAllFilters = () => {
    setGrade("all");
    setStatus("all");
    setSponsored("all");
    
    // Find current academic year to set as default
    const currentYear = academicYears.find(year => year.is_current);
    if (currentYear) {
      setAcademicYear(currentYear.year_name);
    } else {
      setAcademicYear("all");
    }
  };

  // Updated Add Student Modal logic
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const handleAddStudent = (data: any) => {
    addStudentMutation.mutate(data);
    setIsAddStudentModalOpen(false);
  };

  const handleEditStudent = (data: any) => {
    if (selectedStudent) {
      updateStudentMutation.mutate({
        id: selectedStudent.id,
        data
      });
      setIsEditStudentModalOpen(false);
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

  const handleBulkDelete = () => {
    if (selectedRowIds.length > 0) {
      bulkDeleteStudentsMutation.mutate(selectedRowIds);
      setIsBulkDeleteAlertOpen(false);
    }
  };

  const handleBulkStatusChange = (status: string) => {
    setBulkActionType(status);
    if (selectedRowIds.length > 0) {
      bulkUpdateStudentsStatusMutation.mutate({ 
        ids: selectedRowIds, 
        status: status 
      });
    }
  };
  
  // Define columns for DataTable with checkbox selection
  const columns = [
    {
      accessorKey: "admission_number",
      header: "ADM No."
    }, 
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        return <Link to={`/students/${row.original.id}`} className="text-primary hover:underline">
          {row.getValue("name")}
        </Link>;
      }
    }, 
    {
      accessorKey: "current_grade",
      header: "Grade"
    }, 
    {
      accessorKey: "gender",
      header: "Gender",
      cell: ({ row }) => {
        return <div className="capitalize">{row.getValue("gender")}</div>;
      }
    }, 
    {
      accessorKey: "admission_date",
      header: "Admission Date",
      cell: ({ row }) => {
        const date = row.getValue("admission_date");
        return <div>
          {date ? new Date(date).toLocaleDateString() : "N/A"}
        </div>;
      }
    }, 
    {
      accessorKey: "sponsor_id",
      header: "Sponsor",
      cell: ({ row }) => {
        const sponsorId = row.getValue("sponsor_id");
        return <div>
          {sponsorId ? <div className="inline-flex items-center justify-center rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-700">
            <span>Sponsored</span>
          </div> : <div className="inline-flex items-center justify-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-sm font-medium text-yellow-700">
            <span>Unsponsored</span>
          </div>}
        </div>;
      }
    }, 
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status");
        return <div className="capitalize">
          {status === "Active" ? <div className="inline-flex items-center justify-center rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-700">
            <Check className="mr-1 h-3 w-3" />
            <span>Active</span>
          </div> : status === "Inactive" ? <div className="inline-flex items-center justify-center rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-700">
            <X className="mr-1 h-3 w-3" />
            <span>Inactive</span>
          </div> : <div className="inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-700">
            <span>{status}</span>
          </div>}
        </div>;
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const student = row.original;
        return <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(student.id)}>
                Copy student ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link to={`/students/${student.id}`} className="flex items-center">
                  <Eye className="mr-2 h-4 w-4" />
                  <span>View</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenEditModal(student)}>
                <Pencil className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => handleOpenDeleteAlert(student)}>
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>;
      }
    }
  ];

  // Define bulk actions for DataTable
  const bulkActions = [
    {
      label: "Delete Selected",
      action: () => setIsBulkDeleteAlertOpen(true)
    },
    {
      label: "Mark as Active",
      action: () => handleBulkStatusChange("Active")
    },
    {
      label: "Mark as Inactive",
      action: () => handleBulkStatusChange("Inactive")
    },
    {
      label: "Mark as Graduated",
      action: () => handleBulkStatusChange("Graduated")
    },
    {
      label: "Mark as Transferred",
      action: () => handleBulkStatusChange("Transferred")
    }
  ];

  // Add state for import students modal
  const [isImportStudentsModalOpen, setIsImportStudentsModalOpen] = useState(false);

  return <div className="space-y-6 fade-in">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-left">Students</h1>
        <p className="text-muted-foreground">
          Manage and track all students in the system
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => setIsImportStudentsModalOpen(true)}
        >
          <Upload className="mr-2 h-4 w-4" />
          Import Students
        </Button>
        <Button onClick={() => setIsAddStudentModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </div>
    </div>

    {/* Filter section - improved with toggle and clear functionality */}
    <div className="border rounded-md p-4 bg-white">
      <div className="flex justify-between items-center mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setFiltersVisible(!filtersVisible)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          {filtersVisible ? "Hide Filters" : "Show Filters"}
        </Button>
        
        {filtersVisible && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllFilters}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            disabled={grade === "all" && status === "all" && sponsored === "all" && academicYear === "all"}
          >
            <FilterX className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>
      
      {filtersVisible && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label htmlFor="academicYear" className="text-sm font-medium block">
              Academic Year:
            </label>
            <Select value={academicYear} onValueChange={setAcademicYear}>
              <SelectTrigger id="academicYear" className="w-full">
                <SelectValue placeholder="All Academic Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Academic Years</SelectItem>
                {isLoadingYears ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : academicYears.length > 0 ? (
                  academicYears.map(year => (
                    <SelectItem key={year.id} value={year.year_name}>
                      {year.year_name}{year.is_current ? " (Current)" : ""}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No academic years found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="grade" className="text-sm font-medium block">
              Grade:
            </label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger id="grade" className="w-full">
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"].map(g => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-medium block">
              Status:
            </label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Graduated">Graduated</SelectItem>
                <SelectItem value="Transferred">Transferred</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="sponsored" className="text-sm font-medium block">
              Sponsorship:
            </label>
            <Select value={sponsored} onValueChange={setSponsored}>
              <SelectTrigger id="sponsored" className="w-full">
                <SelectValue placeholder="All Students" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="sponsored">Sponsored</SelectItem>
                <SelectItem value="unsponsored">Unsponsored</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>

    {/* Display filter summary if filters are applied */}
    {(grade !== "all" || status !== "all" || sponsored !== "all" || academicYear !== "all") && (
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="text-muted-foreground">Active filters:</span>
        {academicYear !== "all" && (
          <div className="bg-muted px-2 py-1 rounded-md flex items-center gap-1">
            <span>Year: {academicYear}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-4 w-4 p-0" 
              onClick={() => setAcademicYear("all")}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        {grade !== "all" && (
          <div className="bg-muted px-2 py-1 rounded-md flex items-center gap-1">
            <span>Grade: {grade}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-4 w-4 p-0" 
              onClick={() => setGrade("all")}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        {status !== "all" && (
          <div className="bg-muted px-2 py-1 rounded-md flex items-center gap-1">
            <span>Status: {status}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-4 w-4 p-0" 
              onClick={() => setStatus("all")}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        {sponsored !== "all" && (
          <div className="bg-muted px-2 py-1 rounded-md flex items-center gap-1">
            <span>Sponsorship: {sponsored === "sponsored" ? "Sponsored" : "Unsponsored"}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-4 w-4 p-0" 
              onClick={() => setSponsored("all")}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    )}

    {/* Students table with bulk actions */}
    <DataTable 
      columns={columns} 
      data={filteredStudents} 
      searchColumn="name" 
      searchPlaceholder="Search students..." 
      isLoading={isLoading} 
      onRowSelectionChange={setSelectedRowIds}
      bulkActions={bulkActions}
    />

    {/* Add Student Modal */}
    <AddEditStudentModal 
      open={isAddStudentModalOpen} 
      onOpenChange={setIsAddStudentModalOpen} 
      onSubmit={handleAddStudent} 
      isLoading={addStudentMutation.isPending} 
    />

    {/* Import Students Modal */}
    <ImportStudentsModal 
      open={isImportStudentsModalOpen}
      onOpenChange={setIsImportStudentsModalOpen}
      onSuccess={() => {
        queryClient.invalidateQueries({ queryKey: ['students'] });
      }}
    />

    {/* Edit Student Modal */}
    {selectedStudent && (
      <AddEditStudentModal 
        open={isEditStudentModalOpen} 
        onOpenChange={setIsEditStudentModalOpen} 
        student={selectedStudent as any} 
        onSubmit={handleEditStudent} 
        isLoading={updateStudentMutation.isPending} 
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
          <AlertDialogAction onClick={handleDeleteStudent} className="bg-destructive text-destructive-foreground">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Bulk Delete Students Alert */}
    <AlertDialog open={isBulkDeleteAlertOpen} onOpenChange={setIsBulkDeleteAlertOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete multiple students?</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to delete {selectedRowIds.length} student{selectedRowIds.length !== 1 ? 's' : ''}. 
            This action cannot be undone and will permanently remove all selected student records from the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleBulkDelete} 
            className="bg-destructive text-destructive-foreground"
            disabled={bulkDeleteStudentsMutation.isPending}
          >
            {bulkDeleteStudentsMutation.isPending ? "Deleting..." : "Delete All Selected"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}
