
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateSlug } from "@/utils/slugUtils";
import { Sponsor } from "@/types/database";

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
  profileImageUrl?: string | null;
  primaryEmailForUpdates?: string;
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
      
      // Generate slugs for sponsors without them
      const sponsorsToUpdate = data.filter(sponsor => !sponsor.slug);
      if (sponsorsToUpdate.length > 0) {
        const existingSlugs = data
          .filter(sponsor => sponsor.slug)
          .map(sponsor => sponsor.slug || "");
          
        for (const sponsor of sponsorsToUpdate) {
          const slug = generateSlug(`${sponsor.first_name}-${sponsor.last_name}`, existingSlugs);
          await supabase.from("sponsors").update({ slug }).eq("id", sponsor.id);
          sponsor.slug = slug;
          existingSlugs.push(slug);
        }
      }
      
      return data as Sponsor[];
    },
  });

  const addSponsorMutation = useMutation({
    mutationFn: async (values: SponsorFormValues) => {
      try {
        // Generate a slug for the new sponsor
        const existingSlugs = (sponsors as Sponsor[])
          .map(sponsor => sponsor.slug || "");
        const slug = generateSlug(`${values.firstName}-${values.lastName}`, existingSlugs);
        
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
          notes: values.notes || null,
          profile_image_url: values.profileImageUrl || null,
          primary_email_for_updates: values.primaryEmailForUpdates || null,
          slug: slug
        };

        const { data, error } = await supabase
          .from("sponsors")
          .insert([sponsorData])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error: any) {
        console.error("Error adding sponsor:", error);
        throw new Error(error.message || "Failed to add sponsor");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors"] });
      toast.success("Sponsor added successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to add sponsor: " + error.message);
    },
  });

  const updateSponsorMutation = useMutation({
    mutationFn: async ({ id, ...values }: SponsorFormValues & { id: string }) => {
      try {
        // Check if name changed
        const { data: currentSponsor } = await supabase
          .from("sponsors")
          .select("first_name, last_name, slug")
          .eq("id", id)
          .single();
          
        if (!currentSponsor) throw new Error("Sponsor not found");
        
        const nameChanged = currentSponsor && 
          (currentSponsor.first_name !== values.firstName || 
           currentSponsor.last_name !== values.lastName);
        
        // Transform form values to match the database schema
        const sponsorData: any = {
          first_name: values.firstName,
          last_name: values.lastName,
          email: values.email,
          email2: values.email2 || null,
          phone: values.phone || null,
          address: values.address || null,
          country: values.country || null,
          start_date: values.startDate,
          status: values.status,
          notes: values.notes || null,
          profile_image_url: values.profileImageUrl || null,
          primary_email_for_updates: values.primaryEmailForUpdates || null
        };
        
        // Update slug if name changed
        if (nameChanged) {
          const existingSlugs = (sponsors as Sponsor[])
            .filter(s => s.id !== id)
            .map(s => s.slug || "");
          sponsorData.slug = generateSlug(`${values.firstName}-${values.lastName}`, existingSlugs);
        }

        const { data, error } = await supabase
          .from("sponsors")
          .update(sponsorData)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error: any) {
        console.error("Error updating sponsor:", error);
        throw new Error(error.message || "Failed to update sponsor");
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sponsors"] });
      queryClient.invalidateQueries({ queryKey: ["sponsors", data.id] });
      toast.success("Sponsor updated successfully");
    },
    onError: (error: any) => {
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
    onError: (error: any) => {
      toast.error("Failed to delete sponsor: " + error.message);
    },
  });
  
  const bulkDeleteSponsorsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("sponsors")
        .delete()
        .in("id", ids);

      if (error) throw error;
      return ids;
    },
    onSuccess: (ids) => {
      queryClient.invalidateQueries({ queryKey: ["sponsors"] });
      toast.success(`${ids.length} sponsor${ids.length > 1 ? 's' : ''} deleted successfully`);
    },
    onError: (error: any) => {
      toast.error("Failed to delete sponsors: " + error.message);
    },
  });
  
  const bulkUpdateSponsorStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[], status: "active" | "inactive" }) => {
      const { error } = await supabase
        .from("sponsors")
        .update({ status })
        .in("id", ids);

      if (error) throw error;
      return { ids, status };
    },
    onSuccess: ({ ids, status }) => {
      queryClient.invalidateQueries({ queryKey: ["sponsors"] });
      toast.success(`${ids.length} sponsor${ids.length > 1 ? 's' : ''} ${status === "inactive" ? "deactivated" : "activated"} successfully`);
    },
    onError: (error: any) => {
      toast.error("Failed to update sponsors: " + error.message);
    },
  });
  
  return {
    sponsors,
    isLoading,
    addSponsor: addSponsorMutation.mutate,
    updateSponsor: updateSponsorMutation.mutate,
    deleteSponsor: deleteSponsorMutation.mutate,
    bulkDeleteSponsors: bulkDeleteSponsorsMutation.mutate,
    bulkUpdateSponsorStatus: bulkUpdateSponsorStatusMutation.mutate,
  };
};
