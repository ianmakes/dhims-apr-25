import { useState } from "react";
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
  DropdownMenuItem,
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
import { AddEditStudentModal, StudentFormValues } from "@/components/students/AddEditStudentModal";
import { useToast } from "@/hooks/use-toast";
import { Student } from "@/types";

// Sample data for students
const students = [
  {
    id: "1",
    firstName: "John",
    lastName: "Doe",
    grade: "4",
    gender: "male",
    enrollmentDate: new Date(2022, 0, 15),
    sponsorId: "1",
    status: "active",
  },
  {
    id: "2",
    firstName: "Jane",
    lastName: "Smith",
    grade: "6",
    gender: "female",
    enrollmentDate: new Date(2022, 1, 20),
    sponsorId: "2",
    status: "active",
  },
  {
    id: "3",
    firstName: "Michael",
    lastName: "Johnson",
    grade: "3",
    gender: "male",
    enrollmentDate: new Date(2022, 2, 10),
    sponsorId: "3",
    status: "active",
  },
  {
    id: "4",
    firstName: "Emily",
    lastName: "Williams",
    grade: "5",
    gender: "female",
    enrollmentDate: new Date(2022, 3, 5),
    sponsorId: "4",
    status: "active",
  },
  {
    id: "5",
    firstName: "David",
    lastName: "Brown",
    grade: "7",
    gender: "male",
    enrollmentDate: new Date(2022, 4, 12),
    sponsorId: "5",
    status: "active",
  },
  {
    id: "6",
    firstName: "Sarah",
    lastName: "Jones",
    grade: "2",
    gender: "female",
    enrollmentDate: new Date(2022, 5, 18),
    sponsorId: "6",
    status: "inactive",
  },
  {
    id: "7",
    firstName: "James",
    lastName: "Garcia",
    grade: "8",
    gender: "male",
    enrollmentDate: new Date(2022, 6, 22),
    sponsorId: null,
    status: "active",
  },
  {
    id: "8",
    firstName: "Grace",
    lastName: "Martinez",
    grade: "4",
    gender: "female",
    enrollmentDate: new Date(2022, 7, 8),
    sponsorId: null,
    status: "active",
  },
  {
    id: "9",
    firstName: "Robert",
    lastName: "Lee",
    grade: "6",
    gender: "male",
    enrollmentDate: new Date(2022, 8, 14),
    sponsorId: "7",
    status: "graduated",
  },
  {
    id: "10",
    firstName: "Emma",
    lastName: "Harris",
    grade: "3",
    gender: "female",
    enrollmentDate: new Date(2022, 9, 30),
    sponsorId: "8",
    status: "active",
  },
];

// Define columns for DataTable
const columns = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "firstName",
    header: "First Name",
    cell: ({ row }) => {
      return (
        <Link to={`/students/${row.original.id}`} className="text-primary hover:underline">
          {row.getValue("firstName")}
        </Link>
      );
    },
  },
  {
    accessorKey: "lastName",
    header: "Last Name",
    cell: ({ row }) => {
      return (
        <Link to={`/students/${row.original.id}`} className="text-primary hover:underline">
          {row.getValue("lastName")}
        </Link>
      );
    },
  },
  {
    accessorKey: "grade",
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
    accessorKey: "enrollmentDate",
    header: "Enrollment Date",
    cell: ({ row }) => {
      return (
        <div>
          {new Date(row.getValue("enrollmentDate")).toLocaleDateString()}
        </div>
      );
    },
  },
  {
    accessorKey: "sponsorId",
    header: "Sponsor",
    cell: ({ row }) => {
      const sponsorId = row.getValue("sponsorId");
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
          {status === "active" ? (
            <div className="inline-flex items-center justify-center rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-700">
              <span>Active</span>
            </div>
          ) : status === "inactive" ? (
            <div className="inline-flex items-center justify-center rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-700">
              <span>Inactive</span>
            </div>
          ) : (
            <div className="inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-700">
              <span>Graduated</span>
            </div>
          )}
        </div>
      );
    },
  },
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
              <DropdownMenuItem>
                <Link
                  to={`/students/${student.id}/edit`}
                  className="flex items-center"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>Edit</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
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

export default function Students() {
  const [grade, setGrade] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [sponsored, setSponsored] = useState<string>("all");
  const [academicYear, setAcademicYear] = useState<string>("2023-2024");
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const { toast } = useToast();

  // Filter students based on filters
  const filteredStudents = students.filter((student) => {
    if (grade && grade !== "all" && student.grade !== grade) return false;
    if (status && status !== "all" && student.status !== status) return false;
    if (sponsored === "sponsored" && !student.sponsorId) return false;
    if (sponsored === "unsponsored" && student.sponsorId) return false;
    return true;
  });

  const handleAddStudent = (data: StudentFormValues) => {
    // In a real app, this would be an API call
    console.log("Adding student:", data);
    toast({
      title: "Student added",
      description: `${data.firstName} ${data.lastName} has been added successfully.`,
    });
  };

  const handleEditStudent = (data: StudentFormValues) => {
    // In a real app, this would be an API call
    console.log("Editing student:", selectedStudent?.id, data);
    toast({
      title: "Student updated",
      description: `${data.firstName} ${data.lastName} has been updated successfully.`,
    });
  };

  const handleDeleteStudent = () => {
    // In a real app, this would be an API call
    console.log("Deleting student:", selectedStudent?.id);
    toast({
      title: "Student deleted",
      description: `Student has been deleted successfully.`,
    });
    setIsDeleteAlertOpen(false);
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
    ...columns.slice(0, -1), // Take all columns except the last one (actions)
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
                <SelectItem value="2023-2024">2023-2024</SelectItem>
                <SelectItem value="2022-2023">2022-2023</SelectItem>
                <SelectItem value="2021-2022">2021-2022</SelectItem>
                <SelectItem value="2020-2021">2020-2021</SelectItem>
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
              {["1", "2", "3", "4", "5", "6", "7", "8"].map((g) => (
                <SelectItem key={g} value={g}>
                  Grade {g}
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="graduated">Graduated</SelectItem>
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
        searchColumn="firstName"
        searchPlaceholder="Search students..."
      />

      {/* Add Student Modal */}
      <AddEditStudentModal
        open={isAddStudentModalOpen}
        onOpenChange={setIsAddStudentModalOpen}
        onSubmit={handleAddStudent}
      />

      {/* Edit Student Modal */}
      {selectedStudent && (
        <AddEditStudentModal
          open={isEditStudentModalOpen}
          onOpenChange={setIsEditStudentModalOpen}
          student={selectedStudent as Student}
          onSubmit={handleEditStudent}
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
