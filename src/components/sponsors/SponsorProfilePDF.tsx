import { useEffect, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Sponsor, SponsorRelative } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface SponsorProfilePDFProps {
  sponsor: Sponsor;
  onGenerated?: () => void;
  onError?: (error: Error) => void;
}

export function SponsorProfilePDF({ sponsor, onGenerated, onError }: SponsorProfilePDFProps) {
  const [isGenerating, setIsGenerating] = useState(true);
  
  // Fetch logo from settings
  const { data: logoSettings } = useQuery({
    queryKey: ['settings', 'logo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'organization_logo')
        .single();
        
      if (error) {
        console.error("Error fetching logo settings:", error);
        return null;
      }
      
      return data?.value || null;
    }
  });
  
  // Default logo path
  const logoPath = logoSettings || "/lovable-uploads/19e2739d-3195-4a9c-824b-c2db7c576520.png";

  useEffect(() => {
    const generatePDF = async () => {
      try {
        // Get the HTML element
        const element = document.getElementById("sponsor-profile-pdf");
        if (!element) {
          throw new Error("PDF content element not found");
        }

        // Convert the HTML element to canvas
        const canvas = await html2canvas(element, {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
        });

        // Calculate dimensions for A4 size (210mm x 297mm)
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        // Initialize PDF (A4 size)
        const pdf = new jsPDF("p", "mm", "a4");
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight);
        
        // Add more pages if needed
        heightLeft -= pageHeight;
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Save the PDF
        pdf.save(`${sponsor.first_name}_${sponsor.last_name}_Profile.pdf`);
        
        if (onGenerated) {
          onGenerated();
        }
      } catch (error) {
        console.error("Error generating PDF:", error);
        if (onError && error instanceof Error) {
          onError(error);
        }
      } finally {
        setIsGenerating(false);
      }
    };

    if (isGenerating) {
      generatePDF();
    }
  }, [isGenerating, sponsor, onGenerated, onError, logoPath]);

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "—";
    try {
      return format(new Date(date), "MMMM d, yyyy");
    } catch (error) {
      return "Invalid Date";
    }
  };

  return (
    <div className="hidden">
      <div id="sponsor-profile-pdf" className="bg-white p-8" style={{ width: "210mm", minHeight: "297mm" }}>
        {/* Header with logo */}
        <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-center">
            <img 
              src={logoPath} 
              alt="Organization Logo" 
              className="h-12 mr-4"
              style={{ objectFit: "contain" }}
              onError={(e) => {
                e.currentTarget.src = "/lovable-uploads/19e2739d-3195-4a9c-824b-c2db7c576520.png";
              }}
            />
            <div>
              <h1 className="text-2xl font-bold">Sponsor Profile</h1>
              <p className="text-sm text-gray-500">Generated on {format(new Date(), "MMMM d, yyyy")}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center mb-6">
          <Avatar className="h-24 w-24">
            {sponsor.profile_image_url ? (
              <AvatarImage src={sponsor.profile_image_url} alt={`${sponsor.first_name} ${sponsor.last_name}`} />
            ) : (
              <AvatarFallback className="text-2xl">
                {sponsor.first_name[0]}{sponsor.last_name[0]}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
        
        <div className="flex flex-col items-center mb-6">
          <h2 className="text-2xl font-bold">
            {sponsor.first_name} {sponsor.last_name}
          </h2>
          <Badge className="mt-2" variant={sponsor.status === "active" ? "default" : "secondary"}>
            {sponsor.status.charAt(0).toUpperCase() + sponsor.status.slice(1)}
          </Badge>
          <p className="text-wp-text-secondary mt-2">
            Sponsor since {formatDate(sponsor.start_date)}
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-3">
                  <span className="font-medium">Email:</span>
                  <span className="col-span-2">{sponsor.email}</span>
                </div>
                
                {sponsor.email2 && (
                  <div className="grid grid-cols-3">
                    <span className="font-medium">Alt Email:</span>
                    <span className="col-span-2">{sponsor.email2}</span>
                  </div>
                )}
                
                {sponsor.phone && (
                  <div className="grid grid-cols-3">
                    <span className="font-medium">Phone:</span>
                    <span className="col-span-2">{sponsor.phone}</span>
                  </div>
                )}
                
                {sponsor.country && (
                  <div className="grid grid-cols-3">
                    <span className="font-medium">Country:</span>
                    <span className="col-span-2">{sponsor.country}</span>
                  </div>
                )}
                
                {sponsor.address && (
                  <div className="grid grid-cols-3">
                    <span className="font-medium">Address:</span>
                    <span className="col-span-2">{sponsor.address}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Sponsorship Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-3">
                  <span className="font-medium">Status:</span>
                  <span className="col-span-2 capitalize">{sponsor.status}</span>
                </div>
                
                <div className="grid grid-cols-3">
                  <span className="font-medium">Start Date:</span>
                  <span className="col-span-2">{formatDate(sponsor.start_date)}</span>
                </div>
                
                <div className="grid grid-cols-3">
                  <span className="font-medium">Sponsored Students:</span>
                  <span className="col-span-2">{sponsor.students?.length || 0} students</span>
                </div>
                
                {sponsor.primary_email_for_updates && (
                  <div className="grid grid-cols-3">
                    <span className="font-medium">Updates Via:</span>
                    <span className="col-span-2 capitalize">
                      {sponsor.primary_email_for_updates === "both" 
                        ? "Both emails"
                        : sponsor.primary_email_for_updates}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Show relatives if any */}
        {sponsor.relatives && sponsor.relatives.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Relatives / Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                {sponsor.relatives.map((relative: SponsorRelative) => (
                  <div key={relative.id} className="border p-3 rounded-md grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium">{relative.name}</span>
                      <p className="text-sm text-wp-text-secondary">{relative.relationship}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{relative.email}</p>
                      {relative.phone_number && (
                        <p className="text-sm text-wp-text-secondary">{relative.phone_number}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {sponsor.notes && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{sponsor.notes}</p>
            </CardContent>
          </Card>
        )}
        
        {/* Sponsored students section */}
        {sponsor.students && sponsor.students.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Sponsored Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {sponsor.students.map((student: any) => (
                  <div key={student.id} className="border p-3 rounded-md">
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-wp-text-secondary">
                      Grade: {student.current_grade || "—"} | 
                      Admission #: {student.admission_number}
                    </p>
                    {student.sponsored_since && (
                      <p className="text-xs text-wp-text-secondary mt-1">
                        Sponsored since: {formatDate(student.sponsored_since)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="mt-8 text-center text-wp-text-secondary text-sm">
          <p>Generated on {format(new Date(), "MMMM d, yyyy")}</p>
          <p>©2025 Student Sponsorship System</p>
        </div>
      </div>
    </div>
  );
}
