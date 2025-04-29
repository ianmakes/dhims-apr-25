
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen, Download, Mail, Calendar, Eye, Upload, X, Edit, Trash2, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

// Import refactored components
import { LetterList } from "./letter-components/LetterList";
import { AddLetterDialog } from "./letter-components/AddLetterDialog";
import { ViewLetterDialog } from "./letter-components/ViewLetterDialog";
import { EditLetterDialog } from "./letter-components/EditLetterDialog";
import { DeleteLetterDialog } from "./letter-components/DeleteLetterDialog";

interface StudentLetter {
  id: string;
  title?: string;
  content?: string;
  date: string;
  file_url?: string;
  student_id?: string;
  created_at?: string;
  created_by?: string;
}

interface StudentLettersTabProps {
  studentName: string;
  studentId: string;
  letters: StudentLetter[];
  refetchLetters: () => void;
  onAddLetter: () => void;
  formatDate: (date: string | Date | null | undefined) => string;
}

export function StudentLettersTab({ 
  studentName, 
  studentId, 
  letters,
  refetchLetters,
  onAddLetter, 
  formatDate 
}: StudentLettersTabProps) {
  const [isAddLetterModalOpen, setIsAddLetterModalOpen] = useState(false);
  const [isViewLetterModalOpen, setIsViewLetterModalOpen] = useState(false);
  const [isEditLetterModalOpen, setIsEditLetterModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentLetter, setCurrentLetter] = useState<StudentLetter | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleViewLetter = (letter: StudentLetter) => {
    setCurrentLetter(letter);
    setIsViewLetterModalOpen(true);
  };

  const handleEditLetter = (letter: StudentLetter) => {
    setCurrentLetter(letter);
    setIsEditLetterModalOpen(true);
  };

  const handleDeleteLetterClick = (letter: StudentLetter) => {
    setCurrentLetter(letter);
    setIsDeleteDialogOpen(true);
  };

  const handleSendEmail = (letter: StudentLetter) => {
    // In a real implementation, this would trigger an email to the sponsor
    toast.success(`Email with letter "${letter.title}" sent to sponsor`);
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
            <CardTitle>Student Letters</CardTitle>
            <CardDescription>Letters from {studentName} to sponsors</CardDescription>
          </div>
          <Button onClick={() => setIsAddLetterModalOpen(true)}>
            <FileText className="mr-2 h-4 w-4" />
            Add Letter
          </Button>
        </CardHeader>
        <CardContent>
          <LetterList 
            letters={letters}
            formatDate={formatDate}
            onViewLetter={handleViewLetter}
            onEditLetter={handleEditLetter}
            onSendEmail={handleSendEmail}
            onDeleteLetter={handleDeleteLetterClick}
            onAddFirstLetter={() => setIsAddLetterModalOpen(true)}
          />
        </CardContent>
      </Card>

      {/* Add Letter Modal */}
      <AddLetterDialog
        open={isAddLetterModalOpen}
        onOpenChange={setIsAddLetterModalOpen}
        studentId={studentId}
        refetchLetters={refetchLetters}
      />

      {/* Edit Letter Modal */}
      {currentLetter && (
        <EditLetterDialog
          open={isEditLetterModalOpen}
          onOpenChange={setIsEditLetterModalOpen}
          letter={currentLetter}
          refetchLetters={refetchLetters}
        />
      )}

      {/* View Letter Modal */}
      {currentLetter && (
        <ViewLetterDialog
          open={isViewLetterModalOpen}
          onOpenChange={setIsViewLetterModalOpen}
          letter={currentLetter}
          zoomLevel={zoomLevel}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          formatDate={formatDate}
          onSendEmail={handleSendEmail}
          onEditLetter={() => {
            setIsViewLetterModalOpen(false);
            handleEditLetter(currentLetter);
          }}
          onDeleteLetter={() => setIsDeleteDialogOpen(true)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteLetterDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        letter={currentLetter}
        onDelete={() => {
          setCurrentLetter(null);
          setIsViewLetterModalOpen(false);
          refetchLetters();
        }}
      />
    </div>
  );
}
