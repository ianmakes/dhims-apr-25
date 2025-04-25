
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Check, Clock, FileText, Mail, MapPin, MessageCircle, Plus, User, Users } from "lucide-react";
import { toast } from "sonner";

interface TimelineEvent {
  id: string;
  sponsor_id: string;
  student_id?: string | null;
  title: string;
  description?: string | null;
  type: string;
  date: string;
  created_at: string;
}

interface SponsorTimelineTabProps {
  timelineEvents: TimelineEvent[];
  isLoading: boolean;
  onAddTimelineEvent: (event: { title: string; description?: string; type: string }) => void;
}

export function SponsorTimelineTab({
  timelineEvents,
  isLoading,
  onAddTimelineEvent,
}: SponsorTimelineTabProps) {
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("note");

  const EVENT_TYPES = [
    { value: "note", label: "Note", icon: <FileText className="h-4 w-4" /> },
    { value: "email", label: "Email", icon: <Mail className="h-4 w-4" /> },
    { value: "call", label: "Phone Call", icon: <Phone className="h-4 w-4" /> },
    { value: "meeting", label: "Meeting", icon: <Users className="h-4 w-4" /> },
    { value: "status_change", label: "Status Change", icon: <Check className="h-4 w-4" /> },
    { value: "visit", label: "Visit", icon: <MapPin className="h-4 w-4" /> },
    { value: "student_assignment", label: "Student Assignment", icon: <User className="h-4 w-4" /> },
    { value: "student_removal", label: "Student Removal", icon: <User className="h-4 w-4" /> },
    { value: "other", label: "Other", icon: <MessageCircle className="h-4 w-4" /> }
  ];

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setEventType("note");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title) {
      toast.error("Please enter a title for the event");
      return;
    }
    
    onAddTimelineEvent({
      title,
      description: description || undefined,
      type: eventType,
    });
    
    setIsAddEventDialogOpen(false);
    resetForm();
  };

  // Helper function to get icon for event type
  const getEventIcon = (type: string) => {
    const eventType = EVENT_TYPES.find(et => et.value === type);
    return eventType ? eventType.icon : <MessageCircle className="h-4 w-4" />;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Sponsor Timeline</CardTitle>
          <CardDescription>
            A history of interactions and activities with this sponsor
          </CardDescription>
        </div>
        <Button onClick={() => setIsAddEventDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading timeline events...</div>
        ) : timelineEvents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No timeline events</h3>
            <p className="mt-2 text-muted-foreground">
              There are no events recorded in this sponsor's timeline yet.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => setIsAddEventDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Event
            </Button>
          </div>
        ) : (
          <div className="relative border-l border-border pl-6 ml-4">
            {timelineEvents.map((event) => (
              <div key={event.id} className="mb-10 relative">
                <div className="absolute w-3 h-3 bg-primary rounded-full -left-[30px] border border-background"></div>
                <div className="flex items-center mb-1 text-sm text-muted-foreground">
                  <Clock className="mr-1 h-3.5 w-3.5" />
                  <time>{formatDate(event.date)} at {formatTime(event.date)}</time>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  {getEventIcon(event.type)}
                  <h3 className="text-base font-semibold">{event.title}</h3>
                </div>
                {event.description && (
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Timeline Event Dialog */}
        <Dialog open={isAddEventDialogOpen} onOpenChange={(open) => {
          if (!open) resetForm();
          setIsAddEventDialogOpen(open);
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Timeline Event</DialogTitle>
              <DialogDescription>
                Record a new event in this sponsor's timeline.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="event-type">Event Type</Label>
                  <Select
                    value={eventType}
                    onValueChange={setEventType}
                  >
                    <SelectTrigger id="event-type">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center">
                            {type.icon}
                            <span className="ml-2">{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Event title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Additional details about this event"
                    className="h-24 resize-none"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddEventDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Event</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Fix import issue by adding Phone icon
function Phone(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
