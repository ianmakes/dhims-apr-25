
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AddLetterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  onSuccess: () => void;
}

const letterFormSchema = z.object({
  content: z.string().min(1, { message: "Content is required" }),
  date: z.string().optional(),
});

export function AddLetterModal({
  open,
  onOpenChange,
  studentId,
  onSuccess,
}: AddLetterModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<z.infer<typeof letterFormSchema>>({
    resolver: zodResolver(letterFormSchema),
    defaultValues: {
      content: "",
      date: new Date().toISOString().slice(0, 10),
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (values: z.infer<typeof letterFormSchema>) => {
    setIsUploading(true);
    try {
      let fileUrl = "";
      
      // Upload file if selected
      if (selectedFile) {
        // Create a unique filename
        const filename = `${Date.now()}_${selectedFile.name}`;
        const filePath = `${studentId}/${filename}`;
        
        // Upload the file to Supabase storage
        const { data, error } = await supabase.storage
          .from('student-letters')
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;
        
        // Get the public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from('student-letters')
          .getPublicUrl(data.path);
        
        fileUrl = publicUrl;
      }
      
      // Add the letter to the student's letters list in the database
      const { data, error } = await supabase
        .from('student_letters')
        .insert({
          student_id: studentId,
          date: values.date ? new Date(values.date).toISOString() : new Date().toISOString(),
          content: values.content,
          file_url: fileUrl,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Letter added",
        description: "The letter has been added successfully.",
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding letter:', error);
      toast({
        title: 'Error adding letter',
        description: 'Failed to add letter. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Letter</DialogTitle>
          <DialogDescription>
            Add a new letter for this student.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Letter Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter the letter content" 
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Attachment (Optional)</FormLabel>
                <Input 
                  type="file" 
                  onChange={handleFileChange} 
                  className="mt-1"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Selected file: {selectedFile.name}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                type="submit" 
                disabled={isUploading}
              >
                {isUploading ? "Saving..." : "Add Letter"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
