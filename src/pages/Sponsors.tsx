import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Pencil, Trash2, Plus, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AddEditSponsorModal } from '@/components/sponsors/AddEditSponsorModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Main } from '@/components/ui/main';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { AcademicYearLabel } from '@/components/common/AcademicYearLabel';

type Sponsor = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  country: string;
  start_date: string;
  status: string;
};

export default function Sponsors() {
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [sponsorToEdit, setSponsorToEdit] = useState<string | null>(null);
  const [sponsorToDelete, setSponsorToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedAcademicYear } = useAcademicYear();

  // Fetch sponsors
  const { data: sponsors, isLoading } = useQuery({
    queryKey: ['sponsors', selectedAcademicYear?.id],
    queryFn: async () => {
      let query = supabase
        .from('sponsors')
        .select('*');
      
      // Filter by academic year if one is selected
      if (selectedAcademicYear) {
        // For sponsors, we consider those who started before the end of the academic year
        // and either have no end date or ended after the start of the academic year
        query = query
          .lte('start_date', selectedAcademicYear.end_date)
          .or(`end_date.is.null,end_date.gt.${selectedAcademicYear.start_date}`);
      }
      
      const { data, error } = await query.order('last_name');
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as Sponsor[];
    },
  });

  // Delete sponsor mutation
  const deleteSponsorMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sponsors')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['sponsors']
      });
      toast({
        title: "Success",
        description: "Sponsor deleted successfully."
      });
      setSponsorToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      setSponsorToDelete(null);
    }
  });

  // Filter sponsors based on search term
  const filteredSponsors = sponsors?.filter(sponsor => {
    if (!searchTerm) return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    const fullName = `${sponsor.first_name} ${sponsor.last_name}`.toLowerCase();
    
    return (
      fullName.includes(searchTermLower) ||
      sponsor.email.toLowerCase().includes(searchTermLower) ||
      (sponsor.country && sponsor.country.toLowerCase().includes(searchTermLower))
    );
  });

  return (
    <Main>
      <div className="md:flex md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight flex items-center">
            Sponsors
            <AcademicYearLabel />
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage sponsor records and sponsorship information
          </p>
        </div>
        <Button onClick={() => setIsAddEditModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Sponsor
        </Button>
      </div>
      
      <Separator className="my-6" />
      
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search sponsors..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sponsor List</CardTitle>
          <CardDescription>
            View and manage all sponsors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[300px]" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Since</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSponsors?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No sponsors found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSponsors?.map((sponsor) => (
                      <TableRow key={sponsor.id}>
                        <TableCell className="font-medium">{sponsor.first_name} {sponsor.last_name}</TableCell>
                        <TableCell>{sponsor.email}</TableCell>
                        <TableCell>{sponsor.country || "—"}</TableCell>
                        <TableCell>{new Date(sponsor.start_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            sponsor.status === 'active' ? 'bg-green-100 text-green-800' :
                            sponsor.status === 'inactive' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {sponsor.status || 'Unknown'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/sponsors/${sponsor.id}`}>
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSponsorToEdit(sponsor.id);
                                setIsAddEditModalOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSponsorToDelete(sponsor.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddEditSponsorModal
        open={isAddEditModalOpen}
        onOpenChange={setIsAddEditModalOpen}
        sponsor={sponsorToEdit ? { 
          id: sponsorToEdit,
          firstName: "", 
          lastName: "", 
          email: "", 
          startDate: "", 
          status: "active" as "active" | "inactive" 
        } : undefined}
        onSubmit={() => {
          queryClient.invalidateQueries({
            queryKey: ['sponsors']
          });
          setSponsorToEdit(null);
        }}
      />

      <AlertDialog
        open={sponsorToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setSponsorToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this sponsor?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the sponsor record
              and may affect sponsored students.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (sponsorToDelete) {
                deleteSponsorMutation.mutate(sponsorToDelete);
              }
            }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Main>
  );
}
