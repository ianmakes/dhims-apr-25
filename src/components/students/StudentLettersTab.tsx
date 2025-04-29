import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen, Download, Mail, Calendar, Eye, Upload, X, ZoomIn, ZoomOut } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { StudentLetter } from "@/types/database";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
interface StudentLettersTabProps {
  studentName: string;
  onAddLetter: () => void;
  formatDate: (date: string | Date | null | undefined) => string;
  studentId: string; // Add studentId prop
}
export function StudentLettersTab({
  studentName,
  onAddLetter,
  formatDate,
  studentId
}: StudentLettersTabProps) {
  const queryClient = useQueryClient();
  const [isViewLetterModalOpen, setIsViewLetterModalOpen] = useState(false);
  const [currentLetter, setCurrentLetter] = useState<StudentLetter | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Fetch letters from the database for this student
  const {
    data: studentLetters = [],
    isLoading,
    error,
    refetch: refetchLetters
  } = useQuery({
    queryKey: ['student-letters', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const {
        data,
        error
      } = await supabase.from('student_letters').select('*').eq('student_id', studentId).order('date', {
        ascending: false
      });
      if (error) throw error;
      return data as StudentLetter[];
    },
    enabled: !!studentId
  });
  const handleViewLetter = (letter: StudentLetter) => {
    setCurrentLetter(letter);
    setIsViewLetterModalOpen(true);
    setZoomLevel(1); // Reset zoom level when opening a new letter
  };
  const handleSendEmail = (letter: StudentLetter) => {
    // In a real implementation, this would trigger an email to the sponsor
    toast.success(`Email with letter "${letter.title || 'Letter'}" sent to sponsor`);
  };
  const handleDeleteLetter = async () => {
    if (!currentLetter) return;
    try {
      const {
        error
      } = await supabase.from('student_letters').delete().eq('id', currentLetter.id);
      if (error) throw error;
      toast.success("Letter deleted successfully");
      setIsDeleteDialogOpen(false);
      setIsViewLetterModalOpen(false);
      refetchLetters();
    } catch (error) {
      console.error('Error deleting letter:', error);
      toast.error("Failed to delete letter");
    }
  };
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3)); // Limit max zoom to 3x
  };
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5)); // Limit min zoom to 0.5x
  };

  // Function to determine if the file is a PDF
  const isPDF = (url: string | undefined) => {
    if (!url) return false;
    return url.toLowerCase().endsWith('.pdf');
  };

  // Function to determine if the file is an image
  const isImage = (url: string | undefined) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg') || lowerUrl.endsWith('.png') || lowerUrl.endsWith('.gif') || lowerUrl.endsWith('.webp');
  };
  return <div className="py-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-left">Student Letters</CardTitle>
            <CardDescription>Letters from {studentName} to sponsors</CardDescription>
          </div>
          <Button onClick={onAddLetter}>
            <FileText className="mr-2 h-4 w-4" />
            Add Letter
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? <div className="flex justify-center items-center p-8">
                <p>Loading letters...</p>
              </div> : error ? <div className="flex justify-center items-center p-8 text-red-500">
                <p>Error loading letters: {(error as Error).message}</p>
              </div> : studentLetters.length > 0 ? studentLetters.map(letter => <div key={letter.id} className="rounded-lg border p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{letter.title || 'Letter'}</h3>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {formatDate(letter.date)}
                      </p>
                    </div>
                  </div>
                  {letter.content && <p className="mt-2 text-muted-foreground line-clamp-2 text-left">
                      {letter.content}
                    </p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewLetter(letter)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Letter
                    </Button>
                    {letter.file_url && <Button variant="outline" size="sm" asChild>
                        <a href={letter.file_url} download={`letter-${letter.id}${isPDF(letter.file_url) ? '.pdf' : '.jpg'}`} target="_blank" rel="noreferrer">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </a>
                      </Button>}
                    <Button variant="outline" size="sm" onClick={() => handleSendEmail(letter)}>
                      <Mail className="mr-2 h-4 w-4" />
                      Email to Sponsor
                    </Button>
                  </div>
                </div>) : <div className="flex flex-col items-center justify-center p-8">
                <p className="mb-4 text-muted-foreground">No letters available</p>
                <Button onClick={onAddLetter}>
                  <FileText className="mr-2 h-4 w-4" />
                  Add First Letter
                </Button>
              </div>}
          </div>
        </CardContent>
      </Card>

      {/* View Letter Modal */}
      {currentLetter && <Dialog open={isViewLetterModalOpen} onOpenChange={setIsViewLetterModalOpen}>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>{currentLetter.title || 'Letter'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(currentLetter.date)}</span>
              </div>
              
              {currentLetter.content && <div className="border rounded-md p-4 bg-gray-50 max-h-40 overflow-y-auto">
                  <p className="whitespace-pre-wrap">{currentLetter.content}</p>
                </div>}
              
              {currentLetter.file_url && <div className="border rounded-md overflow-hidden relative">
                  <div className="absolute top-2 right-2 z-10 flex gap-2 bg-white/80 p-1 rounded-md shadow">
                    <Button variant="outline" size="icon" onClick={handleZoomIn}>
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleZoomOut}>
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div style={{
              overflow: 'auto',
              maxHeight: '60vh'
            }}>
                    {isPDF(currentLetter.file_url) ? <iframe src={`${currentLetter.file_url}#zoom=${zoomLevel * 100}`} title={currentLetter.title || 'Letter PDF'} className="w-full h-[60vh]" style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top left'
              }} /> : isImage(currentLetter.file_url) ? <div className="flex justify-center">
                        <img src={currentLetter.file_url} alt={currentLetter.title || 'Letter Image'} className="max-h-[60vh] object-contain" style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center center'
                }} />
                      </div> : <div className="p-4 text-center">
                        <p>Preview not available for this file type.</p>
                        <Button variant="outline" size="sm" asChild className="mt-2">
                          <a href={currentLetter.file_url} target="_blank" rel="noreferrer">
                            <Download className="mr-2 h-4 w-4" />
                            Download File
                          </a>
                        </Button>
                      </div>}
                  </div>
                </div>}
            </div>
            <DialogFooter>
              <div className="flex justify-between w-full">
                <Button variant="destructive" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>
                  Delete
                </Button>
                <div className="flex gap-2">
                  {currentLetter.file_url && <Button variant="outline" size="sm" asChild>
                      <a href={currentLetter.file_url} download={`letter-${currentLetter.id}${isPDF(currentLetter.file_url) ? '.pdf' : '.jpg'}`} target="_blank" rel="noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </a>
                    </Button>}
                  <Button variant="outline" size="sm" onClick={() => handleSendEmail(currentLetter)}>
                    <Mail className="mr-2 h-4 w-4" />
                    Email to Sponsor
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the letter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLetter}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
}