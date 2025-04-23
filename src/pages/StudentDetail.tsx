import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  BackpackIcon, 
  BookOpen, 
  Calendar, 
  Download,
  Edit, 
  FileText,
  Mail, 
  MapPin, 
  Phone, 
  User, 
  Users,
  PlusCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { AddPhotoModal } from "@/components/students/AddPhotoModal";
import { AddLetterModal } from "@/components/students/AddLetterModal";
import { AddTimelineEventModal } from "@/components/students/AddTimelineEventModal";
import { StudentProfilePDF } from "@/components/students/StudentProfilePDF";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AddEditStudentModal } from "@/components/students/AddEditStudentModal";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { StudentFormInput } from "@/types/database";

// Mock exam data for the charts (until we have real data)
const examData = [
  { term: 'Term 1', Mathematics: 65, English: 70, Science: 55, SocialStudies: 75 },
  { term: 'Term 2', Mathematics: 70, English: 75, Science: 60, SocialStudies: 80 },
  { term: 'Term 3', Mathematics: 75, English: 80, Science: 70, SocialStudies: 85 },
  { term: 'Term 4', Mathematics: 80, English: 85, Science: 75, SocialStudies: 90 },
];

const gradeColors = {
  "A": "#4ade80", // green
  "A-": "#86efac",
  "B+": "#a3e635",
  "B": "#facc15", // yellow
  "B-": "#fde047",
  "C+": "#fdba74",
  "C": "#fb923c", // orange
  "C-": "#f97316",
  "D+": "#f87171",
  "D": "#ef4444", // red
  "D-": "#dc2626",
  "E": "#b91c1c", // dark red
};

// Helper function to calculate grade based on score
const calculateGrade = (score: number) => {
  if (score >= 80) return "A";
  if (score >= 75) return "A-";
  if (score >= 70) return "B+";
  if (score >= 65) return "B";
  if (score >= 60) return "B-";
  if (score >= 55) return "C+";
  if (score >= 50) return "C";
  if (score >= 45) return "C-";
  if (score >= 40) return "D+";
  if (score >= 35) return "D";
  if (score >= 30) return "D-";
  return "E";
};

