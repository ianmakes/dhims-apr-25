import { ActivityIcon, BookOpen, Clock, UserCircle, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
type ActivityType = "student" | "sponsor" | "exam" | "system";
interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: Date;
  user: {
    name: string;
    avatar?: string;
  };
}
interface RecentActivityCardProps {
  activities?: Activity[];
  className?: string;
}
export function RecentActivityCard({
  activities,
  className
}: RecentActivityCardProps) {
  // Provide mock data if activities are not provided
  const displayActivities = activities || [{
    id: "1",
    type: "student",
    title: "New student registered",
    description: "John Doe has been registered as a new student",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    // 2 hours ago
    user: {
      name: "Admin User"
    }
  }, {
    id: "2",
    type: "sponsor",
    title: "New sponsor added",
    description: "Jane Smith has been added as a new sponsor",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    // 1 day ago
    user: {
      name: "Admin User"
    }
  }, {
    id: "3",
    type: "exam",
    title: "Exam results updated",
    description: "Term 2 exam results have been added to the system",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    // 3 days ago
    user: {
      name: "Teacher User"
    }
  }, {
    id: "4",
    type: "system",
    title: "System maintenance",
    description: "System was updated to the latest version",
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    // 7 days ago
    user: {
      name: "System"
    }
  }];
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "student":
        return <Users className="h-4 w-4" />;
      case "sponsor":
        return <UserCircle className="h-4 w-4" />;
      case "exam":
        return <BookOpen className="h-4 w-4" />;
      case "system":
        return <ActivityIcon className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };
  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case "student":
        return "bg-blue-100 text-blue-700 dark:bg-blue-700/20 dark:text-blue-400";
      case "sponsor":
        return "bg-green-100 text-green-700 dark:bg-green-700/20 dark:text-green-400";
      case "exam":
        return "bg-purple-100 text-purple-700 dark:bg-purple-700/20 dark:text-purple-400";
      case "system":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-700/20 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700/20 dark:text-gray-400";
    }
  };
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true
    }).format(date);
  };
  return <Card className={cn("transition-all-medium h-full card-hover", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-left">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="overflow-auto max-h-[400px]">
        <div className="space-y-5">
          {displayActivities.map(activity => <div key={activity.id} className="flex items-start space-x-3">
              <div className={cn("flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full", getActivityColor(activity.type))}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="space-y-1 flex-1">
                <p className="font-medium text-sm text-left">{activity.title}</p>
                <p className="text-xs text-muted-foreground text-left">
                  {activity.description}
                </p>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>by {activity.user.name}</span>
                  <span>{formatDate(activity.timestamp)}</span>
                </div>
              </div>
            </div>)}
        </div>
      </CardContent>
    </Card>;
}