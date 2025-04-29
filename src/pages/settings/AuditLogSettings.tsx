
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Filter, Search, Download, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface AuditLog {
  id: string;
  username: string;
  user_id: string;
  action: string;
  entity: string;
  entity_id: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export default function AuditLogSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Filters
  const [actionFilter, setActionFilter] = useState<string>("");
  const [entityFilter, setEntityFilter] = useState<string>("");
  const [userFilter, setUserFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  // Filter options
  const [actionOptions, setActionOptions] = useState<string[]>([]);
  const [entityOptions, setEntityOptions] = useState<string[]>([]);
  const [userOptions, setUserOptions] = useState<string[]>([]);
  
  const fetchAuditLogs = async () => {
    try {
      setIsLoading(true);
      
      // Using rpc to avoid type issues
      const { data, error, count } = await supabase
        .rpc('get_audit_logs', {
          p_action: actionFilter || null,
          p_entity: entityFilter || null,
          p_user_id: userFilter || null,
          p_start_date: startDate?.toISOString() || null,
          p_end_date: endDate ? new Date(endDate.setHours(23, 59, 59, 999)).toISOString() : null,
          p_limit: pageSize,
          p_offset: (page - 1) * pageSize
        });
      
      if (error) throw error;
      
      if (data) {
        setAuditLogs(data as AuditLog[]);
        setFilteredLogs(data as AuditLog[]);
        
        // Get total count for pagination
        const { count: totalCount, error: countError } = await supabase
          .rpc('count_audit_logs', {
            p_action: actionFilter || null,
            p_entity: entityFilter || null,
            p_user_id: userFilter || null,
            p_start_date: startDate?.toISOString() || null,
            p_end_date: endDate ? new Date(endDate.setHours(23, 59, 59, 999)).toISOString() : null
          });
        
        if (countError) throw countError;
        
        // Calculate total pages
        if (totalCount) {
          setTotalPages(Math.ceil(totalCount / pageSize));
        }
      }
      
      // Load filter options
      loadFilterOptions();
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch audit logs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadFilterOptions = async () => {
    try {
      // Get unique actions
      const { data: actionData } = await supabase
        .rpc('get_distinct_audit_log_actions');
      
      if (actionData) {
        const uniqueActions = actionData.filter(Boolean).sort();
        setActionOptions(uniqueActions as string[]);
      }
      
      // Get unique entities
      const { data: entityData } = await supabase
        .rpc('get_distinct_audit_log_entities');
      
      if (entityData) {
        const uniqueEntities = entityData.filter(Boolean).sort();
        setEntityOptions(uniqueEntities as string[]);
      }
      
      // Get unique users
      const { data: userData } = await supabase
        .rpc('get_distinct_audit_log_users');
      
      if (userData) {
        const uniqueUsers = userData.filter(Boolean).sort();
        setUserOptions(uniqueUsers as string[]);
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };
  
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredLogs(auditLogs);
      return;
    }
    
    const filtered = auditLogs.filter(log => 
      log.username?.toLowerCase().includes(term.toLowerCase()) ||
      log.action?.toLowerCase().includes(term.toLowerCase()) ||
      log.entity?.toLowerCase().includes(term.toLowerCase()) ||
      log.details?.toLowerCase().includes(term.toLowerCase()) ||
      log.entity_id?.toLowerCase().includes(term.toLowerCase()) ||
      log.ip_address?.toLowerCase().includes(term.toLowerCase())
    );
    
    setFilteredLogs(filtered);
  };
  
  const handleExport = () => {
    try {
      const headers = ["User", "Action", "Entity", "Entity ID", "Details", "IP Address", "Timestamp"];
      
      const csvContent = [
        headers.join(','),
        ...filteredLogs.map(log => [
          `"${log.username || ""}"`,
          `"${log.action || ""}"`,
          `"${log.entity || ""}"`,
          `"${log.entity_id || ""}"`,
          `"${log.details || ""}"`,
          `"${log.ip_address || ""}"`,
          `"${log.created_at ? format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss') : ""}"`
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export successful",
        description: "Audit logs have been exported to CSV.",
      });
    } catch (error: any) {
      console.error('Error exporting logs:', error);
      toast({
        title: "Export failed",
        description: error.message || "Failed to export audit logs",
        variant: "destructive",
      });
    }
  };
  
  const resetFilters = () => {
    setActionFilter("");
    setEntityFilter("");
    setUserFilter("");
    setStartDate(undefined);
    setEndDate(undefined);
    setSearchTerm("");
    setPage(1);
  };
  
  const getActionBadgeColor = (action: string) => {
    switch (action?.toLowerCase()) {
      case 'create':
      case 'created':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'update':
      case 'updated':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'delete':
      case 'deleted':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'login':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'logout':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  useEffect(() => {
    fetchAuditLogs();
  }, [page, pageSize, actionFilter, entityFilter, userFilter, startDate, endDate]);
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Audit Logs</h3>
        <p className="text-sm text-muted-foreground">
          View and search system activity logs.
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex-1 w-full md:max-w-sm relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search audit logs..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
              <div className="space-y-4">
                <h4 className="font-medium">Filter Audit Logs</h4>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Action</label>
                  <Select
                    value={actionFilter}
                    onValueChange={setActionFilter}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Actions</SelectItem>
                      {actionOptions.map((action) => (
                        <SelectItem key={action} value={action}>
                          {action}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Entity</label>
                  <Select
                    value={entityFilter}
                    onValueChange={setEntityFilter}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select entity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Entities</SelectItem>
                      {entityOptions.map((entity) => (
                        <SelectItem key={entity} value={entity}>
                          {entity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">User</label>
                  <Select
                    value={userFilter}
                    onValueChange={setUserFilter}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Users</SelectItem>
                      {userOptions.map((user) => (
                        <SelectItem key={user} value={user}>
                          {user}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <div className="flex flex-col space-y-2">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">From</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal h-9"
                          >
                            {startDate ? format(startDate, 'PP') : 'Select date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">To</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal h-9"
                          >
                            {endDate ? format(endDate, 'PP') : 'Select date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={resetFilters}
                >
                  Reset Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" onClick={fetchAuditLogs}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[100px] h-9">
              <SelectValue placeholder="Page size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="20">20 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
              <SelectItem value="100">100 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: 7 }).map((_, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.username || "System"}</TableCell>
                      <TableCell>
                        <Badge className={getActionBadgeColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.entity}</TableCell>
                      <TableCell className="font-mono text-xs">{log.entity_id}</TableCell>
                      <TableCell className="max-w-xs truncate" title={log.details}>
                        {log.details}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.ip_address || "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {log.created_at ? format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss') : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between p-4">
          <div className="text-sm text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-5 w-24" />
            ) : (
              `Page ${page} of ${totalPages}`
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={isLoading || page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={isLoading || page >= totalPages}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
