import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Trash2, Plus, PenLine, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logCreate, logUpdate, logDelete } from "@/utils/auditLog";

const roleSchema = z.object({
  name: z.string().min(2, { message: "Role name must be at least 2 characters" }),
  description: z.string().min(2, { message: "Description must be at least 2 characters" }),
  is_system: z.boolean().default(false),
  permissions: z.array(z.string()).default([]),
});

type RoleFormValues = z.infer<typeof roleSchema>;

interface Role {
  id: string;
  name: string;
  description: string;
  is_system: boolean;
  created_at: string;
  permissions?: string[];
}

interface RolePermission {
  role_id: string;
  permission_name: string;
}

// Default permissions that can be assigned to roles
const availablePermissions = [
  { id: "students.view", label: "View Students" },
  { id: "students.create", label: "Create Students" },
  { id: "students.edit", label: "Edit Students" },
  { id: "students.delete", label: "Delete Students" },
  { id: "sponsors.view", label: "View Sponsors" },
  { id: "sponsors.create", label: "Create Sponsors" },
  { id: "sponsors.edit", label: "Edit Sponsors" },
  { id: "sponsors.delete", label: "Delete Sponsors" },
  { id: "academic.view", label: "View Academic Records" },
  { id: "academic.create", label: "Create Academic Records" },
  { id: "academic.edit", label: "Edit Academic Records" },
  { id: "settings.view", label: "View Settings" },
  { id: "settings.edit", label: "Edit Settings" },
  { id: "users.view", label: "View Users" },
  { id: "users.create", label: "Create Users" },
  { id: "users.edit", label: "Edit Users" },
  { id: "users.delete", label: "Delete Users" },
  { id: "reports.view", label: "View Reports" },
  { id: "reports.export", label: "Export Reports" },
];

export default function UserRolesSettings() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
      is_system: false,
      permissions: [],
    },
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    if (editingRole) {
      form.reset({
        name: editingRole.name,
        description: editingRole.description,
        is_system: editingRole.is_system,
        permissions: editingRole.permissions || [],
      });
    } else {
      form.reset({
        name: "",
        description: "",
        is_system: false,
        permissions: [],
      });
    }
  }, [editingRole, form]);

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

      // Store roles without permissions first
      let rolesWithPermissions: Role[] = roleData || [];
      
      // Then get permissions from user_roles.permissions JSONB field
      for (const role of rolesWithPermissions) {
        // Extract permissions from the JSONB field if it exists
        if (role.permissions) {
          // If permissions is a JSONB array, convert to string[]
          if (Array.isArray(role.permissions)) {
            role.permissions = role.permissions as unknown as string[];
          }
          // If permissions is a JSONB object with keys, extract the keys
          else if (typeof role.permissions === 'object' && role.permissions !== null) {
            role.permissions = Object.keys(role.permissions).filter(
              key => (role.permissions as any)[key] === true
            );
          } else {
            role.permissions = [];
          }
        } else {
          role.permissions = [];
        }
      }

      setRoles(rolesWithPermissions);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast({
        title: "Error",
        description: "Failed to load user roles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingRole(null);
    setDialogOpen(true);
  };

  const openEditDialog = (role: Role) => {
    setEditingRole(role);
    setDialogOpen(true);
  };

  const openDeleteDialog = (role: Role) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const onSubmit = async (data: RoleFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Convert permissions array to JSONB object for storage
      const permissionsObject: Record<string, boolean> = {};
      data.permissions.forEach(permission => {
        permissionsObject[permission] = true;
      });

      if (editingRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({
            name: data.name,
            description: data.description,
            is_system: data.is_system,
            permissions: permissionsObject
          })
          .eq("id", editingRole.id);

        if (error) throw error;

        await logUpdate("user_roles", editingRole.id, `Updated role: ${data.name}`);

        toast({
          title: "Role updated",
          description: "The role has been updated successfully",
        });
      } else {
        // Create new role
        const { data: newRole, error } = await supabase
          .from("user_roles")
          .insert({
            name: data.name,
            description: data.description,
            is_system: data.is_system,
            permissions: permissionsObject
          })
          .select()
          .single();

        if (error) throw error;

        await logCreate("user_roles", newRole.id, `Created role: ${data.name}`);

        toast({
          title: "Role created",
          description: "The new role has been created successfully",
        });
      }

      setDialogOpen(false);
      fetchRoles();
    } catch (error: any) {
      console.error("Error saving role:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save role",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      setIsSubmitting(true);

      // Delete permissions first
      const { error: permError } = await supabase
        .from("role_permissions")
        .delete()
        .eq("role_id", roleToDelete.id);

      if (permError) throw permError;

      // Then delete the role
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleToDelete.id);

      if (error) throw error;

      await logDelete("user_roles", roleToDelete.id, `Deleted role: ${roleToDelete.name}`);

      toast({
        title: "Role deleted",
        description: "The role has been deleted successfully",
      });

      setDeleteDialogOpen(false);
      setRoleToDelete(null);
      fetchRoles();
    } catch (error: any) {
      console.error("Error deleting role:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete role",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">User Roles</h3>
          <p className="text-muted-foreground text-sm">
            Manage user roles and permissions
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Role
        </Button>
      </div>

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
                  <TableCell className="font-medium">{role.name}</TableCell>
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
                      >
                        <PenLine className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={role.is_system}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Create New Role"}</DialogTitle>
            <DialogDescription>
              {editingRole
                ? "Update the role details and permissions"
                : "Add a new role to assign to users"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

              <FormField
                control={form.control}
                name="is_system"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
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

              <div className="space-y-2">
                <FormLabel>Permissions</FormLabel>
                <FormDescription>
                  Select the permissions for this role
                </FormDescription>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border rounded-md p-4">
                  {availablePermissions.map((permission) => (
                    <FormField
                      key={permission.id}
                      control={form.control}
                      name="permissions"
                      render={({ field }) => (
                        <FormItem
                          key={permission.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(permission.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, permission.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== permission.id
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {permission.label}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
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
