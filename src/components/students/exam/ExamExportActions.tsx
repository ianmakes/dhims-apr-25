
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, FileImage, FileText, FileIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";

interface ProcessedExamData {
  examName: string;
  term: string;
  score: number;
  maxScore: number;
  percentage: number;
  grade: string;
  date: string;
}

interface ExamExportActionsProps {
  studentName: string;
  processedData: ProcessedExamData[];
  togglePDFPreview: () => void;
}

export function ExamExportActions({ studentName, processedData, togglePDFPreview }: ExamExportActionsProps) {
  const { toast } = useToast();

  // Export to CSV
  const exportToCSV = () => {
    if (!processedData.length) {
      toast({
        title: "No data to export",
        description: "There are no exam records to export.",
        variant: "destructive"
      });
      return;
    }

    // CSV Headers
    const headers = ["Exam Name", "Term", "Date", "Score", "Out of", "Percentage", "Grade"];

    // CSV Rows
    const csvRows = [
      headers.join(","), 
      ...processedData.map(item => [
        `"${item.examName}"`, // Quote strings to handle commas in names
        `"${item.term}"`, 
        `"${item.date}"`, 
        item.score, 
        item.maxScore, 
        `${item.percentage}%`, 
        item.grade
      ].join(","))
    ];

    // Create CSV content
    const csvContent = csvRows.join("\n");

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${studentName.replace(/\s+/g, "_")}_exam_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful",
      description: "Exam results have been exported to CSV."
    });
  };

  // Export to PNG Image
  const exportToImage = async () => {
    try {
      const element = document.getElementById('student-exams-data');
      if (!element) {
        throw new Error("Element not found");
      }
      
      toast({
        title: "Generating Image",
        description: "Please wait while we generate the image..."
      });
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${studentName.replace(/\s+/g, "_")}_exam_results.png`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: "Exam results have been exported as an image."
      });
    } catch (error) {
      console.error("Error exporting to image:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export exam results as an image.",
        variant: "destructive"
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" /> Export Results
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={togglePDFPreview}>
          <FileText className="mr-2 h-4 w-4" />
          <span>Generate PDF Report</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToImage}>
          <FileImage className="mr-2 h-4 w-4" />
          <span>Export as Image</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV}>
          <FileIcon className="mr-2 h-4 w-4" />
          <span>Export as CSV</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
