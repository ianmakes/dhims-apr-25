
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface PhotoType {
  id: string;
  url: string;
  caption: string;
  date: string;
}

interface StudentPhotosTabProps {
  studentName: string;
  photos: PhotoType[];
  onAddPhoto: () => void;
  formatDate: (date: string | Date | null | undefined) => string;
}

export function StudentPhotosTab({ studentName, photos, onAddPhoto, formatDate }: StudentPhotosTabProps) {
  return (
    <div className="py-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Student Photos</CardTitle>
            <CardDescription>Photos of {studentName}</CardDescription>
          </div>
          <Button onClick={onAddPhoto}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Photo
          </Button>
        </CardHeader>
        <CardContent>
          {photos.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {photos.map((photo) => (
                <div key={photo.id} className="overflow-hidden rounded-lg border">
                  <img src={photo.url} alt={photo.caption} className="h-48 w-full object-cover" />
                  <div className="p-3">
                    <p className="font-medium">{photo.caption}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(photo.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8">
              <p className="mb-4 text-muted-foreground">No photos available</p>
              <Button onClick={onAddPhoto}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add First Photo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
