import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Edit, Mail, MapPin, Phone, Plus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Student } from "@/types";

// Mock sponsor data with student sponsorships
const sponsorData = {
  id: "1",
  firstName: "Michael",
  lastName: "Johnson",
  email: "michael.johnson@example.com",
  email2: "michael.personal@gmail.com",
  phone: "+1 555-123-4567",
  address: "123 Donor St, Portland, OR 97201",
  country: "United States",
  startDate: new Date(2022, 1, 10),
  status: "active",
  notes: "Long-time supporter who joined after hearing about our mission at a charity event.",
  profileImage: "",
  students: [
    {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      grade: "4",
      gender: "male",
      enrollmentDate: new Date(2022, 0, 15),
      status: "active",
      sponsorshipDate: new Date(2022, 1, 15),
    },
    {
      id: "4",
      firstName: "Emily",
      lastName: "Williams",
      grade: "5",
      gender: "female",
      enrollmentDate: new Date(2022, 3, 5),
      status: "active",
      sponsorshipDate: new Date(2022, 3, 20),
    }
  ],
  timeline: [
    { id: "1", date: new Date(2022, 1, 10), title: "Sponsor Joined", description: "Michael Johnson became a sponsor", type: "join" },
    { id: "2", date: new Date(2022, 1, 15), title: "Sponsored First Student", description: "Sponsored John Doe", type: "sponsorship" },
    { id: "3", date: new Date(2022, 3, 20), title: "Sponsored Another Student", description: "Sponsored Emily Williams", type: "sponsorship" },
    { id: "4", date: new Date(2022, 6, 10), title: "Donation Made", description: "Made a special donation for school supplies", type: "donation" },
    { id: "5", date: new Date(2022, 11, 22), title: "Holiday Letter", description: "Sent holiday greeting cards to sponsored students", type: "communication" },
  ],
  createdAt: new Date(2022, 1, 10),
  updatedAt: new Date(2022, 6, 15),
  createdBy: "admin",
  lastModifiedBy: "manager",
};

// Mock available students for assignment
const availableStudents = [
  {
    id: "2",
    firstName: "Jane",
    lastName: "Smith",
    grade: "6",
    gender: "female",
    enrollmentDate: new Date(2022, 1, 20),
    status: "active",
  },
  {
    id: "3",
    firstName: "Michael",
    lastName: "Johnson",
    grade: "3",
    gender: "male",
    enrollmentDate: new Date(2022, 2, 10),
    status: "active",
  },
  {
    id: "5",
    firstName: "David",
    lastName: "Brown",
    grade: "7",
    gender: "male",
    enrollmentDate: new Date(2022, 4, 12),
    status: "active",
  },
];

