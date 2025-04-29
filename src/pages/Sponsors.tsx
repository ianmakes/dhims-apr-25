
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Download, Filter, Search, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AddEditSponsorModal } from "@/components/sponsors/AddEditSponsorModal";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAcademicYear } from "@/contexts/AcademicYearContext";

export default function Sponsors() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [selectedSponsors, setSelectedSponsors] = useState<string[]>([]);
  const { currentYear } = useAcademicYear();
  
  // Fetch sponsors
  const { data: sponsors = [], isLoading, refetch } = useQuery({
    queryKey: ["sponsors", currentYear?.id],
    queryFn: async () => {
      try {
        let query = supabase
          .from("sponsors")
          .select(`
            id, 
            first_name,
            last_name,
            email,
            phone,
            country,
            start_date,
            status,
            address,
            profile_image_url,
            created_at,
            updated_at
          `)
          .order("last_name", { ascending: true });
          
        // If we have a current year, filter sponsors who were active during this year
        if (currentYear) {
          query = query
            .lte('start_date', currentYear.end_date)
            .eq('status', 'active');
        }
          
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        return data || [];
      } catch (error: any) {
        console.error("Error fetching sponsors:", error);
        toast({
          title: "Error",
          description: `Failed to load sponsors: ${error.message}`,
          variant: "destructive"
        });
        return [];
      }
    },
  });
  
  // Fetch sponsored students to calculate how many students each sponsor has
  const { data: sponsoredStudents = [] } = useQuery({
    queryKey: ["sponsored-students", currentYear?.id],
    queryFn: async () => {
      try {
        let query = supabase
          .from("students")
          .select(`id, sponsor_id`);
          
        // If we have a current year, filter by academic year
        if (currentYear) {
          query = query.eq('current_academic_year', parseInt(currentYear.year_name));
        }
          
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        return data || [];
      } catch (error) {
        console.error("Error fetching sponsored students:", error);
        return [];
      }
    },
  });
  
  // Create a map of sponsor ID to student count
  const sponsorStudentCounts = sponsoredStudents.reduce((acc, student) => {
    if (student.sponsor_id) {
      acc[student.sponsor_id] = (acc[student.sponsor_id] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  // Filter sponsors by search term
  const filteredSponsors = searchTerm
    ? sponsors.filter((sponsor) => {
        const searchRegex = new RegExp(searchTerm, "i");
        return (
          searchRegex.test(`${sponsor.first_name} ${sponsor.last_name}`) ||
          (sponsor.email && searchRegex.test(sponsor.email)) ||
          (sponsor.country && searchRegex.test(sponsor.country))
        );
      })
    : sponsors;
  
  const handleAddSponsor = () => {
    setIsModalOpen(true);
  };
  
  const handleSponsorSaved = () => {
    refetch();
    setIsModalOpen(false);
    toast({
      title: "Success",
      description: "Sponsor has been saved successfully.",
    });
  };
  
  const handleSendEmail = () => {
    toast({
      title: "Email Feature",
      description: `Preparing to send emails to ${selectedSponsors.length} sponsors.`,
    });
    setIsEmailDialogOpen(false);
    setSelectedSponsors([]);
  };
  
  const toggleSponsorSelection = (sponsorId: string) => {
    if (selectedSponsors.includes(sponsorId)) {
      setSelectedSponsors(selectedSponsors.filter(id => id !== sponsorId));
    } else {
      setSelectedSponsors([...selectedSponsors, sponsorId]);
    }
  };
  
  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  // Year label for the page title
  const yearLabel = currentYear ? ` - ${currentYear.year_name}` : "";

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Sponsors${yearLabel}`}
        description="Manage and view all sponsors in the system"
        actions={
          <Button onClick={handleAddSponsor}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Sponsor
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search sponsors..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            className="flex-1 sm:flex-none"
            onClick={() => {
              if (selectedSponsors.length > 0) {
                setIsEmailDialogOpen(true);
              } else {
                toast({
                  title: "No sponsors selected",
                  description: "Please select sponsors to email.",
                });
              }
            }}
            disabled={selectedSponsors.length === 0}
          >
            <Mail className="mr-2 h-4 w-4" />
            Email Selected
          </Button>
          <Button variant="outline" className="flex-1 sm:flex-none">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" className="flex-1 sm:flex-none">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        {isLoading ? (
          // Loading skeleton
          <>
            <div className="p-4">
              <Skeleton className="h-8 w-full" />
            </div>
            {[...Array(5)].map((_, index) => (
              <div key={index} className="p-4 border-t">
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </>
        ) : filteredSponsors.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={selectedSponsors.length === filteredSponsors.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSponsors(filteredSponsors.map(s => s.id));
                      } else {
                        setSelectedSponsors([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="min-w-[200px]">Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Since</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Students</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSponsors.map((sponsor) => (
                <TableRow key={sponsor.id}>
                  <TableCell>
                    <Input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={selectedSponsors.includes(sponsor.id)}
                      onChange={() => toggleSponsorSelection(sponsor.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-muted mr-2 overflow-hidden">
                        {sponsor.profile_image_url ? (
                          <img
                            src={sponsor.profile_image_url}
                            alt={`${sponsor.first_name} ${sponsor.last_name}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-medium">
                            {`${sponsor.first_name?.charAt(0) || ''}${sponsor.last_name?.charAt(0) || ''}`}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{`${sponsor.first_name} ${sponsor.last_name}`}</div>
                        <div className="text-xs text-muted-foreground">
                          {sponsor.phone || "No phone"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{sponsor.email || "-"}</TableCell>
                  <TableCell>{sponsor.country || "-"}</TableCell>
                  <TableCell>
                    {sponsor.start_date 
                      ? format(new Date(sponsor.start_date), 'MMM yyyy') 
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getStatusColor(sponsor.status)}
                    >
                      {sponsor.status || "Unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge>
                      {sponsorStudentCounts[sponsor.id] || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/sponsors/${sponsor.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="mb-2">No sponsors found</p>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm 
                ? "Try adjusting your search term" 
                : currentYear
                  ? `No active sponsors found for the ${currentYear.year_name} academic year`
                  : "Get started by adding your first sponsor"}
            </p>
            <Button onClick={handleAddSponsor} variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Sponsor
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Sponsor Modal */}
      <AddEditSponsorModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSponsorSaved}
      />

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Selected Sponsors</DialogTitle>
            <DialogDescription>
              You are about to send an email to {selectedSponsors.length} selected sponsors. 
              This feature is under development.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Subject"
              className="mb-4"
            />
            <textarea
              className="w-full min-h-[100px] p-2 border rounded-md"
              placeholder="Message content..."
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEmailDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSendEmail}>
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
