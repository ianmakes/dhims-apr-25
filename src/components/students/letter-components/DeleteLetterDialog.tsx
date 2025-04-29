
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StudentLetter {
  id: string;
  title?: string;
  file_url?: string;
}

interface DeleteLetterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  letter: StudentLetter | null;
  onDelete: () => void;
}

export function DeleteLetterDialog({
  open,
  onOpenChange,
  letter,
  onDelete
}: DeleteLetterDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteLetter = async () => {
    if (!letter) return;
    
    setIsDeleting(true);
    try {
      // If there's a file_url, delete the file from storage
      if (letter.file_url) {
        const url = new URL(letter.file_url);
        const path = url.pathname.split('/');
        const fileName = path[path.length - 1];
        const folderName = path[path.length - 2];
        
        // Delete file from storage if it's from our storage
        if (url.hostname.includes('supabase')) {
          await supabase.storage
            .from(folderName)
            .remove([`${folderName}/${fileName}`]);
        }
      }
      
      // Delete from database
      const { error } = await supabase
        .from('student_letters')
        .delete()
        .eq('id', letter.id);
      
      if (error) throw error;
      
      toast.success("Letter deleted successfully");
      
      onOpenChange(false);
      onDelete();
    } catch (error: any) {
      console.error("Error deleting letter:", error);
      toast.error(error.message || "Failed to delete letter");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the letter
            {letter?.title && ` "${letter.title}"`}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDeleteLetter}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
