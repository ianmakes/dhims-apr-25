
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SponsorFormValues } from "@/components/sponsors/AddEditSponsorModal";

export const useSponsors = () => {
  const queryClient = useQueryClient();

  const { data: sponsors = [], isLoading } = useQuery({
    queryKey: ["sponsors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sponsors")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const addSponsorMutation = useMutation({
    mutationFn: async (values: SponsorFormValues) => {
      const { data, error } = await supabase
        .from("sponsors")
        .insert([values])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors"] });
      toast.success("Sponsor added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add sponsor: " + error.message);
    },
  });

  const updateSponsorMutation = useMutation({
    mutationFn: async ({ id, ...values }: SponsorFormValues & { id: string }) => {
      const { data, error } = await supabase
        .from("sponsors")
        .update(values)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors"] });
      toast.success("Sponsor updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update sponsor: " + error.message);
    },
  });

  const deleteSponsorMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sponsors")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors"] });
      toast.success("Sponsor deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete sponsor: " + error.message);
    },
  });

  return {
    sponsors,
    isLoading,
    addSponsor: addSponsorMutation.mutate,
    updateSponsor: updateSponsorMutation.mutate,
    deleteSponsor: deleteSponsorMutation.mutate,
  };
};
