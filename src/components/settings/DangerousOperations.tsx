
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Download, Upload, AlertTriangle, Shield, Database, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DangerousOperations() {
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [backupFile, setBackupFile] = useState<File | null>(null);

  const handleFactoryReset = async () => {
    if (confirmText !== "DELETE ALL DATA") {
      toast({
        title: "Confirmation failed",
        description: "Please type 'DELETE ALL DATA' to confirm",
        variant: "destructive"
      });
      return;
    }

    setIsResetting(true);
    try {
      // Get current user to preserve superadmin
      const { data: { user } } = await supabase.auth.getUser();
      
      // Call the RPC function with proper error handling
      const { error } = await (supabase as any).rpc('factory_reset_all_data', {
        preserve_user_id: user?.id
      });

      if (error) throw error;

      toast({
        title: "Factory reset completed",
        description: "All data has been cleared and default academic year created",
      });
      
      setConfirmText("");
      window.location.reload();
    } catch (error: any) {
      console.error("Factory reset error:", error);
      toast({
        title: "Factory reset failed",
        description: error.message || "Failed to reset data",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleBackupData = async () => {
    setIsBackingUp(true);
    try {
      // Get all data from tables using explicit queries
      const backupData: any = {};
      
      // Query each table explicitly to avoid TypeScript issues
      const [
        studentsData,
        sponsorsData,
        examsData,
        studentExamScoresData,
        studentPhotosData,
        studentLettersData,
        timelineEventsData,
        studentRelativesData,
        academicYearsData,
        profilesData,
        appSettingsData,
        emailSettingsData,
        userRolesData,
        auditLogsData
      ] = await Promise.allSettled([
        supabase.from('students').select('*'),
        supabase.from('sponsors').select('*'),
        supabase.from('exams').select('*'),
        supabase.from('student_exam_scores').select('*'),
        supabase.from('student_photos').select('*'),
        supabase.from('student_letters').select('*'),
        supabase.from('timeline_events').select('*'),
        supabase.from('student_relatives').select('*'),
        supabase.from('academic_years').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('app_settings').select('*'),
        supabase.from('email_settings').select('*'),
        supabase.from('user_roles').select('*'),
        supabase.from('audit_logs').select('*')
      ]);

      // Process results
      if (studentsData.status === 'fulfilled' && !studentsData.value.error) {
        backupData.students = studentsData.value.data;
      }
      if (sponsorsData.status === 'fulfilled' && !sponsorsData.value.error) {
        backupData.sponsors = sponsorsData.value.data;
      }
      if (examsData.status === 'fulfilled' && !examsData.value.error) {
        backupData.exams = examsData.value.data;
      }
      if (studentExamScoresData.status === 'fulfilled' && !studentExamScoresData.value.error) {
        backupData.student_exam_scores = studentExamScoresData.value.data;
      }
      if (studentPhotosData.status === 'fulfilled' && !studentPhotosData.value.error) {
        backupData.student_photos = studentPhotosData.value.data;
      }
      if (studentLettersData.status === 'fulfilled' && !studentLettersData.value.error) {
        backupData.student_letters = studentLettersData.value.data;
      }
      if (timelineEventsData.status === 'fulfilled' && !timelineEventsData.value.error) {
        backupData.timeline_events = timelineEventsData.value.data;
      }
      if (studentRelativesData.status === 'fulfilled' && !studentRelativesData.value.error) {
        backupData.student_relatives = studentRelativesData.value.data;
      }
      if (academicYearsData.status === 'fulfilled' && !academicYearsData.value.error) {
        backupData.academic_years = academicYearsData.value.data;
      }
      if (profilesData.status === 'fulfilled' && !profilesData.value.error) {
        backupData.profiles = profilesData.value.data;
      }
      if (appSettingsData.status === 'fulfilled' && !appSettingsData.value.error) {
        backupData.app_settings = appSettingsData.value.data;
      }
      if (emailSettingsData.status === 'fulfilled' && !emailSettingsData.value.error) {
        backupData.email_settings = emailSettingsData.value.data;
      }
      if (userRolesData.status === 'fulfilled' && !userRolesData.value.error) {
        backupData.user_roles = userRolesData.value.data;
      }
      if (auditLogsData.status === 'fulfilled' && !auditLogsData.value.error) {
        backupData.audit_logs = auditLogsData.value.data;
      }

      // Create and download backup file
      const backup = {
        timestamp: new Date().toISOString(),
        version: "1.0",
        data: backupData
      };
      
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dhims-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Backup created successfully",
        description: "All data has been backed up and downloaded",
      });
    } catch (error: any) {
      console.error("Backup error:", error);
      toast({
        title: "Backup failed",
        description: error.message || "Failed to create backup",
        variant: "destructive"
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreData = async () => {
    if (!backupFile) {
      toast({
        title: "No file selected",
        description: "Please select a backup file to restore",
        variant: "destructive"
      });
      return;
    }

    setIsRestoring(true);
    try {
      const fileContent = await backupFile.text();
      const backupData = JSON.parse(fileContent);
      
      if (!backupData.data) {
        throw new Error("Invalid backup file format");
      }

      const { error } = await (supabase as any).rpc('restore_all_data', {
        backup_data: backupData.data
      });

      if (error) throw error;

      toast({
        title: "Data restored successfully",
        description: "All data has been restored from the backup",
      });
      
      setBackupFile(null);
      window.location.reload();
    } catch (error: any) {
      console.error("Restore error:", error);
      toast({
        title: "Restore failed",
        description: error.message || "Failed to restore data. Please check the backup file format.",
        variant: "destructive"
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-destructive/10 rounded-lg">
          <Shield className="h-6 w-6 text-destructive" />
        </div>
        <div className="text-left">
          <h3 className="text-2xl font-semibold text-destructive">Dangerous Operations</h3>
          <p className="text-sm text-muted-foreground">
            These operations are irreversible. Please proceed with extreme caution.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Backup Data Card */}
        <Card className="border-blue-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <CardTitle className="text-lg text-blue-700">Backup All Data</CardTitle>
                <CardDescription>
                  Create a complete backup of all system data for safekeeping
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleBackupData}
                disabled={isBackingUp}
                variant="outline"
                className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Download className="h-4 w-4 mr-2" />
                {isBackingUp ? "Creating Backup..." : "Download Backup"}
              </Button>
              <div className="text-xs text-muted-foreground self-center">
                Safe operation - No data will be deleted
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Restore Data Card */}
        <Card className="border-orange-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <RefreshCw className="h-5 w-5 text-orange-600" />
              </div>
              <div className="text-left">
                <CardTitle className="text-lg text-orange-700">Restore Data</CardTitle>
                <CardDescription>
                  Replace current data with a previously created backup
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="backup-file" className="text-sm font-medium">Select Backup File</Label>
              <Input
                id="backup-file"
                type="file"
                accept=".json"
                onChange={(e) => setBackupFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
                  disabled={!backupFile || isRestoring}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isRestoring ? "Restoring..." : "Restore Data"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-orange-700">Restore Data</AlertDialogTitle>
                  <AlertDialogDescription className="text-left">
                    This will replace all current data with the backup data. This action cannot be undone.
                    Are you sure you want to continue?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleRestoreData}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Restore Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
              ⚠️ This will overwrite all existing data
            </div>
          </CardContent>
        </Card>

        {/* Factory Reset Card */}
        <Card className="border-destructive/30 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div className="text-left">
                <CardTitle className="text-lg text-destructive">Factory Reset</CardTitle>
                <CardDescription>
                  Permanently delete ALL data and reset the system to its initial state
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  disabled={isResetting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isResetting ? "Resetting..." : "Factory Reset"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-destructive text-left">
                    Confirm Factory Reset
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3 text-left">
                    <p>
                      This will permanently delete ALL data including:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>All students and their records</li>
                      <li>All sponsors and sponsorships</li>
                      <li>All exams and scores</li>
                      <li>All photos and letters</li>
                      <li>All timeline events</li>
                      <li>All audit logs</li>
                      <li>All academic years</li>
                      <li>All settings (except basic app settings)</li>
                      <li>All user accounts (except current superadmin)</li>
                    </ul>
                    <p className="font-medium">
                      Please type "DELETE ALL DATA" to confirm:
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <Input
                    placeholder="Type: DELETE ALL DATA"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setConfirmText("")}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleFactoryReset}
                    className="bg-destructive hover:bg-destructive/90"
                    disabled={confirmText !== "DELETE ALL DATA"}
                  >
                    Factory Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="text-xs text-destructive bg-destructive/5 p-3 rounded border border-destructive/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">EXTREME CAUTION REQUIRED</span>
              </div>
              <p className="mt-1">This action cannot be undone. All data will be permanently lost.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
