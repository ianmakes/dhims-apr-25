
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCircle, Calendar, Heart } from "lucide-react";
import { format } from "date-fns";

export function RecentSponsorshipsCard() {
  const { data: recentSponsorships, isLoading } = useQuery({
    queryKey: ["recent-sponsorships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select(`
          id,
          name,
          sponsored_since,
          sponsor:sponsors(
            first_name,
            last_name
          )
        `)
        .not("sponsor_id", "is", null)
        .order("sponsored_since", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-1">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!recentSponsorships || recentSponsorships.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="h-8 w-8 text-wp-gray-300 mx-auto mb-3" />
        <p className="text-wp-text-secondary text-sm">No recent sponsorships found</p>
        <p className="text-xs text-wp-text-secondary mt-1">New sponsorships will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-1">
      {recentSponsorships.map((student) => (
        <div key={student.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-wp-gray-50 transition-colors border border-wp-gray-200 hover:border-wp-primary/20">
          <div className="h-10 w-10 bg-gradient-to-br from-wp-primary/10 to-wp-primary/20 rounded-full flex items-center justify-center">
            <UserCircle className="h-5 w-5 text-wp-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-wp-text-primary truncate">
              {student.name}
            </p>
            <p className="text-xs text-wp-text-secondary">
              Sponsored by {student.sponsor?.first_name} {student.sponsor?.last_name}
            </p>
            {student.sponsored_since && (
              <div className="flex items-center text-xs text-wp-text-secondary mt-1">
                <Calendar className="h-3 w-3 mr-1" />
                {format(new Date(student.sponsored_since), "MMM dd, yyyy")}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
