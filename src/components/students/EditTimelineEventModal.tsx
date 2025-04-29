
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface EditTimelineEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: {
    id: string;
    title: string;
    description: string;
    type: string;
    date: string;
  };
  studentId: string;
  onSuccess: () => void;
}

const timelineEventSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  date: z.string().optional(),
  type: z.enum(["academic", "sponsor", "personal", "other"], {
    required_error: "Please select an event type",
  }),
});

export function EditTimelineEventModal({
  open,
  onOpenChange,
  event,
  studentId,
  onSuccess,
}: EditTimelineEventModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof timelineEventSchema>>({
    resolver: zodResolver(timelineEventSchema),
    defaultValues: {
      title: event.title,
      description: event.description || "",
      date: event.date ? new Date(event.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      type: event.type as "academic" | "sponsor" | "personal" | "other",
    },
  });

  const handleSubmit = async (values: z.infer<typeof timelineEventSchema>) => {
    try {
      // Update event in timeline events table
      const { data, error } = await supabase
        .from('timeline_events')
        .update({
          date: values.date ? new Date(values.date).toISOString() : new Date().toISOString(),
          title: values.title,
          description: values.description,
          type: values.type,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', event.id)
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Event updated",
        description: "The timeline event has been updated successfully.",
      });
      
      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating timeline event:', error);
      toast({
        title: 'Error updating event',
        description: 'Failed to update timeline event. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Timeline Event</DialogTitle>
          <DialogDescription>
            Update the details of this timeline event.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter event title" {...field} />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="sponsor">Sponsor</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                      placeholder="Enter event description" 
                      className="min-h-[80px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
