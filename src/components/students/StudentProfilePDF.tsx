
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileIcon } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

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
      
      // Apply temporary styles for PDF generation
      const originalDisplay = profileElement.style.display;
      profileElement.style.display = 'block';
      
      const canvas = await html2canvas(profileElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 794, // A4 width in pixels at 96 DPI
        windowHeight: 1123, // A4 height in pixels at 96 DPI
      });
      
      // Restore original styles
      profileElement.style.display = originalDisplay;
      
      const imgData = canvas.toDataURL('image/png');
      
      // A4 page size (210mm x 297mm)
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
      const imgY = 10; // Small margin from top
      
      // Fix for the "Invalid coordinates" error
      if (imgWidth > 0 && imgHeight > 0 && ratio > 0) {
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      } else {
        throw new Error('Invalid image dimensions or ratio');
      }
      
      // Generate filename from student name
      const filename = `${student.name.replace(/\s+/g, '_')}_Profile.pdf`;
      
      pdf.save(filename);
      toast({
        title: "Profile downloaded",
        description: `${student.name}'s profile has been downloaded successfully.`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Could not generate PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Button onClick={generatePDF} disabled={isGenerating} className="flex gap-2">
        {isGenerating ? (
          <>Generating...</>
        ) : (
          <>
            <FileIcon className="h-4 w-4" />
            Download Profile
          </>
        )}
      </Button>
      
      {/* Hidden profile template for PDF generation */}
      <div id="student-profile-pdf" style={{ display: "none", width: "210mm", padding: "15mm", fontFamily: "Arial, sans-serif", maxWidth: "210mm" }}>
        <div style={{ borderBottom: "2px solid #cc0000", paddingBottom: "15px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <img 
              src="/lovable-uploads/19e2739d-3195-4a9c-824b-c2db7c576520.png" 
              alt="David's Hope Logo" 
              style={{ height: "60px" }}
            />
            <h1 style={{ marginLeft: "15px", fontSize: "24px", fontWeight: "bold", color: "#333" }}>David's Hope International</h1>
          </div>
          <div style={{ fontSize: "14px", color: "#666" }}>
            <p style={{ margin: 0 }}>Student Profile</p>
          </div>
        </div>
        
        <div style={{ display: "flex", gap: "20px", marginBottom: "25px" }}>
          {/* Left column with student info */}
          <div style={{ flex: "1.5" }}>
            <h2 style={{ color: "#cc0000", fontSize: "26px", fontWeight: "bold", marginBottom: "20px", marginTop: 0 }}>
              {student.name?.toUpperCase()}
            </h2>
            
            <div style={{ marginBottom: "20px", fontSize: "14px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "5px 0", fontWeight: "bold", width: "40%" }}>ADM Number:</td>
                    <td style={{ padding: "5px 0" }}>{student.admission_number}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "5px 0", fontWeight: "bold" }}>Grade:</td>
                    <td style={{ padding: "5px 0" }}>{student.current_grade}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "5px 0", fontWeight: "bold" }}>Age:</td>
                    <td style={{ padding: "5px 0" }}>{student.dob ? 
                      Math.floor((new Date().getTime() - new Date(student.dob).getTime()) / 3.15576e+10) : 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "5px 0", fontWeight: "bold" }}>Date of Birth:</td>
                    <td style={{ padding: "5px 0" }}>{student.dob ? 
                      format(new Date(student.dob), 'MMM dd, yyyy') : 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "5px 0", fontWeight: "bold" }}>Category:</td>
                    <td style={{ padding: "5px 0" }}>{student.cbc_category || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "5px 0", fontWeight: "bold" }}>CBC Grade:</td>
                    <td style={{ padding: "5px 0" }}>{student.current_grade || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "5px 0", fontWeight: "bold" }}>Location:</td>
                    <td style={{ padding: "5px 0" }}>{student.location?.toUpperCase() || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "5px 0", fontWeight: "bold" }}>Started Scholarship:</td>
                    <td style={{ padding: "5px 0" }}>{student.sponsored_since ? 
                      format(new Date(student.sponsored_since), 'MMM dd, yyyy') : 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div style={{ marginTop: "30px" }}>
              <h3 style={{ borderBottom: "1px solid #ddd", paddingBottom: "8px", marginBottom: "10px", fontSize: "16px", color: "#333" }}>
                Student Description:
              </h3>
              <p style={{ lineHeight: "1.6", fontSize: "14px" }}>
                {student.description || 'No description available for this student.'}
              </p>
            </div>
          </div>
          
          {/* Right column with student photo */}
          <div style={{ flex: "1", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: "100%", aspectRatio: "3/4", overflow: "hidden", border: "1px solid #ddd", borderRadius: "4px", marginBottom: "10px" }}>
              <img 
                src={student.profile_image_url || 'https://source.unsplash.com/random/300x400/?student'} 
                alt={student.name} 
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  e.currentTarget.src = 'https://source.unsplash.com/random/300x400/?student';
                }}
              />
            </div>
            {sponsor && (
              <div style={{ fontSize: "14px", textAlign: "center", marginTop: "15px", padding: "10px", backgroundColor: "#f9f9f9", borderRadius: "4px", width: "100%" }}>
                <p style={{ fontWeight: "bold", margin: "0 0 5px 0" }}>Sponsor:</p>
                <p style={{ margin: "0" }}>{sponsor.first_name} {sponsor.last_name}</p>
                <p style={{ margin: "5px 0 0 0", fontSize: "12px" }}>Since: {student.sponsored_since ? 
                  format(new Date(student.sponsored_since), 'MMM yyyy') : 'N/A'}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer Content */}
        <div style={{ marginTop: "40px", borderTop: "1px solid #ddd", paddingTop: "20px" }}>
          <div style={{ color: "#cc0000", lineHeight: "1.4", fontSize: "13px", marginBottom: "25px" }}>
            <p style={{ margin: "0 0 8px 0" }}>- Since 2009, God has used DHI to make an enormous difference in the lives of children and adults in the rural Kenyan village of Eburru.</p>
            <p style={{ margin: "0 0 8px 0" }}>- We are very pleased to have you become part of the journey as we do all we can for the glory of God...</p>
            <p style={{ margin: "0 0 8px 0" }}>- Students in middle school and high school are boarders with full room and board at a top quality school.</p>
          </div>
          
          {/* Contact Information */}
          <div style={{ fontSize: "13px", display: "flex", justifyContent: "space-between", marginTop: "15px" }}>
            <div>
              <p style={{ fontWeight: "bold", margin: "0 0 5px 0" }}>Website Address:</p>
              <p style={{ color: "#0066cc", margin: 0 }}>www.davidshope.org</p>
            </div>
            <div>
              <p style={{ fontWeight: "bold", margin: "0 0 5px 0" }}>Contact Us:</p>
              <p style={{ color: "#0066cc", margin: 0 }}>sponsorship@davidshope.org</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
