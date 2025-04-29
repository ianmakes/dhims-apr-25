
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TimelineEventType {
  id: string;
  date: string;
  title: string;
  description: string;
  type: string;
}

interface StudentTimelineTabProps {
  studentName: string;
  timelineEvents: TimelineEventType[];
  onAddTimelineEvent: () => void;
  onEditTimelineEvent: (event: TimelineEventType) => void;
  refetchTimeline: () => void;
  formatDate: (date: string | Date | null | undefined) => string;
}

export function StudentTimelineTab({
  studentName,
  timelineEvents,
  onAddTimelineEvent,
  onEditTimelineEvent,
  refetchTimeline,
  formatDate,
}: StudentTimelineTabProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<TimelineEventType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (event: TimelineEventType) => {
    setEventToDelete(event);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('timeline_events')
        .delete()
        .eq('id', eventToDelete.id);
      
      if (error) throw error;
      
      toast.success("Timeline event deleted successfully");
      refetchTimeline();
    } catch (error: any) {
      console.error("Error deleting timeline event:", error);
      toast.error(error.message || "Failed to delete timeline event");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  };

  // Get event type color
  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'academic':
        return {
          bg: 'bg-blue-500',
          lightBg: 'bg-blue-100',
          border: 'border-blue-300',
          text: 'text-blue-800'
        };
      case 'sponsor':
        return {
          bg: 'bg-green-500',
          lightBg: 'bg-green-100',
          border: 'border-green-300',
          text: 'text-green-800'
        };
      case 'personal':
        return {
          bg: 'bg-yellow-500',
          lightBg: 'bg-yellow-100',
          border: 'border-yellow-300',
          text: 'text-yellow-800'
        };
      default:
        return {
          bg: 'bg-gray-500',
          lightBg: 'bg-gray-100',
          border: 'border-gray-300',
          text: 'text-gray-800'
        };
    }
  };

  return (
    <div className="py-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Student Timeline</CardTitle>
            <CardDescription>A history of {studentName}'s journey</CardDescription>
          </div>
          <Button onClick={onAddTimelineEvent}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Timeline Event
          </Button>
        </CardHeader>
        <CardContent>
          {timelineEvents.length > 0 ? (
            <div className="relative border-l border-gray-200 dark:border-gray-700 ml-6">
              {timelineEvents.map((event) => {
                const eventColors = getEventTypeColor(event.type);
                return (
                <div key={event.id} className="mb-8 relative group">
                  {/* Updated dot design with different colors based on event type */}
                  <div
                    className={`absolute -left-[26px] top-1 h-12 w-12 rounded-full ${eventColors.lightBg} flex items-center justify-center shadow-sm border ${eventColors.border}`}
                  >
                    <div className={`h-6 w-6 rounded-full ${eventColors.bg}`}></div>
                  </div>
                  
                  <div className="ml-4">
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${eventColors.lightBg} ${eventColors.text}`}>
                          {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                        </span>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(event.date)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{event.title}</h3>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onEditTimelineEvent(event)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                            onClick={() => handleDeleteClick(event)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                      <p className="mt-1 text-left text-gray-700">{event.description}</p>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8">
              <p className="mb-4 text-muted-foreground">No timeline events yet</p>
              <Button onClick={onAddTimelineEvent}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add First Event
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the timeline event
              {eventToDelete?.title && `: "${eventToDelete.title}"`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
