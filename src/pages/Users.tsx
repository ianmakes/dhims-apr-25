import { useState, useEffect } from "react";
import { User, UserRole } from "@/types";
import { DataTable } from "@/components/data-display/DataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal, Pencil, Plus, Trash2, UserPlus, Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
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
  }).optional()
});

function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  // Form for creating/editing users
  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "viewer"
    }
  });

  // Fetch users from Supabase
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        
        console.log("Fetching users from profiles table...");
        
        // Get users from the profiles table
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*');
        
        if (error) {
          console.error("Error fetching profiles:", error);
          throw error;
        }
        
        console.log("Fetched profiles:", profiles);
        
        if (profiles) {
          // Transform the profiles into the User format expected by the component
          const transformedUsers: User[] = profiles.map(profile => ({
            id: profile.id,
            name: profile.name || 'Unknown',
            email: '', // Email isn't stored in profiles table for privacy
            role: profile.role as UserRole,
            createdAt: profile.created_at ? new Date(profile.created_at) : new Date(),
            updatedAt: profile.updated_at ? new Date(profile.updated_at) : new Date()
          }));
          
          setUsers(transformedUsers);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);

  const handleOpenCreateDialog = () => {
    form.reset({
      name: "",
      email: "",
      role: "viewer",
      password: ""
    });
    setIsCreateDialogOpen(true);
  };

  const handleOpenEditDialog = (user: User) => {
    setSelectedUser(user);
    form.reset({
      name: user.name,
      email: user.email,
      role: user.role,
      password: undefined
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteAlert = (user: User) => {
    setSelectedUser(user);
    setIsDeleteAlertOpen(true);
  };

  const handleCreateUser = async (values: z.infer<typeof userFormSchema>) => {
    try {
      setIsLoading(true);
      
      // First create the user in auth system
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password || '', // Password is required when creating a user
        options: {
          data: {
            name: values.name,
            role: values.role
          }
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Update the local state with the new user
        const newUser: User = {
          id: data.user.id,
          name: values.name,
          email: values.email,
          role: values.role,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        setUsers(prev => [...prev, newUser]);
        
        toast({
          title: "User created",
          description: `User ${values.name} has been created successfully.`
        });
      }
      
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        title: "Failed to create user",
        description: error.message || "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (values: z.infer<typeof userFormSchema>) => {
    try {
      if (!selectedUser) return;
      
      setIsLoading(true);
      
      // Update user profile
      const { error } = await supabase
        .from('profiles')
        .update({ 
          name: values.name,
          role: values.role 
        })
        .eq('id', selectedUser.id);
      
      if (error) throw error;
      
      // If password is provided, update it (requires admin privileges)
      if (values.password) {
        // Note: Updating password requires admin API or function
        toast({
          title: "Password update",
          description: "Password updates require admin API access",
          variant: "default"
        });
      }
      
      // Update the user in the local state
      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id 
          ? { ...user, name: values.name, role: values.role, updatedAt: new Date() } 
          : user
      ));
      
      toast({
        title: "User updated",
        description: `User ${values.name} has been updated successfully.`
      });
      
      setIsEditDialogOpen(false);
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast({
        title: "Failed to update user",
        description: error.message || "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Updated handleDeleteUser function to properly delete users through Supabase Admin API
  const handleDeleteUser = async () => {
    try {
      if (!selectedUser) return;
      
      setIsLoading(true);
      
      // First, we need to delete the user from the auth.users table
      // Since we've updated the foreign key constraint to CASCADE,
      // this will automatically delete the profile as well
      const { error } = await supabase.auth.admin.deleteUser(
        selectedUser.id
      );
      
      if (error) {
        console.error("Error deleting user with admin API:", error);
        
        // Fallback: Try deleting just the profile if admin API fails
        const { error: profileDeleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', selectedUser.id);
          
        if (profileDeleteError) throw profileDeleteError;
      }
      
      // Remove the user from the local state
      setUsers(prev => prev.filter(user => user.id !== selectedUser.id));
      
      toast({
        title: "User deleted",
        description: `User ${selectedUser.name} has been deleted successfully.`
      });
      
      setIsDeleteAlertOpen(false);
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Failed to delete user",
        description: error.message || "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Define columns for DataTable
  const columns = [
    {
      accessorKey: "name",
      header: "Name"
    }, 
    {
      accessorKey: "role",
      header: "Role",
      cell: ({
        row
      }) => {
        const role = row.getValue("role") as UserRole;
        return <div className="capitalize">
            {role === "superuser" ? <div className="inline-flex items-center justify-center rounded-full bg-purple-100 px-2.5 py-0.5 text-sm font-medium text-purple-700">
                <span>Super User</span>
              </div> : role === "admin" ? <div className="inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-700">
                <span>Admin</span>
              </div> : role === "manager" ? <div className="inline-flex items-center justify-center rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-700">
                <span>Manager</span>
              </div> : <div className="inline-flex items-center justify-center rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-700">
                <span>Viewer</span>
              </div>}
          </div>;
      }
    }, 
    {
      accessorKey: "createdAt",
      header: "Joined Date",
      cell: ({
        row
      }) => {
        return <div>
            {new Date(row.getValue("createdAt")).toLocaleDateString()}
          </div>;
      }
    }, 
    {
      id: "actions",
      cell: ({
        row
      }) => {
        const user = row.original;
        
        // Prevent current user from deleting themselves
        const isSelf = currentUser?.id === user.id;
        
        return <div className="text-right">
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
                {!isSelf && (
                  <DropdownMenuItem className="text-destructive" onClick={() => handleOpenDeleteAlert(user)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>;
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system and assign their role.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateUser)} className="space-y-4">
              <FormField control={form.control} name="name" render={({
              field
            }) => <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />
              <FormField control={form.control} name="email" render={({
              field
            }) => <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />
              <FormField control={form.control} name="password" render={({
              field
            }) => <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter password" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />
              <FormField control={form.control} name="role" render={({
              field
            }) => <FormItem>
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
                  </FormItem>} />
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create User"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details and permissions.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateUser)} className="space-y-4">
              <FormField control={form.control} name="name" render={({
              field
            }) => <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />
              <FormField control={form.control} name="email" render={({
              field
            }) => <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email" type="email" {...field} disabled />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </FormItem>} />
              <FormField control={form.control} name="password" render={({
              field
            }) => <FormItem>
                    <FormLabel>Password (leave blank to keep unchanged)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter new password" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />
              <FormField control={form.control} name="role" render={({
              field
            }) => <FormItem>
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
                  </FormItem>} />
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update User"
                  )}
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
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default UsersPage;
