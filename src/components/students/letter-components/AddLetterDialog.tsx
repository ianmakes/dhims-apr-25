
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X } from "lucide-react";

interface AddLetterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  refetchLetters: () => void;
}

export function AddLetterDialog({
  open,
  onOpenChange,
  studentId,
  refetchLetters
}: AddLetterDialogProps) {
  const [newLetter, setNewLetter] = useState({
    title: "",
    content: "",
    date: new Date().toISOString().slice(0, 10),
    file_url: ""
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewLetter(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    setSelectedFile(file);
    
    // If no title is set yet, use the filename (without extension) as the title
    if (!newLetter.title) {
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setNewLetter(prev => ({ ...prev, title: fileNameWithoutExt }));
    }
    
    // Upload file to Supabase storage
    setIsUploading(true);
    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `student-letters/${fileName}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('student-letters')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('student-letters')
        .getPublicUrl(filePath);
      
      setNewLetter(prev => ({ 
        ...prev, 
        file_url: publicUrl
      }));
      
      toast.success("File uploaded successfully");
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast.error(error.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddLetter = async () => {
    if (!newLetter.content && !newLetter.file_url) {
      toast.error("Please provide either content or upload a file");
      return;
    }

    setIsUploading(true);
    try {
      const { error } = await supabase
        .from('student_letters')
        .insert({
          student_id: studentId,
          title: newLetter.title || null,
          content: newLetter.content || null,
          file_url: newLetter.file_url || null,
          date: new Date(newLetter.date).toISOString()
        });
      
      if (error) throw error;
      
      // Reset form and close modal
      setNewLetter({
        title: "",
        content: "",
        date: new Date().toISOString().slice(0, 10),
        file_url: ""
      });
      setSelectedFile(null);
      onOpenChange(false);
      
      // This would refresh the letters
      refetchLetters();
      
      toast.success("Letter added successfully");
    } catch (error: any) {
      console.error("Error adding letter:", error);
      toast.error(error.message || "Failed to add letter");
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Letter</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Letter Title</Label>
            <Input
              id="title"
              name="title"
              value={newLetter.title}
              onChange={handleInputChange}
              placeholder="Enter letter title"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content">Letter Content (Optional if file is uploaded)</Label>
            <Textarea
              id="content"
              name="content"
              rows={4}
              value={newLetter.content}
              onChange={handleInputChange}
              placeholder="Enter letter content"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={newLetter.date}
              onChange={handleInputChange}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="file">Upload File (PDF or Image)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileChange}
                className={newLetter.file_url ? "hidden" : ""}
                disabled={isUploading}
              />
              {newLetter.file_url && (
                <div className="flex items-center gap-2 p-2 border rounded-md w-full">
                  <div className="flex-1 truncate">{newLetter.file_url.split('/').pop()}</div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setNewLetter(prev => ({ ...prev, file_url: "" }));
                    }}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {isUploading && (
                <div className="ml-2 text-sm text-muted-foreground">Uploading...</div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleAddLetter} 
            disabled={isUploading || (!newLetter.content && !newLetter.file_url)}
          >
            {isUploading ? "Uploading..." : "Add Letter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
