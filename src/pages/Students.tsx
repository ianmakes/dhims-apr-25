
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Download, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AddEditStudentModal } from "@/components/students/AddEditStudentModal";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAcademicYear } from "@/contexts/AcademicYearContext";

export default function Students() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { currentYear } = useAcademicYear();
  
  // Fetch students
  const { data: students = [], isLoading, refetch } = useQuery({
    queryKey: ["students", currentYear?.id],
    queryFn: async () => {
      try {
        let query = supabase
          .from("students")
          .select(`
            id, 
            name,
            gender,
            admission_number,
            current_grade,
            dob,
            status,
            current_academic_year,
            sponsor_id,
            profile_image_url,
            created_at,
            updated_at
          `)
          .order("name", { ascending: true });
          
        // Filter by academic year if available
        if (currentYear) {
          query = query.eq("current_academic_year", parseInt(currentYear.year_name));
        }
          
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        return data || [];
      } catch (error: any) {
        console.error("Error fetching students:", error);
        toast({
          title: "Error",
          description: `Failed to load students: ${error.message}`,
          variant: "destructive"
        });
        return [];
      }
    },
    enabled: true,
  });
  
  // Filter students by search term
  const filteredStudents = searchTerm
    ? students.filter((student) => {
        const searchRegex = new RegExp(searchTerm, "i");
        return (
          searchRegex.test(student.name) ||
          (student.admission_number && searchRegex.test(student.admission_number))
        );
      })
    : students;
  
  const handleAddStudent = () => {
    setIsModalOpen(true);
  };
  
  const handleStudentSaved = () => {
    refetch();
    setIsModalOpen(false);
    toast({
      title: "Success",
      description: "Student has been saved successfully.",
    });
  };
  
  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "graduated":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  // Year label for the page title
  const yearLabel = currentYear ? ` - ${currentYear.year_name}` : "";

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Students${yearLabel}`}
        description="Manage and view all students in the system"
        actions={
          <Button onClick={handleAddStudent}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name or ID..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" className="flex-1 sm:flex-none">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        {isLoading ? (
          // Loading skeleton
          <>
            <div className="p-4">
              <Skeleton className="h-8 w-full" />
            </div>
            {[...Array(5)].map((_, index) => (
              <div key={index} className="p-4 border-t">
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </>
        ) : filteredStudents.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead className="min-w-[200px]">Name</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Sponsored</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    {student.admission_number || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-muted mr-2 overflow-hidden">
                        {student.profile_image_url ? (
                          <img
                            src={student.profile_image_url}
                            alt={student.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-medium">
                            {student.name?.substring(0, 2).toUpperCase() || "ST"}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {/* Display formatted date of birth if available */}
                          {student.dob
                            ? `DOB: ${new Date(student.dob).toLocaleDateString()}`
                            : "No DOB recorded"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{student.current_grade || "-"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getStatusColor(student.status)}
                    >
                      {student.status || "Unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">
                    {student.gender || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={student.sponsor_id ? "default" : "outline"}
                      className={
                        student.sponsor_id
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                      }
                    >
                      {student.sponsor_id ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/students/${student.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="mb-2">No students found</p>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm
                ? "Try adjusting your search term"
                : currentYear 
                  ? `No students are registered for the ${currentYear.year_name} academic year` 
                  : "Get started by adding your first student"}
            </p>
            <Button onClick={handleAddStudent} variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Student Modal */}
      <AddEditStudentModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleStudentSaved}
      />
    </div>
  );
}
