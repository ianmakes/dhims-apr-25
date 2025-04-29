import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/ui/page-header";
import { supabase } from "@/integrations/supabase/client";
import type { Sponsor } from "@/types";
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { AcademicYearSelector } from "@/components/dashboard/AcademicYearSelector";

const formSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  startDate: z.string().min(1, {
    message: "Start date is required.",
  }),
  status: z.enum(["active", "inactive"]),
  notes: z.string().optional(),
});

export default function Sponsors() {
  const [addSponsorModalOpen, setAddSponsorModalOpen] = useState(false);
  const [editSponsor, setEditSponsor] = useState<Sponsor | null>(null);
  const [deleteSponsorId, setDeleteSponsorId] = useState<string | null>(null);
  const { toast } = useToast();
  const { selectedYear } = useAcademicYear();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      country: "",
      startDate: new Date().toISOString().split('T')[0],
      status: "active",
      notes: "",
    },
  });

  const { data: sponsors = [], isLoading, refetch } = useQuery({
    queryKey: ['sponsors', selectedYear?.id],
    queryFn: async () => {
      let query = supabase
        .from('sponsors')
        .select('*');
      
      // Filter by academic year if one is selected
      if (selectedYear) {
        query = query.gte('start_date', selectedYear.start_date)
                     .lte('start_date', selectedYear.end_date);
      }

      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      return data;
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (editSponsor) {
        // Update existing sponsor
        const { data, error } = await supabase
          .from('sponsors')
          .update({
            ...values,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', editSponsor.id)
          .select();

        if (error) {
          console.error("Error updating sponsor:", error);
          toast({
            title: "Error",
            description: "Failed to update sponsor.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Success",
          description: "Sponsor updated successfully!",
        });
      } else {
        // Create new sponsor
        const { data, error } = await supabase
          .from('sponsors')
          .insert([{
            ...values,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }])
          .select();

        if (error) {
          console.error("Error creating sponsor:", error);
          toast({
            title: "Error",
            description: "Failed to create sponsor.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Success",
          description: "Sponsor created successfully!",
        });
      }

      await refetch();
      setAddSponsorModalOpen(false);
      setEditSponsor(null);
      form.reset();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Failed to submit form.",
        variant: "destructive",
      });
    }
  };

  const confirmDeleteSponsor = (id: string) => {
    setDeleteSponsorId(id);
  };

  const cancelDeleteSponsor = () => {
    setDeleteSponsorId(null);
  };

  const deleteSponsor = async () => {
    if (!deleteSponsorId) return;

    try {
      const { error } = await supabase
        .from('sponsors')
        .delete()
        .eq('id', deleteSponsorId);

      if (error) {
        console.error("Error deleting sponsor:", error);
        toast({
          title: "Error",
          description: "Failed to delete sponsor.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Sponsor deleted successfully!",
      });
      await refetch();
    } catch (error) {
      console.error("Error deleting sponsor:", error);
      toast({
        title: "Error",
        description: "Failed to delete sponsor.",
        variant: "destructive",
      });
    } finally {
      setDeleteSponsorId(null);
    }
  };

  const handleEdit = (sponsor: Sponsor) => {
    setEditSponsor(sponsor);
    form.setValue("firstName", sponsor.firstName);
    form.setValue("lastName", sponsor.lastName);
    form.setValue("email", sponsor.email);
    form.setValue("phone", sponsor.phone || "");
    form.setValue("address", sponsor.address || "");
    form.setValue("country", sponsor.country || "");
    form.setValue("startDate", sponsor.startDate.split('T')[0]);
    form.setValue("status", sponsor.status);
    form.setValue("notes", sponsor.notes || "");
    setAddSponsorModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PP');
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Sponsors" 
        description="Manage sponsor information"
        actions={
          <div className="flex items-center space-x-2">
            <AcademicYearSelector />
            <Button onClick={() => setAddSponsorModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Sponsor
            </Button>
          </div>
        }
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Sponsors</CardTitle>
          <CardDescription>
            View and manage sponsors.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading sponsors...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sponsors.map((sponsor) => (
                  <TableRow key={sponsor.id}>
                    <TableCell>{sponsor.firstName} {sponsor.lastName}</TableCell>
                    <TableCell>{sponsor.email}</TableCell>
                    <TableCell>{sponsor.phone}</TableCell>
                    <TableCell>{formatDate(sponsor.startDate)}</TableCell>
                    <TableCell>{sponsor.status}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(sponsor)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. Are you sure you want to delete {sponsor.firstName} {sponsor.lastName}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={cancelDeleteSponsor}>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => {
                                confirmDeleteSponsor(sponsor.id);
                                deleteSponsor();
                              }}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={addSponsorModalOpen} onOpenChange={setAddSponsorModalOpen}>
        <DialogTrigger asChild>
          <Button>Add Sponsor</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{editSponsor ? "Edit Sponsor" : "Add Sponsor"}</DialogTitle>
            <DialogDescription>
              {editSponsor
                ? "Edit sponsor details."
                : "Create a new sponsor."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="First name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email" {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="Country" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input placeholder="Notes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit">
                  {editSponsor ? "Update Sponsor" : "Add Sponsor"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
