
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Trash2, 
  Database, 
  RefreshCw, 
  AlertTriangle,
  Loader2,
  HardDrive
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logSystem } from "@/utils/auditLog";

interface DataWipeOption {
  id: string;
  label: string;
  description: string;
  table: string;
  dangerous: boolean;
}

const dataWipeOptions: DataWipeOption[] = [
  {
    id: "audit_logs",
    label: "Audit Logs",
    description: "Clear all system audit logs",
    table: "audit_logs",
    dangerous: false,
  },
  {
    id: "student_photos",
    label: "Student Photos",
    description: "Remove all student photos and media",
    table: "student_photos",
    dangerous: true,
  },
  {
    id: "student_letters",
    label: "Student Letters",
    description: "Remove all student letters and documents",
    table: "student_letters",
    dangerous: true,
  },
  {
    id: "timeline_events",
    label: "Timeline Events",
    description: "Clear all student timeline events",
    table: "timeline_events",
    dangerous: true,
  },
  {
    id: "student_exam_scores",
    label: "Exam Scores",
    description: "Remove all student exam scores and results",
    table: "student_exam_scores",
    dangerous: true,
  },
  {
    id: "exams",
    label: "Exams",
    description: "Delete all exam records",
    table: "exams",
    dangerous: true,
  },
];

