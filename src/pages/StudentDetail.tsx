
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User } from "@/types/user";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { StudentTimelineTab } from "@/components/students/StudentTimelineTab";
import { StudentSponsorTab } from "@/components/students/StudentSponsorTab";
import { StudentPhotosTab } from "@/components/students/StudentPhotosTab";
import { StudentRelativesSection } from "@/components/students/StudentRelativesSection";

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [timelineEvents, setTimelineEvents] = useState([
    {
      id: "1",
      date: "2023-01-15",
      title: "Enrolled in School",
      description: "Student enrolled in the school system.",
      type: "academic",
    },
    {
      id: "2",
      date: "2023-05-20",
      title: "Received Sponsorship",
      description: "Student received a sponsorship from a generous donor.",
      type: "sponsor",
    },
    {
      id: "3",
      date: "2023-09-01",
      title: "Participated in Sports Day",
      description: "Student actively participated in the annual sports day.",
      type: "personal",
    },
  ]);

  const { data: student, isLoading, isError } = useQuery({
    queryKey: ['student', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const { data, error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${student?.name} has been deleted successfully.`,
      });
      navigate('/students');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    if (isError) {
      toast({
        title: "Error",
        description: "Failed to load student details.",
        variant: "destructive",
      });
    }
  }, [isError, toast]);

  const handleAddTimelineEvent = () => {
    // Implement the logic to add a timeline event
  };

  const handleDeleteStudent = () => {
    if (student?.id) {
      deleteStudentMutation.mutate(student.id);
    }
  };

  if (isLoading) {
    return <p>Loading student details...</p>;
  }

  if (!student) {
    return <p>Student not found.</p>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{student.name}</h1>
          <p className="text-muted-foreground">
            View and manage student details
          </p>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => navigate(`/students`)}>
            Back to Students
          </Button>
          <Button onClick={() => navigate(`/students/edit/${student.id}`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDeleteStudent} 
            disabled={deleteStudentMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleteStudentMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="sponsor">Sponsor</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="relatives">Relatives</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>
        <TabsContent value="timeline" className="space-y-2">
          <StudentTimelineTab
            studentName={student.name}
            timelineEvents={timelineEvents}
            onAddTimelineEvent={handleAddTimelineEvent}
            formatDate={formatDate}
          />
        </TabsContent>
        <TabsContent value="sponsor" className="space-y-2">
          <StudentSponsorTab
            student={student}
            formatDate={formatDate}
            navigate={navigate}
            toast={toast}
          />
        </TabsContent>
        <TabsContent value="photos" className="space-y-2">
          <StudentPhotosTab
            studentName={student.name}
            studentId={student.id}
            formatDate={formatDate}
          />
        </TabsContent>
        <TabsContent value="relatives" className="space-y-2">
          <StudentRelativesSection studentId={student.id} studentName={student.name} />
        </TabsContent>
        <TabsContent value="details" className="space-y-2">
          <Card>
            <CardHeader>
              <CardTitle>Student Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-medium text-gray-700">Email</h3>
                <p className="text-sm text-gray-500">{student.email || 'N/A'}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Date of Birth</h3>
                <p className="text-sm text-gray-500">{formatDate(student.dob || student.date_of_birth)}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Gender</h3>
                <p className="text-sm text-gray-500">{student.gender || 'N/A'}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Address</h3>
                <p className="text-sm text-gray-500">{student.address || student.location || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
