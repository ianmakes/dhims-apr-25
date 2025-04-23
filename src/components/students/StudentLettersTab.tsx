
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen, Download } from "lucide-react";

interface StudentLettersTabProps {
  studentName: string;
  onAddLetter: () => void;
  formatDate: (date: string | Date | null | undefined) => string;
}

// NOTE: This is still using the mock/screened letter data and should be replaced with real data when available.
export function StudentLettersTab({ studentName, onAddLetter, formatDate }: StudentLettersTabProps) {
  return (
    <div className="py-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Student Letters</CardTitle>
            <CardDescription>Letters from {studentName} to sponsors</CardDescription>
          </div>
          <Button onClick={onAddLetter}>
            <FileText className="mr-2 h-4 w-4" />
            Add Letter
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((index) => (
              <div key={index} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Thank you letter to sponsor</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(new Date(2023, index + 1, 15))}
                  </p>
                </div>
                <p className="mt-2 text-muted-foreground">
                  Dear Sponsor, thank you for your continued support...
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    <BookOpen className="mr-2 h-4 w-4" />
                    View Letter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