export default function SponsorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  
  // In a real app, you would fetch the sponsor data based on the ID
  const sponsor = sponsorData;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const handleRemoveStudent = (studentId: string) => {
    // In a real app, this would be an API call
    console.log("Removing student sponsorship:", studentId);
    toast({
      title: "Sponsorship Removed",
      description: "Student is no longer sponsored by this sponsor.",
    });
  };

  const handleAssignStudents = () => {
    if (selectedStudentIds.length === 0) {
      toast({
        title: "No Students Selected",
        description: "Please select at least one student to assign.",
        variant: "destructive",
      });
      return;
    }

    // In a real app, this would be an API call
    console.log("Assigning students:", selectedStudentIds);
    toast({
      title: "Students Assigned",
      description: `${selectedStudentIds.length} student(s) have been assigned to this sponsor.`,
    });
    setSelectedStudentIds([]);
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const navigateToAssignTab = () => {
    // Safely navigate to the assign tab
    const assignTab = document.querySelector('[data-value="assign"]') as HTMLElement | null;
    if (assignTab && 'click' in assignTab) {
      assignTab.click();
    }
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
              {sponsor.firstName} {sponsor.lastName}
            </h1>
          </div>
          <p className="text-muted-foreground">
            Sponsor ID: {sponsor.id} • Since {formatDate(sponsor.startDate)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={`/sponsors/${id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Sponsor
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Sponsor profile sidebar */}
        <Card className="lg:col-span-2">
          <CardHeader className="text-center">
            <Avatar className="mx-auto h-24 w-24">
              <AvatarImage src={sponsor.profileImage} alt={`${sponsor.firstName} ${sponsor.lastName}`} />
              <AvatarFallback className="text-2xl">
                {sponsor.firstName[0]}{sponsor.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="mt-2">
              {sponsor.firstName} {sponsor.lastName}
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
                <span className="ml-auto">{formatDate(sponsor.startDate)}</span>
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
              <p className="text-sm">{formatDate(sponsor.startDate)}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-1">Sponsored Students</h3>
              <p className="text-sm">{sponsor.students.length} students</p>
            </div>
            
            <Separator />
            
            <div className="text-xs text-muted-foreground">
              <p>Created by: {sponsor.createdBy} on {formatDate(sponsor.createdAt)}</p>
              {sponsor.lastModifiedBy && sponsor.updatedAt && (
                <p>Last modified by: {sponsor.lastModifiedBy} on {formatDate(sponsor.updatedAt)}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sponsor details tabs */}
        <div className="lg:col-span-5">
          <Tabs defaultValue="details">
            <TabsList className="w-full">
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
                    <p>{sponsor.firstName} {sponsor.lastName}</p>
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
                    Students currently sponsored by {sponsor.firstName} {sponsor.lastName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sponsor.students.length === 0 ? (
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
                      {sponsor.students.map((student) => (
                        <div key={student.id} className="flex justify-between items-center p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {student.firstName[0]}{student.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <Link to={`/students/${student.id}`} className="font-medium text-primary hover:underline">
                                {student.firstName} {student.lastName}
                              </Link>
                              <div className="text-sm text-muted-foreground">
                                Grade {student.grade} • Sponsored since {formatDate(student.sponsorshipDate)}
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
                    A history of {sponsor.firstName}'s interactions and activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative border-l border-border pl-6 ml-4">
                    {sponsor.timeline.map((event) => (
                      <div key={event.id} className="mb-8 relative">
                        <div
                          className={`absolute -left-7 h-4 w-4 rounded-full border-2 
                          ${event.type === "join" ? "bg-blue-500 border-blue-300" : 
                            event.type === "sponsorship" ? "bg-green-500 border-green-300" : 
                            event.type === "donation" ? "bg-purple-500 border-purple-300" : 
                            event.type === "communication" ? "bg-yellow-500 border-yellow-300" : 
                            "bg-gray-500 border-gray-300"}`}
                        />
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                          <p className="text-sm text-muted-foreground">
                            {formatDate(event.date)}
                          </p>
                          <h3 className="font-medium">{event.title}</h3>
                        </div>
                        <p className="mt-1">{event.description}</p>
                      </div>
                    ))}
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
                    Select students to be sponsored by {sponsor.firstName} {sponsor.lastName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {availableStudents.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">There are no unsponsored students available at this time.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4 mb-6">
                        {availableStudents.map((student) => (
                          <div 
                            key={student.id} 
                            className={`flex justify-between items-center p-4 border rounded-lg cursor-pointer
                              ${selectedStudentIds.includes(student.id) ? 'bg-primary/10 border-primary' : ''}`}
                            onClick={() => toggleStudentSelection(student.id)}
                          >
                            <div className="flex items-center gap-3">
                              <input 
                                type="checkbox"
                                checked={selectedStudentIds.includes(student.id)}
                                onChange={() => toggleStudentSelection(student.id)}
                                className="h-4 w-4"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Avatar>
                                <AvatarFallback>
                                  {student.firstName[0]}{student.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {student.firstName} {student.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Grade {student.grade} • {student.gender.charAt(0).toUpperCase() + student.gender.slice(1)}
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
                          onClick={handleAssignStudents}
                          disabled={selectedStudentIds.length === 0}
                        >
                          Assign Selected Students
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
