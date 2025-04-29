
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { PhotoGallery } from "./PhotoGallery";

interface StudentPhotosTabProps {
  studentName: string;
  studentId: string;
  formatDate: (date: string | Date | null | undefined) => string;
}

export function StudentPhotosTab({ studentName, studentId, formatDate }: StudentPhotosTabProps) {
  const { data: photos = [], isLoading } = useQuery({
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

  const handleAddPhoto = () => {
    // Will be implemented in another component
  };

  return (
    <div className="py-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Photos</CardTitle>
            <CardDescription>Photo gallery for {studentName}</CardDescription>
          </div>
          <Button onClick={handleAddPhoto}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Photo
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <p>Loading photos...</p>
            </div>
          ) : photos.length > 0 ? (
            <PhotoGallery photos={photos} formatDate={formatDate} />
          ) : (
            <div className="flex flex-col items-center justify-center p-8">
              <p className="mb-4 text-muted-foreground">No photos available</p>
              <Button onClick={handleAddPhoto}>
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
