
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { 
  PlusCircle, 
  UserCheck, 
  BookOpen, 
  Settings, 
  Users, 
  UserCircle
} from "lucide-react";
import type { AcademicYear } from "@/types";

// Activity item structure
interface ActivityItem {
  id: string;
  username: string;
  action: string;
  entity: string;
  details: string;
  timestamp: Date;
}

// Map entity types to icons
const entityIcons: Record<string, React.ReactNode> = {
  "student": <Users className="h-5 w-5" />,
  "sponsor": <UserCircle className="h-5 w-5" />,
  "exam": <BookOpen className="h-5 w-5" />,
  "user": <UserCheck className="h-5 w-5" />,
  "settings": <Settings className="h-5 w-5" />,
  "other": <PlusCircle className="h-5 w-5" />
};

export function RecentActivityCard({ academicYear }: { academicYear?: AcademicYear | null }) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(8);

        // Filter by academic year if provided
        if (academicYear) {
          const startDate = new Date(academicYear.start_date);
          const endDate = new Date(academicYear.end_date);
          
          query = query
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching audit logs:", error);
          return;
        }

        if (data) {
          const formattedActivities = data.map(item => ({
            id: item.id,
            username: item.username || "System",
            action: item.action,
            entity: item.entity,
            details: item.details,
            timestamp: new Date(item.created_at)
          }));
          setActivities(formattedActivities);
        }
      } catch (error) {
        console.error("Error in fetching audit logs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentActivity();
  }, [academicYear]);

  // Helper to get the avatar fallback text
  const getAvatarFallback = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  // Helper to get icon by entity type
  const getEntityIcon = (entityType: string) => {
    const lowerType = entityType.toLowerCase();
    return entityIcons[lowerType] || entityIcons.other;
  };

  if (isLoading) {
    return (
      <div className="px-4 py-3">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 py-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <p className="text-muted-foreground mb-2">No recent activity</p>
        <p className="text-xs text-muted-foreground">
          {academicYear 
            ? `No activities found for the academic year ${academicYear.year_name}` 
            : "Activities will appear here when users make changes to the system"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0 divide-y divide-border">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start p-4 gap-3">
          <Avatar className="h-9 w-9 border border-border flex-shrink-0">
            <AvatarFallback className="bg-muted text-xs">
              {getAvatarFallback(activity.username)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none">
              <span className="font-semibold">{activity.username}</span>{" "}
              {activity.action.toLowerCase()} a{" "}
              <span className="inline-flex items-center">
                <span className="mr-1">{activity.entity.toLowerCase()}</span>
                <span className="inline-flex items-center justify-center rounded-full bg-muted p-1 w-5 h-5">
                  {getEntityIcon(activity.entity)}
                </span>
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              {activity.details}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
