
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, X, Maximize, Calendar, MapPin, Info, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
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
  const [galleryIndex, setGalleryIndex] = useState(-1);
  const [zoomLevel, setZoomLevel] = useState(1);
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
      if (!studentId) throw new Error('Student ID is required');
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
      
      // Close gallery if it's the deleted photo
      if (galleryIndex !== -1 && photos[galleryIndex]?.id === photoId) {
        setGalleryIndex(-1);
      }
      
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

  const handlePrevPhoto = () => {
    setGalleryIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNextPhoto = () => {
    setGalleryIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
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
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-square w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : photos.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {photos.map((photo, index) => (
                <div key={photo.id} className="overflow-hidden rounded-lg border group relative">
                  <div className="relative aspect-square">
                    <img 
                      src={photo.url} 
                      alt={photo.caption} 
                      className="h-full w-full object-cover transition-transform group-hover:scale-105" 
                      onError={() => {
                        console.error("Failed to load image:", photo.url);
                      }}
                      onClick={() => setGalleryIndex(index)}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="rounded-full" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewPhoto(photo);
                        }}
                      >
                        <Maximize className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="rounded-full" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePhoto(photo.id);
                        }}
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
                aspectRatio={1/1} // Changed to 1:1 aspect ratio
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

      {/* Gallery View */}
      {galleryIndex !== -1 && photos[galleryIndex] && (
        <Dialog open={galleryIndex !== -1} onOpenChange={() => setGalleryIndex(-1)}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                <span>{photos[galleryIndex].caption}</span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleZoomOut} disabled={zoomLevel <= 0.5}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="mx-2">{Math.round(zoomLevel * 100)}%</span>
                  <Button size="sm" variant="outline" onClick={handleZoomIn} disabled={zoomLevel >= 3}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="relative flex justify-center items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute left-0 z-10 bg-background/80 rounded-full" 
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevPhoto();
                }}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              
              <div 
                className="overflow-hidden flex justify-center items-center p-4"
                style={{ maxHeight: 'calc(90vh - 180px)' }}
              >
                <img 
                  src={photos[galleryIndex].url} 
                  alt={photos[galleryIndex].caption}
                  className="max-h-full max-w-full object-contain rounded-md transition-transform duration-200"
                  style={{ transform: `scale(${zoomLevel})` }}
                />
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-0 z-10 bg-background/80 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextPhoto();
                }}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{formatDate(photos[galleryIndex].date)}</span>
                
                {photos[galleryIndex].location && (
                  <>
                    <span className="mx-2">•</span>
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{photos[galleryIndex].location}</span>
                  </>
                )}
              </div>
              
              <div className="text-sm text-muted-foreground">
                {galleryIndex + 1} of {photos.length}
              </div>
            </div>
            
            <DialogFooter className="mt-2">
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  handleDeletePhoto(photos[galleryIndex].id);
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Delete Photo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
