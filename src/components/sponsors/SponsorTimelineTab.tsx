import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CalendarIcon, FileText, Plus, User, Users } from "lucide-react";
import { format, parseISO } from "date-fns";
import { SponsorTimelineEvent } from "@/types/database";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
interface SponsorTimelineTabProps {
  timelineEvents: SponsorTimelineEvent[];
  isLoading: boolean;
  onAddTimelineEvent: (event: {
    title: string;
    description?: string;
    type: string;
  }) => void;
}
export function SponsorTimelineTab({
  timelineEvents,
  isLoading,
  onAddTimelineEvent
}: SponsorTimelineTabProps) {
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    type: "general"
  });
  const eventTypes = [{
    value: "general",
    label: "General Update"
  }, {
    value: "student_assignment",
    label: "Student Assignment"
  }, {
    value: "student_removal",
    label: "Student Removal"
  }, {
    value: "payment",
    label: "Payment"
  }, {
    value: "communication",
    label: "Communication"
  }, {
    value: "visit",
    label: "Visit"
  }, {
    value: "other",
    label: "Other"
  }];
  const getEventIcon = (type: string) => {
    switch (type) {
      case "student_assignment":
        return <User className="h-4 w-4 text-green-500" />;
      case "student_removal":
        return <User className="h-4 w-4 text-red-500" />;
      case "payment":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "communication":
        return <Users className="h-4 w-4 text-purple-500" />;
      case "visit":
        return <CalendarIcon className="h-4 w-4 text-amber-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };
  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.type) return;
    onAddTimelineEvent({
      title: newEvent.title,
      description: newEvent.description || undefined,
      type: newEvent.type
    });
    setNewEvent({
      title: "",
      description: "",
      type: "general"
    });
    setIsAddEventDialogOpen(false);
  };
  return <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-left">Timeline</CardTitle>
            <CardDescription className="text-left">
              Sponsor history and important events
            </CardDescription>
          </div>
          <Button onClick={() => setIsAddEventDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading timeline...</p>
            </div> : timelineEvents.length === 0 ? <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground mb-4">No timeline events have been added yet</p>
              <Button onClick={() => setIsAddEventDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Event
              </Button>
            </div> : <div className="relative space-y-0 mt-4">
              <div className="absolute top-0 bottom-0 left-[11px] w-[1px] bg-border" />
              {timelineEvents.map(event => <div key={event.id} className="flex gap-4 mb-8">
                  <div className="mt-1 h-6 w-6 rounded-full border bg-background flex items-center justify-center z-10">
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{event.title}</h4>
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(event.date), "PPP")}
                      </span>
                    </div>
                    {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                  </div>
                </div>)}
            </div>}
        </CardContent>
      </Card>

      {/* Add Event Dialog */}
      <Dialog open={isAddEventDialogOpen} onOpenChange={setIsAddEventDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Timeline Event</DialogTitle>
            <DialogDescription>
              Create a new event for the sponsor's timeline.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={newEvent.title} onChange={e => setNewEvent({
              ...newEvent,
              title: e.target.value
            })} placeholder="Event title" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Event Type</Label>
              <Select value={newEvent.type} onValueChange={value => setNewEvent({
              ...newEvent,
              type: value
            })}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map(type => <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea id="description" value={newEvent.description} onChange={e => setNewEvent({
              ...newEvent,
              description: e.target.value
            })} placeholder="Additional details about this event" className="resize-none" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddEventDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEvent} disabled={!newEvent.title || !newEvent.type}>
              Add Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
}