
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EditTimelineEventModal } from "./EditTimelineEventModal";

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
  formatDate: (date: string | Date | null | undefined) => string;
  onDeleteEvent?: (eventId: string) => void;
  onEditEvent?: () => void;
}

export function StudentTimelineTab({
  studentName,
  timelineEvents,
  onAddTimelineEvent,
  formatDate,
  onDeleteEvent,
  onEditEvent
}: StudentTimelineTabProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEventType | null>(null);

  const handleEditEvent = (event: TimelineEventType) => {
    setSelectedEvent(event);
    setIsEditModalOpen(true);
  };

  const handleDeleteEvent = (event: TimelineEventType) => {
    setSelectedEvent(event);
    setIsDeleteDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setSelectedEvent(null);
    if (onEditEvent) {
      onEditEvent();
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedEvent && onDeleteEvent) {
      onDeleteEvent(selectedEvent.id);
      setIsDeleteDialogOpen(false);
      setSelectedEvent(null);
    }
  };

  return <div className="py-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-left">Student Timeline</CardTitle>
            <CardDescription>A history of {studentName}'s journey</CardDescription>
          </div>
          <Button onClick={onAddTimelineEvent}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Timeline Event
          </Button>
        </CardHeader>
        <CardContent>
          {timelineEvents.length > 0 ? <div className="relative border-l border-border pl-6 ml-4">
              {timelineEvents.map(event => <div key={event.id} className="mb-8 relative">
                  <div className={`absolute -left-[10px] h-3 w-3 rounded-full border-2 
                      ${event.type === "academic" ? "bg-blue-500 border-blue-300" : event.type === "sponsor" ? "bg-green-500 border-green-300" : event.type === "personal" ? "bg-yellow-500 border-yellow-300" : "bg-gray-500 border-gray-300"}`} />
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(event.date)}
                        </p>
                        <h3 className="font-medium">{event.title}</h3>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEditEvent(event)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit event</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteEvent(event)}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete event</span>
                        </Button>
                      </div>
                    </div>
                    <p className="mt-1 text-left">{event.description}</p>
                  </div>
                </div>)}
            </div> : <div className="flex flex-col items-center justify-center p-8">
              <p className="mb-4 text-muted-foreground">No timeline events yet</p>
              <Button onClick={onAddTimelineEvent}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add First Event
              </Button>
            </div>}
        </CardContent>
      </Card>

      {/* Edit Timeline Event Modal */}
      {selectedEvent && (
        <EditTimelineEventModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          event={selectedEvent}
          studentId={selectedEvent.id}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Timeline Event</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the timeline event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
}
