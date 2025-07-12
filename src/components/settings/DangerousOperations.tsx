
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
import { Trash2, Download, Upload, AlertTriangle } from "lucide-react";
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
        description: "All data has been cleared successfully",
      });
      
      setConfirmText("");
      window.location.reload(); // Refresh to show clean state
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
      const { data, error } = await (supabase as any).rpc('backup_all_data');
      
      if (error) throw error;

      // Create and download backup file
      const backupData = {
        timestamp: new Date().toISOString(),
        data: data
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
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
        title: "Backup created",
        description: "All data has been backed up successfully",
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
        title: "Data restored",
        description: "All data has been restored successfully",
      });
      
      setBackupFile(null);
      window.location.reload(); // Refresh to show restored state
    } catch (error: any) {
      console.error("Restore error:", error);
      toast({
        title: "Restore failed",
        description: error.message || "Failed to restore data",
        variant: "destructive"
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Card className="border-destructive/20 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-lg text-destructive">Dangerous Operations</CardTitle>
        </div>
        <CardDescription>
          These operations are irreversible. Please proceed with extreme caution.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Backup Data */}
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium">Backup All Data</h4>
            <p className="text-sm text-muted-foreground">
              Download a complete backup of all system data
            </p>
          </div>
          <Button 
            onClick={handleBackupData}
            disabled={isBackingUp}
            variant="outline"
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            {isBackingUp ? "Creating Backup..." : "Backup All Data"}
          </Button>
        </div>

        {/* Restore Data */}
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium">Restore Data</h4>
            <p className="text-sm text-muted-foreground">
              Restore system data from a backup file
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="backup-file">Select Backup File</Label>
            <Input
              id="backup-file"
              type="file"
              accept=".json"
              onChange={(e) => setBackupFile(e.target.files?.[0] || null)}
            />
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full"
                disabled={!backupFile || isRestoring}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isRestoring ? "Restoring..." : "Restore Data"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Restore Data</AlertDialogTitle>
                <AlertDialogDescription>
                  This will replace all current data with the backup data. This action cannot be undone.
                  Are you sure you want to continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRestoreData}>
                  Restore Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Factory Reset */}
        <div className="space-y-3 pt-3 border-t border-destructive/20">
          <div>
            <h4 className="text-sm font-medium text-destructive">Factory Reset</h4>
            <p className="text-sm text-muted-foreground">
              Permanently delete ALL data including students, sponsors, exams, settings, and audit logs. 
              Only the current superadmin account will be preserved.
            </p>
          </div>
          
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
                <AlertDialogTitle className="text-destructive">
                  Confirm Factory Reset
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
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
                    This action cannot be undone. Please type "DELETE ALL DATA" to confirm:
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
        </div>
      </CardContent>
    </Card>
  );
}
