
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      return data;
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors", sponsorId] });
      queryClient.invalidateQueries({ queryKey: ["available-students"] });
      toast.success("Students assigned successfully");
    },
    onError: (error) => {
      toast.error("Failed to assign students: " + error.message);
    },
  });

  const removeStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase
        .from("students")
        .update({ 
          sponsor_id: null,
          sponsored_since: null
        })
        .eq("id", studentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors", sponsorId] });
      queryClient.invalidateQueries({ queryKey: ["available-students"] });
      toast.success("Student removed successfully");
    },
    onError: (error) => {
      toast.error("Failed to remove student: " + error.message);
    },
  });

  return {
    sponsor,
    availableStudents,
    isLoading: isLoadingSponsor || isLoadingStudents,
    assignStudents: assignStudentsMutation.mutate,
    removeStudent: removeStudentMutation.mutate,
  };
};
