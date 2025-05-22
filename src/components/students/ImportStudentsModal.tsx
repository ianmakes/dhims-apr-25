
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Download } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useAuth } from '@/contexts/AuthContext';
import type { StudentFormInput } from '@/types/database';

interface ImportStudentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type MappingField = 
  | 'admission_number' 
  | 'name' 
  | 'current_grade' 
  | 'gender' 
  | 'admission_date' 
  | 'dob' 
  | 'status' 
  | null;

type CsvPreviewData = Array<{ [key: string]: string }>;

export const ImportStudentsModal: React.FC<ImportStudentsModalProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [importing, setImporting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CsvPreviewData>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [fieldMapping, setFieldMapping] = useState<{ [key: string]: MappingField }>({});
  const [mappingError, setMappingError] = useState<string | null>(null);

  // Reset state when modal is closed
  React.useEffect(() => {
    if (!open) {
      setFile(null);
      setCsvData([]);
      setHeaders([]);
      setCurrentStep('upload');
      setFieldMapping({});
      setMappingError(null);
      setImporting(false);
    }
  }, [open]);

  // Generate sample CSV content for download
  const getSampleCsvContent = () => {
    const headers = ['admission_number', 'name', 'gender', 'current_grade', 'admission_date', 'dob', 'status'];
    const rows = [
      ['STUD001', 'John Doe', 'Male', 'Grade 3', '2023-01-15', '2016-05-10', 'Active'],
      ['STUD002', 'Jane Smith', 'Female', 'Grade 5', '2022-09-01', '2013-11-21', 'Active'],
      ['STUD003', 'Michael Johnson', 'Male', 'Grade 1', '2024-01-10', '2018-03-15', 'Active']
    ];
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  };

  // Download sample CSV
  const downloadSampleCsv = () => {
    const csvContent = getSampleCsvContent();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_students.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV file
  const parseCSV = (content: string) => {
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    const headers = lines[0].split(',').map(header => header.trim());
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(value => value.trim());
      if (values.length !== headers.length) continue;
      
      const row: { [key: string]: string } = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row);
    }
    
    return { headers, data };
  };

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const { headers, data } = parseCSV(content);
        
        setHeaders(headers);
        setCsvData(data);
        
        // Initialize field mapping with null values
        const initialMapping: { [key: string]: MappingField } = {};
        headers.forEach(header => {
          // Try to automatically map fields based on common header names
          if (header.toLowerCase().includes('admission_number') || header.toLowerCase().includes('adm')) {
            initialMapping[header] = 'admission_number';
          } else if (header.toLowerCase().includes('name') || header.toLowerCase().includes('student')) {
            initialMapping[header] = 'name';
          } else if (header.toLowerCase().includes('gender') || header.toLowerCase().includes('sex')) {
            initialMapping[header] = 'gender';
          } else if (header.toLowerCase().includes('grade') || header.toLowerCase().includes('class')) {
            initialMapping[header] = 'current_grade';
          } else if (header.toLowerCase().includes('admission_date') || header.toLowerCase().includes('join')) {
            initialMapping[header] = 'admission_date';
          } else if (header.toLowerCase().includes('dob') || header.toLowerCase().includes('birth')) {
            initialMapping[header] = 'dob';
          } else if (header.toLowerCase().includes('status')) {
            initialMapping[header] = 'status';
          } else {
            initialMapping[header] = null;
          }
        });
        
        setFieldMapping(initialMapping);
        setCurrentStep('mapping');
      } catch (error) {
        console.error('Error parsing CSV:', error);
        toast({
          title: "Error",
          description: "Failed to parse CSV file. Please check the format and try again.",
          variant: "destructive"
        });
      }
    };
    
    reader.readAsText(selectedFile);
  };

  // Handle mapping change
  const handleMappingChange = (header: string, value: MappingField) => {
    setFieldMapping(prev => ({ ...prev, [header]: value }));
    setMappingError(null); // Reset error when mapping changes
  };

  // Validate mapping before proceeding
  const validateMapping = () => {
    // Check that required fields (admission_number and name) are mapped
    const mappingValues = Object.values(fieldMapping);
    
    if (!mappingValues.includes('admission_number')) {
      setMappingError('Admission Number field must be mapped');
      return false;
    }
    
    if (!mappingValues.includes('name')) {
      setMappingError('Name field must be mapped');
      return false;
    }

    // Check for duplicate mappings
    const mappedFields = mappingValues.filter(v => v !== null);
    const hasDuplicates = mappedFields.length !== new Set(mappedFields).size;
    if (hasDuplicates) {
      setMappingError('Each field can only be mapped once');
      return false;
    }
    
    setMappingError(null);
    return true;
  };

  // Continue to next step
  const handleContinue = () => {
    if (currentStep === 'mapping') {
      if (validateMapping()) {
        setCurrentStep('preview');
      }
    }
  };

  // Go back to previous step
  const handleBack = () => {
    if (currentStep === 'mapping') {
      setCurrentStep('upload');
    } else if (currentStep === 'preview') {
      setCurrentStep('mapping');
    }
  };

  // Format date string to ISO format
  const formatDateString = (dateStr: string): string | null => {
    if (!dateStr) return null;
    
    try {
      // Try to parse various date formats
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  // Import students mutation
  const importStudents = useMutation({
    mutationFn: async () => {
      setImporting(true);
      
      // Map CSV data to student data
      const importData: StudentFormInput[] = csvData.map(row => {
        const studentData: StudentFormInput = {
          name: '',
          admission_number: '',
          gender: 'Male',
          status: 'Active',
        };
        
        // Apply field mapping
        Object.entries(fieldMapping).forEach(([header, field]) => {
          if (!field) return;
          
          const value = row[header];
          if (field === 'admission_number') {
            studentData.admission_number = value;
          } else if (field === 'name') {
            studentData.name = value;
          } else if (field === 'current_grade') {
            studentData.current_grade = value;
          } else if (field === 'gender') {
            studentData.gender = (value?.toLowerCase() === 'male' || value?.toLowerCase() === 'm') ? 'Male' : 'Female';
          } else if (field === 'admission_date') {
            studentData.admission_date = formatDateString(value);
          } else if (field === 'dob') {
            studentData.dob = formatDateString(value);
          } else if (field === 'status') {
            studentData.status = value || 'Active';
          }
        });
        
        return studentData;
      });
      
      // Check for duplicates in the existing students
      const admissionNumbers = importData.map(data => data.admission_number);
      const { data: existingStudents, error: checkError } = await supabase
        .from('students')
        .select('admission_number')
        .in('admission_number', admissionNumbers);
      
      if (checkError) throw checkError;
      
      // Filter out duplicates
      const existingAdmissionNumbers = new Set(existingStudents.map(s => s.admission_number));
      const newStudents = importData.filter(s => !existingAdmissionNumbers.has(s.admission_number));
      const duplicateCount = importData.length - newStudents.length;
      
      if (newStudents.length === 0) {
        throw new Error("All students in this CSV already exist in the database");
      }
      
      // Add created_by and updated_by
      const studentsToInsert = newStudents.map(student => ({
        ...student,
        created_by: user?.id,
        updated_by: user?.id
      }));
      
      // Insert students
      const { data, error } = await supabase
        .from('students')
        .insert(studentsToInsert)
        .select();
      
      if (error) throw error;
      
      return {
        success: true,
        count: data?.length || 0,
        duplicates: duplicateCount
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      onOpenChange(false);
      toast({
        title: "Import Successful",
        description: `Successfully imported ${data.count} students. ${data.duplicates} duplicate entries were skipped.`
      });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive"
      });
      setImporting(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] md:max-w-[900px] w-[90vw]">
        <DialogHeader>
          <DialogTitle>Import Students</DialogTitle>
          <DialogDescription>
            Upload a CSV file with student data. We'll guide you through the process.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentStep} className="w-full">
          <TabsList className="grid grid-cols-3 w-full mb-4">
            <TabsTrigger value="upload" disabled={currentStep !== 'upload'}>
              1. Upload File
            </TabsTrigger>
            <TabsTrigger value="mapping" disabled={currentStep !== 'mapping'}>
              2. Map Fields
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={currentStep !== 'preview'}>
              3. Review & Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload CSV File</CardTitle>
                <CardDescription>
                  Select a CSV file containing student data. The file should include at minimum student names and admission numbers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={downloadSampleCsv} className="text-sm flex gap-2">
                    <Download className="h-4 w-4" />
                    Download Sample CSV
                  </Button>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="file">CSV File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                </div>

                <div className="mt-4 bg-muted/50 rounded-md p-4">
                  <h3 className="font-medium mb-2">Required Columns</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Admission Number - Student's unique identifier</li>
                    <li>Name - Student's full name</li>
                  </ul>
                  <h3 className="font-medium mt-4 mb-2">Optional Columns</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Gender - 'Male' or 'Female'</li>
                    <li>Current Grade - e.g. 'Grade 1', 'Grade 2', etc.</li>
                    <li>Admission Date - Date when student was admitted</li>
                    <li>Date of Birth - Student's birth date</li>
                    <li>Status - Student's status (defaults to 'Active')</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="mapping" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Map CSV Fields</CardTitle>
                <CardDescription>
                  Tell us which columns in your CSV file correspond to which student data fields.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mappingError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{mappingError}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-4">
                  {headers.map((header, index) => (
                    <div key={index} className="grid grid-cols-2 items-center gap-4">
                      <div className="font-medium truncate">{header}</div>
                      <Select 
                        value={fieldMapping[header] || "null"} 
                        onValueChange={(value) => handleMappingChange(header, value as MappingField)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admission_number">Admission Number</SelectItem>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="gender">Gender</SelectItem>
                          <SelectItem value="current_grade">Current Grade</SelectItem>
                          <SelectItem value="admission_date">Admission Date</SelectItem>
                          <SelectItem value="dob">Date of Birth</SelectItem>
                          <SelectItem value="status">Status</SelectItem>
                          <SelectItem value="null">Ignore This Column</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Review & Import</CardTitle>
                <CardDescription>
                  Review the data before importing. Students with existing admission numbers will be skipped.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-[300px] overflow-y-auto border rounded-md">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        {headers
                          .filter(header => fieldMapping[header])
                          .map((header, i) => (
                            <th key={i} className="p-2 text-left">
                              {fieldMapping[header]} 
                              <span className="text-muted-foreground ml-1">({header})</span>
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 10).map((row, i) => (
                        <tr key={i} className="border-t">
                          {headers
                            .filter(header => fieldMapping[header])
                            .map((header, j) => (
                              <td key={j} className="p-2">{row[header]}</td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {csvData.length > 10 && (
                  <p className="text-sm text-muted-foreground">
                    Showing first 10 of {csvData.length} rows
                  </p>
                )}
                
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You are about to import {csvData.length} students. Students with admission numbers that already exist in the system will be skipped.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          {currentStep !== 'upload' && (
            <Button type="button" variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {currentStep === 'mapping' && (
              <Button type="button" onClick={handleContinue}>
                Continue
              </Button>
            )}
            {currentStep === 'preview' && (
              <Button 
                type="button" 
                onClick={() => importStudents.mutate()} 
                disabled={importing}
              >
                {importing ? 'Importing...' : 'Import Students'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
