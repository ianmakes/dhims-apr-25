
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Loader2 } from 'lucide-react';

interface YearStats {
  year: string;
  studentCount: number;
  sponsorCount: number;
}

export function AcademicYearStats() {
  const { academicYears, selectedYear } = useAcademicYear();

  // Get statistics for all academic years for comparison
  const { data: yearStats, isLoading } = useQuery({
    queryKey: ['year-stats', academicYears.map(y => y.id)],
    queryFn: async () => {
      if (!academicYears.length) return [];

      // Get stats for each year
      const statsPromises = academicYears.map(async (year) => {
        // Student count for this academic year
        const { count: studentCount, error: studentError } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('current_academic_year', parseInt(year.year_name));

        // Sponsor count for this academic year (sponsors who started in this year)
        const { count: sponsorCount, error: sponsorError } = await supabase
          .from('sponsors')
          .select('*', { count: 'exact', head: true })
          .gte('start_date', year.start_date)
          .lte('start_date', year.end_date);

        if (studentError) throw studentError;
        if (sponsorError) throw sponsorError;

        return {
          year: year.year_name,
          studentCount: studentCount || 0,
          sponsorCount: sponsorCount || 0,
          isSelected: selectedYear?.id === year.id,
          isCurrent: year.is_current
        };
      });

      const results = await Promise.all(statsPromises);
      return results.sort((a, b) => a.year.localeCompare(b.year));
    },
    enabled: academicYears.length > 0,
  });

  // Format chart data
  const chartData = yearStats?.map(stat => ({
    name: stat.year,
    Students: stat.studentCount,
    Sponsors: stat.sponsorCount
  })) || [];

  // Find selected year's stats
  const selectedYearStats = yearStats?.find(stat => 
    selectedYear?.year_name === stat.year
  );

  if (isLoading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-left">Academic Year Statistics</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center min-h-72">
          <Loader2 className="h-8 w-8 text-wp-primary animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-medium text-left">Academic Year Statistics</CardTitle>
          {selectedYear && (
            <p className="text-sm text-muted-foreground">
              Academic Year {selectedYear.year_name} ({selectedYear.start_date.split('T')[0]} to {selectedYear.end_date.split('T')[0]})
            </p>
          )}
        </div>
        <div className="text-right">
          {selectedYearStats && (
            <>
              <p className="text-2xl font-bold">{selectedYearStats.studentCount}</p>
              <p className="text-sm text-muted-foreground">Students Enrolled</p>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer 
          className="h-80" 
          config={{
            students: {
              label: "Students",
              theme: {
                light: "#9b87f5",
                dark: "#9b87f5"
              }
            },
            sponsors: {
              label: "Sponsors",
              theme: {
                light: "#7E69AB",
                dark: "#7E69AB"
              }
            }
          }}
        >
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="Students" name="students" fill="var(--color-students)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Sponsors" name="sponsors" fill="var(--color-sponsors)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
