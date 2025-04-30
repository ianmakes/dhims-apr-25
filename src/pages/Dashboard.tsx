
import React from 'react';
import { StatsCard } from '../components/dashboard/StatsCard';
import { RecentActivityCard } from '../components/dashboard/RecentActivityCard';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { AcademicYearLabel } from '@/components/common/AcademicYearLabel';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { selectedAcademicYear } = useAcademicYear();
  
  // Fetch data based on selected academic year
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dashboard-stats', selectedAcademicYear?.id],
    queryFn: async () => {
      if (!selectedAcademicYear) return { students: 0, sponsors: 0, exams: 0 };
      
      const currentYear = parseInt(selectedAcademicYear.year_name.split('-')[0]);
      
      // Get student count
      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('current_academic_year', currentYear);
      
      // Get sponsor count (approximate: sponsors active during the academic year)
      const { count: sponsorCount } = await supabase
        .from('sponsors')
        .select('*', { count: 'exact', head: true })
        .lte('start_date', selectedAcademicYear.end_date)
        .or(`end_date.is.null,end_date.gt.${selectedAcademicYear.start_date}`);
      
      // Get exam count for this academic year
      const { count: examCount } = await supabase
        .from('exams')
        .select('*', { count: 'exact', head: true })
        .eq('academic_year', selectedAcademicYear.year_name);

      return {
        students: studentCount || 0,
        sponsors: sponsorCount || 0,
        exams: examCount || 0
      };
    },
    enabled: !!selectedAcademicYear
  });
  
  return (
    <div className="fade-in p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          Dashboard
          <AcademicYearLabel />
        </h1>
        <p className="text-muted-foreground">
          Welcome to David's Hope International School Management System
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isStatsLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <StatsCard 
              title="Students"
              value={stats?.students || 0}
              description={`Active students for ${selectedAcademicYear?.year_name || 'current year'}`}
              icon="student"
            />
            <StatsCard 
              title="Sponsors"
              value={stats?.sponsors || 0}
              description="Active sponsors"
              icon="sponsor"
            />
            <StatsCard 
              title="Exams"
              value={stats?.exams || 0}
              description={`Exams for ${selectedAcademicYear?.year_name || 'current year'}`}
              icon="exam"
            />
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Fixed: Pass selectedAcademicYear.id directly if it exists */}
        <RecentActivityCard />
        {/* Additional dashboard components can go here */}
      </div>
    </div>
  );
}
