import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Sponsor } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AddEditSponsorModal } from "@/components/sponsors/AddEditSponsorModal";

const Sponsors = () => {
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [sponsorToDelete, setSponsorToDelete] = useState<Sponsor | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch sponsors
  const { data: sponsors, isLoading, isError } = useQuery({
    queryKey: ["sponsors", searchQuery],
    queryFn: async () => {
      let query = supabase.from("sponsors").select("*");

      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data as Sponsor[];
    },
  });

  // Add sponsor mutation
  const addSponsorMutation = useMutation({
    mutationFn: async (newSponsor: Omit<Sponsor, "id">) => {
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
    mutationFn: async (updatedSponsor: Sponsor) => {
      const { data, error } = await supabase
        .from("sponsors")
        .update([updatedSponsor])
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

  const handleEditSponsor = (sponsor: Sponsor) => {
    setSelectedSponsor(sponsor);
    setIsAddEditModalOpen(true);
  };

  const handleDeleteSponsor = (sponsor: Sponsor) => {
    setSponsorToDelete(sponsor);
    setIsDeleteAlertOpen(true);
  };

  const confirmDeleteSponsor = () => {
    if (sponsorToDelete) {
      deleteSponsorMutation.mutate(sponsorToDelete.id, {
        onSuccess: () => {
          setIsDeleteAlertOpen(false);
          setSponsorToDelete(null);
        },
      });
    }
  };

  const handleSponsorSaved = () => {
    setIsAddEditModalOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between space-y-2 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sponsors</h2>
          <p className="text-muted-foreground">Manage the sponsors.</p>
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
      <div className="py-4">
        <div className="container mx-auto">
          {isLoading ? (
            <p>Loading sponsors...</p>
          ) : isError ? (
            <p>Error loading sponsors.</p>
          ) : sponsors && sponsors.length > 0 ? (
            <Table>
              <TableCaption>A list of sponsors.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Logo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Email</TableHead>
                  <TableHead>Contact Phone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sponsors.map((sponsor) => (
                  <TableRow key={sponsor.id}>
                    <TableCell className="font-medium">
                      {sponsor.logo ? (
                        <img
                          src={sponsor.logo}
                          alt={sponsor.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        "No Logo"
                      )}
                    </TableCell>
                    <TableCell>
                      <Link to={`/sponsors/${sponsor.id}`}>{sponsor.name}</Link>
                    </TableCell>
                    <TableCell>{sponsor.contact_email}</TableCell>
                    <TableCell>{sponsor.contact_phone}</TableCell>
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
          ) : (
            <p>No sponsors found.</p>
          )}
        </div>
      </div>

      {/* Add / Edit Sponsor Modal */}
      <AddEditSponsorModal
        open={isAddEditModalOpen}
        onOpenChange={setIsAddEditModalOpen}
        onSave={handleSponsorSaved}
        sponsor={selectedSponsor}
        addSponsor={addSponsorMutation.mutate}
        editSponsor={editSponsorMutation.mutate}
      />

      {/* Delete Sponsor Alert Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Are you sure you want to delete{" "}
              {sponsorToDelete?.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteSponsorMutation.isLoading}
              onClick={confirmDeleteSponsor}
            >
              {deleteSponsorMutation.isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Sponsors;
