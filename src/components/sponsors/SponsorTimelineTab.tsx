
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, PlusCircle, Trash2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.string().min(1, "Type is required")
});

type TimelineFormValues = z.infer<typeof formSchema>;

interface SponsorTimelineEvent {
  id: string;
  title: string;
  description?: string;
  type: string;
  date: string;
  sponsor_id: string;
  student_id?: string;
}

interface SponsorTimelineTabProps {
  timelineEvents: SponsorTimelineEvent[];
  isLoading: boolean;
  onAddTimelineEvent: (data: TimelineFormValues) => void;
  onUpdateTimelineEvent: (data: Partial<SponsorTimelineEvent> & { id: string }) => void;
  onDeleteTimelineEvent: (id: string) => void;
}

export function SponsorTimelineTab({ 
  timelineEvents, 
  isLoading, 
  onAddTimelineEvent,
  onUpdateTimelineEvent,
  onDeleteTimelineEvent
}: SponsorTimelineTabProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SponsorTimelineEvent | null>(null);

  const form = useForm<TimelineFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "general"
    }
  });

  const editForm = useForm<TimelineFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "general"
    }
  });

  const handleAddDialogOpen = () => {
    form.reset({
      title: "",
      description: "",
      type: "general"
    });
    setIsAddModalOpen(true);
  };

  const handleEditDialogOpen = (event: SponsorTimelineEvent) => {
    setSelectedEvent(event);
    editForm.reset({
      title: event.title,
      description: event.description || "",
      type: event.type
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteDialogOpen = (event: SponsorTimelineEvent) => {
    setSelectedEvent(event);
    setIsDeleteDialogOpen(true);
  };

  const handleAddSubmit = (values: TimelineFormValues) => {
    onAddTimelineEvent(values);
    setIsAddModalOpen(false);
  };

  const handleEditSubmit = (values: TimelineFormValues) => {
    if (selectedEvent) {
      onUpdateTimelineEvent({
        id: selectedEvent.id,
        ...values
      });
      setIsEditModalOpen(false);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedEvent) {
      onDeleteTimelineEvent(selectedEvent.id);
      setIsDeleteDialogOpen(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(date);
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "student_assignment":
        return "bg-green-500 border-green-300";
      case "student_removal":
        return "bg-red-500 border-red-300";
      case "communication":
        return "bg-blue-500 border-blue-300";
      case "payment":
        return "bg-yellow-500 border-yellow-300";
      default:
        return "bg-gray-500 border-gray-300";
    }
  };

  if (isLoading) {
    return <div>Loading timeline...</div>;
  }

  return (
    <div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Sponsor Timeline</CardTitle>
            <CardDescription>Activity history for this sponsor</CardDescription>
          </div>
          <Button onClick={handleAddDialogOpen}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </CardHeader>
        <CardContent>
          {timelineEvents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No timeline events yet</p>
              <Button onClick={handleAddDialogOpen}>Add First Event</Button>
            </div>
          ) : (
            <div className="relative border-l border-wp-border pl-6 ml-4">
              {timelineEvents.map(event => (
                <div key={event.id} className="mb-8 relative">
                  <div className={`absolute -left-[10px] h-3 w-3 rounded-full border-2 ${getEventTypeColor(event.type)}`} />
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-muted-foreground">{formatDate(event.date)}</p>
                        <h3 className="font-medium">{event.title}</h3>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditDialogOpen(event)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit event</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteDialogOpen(event)}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete event</span>
                        </Button>
                      </div>
                    </div>
                    {event.description && (
                      <p className="mt-1">{event.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Timeline Event Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Timeline Event</DialogTitle>
            <DialogDescription>
              Create a new event for the sponsor's timeline
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Event title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Event details (optional)" 
                        {...field} 
                        value={field.value || ""} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="communication">Communication</SelectItem>
                        <SelectItem value="payment">Payment</SelectItem>
                        <SelectItem value="student_assignment">Student Assignment</SelectItem>
                        <SelectItem value="student_removal">Student Removal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Event</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Timeline Event Dialog */}
      {selectedEvent && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Timeline Event</DialogTitle>
              <DialogDescription>
                Update the event details
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Event title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Event details (optional)" 
                          {...field} 
                          value={field.value || ""} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="communication">Communication</SelectItem>
                          <SelectItem value="payment">Payment</SelectItem>
                          <SelectItem value="student_assignment">Student Assignment</SelectItem>
                          <SelectItem value="student_removal">Student Removal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Timeline Event Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Timeline Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
