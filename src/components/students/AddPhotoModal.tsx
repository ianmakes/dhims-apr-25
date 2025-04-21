
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AddPhotoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  onSuccess: () => void;
}

const photoFormSchema = z.object({
  caption: z.string().min(1, { message: "Caption is required" }),
  date: z.string().optional(),
});

export function AddPhotoModal({
  open,
  onOpenChange,
  studentId,
  onSuccess,
}: AddPhotoModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<z.infer<typeof photoFormSchema>>({
    resolver: zodResolver(photoFormSchema),
    defaultValues: {
      caption: "",
      date: new Date().toISOString().slice(0, 10),
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (values: z.infer<typeof photoFormSchema>) => {
    if (!selectedImage) {
      toast({
        title: "Image required",
        description: "Please select an image to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Create a unique filename
      const filename = `${Date.now()}_${selectedImage.name}`;
      const filePath = `${studentId}/${filename}`;
      
      // Upload the image to Supabase storage
      const { data, error } = await supabase.storage
        .from('student-photos')
        .upload(filePath, selectedImage, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;
      
      // Get the public URL for the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('student-photos')
        .getPublicUrl(data.path);
      
      // Add the photo to the student's photos list
      // Note: In a real app, you'd likely have a separate photos table
      const photoData = {
        student_id: studentId,
        url: publicUrl,
        caption: values.caption,
        date: values.date ? new Date(values.date).toISOString() : new Date().toISOString(),
        created_by: user?.id,
        created_at: new Date().toISOString(),
      };

      // For now, we'll just save this in local storage for demo purposes
      // In a real app, this would be saved to a database table
      const existingPhotos = JSON.parse(localStorage.getItem(`student_photos_${studentId}`) || '[]');
      existingPhotos.push({ id: Date.now().toString(), ...photoData });
      localStorage.setItem(`student_photos_${studentId}`, JSON.stringify(existingPhotos));
      
      toast({
        title: "Photo uploaded",
        description: "The photo has been uploaded successfully.",
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: 'Error uploading photo',
        description: 'Failed to upload photo. Please try again.',
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
          <DialogTitle>Add New Photo</DialogTitle>
          <DialogDescription>
            Upload a new photo for this student.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-4">
              <div>
                <FormLabel>Photo</FormLabel>
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="mt-1"
                />
                {selectedImage && (
                  <div className="mt-2">
                    <img 
                      src={URL.createObjectURL(selectedImage)} 
                      alt="Preview" 
                      className="mt-1 h-40 w-auto rounded-md object-contain" 
                    />
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="caption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caption</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a caption for this photo" {...field} />
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
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                type="submit" 
                disabled={isUploading || !selectedImage}
              >
                {isUploading ? "Uploading..." : "Upload Photo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
