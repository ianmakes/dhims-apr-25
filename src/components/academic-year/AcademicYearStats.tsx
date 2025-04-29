
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useAcademicYear } from '@/contexts/AcademicYearContext';

type YearStatistics = {
  year: string;
  students: number;
  exams: number;
  sponsors: number;
  avgScore?: number; 
};

export function AcademicYearStats() {
  const [stats, setStats] = useState<YearStatistics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { academicYears } = useAcademicYear();

  useEffect(() => {
    const fetchStatistics = async () => {
      if (!academicYears.length) return;
      
      setIsLoading(true);

      try {
        // We'll limit the chart to show the 5 most recent academic years
        const yearsToShow = academicYears.slice(0, 5).reverse();
        
        const yearStats: YearStatistics[] = [];
        
        for (const year of yearsToShow) {
          // Get student count for this year
          const { count: studentCount } = await supabase
            .from('students')
            .select('id', { count: 'exact', head: true })
            .eq('current_academic_year', parseInt(year.year_name.split('-')[0]));

          // Get exam count for this year
          const { count: examCount } = await supabase
            .from('exams')
            .select('id', { count: 'exact', head: true })
            .eq('academic_year', year.year_name);
            
          // Get sponsor count for this year
          // This is an approximation since sponsors aren't directly tied to academic years
          // We count sponsors who were active during this academic year
          const { count: sponsorCount } = await supabase
            .from('sponsors')
            .select('id', { count: 'exact', head: true })
            .lt('start_date', year.end_date);

          // Get average exam scores for this year
          const { data: examScores } = await supabase
            .from('student_exam_scores')
            .select('score, exam_id')
            .in('exam_id', 
              supabase
                .from('exams')
                .select('id')
                .eq('academic_year', year.year_name)
            );

          const avgScore = examScores?.length 
            ? Math.round(examScores.reduce((sum, item) => sum + (item.score || 0), 0) / examScores.length)
            : undefined;

          yearStats.push({
            year: year.year_name,
            students: studentCount || 0,
            exams: examCount || 0,
            sponsors: sponsorCount || 0,
            avgScore
          });
        }

        setStats(yearStats);
      } catch (error) {
        console.error('Error fetching academic year statistics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatistics();
  }, [academicYears]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Academic Year Statistics</CardTitle>
          <CardDescription>Comparing key metrics across academic years</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-80 flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Academic Year Statistics</CardTitle>
        <CardDescription>Comparing key metrics across academic years</CardDescription>
      </CardHeader>
      <CardContent>
        {stats.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={stats}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="students" name="Students" fill="#8884d8" />
              <Bar yAxisId="left" dataKey="exams" name="Exams" fill="#82ca9d" />
              <Bar yAxisId="left" dataKey="sponsors" name="Sponsors" fill="#ffc658" />
              {stats.some(stat => stat.avgScore !== undefined) && (
                <Bar yAxisId="right" dataKey="avgScore" name="Avg Exam Score" fill="#ff7300" />
              )}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            No statistical data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
