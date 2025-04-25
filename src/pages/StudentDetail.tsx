import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Edit, Users } from "lucide-react";
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
import { StudentFormInput } from "@/types/database";

// Import components
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
  
  // Update photos when ID changes
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

  // Ensure student data has the correct types for components
  const typedStudent = {
    ...student,
    // Ensure gender is correctly typed as "Male" or "Female"
    gender: (student.gender === "Male" || student.gender === "Female") 
      ? student.gender as "Male" | "Female"
      : "Male" as const // Default to "Male" if it's not a valid value
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
          
          <StudentProfilePDF student={typedStudent} />
          
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Student
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Student profile sidebar */}
        <StudentProfileSidebar student={typedStudent} formatDate={formatDate} />

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
              <StudentDetailsTab student={typedStudent} formatDate={formatDate} />
            </TabsContent>
            <TabsContent value="exams">
              <StudentExamsTab studentName={student.name} studentId={student.id} />
            </TabsContent>
            <TabsContent value="sponsor">
              <StudentSponsorTab
                student={typedStudent}
                formatDate={formatDate}
                navigate={navigate}
                toast={toast}
              />
            </TabsContent>
            <TabsContent value="photos">
              <StudentPhotosTab
                studentName={student.name}
                studentId={student.id}
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
                ? student.gender as "Male" | "Female"
                : "Male" as const,
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
