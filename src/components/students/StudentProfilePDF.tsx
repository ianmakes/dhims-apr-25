
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf"; 
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
      // Create a temporary profile element for PDF generation
      const tempElement = document.createElement('div');
      tempElement.id = 'student-profile-pdf-temp';
      tempElement.style.width = "210mm";
      tempElement.style.padding = "10mm";
      tempElement.style.fontFamily = "Arial, sans-serif";
      tempElement.style.backgroundColor = "#ffffff";
      tempElement.style.position = "absolute";
      tempElement.style.left = "-9999px";
      tempElement.style.top = "-9999px";
      
      // Create the content for the PDF
      tempElement.innerHTML = `
        <div style="display: flex; border-bottom: 1px solid #000; padding-bottom: 10px; margin-bottom: 20px;">
          <div style="height: 60px; width: 60px; background-color: #f0f0f0; display: flex; align-items: center; justify-content: center; border-radius: 4px;">DH</div>
          <h1 style="margin-left: 20px; font-size: 24px; font-weight: bold;">David's Hope</h1>
        </div>
        
        <div style="display: flex; gap: 20px;">
          <div style="flex: 1;">
            <h2 style="color: red; font-size: 24px; font-weight: bold; margin-bottom: 20px;">
              ${student.name?.toUpperCase() || 'STUDENT NAME'}
            </h2>
            
            <div style="margin-bottom: 15px;">
              <p style="margin: 5px 0"><strong>ADM No:</strong> ${student.admission_number || 'N/A'}</p>
              <p style="margin: 5px 0"><strong>Grade:</strong> ${student.current_grade || student.cbc_category || 'N/A'}</p>
              <p style="margin: 5px 0"><strong>Age:</strong> ${student.dob ? 
                Math.floor((new Date().getTime() - new Date(student.dob).getTime()) / 3.15576e+10) + ' years' : 'N/A'}</p>
              <p style="margin: 5px 0"><strong>Date of Birth:</strong> ${student.dob ? 
                format(new Date(student.dob), 'MMM dd, yyyy') : 'N/A'}</p>
              <p style="margin: 5px 0"><strong>Student Category:</strong> ${student.cbc_category || 'N/A'}</p>
              <p style="margin: 5px 0"><strong>Location:</strong> ${student.location?.toUpperCase() || 'N/A'}</p>
              <p style="margin: 5px 0"><strong>Started Scholarship:</strong> ${student.sponsored_since ? 
                format(new Date(student.sponsored_since), 'MMM dd, yyyy') : 'N/A'}</p>
            </div>
          </div>
          
          <div style="width: 40%;">
            <div style="width: 100%; height: 200px; background-color: #f0f0f0; display: flex; align-items: center; justify-content: center; border-radius: 4px;">
              ${student.profile_image_url ? `<img src="${student.profile_image_url}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;" alt="${student.name}"/>` : 'No Image'}
            </div>
          </div>
        </div>
        
        <div style="margin-top: 20px;">
          <h3 style="border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px;">
            Student Description:
          </h3>
          <p style="line-height: 1.5;">
            ${student.description || 'No description available.'}
          </p>
        </div>
        
        <div style="margin-top: 40px; color: red; line-height: 1.4;">
          <p>- Since 2009, God has used DHI to make an enormous difference in the lives of children and adults in the rural Kenyan village of Eburru.</p>
          <p>- We are very pleased to have you become part of the journey as we do all we can for the glory of God...</p>
          <p>- Students in middle school and high school are boarders with full room and board at a top quality school.</p>
        </div>
        
        <div style="margin-top: 40px; display: flex; justify-content: space-between; border-top: 1px solid #000; padding-top: 10px;">
          <div>
            <p><strong>Website Address:</strong></p>
            <p style="color: blue;">www.davidshope.org</p>
          </div>
          <div>
            <p><strong>Contact Us:</strong></p>
            <p style="color: blue;">sponsorship@davidshope.org</p>
          </div>
        </div>
      `;
      
      // Append to body temporarily
      document.body.appendChild(tempElement);
      
      // Generate PDF from the temporary element
      const canvas = await html2canvas(tempElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      
      // Remove the temporary element
      document.body.removeChild(tempElement);
      
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
      const filename = `${student.name ? student.name.replace(/\s+/g, '_') : 'Student'}_Profile.pdf`;
      
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
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
    </>
  );
}
