
import { useParams, Link, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BackpackIcon, BookOpen, Calendar, Edit, Mail, MapPin, Phone, User, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Mock student data
const studentData = {
  id: "1",
  firstName: "John",
  lastName: "Doe",
  dateOfBirth: new Date(2012, 2, 15),
  gender: "male",
  grade: "4",
  enrollmentDate: new Date(2022, 0, 15),
  address: "123 School Lane, Nairobi, Kenya",
  guardianName: "Robert Doe",
  guardianContact: "+254 712 345 678",
  profileImage: "",
  status: "active",
  sponsorId: "1",
  sponsor: {
    id: "1",
    firstName: "Michael",
    lastName: "Johnson",
    email: "michael.johnson@example.com",
    phone: "+1 555-123-4567",
    country: "United States",
    startDate: new Date(2022, 1, 10),
    status: "active",
  },
  exams: [
    {
      id: "1",
      name: "Term 1 Assessment",
      date: new Date(2022, 3, 15),
      scores: [
        { subject: "Mathematics", score: 82, grade: "B+", comments: "Good work" },
        { subject: "English", score: 88, grade: "A-", comments: "Excellent grammar" },
        { subject: "Science", score: 75, grade: "B", comments: "Needs to improve in practical" },
        { subject: "Social Studies", score: 90, grade: "A", comments: "Outstanding performance" },
      ],
    },
    {
      id: "2",
      name: "Term 2 Assessment",
      date: new Date(2022, 7, 10),
      scores: [
        { subject: "Mathematics", score: 85, grade: "A-", comments: "Improved performance" },
        { subject: "English", score: 90, grade: "A", comments: "Excellent comprehension" },
        { subject: "Science", score: 80, grade: "B+", comments: "Good progress" },
        { subject: "Social Studies", score: 88, grade: "A-", comments: "Very good" },
      ],
    },
    {
      id: "3",
      name: "Term 3 Assessment",
      date: new Date(2022, 11, 5),
      scores: [
        { subject: "Mathematics", score: 90, grade: "A", comments: "Excellent work" },
        { subject: "English", score: 92, grade: "A", comments: "Outstanding" },
        { subject: "Science", score: 88, grade: "A-", comments: "Great improvement" },
        { subject: "Social Studies", score: 94, grade: "A", comments: "Exceptional" },
      ],
    },
  ],
  photos: [
    { id: "1", url: "https://source.unsplash.com/random/300x300/?student", date: new Date(2022, 1, 15), caption: "First day at school" },
    { id: "2", url: "https://source.unsplash.com/random/300x300/?classroom", date: new Date(2022, 4, 20), caption: "In class activity" },
    { id: "3", url: "https://source.unsplash.com/random/300x300/?graduation", date: new Date(2022, 7, 25), caption: "Term graduation" },
  ],
  letters: [
    { id: "1", date: new Date(2022, 2, 10), content: "Thank you letter to sponsor", attachments: ["letter1.pdf"] },
    { id: "2", date: new Date(2022, 6, 18), content: "Progress update letter", attachments: ["letter2.pdf"] },
    { id: "3", date: new Date(2022, 10, 25), content: "Holiday greetings letter", attachments: ["letter3.pdf"] },
  ],
  timeline: [
    { id: "1", date: new Date(2022, 0, 15), title: "Enrollment", description: "Enrolled in grade 4", type: "academic" },
    { id: "2", date: new Date(2022, 1, 10), title: "Sponsor Assigned", description: "Assigned to Michael Johnson", type: "sponsor" },
    { id: "3", date: new Date(2022, 3, 15), title: "Term 1 Exams", description: "Completed Term 1 assessments", type: "academic" },
    { id: "4", date: new Date(2022, 5, 20), title: "School Trip", description: "Participated in educational trip", type: "personal" },
    { id: "5", date: new Date(2022, 7, 10), title: "Term 2 Exams", description: "Completed Term 2 assessments", type: "academic" },
    { id: "6", date: new Date(2022, 9, 5), title: "Award", description: "Received academic excellence award", type: "academic" },
    { id: "7", date: new Date(2022, 11, 5), title: "Term 3 Exams", description: "Completed Term 3 assessments", type: "academic" },
  ],
};

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // In a real app, you would fetch the student data based on the ID
  const student = studentData;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link to="/students">
              <Button variant="ghost" size="sm">
                <Users className="mr-2 h-4 w-4" />
                Students
              </Button>
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-3xl font-bold tracking-tight">
              {student.firstName} {student.lastName}
            </h1>
          </div>
          <p className="text-muted-foreground">
            Student ID: {student.id} • Grade {student.grade}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={`/students/${id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Student
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Student profile sidebar */}
        <Card className="lg:col-span-2">
          <CardHeader className="text-center">
            <Avatar className="mx-auto h-24 w-24">
              <AvatarImage src={student.profileImage} alt={`${student.firstName} ${student.lastName}`} />
              <AvatarFallback className="text-2xl">
                {student.firstName[0]}{student.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="mt-2">
              {student.firstName} {student.lastName}
            </CardTitle>
            <div className="flex justify-center">
              <Badge variant={student.status === "active" ? "default" : student.status === "inactive" ? "secondary" : "outline"}>
                {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Gender:</span>
                <span className="ml-auto capitalize">{student.gender}</span>
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Date of Birth:</span>
                <span className="ml-auto">{formatDate(student.dateOfBirth)}</span>
              </div>
              <div className="flex items-center text-sm">
                <BackpackIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Grade:</span>
                <span className="ml-auto">{student.grade}</span>
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Enrollment Date:</span>
                <span className="ml-auto">{formatDate(student.enrollmentDate)}</span>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h3 className="font-medium">Guardian Information</h3>
              <div className="flex items-center text-sm">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Name:</span>
                <span className="ml-auto">{student.guardianName}</span>
              </div>
              <div className="flex items-center text-sm">
                <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Contact:</span>
                <span className="ml-auto">{student.guardianContact}</span>
              </div>
              <div className="flex items-center text-sm">
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Address:</span>
                <span className="ml-auto truncate max-w-[150px]" title={student.address}>
                  {student.address}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student details tabs */}
        <div className="lg:col-span-5">
          <Tabs defaultValue="details">
            <TabsList className="w-full">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="exams">Exams</TabsTrigger>
              <TabsTrigger value="sponsor">Sponsor</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="letters">Letters</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
            
            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6 py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Academic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="font-medium">Grade</h3>
                    <p>{student.grade}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Enrollment Date</h3>
                    <p>{formatDate(student.enrollmentDate)}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Status</h3>
                    <p className="capitalize">{student.status}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Sponsorship</h3>
                    <p>{student.sponsorId ? "Sponsored" : "Unsponsored"}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="font-medium">Full Name</h3>
                    <p>{student.firstName} {student.lastName}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Date of Birth</h3>
                    <p>{formatDate(student.dateOfBirth)}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Gender</h3>
                    <p className="capitalize">{student.gender}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Age</h3>
                    <p>{new Date().getFullYear() - student.dateOfBirth.getFullYear()} years</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Address</h3>
                    <p>{student.address}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Guardian Name</h3>
                    <p>{student.guardianName}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Guardian Contact</h3>
                    <p>{student.guardianContact}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Exams Tab */}
            <TabsContent value="exams" className="py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Exam Records</CardTitle>
                  <CardDescription>
                    View all exam results for {student.firstName} {student.lastName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {student.exams.map((exam) => (
                    <div key={exam.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{exam.name}</h3>
                        <p className="text-sm text-muted-foreground">{formatDate(exam.date)}</p>
                      </div>
                      <div className="relative overflow-x-auto rounded-md border">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-muted text-muted-foreground">
                            <tr>
                              <th className="px-4 py-2 font-medium">Subject</th>
                              <th className="px-4 py-2 font-medium">Score</th>
                              <th className="px-4 py-2 font-medium">Grade</th>
                              <th className="px-4 py-2 font-medium">Comments</th>
                            </tr>
                          </thead>
                          <tbody>
                            {exam.scores.map((score, index) => (
                              <tr key={index} className="border-t">
                                <td className="px-4 py-2">{score.subject}</td>
                                <td className="px-4 py-2">{score.score}</td>
                                <td className="px-4 py-2">{score.grade}</td>
                                <td className="px-4 py-2">{score.comments}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Sponsor Tab */}
            <TabsContent value="sponsor" className="py-4">
              {student.sponsorId ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Sponsor Information</CardTitle>
                    <CardDescription>
                      Details about {student.firstName}'s sponsor
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-xl">
                          {student.sponsor.firstName[0]}{student.sponsor.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-medium">
                          {student.sponsor.firstName} {student.sponsor.lastName}
                        </h3>
                        <p className="text-muted-foreground">
                          Sponsoring since {formatDate(student.sponsor.startDate)}
                        </p>
                        <div className="mt-1">
                          <Badge variant={student.sponsor.status === "active" ? "default" : "secondary"}>
                            {student.sponsor.status.charAt(0).toUpperCase() + student.sponsor.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <h3 className="font-medium">Email</h3>
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {student.sponsor.email}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-medium">Phone</h3>
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {student.sponsor.phone}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-medium">Country</h3>
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {student.sponsor.country}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-medium">Status</h3>
                        <p className="capitalize">{student.sponsor.status}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button variant="outline">
                        <Users className="mr-2 h-4 w-4" />
                        View Full Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>No Sponsor Assigned</CardTitle>
                    <CardDescription>
                      This student currently does not have a sponsor
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center py-6">
                      <Button>
                        <Users className="mr-2 h-4 w-4" />
                        Assign Sponsor
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Photos Tab */}
            <TabsContent value="photos" className="py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Student Photos</CardTitle>
                  <CardDescription>
                    Photos of {student.firstName} {student.lastName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {student.photos.map((photo) => (
                      <div key={photo.id} className="overflow-hidden rounded-lg border">
                        <img
                          src={photo.url}
                          alt={photo.caption}
                          className="h-48 w-full object-cover"
                        />
                        <div className="p-3">
                          <p className="font-medium">{photo.caption}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(photo.date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex justify-center">
                    <Button>
                      Upload New Photo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Letters Tab */}
            <TabsContent value="letters" className="py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Student Letters</CardTitle>
                  <CardDescription>
                    Letters from {student.firstName} to sponsors
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {student.letters.map((letter) => (
                      <div key={letter.id} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{letter.content}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(letter.date)}
                          </p>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {letter.attachments.map((attachment, index) => (
                            <Button key={index} variant="outline" size="sm">
                              <BookOpen className="mr-2 h-4 w-4" />
                              {attachment}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex justify-center">
                    <Button>
                      Add New Letter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Timeline Tab */}
            <TabsContent value="timeline" className="py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Student Timeline</CardTitle>
                  <CardDescription>
                    A history of {student.firstName}'s journey
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative border-l border-border pl-6 ml-4">
                    {student.timeline.map((event, index) => (
                      <div key={event.id} className="mb-8 relative">
                        <div
                          className={`absolute -left-7 h-4 w-4 rounded-full border-2 
                          ${event.type === "academic" ? "bg-blue-500 border-blue-300" : 
                            event.type === "sponsor" ? "bg-green-500 border-green-300" : 
                            event.type === "personal" ? "bg-yellow-500 border-yellow-300" : 
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
          </Tabs>
        </div>
      </div>
    </div>
  );
}
