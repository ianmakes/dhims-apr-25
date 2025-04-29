
import { Button } from "@/components/ui/button";
import { Calendar, Download, Edit, Eye, FileText, Mail, Trash2 } from "lucide-react";

interface StudentLetter {
  id: string;
  title?: string;
  content?: string;
  date: string;
  file_url?: string;
}

interface LetterListProps {
  letters: StudentLetter[];
  formatDate: (date: string | Date | null | undefined) => string;
  onViewLetter: (letter: StudentLetter) => void;
  onEditLetter: (letter: StudentLetter) => void;
  onSendEmail: (letter: StudentLetter) => void;
  onDeleteLetter: (letter: StudentLetter) => void;
  onAddFirstLetter: () => void;
}

export function LetterList({
  letters,
  formatDate,
  onViewLetter,
  onEditLetter,
  onSendEmail,
  onDeleteLetter,
  onAddFirstLetter
}: LetterListProps) {
  if (letters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="mb-4 text-muted-foreground">No letters available</p>
        <Button onClick={onAddFirstLetter}>
          <FileText className="mr-2 h-4 w-4" />
          Add First Letter
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {letters.map((letter) => (
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
            <Button variant="outline" size="sm" onClick={() => onViewLetter(letter)}>
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
            <Button variant="outline" size="sm" onClick={() => onSendEmail(letter)}>
              <Mail className="mr-2 h-4 w-4" />
              Email to Sponsor
            </Button>
            <Button variant="outline" size="sm" onClick={() => onEditLetter(letter)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="text-destructive hover:bg-destructive/10" 
              onClick={() => onDeleteLetter(letter)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
