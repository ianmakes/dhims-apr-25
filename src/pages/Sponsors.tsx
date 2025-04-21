
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
import { AddEditSponsorModal, SponsorFormValues } from "@/components/sponsors/AddEditSponsorModal";
import { useToast } from "@/hooks/use-toast";
import { Sponsor } from "@/types";

// Sample data for sponsors
const sponsors = [
  {
    id: "1",
    firstName: "Michael",
    lastName: "Johnson",
    email: "michael.johnson@example.com",
    email2: "",
    phone: "+1 555-123-4567",
    address: "123 Donor St, Portland, OR 97201",
    country: "United States",
    startDate: new Date(2022, 1, 10),
    status: "active",
    students: ["1", "4"],
    notes: "Long-time supporter",
    createdAt: new Date(2022, 1, 10),
    updatedAt: new Date(2022, 1, 10),
    createdBy: "admin",
  },
  {
    id: "2",
    firstName: "Sarah",
    lastName: "Williams",
    email: "sarah.williams@example.com",
    email2: "sarah.w@personal.com",
    phone: "+1 555-234-5678",
    address: "456 Charity Ave, Seattle, WA 98101",
    country: "United States",
    startDate: new Date(2022, 3, 15),
    status: "active",
    students: ["2"],
    notes: "Monthly donor",
    createdAt: new Date(2022, 3, 15),
    updatedAt: new Date(2022, 3, 15),
    createdBy: "admin",
  },
  {
    id: "3",
    firstName: "Robert",
    lastName: "Brown",
    email: "robert.brown@example.com",
    email2: "",
    phone: "+44 20 7946 0958",
    address: "789 Giving Lane, London, SW1A 1AA",
    country: "United Kingdom",
    startDate: new Date(2022, 5, 20),
    status: "active",
    students: ["3"],
    notes: "",
    createdAt: new Date(2022, 5, 20),
    updatedAt: new Date(2022, 5, 20),
    createdBy: "admin",
  },
  {
    id: "4",
    firstName: "Jennifer",
    lastName: "Smith",
    email: "jennifer.smith@example.com",
    email2: "",
    phone: "+1 555-345-6789",
    address: "1010 Support Rd, New York, NY 10001",
    country: "United States",
    startDate: new Date(2022, 7, 5),
    status: "inactive",
    students: [],
    notes: "Previous annual donor",
    createdAt: new Date(2022, 7, 5),
    updatedAt: new Date(2022, 7, 5),
    createdBy: "admin",
  },
  {
    id: "5",
    firstName: "David",
    lastName: "Lee",
    email: "david.lee@example.com",
    email2: "d.lee@work.com",
    phone: "+61 2 8765 4321",
    address: "222 Helper St, Sydney, NSW 2000",
    country: "Australia",
    startDate: new Date(2022, 9, 15),
    status: "active",
    students: ["5", "7"],
    notes: "Corporate sponsor",
    createdAt: new Date(2022, 9, 15),
    updatedAt: new Date(2022, 9, 15),
    createdBy: "admin",
  },
];

// Define columns for DataTable
const columns = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "firstName",
    header: "First Name",
    cell: ({ row }) => {
      return (
        <Link to={`/sponsors/${row.original.id}`} className="text-primary hover:underline">
          {row.getValue("firstName")}
        </Link>
      );
    },
  },
  {
    accessorKey: "lastName",
    header: "Last Name",
    cell: ({ row }) => {
      return (
        <Link to={`/sponsors/${row.original.id}`} className="text-primary hover:underline">
          {row.getValue("lastName")}
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
    cell: ({ row }) => {
      const country = row.getValue("country");
      return <div>{country || "—"}</div>;
    },
  },
  {
    accessorKey: "startDate",
    header: "Start Date",
    cell: ({ row }) => {
      return (
        <div>
          {new Date(row.getValue("startDate")).toLocaleDateString()}
        </div>
      );
    },
  },
  {
    accessorKey: "students",
    header: "Students",
    cell: ({ row }) => {
      const studentIds = row.getValue("students") as string[];
      return (
        <div>
          {studentIds.length > 0 ? (
            <div className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary">
              <span>{studentIds.length}</span>
            </div>
          ) : (
            <div className="inline-flex items-center justify-center rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium text-muted-foreground">
              <span>None</span>
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
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
    cell: ({ row }) => {
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
              <DropdownMenuItem onClick={() => {}}>
                <Pencil className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => {}}
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

export default function Sponsors() {
  const [status, setStatus] = useState<string>("all");
  const [country, setCountry] = useState<string>("all");
  const [isAddSponsorModalOpen, setIsAddSponsorModalOpen] = useState(false);
  const [isEditSponsorModalOpen, setIsEditSponsorModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const { toast } = useToast();

  // Filter sponsors based on filters
  const filteredSponsors = sponsors.filter((sponsor) => {
    if (status && status !== "all" && sponsor.status !== status) return false;
    if (country && country !== "all" && sponsor.country !== country) return false;
    return true;
  });

  // Get unique countries for filter dropdown
  const uniqueCountries = Array.from(new Set(sponsors.map(sponsor => sponsor.country).filter(Boolean)));

  const handleAddSponsor = (data: SponsorFormValues) => {
    // In a real app, this would be an API call
    console.log("Adding sponsor:", data);
    toast({
      title: "Sponsor added",
      description: `${data.firstName} ${data.lastName} has been added successfully.`,
    });
    setIsAddSponsorModalOpen(false);
  };

  const handleEditSponsor = (data: SponsorFormValues) => {
    // In a real app, this would be an API call
    console.log("Editing sponsor:", selectedSponsor?.id, data);
    toast({
      title: "Sponsor updated",
      description: `${data.firstName} ${data.lastName} has been updated successfully.`,
    });
    setIsEditSponsorModalOpen(false);
  };

  const handleDeleteSponsor = () => {
    // In a real app, this would be an API call
    console.log("Deleting sponsor:", selectedSponsor?.id);
    toast({
      title: "Sponsor deleted",
      description: `Sponsor has been deleted successfully.`,
    });
    setIsDeleteAlertOpen(false);
  };

  const handleOpenEditModal = (sponsor: Sponsor) => {
    setSelectedSponsor(sponsor);
    setIsEditSponsorModalOpen(true);
  };

  const handleOpenDeleteAlert = (sponsor: Sponsor) => {
    setSelectedSponsor(sponsor);
    setIsDeleteAlertOpen(true);
  };

  // Updated columns with edit/delete actions
  const columnsWithActions = [
    ...columns.slice(0, -1), // Take all columns except the last one (actions)
    {
      id: "actions",
      cell: ({ row }) => {
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
        searchColumn="firstName"
        searchPlaceholder="Search sponsors..."
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
