
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen, Download, Mail, Calendar, Eye, Upload, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface StudentLetter {
  id: string;
  title: string;
  content?: string;
  date: string;
  fileName?: string;
  fileUrl?: string;
}

interface StudentLettersTabProps {
  studentName: string;
  onAddLetter: () => void;
  formatDate: (date: string | Date | null | undefined) => string;
}

// Mock data for letters
const mockLetters: StudentLetter[] = [
  {
    id: "1",
    title: "Thank you letter to sponsor",
    content: "Dear Sponsor, thank you for your continued support...",
    date: new Date(2024, 1, 15).toISOString(),
    fileUrl: "https://example.com/letter1.pdf",
    fileName: "letter1.pdf"
  },
  {
    id: "2",
    title: "School progress update",
    content: "Dear Sponsor, I am doing well in school...",
    date: new Date(2024, 2, 20).toISOString(),
    fileUrl: "https://example.com/letter2.pdf",
    fileName: "letter2.pdf"
  },
  {
    id: "3",
    title: "Holiday greetings",
    content: "Dear Sponsor, Happy holidays to you and your family...",
    date: new Date(2024, 3, 10).toISOString(),
    fileUrl: "https://example.com/letter3.pdf",
    fileName: "letter3.pdf"
  }
];

export function StudentLettersTab({ studentName, onAddLetter, formatDate }: StudentLettersTabProps) {
  const [letters] = useState<StudentLetter[]>(mockLetters);
  const [isAddLetterModalOpen, setIsAddLetterModalOpen] = useState(false);
  const [isViewLetterModalOpen, setIsViewLetterModalOpen] = useState(false);
  const [currentLetter, setCurrentLetter] = useState<StudentLetter | null>(null);
  const [newLetter, setNewLetter] = useState({
    title: "",
    content: "",
    date: new Date().toISOString().slice(0, 10),
    fileName: "",
    fileUrl: ""
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewLetter(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setNewLetter(prev => ({ 
        ...prev, 
        fileName: file.name,
        fileUrl: URL.createObjectURL(file) // Temporary URL for preview
      }));
    }
  };

  const handleAddLetter = async () => {
    if (!newLetter.title || (!newLetter.content && !selectedFile)) {
      alert("Please provide a title and either content or upload a file");
      return;
    }

    setIsUploading(true);
    try {
      // In a real implementation, you would upload the file to storage
      // and save letter data to the database
      
      // Simulate uploading
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form and close modal
      setNewLetter({
        title: "",
        content: "",
        date: new Date().toISOString().slice(0, 10),
        fileName: "",
        fileUrl: ""
      });
      setSelectedFile(null);
      setIsAddLetterModalOpen(false);
      
      // This would refresh the letters in a real implementation
      onAddLetter();
      
      toast.success("Letter added successfully");
    } catch (error) {
      console.error("Error adding letter:", error);
      toast.error("Failed to add letter");
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewLetter = (letter: StudentLetter) => {
    setCurrentLetter(letter);
    setIsViewLetterModalOpen(true);
  };

  const handleSendEmail = (letter: StudentLetter) => {
    // In a real implementation, this would trigger an email to the sponsor
    toast.success(`Email with letter "${letter.title}" sent to sponsor`);
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
                    <h3 className="font-medium">{letter.title}</h3>
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
                    {letter.fileUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={letter.fileUrl} download={letter.fileName} target="_blank" rel="noreferrer">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => handleSendEmail(letter)}>
                      <Mail className="mr-2 h-4 w-4" />
                      Email to Sponsor
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
                  className={selectedFile ? "hidden" : ""}
                />
                {selectedFile && (
                  <div className="flex items-center gap-2 p-2 border rounded-md w-full">
                    <div className="flex-1 truncate">{selectedFile.name}</div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setSelectedFile(null);
                        setNewLetter(prev => ({ ...prev, fileName: "", fileUrl: "" }));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddLetterModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleAddLetter} 
              disabled={isUploading || !newLetter.title || (!newLetter.content && !selectedFile)}
            >
              {isUploading ? "Uploading..." : "Add Letter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Letter Modal */}
      {currentLetter && (
        <Dialog open={isViewLetterModalOpen} onOpenChange={setIsViewLetterModalOpen}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{currentLetter.title}</DialogTitle>
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
              {currentLetter.fileUrl && (
                <div className="border rounded-md overflow-hidden">
                  {currentLetter.fileUrl.endsWith('.pdf') ? (
                    <iframe 
                      src={currentLetter.fileUrl} 
                      title={currentLetter.title}
                      className="w-full h-96"
                    />
                  ) : (
                    <img 
                      src={currentLetter.fileUrl} 
                      alt={currentLetter.title}
                      className="max-h-96 mx-auto object-contain" 
                    />
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <div className="flex gap-2">
                {currentLetter.fileUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={currentLetter.fileUrl} download={currentLetter.fileName} target="_blank" rel="noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => handleSendEmail(currentLetter)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email to Sponsor
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
