
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, Calendar, BarChart2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { AcademicYearSelector } from "@/components/dashboard/AcademicYearSelector";

export default function Exams() {
  const [activeTab, setActiveTab] = useState("all");
  const { selectedYear } = useAcademicYear();
  
  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['exams', selectedYear?.year_name],
    queryFn: async () => {
      let query = supabase
        .from('exams')
        .select('*');
      
      // Filter by academic year if one is selected
      if (selectedYear?.year_name) {
        query = query.eq('academic_year', selectedYear.year_name);
      }

      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Exams" 
        description="Manage exam information"
        actions={
          <div className="flex items-center space-x-2">
            <AcademicYearSelector />
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Exam
            </Button>
          </div>
        }
      />
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Exams</TabsTrigger>
          <TabsTrigger value="term1">Term 1</TabsTrigger>
          <TabsTrigger value="term2">Term 2</TabsTrigger>
          <TabsTrigger value="term3">Term 3</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4 mt-4">
          {isLoading ? (
            <div>Loading exams...</div>
          ) : exams.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-lg font-medium mb-1">No exams found</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedYear 
                    ? `No exams have been recorded for the ${selectedYear.year_name} academic year.` 
                    : "No exams have been recorded yet."}
                </p>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create your first exam
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {exams.map((exam) => (
                <Card key={exam.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle>{exam.name}</CardTitle>
                    <CardDescription className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(exam.exam_date).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Term: {exam.term}</p>
                        <p className="text-sm text-muted-foreground">Academic Year: {exam.academic_year}</p>
                      </div>
                      <div className="flex items-center bg-primary/10 p-2 rounded-md">
                        <BarChart2 className="h-4 w-4 text-primary mr-1" />
                        <span className="text-sm font-medium">Results</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="term1" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Term 1 Exams</CardTitle>
              <CardDescription>View and manage Term 1 exams</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div>Loading exams...</div>
              ) : exams.filter(exam => exam.term === "1").length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No Term 1 exams found</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {exams
                    .filter(exam => exam.term === "1")
                    .map((exam) => (
                      <Card key={exam.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <CardTitle>{exam.name}</CardTitle>
                          <CardDescription>{new Date(exam.exam_date).toLocaleDateString()}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">Academic Year: {exam.academic_year}</p>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="term2" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Term 2 Exams</CardTitle>
              <CardDescription>View and manage Term 2 exams</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div>Loading exams...</div>
              ) : exams.filter(exam => exam.term === "2").length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No Term 2 exams found</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {exams
                    .filter(exam => exam.term === "2")
                    .map((exam) => (
                      <Card key={exam.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <CardTitle>{exam.name}</CardTitle>
                          <CardDescription>{new Date(exam.exam_date).toLocaleDateString()}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">Academic Year: {exam.academic_year}</p>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="term3" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Term 3 Exams</CardTitle>
              <CardDescription>View and manage Term 3 exams</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div>Loading exams...</div>
              ) : exams.filter(exam => exam.term === "3").length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No Term 3 exams found</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {exams
                    .filter(exam => exam.term === "3")
                    .map((exam) => (
                      <Card key={exam.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <CardTitle>{exam.name}</CardTitle>
                          <CardDescription>{new Date(exam.exam_date).toLocaleDateString()}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">Academic Year: {exam.academic_year}</p>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