// Helper function to get grade category based on score
const getGradeCategory = (score: number) => {
  if (score >= 80) return "Exceeding Expectation";
  if (score >= 50) return "Meeting Expectation";
  if (score >= 40) return "Approaching Expectation";
  return "Below Expectation";
};

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddPhotoModalOpen, setIsAddPhotoModalOpen] = useState(false);
  const [isAddLetterModalOpen, setIsAddLetterModalOpen] = useState(false);
  const [isAddTimelineEventModalOpen, setIsAddTimelineEventModalOpen] = useState(false);
  
  // Fetch student data
  const { 
    data: student, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['student', id],
    queryFn: async () => {
      if (!id) throw new Error('Student ID is required');
      
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch timeline events
  const { 
    data: timelineEvents = [], 
    refetch: refetchTimeline 
  } = useQuery({
    queryKey: ['timeline-events', id],
    queryFn: async () => {
      if (!id) throw new Error('Student ID is required');
      
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('student_id', id)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Mock functions for photos and letters (would be replaced with real API calls)
  const getStudentPhotos = () => {
    if (!id) return [];
    try {
      const storedPhotos = localStorage.getItem(`student_photos_${id}`);
      return storedPhotos ? JSON.parse(storedPhotos) : [];
    } catch (error) {
      console.error('Error getting photos:', error);
      return [];
    }
  };

  const [photos, setPhotos] = useState(getStudentPhotos());
  
  useEffect(() => {
    setPhotos(getStudentPhotos());
  }, [id]);

  // Mutation to update student status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('students')
        .update({
          status,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', id] });
      toast({
        title: "Status updated",
        description: "Student status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handler for editing student
  const handleEditStudent = (data: any) => {
    if (id) {
      // Update student in database
      const updateStudent = async () => {
        try {
          const { error } = await supabase
            .from('students')
            .update({
              ...data,
              updated_by: user?.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', id);
          
          if (error) throw error;
          
          queryClient.invalidateQueries({ queryKey: ['student', id] });
          
          toast({
            title: "Student updated",
            description: "Student has been updated successfully.",
          });
        } catch (error) {
          console.error('Error updating student:', error);
          toast({
            title: "Error updating student",
            description: "Failed to update student. Please try again.",
            variant: "destructive",
          });
        }
      };
      
      updateStudent();
    }
  };

  // Handler for toggling student status
  const handleToggleStatus = () => {
    if (student && id) {
      const newStatus = student.status === "Active" ? "Inactive" : "Active";
      updateStatusMutation.mutate({ id, status: newStatus });
    }
  };

  // Helper for formatting dates
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "N/A";
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Loading student details...</div>;
  }

  if (error || !student) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-bold">Error loading student</h2>
        <p className="text-muted-foreground">Could not find student details</p>
        <Button onClick={() => navigate('/students')} className="mt-4">
          Back to Students
        </Button>
      </div>
    );
  }

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
              {student.name}
            </h1>
          </div>
          <p className="text-muted-foreground">
            Student ID: {student.admission_number} • {student.current_grade}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {student.status === "Active" ? "Active" : "Inactive"}
            </span>
            <Switch 
              checked={student.status === "Active"} 
              onCheckedChange={handleToggleStatus}
            />
          </div>
          
          <StudentProfilePDF student={student} />
          
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Student
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Student profile sidebar */}
        <Card className="lg:col-span-2">
          <CardHeader className="text-center">
            <Avatar className="mx-auto h-24 w-24">
              <AvatarImage src={student.profile_image_url} alt={student.name} />
              <AvatarFallback className="text-2xl">
                {student.name ? student.name.charAt(0) : 'S'}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="mt-2">
              {student.name}
            </CardTitle>
            <div className="flex justify-center">
              <Badge 
                variant={
                  student.status === "Active" ? "default" : 
                  student.status === "Inactive" ? "secondary" : 
                  student.status === "Graduated" ? "outline" :
                  "destructive"
                }
                className={student.status === "Inactive" ? "opacity-60" : ""}
              >
                {student.status}
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
                <span className="ml-auto">{formatDate(student.dob)}</span>
              </div>
              <div className="flex items-center text-sm">
                <BackpackIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Grade:</span>
                <span className="ml-auto">{student.current_grade}</span>
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Admission Date:</span>
                <span className="ml-auto">{formatDate(student.admission_date)}</span>
              </div>
              <div className="flex items-center text-sm">
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Location:</span>
                <span className="ml-auto">{student.location || 'N/A'}</span>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h3 className="font-medium">Academic Information</h3>
              <div className="flex items-center text-sm">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">CBC Category:</span>
                <span className="ml-auto">{student.cbc_category || 'N/A'}</span>
              </div>
              <div className="flex items-center text-sm">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">School Level:</span>
                <span className="ml-auto">{student.school_level || 'N/A'}</span>
              </div>
              <div className="flex items-center text-sm">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Academic Year:</span>
                <span className="ml-auto">{student.current_academic_year || new Date().getFullYear()}</span>
              </div>
              <div className="flex items-center text-sm">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Accommodation:</span>
                <span className="ml-auto">{student.accommodation_status || 'N/A'}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="font-medium">Health Information</h3>
              <div className="flex items-center text-sm">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Health Status:</span>
                <span className="ml-auto">{student.health_status || 'Healthy'}</span>
              </div>
              <div className="flex items-center text-sm">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Height:</span>
                <span className="ml-auto">{student.height_cm ? `${student.height_cm} cm` : 'N/A'}</span>
              </div>
              <div className="flex items-center text-sm">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Weight:</span>
                <span className="ml-auto">{student.weight_kg ? `${student.weight_kg} kg` : 'N/A'}</span>
              </div>
            </div>
            
            <Separator />
            
            <div className="text-xs text-muted-foreground">
              <p>Created: {formatDate(student.created_at)}</p>
              {student.updated_at && (
                <p>Last modified: {formatDate(student.updated_at)}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Student details tabs */}
        <div className="lg:col-span-5">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full justify-start">
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
                    <h3 className="font-medium">Current Grade</h3>
                    <p>{student.current_grade}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Admission Date</h3>
                    <p>{formatDate(student.admission_date)}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Status</h3>
                    <p className="capitalize">{student.status}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Sponsorship</h3>
                    <p>{student.sponsor_id ? "Sponsored" : "Unsponsored"}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">CBC Category</h3>
                    <p>{student.cbc_category || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">School Level</h3>
                    <p>{student.school_level || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Academic Year</h3>
                    <p>{student.current_academic_year || new Date().getFullYear()}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Accommodation</h3>
                    <p>{student.accommodation_status || 'N/A'}</p>
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
                    <p>{student.name}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Admission Number</h3>
                    <p>{student.admission_number}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Date of Birth</h3>
                    <p>{formatDate(student.dob)}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Gender</h3>
                    <p className="capitalize">{student.gender}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Age</h3>
                    <p>{student.dob ? 
                      Math.floor((new Date().getTime() - new Date(student.dob).getTime()) / 3.15576e+10) + ' years' : 
                      'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Health Status</h3>
                    <p>{student.health_status || 'Healthy'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Height</h3>
                    <p>{student.height_cm ? `${student.height_cm} cm` : 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Weight</h3>
                    <p>{student.weight_kg ? `${student.weight_kg} kg` : 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Student Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">
                    {student.description || 'No description available.'}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Exams Tab */}
            <TabsContent value="exams" className="py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Exam Performance</CardTitle>
                  <CardDescription>
                    View {student.name}'s academic performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Performance Charts */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Performance Trends</h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={examData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="term" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="Mathematics" stroke="#8884d8" activeDot={{ r: 8 }} />
                          <Line type="monotone" dataKey="English" stroke="#82ca9d" />
                          <Line type="monotone" dataKey="Science" stroke="#ffc658" />
                          <Line type="monotone" dataKey="SocialStudies" stroke="#ff7300" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <h3 className="font-medium mt-8">Latest Results</h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[examData[examData.length - 1]]}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="term" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="Mathematics" fill="#8884d8" />
                          <Bar dataKey="English" fill="#82ca9d" />
                          <Bar dataKey="Science" fill="#ffc658" />
                          <Bar dataKey="SocialStudies" fill="#ff7300" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Exam Records */}
                  <div className="mt-8">
                    <h3 className="font-medium mb-4">Exam Records</h3>
                    {examData.map((exam, index) => (
                      <div key={index} className="mb-6 border rounded-md p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-semibold text-lg">{exam.term}</h4>
                          <Badge variant="outline">
                            Average: {((exam.Mathematics + exam.English + exam.Science + exam.SocialStudies) / 4).toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(exam).filter(([key]) => key !== 'term').map(([subject, score]) => (
                            <div key={subject} className="border rounded p-3">
                              <div className="text-sm text-muted-foreground">{subject}</div>
                              <div className="text-xl font-bold">{score}%</div>
                              <div 
                                className="text-sm font-medium" 
                                style={{ color: gradeColors[calculateGrade(score as number)] }}
                              >
                                {calculateGrade(score as number)} ({getGradeCategory(score as number)})
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Sponsor Tab */}
            <TabsContent value="sponsor" className="py-4">
              {student.sponsor_id ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Sponsor Information</CardTitle>
                    <CardDescription>
                      Details about {student.name}'s sponsor
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-xl">
                          SP
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-medium">
                          Sponsor #{student.sponsor_id}
                        </h3>
                        <p className="text-muted-foreground">
                          Sponsoring since {formatDate(student.sponsored_since)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => {
                          // Logic to remove sponsorship
                          toast({
                            title: "Sponsorship Removed",
                            description: "The sponsor has been removed from this student.",
                          });
                        }}
                      >
                        Remove Sponsorship
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        onClick={() => navigate(`/sponsors/${student.sponsor_id}`)}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        View Sponsor Profile
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
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Student Photos</CardTitle>
                    <CardDescription>
                      Photos of {student.name}
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsAddPhotoModalOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Photo
                  </Button>
                </CardHeader>
                <CardContent>
                  {photos.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {photos.map((photo) => (
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
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8">
                      <p className="mb-4 text-muted-foreground">No photos available</p>
                      <Button onClick={() => setIsAddPhotoModalOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add First Photo
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Letters Tab */}
            <TabsContent value="letters" className="py-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Student Letters</CardTitle>
                    <CardDescription>
                      Letters from {student.name} to sponsors
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsAddLetterModalOpen(true)}>
                    <FileText className="mr-2 h-4 w-4" />
                    Add Letter
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Sample letter data - would be replaced with actual data */}
                    {[1, 2, 3].map((index) => (
                      <div key={index} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Thank you letter to sponsor</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(new Date(2023, index + 1, 15))}
                          </p>
                        </div>
                        <p className="mt-2 text-muted-foreground">
                          Dear Sponsor, thank you for your continued support...
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button variant="outline" size="sm">
                            <BookOpen className="mr-2 h-4 w-4" />
                            View Letter
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Timeline Tab */}
            <TabsContent value="timeline" className="py-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Student Timeline</CardTitle>
                    <CardDescription>
                      A history of {student.name}'s journey
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsAddTimelineEventModalOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Timeline Event
                  </Button>
                </CardHeader>
                <CardContent>
                  {timelineEvents.length > 0 ? (
                    <div className="relative border-l border-border pl-6 ml-4">
                      {timelineEvents.map((event) => (
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
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8">
                      <p className="mb-4 text-muted-foreground">No timeline events yet</p>
                      <Button onClick={() => setIsAddTimelineEventModalOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add First Event
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Student Modal */}
      {isEditModalOpen && (
        <AddEditStudentModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          student={{
            ...student,
            // Ensure gender is correctly typed as "Male" or "Female"
            gender: (student.gender === "Male" || student.gender === "Female") 
              ? student.gender 
              : "Male" // Default to "Male" if it's not a valid value
