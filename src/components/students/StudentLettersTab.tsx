
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen, Download, Mail, Calendar, Eye, Upload, X, Edit, Trash2, ZoomIn, ZoomOut } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [newLetter, setNewLetter] = useState({
    title: "",
    content: "",
    date: new Date().toISOString().slice(0, 10),
    file_url: ""
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editLetter, setEditLetter] = useState<StudentLetter | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewLetter(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!editLetter) return;
    const { name, value } = e.target;
    setEditLetter(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    setSelectedFile(file);
    
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
    if (!newLetter.title || (!newLetter.content && !newLetter.file_url)) {
      toast.error("Please provide a title and either content or upload a file");
      return;
    }

    setIsUploading(true);
    try {
      const { error } = await supabase
        .from('student_letters')
        .insert({
          student_id: studentId,
          title: newLetter.title,
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
      setIsAddLetterModalOpen(false);
      
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

  const handleUpdateLetter = async () => {
    if (!editLetter) return;
    
    if (!editLetter.title || (!editLetter.content && !editLetter.file_url)) {
      toast.error("Please provide a title and either content or a file");
      return;
    }

    setIsUploading(true);
    try {
      const { error } = await supabase
        .from('student_letters')
        .update({
          title: editLetter.title,
          content: editLetter.content || null,
          date: new Date(editLetter.date).toISOString()
        })
        .eq('id', editLetter.id);
      
      if (error) throw error;
      
      // Reset form and close modal
      setEditLetter(null);
      setIsEditLetterModalOpen(false);
      
      // Refresh letters
      refetchLetters();
      
      toast.success("Letter updated successfully");
    } catch (error: any) {
      console.error("Error updating letter:", error);
      toast.error(error.message || "Failed to update letter");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteLetter = async () => {
    if (!currentLetter) return;
    
    try {
      // If there's a file_url, delete the file from storage
      if (currentLetter.file_url) {
        const url = new URL(currentLetter.file_url);
        const path = url.pathname.split('/');
        const fileName = path[path.length - 1];
        const folderName = path[path.length - 2];
        
        // Delete file from storage if it's from our storage
        if (url.hostname.includes('supabase')) {
          await supabase.storage
            .from(folderName)
            .remove([`${folderName}/${fileName}`]);
        }
      }
      
      // Delete from database
      const { error } = await supabase
        .from('student_letters')
        .delete()
        .eq('id', currentLetter.id);
      
      if (error) throw error;
      
      toast.success("Letter deleted successfully");
      
      setCurrentLetter(null);
      setIsViewLetterModalOpen(false);
      setIsDeleteDialogOpen(false);
      
      // Refresh letters
      refetchLetters();
    } catch (error: any) {
      console.error("Error deleting letter:", error);
      toast.error(error.message || "Failed to delete letter");
    }
  };

  const handleViewLetter = (letter: StudentLetter) => {
    setCurrentLetter(letter);
    setIsViewLetterModalOpen(true);
  };

  const handleEditLetter = (letter: StudentLetter) => {
    setEditLetter(letter);
    setIsEditLetterModalOpen(true);
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

  const isPDF = (url?: string) => {
    return url?.toLowerCase().endsWith('.pdf');
  };

  const isImage = (url?: string) => {
    return url?.match(/\.(jpeg|jpg|gif|png)$/i) !== null;
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
          <div className="space-y-4">
            {letters.length > 0 ? (
              letters.map((letter) => (
                <div key={letter.id} className="rounded-lg border p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{letter.title || "Untitled Letter"}</h3>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {formatDate(letter.date)}
                      </p>
                    </div>
                  </div>
                  {letter.content && (
                    <p className="mt-2 text-muted-foreground line-clamp-2">
                      {letter.content}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewLetter(letter)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Letter
                    </Button>
                    {letter.file_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={letter.file_url} download target="_blank" rel="noreferrer">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => handleSendEmail(letter)}>
                      <Mail className="mr-2 h-4 w-4" />
                      Email to Sponsor
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEditLetter(letter)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-destructive hover:bg-destructive/10" 
                      onClick={() => {
                        setCurrentLetter(letter);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-8">
                <p className="mb-4 text-muted-foreground">No letters available</p>
                <Button onClick={() => setIsAddLetterModalOpen(true)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Add First Letter
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Letter Modal */}
      <Dialog open={isAddLetterModalOpen} onOpenChange={setIsAddLetterModalOpen}>
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
            <Button variant="outline" onClick={() => setIsAddLetterModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleAddLetter} 
              disabled={isUploading || !newLetter.title || (!newLetter.content && !newLetter.file_url)}
            >
              {isUploading ? "Uploading..." : "Add Letter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Letter Modal */}
      {editLetter && (
        <Dialog open={isEditLetterModalOpen} onOpenChange={setIsEditLetterModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Letter</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Letter Title</Label>
                <Input
                  id="edit-title"
                  name="title"
                  value={editLetter.title || ""}
                  onChange={handleEditInputChange}
                  placeholder="Enter letter title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-content">Letter Content</Label>
                <Textarea
                  id="edit-content"
                  name="content"
                  rows={4}
                  value={editLetter.content || ""}
                  onChange={handleEditInputChange}
                  placeholder="Enter letter content"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  name="date"
                  type="date"
                  value={editLetter.date ? new Date(editLetter.date).toISOString().slice(0, 10) : ""}
                  onChange={handleEditInputChange}
                />
              </div>
              {editLetter.file_url && (
                <div className="grid gap-2">
                  <Label>Attached File</Label>
                  <div className="flex items-center gap-2 p-2 border rounded-md">
                    <div className="flex-1 truncate">{editLetter.file_url.split('/').pop()}</div>
                    <a 
                      href={editLetter.file_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </a>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Note: File replacement is not available in edit mode
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditLetterModalOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleUpdateLetter} 
                disabled={isUploading || !editLetter.title || (!editLetter.content && !editLetter.file_url)}
              >
                {isUploading ? "Updating..." : "Update Letter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* View Letter Modal */}
      {currentLetter && (
        <Dialog open={isViewLetterModalOpen} onOpenChange={setIsViewLetterModalOpen}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                <span>{currentLetter.title || "Untitled Letter"}</span>
                {currentLetter.file_url && (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={handleZoomOut} disabled={zoomLevel <= 0.5}>
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="mx-2">{Math.round(zoomLevel * 100)}%</span>
                    <Button size="sm" variant="outline" onClick={handleZoomIn} disabled={zoomLevel >= 3}>
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(currentLetter.date)}</span>
              </div>
              
              {currentLetter.content && (
                <div className="border rounded-md p-4 bg-gray-50">
                  <p className="whitespace-pre-wrap">{currentLetter.content}</p>
                </div>
              )}
              
              {currentLetter.file_url && (
                <div className="border rounded-md overflow-hidden flex justify-center">
                  {isPDF(currentLetter.file_url) ? (
                    <div className="w-full" style={{ height: "60vh" }}>
                      <iframe 
                        src={`${currentLetter.file_url}#view=FitH&zoom=${zoomLevel}`}
                        title={currentLetter.title || "Letter"}
                        className="w-full h-full"
                        style={{ border: "none" }}
                      />
                    </div>
                  ) : isImage(currentLetter.file_url) ? (
                    <div className="flex justify-center overflow-auto" style={{ maxHeight: "60vh" }}>
                      <img 
                        src={currentLetter.file_url} 
                        alt={currentLetter.title || "Letter"}
                        style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center top" }}
                        className="transition-transform"
                      />
                    </div>
                  ) : (
                    <div className="p-4 text-center">
                      <p>This file type cannot be previewed</p>
                      <Button className="mt-2" asChild>
                        <a href={currentLetter.file_url} target="_blank" rel="noreferrer">
                          <Download className="mr-2 h-4 w-4" />
                          Download File
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <div className="flex gap-2">
                {currentLetter.file_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={currentLetter.file_url} download target="_blank" rel="noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => handleSendEmail(currentLetter)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email to Sponsor
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  setIsViewLetterModalOpen(false);
                  handleEditLetter(currentLetter);
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the letter
              {currentLetter?.title && ` "${currentLetter.title}"`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteLetter}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
