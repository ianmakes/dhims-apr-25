
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
            <div className="relative border-l border-border pl-6 ml-4">
              {timelineEvents.map((event) => (
                <div key={event.id} className="mb-8 relative group">
                  <div
                    className={`absolute -left-7 h-4 w-4 rounded-full border-2 
                      ${event.type === "academic"
                      ? "bg-blue-500 border-blue-300"
                      : event.type === "sponsor"
                      ? "bg-green-500 border-green-300"
                      : event.type === "personal"
                      ? "bg-yellow-500 border-yellow-300"
                      : "bg-gray-500 border-gray-300"
                    }`}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                      <p className="text-sm text-muted-foreground">
                        {formatDate(event.date)}
                      </p>
                      <h3 className="font-medium">{event.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onEditTimelineEvent(event)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteClick(event)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-1">{event.description}</p>
                </div>
              ))}
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
