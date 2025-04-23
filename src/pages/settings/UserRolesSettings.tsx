
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

// Types
interface Role {
  id: string;
  name: string;
  description: string;
  permissions: {
    students?: { read?: boolean; write?: boolean; delete?: boolean; };
    sponsors?: { read?: boolean; write?: boolean; delete?: boolean; };
    exams?: { read?: boolean; write?: boolean; delete?: boolean; };
    settings?: { read?: boolean; write?: boolean; delete?: boolean; };
  };
  created_at: string;
  updated_at: string;
}

// Form Schemas
const RoleSchema = z.object({
  name: z.string().min(1, { message: "Role name is required" }),
  description: z.string().optional(),
  permissions: z.object({
    students: z.object({
      read: z.boolean().default(false),
      write: z.boolean().default(false),
      delete: z.boolean().default(false),
    }),
    sponsors: z.object({
      read: z.boolean().default(false),
      write: z.boolean().default(false),
      delete: z.boolean().default(false),
    }),
    exams: z.object({
      read: z.boolean().default(false),
      write: z.boolean().default(false),
      delete: z.boolean().default(false),
    }),
    settings: z.object({
      read: z.boolean().default(false),
      write: z.boolean().default(false),
      delete: z.boolean().default(false),
    }),
  }),
});

type RoleFormValues = z.infer<typeof RoleSchema>;

export default function UserRolesSettings() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(RoleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: {
        students: { read: false, write: false, delete: false },
        sponsors: { read: false, write: false, delete: false },
        exams: { read: false, write: false, delete: false },
        settings: { read: false, write: false, delete: false },
      },
    },
  });

  // Fetch roles on component mount
  useEffect(() => {
    fetchRoles();
  }, []);

  // Reset form when dialog is opened or closed
  useEffect(() => {
    if (!isDialogOpen) {
      setEditingRole(null);
      form.reset({
        name: "",
        description: "",
        permissions: {
          students: { read: false, write: false, delete: false },
          sponsors: { read: false, write: false, delete: false },
          exams: { read: false, write: false, delete: false },
          settings: { read: false, write: false, delete: false },
        },
      });
    }
  }, [isDialogOpen, form]);

  // Set form values when editing a role
  useEffect(() => {
    if (editingRole) {
      form.reset({
        name: editingRole.name,
        description: editingRole.description,
        permissions: {
          students: {
            read: editingRole.permissions.students?.read || false,
            write: editingRole.permissions.students?.write || false,
            delete: editingRole.permissions.students?.delete || false,
          },
          sponsors: {
            read: editingRole.permissions.sponsors?.read || false,
            write: editingRole.permissions.sponsors?.write || false,
            delete: editingRole.permissions.sponsors?.delete || false,
          },
          exams: {
            read: editingRole.permissions.exams?.read || false,
            write: editingRole.permissions.exams?.write || false,
            delete: editingRole.permissions.exams?.delete || false,
          },
          settings: {
            read: editingRole.permissions.settings?.read || false,
            write: editingRole.permissions.settings?.write || false,
            delete: editingRole.permissions.settings?.delete || false,
          },
        },
      });
    }
  }, [editingRole, form]);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("name");

      if (error) {
        throw error;
      }

      setRoles(data || []);
    } catch (error: any) {
      console.error("Error fetching roles:", error);
      toast({
        title: "Error fetching roles",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (values: RoleFormValues) => {
    try {
      let response;

      if (editingRole) {
        // Update existing role
        response = await supabase
          .from("user_roles")
          .update({
            name: values.name,
            description: values.description,
            permissions: values.permissions,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingRole.id);

        if (response.error) throw response.error;

        toast({
          title: "Role updated",
          description: `The role "${values.name}" has been updated successfully.`,
        });
      } else {
        // Create new role
        response = await supabase.from("user_roles").insert([
          {
            name: values.name,
            description: values.description,
            permissions: values.permissions,
          },
        ]);

        if (response.error) throw response.error;

        toast({
          title: "Role created",
          description: `The role "${values.name}" has been created successfully.`,
        });
      }

      // Refresh roles list
      await fetchRoles();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error saving role:", error);
      toast({
        title: "Error saving role",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setIsDialogOpen(true);
  };

  const handleDelete = async (role: Role) => {
    if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      try {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("id", role.id);

        if (error) throw error;

        toast({
          title: "Role deleted",
          description: `The role "${role.name}" has been deleted successfully.`,
        });

        // Refresh roles list
        await fetchRoles();
      } catch (error: any) {
        console.error("Error deleting role:", error);
        toast({
          title: "Error deleting role",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">User Roles</h3>
          <p className="text-sm text-muted-foreground">
            Manage user roles and permissions in the system.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Role
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingRole ? "Edit Role" : "Create New Role"}</DialogTitle>
              <DialogDescription>
                {editingRole
                  ? "Update the role details and permissions."
                  : "Define a new user role and its permissions."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Administrator" />
                      </FormControl>
                      <FormDescription>
                        A unique name for this role.
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
                        <Textarea
                          {...field}
                          placeholder="Describe the purpose and responsibilities of this role"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-medium">Permissions</h4>
                  
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Students Module</h5>
                    <div className="flex space-x-4">
                      <FormField
                        control={form.control}
                        name="permissions.students.read"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Read</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="permissions.students.write"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Write</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="permissions.students.delete"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Delete</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Sponsors Module</h5>
                    <div className="flex space-x-4">
                      <FormField
                        control={form.control}
                        name="permissions.sponsors.read"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Read</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="permissions.sponsors.write"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Write</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="permissions.sponsors.delete"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Delete</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Exams Module</h5>
                    <div className="flex space-x-4">
                      <FormField
                        control={form.control}
                        name="permissions.exams.read"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Read</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="permissions.exams.write"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Write</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="permissions.exams.delete"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Delete</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Settings Module</h5>
                    <div className="flex space-x-4">
                      <FormField
                        control={form.control}
                        name="permissions.settings.read"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Read</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="permissions.settings.write"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Write</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="permissions.settings.delete"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Delete</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit">
                    {editingRole ? (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Update Role
                      </>
                    ) : (
                      <>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Role
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-6">Loading roles...</div>
          ) : roles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6">
              <p className="text-muted-foreground mb-4">No roles found</p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                variant="outline"
                size="sm"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create your first role
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Sponsors</TableHead>
                  <TableHead>Exams</TableHead>
                  <TableHead>Settings</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>{role.description || "-"}</TableCell>
                    <TableCell>
                      {renderPermissions(role.permissions.students)}
                    </TableCell>
                    <TableCell>
                      {renderPermissions(role.permissions.sponsors)}
                    </TableCell>
                    <TableCell>
                      {renderPermissions(role.permissions.exams)}
                    </TableCell>
                    <TableCell>
                      {renderPermissions(role.permissions.settings)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(role)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(role)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function renderPermissions(permissionsObj: any) {
  if (!permissionsObj) return "-";
  
  const permissions = [];
  if (permissionsObj.read) permissions.push("R");
  if (permissionsObj.write) permissions.push("W");
  if (permissionsObj.delete) permissions.push("D");
  
  return permissions.length ? permissions.join("/") : "-";
}
