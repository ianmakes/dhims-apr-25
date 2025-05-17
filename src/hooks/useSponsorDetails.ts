
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sponsor, SponsorRelative, SponsorTimelineEvent } from "@/types/database";
import { SUPABASE_URL, getAuthHeaders } from "@/utils/supabaseHelpers";
import { generateSlug } from "@/utils/slugUtils";

// Interface for the student removal reason form
export interface StudentRemovalForm {
  studentId: string;
  reason: string;
  notes?: string;
}

export const useSponsorDetails = (sponsorId: string) => {
  const queryClient = useQueryClient();

  // First get the current academic year
  const { data: currentAcademicYear } = useQuery({
    queryKey: ["current-academic-year"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .eq("is_current", true)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: sponsor, isLoading: isLoadingSponsor } = useQuery({
    queryKey: ["sponsors", sponsorId],
    queryFn: async () => {
      // Get the sponsor with students data
      const { data: sponsorData, error: sponsorError } = await supabase
        .from("sponsors")
        .select("*, students(*)")
        .eq("id", sponsorId)
        .single();

      if (sponsorError) throw sponsorError;
      
      // Generate slug if it doesn't exist
      if (!sponsorData.slug && sponsorData.first_name && sponsorData.last_name) {
        const slug = generateSlug(`${sponsorData.first_name}-${sponsorData.last_name}`);
        await supabase.from("sponsors").update({ slug }).eq("id", sponsorId);
        sponsorData.slug = slug;
      }
      
      // Get relatives using custom fetch since sponsor_relatives might not exist in the supabase types
      try {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/sponsor_relatives?sponsor_id=eq.${sponsorId}`,
          {
            headers: getAuthHeaders(),
          }
        );
        
        if (response.ok) {
          const relativesData = await response.json();
          sponsorData.relatives = relativesData;
        }
      } catch (error) {
        console.error("Error fetching relatives:", error);
      }
      
      return sponsorData as Sponsor;
    },
    enabled: !!sponsorId,
  });

  const { data: availableStudents = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ["available-students"],
    queryFn: async () => {
      // Get all active students without a sponsor
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .is("sponsor_id", null)
        .eq("status", "Active");

      if (error) {
        console.error("Error fetching available students:", error);
        throw error;
      }
      
      return data || [];
    },
  });

  // Query to fetch sponsor relatives using the REST API directly with our helper utility
  const { data: sponsorRelatives = [], isLoading: isLoadingRelatives } = useQuery({
    queryKey: ["sponsor-relatives", sponsorId],
    queryFn: async () => {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/sponsor_relatives?sponsor_id=eq.${sponsorId}&order=created_at.desc`,
        {
          headers: getAuthHeaders(),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Error fetching sponsor relatives: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data as SponsorRelative[];
    },
    enabled: !!sponsorId,
  });

  // Query to fetch sponsor timeline events using the REST API directly with our helper utility
  const { data: timelineEvents = [], isLoading: isLoadingTimeline } = useQuery({
    queryKey: ["sponsor-timeline", sponsorId],
    queryFn: async () => {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/sponsor_timeline_events?sponsor_id=eq.${sponsorId}&order=date.desc`,
        {
          headers: getAuthHeaders(),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Error fetching sponsor timeline events: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data as SponsorTimelineEvent[];
    },
    enabled: !!sponsorId,
  });

  const assignStudentsMutation = useMutation({
    mutationFn: async (studentIds: string[]) => {
      const { error } = await supabase
        .from("students")
        .update({ 
          sponsor_id: sponsorId,
          sponsored_since: new Date().toISOString()
        })
        .in("id", studentIds);

      if (error) throw error;
      
      // Create timeline entries for each assigned student using REST API directly with our helper utility
      for (const studentId of studentIds) {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/sponsor_timeline_events`, {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            sponsor_id: sponsorId,
            title: "Student Assigned",
            description: "A new student was assigned to this sponsor.",
            type: "student_assignment",
            student_id: studentId,
            date: new Date().toISOString()
          }),
        });
        
        if (!response.ok) {
          console.error("Error creating timeline event:", response.statusText);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors", sponsorId] });
      queryClient.invalidateQueries({ queryKey: ["available-students"] });
      queryClient.invalidateQueries({ queryKey: ["sponsor-timeline", sponsorId] });
      toast.success("Students assigned successfully");
    },
    onError: (error) => {
      toast.error("Failed to assign students: " + error.message);
    },
  });

  const removeStudentMutation = useMutation({
    mutationFn: async ({ studentId, reason, notes }: StudentRemovalForm) => {
      const { error } = await supabase
        .from("students")
        .update({ 
          sponsor_id: null,
          sponsored_since: null
        })
        .eq("id", studentId);

      if (error) throw error;
      
      // Create a timeline entry for the removal using REST API with our helper utility
      const response = await fetch(`${SUPABASE_URL}/rest/v1/sponsor_timeline_events`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          sponsor_id: sponsorId,
          title: "Student Removed",
          description: `Student was removed. Reason: ${reason}${notes ? `. Notes: ${notes}` : ''}`,
          type: "student_removal",
          student_id: studentId,
          date: new Date().toISOString()
        }),
      });
      
      if (!response.ok) {
        console.error("Error creating timeline event:", response.statusText);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors", sponsorId] });
      queryClient.invalidateQueries({ queryKey: ["available-students"] });
      queryClient.invalidateQueries({ queryKey: ["sponsor-timeline", sponsorId] });
      toast.success("Student removed successfully");
    },
    onError: (error) => {
      toast.error("Failed to remove student: " + error.message);
    },
  });

  // Mutation to add a sponsor relative using REST API with our helper utility
  const addSponsorRelativeMutation = useMutation({
    mutationFn: async (relative: Omit<SponsorRelative, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/sponsor_relatives`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          ...relative,
          sponsor_id: sponsorId
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add relative: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data[0] as SponsorRelative;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors", sponsorId] });
      queryClient.invalidateQueries({ queryKey: ["sponsor-relatives", sponsorId] });
      toast.success("Relative added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add relative: " + error.message);
    },
  });

  // Mutation to update a sponsor relative using REST API with our helper utility
  const updateSponsorRelativeMutation = useMutation({
    mutationFn: async (relative: Partial<SponsorRelative> & { id: string }) => {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/sponsor_relatives?id=eq.${relative.id}`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(relative),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update relative: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data[0] as SponsorRelative;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors", sponsorId] });
      queryClient.invalidateQueries({ queryKey: ["sponsor-relatives", sponsorId] });
      toast.success("Relative updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update relative: " + error.message);
    },
  });

  // Mutation to delete a sponsor relative using REST API with our helper utility
  const deleteSponsorRelativeMutation = useMutation({
    mutationFn: async (relativeId: string) => {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/sponsor_relatives?id=eq.${relativeId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete relative: ${response.statusText}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors", sponsorId] });
      queryClient.invalidateQueries({ queryKey: ["sponsor-relatives", sponsorId] });
      toast.success("Relative removed successfully");
    },
    onError: (error) => {
      toast.error("Failed to remove relative: " + error.message);
    },
  });

  // Mutation to add a timeline event using REST API with our helper utility
  const addTimelineEventMutation = useMutation({
    mutationFn: async (event: { title: string; description?: string; type: string }) => {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/sponsor_timeline_events`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          sponsor_id: sponsorId,
          title: event.title,
          description: event.description || null,
          type: event.type,
          date: new Date().toISOString()
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add timeline event: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data[0] as SponsorTimelineEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsor-timeline", sponsorId] });
      toast.success("Timeline event added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add timeline event: " + error.message);
    },
  });

  // Mutation to update a timeline event
  const updateTimelineEventMutation = useMutation({
    mutationFn: async (event: Partial<SponsorTimelineEvent> & { id: string }) => {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/sponsor_timeline_events?id=eq.${event.id}`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(event),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update timeline event: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data[0] as SponsorTimelineEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsor-timeline", sponsorId] });
      toast.success("Timeline event updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update timeline event: " + error.message);
    },
  });

  // Mutation to delete a timeline event
  const deleteTimelineEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/sponsor_timeline_events?id=eq.${eventId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete timeline event: ${response.statusText}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsor-timeline", sponsorId] });
      toast.success("Timeline event deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete timeline event: " + error.message);
    },
  });

  return {
    sponsor,
    availableStudents,
    sponsorRelatives,
    timelineEvents,
    isLoading: isLoadingSponsor || isLoadingStudents,
    isLoadingRelatives,
    isLoadingTimeline,
    assignStudents: assignStudentsMutation.mutate,
    removeStudent: removeStudentMutation.mutate,
    addSponsorRelative: addSponsorRelativeMutation.mutate,
    updateSponsorRelative: updateSponsorRelativeMutation.mutate,
    deleteSponsorRelative: deleteSponsorRelativeMutation.mutate,
    addTimelineEvent: addTimelineEventMutation.mutate,
    updateTimelineEvent: updateTimelineEventMutation.mutate,
    deleteTimelineEvent: deleteTimelineEventMutation.mutate,
  };
};
