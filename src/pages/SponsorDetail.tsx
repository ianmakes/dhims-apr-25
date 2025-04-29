import { useParams, Link, useNavigate } from "react-router-dom";
import { useSponsorDetails, StudentRemovalForm } from "@/hooks/useSponsorDetails";
import { AddEditSponsorModal } from "@/components/sponsors/AddEditSponsorModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Edit, Mail, MapPin, Phone, Plus, Search, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useSponsors, SponsorFormValues } from "@/hooks/useSponsors";
import { SponsorRelativesSection } from "@/components/sponsors/SponsorRelativesSection";
import { SponsorTimelineTab } from "@/components/sponsors/SponsorTimelineTab";
import { RemoveStudentDialog } from "@/components/sponsors/RemoveStudentDialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isUuid } from "@/utils/slugUtils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
export default function SponsorDetail() {
  const {
    idOrSlug
  } = useParams<{
    idOrSlug: string;
  }>();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [currentStudentToRemove, setCurrentStudentToRemove] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // First, get the actual sponsor ID from slug or ID
  const {
    data: sponsorIdData,
    isLoading: isLoadingSponsorId
  } = useQuery({
    queryKey: ['sponsor-id', idOrSlug],
    queryFn: async () => {
      if (!idOrSlug) throw new Error('Sponsor ID or slug is required');
      if (isUuid(idOrSlug)) {
        // If it's already a UUID, just return it
        return {
          id: idOrSlug
        };
      } else {
        // Otherwise query by slug
        const {
          data,
          error
        } = await supabase.from('sponsors').select('id, slug').eq('slug', idOrSlug).single();
        if (error) {
          console.error("Error fetching sponsor by slug:", error);
          throw error;
        }
        if (!data) {
          throw new Error('Sponsor not found');
        }
        return data;
      }
    },
    enabled: !!idOrSlug
  });
  const sponsorId = sponsorIdData?.id;
  const {
    sponsor,
    availableStudents,
    sponsorRelatives,
    timelineEvents,
    isLoading: isLoadingSponsorDetails,
    isLoadingRelatives,
    isLoadingTimeline,
    assignStudents,
    removeStudent,
    addSponsorRelative,
    updateSponsorRelative,
    deleteSponsorRelative,
    addTimelineEvent
  } = useSponsorDetails(sponsorId || '');
  const {
    updateSponsor
  } = useSponsors();
  const {
    toast
  } = useToast();

  // Effect to update URL with slug if we loaded with ID
  useEffect(() => {
    if (sponsor && isUuid(idOrSlug as string) && sponsor.slug) {
      navigate(`/sponsors/${sponsor.slug}`, {
        replace: true
      });
    }
  }, [sponsor, idOrSlug, navigate]);
  const handleEditSponsor = (data: SponsorFormValues) => {
    if (sponsorId) {
      updateSponsor({
        id: sponsorId,
        ...data
      });
      setIsEditModalOpen(false);
    }
  };
  const isLoading = isLoadingSponsorId || isLoadingSponsorDetails;
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!sponsor) {
    return <div>Sponsor not found</div>;
  }
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return "Invalid Date";
    }
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(dateObj);
  };
  const handleOpenRemoveDialog = (studentId: string, studentName: string) => {
    setCurrentStudentToRemove({
      id: studentId,
      name: studentName
    });
    setIsRemoveDialogOpen(true);
  };
  const handleRemoveStudent = (data: StudentRemovalForm) => {
    removeStudent(data);
    setIsRemoveDialogOpen(false);
    setCurrentStudentToRemove(null);
  };
  const handleAssignStudents = () => {
    if (selectedStudentIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one student to assign",
        variant: "destructive"
      });
      return;
    }
    assignStudents(selectedStudentIds);
    setSelectedStudentIds([]);
  };
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(selectedStudentIds.includes(studentId) ? selectedStudentIds.filter(id => id !== studentId) : [...selectedStudentIds, studentId]);
  };

  // Filter available students based on search query
  const filteredAvailableStudents = availableStudents.filter(student => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return student.name.toLowerCase().includes(query) || student.admission_number.toLowerCase().includes(query) || student.current_grade && student.current_grade.toLowerCase().includes(query);
  });

  // Map database fields to form fields for the modal
  const sponsorForForm: SponsorFormValues = sponsor ? {
    id: sponsor.id,
    firstName: sponsor.first_name,
    lastName: sponsor.last_name,
    email: sponsor.email,
    email2: sponsor.email2 || "",
    phone: sponsor.phone || "",
    address: sponsor.address || "",
    country: sponsor.country || "",
    startDate: sponsor.start_date,
    status: sponsor.status as "active" | "inactive",
    notes: sponsor.notes || "",
    profileImageUrl: sponsor.profile_image_url || "",
    primaryEmailForUpdates: sponsor.primary_email_for_updates || ""
  } : {} as SponsorFormValues;
  return <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link to="/sponsors">
              <Button variant="ghost" size="sm">
                <Users className="mr-2 h-4 w-4" />
                Sponsors
              </Button>
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-3xl font-bold tracking-tight">
              {sponsor.first_name} {sponsor.last_name}
            </h1>
          </div>
          <p className="text-muted-foreground">
            Sponsor ID: {sponsor.id} • Since {formatDate(sponsor.start_date)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Sponsor
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Sponsor profile sidebar */}
        <Card className="lg:col-span-2">
          <CardHeader className="text-center">
            <Avatar className="mx-auto h-24 w-24">
              {sponsor.profile_image_url ? <AvatarImage src={sponsor.profile_image_url} alt={`${sponsor.first_name} ${sponsor.last_name}`} /> : <AvatarFallback className="text-2xl">
                  {sponsor.first_name[0]}{sponsor.last_name[0]}
                </AvatarFallback>}
            </Avatar>
            <CardTitle className="mt-2">
              {sponsor.first_name} {sponsor.last_name}
            </CardTitle>
            <div className="flex justify-center">
              <Badge variant={sponsor.status === "active" ? "default" : "secondary"}>
                {sponsor.status.charAt(0).toUpperCase() + sponsor.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span className="ml-auto">{sponsor.email}</span>
              </div>
              {sponsor.email2 && <div className="flex items-center text-sm">
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Alt Email:</span>
                  <span className="ml-auto">{sponsor.email2}</span>
                </div>}
              {sponsor.phone && <div className="flex items-center text-sm">
                  <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="ml-auto">{sponsor.phone}</span>
                </div>}
              <div className="flex items-center text-sm">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Start Date:</span>
                <span className="ml-auto">{formatDate(sponsor.start_date)}</span>
              </div>
              {sponsor.country && <div className="flex items-center text-sm">
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Country:</span>
                  <span className="ml-auto">{sponsor.country}</span>
                </div>}
            </div>

            {sponsor.address && <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium mb-1">Address</h3>
                  <p className="text-sm">{sponsor.address}</p>
                </div>
              </>}

            <Separator />

            <div>
              <h3 className="text-sm font-medium mb-1">Sponsor Since</h3>
              <p className="text-sm">{formatDate(sponsor.start_date)}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-1">Sponsored Students</h3>
              <p className="text-sm">{sponsor.students?.length || 0} students</p>
            </div>

            <Separator />

            <div className="text-xs text-muted-foreground">
              <p>Created at: {formatDate(sponsor.created_at)}</p>
              {sponsor.updated_at && <p>Last updated: {formatDate(sponsor.updated_at)}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Sponsor details tabs */}
        <div className="lg:col-span-5">
          <Tabs defaultValue="details">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="assign">Assign Students</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6 py-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-left">Sponsor Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="font-medium text-left">Full Name</h3>
                    <p className="text-left">{sponsor.first_name} {sponsor.last_name}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-left">Email</h3>
                    <p className="text-left">{sponsor.email}</p>
                  </div>
                  {sponsor.email2 && <div>
                      <h3 className="font-medium text-left">Secondary Email</h3>
                      <p className="text-left">{sponsor.email2}</p>
                    </div>}
                  {sponsor.phone && <div>
                      <h3 className="font-medium text-left">Phone</h3>
                      <p className="text-left">{sponsor.phone}</p>
                    </div>}
                  <div>
                    <h3 className="font-medium text-left">Status</h3>
                    <p className="capitalize text-left">{sponsor.status}</p>
                  </div>
                  {sponsor.country && <div>
                      <h3 className="font-medium text-left">Country</h3>
                      <p className="text-left">{sponsor.country}</p>
                    </div>}
                  {sponsor.primary_email_for_updates && <div>
                      <h3 className="font-medium text-left">Email for Updates</h3>
                      <p className="text-left">
                        {sponsor.primary_email_for_updates === "both" ? "Both emails" : sponsor.primary_email_for_updates}
                      </p>
                    </div>}
                </CardContent>
              </Card>

              {sponsor.address && <Card>
                  <CardHeader>
                    <CardTitle className="text-left">Address Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-left">{sponsor.address}</p>
                  </CardContent>
                </Card>}

              {sponsor.notes && <Card>
                  <CardHeader>
                    <CardTitle className="text-left">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-left">{sponsor.notes}</p>
                  </CardContent>
                </Card>}

              {/* Sponsor Relatives Section */}
              <SponsorRelativesSection sponsorId={sponsorId!} relatives={sponsorRelatives} isLoading={isLoadingRelatives} onAddRelative={addSponsorRelative} onUpdateRelative={updateSponsorRelative} onDeleteRelative={deleteSponsorRelative} />
            </TabsContent>

            {/* Sponsored Students Tab */}
            <TabsContent value="students" className="py-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-left">Sponsored Students</CardTitle>
                  <CardDescription className="text-left">
                    Students currently sponsored by {sponsor.first_name} {sponsor.last_name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sponsor.students?.length === 0 ? <div className="text-center py-8">
                      <p className="text-muted-foreground">This sponsor is not currently sponsoring any students.</p>
                      <Button variant="outline" className="mt-4" onClick={() => {
                    const assignTab = document.querySelector('[data-value="assign"]') as HTMLElement;
                    if (assignTab) assignTab.click();
                  }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Assign Students
                      </Button>
                    </div> : <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead>Admission #</TableHead>
                          <TableHead>Sponsored Since</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sponsor.students?.map((student: any) => <TableRow key={student.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-8 w-8">
                                  {student.profile_image_url ? <AvatarImage src={student.profile_image_url} alt={student.name} /> : <AvatarFallback>
                                      {student.name[0]}
                                    </AvatarFallback>}
                                </Avatar>
                                <div>
                                  <Link to={`/students/${student.id}`} className="font-medium text-primary hover:underline">
                                    {student.name}
                                  </Link>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{student.current_grade || "—"}</TableCell>
                            <TableCell>{student.admission_number}</TableCell>
                            <TableCell>{formatDate(student.sponsored_since)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button variant="ghost" size="sm" onClick={() => navigate(`/students/${student.id}`)}>
                                  View
                                </Button>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleOpenRemoveDialog(student.id, student.name)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>)}
                      </TableBody>
                    </Table>}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="py-4">
              <SponsorTimelineTab timelineEvents={timelineEvents} isLoading={isLoadingTimeline} onAddTimelineEvent={addTimelineEvent} />
            </TabsContent>

            {/* Assign Students Tab */}
            <TabsContent value="assign" className="py-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-left">Assign Students to Sponsor</CardTitle>
                  <CardDescription className="text-left">
                    Select students to be sponsored by {sponsor.first_name} {sponsor.last_name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {availableStudents?.length === 0 ? <div className="text-center py-8">
                      <p className="text-muted-foreground">There are no unsponsored students available at this time.</p>
                    </div> : <div className="space-y-4">
                      {/* Search input */}
                      <div className="flex items-center space-x-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search students by name, admission number, or grade..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1" />
                      </div>

                      {/* Students table */}
                      <div className="border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">
                                <Checkbox checked={filteredAvailableStudents.length > 0 && filteredAvailableStudents.every(student => selectedStudentIds.includes(student.id))} onCheckedChange={checked => {
                              if (checked) {
                                setSelectedStudentIds(filteredAvailableStudents.map(s => s.id));
                              } else {
                                setSelectedStudentIds([]);
                              }
                            }} aria-label="Select all students" />
                              </TableHead>
                              <TableHead>Student</TableHead>
                              <TableHead>Admission #</TableHead>
                              <TableHead>Grade</TableHead>
                              <TableHead>Gender</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredAvailableStudents.length === 0 ? <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">
                                  No students match your search criteria
                                </TableCell>
                              </TableRow> : filteredAvailableStudents.map(student => <TableRow key={student.id}>
                                  <TableCell>
                                    <Checkbox checked={selectedStudentIds.includes(student.id)} onCheckedChange={() => toggleStudentSelection(student.id)} aria-label={`Select ${student.name}`} />
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center space-x-3">
                                      <Avatar className="h-8 w-8">
                                        {student.profile_image_url ? <AvatarImage src={student.profile_image_url} alt={student.name} /> : <AvatarFallback>
                                            {student.name[0]}
                                          </AvatarFallback>}
                                      </Avatar>
                                      <div className="font-medium">{student.name}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell>{student.admission_number}</TableCell>
                                  <TableCell>{student.current_grade || "—"}</TableCell>
                                  <TableCell>{student.gender}</TableCell>
                                  <TableCell>
                                    <Button variant="ghost" size="sm" onClick={() => navigate(`/students/${student.id}`)}>
                                      View
                                    </Button>
                                  </TableCell>
                                </TableRow>)}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="flex justify-between items-center pt-4">
                        <p className="text-sm text-muted-foreground">
                          {selectedStudentIds.length} students selected
                        </p>
                        <Button onClick={handleAssignStudents} disabled={selectedStudentIds.length === 0}>
                          Assign Selected Students
                        </Button>
                      </div>
                    </div>}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Sponsor Modal */}
      <AddEditSponsorModal open={isEditModalOpen} onOpenChange={setIsEditModalOpen} sponsor={sponsorForForm} onSubmit={handleEditSponsor} />

      {/* Remove Student Dialog */}
      {currentStudentToRemove && <RemoveStudentDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen} onConfirm={handleRemoveStudent} studentId={currentStudentToRemove.id} studentName={currentStudentToRemove.name} />}
    </div>;
}