import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddLetterModal } from "@/components/students/AddLetterModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner"; // Removed incorrect Textarea import
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface StudentLettersTabProps {
  studentId: string;
}

export function StudentLettersTab({ studentId }: StudentLettersTabProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: letters, isLoading } = useQuery({
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
      toast({
        title: "Success",
        description: "Letter deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
      />

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
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="ml-2">
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
