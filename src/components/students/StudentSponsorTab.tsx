import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertTriangle, Calendar, User, Users } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { SUPABASE_URL, getAuthHeaders } from "@/utils/supabaseHelpers";
interface StudentSponsorTabProps {
  student: {
    [key: string]: any;
  };
  formatDate: (date: string | Date | null | undefined) => string;
  navigate: (to: string) => void;
  toast: any;
}
export function StudentSponsorTab({
  student,
  formatDate,
  navigate,
  toast
}: StudentSponsorTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const handleRemoveSponsor = async () => {
    if (!student.id) return;
    setIsLoading(true);
    try {
      // Update student record to remove sponsor
      const {
        error: updateError
      } = await supabase.from("students").update({
        sponsor_id: null,
        sponsored_since: null
      }).eq("id", student.id);
      if (updateError) throw updateError;

      // Add timeline event if sponsor_id exists
      if (student.sponsor_id) {
        // Using REST API directly with our helper utility
        const response = await fetch(`${SUPABASE_URL}/rest/v1/sponsor_timeline_events`, {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            sponsor_id: student.sponsor_id,
            title: "Student Removed",
            description: `Student ${student.name} was removed from sponsorship via student profile.`,
            type: "student_removal",
            student_id: student.id,
            date: new Date().toISOString()
          })
        });
        if (!response.ok) {
          console.error("Error creating timeline event:", response.statusText);
        }
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ["student", student.id]
      });
      queryClient.invalidateQueries({
        queryKey: ["available-students"]
      });
      toast({
        title: "Sponsorship Removed",
        description: "The sponsor has been removed from this student."
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

  // Get sponsor full name or display a meaningful placeholder
  const getSponsorDisplayName = () => {
    if (student.sponsor && student.sponsor.first_name && student.sponsor.last_name) {
      return `${student.sponsor.first_name} ${student.sponsor.last_name}`;
    } else if (student.sponsor && (student.sponsor.first_name || student.sponsor.last_name)) {
      // In case only one name is available
      return student.sponsor.first_name || student.sponsor.last_name;
    } else {
      return "Unknown Sponsor";
    }
  };
  if (student.sponsor_id) {
    return <div className="py-4">
        <Card className="wp-card">
          <CardHeader className="border-b border-wp-gray-200">
            <CardTitle className="text-lg text-wp-text-primary text-left">Sponsor Information</CardTitle>
            <CardDescription className="text-wp-text-secondary text-left">
              Details about {student.name}'s sponsor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-wp-gray-100">
                {student.sponsor?.profile_image_url ? <AvatarImage src={student.sponsor.profile_image_url} alt="Sponsor" /> : <AvatarFallback className="bg-wp-gray-200 text-wp-gray-600 text-xl">
                    <User className="h-8 w-8" />
                  </AvatarFallback>}
              </Avatar>
              <div>
                <h3 className="text-xl font-medium text-wp-text-primary">
                  {getSponsorDisplayName()}
                </h3>
                <p className="text-sm text-wp-text-secondary mt-1 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Sponsoring since {formatDate(student.sponsored_since)}
                </p>
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" className="text-wp-error border-wp-gray-300 hover:border-wp-error hover:bg-wp-error/5" onClick={handleRemoveSponsor} disabled={isLoading}>
                Remove Sponsorship
              </Button>
              <Button variant="secondary" onClick={() => navigate(`/sponsors/${student.sponsor_id}`)} className="bg-wp-gray-100 hover:bg-wp-gray-200 text-wp-text-primary">
                <Users className="mr-2 h-4 w-4" />
                View Sponsor Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="py-4">
      <Card className="wp-card">
        <CardHeader className="border-b border-wp-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-wp-warning mr-2" />
            <CardTitle className="text-lg text-wp-text-primary">No Sponsor Assigned</CardTitle>
          </div>
          <CardDescription className="text-wp-text-secondary pl-6 text-left">
            This student currently does not have a sponsor
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <div className="flex justify-center py-6">
            <Button onClick={() => navigate('/sponsors')} className="bg-wp-primary hover:bg-wp-primary/90 text-white">
              <Users className="mr-2 h-4 w-4" />
              Assign Sponsor
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>;
}