import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, CaretSortIcon, ChevronDownIcon, Edit, Eye, FileText, Filter, Plus, RefreshCcw, Search, Trash2, UserPlus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAcademicYear } from "@/contexts/AcademicYearContext";

type Student = {
  id: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  address: string;
  contact_number: string;
  email: string;
  guardian_name: string;
  guardian_contact_number: string;
  enrollment_date: string;
  grade_level: string;
  academic_performance: string;
  attendance_record: string;
  behavioral_notes: string;
  medical_information: string;
  special_needs: string;
  extracurricular_activities: string;
  notes: string;
  sponsor_id: string | null;
  current_academic_year: number;
};

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<keyof Student | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>();
  const { toast } = useToast()
  
  const { currentYear } = useAcademicYear();
  const currentAcademicYear = currentYear?.year_name || '';

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from("students").select("*");
      
      // Filter by academic year if one is selected
      if (currentAcademicYear) {
        query = query.eq("current_academic_year", parseInt(currentAcademicYear));
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching students:", error);
        return;
      }
      
      setStudents(data || []);
    } catch (error) {
      console.error("Error in fetchStudents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [currentAcademicYear]);

  const handleSort = (column: keyof Student) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedStudents = [...students].sort((a, b) => {
    if (sortColumn) {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
    }
    return 0;
  });

  const filteredStudents = sortedStudents.filter((student) => {
    const searchRegex = new RegExp(searchQuery, "i");
    return (
      searchRegex.test(student.first_name) ||
      searchRegex.test(student.last_name) ||
      searchRegex.test(student.email)
    );
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Students"
        description={`Manage all students${currentYear ? ` for ${currentYear.year_name} academic year` : ''}`}
        actions={
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button>
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Drawer>
              <DrawerTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Student
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Add Student</DrawerTitle>
                  <DrawerDescription>
                    Make changes to your profile here. Click save when you're
                    done.
                  </DrawerDescription>
                </DrawerHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input id="name" value="Pedro Duarte" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right">
                      Username
                    </Label>
                    <Input
                      id="username"
                      value="@peduarte"
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DrawerFooter>
                  <Button>Save changes</Button>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>
            All students in your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("first_name")}
                    >
                      First Name
                      {sortColumn === "first_name" && (
                        <CaretSortIcon className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("last_name")}
                    >
                      Last Name
                      {sortColumn === "last_name" && (
                        <CaretSortIcon className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("email")}
                    >
                      Email
                      {sortColumn === "email" && (
                        <CaretSortIcon className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("grade_level")}
                    >
                      Grade
                      {sortColumn === "grade_level" && (
                        <CaretSortIcon className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Loading students...
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No students found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.first_name}
                      </TableCell>
                      <TableCell>{student.last_name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.grade_level}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <DotsHorizontalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Trash2 className="mr-2 h-4 w-4" />
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
        </CardContent>
      </Card>
    </div>
  );
}
