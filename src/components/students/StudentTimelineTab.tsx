
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

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
}

export function StudentTimelineTab({
  studentName,
  timelineEvents,
  onAddTimelineEvent,
  formatDate,
}: StudentTimelineTabProps) {
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
                <div key={event.id} className="mb-8 relative">
                  <div
                    className={`absolute -left-[10px] h-3 w-3 rounded-full border-2 
                      ${event.type === "academic"
                      ? "bg-blue-500 border-blue-300"
                      : event.type === "sponsor"
                      ? "bg-green-500 border-green-300"
                      : event.type === "personal"
                      ? "bg-yellow-500 border-yellow-300"
                      : "bg-gray-500 border-gray-300"
                    }`}
                  />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(event.date)}
                    </p>
                    <h3 className="font-medium">{event.title}</h3>
                    <p className="mt-1 text-left">{event.description}</p>
                  </div>
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
    </div>
  );
}
