import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, Plus, PenLine, Loader2, Shield, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logCreate, logUpdate, logDelete } from "@/utils/auditLog";
import { useAuth } from "@/contexts/AuthContext";

const roleSchema = z.object({
  name: z.string().min(2, {
    message: "Role name must be at least 2 characters"
  }),
  description: z.string().min(2, {
    message: "Description must be at least 2 characters"
  }),
  is_system: z.boolean().default(false),
  permissions: z.array(z.string()).default([])
});

type RoleFormValues = z.infer<typeof roleSchema>;

interface Role {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string | null;
  permissions?: string[];
}

// Enhanced permissions with categories for better organization
const permissionCategories = [
  {
    category: "Students",
    permissions: [
      { id: "students.view", label: "View Students" },
      { id: "students.create", label: "Create Students" },
      { id: "students.edit", label: "Edit Students" },
      { id: "students.delete", label: "Delete Students" },
      { id: "students.export", label: "Export Students" }
    ]
  },
  {
    category: "Sponsors",
    permissions: [
      { id: "sponsors.view", label: "View Sponsors" },
      { id: "sponsors.create", label: "Create Sponsors" },
      { id: "sponsors.edit", label: "Edit Sponsors" },
      { id: "sponsors.delete", label: "Delete Sponsors" },
      { id: "sponsors.export", label: "Export Sponsors" }
    ]
  },
  {
    category: "Academic",
    permissions: [
      { id: "academic.view", label: "View Academic Records" },
      { id: "academic.create", label: "Create Academic Records" },
      { id: "academic.edit", label: "Edit Academic Records" },
      { id: "academic.delete", label: "Delete Academic Records" },
      { id: "exams.view", label: "View Exams" },
      { id: "exams.create", label: "Create Exams" },
      { id: "exams.edit", label: "Edit Exams" },
      { id: "exams.delete", label: "Delete Exams" }
    ]
  },
  {
    category: "System Administration",
    permissions: [
      { id: "users.view", label: "View Users" },
      { id: "users.create", label: "Create Users" },
      { id: "users.edit", label: "Edit Users" },
      { id: "users.delete", label: "Delete Users" },
      { id: "roles.view", label: "View Roles" },
      { id: "roles.create", label: "Create Roles" },
      { id: "roles.edit", label: "Edit Roles" },
      { id: "roles.delete", label: "Delete Roles" },
      { id: "settings.view", label: "View Settings" },
      { id: "settings.edit", label: "Edit Settings" },
      { id: "audit.view", label: "View Audit Logs" }
    ]
  },
  {
    category: "Reports & Analytics",
    permissions: [
      { id: "reports.view", label: "View Reports" },
      { id: "reports.export", label: "Export Reports" },
      { id: "analytics.view", label: "View Analytics" },
      { id: "dashboard.view", label: "View Dashboard" }
    ]
  }
];

