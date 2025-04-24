import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, FileSpreadsheet, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

// Add onSuccess prop to the component props type
export interface ImportStudentScoresModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: string;
  onSuccess?: () => void;
}

export function ImportStudentScoresModal({
  open,
  onOpenChange,
  examId,
  onSuccess
}: ImportStudentScoresModalProps) {
  const [csvData, setCsvData] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvData(text);
      setError(null);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!csvData.trim()) {
      setError("Please upload a CSV file or enter data manually");
      return;
    }

    try {
      setIsUploading(true);
      
      // Parse CSV data
      const lines = csvData.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim());
      
      // Validate headers
      const requiredHeaders = ["student_id", "score"];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(", ")}`);
      }
      
      // Process data
      const data = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim());
        const row: Record<string, any> = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        
        return {
          exam_id: examId,
          student_id: row.student_id,
          score: parseFloat(row.score),
          did_not_sit: row.did_not_sit === "true" || row.did_not_sit === "1",
        };
      });
      
      // Simulate progress
      const totalSteps = data.length;
      let completedSteps = 0;
      
      // Insert data in batches
      const batchSize = 50;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from("student_exam_scores")
          .upsert(batch, { 
            onConflict: "student_id,exam_id",
            ignoreDuplicates: false
          });
          
        if (error) throw error;
        
        completedSteps += batch.length;
        setUploadProgress(Math.round((completedSteps / totalSteps) * 100));
      }
      
      toast.success(`Successfully imported ${data.length} student scores`);
      
      // Call onSuccess if it exists
      if (onSuccess) {
        onSuccess();
      }
      
      setCsvData("");
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to import scores");
      toast.error("Failed to import scores");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData("text");
    setCsvData(pastedText);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Student Scores</DialogTitle>
          <DialogDescription>
            Upload a CSV file with student scores or paste data directly.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="file">Upload CSV File</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  disabled={isUploading}
                  onClick={() => document.getElementById("file")?.click()}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                CSV should have headers: student_id, score (optional: did_not_sit)
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="csv-data">Or Paste Data</Label>
              <Textarea
                id="csv-data"
                placeholder="student_id,score,did_not_sit
123,85,false
124,92,false
125,0,true"
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                onPaste={handlePaste}
                rows={6}
                disabled={isUploading}
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isUploading || !csvData.trim()}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Import Scores
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
