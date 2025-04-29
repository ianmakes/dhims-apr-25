import React, { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { AcademicYearSelector } from "@/components/academic/AcademicYearSelector";

interface Student {
  id: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  date_of_birth: string;
  gender: string;
  admission_date: string;
  admission_number: string;
  academic_year_id: string;
  class_level: string;
  profile_picture_url: string | null;
}

const fetchStudents = async (page: number, pageSize: number, academicYearId?: string) => {
  let query = supabase
    .from("students")
    .select("*", { count: "exact" })
    .order("last_name")
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (academicYearId) {
    query = query.eq('academic_year_id', academicYearId);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return {
    data: data as Student[],
    total: count || 0,
  };
};

const deleteStudent = async (id: string) => {
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) {
    throw error;
  }
};

const AddEditStudentModal: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student;
  onSave?: () => void;
}> = ({ open, onOpenChange, student, onSave }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [firstName, setFirstName] = useState(student?.first_name || "");
  const [lastName, setLastName] = useState(student?.last_name || "");
  const [email, setEmail] = useState(student?.email || "");
  const [phone, setPhone] = useState(student?.phone || "");
  const [address, setAddress] = useState(student?.address || "");
  const [dateOfBirth, setDateOfBirth] = useState(student?.date_of_birth || "");
  const [gender, setGender] = useState(student?.gender || "");
  const [admissionDate, setAdmissionDate] = useState(student?.admission_date || "");
  const [admissionNumber, setAdmissionNumber] = useState(student?.admission_number || "");
  const [classLevel, setClassLevel] = useState(student?.class_level || "");
  const [academicYearId, setAcademicYearId] = useState(student?.academic_year_id || "");

  const classLevels = ["Form 1", "Form 2", "Form 3", "Form 4", "Form 5", "Form 6"];
  const genders = ["Male", "Female", "Other"];

  const { data: academicYears, error: academicYearsError, isLoading: academicYearsLoading } = useQuery(
    ['academicYears'],
    async () => {
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('year_name', { ascending: false });

      if (error) throw error;
      return data;
    }
  );

  useEffect(() => {
    if (student) {
      setFirstName(student.first_name || "");
      setLastName(student.last_name || "");
      setEmail(student.email || "");
      setPhone(student.phone || "");
      setAddress(student.address || "");
      setDateOfBirth(student.date_of_birth || "");
      setGender(student.gender || "");
      setAdmissionDate(student.admission_date || "");
      setAdmissionNumber(student.admission_number || "");
      setClassLevel(student.class_level || "");
      setAcademicYearId(student.academic_year_id || "");
    }
  }, [student]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        address: address,
        date_of_birth: dateOfBirth,
        gender: gender,
        admission_date: admissionDate,
        admission_number: admissionNumber,
        class_level: classLevel,
        academic_year_id: academicYearId,
      };

      let response;
      if (student) {
        response = await supabase.from("students").update(payload).eq("id", student.id);
      } else {
        response = await supabase.from("students").insert(payload);
      }

      if (response.error) {
        throw response.error;
      }

      toast({
        title: "Success",
        description: `Student ${student ? "updated" : "added"} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      onSave?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{student ? "Edit Student" : "Add Student"}</AlertDialogTitle>
          <AlertDialogDescription>
            {student ? "Edit the student details." : "Add a new student to the system."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {genders.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="admissionDate">Admission Date</Label>
            <Input
              id="admissionDate"
              type="date"
              value={admissionDate}
              onChange={(e) => setAdmissionDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="admissionNumber">Admission Number</Label>
            <Input
              id="admissionNumber"
              value={admissionNumber}
              onChange={(e) => setAdmissionNumber(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="classLevel">Class Level</Label>
            <Select value={classLevel} onValueChange={setClassLevel}>
              <SelectTrigger id="classLevel">
                <SelectValue placeholder="Select class level" />
              </SelectTrigger>
              <SelectContent>
                {classLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="academicYear">Academic Year</Label>
            <Select
              value={academicYearId}
              onValueChange={setAcademicYearId}
              disabled={academicYearsLoading}
            >
              <SelectTrigger id="academicYear">
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent>
                {academicYearsLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : academicYearsError ? (
                  <SelectItem value="error" disabled>
                    Error loading academic years
                  </SelectItem>
                ) : (
                  academicYears?.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.year_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isSaving} onClick={handleSave}>
            {isSaving ? "Saving..." : "Save"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const DeleteStudentDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId?: string;
  studentName?: string;
  onSuccess?: () => void;
}> = ({ open, onOpenChange, studentId, studentName, onSuccess }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (!studentId) throw new Error("Student ID is required.");
      await deleteStudent(studentId);
      toast({
        title: "Success",
        description: "Student deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium">{studentName}</span>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isDeleting} onClick={handleDelete} className="bg-destructive">
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const Students: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentYear } = useAcademicYear();

  const {
    data: { data: students, total } = { data: [], total: 0 },
    isLoading,
    isError,
    refetch,
  } = useQuery(
    ["students", page, pageSize, currentYear?.id],
    () => fetchStudents(page, pageSize, currentYear?.id),
    {
      keepPreviousData: true,
    }
  );

  useEffect(() => {
    if (!isLoading) {
      setIsInitialLoad(false);
    }
  }, [isLoading]);

  const handleStudentSaved = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleStudentDeleted = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setIsAddEditModalOpen(true);
  };

  const handleDelete = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteModalOpen(true);
  };

  const handleViewDetails = (idOrSlug: string) => {
    navigate(`/students/${idOrSlug}`);
  };

  const pageCount = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="flex items-center justify-between space-y-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground">
            Manage students and their details.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <AcademicYearSelector />
          <Button onClick={() => setIsAddEditModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Student
          </Button>
        </div>
      </div>
      <div className="py-4">
        <div className="container mx-auto">
          {isError && (
            <div className="rounded-md border p-4">
              <p className="text-sm">
                Error fetching students. Please try again.
              </p>
            </div>
          )}

          <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Photo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Admission #</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isInitialLoad ? (
                  // Render skeleton rows during initial load
                  [...Array(pageSize)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        <Skeleton className="h-10 w-10 rounded-full" />
                      </TableCell>
                      <TableCell className="font-medium">
                        <Skeleton className="h-4 w-[200px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[100px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[80px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[150px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[100px]" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : isLoading ? (
                  // Render skeleton rows during subsequent loads
                  [...Array(pageSize)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        <Skeleton className="h-10 w-10 rounded-full" />
                      </TableCell>
                      <TableCell className="font-medium">
                        <Skeleton className="h-4 w-[200px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[100px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[80px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[150px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[100px]" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : students.length === 0 ? (
                  // Render message when there are no students
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No students found.
                    </TableCell>
                  </TableRow>
                ) : (
                  // Render student rows
                  students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        <Avatar>
                          {student.profile_picture_url ? (
                            <AvatarImage src={student.profile_picture_url} alt={student.first_name} />
                          ) : (
                            <AvatarFallback>
                              {student.first_name.charAt(0)}
                              {student.last_name.charAt(0)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">
                        {student.first_name} {student.last_name}
                      </TableCell>
                      <TableCell>{student.admission_number}</TableCell>
                      <TableCell>{student.class_level}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewDetails(student.id)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(student)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(student)}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {pageCount > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationPrevious
                  href="#"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                />
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p} current={p === page}>
                    <PaginationLink
                      href="#"
                      onClick={() => setPage(p)}
                      className={cn({
                        "bg-blue-500 text-white": p === page,
                      })}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationNext
                  href="#"
                  onClick={() => setPage((prev) => Math.min(prev + 1, pageCount))}
                />
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </div>

      <AddEditStudentModal
        open={isAddEditModalOpen}
        onOpenChange={setIsAddEditModalOpen}
        onSave={handleStudentSaved}
        student={selectedStudent}
      />

      <DeleteStudentDialog
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        studentId={selectedStudent?.id}
        studentName={`${selectedStudent?.first_name} ${selectedStudent?.last_name}`}
        onSuccess={handleStudentDeleted}
      />
    </div>
  );
};

export default Students;
