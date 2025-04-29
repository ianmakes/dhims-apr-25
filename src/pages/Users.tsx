
import { useState } from "react";
import { DataTable } from "@/components/data-display/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  EyeIcon,
  Key,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@/types/database";
import ImageUploadCropper from "@/components/students/ImageUploadCropper";

export default function Users() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [newUser, setNewUser] = useState<{
    email: string;
    password: string;
    name: string;
    role: string;
    avatar_url?: string;
  }>({
    email: "",
    password: "",
    name: "",
    role: "viewer",
    avatar_url: "",
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isBulkActionAlertOpen, setIsBulkActionAlertOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<"delete" | "deactivate">("deactivate");

  // Fetch users data
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*");
      
      if (error) throw error;
      
      // Fetch auth users to get email
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) throw authError;
      
      // Combine profile and auth user data
      const combinedUsers = data.map((profile) => {
        const authUser = authUsers.users.find((u) => u.id === profile.id);
        return {
          ...profile,
          email: authUser?.email || "",
          user_metadata: authUser?.user_metadata || {}
        };
      });
      
      return combinedUsers as User[];
    },
  });

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      // Create user in Supabase auth
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          role: userData.role,
          avatar_url: userData.avatar_url,
        },
      });
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "User added",
        description: "New user has been added successfully",
      });
      setIsAddUserModalOpen(false);
      resetNewUserForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error adding user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await supabase.auth.admin.deleteUser(userId);
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "User deleted",
        description: "User has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk action mutation
  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, ids }: { action: "delete" | "deactivate"; ids: string[] }) => {
      if (action === "delete") {
        await Promise.all(ids.map(id => supabase.auth.admin.deleteUser(id)));
      } else {
        // Deactivate users
        await Promise.all(ids.map(id => supabase.auth.admin.updateUserById(id, { user_metadata: { active: false } })));
      }
      return ids;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: `Users ${variables.action === "delete" ? "deleted" : "deactivated"}`,
        description: `${selectedUsers.length} users have been ${variables.action === "delete" ? "deleted" : "deactivated"} successfully.`,
      });
      setSelectedUsers([]);
      setIsBulkActionAlertOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error performing bulk action",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: { id: string; data: Partial<User> }) => {
      const { data, error } = await supabase.auth.admin.updateUserById(
        userData.id,
        { 
          user_metadata: {
            name: userData.data.name,
            role: userData.data.role,
            avatar_url: userData.data.avatar_url,
          }
        }
      );
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "User updated",
        description: "User has been updated successfully",
      });
      setIsEditUserModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Deactivate user mutation
  const toggleUserActivationMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { data, error } = await supabase.auth.admin.updateUserById(
        id,
        { user_metadata: { active } }
      );
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "User status changed",
        description: "User activation status has been updated successfully",
      });
      setIsDeactivateModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error changing user status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate random password
  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewUser({ ...newUser, password });
  };

  const resetNewUserForm = () => {
    setNewUser({
      email: "",
      password: "",
      name: "",
      role: "viewer",
      avatar_url: "",
    });
  };

  const handleDeleteUser = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  const handleEditUser = () => {
    if (selectedUser) {
      updateUserMutation.mutate({
        id: selectedUser.id,
        data: {
          name: selectedUser.name || "",
          role: selectedUser.role || "viewer",
          avatar_url: selectedUser.avatar_url || "",
        },
      });
    }
  };

  const handleToggleUserActivation = () => {
    if (selectedUser) {
      const currentStatus = selectedUser.user_metadata?.active !== false; // Default to active if not specified
      toggleUserActivationMutation.mutate({
        id: selectedUser.id,
        active: !currentStatus,
      });
    }
  };

  const handleBulkAction = () => {
    bulkActionMutation.mutate({
      action: bulkActionType,
      ids: selectedUsers
    });
  };

  // Image upload handler
  const handleProfileImageUpload = async (file: Blob, userId: string | null) => {
    try {
      const fileExt = file.type.split('/')[1];
      const filePath = `avatars/${userId || 'new'}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);
      
      const publicUrl = urlData.publicUrl;
      
      if (userId) {
        // Update existing user
        setSelectedUser(user => user ? { ...user, avatar_url: publicUrl } : null);
      } else {
        // New user
        setNewUser(u => ({ ...u, avatar_url: publicUrl }));
      }
      
      return publicUrl;
    } catch (error: any) {
      toast({
        title: "Error uploading image",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  // Selection column
  const selectionColumn = {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => {
          table.toggleAllPageRowsSelected(!!value);
          const rowSelection = table.getState().rowSelection;
          const selectedIds = Object.keys(rowSelection).map(
            (index) => table.getRow(index).original.id
          );
          setSelectedUsers(selectedIds);
        }}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => {
          row.toggleSelected(!!value);
          
          // Update selectedUsers state based on current selection
          const rowSelection = row.getTable().getState().rowSelection;
          const selectedIds = Object.keys(rowSelection).map(
            (index) => row.getTable().getRow(index).original.id
          );
          setSelectedUsers(selectedIds);
        }}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };

  const columns = [
    selectionColumn,
    {
      accessorKey: "avatar_url",
      header: "",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar_url || ""} alt={user.name || ""} />
            <AvatarFallback>{(user.name || "User").charAt(0)}</AvatarFallback>
          </Avatar>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        return (
          <div className="capitalize font-medium">
            {role === "admin" ? (
              <span className="bg-purple-100 text-purple-800 py-1 px-2 rounded-full text-xs">
                Admin
              </span>
            ) : role === "editor" ? (
              <span className="bg-blue-100 text-blue-800 py-1 px-2 rounded-full text-xs">
                Editor
              </span>
            ) : (
              <span className="bg-gray-100 text-gray-800 py-1 px-2 rounded-full text-xs">
                Viewer
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const user = row.original;
        const isActive = user.user_metadata?.active !== false; // Default to active if not specified
        
        return (
          <div>
            {isActive ? (
              <div className="bg-green-100 text-green-800 py-1 px-2 rounded-full text-xs inline-flex items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-green-600 mr-1"></span>
                Active
              </div>
            ) : (
              <div className="bg-gray-100 text-gray-800 py-1 px-2 rounded-full text-xs inline-flex items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-600 mr-1"></span>
                Inactive
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        const isActive = user.user_metadata?.active !== false; // Default to active if not specified
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(user.id)}
              >
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedUser(user);
                  setIsEditUserModalOpen(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedUser(user);
                  setIsDeactivateModalOpen(true);
                }}
              >
                {isActive ? (
                  <>
                    <UserX className="mr-2 h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  setSelectedUser(user);
                  setIsDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-left">Users</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <Button onClick={() => setIsAddUserModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Bulk actions */}
      {selectedUsers.length > 0 && (
        <div className="flex justify-end">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{selectedUsers.length} selected</span>
            <Select value={bulkActionType} onValueChange={(value: "delete" | "deactivate") => setBulkActionType(value)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Bulk Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deactivate">Deactivate</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setIsBulkActionAlertOpen(true)}>
              Apply
            </Button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        searchColumn="name"
        searchPlaceholder="Search users..."
      />

      {/* Add User Modal */}
      <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center mb-4">
              <Avatar className="h-24 w-24 mb-3">
                <AvatarImage src={newUser.avatar_url} />
                <AvatarFallback>{newUser.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="w-full">
                <Label htmlFor="avatar">Profile Picture</Label>
                <div className="mt-2">
                  <ImageUploadCropper
                    value={newUser.avatar_url || ""}
                    onChange={(url) => setNewUser({ ...newUser, avatar_url: url })}
                    aspectRatio={1}
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  required
                />
                <Button type="button" size="sm" onClick={generatePassword}>
                  <Key className="h-4 w-4 mr-1" />
                  Generate
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={newUser.role}
                onValueChange={(role) => setNewUser({ ...newUser, role })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => addUserMutation.mutate(newUser)}
              disabled={!newUser.email || !newUser.password || !newUser.name || addUserMutation.isPending}
            >
              {addUserMutation.isPending ? "Adding..." : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      {selectedUser && (
        <Dialog open={isEditUserModalOpen} onOpenChange={setIsEditUserModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col items-center mb-4">
                <Avatar className="h-24 w-24 mb-3">
                  <AvatarImage src={selectedUser.avatar_url || ""} />
                  <AvatarFallback>{selectedUser.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="w-full">
                  <Label htmlFor="avatar">Profile Picture</Label>
                  <div className="mt-2">
                    <ImageUploadCropper
                      value={selectedUser.avatar_url || ""}
                      onChange={(url) => 
                        setSelectedUser({ ...selectedUser, avatar_url: url })
                      }
                      aspectRatio={1}
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={selectedUser.name || ""}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={selectedUser.email}
                  disabled
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={selectedUser.role || "viewer"}
                  onValueChange={(role) =>
                    setSelectedUser({ ...selectedUser, role })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditUserModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEditUser}
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? "Updating..." : "Update User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete User Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate/Activate User Dialog */}
      {selectedUser && (
        <AlertDialog
          open={isDeactivateModalOpen}
          onOpenChange={setIsDeactivateModalOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {selectedUser.user_metadata?.active !== false
                  ? "Deactivate User"
                  : "Activate User"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {selectedUser.user_metadata?.active !== false
                  ? "This user will no longer be able to log in. They will remain in the system but won't have access until reactivated."
                  : "This user will be able to log in again."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleToggleUserActivation}>
                {selectedUser.user_metadata?.active !== false
                  ? "Deactivate"
                  : "Activate"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Bulk Action Alert */}
      <AlertDialog open={isBulkActionAlertOpen} onOpenChange={setIsBulkActionAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {bulkActionType === "delete" ? 
                `This action cannot be undone. This will permanently delete ${selectedUsers.length} user accounts and their associated data.` : 
                `This will deactivate ${selectedUsers.length} users. They will remain in the system but won't have access until reactivated.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkAction} 
              className={bulkActionType === "delete" ? "bg-destructive text-destructive-foreground" : ""}>
              {bulkActionType === "delete" ? "Delete" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