export default function UserRolesSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [selectAllStates, setSelectAllStates] = useState<Record<string, boolean>>({});

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
      is_system: false,
      permissions: []
    }
  });

  useEffect(() => {
    fetchRoles();
    fetchCurrentUserRole();
  }, []);

  useEffect(() => {
    if (editingRole) {
      form.reset({
        name: editingRole.name,
        description: editingRole.description || "",
        is_system: editingRole.is_system,
        permissions: editingRole.permissions || []
      });
      updateSelectAllStates(editingRole.permissions || []);
    } else {
      form.reset({
        name: "",
        description: "",
        is_system: false,
        permissions: []
      });
      setSelectAllStates({});
    }
  }, [editingRole, form]);

  const fetchCurrentUserRole = async () => {
    try {
      console.log("Fetching current user role for user:", user?.id);
      
      if (!user?.id) {
        console.log("No user ID available");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      
      if (error) {
        console.error("Error fetching user profile:", error);
        return;
      }

      console.log("Current user profile:", profile);
      
      if (profile) {
        setCurrentUserRole(profile.role);
        console.log("Current user role set to:", profile.role);
      }
    } catch (error) {
      console.error("Error in fetchCurrentUserRole:", error);
    }
  };

  const updateSelectAllStates = (permissions: string[]) => {
    const newSelectAllStates: Record<string, boolean> = {};
    permissionCategories.forEach(category => {
      const categoryPermissions = category.permissions.map(p => p.id);
      newSelectAllStates[category.category] = categoryPermissions.every(p => permissions.includes(p));
    });
    setSelectAllStates(newSelectAllStates);
  };

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("name");

      if (error) {
        throw error;
      }

      // Add a default super admin role if it doesn't exist
      let rolesWithPermissions: Role[] = roleData?.map(role => {
        const is_system = role.name.toLowerCase() === 'super admin';
        let permissions: string[] = [];
        
        if (role.permissions) {
          if (Array.isArray(role.permissions)) {
            permissions = role.permissions as unknown as string[];
          } else if (typeof role.permissions === 'object' && role.permissions !== null) {
            permissions = Object.keys(role.permissions).filter(key => (role.permissions as any)[key] === true);
          }
        }

        // Super admin gets all permissions automatically
        if (is_system && role.name.toLowerCase() === 'super admin') {
          permissions = permissionCategories.flatMap(cat => cat.permissions.map(p => p.id));
        }

        return {
          id: role.id,
          name: role.name,
          description: role.description,
          is_system,
          created_at: role.created_at,
          permissions
        };
      }) || [];

      // Check if super admin role exists, if not suggest creating it
      const hasSuperAdmin = rolesWithPermissions.some(role => role.name.toLowerCase() === 'super admin');
      if (!hasSuperAdmin) {
        console.log("No Super Admin role found. Consider creating one for full system access.");
      }

      setRoles(rolesWithPermissions);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast({
        title: "Error",
        description: "Failed to load user roles",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdmin = () => {
    console.log("Checking if super admin. Current role:", currentUserRole);
    // Check for both "super admin" and "superuser" for backward compatibility
    return currentUserRole === 'super admin' || currentUserRole === 'superuser' || currentUserRole === 'admin';
  };

  const canEditRole = (role: Role) => {
    if (!isSuperAdmin()) return false;
    if (role.name.toLowerCase() === 'super admin' && currentUserRole !== 'super admin' && currentUserRole !== 'superuser') return false;
    return true;
  };

  const canDeleteRole = (role: Role) => {
    if (!isSuperAdmin()) return false;
    if (role.is_system) return false;
    if (role.name.toLowerCase() === 'super admin') return false;
    return true;
  };

  const openCreateDialog = () => {
    if (!isSuperAdmin()) {
      toast({
        title: "Access Denied",
        description: "Only super administrators can create roles",
        variant: "destructive"
      });
      return;
    }
    setEditingRole(null);
    setDialogOpen(true);
  };

  const openEditDialog = (role: Role) => {
    if (!canEditRole(role)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit this role",
        variant: "destructive"
      });
      return;
    }
    setEditingRole(role);
    setDialogOpen(true);
  };

  const openDeleteDialog = (role: Role) => {
    if (!canDeleteRole(role)) {
      toast({
        title: "Access Denied",
        description: "This role cannot be deleted",
        variant: "destructive"
      });
      return;
    }
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const handleSelectAllCategory = (category: string, checked: boolean) => {
    const categoryPermissions = permissionCategories
      .find(cat => cat.category === category)
      ?.permissions.map(p => p.id) || [];
    
    const currentPermissions = form.getValues("permissions");
    let newPermissions: string[];
    
    if (checked) {
      newPermissions = [...new Set([...currentPermissions, ...categoryPermissions])];
    } else {
      newPermissions = currentPermissions.filter(p => !categoryPermissions.includes(p));
    }
    
    form.setValue("permissions", newPermissions);
    setSelectAllStates(prev => ({ ...prev, [category]: checked }));
  };

  const onSubmit = async (data: RoleFormValues) => {
    try {
      setIsSubmitting(true);

      // Prevent non-super admins from creating/editing roles
      if (!isSuperAdmin()) {
        toast({
          title: "Access Denied",
          description: "Only super administrators can manage roles",
          variant: "destructive"
        });
        return;
      }

      // Prevent editing super admin role by non-super admins
      if (editingRole?.name.toLowerCase() === 'super admin' && currentUserRole !== 'super admin' && currentUserRole !== 'superuser') {
        toast({
          title: "Access Denied",
          description: "Only super administrators can edit the Super Admin role",
          variant: "destructive"
        });
        return;
      }

      const permissionsObject: Record<string, boolean> = {};
      data.permissions.forEach(permission => {
        permissionsObject[permission] = true;
      });

      if (editingRole) {
        const { error } = await supabase
          .from("user_roles")
          .update({
            name: data.name,
            description: data.description,
            permissions: permissionsObject
          })
          .eq("id", editingRole.id);

        if (error) throw error;

        await logUpdate("user_roles", editingRole.id, `Updated role: ${data.name} with ${data.permissions.length} permissions`);
        
        toast({
          title: "Role updated",
          description: "The role has been updated successfully"
        });
      } else {
        const { data: newRole, error } = await supabase
          .from("user_roles")
          .insert({
            name: data.name,
            description: data.description,
            permissions: permissionsObject
          })
          .select()
          .single();

        if (error) throw error;

        await logCreate("user_roles", newRole.id, `Created role: ${data.name} with ${data.permissions.length} permissions`);
        
        toast({
          title: "Role created",
          description: "The new role has been created successfully"
        });
      }

      setDialogOpen(false);
      fetchRoles();
    } catch (error: any) {
      console.error("Error saving role:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save role",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    
    try {
      setIsSubmitting(true);

      if (!canDeleteRole(roleToDelete)) {
        toast({
          title: "Access Denied",
          description: "This role cannot be deleted",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleToDelete.id);

      if (error) throw error;

      await logDelete("user_roles", roleToDelete.id, `Deleted role: ${roleToDelete.name}`);
      
      toast({
        title: "Role deleted",
        description: "The role has been deleted successfully"
      });

      setDeleteDialogOpen(false);
      setRoleToDelete(null);
      fetchRoles();
    } catch (error: any) {
      console.error("Error deleting role:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete role",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-left">User Roles & Permissions</h3>
          <p className="text-muted-foreground text-sm">
            Manage user roles and their permissions. Only super administrators can create and modify roles.
          </p>
        </div>
        <Button onClick={openCreateDialog} disabled={!isSuperAdmin()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Role
        </Button>
      </div>

      {!isSuperAdmin() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <Shield className="h-5 w-5 text-yellow-400 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Limited Access</h4>
              <p className="text-sm text-yellow-700">
                You have read-only access to roles. Contact a super administrator to create or modify roles.
                Current role: {currentUserRole || 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading roles...
                  </div>
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No roles found. Create your first role to get started.
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {role.name.toLowerCase() === 'super admin' && (
                        <Shield className="h-4 w-4 text-yellow-500" />
                      )}
                      {role.name}
                    </div>
                  </TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>
                    {role.is_system ? (
                      <Badge variant="secondary">System</Badge>
                    ) : (
                      <Badge variant="outline">Custom</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions && role.permissions.length > 0 ? (
                        <span className="text-sm text-muted-foreground">
                          {role.permissions.length} permission{role.permissions.length !== 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">No permissions</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => openEditDialog(role)}
                        disabled={!canEditRole(role)}
                      >
                        <PenLine className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        disabled={!canDeleteRole(role)}
                        onClick={() => openDeleteDialog(role)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Create New Role"}</DialogTitle>
            <DialogDescription>
              {editingRole ? "Update the role details and permissions" : "Add a new role to assign to users"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        A unique name for this role
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Brief description of this role's purpose
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_system"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Switch 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                        disabled={editingRole?.name.toLowerCase() === 'super admin'}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>System Role</FormLabel>
                      <FormDescription>
                        System roles cannot be deleted and have special privileges
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormLabel>Permissions</FormLabel>
                <FormDescription>
                  Select the permissions for this role. Use "Select All" for each category to quickly assign all permissions in that group.
                </FormDescription>
                
                <div className="space-y-6 border rounded-md p-4 max-h-96 overflow-y-auto">
                  {permissionCategories.map((category) => (
                    <div key={category.category} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{category.category}</h4>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`select-all-${category.category}`}
                            checked={selectAllStates[category.category] || false}
                            onCheckedChange={(checked) => 
                              handleSelectAllCategory(category.category, checked as boolean)
                            }
                          />
                          <label 
                            htmlFor={`select-all-${category.category}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            Select All
                          </label>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pl-4">
                        {category.permissions.map((permission) => (
                          <FormField
                            key={permission.id}
                            control={form.control}
                            name="permissions"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(permission.id)}
                                    onCheckedChange={(checked) => {
                                      const updatedPermissions = checked
                                        ? [...field.value, permission.id]
                                        : field.value?.filter((value) => value !== permission.id);
                                      field.onChange(updatedPermissions);
                                      updateSelectAllStates(updatedPermissions);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal text-sm">
                                  {permission.label}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <Separator />
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingRole ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>{editingRole ? "Update Role" : "Create Role"}</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the{" "}
              <strong>{roleToDelete?.name}</strong> role and remove it from all users
              who have this role assigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteRole} 
              disabled={isSubmitting} 
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Role"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
