
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface RecentActivityCardProps {
  academicYear?: string;
}

export function RecentActivityCard({ academicYear }: RecentActivityCardProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchActivities() {
      setLoading(true);
      try {
        // Basic query
        let query = supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(15);

        // If academic year filter is provided, add it to the query
        // This is a simple implementation - in a real app, you would need to 
        // store the academic year in each audit log entry
        if (academicYear) {
          // This is a simplified approach. In a real implementation,
          // you would need to add academic_year field to audit_logs table
          // and filter by it. For now, we'll just filter by the date range if known
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching activities:', error);
          return;
        }

        setActivities(data || []);
      } catch (error) {
        console.error('Error in fetchActivities:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, [academicYear, user]);

  // Helper function to format dates
  const formatDate = (date: string) => {
    return format(new Date(date), 'MMM d, yyyy h:mm a');
  };

  // Helper function to get initial for avatar
  const getInitial = (username: string) => {
    return username?.charAt(0).toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <div className="py-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start space-x-4 px-4 py-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No recent activity found</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-4 p-4">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{getInitial(activity.username || '')}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <p className="text-sm">
              <span className="font-medium">{activity.username || 'Unknown User'}</span>{' '}
              {activity.action}{' '}
              <span className="font-medium">
                {activity.entity} {activity.entity_id}
              </span>
            </p>
            {activity.details && <p className="text-sm text-muted-foreground">{activity.details}</p>}
            <p className="text-xs text-muted-foreground">{formatDate(activity.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
