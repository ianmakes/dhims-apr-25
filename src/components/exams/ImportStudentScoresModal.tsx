
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Upload, AlertOctagon, AlertCircle, CheckCircle2, FileSpreadsheet } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ImportStudentScoresModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: string;
}

interface ScoreImportRow {
  studentId?: string;
  studentName?: string; 
  score: number;
  status: string;
}

export function ImportStudentScoresModal({ open, onOpenChange, examId }: ImportStudentScoresModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ScoreImportRow[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Reset state when modal is opened/closed
  useEffect(() => {
    if (!open) {
      setFile(null);
      setParseError(null);
      setPreview([]);
      setIsValidating(false);
      setIsValid(false);
    }
  }, [open]);

  const importScores = useMutation({
    mutationFn: async (scores: ScoreImportRow[]) => {
      // First fetch existing scores to know what to update vs insert
      const { data: existingScores } = await supabase
        .from("student_exam_scores")
        .select("id, student_id")
        .eq("exam_id", examId);
      
      const existingScoreMap = new Map(
        existingScores?.map(score => [score.student_id, score.id]) || []
      );

      // Prepare batch operations for upsert
      const scoresToUpsert = scores.map(score => ({
        id: existingScoreMap.get(score.studentId),
        exam_id: examId,
        student_id: score.studentId,
        score: score.score,
        did_not_sit: score.status === "Did Not Sit"
      }));

      // Remove undefined IDs for new scores
      const cleanScores = scoresToUpsert.map(score => {
        if (score.id === undefined) {
          const { id, ...rest } = score;
          return rest;
        }
        return score;
      });

      const { error } = await supabase
        .from("student_exam_scores")
        .upsert(cleanScores);

      if (error) throw error;
      return scores.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["exam", examId] });
      toast({
        title: "Import Successful",
        description: `Successfully imported ${count} student scores.`,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setParseError(null);
    setPreview([]);
    setIsValidating(true);
    setIsValid(false);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        let rows: string[] = [];
        
        // Check file type and parse accordingly
        if (selectedFile.name.endsWith('.csv')) {
          rows = content.split('\n');
        } else if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
          setParseError("Excel files need to be converted to CSV first");
          setIsValidating(false);
          return;
        } else {
          setParseError("Unsupported file format. Please upload a CSV file.");
          setIsValidating(false);
          return;
        }

        // Parse header
        const header = rows[0].split(',');
        const studentIdIndex = header.findIndex(col => 
          col.toLowerCase().includes('student id') || col.toLowerCase().includes('id'));
        const studentNameIndex = header.findIndex(col => 
          col.toLowerCase().includes('student name') || col.toLowerCase().includes('name'));
        const scoreIndex = header.findIndex(col => 
          col.toLowerCase().includes('score') || col.toLowerCase().includes('mark'));
        
        if (scoreIndex === -1) {
          setParseError("Could not find a column for scores. Please ensure your CSV has a column named 'Score' or 'Mark'.");
          setIsValidating(false);
          return;
        }
        
        if (studentIdIndex === -1 && studentNameIndex === -1) {
          setParseError("Could not find columns for student identification. Please ensure your CSV has columns for student ID or name.");
          setIsValidating(false);
          return;
        }

        // Parse data rows
        const parsedRows: ScoreImportRow[] = [];
        for (let i = 1; i < rows.length; i++) {
          if (!rows[i].trim()) continue; // Skip empty rows
          
          const cells = rows[i].split(',');
          const studentId = studentIdIndex !== -1 ? cells[studentIdIndex]?.trim() : undefined;
          const studentName = studentNameIndex !== -1 ? cells[studentNameIndex]?.trim() : undefined;
          const scoreStr = cells[scoreIndex]?.trim();
          
          // Check if this is a "did not sit" case
          const isDNS = scoreStr.toLowerCase() === 'dns' || 
                      scoreStr.toLowerCase() === 'did not sit' || 
                      scoreStr === '-' || 
                      scoreStr === '';
          
          const score = isDNS ? 0 : parseInt(scoreStr, 10);
          
          if ((studentId || studentName) && (isDNS || (!isNaN(score) && score >= 0))) {
            parsedRows.push({
              studentId,
              studentName,
              score: isDNS ? 0 : score,
              status: isDNS ? "Did Not Sit" : "Present"
            });
          }
        }

        if (parsedRows.length === 0) {
          setParseError("No valid data rows found in the file.");
          setIsValidating(false);
          return;
        }

        // Set preview data
        setPreview(parsedRows.slice(0, 5)); // Show first 5 rows as preview
        setIsValidating(false);
        setIsValid(true);
      } catch (error) {
        setParseError(`Error parsing file: ${error instanceof Error ? error.message : String(error)}`);
        setIsValidating(false);
      }
    };

    reader.onerror = () => {
      setParseError("Failed to read the file.");
      setIsValidating(false);
    };

    reader.readAsText(selectedFile);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Import Student Scores</DialogTitle>
          <DialogDescription>
            Upload a CSV file with student scores. The file should have columns for student ID or name, and scores.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!file && (
            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
              <input
                type="file"
                id="score-file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="score-file"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <FileSpreadsheet className="h-12 w-12 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-primary">Click to upload CSV file</span>
                <span className="text-xs text-gray-500 mt-1">or drag and drop</span>
              </label>
            </div>
          )}

          {isValidating && (
            <div className="flex items-center justify-center">
              <AlertOctagon className="animate-pulse h-5 w-5 mr-2 text-amber-500" />
              <p>Validating file...</p>
            </div>
          )}

          {parseError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Import Error</AlertTitle>
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}

          {isValid && preview.length > 0 && (
            <div className="mt-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>File Validated</AlertTitle>
                <AlertDescription>
                  {file?.name} contains data for {preview.length}+ students.
                </AlertDescription>
              </Alert>

              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Preview (first 5 rows):</h4>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left">Student</th>
                        <th className="px-4 py-2 text-left">Score</th>
                        <th className="px-4 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">{row.studentName || row.studentId}</td>
                          <td className="px-4 py-2">{row.score}</td>
                          <td className="px-4 py-2">{row.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            type="button"
            onClick={() => importScores.mutate(preview)}
            disabled={!isValid || isValidating || importScores.isPending}
          >
            {importScores.isPending ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import Scores
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
