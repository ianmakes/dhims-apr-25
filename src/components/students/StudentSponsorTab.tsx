
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus } from "lucide-react";
import { AssignSponsorModal } from "./AssignSponsorModal";
import { useAuth } from "@/contexts/AuthContext";

interface StudentSponsorTabProps {
  student: any;
  formatDate: (date: string | Date | null | undefined) => string;
  navigate: (path: string) => void;
  toast: any;
}

export function StudentSponsorTab({ student, formatDate, navigate, toast }: StudentSponsorTabProps) {
  const [isAssignSponsorOpen, setIsAssignSponsorOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Fetch sponsor details if the student has a sponsor_id
  const { data: sponsor, isLoading: isLoadingSponsor } = useQuery({
    queryKey: ['sponsor', student.sponsor_id],
    queryFn: async () => {
      if (!student.sponsor_id) return null;
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .eq('id', student.sponsor_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!student.sponsor_id
  });

  // Mutation to assign/remove sponsor
  const updateSponsorMutation = useMutation({
    mutationFn: async (sponsorId: string | null) => {
      const { data, error } = await supabase
        .from('students')
        .update({
          sponsor_id: sponsorId,
          sponsored_since: sponsorId ? new Date().toISOString() : null,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', student.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', student.id] });
      toast({
        title: sponsor ? "Sponsor removed" : "Sponsor assigned",
        description: sponsor 
          ? `${student.name} is no longer sponsored.`
          : `${student.name} has been successfully sponsored.`
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleAssignSponsor = (sponsorId: string) => {
    updateSponsorMutation.mutate(sponsorId);
    setIsAssignSponsorOpen(false);
  };

  const handleRemoveSponsor = () => {
    updateSponsorMutation.mutate(null);
  };

  const getSponsorName = () => {
    if (!sponsor) return "Loading...";
    return `${sponsor.first_name} ${sponsor.last_name}`;
  };

  return (
    <div className="py-4">
      <Card>
        <CardHeader>
          <CardTitle>Sponsorship Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {student.sponsor_id ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="font-medium">Sponsor Name</h3>
                  <p>{isLoadingSponsor ? "Loading..." : getSponsorName()}</p>
                </div>
                <div>
                  <h3 className="font-medium">Sponsored Since</h3>
                  <p>{formatDate(student.sponsored_since)}</p>
                </div>
              </div>
              {sponsor && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="font-medium">Email</h3>
                    <p>{sponsor.email}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Country</h3>
                    <p>{sponsor.country || "N/A"}</p>
                  </div>
                </div>
              )}
              <div className="flex space-x-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`/sponsors/${student.sponsor_id}`)}
                >
                  View Sponsor
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleRemoveSponsor}
                >
                  Remove Sponsor
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-2">No Sponsor Assigned</h3>
              <p className="text-muted-foreground mb-4">
                This student doesn't have a sponsor assigned yet.
              </p>
              <Button onClick={() => setIsAssignSponsorOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Assign Sponsor
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AssignSponsorModal 
        open={isAssignSponsorOpen} 
        onOpenChange={setIsAssignSponsorOpen}
        onAssign={handleAssignSponsor}
        studentId={student.id}
      />
    </div>
  );
}
