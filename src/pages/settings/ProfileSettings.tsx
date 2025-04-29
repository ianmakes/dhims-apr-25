
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ImageUploadCropper from "@/components/students/ImageUploadCropper";
import { logUpdate } from "@/utils/auditLog";

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  bio: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  role: z.string().min(1, { message: "Please select a role" }),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfileSettings() {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [allRoles, setAllRoles] = useState<{ id: string; name: string }[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profile?.name || "",
      email: user?.email || "",
      bio: profile?.bio || "",
      position: profile?.position || "",
      phone: profile?.phone || "",
      role: profile?.role || "viewer",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (profile?.avatar_url) {
      setAvatarUrl(profile.avatar_url);
    }
    
    // Fetch roles
    const fetchRoles = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('id, name');
        
        if (error) {
          console.error('Error fetching roles:', error);
          return;
        }
        
        if (data) {
          setAllRoles(data);
        }
      } catch (err) {
        console.error('Error fetching roles:', err);
      }
    };
    
    fetchRoles();
  }, [profile, user?.email]);

  const uploadAvatar = async (croppedImage: Blob) => {
    try {
      if (!user?.id) return null;
      
      const fileExt = 'png';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedImage);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  };

  const handleImageCropped = async (blob: Blob) => {
    setIsLoading(true);
    try {
      const url = await uploadAvatar(blob);
      if (url) {
        setAvatarUrl(url);
        
        // Update the profile with the avatar URL
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ avatar_url: url })
          .eq('id', user?.id);
        
        if (profileError) throw profileError;
        
        await logUpdate('profiles', user?.id || '', 'Updated profile avatar');
        
        toast({
          title: "Avatar updated",
          description: "Your profile picture has been updated successfully.",
        });
      }
    } catch (error) {
      console.error("Error updating avatar:", error);
      toast({
        title: "Error",
        description: "There was an error updating your profile picture.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsCropperOpen(false);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsLoading(true);
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          role: data.role,
          bio: data.bio,
          position: data.position,
          phone: data.phone
        })
        .eq('id', user?.id);

      if (profileError) throw profileError;
      
      // Log the update
      await logUpdate('profiles', user?.id || '', 'Updated profile information');
      
      // Update email if changed
      if (data.email !== user?.email) {
        const { error: emailError } = await supabase.auth
          .updateUser({ email: data.email });
          
        if (emailError) throw emailError;
        
        await logUpdate('auth', user?.id || '', 'Updated email address');
      }
      
      // Update password if provided
      if (data.password) {
        const { error: passwordError } = await supabase.auth
          .updateUser({ password: data.password });
          
        if (passwordError) throw passwordError;
        
        await logUpdate('auth', user?.id || '', 'Updated password');

        // Clear password fields
        form.setValue('password', '');
        form.setValue('confirmPassword', '');
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "There was an error updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile & Account</h3>
        <p className="text-sm text-muted-foreground">
          Manage your personal information and account settings.
        </p>
      </div>
      
      <div className="flex items-center gap-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={avatarUrl || ""} />
          <AvatarFallback className="text-xl">
            <User className="h-12 w-12" />
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h4 className="text-sm font-medium">Profile Picture</h4>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsCropperOpen(true)}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Change avatar
            </Button>
            {avatarUrl && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    const { error } = await supabase
                      .from('profiles')
                      .update({ avatar_url: null })
                      .eq('id', user?.id);
                    
                    if (error) throw error;
                    
                    setAvatarUrl(null);
                    
                    toast({
                      title: "Avatar removed",
                      description: "Your profile picture has been removed.",
                    });
                  } catch (error) {
                    console.error('Error removing avatar:', error);
                    toast({
                      title: "Error",
                      description: "Failed to remove profile picture.",
                      variant: "destructive",
                    });
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
              >
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Upload a square image for best results
          </p>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormDescription>
                    You'll need to verify your email if you change it.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Administrator" />
                  </FormControl>
                  <FormDescription>
                    Your role or position in the organization.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. +1 234 567 8901" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Tell us a little about yourself" 
                    className="resize-none h-20"
                  />
                </FormControl>
                <FormDescription>
                  Brief description for your profile.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User Role</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {allRoles.length > 0 ? (
                      allRoles.map(role => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.name}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="superuser">Superuser</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>
                  User role determines access permissions in the system.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Change Password</h4>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          {...field} 
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Leave blank to keep current password.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
      
      <Dialog open={isCropperOpen} onOpenChange={setIsCropperOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Profile Picture</DialogTitle>
          </DialogHeader>
          <ImageUploadCropper 
            aspectRatio={1}
            onImageCropped={handleImageCropped}
            onCancel={() => setIsCropperOpen(false)}
            isUploading={isLoading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
