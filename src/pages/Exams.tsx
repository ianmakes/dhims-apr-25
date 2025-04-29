
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
import { PlusCircle, Download, Filter, Search, BookOpen, FileSpreadsheet, Edit, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ImportStudentScoresModal } from "@/components/exams/ImportStudentScoresModal";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAcademicYear } from "@/contexts/AcademicYearContext";

export default function Exams() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<string | null>(null);
  const { currentYear } = useAcademicYear();

  // Fetch exams
  const { data: exams = [], isLoading, refetch } = useQuery({
    queryKey: ["exams", currentYear?.id],
    queryFn: async () => {
      try {
        let query = supabase
          .from("exams")
          .select("*")
          .order("exam_date", { ascending: false });
          
        // Filter by academic year if available
        if (currentYear) {
          query = query.eq("academic_year", currentYear.year_name);
        }
          
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        return data || [];
      } catch (error: any) {
        console.error("Error fetching exams:", error);
        toast({
          title: "Error",
          description: `Failed to load exams: ${error.message}`,
          variant: "destructive"
        });
        return [];
      }
    },
    enabled: true,
  });

  // Filter exams by search term
  const filteredExams = searchTerm
    ? exams.filter((exam) => {
        const searchRegex = new RegExp(searchTerm, "i");
        return (
          searchRegex.test(exam.name) ||
          searchRegex.test(exam.term) ||
          searchRegex.test(exam.academic_year)
        );
      })
    : exams;

  const handleDeleteExam = async () => {
    if (!examToDelete) return;

    try {
      // First delete associated exam scores
      const { error: scoresError } = await supabase
        .from("student_exam_scores")
        .delete()
        .eq("exam_id", examToDelete);

      if (scoresError) throw scoresError;

      // Then delete the exam
      const { error: examError } = await supabase
        .from("exams")
        .delete()
        .eq("id", examToDelete);

      if (examError) throw examError;

      toast({
        title: "Success",
        description: "Exam has been deleted successfully.",
      });

      refetch();
    } catch (error: any) {
      console.error("Error deleting exam:", error);
      toast({
        title: "Error",
        description: `Failed to delete exam: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setExamToDelete(null);
    }
  };

  // Year label for the page title
  const yearLabel = currentYear ? ` - ${currentYear.year_name}` : "";

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Exams${yearLabel}`}
        description="Manage and track student exam records"
        actions={
          <Link to="/exams/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Exam
            </Button>
          </Link>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search exams..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setIsImportModalOpen(true)}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Import Scores
          </Button>
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
        ) : filteredExams.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam Name</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Passing Score</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary/10 mr-2 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{exam.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{exam.term}</TableCell>
                  <TableCell>{exam.academic_year}</TableCell>
                  <TableCell>
                    {exam.exam_date ? format(new Date(exam.exam_date), 'PP') : 'Not set'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {exam.passing_score}/{exam.max_score}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/exams/${exam.id}`}>View</Link>
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setExamToDelete(exam.id);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="mb-2">No exams found</p>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm 
                ? "Try adjusting your search term" 
                : currentYear
                  ? `No exams have been created for the ${currentYear.year_name} academic year`
                  : "Start by creating your first exam"}
            </p>
            <Link to="/exams/new">
              <Button variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Exam
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Import Student Scores Modal */}
      <ImportStudentScoresModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={() => {
          refetch();
          setIsImportModalOpen(false);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Exam</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this exam? This action will also delete all associated student scores and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteExam}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
