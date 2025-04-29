
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf"; // Fix: import jsPDF correctly with curly braces
import { format } from "date-fns";

interface StudentProfilePDFProps {
  student: any;
  sponsor?: any;
}

export function StudentProfilePDF({ student, sponsor }: StudentProfilePDFProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const profileElement = document.getElementById('student-profile-pdf');
      
      if (!profileElement) {
        throw new Error('Profile element not found');
      }
      
      const canvas = await html2canvas(profileElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // A4 page size
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      // Generate filename from student name
      const filename = `${student.name.replace(/\s+/g, '_')}_Profile.pdf`;
      
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Button onClick={generatePDF} disabled={isGenerating} className="flex gap-2">
        <Download className="h-4 w-4" />
        {isGenerating ? "Generating..." : "Download Profile"}
      </Button>
      
      {/* Hidden profile template for PDF generation */}
      <div id="student-profile-pdf" className="hidden">
        <div style={{ width: "210mm", padding: "10mm", fontFamily: "Arial, sans-serif" }}>
          {/* Header with Logo */}
          <div style={{ display: "flex", borderBottom: "1px solid #000", paddingBottom: "10px", marginBottom: "20px" }}>
            <img 
              src="/lovable-uploads/4fe39649-bf54-408f-9b41-7aa63810a53c.png" 
              alt="David's Hope Logo" 
              style={{ height: "60px" }}
            />
            <h1 style={{ marginLeft: "20px", fontSize: "24px", fontWeight: "bold" }}>David's Hope</h1>
          </div>
          
          {/* Student Information Layout */}
          <div style={{ display: "flex", gap: "20px" }}>
            {/* Left column with student info */}
            <div style={{ flex: "1" }}>
              <h2 style={{ color: "red", fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>
                {student.name?.toUpperCase()}
              </h2>
              
              <div style={{ marginBottom: "15px" }}>
                <p style={{ margin: "5px 0" }}><strong>ADM No:</strong> {student.admission_number}</p>
                <p style={{ margin: "5px 0" }}><strong>Grade:</strong> {student.cbc_grade || student.current_grade}</p>
                <p style={{ margin: "5px 0" }}><strong>Age:</strong> {student.dob ? 
                  Math.floor((new Date().getTime() - new Date(student.dob).getTime()) / 3.15576e+10) : 'N/A'}</p>
                <p style={{ margin: "5px 0" }}><strong>Date of Birth:</strong> {student.dob ? 
                  format(new Date(student.dob), 'MMM dd, yyyy') : 'N/A'}</p>
                <p style={{ margin: "5px 0" }}><strong>Student Category:</strong> {student.cbc_category}</p>
                <p style={{ margin: "5px 0" }}><strong>Location:</strong> {student.location?.toUpperCase() || 'N/A'}</p>
                <p style={{ margin: "5px 0" }}><strong>Started Scholarship:</strong> {student.sponsored_since ? 
                  format(new Date(student.sponsored_since), 'MMM dd, yyyy') : 'N/A'}</p>
              </div>
            </div>
            
            {/* Right column with student photo */}
            <div style={{ width: "40%" }}>
              <img 
                src={student.profile_image_url || 'https://source.unsplash.com/random/300x300/?student'} 
                alt={student.name} 
                style={{ width: "100%", height: "auto", objectFit: "cover", borderRadius: "4px" }}
              />
            </div>
          </div>
          
          {/* Student Description */}
          <div style={{ marginTop: "20px" }}>
            <h3 style={{ borderBottom: "1px solid #000", paddingBottom: "5px", marginBottom: "10px" }}>
              Student Description:
            </h3>
            <p style={{ lineHeight: "1.5" }}>
              {student.description || 'No description available.'}
            </p>
          </div>
          
          {/* Footer Content */}
          <div style={{ marginTop: "40px", color: "red", lineHeight: "1.4" }}>
            <p>- Since 2009, God has used DHI to make an enormous difference in the lives of children and adults in the rural Kenyan village of Eburru.</p>
            <p>- We are very pleased to have you become part of the journey as we do all we can for the glory of God...</p>
            <p>- Students in middle school and high school are boarders with full room and board at a top quality school.</p>
          </div>
          
          {/* Contact Information */}
          <div style={{ marginTop: "40px", display: "flex", justifyContent: "space-between", borderTop: "1px solid #000", paddingTop: "10px" }}>
            <div>
              <p><strong>Website Address:</strong></p>
              <p style={{ color: "blue" }}>www.davidshope.org</p>
            </div>
            <div>
              <p><strong>Contact Us:</strong></p>
              <p style={{ color: "blue" }}>sponsorship@davidshope.org</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
