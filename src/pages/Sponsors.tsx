import { useState } from "react";
import { Link } from "react-router-dom";
import { DataTable } from "@/components/data-display/DataTable";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Eye, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { AddEditSponsorModal } from "@/components/sponsors/AddEditSponsorModal";
import { useToast } from "@/hooks/use-toast";
import { useSponsors, SponsorFormValues } from "@/hooks/useSponsors";

export default function Sponsors() {
  const { sponsors, isLoading, addSponsor, updateSponsor, deleteSponsor } = useSponsors();
  const [status, setStatus] = useState<string>("all");
  const [country, setCountry] = useState<string>("all");
  const [isAddSponsorModalOpen, setIsAddSponsorModalOpen] = useState(false);
  const [isEditSponsorModalOpen, setIsEditSponsorModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState<SponsorFormValues | null>(null);
  const { toast } = useToast();

  // Filter sponsors based on filters
  const filteredSponsors = sponsors.filter((sponsor: any) => {
    if (status && status !== "all" && sponsor.status !== status) return false;
    if (country && country !== "all" && sponsor.country !== country) return false;
    return true;
  });

  // Get unique countries for filter dropdown
  const uniqueCountries = Array.from(new Set(sponsors.map((sponsor: any) => sponsor.country).filter(Boolean)));

  const handleAddSponsor = (data: SponsorFormValues) => {
    addSponsor(data);
    setIsAddSponsorModalOpen(false);
  };

  const handleEditSponsor = (data: SponsorFormValues) => {
    if (selectedSponsor && selectedSponsor.id) {
      updateSponsor({ id: selectedSponsor.id, ...data });
      setIsEditSponsorModalOpen(false);
    }
  };

  const handleDeleteSponsor = () => {
    if (selectedSponsor) {
      deleteSponsor(selectedSponsor.id);
      setIsDeleteAlertOpen(false);
    }
  };

  const handleOpenEditModal = (sponsor: any) => {
    // Map database fields to form fields
    setSelectedSponsor({
      id: sponsor.id,
      firstName: sponsor.first_name,
      lastName: sponsor.last_name,
      email: sponsor.email,
      email2: sponsor.email2 || "",
      phone: sponsor.phone || "",
      address: sponsor.address || "",
      country: sponsor.country || "",
      startDate: sponsor.start_date,
      status: sponsor.status,
      notes: sponsor.notes || "",
      profileImageUrl: sponsor.profile_image_url || "",
      primaryEmailForUpdates: sponsor.primary_email_for_updates || ""
    });
    setIsEditSponsorModalOpen(true);
  };

  const handleOpenDeleteAlert = (sponsor: any) => {
    setSelectedSponsor(sponsor);
    setIsDeleteAlertOpen(true);
  };

  // Updated columns without the ID column
  const columnsWithActions = [
    {
      accessorKey: "first_name",
      header: "First Name",
      cell: ({ row }: any) => {
        return (
          <Link to={`/sponsors/${row.original.id}`} className="text-primary hover:underline">
            {row.getValue("first_name")}
          </Link>
        );
      },
    },
    {
      accessorKey: "last_name",
      header: "Last Name",
      cell: ({ row }: any) => {
        return (
          <Link to={`/sponsors/${row.original.id}`} className="text-primary hover:underline">
            {row.getValue("last_name")}
          </Link>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "country",
      header: "Country",
      cell: ({ row }: any) => {
        const country = row.getValue("country");
        return <div>{country || "—"}</div>;
      },
    },
    {
      accessorKey: "start_date",
      header: "Start Date",
      cell: ({ row }: any) => {
        return (
          <div>
            {new Date(row.getValue("start_date")).toLocaleDateString()}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
        const status = row.getValue("status");
        return (
          <div className="capitalize">
            {status === "active" ? (
              <div className="inline-flex items-center justify-center rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-700">
                <span>Active</span>
              </div>
            ) : (
              <div className="inline-flex items-center justify-center rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-700">
                <span>Inactive</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }: any) => {
        const sponsor = row.original;
        
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(sponsor.id)}
                >
                  Copy sponsor ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link
                    to={`/sponsors/${sponsor.id}`}
                    className="flex items-center"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    <span>View</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOpenEditModal(sponsor)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => handleOpenDeleteAlert(sponsor)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sponsors</h1>
          <p className="text-muted-foreground">
            Manage and track sponsors in the system
          </p>
        </div>
        <Button onClick={() => setIsAddSponsorModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Sponsor
        </Button>
      </div>

      {/* Filter section */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="status" className="text-sm font-medium">
            Status:
          </label>
          <Select
            value={status}
            onValueChange={setStatus}
          >
            <SelectTrigger id="status" className="w-32">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="country" className="text-sm font-medium">
            Country:
          </label>
          <Select
            value={country}
            onValueChange={setCountry}
          >
            <SelectTrigger id="country" className="w-40">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {uniqueCountries.map((country) => (
                <SelectItem key={country} value={country || ""}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sponsors table */}
      <DataTable
        columns={columnsWithActions}
        data={filteredSponsors}
        searchColumn="first_name"
        searchPlaceholder="Search sponsors..."
        isLoading={isLoading}
      />

      {/* Add Sponsor Modal */}
      <AddEditSponsorModal
        open={isAddSponsorModalOpen}
        onOpenChange={setIsAddSponsorModalOpen}
        onSubmit={handleAddSponsor}
      />

      {/* Edit Sponsor Modal */}
      {selectedSponsor && (
        <AddEditSponsorModal
          open={isEditSponsorModalOpen}
          onOpenChange={setIsEditSponsorModalOpen}
          sponsor={selectedSponsor}
          onSubmit={handleEditSponsor}
        />
      )}

      {/* Delete Sponsor Alert */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the sponsor record
              and remove their data from the system. Any students sponsored by this sponsor
              will become unsponsored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSponsor} 
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
