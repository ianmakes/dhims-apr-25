import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StudentFormInput } from "@/types/database";

interface AddEditStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: any;
  onSuccess: () => void;
}

const studentSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  admission_number: z.string().min(1, { message: "Admission number is required" }),
  dob: z.string().optional().nullable(),
  gender: z.enum(["Male", "Female"]).optional().nullable(),
  status: z.string().min(1, { message: "Status is required" }),
  accommodation_status: z.string().optional().nullable(),
  health_status: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  school_level: z.string().optional().nullable(),
  cbc_category: z.string().optional().nullable(),
  current_grade: z.string().optional().nullable(),
  current_academic_year: z.coerce.number().optional().nullable(),
  height_cm: z.coerce.number().optional().nullable(),
  weight_kg: z.coerce.number().optional().nullable(),
  admission_date: z.string().optional().nullable(),
  sponsored_since: z.string().optional().nullable(),
});

export function AddEditStudentModal({
  open,
  onOpenChange,
  student,
  onSuccess,
}: AddEditStudentModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const isEditMode = !!student;

  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: student?.name || "",
      admission_number: student?.admission_number || "",
      dob: student?.dob ? new Date(student.dob).toISOString().split('T')[0] : "",
      gender: student?.gender || null,
      status: student?.status || "active",
      accommodation_status: student?.accommodation_status || null,
      health_status: student?.health_status || null,
      location: student?.location || null,
      description: student?.description || null,
      school_level: student?.school_level || null,
      cbc_category: student?.cbc_category || null,
      current_grade: student?.current_grade || null,
      current_academic_year: student?.current_academic_year || null,
      height_cm: student?.height_cm || null,
      weight_kg: student?.weight_kg || null,
      admission_date: student?.admission_date ? new Date(student.admission_date).toISOString().split('T')[0] : "",
      sponsored_since: student?.sponsored_since ? new Date(student.sponsored_since).toISOString().split('T')[0] : "",
    },
  });

  useEffect(() => {
    if (student?.profile_image_url) {
      setImagePreview(student.profile_image_url);
    }
  }, [student]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (values: z.infer<typeof studentSchema>) => {
    setIsSubmitting(true);
    try {
      let profileImageUrl = student?.profile_image_url || null;

      // Upload profile image if selected
      if (profileImage) {
        const fileExt = profileImage.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('student-images')
          .upload(filePath, profileImage, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('student-images')
          .getPublicUrl(filePath);

        profileImageUrl = publicUrl;
      }

      // Generate a slug from the name
      const slug = values.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const studentData: StudentFormInput = {
        ...values,
        profile_image_url: profileImageUrl,
        slug,
      };

      if (isEditMode) {
        // Update existing student
        const { error } = await supabase
          .from('students')
          .update({
            ...studentData,
            updated_at: new Date().toISOString(),
            updated_by: user?.id,
          })
          .eq('id', student.id);

        if (error) throw error;

        toast({
          title: "Student updated",
          description: "Student information has been updated successfully.",
        });
      } else {
        // Create new student
        const { error } = await supabase
          .from('students')
          .insert({
            ...studentData,
            created_at: new Date().toISOString(),
            created_by: user?.id,
          });

        if (error) throw error;

        toast({
          title: "Student added",
          description: "New student has been added successfully.",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving student:', error);
      toast({
        title: 'Error saving student',
        description: 'Failed to save student information. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Student" : "Add New Student"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the student's information below."
              : "Fill in the student's information to add them to the system."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Information */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-medium">Basic Information</h3>
                
                <div className="flex flex-col items-center mb-4">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Profile Preview"
                      className="w-32 h-32 object-cover rounded-full mb-2"
                    />
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommended: Square image, 300x300px or larger
                  </p>
                </div>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter student's full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="admission_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admission Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter admission number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dob"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="graduated">Graduated</SelectItem>
                          <SelectItem value="transferred">Transferred</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Academic Information */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-medium">Academic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="school_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School Level</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select school level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="primary">Primary</SelectItem>
                            <SelectItem value="secondary">Secondary</SelectItem>
                            <SelectItem value="college">College</SelectItem>
                            <SelectItem value="university">University</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="current_grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Grade</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Grade 5, Form 2" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="current_academic_year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academic Year</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 2023" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="cbc_category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CBC Category</FormLabel>
                        <FormControl>
                          <Input placeholder="CBC Category" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="admission_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admission Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="sponsored_since"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sponsored Since</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Additional Information */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-medium">Additional Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="accommodation_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accommodation Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select accommodation status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="day_scholar">Day Scholar</SelectItem>
                            <SelectItem value="boarder">Boarder</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="health_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Health Status</FormLabel>
                        <FormControl>
                          <Input placeholder="Health status" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="height_cm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Height (cm)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Height in cm" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="weight_kg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (kg)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Weight in kg" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Student's location" {...field} value={field.value || ""} />
                      </FormControl>
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
                          placeholder="Enter a description of the student" 
                          className="min-h-[100px]" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isEditMode ? "Update Student" : "Add Student"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
