
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSponsorDetails } from "@/hooks/useSponsorDetails";
import { AddEditSponsorModal, SponsorFormValues } from "@/components/sponsors/AddEditSponsorModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Edit, Mail, MapPin, Phone, Plus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useSponsors } from "@/hooks/useSponsors";

export default function SponsorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { sponsor, availableStudents, isLoading, assignStudents, removeStudent } = useSponsorDetails(id!);
  const { updateSponsor } = useSponsors();
  const { toast } = useToast();

  const handleEditSponsor = (data: SponsorFormValues) => {
    if (id) {
      updateSponsor({ id, ...data });
      setIsEditModalOpen(false);
    }
  };

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

  const handleRemoveStudent = (studentId: string) => {
    removeStudent(studentId);
  };

  const handleAssignStudents = (studentIds: string[]) => {
    assignStudents(studentIds);
  };

  const toggleStudentSelection = (studentId: string, selectedStudentIds: string[], setSelectedStudentIds: (ids: string[]) => void) => {
    setSelectedStudentIds(
      selectedStudentIds.includes(studentId)
        ? selectedStudentIds.filter(id => id !== studentId)
        : [...selectedStudentIds, studentId]
    );
  };

  const navigateToAssignTab = () => {
    // Safely navigate to the assign tab
    const assignTab = document.querySelector('[data-value="assign"]') as HTMLElement | null;
    if (assignTab && 'click' in assignTab) {
      assignTab.click();
    }
  };

  // Map database fields to form fields
  const sponsorForForm = {
    firstName: sponsor.first_name,
    lastName: sponsor.last_name,
    email: sponsor.email,
    email2: sponsor.email2 || "",
    phone: sponsor.phone || "",
    address: sponsor.address || "",
    country: sponsor.country || "",
    startDate: sponsor.start_date,
    status: sponsor.status,
    notes: sponsor.notes || ""
  };

  return (
    <div className="space-y-6 fade-in">
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
              <AvatarFallback className="text-2xl">
                {sponsor.first_name[0]}{sponsor.last_name[0]}
              </AvatarFallback>
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
              {sponsor.email2 && (
                <div className="flex items-center text-sm">
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Alt Email:</span>
                  <span className="ml-auto">{sponsor.email2}</span>
                </div>
              )}
              {sponsor.phone && (
                <div className="flex items-center text-sm">
                  <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="ml-auto">{sponsor.phone}</span>
                </div>
              )}
              <div className="flex items-center text-sm">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Start Date:</span>
                <span className="ml-auto">{formatDate(sponsor.start_date)}</span>
              </div>
              {sponsor.country && (
                <div className="flex items-center text-sm">
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Country:</span>
                  <span className="ml-auto">{sponsor.country}</span>
                </div>
              )}
            </div>

            {sponsor.address && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium mb-1">Address</h3>
                  <p className="text-sm">{sponsor.address}</p>
                </div>
              </>
            )}

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
              {sponsor.updated_at && (
                <p>Last updated: {formatDate(sponsor.updated_at)}</p>
              )}
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
                  <CardTitle>Sponsor Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="font-medium">Full Name</h3>
                    <p>{sponsor.first_name} {sponsor.last_name}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Email</h3>
                    <p>{sponsor.email}</p>
                  </div>
                  {sponsor.email2 && (
                    <div>
                      <h3 className="font-medium">Secondary Email</h3>
                      <p>{sponsor.email2}</p>
                    </div>
                  )}
                  {sponsor.phone && (
                    <div>
                      <h3 className="font-medium">Phone</h3>
                      <p>{sponsor.phone}</p>
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium">Status</h3>
                    <p className="capitalize">{sponsor.status}</p>
                  </div>
                  {sponsor.country && (
                    <div>
                      <h3 className="font-medium">Country</h3>
                      <p>{sponsor.country}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {sponsor.address && (
                <Card>
                  <CardHeader>
                    <CardTitle>Address Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{sponsor.address}</p>
                  </CardContent>
                </Card>
              )}

              {sponsor.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{sponsor.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Sponsored Students Tab */}
            <TabsContent value="students" className="py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sponsored Students</CardTitle>
                  <CardDescription>
                    Students currently sponsored by {sponsor.first_name} {sponsor.last_name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sponsor.students?.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">This sponsor is not currently sponsoring any students.</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={navigateToAssignTab}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Assign Students
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sponsor.students?.map((student: any) => (
                        <div key={student.id} className="flex justify-between items-center p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {student.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <Link to={`/students/${student.id}`} className="font-medium text-primary hover:underline">
                                {student.name}
                              </Link>
                              <div className="text-sm text-muted-foreground">
                                {student.current_grade && `Grade ${student.current_grade} • `}
                                Sponsored since {formatDate(student.sponsored_since)}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/students/${student.id}`)}
                            >
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => handleRemoveStudent(student.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sponsor Timeline</CardTitle>
                  <CardDescription>
                    A history of {sponsor.first_name}'s interactions and activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative border-l border-border pl-6 ml-4">
                    {/* Timeline events will be implemented in the future */}
                  </div>
                  <div className="mt-6 flex justify-center">
                    <Button>
                      Add Timeline Event
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assign Students Tab */}
            <TabsContent value="assign" className="py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Assign Students to Sponsor</CardTitle>
                  <CardDescription>
                    Select students to be sponsored by {sponsor.first_name} {sponsor.last_name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {availableStudents?.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">There are no unsponsored students available at this time.</p>
                    </div>
                  ) : (
                    <>
                      <StudentList
                        students={availableStudents}
                        sponsor={sponsor}
                        onAssignStudents={handleAssignStudents}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Sponsor Modal */}
      <AddEditSponsorModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        sponsor={sponsorForForm}
        onSubmit={handleEditSponsor}
      />
    </div>
  );

  function StudentList({ students, sponsor, onAssignStudents }: { students: any[], sponsor: any, onAssignStudents: (studentIds: string[]) => void }) {
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

    return (
      <>
        <div className="space-y-4 mb-6">
          {students.map((student: any) => (
            <div
              key={student.id}
              className={`flex justify-between items-center p-4 border rounded-lg cursor-pointer
                              ${selectedStudentIds.includes(student.id) ? 'bg-primary/10 border-primary' : ''}`}
              onClick={() => toggleStudentSelection(student.id, selectedStudentIds, setSelectedStudentIds)}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedStudentIds.includes(student.id)}
                  onChange={() => toggleStudentSelection(student.id, selectedStudentIds, setSelectedStudentIds)}
                  className="h-4 w-4"
                  onClick={(e) => e.stopPropagation()}
                />
                <Avatar>
                  <AvatarFallback>
                    {student.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {student.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {student.current_grade && `Grade ${student.current_grade} • `}
                    {student.gender && (student.gender.charAt(0).toUpperCase() + student.gender.slice(1))}
                  </div>
                </div>
              </div>
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/students/${student.id}`);
                  }}
                >
                  View Profile
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {selectedStudentIds.length} students selected
          </p>
          <Button
            onClick={() => onAssignStudents(selectedStudentIds)}
            disabled={selectedStudentIds.length === 0}
          >
            Assign Selected Students
          </Button>
        </div>
      </>
    );
  }
}
