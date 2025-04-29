
import React, { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AddEditSponsorModal } from "@/components/sponsors/AddEditSponsorModal";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { Main } from "@/components/ui/main";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Define the DBSponsor type to match the actual database structure
interface DBSponsor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  email2?: string;
  phone?: string;
  address?: string;
  country?: string;
  start_date: string;
  status: string;
  profile_image_url?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  primary_email_for_updates?: string;
  slug?: string;
}

// Sponsor form values type
interface SponsorFormValues {
  first_name: string;
  last_name: string;
  email: string;
  email2?: string;
  phone?: string;
  address?: string;
  country?: string;
  start_date: string;
  status: string;
  profile_image_url?: string;
  notes?: string;
  primary_email_for_updates?: string;
}

const Sponsors = () => {
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState<DBSponsor | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [sponsorToDelete, setSponsorToDelete] = useState<DBSponsor | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentYear } = useAcademicYear();

  // Fetch sponsors
  const { data: sponsors, isLoading, isError } = useQuery({
    queryKey: ["sponsors", searchQuery],
    queryFn: async () => {
      let query = supabase.from("sponsors").select("*");

      if (searchQuery) {
        query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data as DBSponsor[];
    },
  });

  // Add sponsor mutation
  const addSponsorMutation = useMutation({
    mutationFn: async (newSponsor: SponsorFormValues) => {
      const { data, error } = await supabase.from("sponsors").insert([newSponsor]);

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors"] });
      toast({
        title: "Success",
        description: "Sponsor added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to add sponsor: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Edit sponsor mutation
  const editSponsorMutation = useMutation({
    mutationFn: async (updatedSponsor: SponsorFormValues & { id: string }) => {
      const { data, error } = await supabase
        .from("sponsors")
        .update(updatedSponsor)
        .eq("id", updatedSponsor.id);

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors"] });
      toast({
        title: "Success",
        description: "Sponsor updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update sponsor: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete sponsor mutation
  const deleteSponsorMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("sponsors").delete().eq("id", id);

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors"] });
      toast({
        title: "Success",
        description: "Sponsor deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete sponsor: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleAddSponsor = () => {
    setSelectedSponsor(null);
    setIsAddEditModalOpen(true);
  };

  const handleEditSponsor = (sponsor: DBSponsor) => {
    setSelectedSponsor(sponsor);
    setIsAddEditModalOpen(true);
  };

  const handleDeleteSponsor = (sponsor: DBSponsor) => {
    setSponsorToDelete(sponsor);
    setIsDeleteAlertOpen(true);
  };

  const confirmDeleteSponsor = () => {
    if (sponsorToDelete) {
      deleteSponsorMutation.mutate(sponsorToDelete.id);
      setIsDeleteAlertOpen(false);
      setSponsorToDelete(null);
    }
  };

  const handleSponsorSaved = () => {
    setIsAddEditModalOpen(false);
  };

  return (
    <Main>
      <div className="flex items-center justify-between space-y-2 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sponsors</h2>
          <p className="text-muted-foreground">Manage sponsors.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Input
            type="search"
            placeholder="Search sponsors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button onClick={handleAddSponsor}>
            <Plus className="mr-2 h-4 w-4" /> Add Sponsor
          </Button>
        </div>
      </div>
      
      <Separator className="my-6" />
      
      <Card>
        <CardHeader>
          <CardTitle>Sponsor List</CardTitle>
          <CardDescription>View, edit, and manage sponsor information.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading sponsors...</p>
          ) : isError ? (
            <p>Error loading sponsors.</p>
          ) : sponsors && sponsors.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Profile</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sponsors.map((sponsor) => (
                    <TableRow key={sponsor.id}>
                      <TableCell className="font-medium">
                        {sponsor.profile_image_url ? (
                          <img
                            src={sponsor.profile_image_url}
                            alt={`${sponsor.first_name} ${sponsor.last_name}`}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                            {sponsor.first_name?.charAt(0)}{sponsor.last_name?.charAt(0)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link to={`/sponsors/${sponsor.id}`} className="hover:underline">
                          {sponsor.first_name} {sponsor.last_name}
                        </Link>
                      </TableCell>
                      <TableCell>{sponsor.email}</TableCell>
                      <TableCell>{sponsor.phone || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSponsor(sponsor)}
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSponsor(sponsor)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={5}>
                      Total {sponsors.length} sponsor(s)
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          ) : (
            <p>No sponsors found.</p>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Sponsor Modal */}
      <AddEditSponsorModal
        open={isAddEditModalOpen}
        onOpenChange={setIsAddEditModalOpen}
        onSave={handleSponsorSaved}
        sponsor={selectedSponsor ? {
          id: selectedSponsor.id,
          first_name: selectedSponsor.first_name,
          last_name: selectedSponsor.last_name,
          email: selectedSponsor.email,
          email2: selectedSponsor.email2,
          phone: selectedSponsor.phone,
          address: selectedSponsor.address,
          country: selectedSponsor.country,
          start_date: selectedSponsor.start_date,
          status: selectedSponsor.status,
          profile_image_url: selectedSponsor.profile_image_url,
          notes: selectedSponsor.notes,
          primary_email_for_updates: selectedSponsor.primary_email_for_updates
        } : undefined}
        addSponsor={(values) => addSponsorMutation.mutate(values)}
        editSponsor={(values) => editSponsorMutation.mutate(values)}
      />

      {/* Delete Sponsor Alert Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Are you sure you want to delete{" "}
              {sponsorToDelete ? `${sponsorToDelete.first_name} ${sponsorToDelete.last_name}` : ''}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteSponsorMutation.isPending}
              onClick={confirmDeleteSponsor}
            >
              {deleteSponsorMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Main>
  );
};

export default Sponsors;
