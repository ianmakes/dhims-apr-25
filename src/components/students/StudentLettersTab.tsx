
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Mail, Eye, Trash2 } from "lucide-react";
import { AddLetterModal } from "@/components/students/AddLetterModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface StudentLettersTabProps {
  studentId: string;
}

export function StudentLettersTab({ studentId }: StudentLettersTabProps) {
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: letters, isLoading, refetch: refetchLetters } = useQuery({
    queryKey: ["student-letters", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_letters")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching student letters:", error);
        throw error;
      }

      return data;
    },
  });

  const deleteLetterMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("student_letters")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting student letter:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-letters", studentId] });
      toast.success("Letter deleted successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to delete letter: " + error.message);
    },
  });

  const handleEmailToSponsor = async (letter: any) => {
    // Get student details to find sponsor
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("*, sponsors(*)")
      .eq("id", studentId)
      .single();

    if (studentError || !student.sponsor_id) {
      toast.error(student.sponsor_id ? "Error finding sponsor" : "Student has no sponsor");
      return;
    }

    // In a real implementation, this would trigger an email to the sponsor
    toast.success(`Email to sponsor would be sent here with letter: ${letter.title}`);
  };

  const handlePreviewLetter = (letter: any) => {
    setSelectedLetter(letter);
    setPreviewOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Student Letters</h2>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Letter
        </Button>
      </div>

      <AddLetterModal
        open={open}
        onOpenChange={setOpen}
        studentId={studentId}
        onSuccess={() => refetchLetters()}
      />

      {/* Letter Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedLetter?.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">
              Created on {selectedLetter && format(new Date(selectedLetter.created_at), "MMMM d, yyyy")}
            </p>
            <Separator className="my-2" />
            <div className="max-h-[60vh] overflow-y-auto whitespace-pre-line">
              {selectedLetter?.content}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <p>Loading letters...</p>
      ) : letters && letters.length > 0 ? (
        <div className="space-y-4">
          {letters.map((letter) => (
            <Card key={letter.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-md font-semibold">{letter.title}</h3>
                  <p className="text-sm text-gray-500">
                    Created on {format(new Date(letter.created_at), "MMMM d, yyyy")}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEmailToSponsor(letter)}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Email to Sponsor
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handlePreviewLetter(letter)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the letter from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteLetterMutation.mutate(letter.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <Separator className="my-2" />
              <p className="text-sm">{letter.content}</p>
            </Card>
          ))}
        </div>
      ) : (
        <p>No letters found for this student.</p>
      )}
    </div>
  );
}
