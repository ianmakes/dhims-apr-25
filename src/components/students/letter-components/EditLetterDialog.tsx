
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StudentLetter {
  id: string;
  title?: string;
  content?: string;
  date: string;
  file_url?: string;
}

interface EditLetterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  letter: StudentLetter;
  refetchLetters: () => void;
}

export function EditLetterDialog({
  open,
  onOpenChange,
  letter,
  refetchLetters
}: EditLetterDialogProps) {
  const [editLetter, setEditLetter] = useState<StudentLetter | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  useEffect(() => {
    if (letter) {
      setEditLetter(letter);
    }
  }, [letter]);
  
  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!editLetter) return;
    const { name, value } = e.target;
    setEditLetter(prev => prev ? { ...prev, [name]: value } : null);
  };
  
  const handleUpdateLetter = async () => {
    if (!editLetter) return;
    
    if (!editLetter.title || (!editLetter.content && !editLetter.file_url)) {
      toast.error("Please provide a title and either content or a file");
      return;
    }

    setIsUploading(true);
    try {
      const { error } = await supabase
        .from('student_letters')
        .update({
          title: editLetter.title,
          content: editLetter.content || null,
          date: new Date(editLetter.date).toISOString()
        })
        .eq('id', editLetter.id);
      
      if (error) throw error;
      
      // Reset form and close modal
      setEditLetter(null);
      onOpenChange(false);
      
      // Refresh letters
      refetchLetters();
      
      toast.success("Letter updated successfully");
    } catch (error: any) {
      console.error("Error updating letter:", error);
      toast.error(error.message || "Failed to update letter");
    } finally {
      setIsUploading(false);
    }
  };
  
  if (!editLetter) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Letter</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-title">Letter Title</Label>
            <Input
              id="edit-title"
              name="title"
              value={editLetter.title || ""}
              onChange={handleEditInputChange}
              placeholder="Enter letter title"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-content">Letter Content</Label>
            <Textarea
              id="edit-content"
              name="content"
              rows={4}
              value={editLetter.content || ""}
              onChange={handleEditInputChange}
              placeholder="Enter letter content"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-date">Date</Label>
            <Input
              id="edit-date"
              name="date"
              type="date"
              value={editLetter.date ? new Date(editLetter.date).toISOString().slice(0, 10) : ""}
              onChange={handleEditInputChange}
            />
          </div>
          {editLetter.file_url && (
            <div className="grid gap-2">
              <Label>Attached File</Label>
              <div className="flex items-center gap-2 p-2 border rounded-md">
                <div className="flex-1 truncate">{editLetter.file_url.split('/').pop()}</div>
                <a 
                  href={editLetter.file_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View
                </a>
              </div>
              <p className="text-sm text-muted-foreground">
                Note: File replacement is not available in edit mode
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateLetter} 
            disabled={isUploading || !editLetter.title || (!editLetter.content && !editLetter.file_url)}
          >
            {isUploading ? "Updating..." : "Update Letter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
