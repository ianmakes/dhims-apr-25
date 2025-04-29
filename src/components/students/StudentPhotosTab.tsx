import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, X, Maximize, Calendar, MapPin, Info } from "lucide-react";
import ImageUploadCropper from "./ImageUploadCropper";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentPhoto } from "@/types/database";
import { useAuth } from "@/contexts/AuthContext";

interface StudentPhotosTabProps {
  studentName: string;
  studentId: string;
  formatDate: (date: string | Date | null | undefined) => string;
}

export function StudentPhotosTab({ studentName, studentId, formatDate }: StudentPhotosTabProps) {
  const [viewPhoto, setViewPhoto] = useState<StudentPhoto | null>(null);
  const [isAddPhotoModalOpen, setIsAddPhotoModalOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [newPhoto, setNewPhoto] = useState({
    caption: "",
    date: new Date().toISOString().slice(0, 10),
    location: "",
    url: ""
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Fetch photos from Supabase
  const { 
    data: photos = [], 
    refetch: refetchPhotos, 
    isLoading: loadingPhotos 
  } = useQuery<StudentPhoto[]>({
    queryKey: ['student-photos', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_photos')
        .select('*')
        .eq('student_id', studentId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId
  });

  const handleImageChange = (url: string) => {
    setNewPhoto(prev => ({ ...prev, url }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewPhoto(prev => ({ ...prev, [name]: value }));
  };

  const handleAddPhoto = async () => {
    if (!newPhoto.url || !newPhoto.caption) {
      toast({
        title: "Missing information",
        description: "Please provide an image and caption",
        variant: "destructive"
      });
      return;
    }

    setUploadingPhoto(true);
    try {
      const { error } = await supabase
        .from('student_photos')
        .insert({
          student_id: studentId,
          url: newPhoto.url,
          caption: newPhoto.caption,
          date: newPhoto.date,
          location: newPhoto.location || null
        });

      if (error) throw error;
      
      toast({
        title: "Photo added",
        description: "Photo has been added successfully"
      });

      // Reset form and close modal
      setNewPhoto({
        caption: "",
        date: new Date().toISOString().slice(0, 10),
        location: "",
        url: ""
      });
      setIsAddPhotoModalOpen(false);
      
      // Refresh photos list
      refetchPhotos();
    } catch (error: any) {
      console.error("Error adding photo:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add photo",
        variant: "destructive"
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      // Get photo url to delete from storage
      const { data: photoData } = await supabase
        .from('student_photos')
        .select('url')
        .eq('id', photoId)
        .single();
      
      if (photoData?.url) {
        // Extract file path from the URL
        const urlParts = photoData.url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const folderName = urlParts[urlParts.length - 2];
        const filePath = `${folderName}/${fileName}`;
        
        // First delete from storage
        await supabase.storage.from('student-photos').remove([filePath]);
      }

      // Then delete record from database
      const { error } = await supabase
        .from('student_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      toast({
        title: "Photo deleted",
        description: "Photo has been deleted successfully"
      });
      
      // Close view dialog if it's the deleted photo
      if (viewPhoto?.id === photoId) {
        setViewPhoto(null);
      }
      
      refetchPhotos();
    } catch (error: any) {
      console.error("Error deleting photo:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete photo",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="py-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Student Photos</CardTitle>
            <CardDescription>Photos of {studentName}</CardDescription>
          </div>
          <Button onClick={() => setIsAddPhotoModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Photo
          </Button>
        </CardHeader>
        <CardContent>
          {loadingPhotos ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : photos.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {photos.map((photo) => (
                <div key={photo.id} className="overflow-hidden rounded-lg border group relative">
                  <div className="relative h-48">
                    <img 
                      src={photo.url} 
                      alt={photo.caption} 
                      className="h-full w-full object-cover transition-transform group-hover:scale-105" 
                      onError={() => {
                        console.error("Failed to load image:", photo.url);
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="rounded-full" 
                        onClick={() => setViewPhoto(photo)}
                      >
                        <Maximize className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="rounded-full" 
                        onClick={() => handleDeletePhoto(photo.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="font-medium truncate">{photo.caption}</p>
                    <div className="flex items-center text-muted-foreground text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{formatDate(photo.date)}</span>
                    </div>
                    {photo.location && (
                      <div className="flex items-center text-muted-foreground text-xs">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span className="truncate">{photo.location}</span>
                      </div>
                    )}
                    <div className="flex items-center text-muted-foreground text-xs">
                      <Info className="h-3 w-3 mr-1" />
                      <span>{formatDate(photo.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8">
              <p className="mb-4 text-muted-foreground">No photos available</p>
              <Button onClick={() => setIsAddPhotoModalOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add First Photo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Photo Modal */}
      <Dialog open={isAddPhotoModalOpen} onOpenChange={setIsAddPhotoModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Photo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="photo">Photo</Label>
              <ImageUploadCropper
                value={newPhoto.url}
                onChange={handleImageChange}
                label="Upload Photo"
                aspectRatio={16/9}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="caption">Caption</Label>
              <Input
                id="caption"
                name="caption"
                value={newPhoto.caption}
                onChange={handleInputChange}
                placeholder="Enter a caption for this photo"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={newPhoto.date}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                name="location"
                value={newPhoto.location || ""}
                onChange={handleInputChange}
                placeholder="Where was this photo taken?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPhotoModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleAddPhoto} 
              disabled={uploadingPhoto || !newPhoto.url || !newPhoto.caption}
            >
              {uploadingPhoto ? "Uploading..." : "Add Photo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Photo Modal */}
      {viewPhoto && (
        <Dialog open={!!viewPhoto} onOpenChange={() => setViewPhoto(null)}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{viewPhoto.caption}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex justify-center">
                <img 
                  src={viewPhoto.url} 
                  alt={viewPhoto.caption} 
                  className="max-h-[60vh] object-contain rounded-md" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(viewPhoto.date)}</span>
                </div>
                {viewPhoto.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{viewPhoto.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <span>Added: {formatDate(viewPhoto.created_at)}</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
