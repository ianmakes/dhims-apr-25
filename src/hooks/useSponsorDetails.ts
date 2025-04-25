
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sponsor } from "@/hooks/useSponsors";
import { SponsorRelative } from "@/types/database";

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
      const { data, error } = await supabase
        .from("sponsors")
        .select("*, students(*)")
        .eq("id", sponsorId)
        .single();

      if (error) throw error;
      return data as Sponsor;
    },
    enabled: !!sponsorId,
  });

  const { data: availableStudents = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ["available-students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .is("sponsor_id", null)
        .eq("status", "active");

      if (error) throw error;
      return data;
    },
  });

  // Query to fetch sponsor relatives
  const { data: sponsorRelatives = [], isLoading: isLoadingRelatives } = useQuery({
    queryKey: ["sponsor-relatives", sponsorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sponsor_relatives")
        .select("*")
        .eq("sponsor_id", sponsorId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SponsorRelative[];
    },
    enabled: !!sponsorId,
  });

  // Query to fetch sponsor timeline events
  const { data: timelineEvents = [], isLoading: isLoadingTimeline } = useQuery({
    queryKey: ["sponsor-timeline", sponsorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sponsor_timeline_events")
        .select("*")
        .eq("sponsor_id", sponsorId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data;
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
      
      // Create timeline entries for each assigned student
      const timelineEntries = studentIds.map(studentId => ({
        sponsor_id: sponsorId,
        title: "Student Assigned",
        description: `A new student was assigned to this sponsor.`,
        type: "student_assignment",
        student_id: studentId,
        date: new Date().toISOString()
      }));
      
      const { error: timelineError } = await supabase
        .from("sponsor_timeline_events")
        .insert(timelineEntries);
        
      if (timelineError) throw timelineError;
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
      
      // Create a timeline entry for the removal
      const { error: timelineError } = await supabase
        .from("sponsor_timeline_events")
        .insert({
          sponsor_id: sponsorId,
          title: "Student Removed",
          description: `Student was removed. Reason: ${reason}${notes ? `. Notes: ${notes}` : ''}`,
          type: "student_removal",
          student_id: studentId,
          date: new Date().toISOString()
        });
        
      if (timelineError) throw timelineError;
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

  // Mutation to add a sponsor relative
  const addSponsorRelativeMutation = useMutation({
    mutationFn: async (relative: Omit<SponsorRelative, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from("sponsor_relatives")
        .insert({
          ...relative,
          sponsor_id: sponsorId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsor-relatives", sponsorId] });
      toast.success("Relative added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add relative: " + error.message);
    },
  });

  // Mutation to update a sponsor relative
  const updateSponsorRelativeMutation = useMutation({
    mutationFn: async (relative: Partial<SponsorRelative> & { id: string }) => {
      const { data, error } = await supabase
        .from("sponsor_relatives")
        .update(relative)
        .eq("id", relative.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsor-relatives", sponsorId] });
      toast.success("Relative updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update relative: " + error.message);
    },
  });

  // Mutation to delete a sponsor relative
  const deleteSponsorRelativeMutation = useMutation({
    mutationFn: async (relativeId: string) => {
      const { error } = await supabase
        .from("sponsor_relatives")
        .delete()
        .eq("id", relativeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsor-relatives", sponsorId] });
      toast.success("Relative removed successfully");
    },
    onError: (error) => {
      toast.error("Failed to remove relative: " + error.message);
    },
  });

  // Mutation to add a timeline event
  const addTimelineEventMutation = useMutation({
    mutationFn: async (event: { title: string; description?: string; type: string }) => {
      const { data, error } = await supabase
        .from("sponsor_timeline_events")
        .insert({
          sponsor_id: sponsorId,
          title: event.title,
          description: event.description || null,
          type: event.type,
          date: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsor-timeline", sponsorId] });
      toast.success("Timeline event added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add timeline event: " + error.message);
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
  };
};
