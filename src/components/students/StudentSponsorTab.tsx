
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertTriangle, Users } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface StudentSponsorTabProps {
  student: { [key: string]: any };
  formatDate: (date: string | Date | null | undefined) => string;
  navigate: (to: string) => void;
  toast: any;
}

export function StudentSponsorTab({ student, formatDate, navigate, toast }: StudentSponsorTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleRemoveSponsor = async () => {
    if (!student.id) return;
    
    setIsLoading(true);
    try {
      // Update student record to remove sponsor
      const { error: updateError } = await supabase
        .from("students")
        .update({ 
          sponsor_id: null,
          sponsored_since: null
        })
        .eq("id", student.id);
        
      if (updateError) throw updateError;
      
      // Add timeline event if sponsor_id exists
      if (student.sponsor_id) {
        const { error: timelineError } = await supabase
          .from("sponsor_timeline_events")
          .insert({
            sponsor_id: student.sponsor_id,
            title: "Student Removed",
            description: `Student ${student.name} was removed from sponsorship via student profile.`,
            type: "student_removal",
            student_id: student.id,
            date: new Date().toISOString()
          });
          
        if (timelineError) console.error("Error creating timeline event:", timelineError);
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["student", student.id] });
      queryClient.invalidateQueries({ queryKey: ["available-students"] });
      
      toast({
        title: "Sponsorship Removed",
        description: "The sponsor has been removed from this student.",
      });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove sponsor: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (student.sponsor_id) {
    return (
      <div className="py-4">
        <Card>
          <CardHeader>
            <CardTitle>Sponsor Information</CardTitle>
            <CardDescription>
              Details about {student.name}'s sponsor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar className="h-16 w-16">
                {student.sponsor?.profile_image_url ? (
                  <AvatarImage src={student.sponsor.profile_image_url} alt="Sponsor" />
                ) : (
                  <AvatarFallback className="text-xl">SP</AvatarFallback>
                )}
              </Avatar>
              <div>
                <h3 className="text-xl font-medium">
                  {student.sponsor ? 
                    `${student.sponsor.first_name} ${student.sponsor.last_name}` : 
                    `Sponsor #${student.sponsor_id}`}
                </h3>
                <p className="text-muted-foreground">
                  Sponsoring since {formatDate(student.sponsored_since)}
                </p>
              </div>
            </div>
            <div className="flex justify-between">
              <Button
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={handleRemoveSponsor}
                disabled={isLoading}
              >
                Remove Sponsorship
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate(`/sponsors/${student.sponsor_id}`)}
              >
                <Users className="mr-2 h-4 w-4" />
                View Sponsor Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-4">
      <Card>
        <CardHeader>
          <CardTitle>No Sponsor Assigned</CardTitle>
          <CardDescription>
            This student currently does not have a sponsor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-6">
            <Button onClick={() => navigate('/sponsors')}>
              <Users className="mr-2 h-4 w-4" />
              Assign Sponsor
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
