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

import { StudentProfileSidebar } from "@/components/students/StudentProfileSidebar";
import { StudentDetailsTab } from "@/components/students/StudentDetailsTab";
import { StudentExamsTab } from "@/components/students/StudentExamsTab";
import { StudentSponsorTab } from "@/components/students/StudentSponsorTab";
import { StudentPhotosTab } from "@/components/students/StudentPhotosTab";
import { StudentLettersTab } from "@/components/students/StudentLettersTab";
import { StudentTimelineTab } from "@/components/students/StudentTimelineTab";

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
        <StudentProfileSidebar student={student} formatDate={formatDate} />

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
            {/* Tabs */}
            <TabsContent value="details">
              <StudentDetailsTab student={student} formatDate={formatDate} />
            </TabsContent>
            <TabsContent value="exams">
              <StudentExamsTab studentName={student.name} />
            </TabsContent>
            <TabsContent value="sponsor">
              <StudentSponsorTab
                student={student}
                formatDate={formatDate}
                navigate={navigate}
                toast={toast}
              />
            </TabsContent>
            <TabsContent value="photos">
              <StudentPhotosTab
                studentName={student.name}
                photos={photos}
                onAddPhoto={() => setIsAddPhotoModalOpen(true)}
                formatDate={formatDate}
              />
            </TabsContent>
            <TabsContent value="letters">
              <StudentLettersTab
                studentName={student.name}
                onAddLetter={() => setIsAddLetterModalOpen(true)}
                formatDate={formatDate}
              />
            </TabsContent>
            <TabsContent value="timeline">
              <StudentTimelineTab
                studentName={student.name}
                timelineEvents={timelineEvents}
                onAddTimelineEvent={() => setIsAddTimelineEventModalOpen(true)}
                formatDate={formatDate}
              />
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
            gender:
              student.gender === "Male" || student.gender === "Female"
                ? student.gender
                : "Male",
          }}
          onSubmit={handleEditStudent}
        />
      )}

      {/* Add Photo Modal */}
      <AddPhotoModal
        open={isAddPhotoModalOpen}
        onOpenChange={setIsAddPhotoModalOpen}
        studentId={id || ""}
        onSuccess={() => {
          // Update photos list
          setPhotos(getStudentPhotos());
        }}
      />

      {/* Add Letter Modal */}
      <AddLetterModal
        open={isAddLetterModalOpen}
        onOpenChange={setIsAddLetterModalOpen}
        studentId={id || ""}
        onSuccess={() => {
          // Refresh letters
        }}
      />

      {/* Add Timeline Event Modal */}
      <AddTimelineEventModal
        open={isAddTimelineEventModalOpen}
        onOpenChange={setIsAddTimelineEventModalOpen}
        studentId={id || ""}
        onSuccess={() => {
          // Refresh timeline events
          refetchTimeline();
        }}
      />
    </div>
  );
}