export default function OptimizationSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [selectedDataOptions, setSelectedDataOptions] = useState<string[]>([]);
  const [factoryResetConfirmation, setFactoryResetConfirmation] = useState("");
  const [academicYearConfirmation, setAcademicYearConfirmation] = useState("");
  const [isSelectiveWipeOpen, setIsSelectiveWipeOpen] = useState(false);

  const clearCache = async () => {
    setIsLoading("cache");
    try {
      // Clear browser cache
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // Clear local storage
      localStorage.clear();
      
      // Clear session storage
      sessionStorage.clear();

      await logSystem('system', 'cache_clear', 'Cache and browser data cleared');

      toast({
        title: "Cache Cleared",
        description: "Browser cache and local data have been cleared successfully.",
      });
    } catch (error) {
      console.error("Error clearing cache:", error);
      toast({
        title: "Error",
        description: "Failed to clear cache.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  const wipeSiteData = async () => {
    setIsLoading("site");
    try {
      // Clear all browser storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear IndexedDB if available
      if ('indexedDB' in window) {
        const databases = await indexedDB.databases();
        await Promise.all(
          databases.map(db => {
            if (db.name) {
              return new Promise((resolve, reject) => {
                const deleteReq = indexedDB.deleteDatabase(db.name!);
                deleteReq.onsuccess = () => resolve(undefined);
                deleteReq.onerror = () => reject(deleteReq.error);
              });
            }
          })
        );
      }

      await logSystem('system', 'site_data_wipe', 'All site data wiped');

      toast({
        title: "Site Data Wiped",
        description: "All local site data has been cleared. Please refresh the page.",
      });

      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error wiping site data:", error);
      toast({
        title: "Error",
        description: "Failed to wipe site data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  const wipeAcademicYearData = async () => {
    if (academicYearConfirmation !== "DELETE ACADEMIC DATA") {
      toast({
        title: "Confirmation Required",
        description: "Please type 'DELETE ACADEMIC DATA' to confirm.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading("academic");
    try {
      // Delete academic year related data
      const tables = ['student_exam_scores', 'exams', 'timeline_events', 'student_photos', 'student_letters'];
      
      for (const table of tables) {
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
      }

      await logSystem('system', 'academic_data_wipe', 'All academic year data wiped');

      toast({
        title: "Academic Data Wiped",
        description: "All academic year data has been removed successfully.",
      });

      setAcademicYearConfirmation("");
    } catch (error) {
      console.error("Error wiping academic data:", error);
      toast({
        title: "Error",
        description: "Failed to wipe academic year data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  const factoryReset = async () => {
    if (factoryResetConfirmation !== "FACTORY RESET DATABASE") {
      toast({
        title: "Confirmation Required",
        description: "Please type 'FACTORY RESET DATABASE' to confirm.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading("factory");
    try {
      // List of all tables to clear (in order to avoid foreign key constraints)
      const tables = [
        'audit_logs',
        'student_exam_scores',
        'student_photos',
        'student_letters',
        'timeline_events',
        'student_relatives',
        'students',
        'sponsors',
        'exams',
        'academic_years',
        'user_roles',
      ];

      for (const table of tables) {
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
          console.warn(`Error deleting from ${table}:`, error);
        }
      }

      // Clear local storage and cache
      localStorage.clear();
      sessionStorage.clear();

      await logSystem('system', 'factory_reset', 'Complete factory reset performed');

      toast({
        title: "Factory Reset Complete",
        description: "Database has been completely reset. Redirecting to login...",
      });

      // Redirect to auth page after reset
      setTimeout(() => {
        window.location.href = '/auth';
      }, 3000);
    } catch (error) {
      console.error("Error performing factory reset:", error);
      toast({
        title: "Error",
        description: "Failed to perform factory reset.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
      setFactoryResetConfirmation("");
    }
  };

  const performSelectiveWipe = async () => {
    if (selectedDataOptions.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one data type to wipe.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading("selective");
    try {
      for (const optionId of selectedDataOptions) {
        const option = dataWipeOptions.find(opt => opt.id === optionId);
        if (option) {
          const { error } = await supabase.from(option.table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
          if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
            console.warn(`Error deleting from ${option.table}:`, error);
          }
        }
      }

      await logSystem('system', 'selective_wipe', `Selective data wipe performed on: ${selectedDataOptions.join(', ')}`);

      toast({
        title: "Selective Wipe Complete",
        description: `Successfully wiped data from ${selectedDataOptions.length} table(s).`,
      });

      setSelectedDataOptions([]);
      setIsSelectiveWipeOpen(false);
    } catch (error) {
      console.error("Error performing selective wipe:", error);
      toast({
        title: "Error",
        description: "Failed to perform selective data wipe.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">App Optimization</h3>
        <p className="text-sm text-muted-foreground">
          Manage application performance and data cleanup options.
        </p>
      </div>

      <Separator />

      {/* Cache Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Cache Management
          </CardTitle>
          <CardDescription>
            Clear cached data to improve performance and resolve loading issues.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={clearCache}
            disabled={isLoading === "cache"}
            variant="outline"
            className="w-full"
          >
            {isLoading === "cache" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Clear Browser Cache
          </Button>

          <Button 
            onClick={wipeSiteData}
            disabled={isLoading === "site"}
            variant="outline"
            className="w-full"
          >
            {isLoading === "site" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <HardDrive className="h-4 w-4 mr-2" />
            )}
            Wipe All Site Data
          </Button>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Remove specific data sets or perform bulk data operations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selective Data Wipe */}
          <Dialog open={isSelectiveWipeOpen} onOpenChange={setIsSelectiveWipeOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Selective Data Wipe
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Select Data to Wipe</DialogTitle>
                <DialogDescription>
                  Choose which data types you want to permanently delete.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {dataWipeOptions.map((option) => (
                  <div key={option.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={option.id}
                      checked={selectedDataOptions.includes(option.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedDataOptions([...selectedDataOptions, option.id]);
                        } else {
                          setSelectedDataOptions(selectedDataOptions.filter(id => id !== option.id));
                        }
                      }}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label 
                        htmlFor={option.id}
                        className={`text-sm font-medium ${option.dangerous ? 'text-red-600' : ''}`}
                      >
                        {option.label}
                        {option.dangerous && <span className="ml-1 text-red-500">⚠️</span>}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsSelectiveWipeOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={performSelectiveWipe}
                  disabled={isLoading === "selective" || selectedDataOptions.length === 0}
                >
                  {isLoading === "selective" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Wipe Selected Data
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Academic Year Data Wipe */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Wipe Academic Year Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Wipe Academic Year Data
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete ALL academic year related data including:
                  exam scores, exams, timeline events, photos, and letters.
                  <br /><br />
                  <strong>This action cannot be undone!</strong>
                  <br /><br />
                  Type <strong>"DELETE ACADEMIC DATA"</strong> to confirm:
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                value={academicYearConfirmation}
                onChange={(e) => setAcademicYearConfirmation(e.target.value)}
                placeholder="Type confirmation here..."
                className="mt-2"
              />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setAcademicYearConfirmation("")}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={wipeAcademicYearData}
                  disabled={isLoading === "academic" || academicYearConfirmation !== "DELETE ACADEMIC DATA"}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isLoading === "academic" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Wipe Academic Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-red-600">
            Irreversible actions that will permanently delete all data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full bg-red-600 hover:bg-red-700">
                <Database className="h-4 w-4 mr-2" />
                Factory Reset Database
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  FACTORY RESET DATABASE
                </AlertDialogTitle>
                <AlertDialogDescription>
                  <div className="space-y-2 text-red-600">
                    <p><strong>⚠️ EXTREME CAUTION ⚠️</strong></p>
                    <p>This will permanently delete EVERYTHING:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>All students and their data</li>
                      <li>All sponsors and sponsorship records</li>
                      <li>All exams and scores</li>
                      <li>All photos, letters, and documents</li>
                      <li>All academic years and settings</li>
                      <li>All audit logs and user data</li>
                    </ul>
                    <p><strong>THIS CANNOT BE UNDONE!</strong></p>
                    <br />
                    <p>Type <strong>"FACTORY RESET DATABASE"</strong> to confirm:</p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                value={factoryResetConfirmation}
                onChange={(e) => setFactoryResetConfirmation(e.target.value)}
                placeholder="Type confirmation here..."
                className="mt-2 border-red-300 focus:border-red-500"
              />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setFactoryResetConfirmation("")}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={factoryReset}
                  disabled={isLoading === "factory" || factoryResetConfirmation !== "FACTORY RESET DATABASE"}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isLoading === "factory" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4 mr-2" />
                  )}
                  FACTORY RESET
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
