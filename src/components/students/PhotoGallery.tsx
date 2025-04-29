
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Photo {
  id: string;
  url: string;
  caption: string;
  date: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  formatDate: (date: string | Date | null | undefined) => string;
}

export function PhotoGallery({ photos, formatDate }: PhotoGalleryProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const openPhotoViewer = (index: number) => {
    setSelectedPhotoIndex(index);
    setViewerOpen(true);
  };

  const nextPhoto = () => {
    if (selectedPhotoIndex === null || photos.length === 0) return;
    setSelectedPhotoIndex((selectedPhotoIndex + 1) % photos.length);
  };

  const prevPhoto = () => {
    if (selectedPhotoIndex === null || photos.length === 0) return;
    setSelectedPhotoIndex((selectedPhotoIndex - 1 + photos.length) % photos.length);
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <div 
            key={photo.id} 
            className="cursor-pointer group overflow-hidden rounded-lg relative aspect-square"
            onClick={() => openPhotoViewer(index)}
          >
            <img
              src={photo.url}
              alt={photo.caption || `Photo ${index + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
              <p className="text-white font-medium text-sm truncate">{photo.caption}</p>
              <p className="text-white/80 text-xs">{formatDate(photo.date)}</p>
            </div>
          </div>
        ))}
      </div>
      
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="sm:max-w-4xl p-0 bg-black border-none">
          {selectedPhotoIndex !== null && photos[selectedPhotoIndex] && (
            <div className="relative">
              <div className="flex items-center justify-center h-[80vh] relative">
                <img
                  src={photos[selectedPhotoIndex].url}
                  alt={photos[selectedPhotoIndex].caption || `Photo ${selectedPhotoIndex + 1}`}
                  className="max-h-full max-w-full object-contain"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                  onClick={() => setViewerOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="absolute left-0 top-1/2 -translate-y-1/2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-black/50 text-white hover:bg-black/70"
                  onClick={prevPhoto}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              </div>
              
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-black/50 text-white hover:bg-black/70"
                  onClick={nextPhoto}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-4">
                <h3 className="text-white text-lg font-medium mb-1">
                  {photos[selectedPhotoIndex].caption || `Photo ${selectedPhotoIndex + 1}`}
                </h3>
                <p className="text-white/70">
                  {formatDate(photos[selectedPhotoIndex].date)}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
