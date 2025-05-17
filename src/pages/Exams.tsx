import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { MoreVertical, Edit, Trash2, FileText, Filter, Search, PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAcademicYear } from "@/contexts/AcademicYearContext";

export default function Exams() {
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<keyof (typeof exams)[0] | null>("exam_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const { toast } = useToast();
  const { currentYear } = useAcademicYear();
  const currentAcademicYear = currentYear?.year_name || '';

  useEffect(() => {
    fetchExams();
  }, [currentAcademicYear]);

  const fetchExams = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("exams")
        .select(`
          *,
          student_exam_scores:student_exam_scores(*)
        `);
      
      // Filter by academic year if one is selected
      if (currentAcademicYear) {
        query = query.eq("academic_year", currentAcademicYear);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching exams:", error);
        setExams([]);
        return;
      }
      
      setExams(data || []);
    } catch (error) {
      console.error("Error in fetchExams:", error);
      setExams([]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteExam = async (examId: string) => {
    try {
      const { error } = await supabase
        .from("exams")
        .delete()
        .eq("id", examId);

      if (error) {
        console.error("Error deleting exam:", error);
        toast({
          title: "Error deleting exam",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Exam deleted",
        description: "The exam has been successfully deleted.",
      });

      fetchExams();
    } catch (error) {
      console.error("Error deleting exam:", error);
      toast({
        title: "Error deleting exam",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSort = (column: keyof (typeof exams)[0]) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedExams = [...exams].sort((a, b) => {
    if (!sortColumn) return 0;
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    } else if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  const filteredExams = sortedExams.filter((exam) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      exam.exam_name?.toLowerCase().includes(searchTermLower) ||
      exam.subject?.toLowerCase().includes(searchTermLower) ||
      exam.exam_date?.toLowerCase().includes(searchTermLower)
    );
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Exams"
        description={`Manage all exams${currentYear ? ` for ${currentYear.year_name} academic year` : ''}`}
        actions={
          <Link to="/exams/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Exam
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exams..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ScrollArea>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort("exam_name")} className="cursor-pointer">
                Exam Name
              </TableHead>
              <TableHead onClick={() => handleSort("subject")} className="cursor-pointer">
                Subject
              </TableHead>
              <TableHead onClick={() => handleSort("exam_date")} className="cursor-pointer">
                Exam Date
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Display skeletons while loading
              <>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-4 w-[200px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[150px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-[80px]" />
                    </TableCell>
                  </TableRow>
                ))}
              </>
            ) : filteredExams.length > 0 ? (
              // Display exam data when available
              filteredExams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">{exam.exam_name}</TableCell>
                  <TableCell>{exam.subject}</TableCell>
                  <TableCell>{format(new Date(exam.exam_date), "PPP")}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/exams/${exam.id}`}>
                            <Edit className="mr-2 h-4 w-4" /> <span>Edit</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="focus:bg-red-500 focus:text-red-50">
                                <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the exam and
                                  remove all data associated with it.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteExam(exam.id)}>Continue</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              // Display message when no exams are found
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No exams found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
