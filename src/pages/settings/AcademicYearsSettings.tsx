import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Edit, Trash2, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { type AcademicYear } from "@/types/exam";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AcademicYearsSettings() {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [newYear, setNewYear] = useState({ year_name: "", start_date: "", end_date: "" });
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [yearToDelete, setYearToDelete] = useState<AcademicYear | null>(null);
  const [dataDeleteDialogOpen, setDataDeleteDialogOpen] = useState(false);
  const [selectedYearForDataDeletion, setSelectedYearForDataDeletion] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  const fetchAcademicYears = async () => {
    try {
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setAcademicYears(data || []);
    } catch (error) {
      console.error('Error fetching academic years:', error);
      toast({
        title: "Error",
        description: "Failed to fetch academic years",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYear.year_name || !newYear.start_date || !newYear.end_date) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('academic_years')
        .insert([{
          year_name: newYear.year_name,
          start_date: newYear.start_date,
          end_date: newYear.end_date,
          is_current: false
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Academic year created successfully"
      });

      setNewYear({ year_name: "", start_date: "", end_date: "" });
      fetchAcademicYears();
    } catch (error) {
      console.error('Error creating academic year:', error);
      toast({
        title: "Error",
        description: "Failed to create academic year",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (year: AcademicYear) => {
    if (!editingYear) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('academic_years')
        .update({
          year_name: editingYear.year_name,
          start_date: editingYear.start_date,
          end_date: editingYear.end_date
        })
        .eq('id', year.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Academic year updated successfully"
      });

      setEditingYear(null);
      fetchAcademicYears();
    } catch (error) {
      console.error('Error updating academic year:', error);
      toast({
        title: "Error",
        description: "Failed to update academic year",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!yearToDelete) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('academic_years')
        .delete()
        .eq('id', yearToDelete.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Academic year deleted successfully"
      });

      setDeleteDialogOpen(false);
      setYearToDelete(null);
      fetchAcademicYears();
    } catch (error) {
      console.error('Error deleting academic year:', error);
      toast({
        title: "Error",
        description: "Failed to delete academic year",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataDeletion = async () => {
    if (!selectedYearForDataDeletion) return;

    setIsLoading(true);
    try {
      // Delete data from tables that track academic years
      const tables = [
        'student_exam_scores',
        'student_photos',
        'student_letters',
        'timeline_events'
      ];

      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('academic_year_recorded', selectedYearForDataDeletion);

        if (error) {
          console.error(`Error deleting from ${table}:`, error);
          throw error;
        }
      }

      toast({
        title: "Success",
        description: `All data for academic year ${selectedYearForDataDeletion} has been deleted successfully`
      });

      setDataDeleteDialogOpen(false);
      setSelectedYearForDataDeletion("");
    } catch (error) {
      console.error('Error deleting academic year data:', error);
      toast({
        title: "Error",
        description: "Failed to delete academic year data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Academic Year
          </CardTitle>
          <CardDescription>
            Add a new academic year to the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="year_name">Year Name</Label>
                <Input
                  id="year_name"
                  placeholder="e.g., 2024-2025"
                  value={newYear.year_name}
                  onChange={(e) => setNewYear({ ...newYear, year_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={newYear.start_date}
                  onChange={(e) => setNewYear({ ...newYear, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={newYear.end_date}
                  onChange={(e) => setNewYear({ ...newYear, end_date: e.target.value })}
                />
              </div>
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Academic Year"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Academic Years
          </CardTitle>
          <CardDescription>
            Manage existing academic years
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {academicYears.map((year) => (
              <div key={year.id} className="flex items-center justify-between p-4 border rounded-lg">
                {editingYear?.id === year.id ? (
                  <div className="flex-1 grid grid-cols-3 gap-2 mr-4">
                    <Input
                      value={editingYear.year_name}
                      onChange={(e) => setEditingYear({ ...editingYear, year_name: e.target.value })}
                    />
                    <Input
                      type="date"
                      value={editingYear.start_date}
                      onChange={(e) => setEditingYear({ ...editingYear, start_date: e.target.value })}
                    />
                    <Input
                      type="date"
                      value={editingYear.end_date}
                      onChange={(e) => setEditingYear({ ...editingYear, end_date: e.target.value })}
                    />
                  </div>
                ) : (
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{year.year_name}</h3>
                      {year.is_current && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(year.start_date).toLocaleDateString()} - {new Date(year.end_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  {editingYear?.id === year.id ? (
                    <>
                      <Button size="sm" onClick={() => handleEdit(year)} disabled={isLoading}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingYear(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingYear(year)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setYearToDelete(year);
                          setDeleteDialogOpen(true);
                        }}
                        disabled={year.is_current}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Management Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Clean up data from specific academic years to maintain database performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">⚠️ Warning</h4>
            <p className="text-sm text-yellow-700">
              Deleting academic year data will permanently remove all student exam scores, photos, letters, and timeline events for the selected year. This action cannot be undone.
            </p>
          </div>
          
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="year-select">Select Academic Year</Label>
              <Select value={selectedYearForDataDeletion} onValueChange={setSelectedYearForDataDeletion}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears
                    .filter(year => !year.is_current) // Don't allow deletion of current year data
                    .map((year) => (
                      <SelectItem key={year.id} value={year.year_name}>
                        {year.year_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="destructive"
              onClick={() => setDataDeleteDialogOpen(true)}
              disabled={!selectedYearForDataDeletion || isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Year Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Academic Year Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Academic Year</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the academic year "{yearToDelete?.year_name}"? 
              This will only remove the academic year record, not the associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Academic Year Data Dialog */}
      <AlertDialog open={dataDeleteDialogOpen} onOpenChange={setDataDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Academic Year Data</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete ALL data for academic year "{selectedYearForDataDeletion}"? 
              This will remove:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Student exam scores</li>
                <li>Student photos</li>
                <li>Student letters</li>
                <li>Timeline events</li>
              </ul>
              <strong className="text-destructive">This action cannot be undone!</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDataDeletion} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
