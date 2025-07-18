
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Download, Filter, MoreHorizontal, Search, RotateCcw, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logRestore } from "@/utils/auditLog";

interface AuditLog {
  id: string;
  username: string;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string;
  details: string;
  ip_address: string | null;
  created_at: string;
}

export default function AuditLogSettings() {
  const { toast } = useToast();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [filters, setFilters] = useState<{
    action: string[];
    entity: string[];
    date: string;
  }>({
    action: [],
    entity: [],
    date: "all"
  });

  // Get unique actions and entities for filters
  const uniqueActions = [...new Set(auditLogs.map(log => log.action))].sort();
  const uniqueEntities = [...new Set(auditLogs.map(log => log.entity))].sort();

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setAuditLogs(data);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ["ID", "User", "Action", "Entity", "Entity ID", "Details", "IP Address", "Timestamp"].join(","),
      ...filteredLogs.map(log => [
        log.id,
        log.username,
        log.action,
        log.entity,
        log.entity_id,
        `"${log.details?.replace(/"/g, '""') || ""}"`,
        log.ip_address || "",
        new Date(log.created_at).toLocaleString()
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `audit-logs-export-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRestore = async () => {
    if (!selectedLog) return;
    
    setIsRestoring(true);
    try {
      // This is a simplified restore functionality
      // In a real implementation, you'd need to determine what data to restore based on the audit log
      
      // For now, we'll just log the restore action
      await logRestore(
        selectedLog.entity,
        selectedLog.entity_id,
        `Restored to state from ${new Date(selectedLog.created_at).toLocaleString()}: ${selectedLog.details}`
      );
      
      toast({
        title: "Restore Point Created",
        description: `A restore point has been logged. The system state has been noted for ${new Date(selectedLog.created_at).toLocaleString()}.`,
      });
      
      setShowRestoreDialog(false);
      setSelectedLog(null);
      await fetchAuditLogs();
      
    } catch (error: any) {
      console.error("Error creating restore point:", error);
      toast({
        title: "Error",
        description: `Failed to create restore point: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsRestoring(false);
    }
  };

  // Toggle filter selection
  const toggleActionFilter = (action: string) => {
    setFilters(prev => ({
      ...prev,
      action: prev.action.includes(action)
        ? prev.action.filter(a => a !== action)
        : [...prev.action, action]
    }));
  };

  const toggleEntityFilter = (entity: string) => {
    setFilters(prev => ({
      ...prev,
      entity: prev.entity.includes(entity)
        ? prev.entity.filter(e => e !== entity)
        : [...prev.entity, entity]
    }));
  };

  // Apply date filtering
  const getDateFilteredLogs = (logs: AuditLog[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (filters.date) {
      case "today":
        return logs.filter(log => new Date(log.created_at) >= today);
      case "yesterday":
        return logs.filter(log => 
          new Date(log.created_at) >= yesterday && new Date(log.created_at) < today
        );
      case "thisWeek":
        return logs.filter(log => new Date(log.created_at) >= thisWeekStart);
      case "thisMonth":
        return logs.filter(log => new Date(log.created_at) >= thisMonthStart);
      default:
        return logs;
    }
  };

  // Filter logs based on search term and filters
  const filteredLogs = getDateFilteredLogs(auditLogs).filter(log => {
    // Apply search filter
    const searchMatch = searchTerm === "" || 
      log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip_address?.toLowerCase().includes(searchTerm.toLowerCase());

    // Apply action filter
    const actionMatch = filters.action.length === 0 || filters.action.includes(log.action);

    // Apply entity filter  
    const entityMatch = filters.entity.length === 0 || filters.entity.includes(log.entity);

    return searchMatch && actionMatch && entityMatch;
  });

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getActionBadgeColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "create":
        return "bg-green-100 text-green-800";
      case "update":
        return "bg-blue-100 text-blue-800";
      case "delete":
        return "bg-red-100 text-red-800";
      case "login":
        return "bg-purple-100 text-purple-800";
      case "logout":
        return "bg-gray-100 text-gray-800";
      case "restore":
        return "bg-orange-100 text-orange-800";
      case "system":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-left">Audit Logs</h3>
        <p className="text-muted-foreground text-sm text-left">
          View system activity logs and user actions. Create restore points for system recovery.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 min-w-[280px] max-w-sm">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-10"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10">
                <Filter className="h-3.5 w-3.5 mr-2" />
                Actions
                {filters.action.length > 0 && (
                  <Badge className="ml-1 bg-primary" variant="secondary">
                    {filters.action.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {uniqueActions.map((action) => (
                <DropdownMenuItem
                  key={action}
                  onSelect={(e) => {
                    e.preventDefault();
                    toggleActionFilter(action);
                  }}
                  className="flex items-center gap-2"
                >
                  <Checkbox
                    id={`action-${action}`}
                    checked={filters.action.includes(action)}
                  />
                  <span>{action}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10">
                <Filter className="h-3.5 w-3.5 mr-2" />
                Entities
                {filters.entity.length > 0 && (
                  <Badge className="ml-1 bg-primary" variant="secondary">
                    {filters.entity.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {uniqueEntities.map((entity) => (
                <DropdownMenuItem
                  key={entity}
                  onSelect={(e) => {
                    e.preventDefault();
                    toggleEntityFilter(entity);
                  }}
                  className="flex items-center gap-2"
                >
                  <Checkbox
                    id={`entity-${entity}`}
                    checked={filters.entity.includes(entity)}
                  />
                  <span>{entity}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Select 
            value={filters.date} 
            onValueChange={(value) => setFilters(prev => ({ ...prev, date: value }))}
          >
            <SelectTrigger className="w-[140px] h-10">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="thisWeek">This week</SelectItem>
              <SelectItem value="thisMonth">This month</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={handleExport} className="h-10">
            <Download className="h-3.5 w-3.5 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead className="hidden md:table-cell">Details</TableHead>
              <TableHead className="hidden md:table-cell">IP Address</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Loading audit logs...
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.username}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getActionBadgeColor(log.action)}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.entity}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-xs truncate">
                    {log.details}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {log.ip_address}
                  </TableCell>
                  <TableCell>{formatDate(log.created_at)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedLog(log);
                          }}
                        >
                          View details
                        </DropdownMenuItem>
                        {log.action !== 'restore' && (
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedLog(log);
                              setShowRestoreDialog(true);
                            }}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Create restore point
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Log Details Dialog */}
      <Dialog open={!!selectedLog && !showRestoreDialog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about this audit log entry.
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">User</label>
                  <p className="text-sm text-muted-foreground">{selectedLog.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Action</label>
                  <p className="text-sm text-muted-foreground">{selectedLog.action}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Entity</label>
                  <p className="text-sm text-muted-foreground">{selectedLog.entity}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Entity ID</label>
                  <p className="text-sm text-muted-foreground">{selectedLog.entity_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">IP Address</label>
                  <p className="text-sm text-muted-foreground">{selectedLog.ip_address || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Timestamp</label>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedLog.created_at)}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Details</label>
                <p className="text-sm text-muted-foreground mt-1 break-words">{selectedLog.details}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLog(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create Restore Point</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3">
                <p>
                  This will create a restore point based on the selected audit log entry:
                </p>
                {selectedLog && (
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm"><strong>Action:</strong> {selectedLog.action}</p>
                    <p className="text-sm"><strong>Entity:</strong> {selectedLog.entity}</p>
                    <p className="text-sm"><strong>Time:</strong> {formatDate(selectedLog.created_at)}</p>
                    <p className="text-sm"><strong>Details:</strong> {selectedLog.details}</p>
                  </div>
                )}
                <div className="flex items-start space-x-2 text-amber-600">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">
                    Note: This creates a reference point for future system recovery. 
                    Actual data restoration would require additional implementation.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowRestoreDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRestore}
              disabled={isRestoring}
            >
              {isRestoring ? "Creating..." : "Create Restore Point"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
