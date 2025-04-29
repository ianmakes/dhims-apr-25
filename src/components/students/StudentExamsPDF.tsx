import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface ExamData {
  examName: string;
  term: string;
  score: number;
  maxScore: number;
  percentage: number;
  date: string;
  grade: string;
}

interface ChartData {
  name: string;
  percentage: number;
  term?: string;
  average?: number;
}

interface StudentExamsPDFProps {
  studentName: string;
  examData: ExamData[];
  termData: { term: string; average: number }[];
  trendData: ChartData[];
}

export function StudentExamsPDF({ 
  studentName, 
  examData,
  termData,
  trendData 
}: StudentExamsPDFProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      // Create a temporary container for the PDF content
      const tempContainer = document.createElement('div');
      tempContainer.id = 'exam-report-pdf-container';
      tempContainer.style.width = '794px'; // A4 width at 96 DPI
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      document.body.appendChild(tempContainer);
      
      // Add content to the temporary container
      tempContainer.innerHTML = createPDFContent(studentName, examData, termData, trendData);
      
      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Capture the HTML as canvas and add to PDF
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate number of pages needed based on content height
      const pageCount = Math.ceil(imgHeight / canvas.width * pdfWidth / pdfHeight);
      
      let position = 0;
      
      // First page
      pdf.addImage(
        imgData, 
        'PNG', 
        0, 
        position, 
        pdfWidth, 
        imgWidth * pdfHeight / pdfWidth, 
        '', 
        'FAST'
      );
      
      // Add more pages if needed
      for (let i = 1; i < pageCount; i++) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(
          imgData, 
          'PNG', 
          0, 
          position, 
          pdfWidth, 
          imgWidth * pdfHeight / pdfWidth, 
          '', 
          'FAST'
        );
      }
      
      // Cleanup temporary elements
      document.body.removeChild(tempContainer);
      
      // Save PDF
      pdf.save(`${studentName.replace(/\s+/g, '_')}_Exam_Report.pdf`);
      
      toast({
        title: "PDF Generated",
        description: "Exam report has been downloaded successfully."
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
  
  const createPDFContent = (
    studentName: string, 
    examData: ExamData[], 
    termData: { term: string; average: number }[],
    trendData: ChartData[]
  ) => {
    // Calculate some statistics
    const averageScore = examData.length > 0
      ? Math.round(examData.reduce((sum, item) => sum + item.percentage, 0) / examData.length)
      : 0;
      
    const highestScore = examData.length > 0
      ? Math.max(...examData.map(item => item.percentage))
      : 0;
      
    const lowestScore = examData.length > 0
      ? Math.min(...examData.map(item => item.percentage))
      : 0;
      
    const trendDirection = examData.length > 1 && examData[examData.length-1].percentage > examData[0].percentage
      ? "Improving"
      : "Needs Focus";
      
    // Grade distribution
    const gradeDistribution = {
      EE: examData.filter(item => item.grade === 'EE').length,
      ME: examData.filter(item => item.grade === 'ME').length,
      AE: examData.filter(item => item.grade === 'AE').length,
      BE: examData.filter(item => item.grade === 'BE').length,
    };

    const gradeColors = {
      "EE": "#4ade80",
      "ME": "#3b82f6", 
      "AE": "#f97316",
      "BE": "#b91c1c",
    };
      
    return `
      <div style="font-family: Arial, sans-serif; padding: 20mm; color: #333;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; border-bottom: 3px solid #cc0000; padding-bottom: 10px; margin-bottom: 20px;">
          <div style="display: flex; align-items: center;">
            <img src="/lovable-uploads/19e2739d-3195-4a9c-824b-c2db7c576520.png" alt="School Logo" style="height: 50px; margin-right: 15px;">
            <div>
              <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #333;">David's Hope International</h1>
              <p style="margin: 0; font-size: 16px;">Student Exam Performance Report</p>
            </div>
          </div>
          <div style="text-align: right; font-size: 14px;">
            <p style="margin: 0;">Report Date: ${format(new Date(), 'MMM dd, yyyy')}</p>
          </div>
        </div>
        
        <!-- Student Information -->
        <div style="margin-bottom: 20px;">
          <h2 style="color: #cc0000; font-size: 20px; margin-bottom: 10px;">${studentName.toUpperCase()}</h2>
          <p style="margin: 0; font-size: 14px;">This report provides a comprehensive overview of the student's performance across examinations.</p>
        </div>
        
        <!-- Performance Summary -->
        <div style="margin-bottom: 25px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
          <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 16px;">Performance Summary</h3>
          
          <div style="display: flex; flex-wrap: wrap; gap: 15px;">
            <div style="flex: 1; min-width: 150px; padding: 10px; background-color: #fff; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <p style="margin: 0; font-size: 12px; color: #666;">Average Score</p>
              <p style="margin: 0; font-size: 20px; font-weight: bold; color: #3b82f6;">${averageScore}%</p>
            </div>
            
            <div style="flex: 1; min-width: 150px; padding: 10px; background-color: #fff; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <p style="margin: 0; font-size: 12px; color: #666;">Highest Score</p>
              <p style="margin: 0; font-size: 20px; font-weight: bold; color: #22c55e;">${highestScore}%</p>
            </div>
            
            <div style="flex: 1; min-width: 150px; padding: 10px; background-color: #fff; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <p style="margin: 0; font-size: 12px; color: #666;">Lowest Score</p>
              <p style="margin: 0; font-size: 20px; font-weight: bold; color: #ef4444;">${lowestScore}%</p>
            </div>
            
            <div style="flex: 1; min-width: 150px; padding: 10px; background-color: #fff; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <p style="margin: 0; font-size: 12px; color: #666;">Overall Trend</p>
              <p style="margin: 0; font-size: 20px; font-weight: bold; color: ${trendDirection === 'Improving' ? '#22c55e' : '#f97316'};">
                ${trendDirection}
              </p>
            </div>
          </div>
        </div>
        
        <!-- Grade Distribution -->
        <div style="margin-bottom: 25px;">
          <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 16px;">Grade Distribution</h3>
          <div style="display: flex; gap: 10px; margin-bottom: 10px;">
            <div style="flex: ${gradeDistribution.EE || 0.5}; height: 25px; background-color: ${gradeColors.EE}; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px;">
              EE: ${gradeDistribution.EE || 0}
            </div>
            <div style="flex: ${gradeDistribution.ME || 0.5}; height: 25px; background-color: ${gradeColors.ME}; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px;">
              ME: ${gradeDistribution.ME || 0}
            </div>
            <div style="flex: ${gradeDistribution.AE || 0.5}; height: 25px; background-color: ${gradeColors.AE}; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px;">
              AE: ${gradeDistribution.AE || 0}
            </div>
            <div style="flex: ${gradeDistribution.BE || 0.5}; height: 25px; background-color: ${gradeColors.BE}; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px;">
              BE: ${gradeDistribution.BE || 0}
            </div>
          </div>
          <div style="display: flex; gap: 15px; font-size: 12px;">
            <div style="flex: 1;"><b>EE:</b> Exceeding Expectation (80-100%)</div>
            <div style="flex: 1;"><b>ME:</b> Meeting Expectation (50-79%)</div>
            <div style="flex: 1;"><b>AE:</b> Approaching Expectation (40-49%)</div>
            <div style="flex: 1;"><b>BE:</b> Below Expectation (0-39%)</div>
          </div>
        </div>
        
        <!-- Exam Results Table -->
        <div style="margin-bottom: 25px;">
          <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 16px;">Exam Results</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Exam</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Term</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Date</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Score</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Percentage</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Grade</th>
              </tr>
            </thead>
            <tbody>
              ${examData.map((item, idx) => `
                <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
                  <td style="border: 1px solid #ddd; padding: 8px;">${item.examName}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${item.term}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${item.date}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.score} / ${item.maxScore}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.percentage}%</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
                    <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; background-color: ${gradeColors[item.grade]}; color: white; font-weight: bold;">
                      ${item.grade}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <!-- Visualization Placeholders -->
        <div style="margin-bottom: 25px;">
          <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 16px;">Performance Visualization</h3>
          
          <div style="display: flex; gap: 20px;">
            <!-- Performance Trend Chart - We're using a placeholder for the PDF -->
            <div style="flex: 1; padding: 15px; background-color: #f9f9f9; border-radius: 5px; text-align: center;">
              <h4 style="margin-top: 0; margin-bottom: 10px; font-size: 14px;">Performance Trend</h4>
              ${createSimpleChart(trendData.map(item => item.percentage))}
            </div>
            
            <!-- Term Average Chart - We're using a placeholder for the PDF -->
            <div style="flex: 1; padding: 15px; background-color: #f9f9f9; border-radius: 5px; text-align: center;">
              <h4 style="margin-top: 0; margin-bottom: 10px; font-size: 14px;">Term Averages</h4>
              ${createSimpleBarChart(termData.map(item => item.average))}
            </div>
          </div>
        </div>
        
        <!-- Recommendations -->
        <div style="margin-bottom: 25px; padding: 15px; background-color: #eef2ff; border-radius: 5px; border-left: 4px solid #6366f1;">
          <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 16px;">Academic Recommendations</h3>
          <p style="margin: 0; font-size: 14px;">
            ${
              averageScore >= 80 ? 
              'Student is performing excellently across subjects. Consider providing additional challenging material to further stimulate academic growth.' :
              averageScore >= 50 ?
              'Student is performing well, meeting the expected standards. Continue to support current study habits while focusing on specific areas for improvement.' :
              averageScore >= 40 ?
              'Student is approaching expectations but needs additional support. Consider arranging extra tutoring sessions in challenging subjects.' :
              'Student requires immediate academic intervention. Recommend comprehensive assessment and development of a personalized learning plan.'
            }
          </p>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center;">
          <p style="margin: 0;">This report is an official academic document from David's Hope International.</p>
          <p style="margin: 5px 0 0 0;">For questions or concerns regarding this report, please contact the school administration.</p>
        </div>
      </div>
    `;
  };

  // Create a simple line chart visualization using divs and styling
  const createSimpleChart = (values: number[]) => {
    if (values.length === 0) return '<div style="height: 100px; display: flex; align-items: center; justify-content: center; color: #666;">No data available</div>';
    
    const max = Math.max(...values, 100);
    const points = values.map(v => Math.round((v / max) * 100));
    
    let chart = `
      <div style="position: relative; height: 100px; border-bottom: 1px solid #ddd; border-left: 1px solid #ddd;">
    `;
    
    // Create line segments
    for (let i = 0; i < points.length - 1; i++) {
      const x1 = (i / (points.length - 1)) * 100;
      const y1 = 100 - points[i];
      const x2 = ((i + 1) / (points.length - 1)) * 100;
      const y2 = 100 - points[i + 1];
      
      chart += `
        <div style="position: absolute; height: 2px; background: #8884d8; width: ${Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))}%; 
                    left: ${x1}%; top: ${y1}%; 
                    transform: rotate(${Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI}deg);
                    transform-origin: 0 0;"></div>
      `;
    }
    
    // Add dots for each point
    points.forEach((point, i) => {
      const x = (i / (points.length - 1)) * 100;
      const y = 100 - point;
      
      chart += `
        <div style="position: absolute; width: 6px; height: 6px; background: #8884d8; border-radius: 50%;
                    left: ${x}%; top: ${y}%; transform: translate(-50%, -50%);"></div>
      `;
    });
    
    chart += `</div>`;
    return chart;
  };
  
  // Create a simple bar chart visualization using divs and styling
  const createSimpleBarChart = (values: number[]) => {
    if (values.length === 0) return '<div style="height: 100px; display: flex; align-items: center; justify-content: center; color: #666;">No data available</div>';
    
    const max = Math.max(...values, 100);
    const barWidth = 100 / (values.length * 2 - 1); // Width of each bar with spacing
    
    let chart = `<div style="position: relative; height: 100px; display: flex; align-items: flex-end; justify-content: space-between;">`;
    
    // Create bars
    values.forEach((value) => {
      const height = (value / max) * 100;
      
      chart += `
        <div style="width: ${barWidth}%; height: ${height}%; background: #8884d8; margin: 0 ${barWidth/4}%;"></div>
      `;
    });
    
    chart += `</div>`;
    return chart;
  };

  return (
    <Button 
      onClick={generatePDF} 
      disabled={isGenerating}
      variant="default"
    >
      {isGenerating ? (
        "Generating..."
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </>
      )}
    </Button>
  );
}
