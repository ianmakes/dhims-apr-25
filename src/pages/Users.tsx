
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User, UserRole } from "@/types";
import { DataTable } from "@/components/data-display/DataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal, Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ImageUploadCropper from "@/components/students/ImageUploadCropper";
import { useAuth } from "@/contexts/AuthContext";

// Form schema for user creation/editing
const userFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters"
  }),
  email: z.string().email({
    message: "Please enter a valid email address"
  }),
  role: z.enum(["superuser", "admin", "manager", "viewer"], {
    required_error: "Please select a role"
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters"
  }).optional(),
  avatar_url: z.string().optional(),
});

export default function Users() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  // Query to fetch users from Supabase
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) throw authError;

      const userIds = authUsers.users.map(user => user.id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine auth users with profiles
      return authUsers.users.map(authUser => {
        const profile = profiles?.find(p => p.id === authUser.id);
        return {
          id: authUser.id,
          name: profile?.name || authUser.user_metadata?.name || "User",
          email: authUser.email || "",
          role: profile?.role || "viewer",
          createdAt: authUser.created_at,
          updatedAt: authUser.updated_at,
          avatar_url: profile?.avatar_url || authUser.user_metadata?.avatar_url,
        };
      });
    }
  });

  // Form for creating/editing users
  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "viewer",
      password: "",
      avatar_url: "",
    }
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: z.infer<typeof userFormSchema>) => {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password || undefined,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          avatar_url: userData.avatar_url,
        }
      });

      if (authError) throw authError;

      // Create/update profile with role
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          name: userData.name,
          role: userData.role,
          avatar_url: userData.avatar_url,
        });

      if (profileError) throw profileError;

      return authData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "User created",
        description: "New user has been created successfully."
      });
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error creating user",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const userId = selectedUser?.id;
      if (!userId) throw new Error("User ID is required");

      // Update user metadata if needed
      if (userData.name || userData.avatar_url) {
        const { error: authError } = await supabase.auth.admin.updateUserById(
          userId,
          {
            user_metadata: {
              name: userData.name,
              avatar_url: userData.avatar_url,
            }
          }
        );
        if (authError) throw authError;
      }

      // Update password if provided
      if (userData.password) {
        const { error: passwordError } = await supabase.auth.admin.updateUserById(
          userId,
          { password: userData.password }
        );
        if (passwordError) throw passwordError;
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          name: userData.name,
          role: userData.role,
          avatar_url: userData.avatar_url,
        });

      if (profileError) throw profileError;
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "User updated",
        description: "User has been updated successfully."
      });
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating user",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.auth.admin.deleteUser(id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "User deleted",
        description: "User has been deleted successfully."
      });
      setIsDeleteAlertOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting user",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleOpenCreateDialog = () => {
    form.reset({
      name: "",
      email: "",
      role: "viewer",
      password: "",
      avatar_url: "",
    });
    setIsCreateDialogOpen(true);
  };

  const handleOpenEditDialog = (user: User) => {
    setSelectedUser(user);
    form.reset({
      name: user.name,
      email: user.email,
      role: user.role,
      password: undefined,
      avatar_url: user.avatar_url || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteAlert = (user: User) => {
    setSelectedUser(user);
    setIsDeleteAlertOpen(true);
  };

  const handleCreateUser = (values: z.infer<typeof userFormSchema>) => {
    createUserMutation.mutate(values);
  };

  const handleUpdateUser = (values: z.infer<typeof userFormSchema>) => {
    updateUserMutation.mutate(values);
  };

  const handleDeleteUser = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    form.setValue("password", password);
  };

  // Define columns for DataTable
  const columns = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }: any) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span>{user.name}</span>
          </div>
        );
      }
    },
    {
      accessorKey: "email",
      header: "Email"
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }: any) => {
        const role = row.getValue("role") as UserRole;
        return (
          <div className="capitalize">
            {role === "superuser" ? (
              <div className="inline-flex items-center justify-center rounded-full bg-purple-100 px-2.5 py-0.5 text-sm font-medium text-purple-700">
                <span>Super User</span>
              </div>
            ) : role === "admin" ? (
              <div className="inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-700">
                <span>Admin</span>
              </div>
            ) : role === "manager" ? (
              <div className="inline-flex items-center justify-center rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-700">
                <span>Manager</span>
              </div>
            ) : (
              <div className="inline-flex items-center justify-center rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-700">
                <span>Viewer</span>
              </div>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: "createdAt",
      header: "Joined Date",
      cell: ({ row }: any) => {
        return (
          <div>
            {new Date(row.getValue("createdAt")).toLocaleDateString()}
          </div>
        );
      }
    },
    {
      id: "actions",
      cell: ({ row }: any) => {
        const user = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                  Copy user ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleOpenEditDialog(user)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive" 
                  onClick={() => handleOpenDeleteAlert(user)}
                  disabled={user.id === currentUser?.id} // Prevent deleting yourself
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-left">Users</h1>
          <p className="text-muted-foreground">
            Manage user accounts and their permissions
          </p>
        </div>
        <Button onClick={handleOpenCreateDialog}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Users table */}
      <DataTable 
        columns={columns} 
        data={users} 
        searchColumn="name" 
        searchPlaceholder="Search users..." 
        isLoading={isLoading}
      />

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system and assign their role.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateUser)} className="space-y-4">
              <FormField 
                control={form.control} 
                name="avatar_url" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Picture</FormLabel>
                    <FormControl>
                      <ImageUploadCropper 
                        value={field.value || ""} 
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />
              
              <FormField 
                control={form.control} 
                name="name" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />
              
              <FormField 
                control={form.control} 
                name="email" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />
              
              <FormField 
                control={form.control} 
                name="password" 
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>Password</FormLabel>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={generateRandomPassword}
                      >
                        Generate
                      </Button>
                    </div>
                    <FormControl>
                      <Input placeholder="Enter password" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />
              
              <FormField 
                control={form.control} 
                name="role" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="superuser">Super User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} 
              />
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button 
                  type="submit"
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details and permissions.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateUser)} className="space-y-4">
              <FormField 
                control={form.control} 
                name="avatar_url" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Picture</FormLabel>
                    <FormControl>
                      <ImageUploadCropper 
                        value={field.value || ""} 
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />
                
              <FormField 
                control={form.control} 
                name="name" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />
              
              <FormField 
                control={form.control} 
                name="email" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email" type="email" {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />
              
              <FormField 
                control={form.control} 
                name="password" 
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>Password (leave blank to keep unchanged)</FormLabel>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={generateRandomPassword}
                      >
                        Generate
                      </Button>
                    </div>
                    <FormControl>
                      <Input placeholder="Enter new password" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />
              
              <FormField 
                control={form.control} 
                name="role" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="superuser">Super User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} 
              />
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button 
                  type="submit"
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? "Updating..." : "Update User"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete User Alert */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user 
              account for {selectedUser?.name} and remove their data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser} 
              className="bg-destructive text-destructive-foreground"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
