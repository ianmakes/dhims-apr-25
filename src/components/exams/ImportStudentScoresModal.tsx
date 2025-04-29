
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, FileSpreadsheet, Upload, Download, Info, HelpCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

// Add onSuccess prop to the component props type
export interface ImportStudentScoresModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: string;
  onSuccess?: () => void;
}

interface MappedField {
  sourceField: string;
  targetField: string;
}

interface StudentScoreRecord {
  id?: string;
  exam_id: string;
  student_id: string;
  score: number;
  did_not_sit: boolean;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
}

const REQUIRED_TARGET_FIELDS = ["student_id", "score"];
const TARGET_FIELDS = ["student_id", "score", "did_not_sit"];
const SAMPLE_CSV = `admission_number,student_name,score,did_not_sit
ST001,John Doe,85,false
ST002,Jane Smith,92,false
ST003,Sam Johnson,76,false
ST004,Emma Williams,0,true
ST005,Alex Brown,88,false`;

export function ImportStudentScoresModal({
  open,
  onOpenChange,
  examId,
  onSuccess
}: ImportStudentScoresModalProps) {
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [csvData, setCsvData] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<MappedField[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvData(text);
      setError(null);
      parseHeaders(text);
    };
    reader.readAsText(file);
  };

  const parseHeaders = (data: string) => {
    if (!data.trim()) return;
    
    try {
      const lines = data.trim().split("\n");
      if (lines.length === 0) return;
      
      const headerLine = lines[0];
      const parsedHeaders = headerLine.split(",").map(h => h.trim());
      setHeaders(parsedHeaders);
      
      // Initialize field mappings
      const initialMappings: MappedField[] = [];
      parsedHeaders.forEach(header => {
        // Try to auto-map based on similar names
        let targetField: string | null = null;
        
        if (header.toLowerCase().includes("admission") || 
            header.toLowerCase().includes("student") || 
            header.toLowerCase() === "id") {
          targetField = "student_id";
        } else if (header.toLowerCase().includes("score") || 
                 header.toLowerCase().includes("mark") || 
                 header.toLowerCase().includes("grade")) {
          targetField = "score";
        } else if (header.toLowerCase().includes("absent") || 
                 header.toLowerCase().includes("not_sit") || 
                 header.toLowerCase().includes("dns") || 
                 header.toLowerCase().includes("did_not_sit")) {
          targetField = "did_not_sit";
        }
        
        initialMappings.push({
          sourceField: header,
          targetField: targetField || ""
        });
      });
      
      setFieldMappings(initialMappings);
      
      // If we have headers, move to the mapping tab
      if (parsedHeaders.length > 0) {
        setActiveTab("map");
      }
    } catch (err) {
      console.error("Error parsing CSV headers:", err);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData("text");
    setCsvData(pastedText);
    setError(null);
    parseHeaders(pastedText);
  };

  const handleMappingChange = (sourceField: string, targetField: string) => {
    setFieldMappings(prevMappings => 
      prevMappings.map(mapping => 
        mapping.sourceField === sourceField 
          ? { ...mapping, targetField } 
          : mapping
      )
    );
  };

  const downloadSampleCSV = () => {
    const element = document.createElement("a");
    const file = new Blob([SAMPLE_CSV], {type: "text/csv"});
    element.href = URL.createObjectURL(file);
    element.download = "sample_student_scores.csv";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const validateMappings = (): boolean => {
    // Check if all required target fields are mapped
    const mappedTargetFields = fieldMappings
      .filter(m => m.targetField)
      .map(m => m.targetField);
    
    const missingRequiredFields = REQUIRED_TARGET_FIELDS.filter(
      field => !mappedTargetFields.includes(field)
    );
    
    if (missingRequiredFields.length > 0) {
      setError(`Missing required field mappings: ${missingRequiredFields.join(", ")}`);
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!csvData.trim()) {
      setError("Please upload a CSV file or enter data manually");
      return;
    }

    if (activeTab === "upload") {
      // Move to mapping step
      parseHeaders(csvData);
      setActiveTab("map");
      return;
    }
    
    // We're on the mapping tab, proceed with import
    if (!validateMappings()) {
      return;
    }

    try {
      setIsUploading(true);
      
      // Parse CSV data
      const lines = csvData.trim().split("\n");
      if (lines.length <= 1) {
        throw new Error("CSV file contains no data rows");
      }
      
      // Create a map of source field index to target field
      const headerLine = lines[0].split(",").map(h => h.trim());
      const fieldMap = new Map<number, string>();
      
      headerLine.forEach((header, index) => {
        const mapping = fieldMappings.find(m => m.sourceField === header);
        if (mapping && mapping.targetField) {
          fieldMap.set(index, mapping.targetField);
        }
      });
      
      // Process data
      const data: StudentScoreRecord[] = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim());
        const row: StudentScoreRecord = {
          exam_id: examId,
          student_id: "", // Will be filled in below
          score: 0, // Will be filled in below
          did_not_sit: false
        };
        
        // Apply mappings
        for (let i = 0; i < values.length; i++) {
          const targetField = fieldMap.get(i);
          if (targetField) {
            if (targetField === "score") {
              row.score = parseFloat(values[i]) || 0;
            } else if (targetField === "did_not_sit") {
              row.did_not_sit = values[i].toLowerCase() === "true" || values[i] === "1";
            } else if (targetField === "student_id") {
              row.student_id = values[i];
            }
          }
        }
        
        return row;
      });
      
      // Simulate progress
      const totalSteps = data.length;
      let completedSteps = 0;
      
      // Convert student_id to UUID if it's an admission number
      // First, fetch all students to get the mapping from admission number to UUID
      const { data: students, error: studentError } = await supabase
        .from('students')
        .select('id, admission_number')
        .eq('status', 'Active');
      
      if (studentError) throw studentError;
      
      // Create a mapping from admission number to UUID
      const studentMap = new Map();
      students?.forEach(student => {
        if (student.admission_number) {
          studentMap.set(student.admission_number, student.id);
        }
      });
      
      // Replace admission numbers with UUIDs
      const processedData: StudentScoreRecord[] = data
        .map(row => {
          // If the student_id looks like an admission number, try to replace it with UUID
          if (row.student_id && !row.student_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            const uuid = studentMap.get(row.student_id);
            if (uuid) {
              row.student_id = uuid;
              return row;
            } else {
              // Skip this row as we couldn't find the student
              return null;
            }
          }
          return row;
        })
        .filter((row): row is StudentScoreRecord => row !== null); // Type guard to filter out null values
      
      if (processedData.length === 0) {
        throw new Error("No valid student records found. Please check that admission numbers match existing students.");
      }
      
      // Insert data in batches
      const batchSize = 50;
      for (let i = 0; i < processedData.length; i += batchSize) {
        const batch = processedData.slice(i, i + batchSize);
        
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
      
      toast.success(`Successfully imported ${processedData.length} student scores`);
      
      // Call onSuccess if it exists
      if (onSuccess) {
        onSuccess();
      }
      
      setCsvData("");
      setHeaders([]);
      setFieldMappings([]);
      setActiveTab("upload");
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to import scores");
      toast.error("Failed to import scores");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import Student Scores</DialogTitle>
          <DialogDescription>
            Upload a CSV file with student scores or paste data directly.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="upload" disabled={isUploading}>Step 1: Upload</TabsTrigger>
              <TabsTrigger value="map" disabled={headers.length === 0 || isUploading}>Step 2: Map Fields</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-4">
              <Alert className="bg-blue-50 border-blue-100">
                <HelpCircle className="h-4 w-4" />
                <AlertTitle className="text-blue-800">Tips for CSV format</AlertTitle>
                <AlertDescription className="text-blue-700">
                  <p>Your CSV file should include columns for:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Student ID (admission number or UUID)</li>
                    <li>Score (numeric value)</li>
                    <li>Did Not Sit (optional, boolean: true/false or 1/0)</li>
                  </ul>
                </AlertDescription>
                <div className="mt-2">
                  <Button size="sm" variant="outline" onClick={downloadSampleCSV} className="text-blue-800">
                    <Download className="h-4 w-4 mr-2" />
                    Download Sample CSV
                  </Button>
                </div>
              </Alert>
              
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
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="csv-data">Or Paste Data</Label>
                <Textarea
                  id="csv-data"
                  placeholder={SAMPLE_CSV}
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  onPaste={handlePaste}
                  rows={6}
                  disabled={isUploading}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="map" className="space-y-4">
              <Alert className="bg-amber-50 border-amber-100">
                <Info className="h-4 w-4" />
                <AlertTitle className="text-amber-800">Field Mapping</AlertTitle>
                <AlertDescription className="text-amber-700">
                  Map your CSV columns to the required fields. Fields marked with * are required.
                </AlertDescription>
              </Alert>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="grid gap-4">
                    {fieldMappings.map((mapping, index) => (
                      <div key={index} className="grid grid-cols-5 gap-4 items-center">
                        <div className="col-span-2 font-medium">{mapping.sourceField}</div>
                        <div className="col-span-1 text-center">→</div>
                        <div className="col-span-2">
                          <Select 
                            value={mapping.targetField} 
                            onValueChange={(value) => handleMappingChange(mapping.sourceField, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Ignore this column</SelectItem>
                              {TARGET_FIELDS.map(field => (
                                <SelectItem key={field} value={field}>
                                  {field} {REQUIRED_TARGET_FIELDS.includes(field) ? '*' : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <div className="text-sm text-muted-foreground">
                <p><strong>Note:</strong> For 'student_id', you can use either the student's UUID or admission number. The system will automatically convert admission numbers to UUIDs.</p>
              </div>
            </TabsContent>
          </Tabs>
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {isUploading && (
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
          
          <DialogFooter className="mt-6">
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
              {activeTab === "upload" ? "Next" : (
                <>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Import Scores
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
