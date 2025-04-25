import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Database model for Sponsor
export interface Sponsor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  email2?: string;
  phone?: string;
  address?: string;
  country?: string;
  start_date: string;
  status: "active" | "inactive";
  notes?: string;
  created_at: string;
  updated_at: string;
  students?: any[];
}

// Form values for Sponsor (used in forms)
export interface SponsorFormValues {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  email2?: string;
  phone?: string;
  address?: string;
  country?: string;
  startDate: string;
  status: "active" | "inactive";
  notes?: string;
}

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
      return data as Sponsor[];
    },
  });

  const addSponsorMutation = useMutation({
    mutationFn: async (values: SponsorFormValues) => {
      // Transform form values to match the database schema
      const sponsorData = {
        first_name: values.firstName,
        last_name: values.lastName,
        email: values.email,
        email2: values.email2 || null,
        phone: values.phone || null,
        address: values.address || null,
        country: values.country || null,
        start_date: values.startDate,
        status: values.status,
        notes: values.notes || null
      };

      const { data, error } = await supabase
        .from("sponsors")
        .insert([sponsorData])
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
      // Transform form values to match the database schema
      const sponsorData = {
        first_name: values.firstName,
        last_name: values.lastName,
        email: values.email,
        email2: values.email2 || null,
        phone: values.phone || null,
        address: values.address || null,
        country: values.country || null,
        start_date: values.startDate,
        status: values.status,
        notes: values.notes || null
      };

      const { data, error } = await supabase
        .from("sponsors")
        .update(sponsorData)
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
