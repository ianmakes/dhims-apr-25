
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Download, Edit, Mail, Trash2, ZoomIn, ZoomOut } from "lucide-react";

interface StudentLetter {
  id: string;
  title?: string;
  content?: string;
  date: string;
  file_url?: string;
}

interface ViewLetterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  letter: StudentLetter;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  formatDate: (date: string | Date | null | undefined) => string;
  onSendEmail: (letter: StudentLetter) => void;
  onEditLetter: () => void;
  onDeleteLetter: () => void;
}

export function ViewLetterDialog({
  open,
  onOpenChange,
  letter,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  formatDate,
  onSendEmail,
  onEditLetter,
  onDeleteLetter
}: ViewLetterDialogProps) {
  const isPDF = (url?: string) => {
    return url?.toLowerCase().endsWith('.pdf');
  };

  const isImage = (url?: string) => {
    return url?.match(/\.(jpeg|jpg|gif|png)$/i) !== null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>{letter.title || "Untitled Letter"}</span>
            {letter.file_url && (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={onZoomOut} disabled={zoomLevel <= 0.5}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="mx-2">{Math.round(zoomLevel * 100)}%</span>
                <Button size="sm" variant="outline" onClick={onZoomIn} disabled={zoomLevel >= 3}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(letter.date)}</span>
          </div>
          
          {letter.content && (
            <div className="border rounded-md p-4 bg-gray-50">
              <p className="whitespace-pre-wrap">{letter.content}</p>
            </div>
          )}
          
          {letter.file_url && (
            <div className="border rounded-md overflow-hidden flex justify-center">
              {isPDF(letter.file_url) ? (
                <div className="w-full" style={{ height: "60vh" }}>
                  <iframe 
                    src={`${letter.file_url}#view=FitH&zoom=${zoomLevel}`}
                    title={letter.title || "Letter"}
                    className="w-full h-full"
                    style={{ border: "none" }}
                  />
                </div>
              ) : isImage(letter.file_url) ? (
                <div className="flex justify-center overflow-auto" style={{ maxHeight: "60vh" }}>
                  <img 
                    src={letter.file_url} 
                    alt={letter.title || "Letter"}
                    style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center top" }}
                    className="transition-transform"
                  />
                </div>
              ) : (
                <div className="p-4 text-center">
                  <p>This file type cannot be previewed</p>
                  <Button className="mt-2" asChild>
                    <a href={letter.file_url} target="_blank" rel="noreferrer">
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
            {letter.file_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={letter.file_url} download target="_blank" rel="noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => onSendEmail(letter)}>
              <Mail className="mr-2 h-4 w-4" />
              Email to Sponsor
            </Button>
            <Button variant="outline" size="sm" onClick={onEditLetter}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              onClick={onDeleteLetter}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
