
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
  FormDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AddEditStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: any;
  onSubmit: (data: any) => void;
}

// Form schema for student creation/editing
const studentFormSchema = z.object({
  admission_number: z.string().min(1, { message: "Admission number is required" }),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  dob: z.string().optional(),
  gender: z.enum(["Male", "Female"], {
    required_error: "Please select a gender",
  }),
  status: z.enum(["Active", "Inactive", "Graduated", "Transferred", "Suspended"], {
    required_error: "Please select a status",
  }),
  accommodation_status: z.enum(["Boarder", "Day Scholar"]).optional(),
  health_status: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  school_level: z.string().optional(),
  cbc_category: z.string().optional(),
  current_grade: z.string().min(1, { message: "Current grade is required" }),
  current_academic_year: z.string().transform(val => parseInt(val)).optional(),
  height_cm: z.string().transform(val => val ? parseFloat(val) : undefined).optional(),
  weight_kg: z.string().transform(val => val ? parseFloat(val) : undefined).optional(),
  admission_date: z.string().optional(),
  sponsor_id: z.string().optional(),
  sponsored_since: z.string().optional(),
  profile_image_url: z.string().optional(),
  slug: z.string().optional(),
});

export type StudentFormValues = z.infer<typeof studentFormSchema>;

export function AddEditStudentModal({
  open,
  onOpenChange,
  student,
  onSubmit,
}: AddEditStudentModalProps) {
  const isEditMode = !!student;
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentTab, setCurrentTab] = useState("basic");

  // Helper function to format date to YYYY-MM-DD safely
  const formatDateSafely = (date: Date | string | undefined): string => {
    if (!date) return "";
    
    try {
      // If it's already a string in YYYY-MM-DD format, return it
      if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      
      // Otherwise, try to convert to a Date object and format
      const dateObj = new Date(date);
      
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        return "";
      }
      
      return dateObj.toISOString().substring(0, 10);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  // Initialize form with student data or empty values
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: student
      ? {
          admission_number: student.admission_number || "",
          name: student.name || "",
          dob: formatDateSafely(student.dob),
          gender: student.gender || "Male",
          status: student.status || "Active",
          accommodation_status: student.accommodation_status || "Day Scholar",
          health_status: student.health_status || "",
          location: student.location || "",
          description: student.description || "",
          school_level: student.school_level || "",
          cbc_category: student.cbc_category || "",
          current_grade: student.current_grade || "Grade 1",
          current_academic_year: student.current_academic_year?.toString() || new Date().getFullYear().toString(),
          height_cm: student.height_cm?.toString() || "",
          weight_kg: student.weight_kg?.toString() || "",
          admission_date: formatDateSafely(student.admission_date),
          sponsor_id: student.sponsor_id || "",
          sponsored_since: formatDateSafely(student.sponsored_since),
          profile_image_url: student.profile_image_url || "",
          slug: student.slug || "",
        }
      : {
          admission_number: "",
          name: "",
          dob: "",
          gender: "Male",
          status: "Active",
          accommodation_status: "Day Scholar",
          health_status: "",
          location: "",
          description: "",
          school_level: "",
          cbc_category: "",
          current_grade: "Grade 1",
          current_academic_year: new Date().getFullYear().toString(),
          height_cm: "",
          weight_kg: "",
          admission_date: "",
          sponsor_id: "",
          sponsored_since: "",
          profile_image_url: "",
          slug: "",
        },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const uploadImage = async (): Promise<string | undefined> => {
    if (!selectedImage) return undefined;
    
    setUploadingImage(true);
    try {
      // Create a unique filename
      const filename = `${Date.now()}_${selectedImage.name}`;
      const filePath = `${user?.id}/${filename}`;
      
      // Upload the image to Supabase storage
      const { data, error } = await supabase.storage
        .from('student-photos')
        .upload(filePath, selectedImage, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;
      
      // Get the public URL for the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('student-photos')
        .getPublicUrl(data.path);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error uploading image',
        description: 'Failed to upload profile image. Please try again.',
        variant: 'destructive',
      });
      return undefined;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFormSubmit = async (values: StudentFormValues) => {
    try {
      // Upload image if selected
      let profileImageUrl = values.profile_image_url;
      if (selectedImage) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          profileImageUrl = uploadedUrl;
        }
      }

      // Generate slug from name if not present
      const slug = values.slug || values.name.toLowerCase().replace(/\s+/g, '-');

      // Submit the form with the image URL included
      onSubmit({
        ...values,
        profile_image_url: profileImageUrl,
        slug,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error in form submission:', error);
      toast({
        title: 'Error',
        description: 'Failed to save student data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Student" : "Add New Student"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update student information below."
              : "Enter student details to add them to the system."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <ScrollArea className="h-[60vh] pr-4">
              <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="academic">Academic</TabsTrigger>
                  <TabsTrigger value="additional">Additional Info</TabsTrigger>
                  <TabsTrigger value="sponsor">Sponsorship</TabsTrigger>
                </TabsList>

                {/* Basic Information */}
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="admission_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admission Number*</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. ADM/001" {...field} />
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
                          <FormLabel>Full Name*</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter full name" {...field} />
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
                          <FormLabel>Gender*</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                    <FormField
                      control={form.control}
                      name="dob"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="admission_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admission Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status*</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Inactive">Inactive</SelectItem>
                              <SelectItem value="Graduated">Graduated</SelectItem>
                              <SelectItem value="Transferred">Transferred</SelectItem>
                              <SelectItem value="Suspended">Suspended</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter location" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="sm:col-span-2">
                      <div className="mb-4">
                        <FormLabel>Profile Image</FormLabel>
                        <Input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageChange} 
                          className="mt-1"
                        />
                        <FormDescription>
                          Upload a profile picture for the student
                        </FormDescription>
                      </div>
                      {form.getValues('profile_image_url') && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">Current Image:</p>
                          <img 
                            src={form.getValues('profile_image_url')} 
                            alt="Student profile" 
                            className="mt-1 h-32 w-auto rounded-md object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Academic Information */}
                <TabsContent value="academic" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="current_grade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Grade*</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select grade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                                <SelectItem key={grade} value={`Grade ${grade}`}>
                                  Grade {grade}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="current_academic_year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Academic Year</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select year" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="school_level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select school level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Primary School">Primary School</SelectItem>
                              <SelectItem value="Middle School">Middle School</SelectItem>
                              <SelectItem value="High School">High School</SelectItem>
                              <SelectItem value="College">College</SelectItem>
                            </SelectContent>
                          </Select>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select CBC category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Lower Primary">Lower Primary</SelectItem>
                              <SelectItem value="Upper Primary">Upper Primary</SelectItem>
                              <SelectItem value="Junior Secondary">Junior Secondary</SelectItem>
                              <SelectItem value="Senior Secondary">Senior Secondary</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accommodation_status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Accommodation Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select accommodation status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Boarder">Boarder</SelectItem>
                              <SelectItem value="Day Scholar">Day Scholar</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Additional Information */}
                <TabsContent value="additional" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="health_status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Health Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select health status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Healthy">Healthy</SelectItem>
                              <SelectItem value="Disabled">Disabled</SelectItem>
                              <SelectItem value="Cognitive Delay">Cognitive Delay</SelectItem>
                              <SelectItem value="Chronic Illness">Chronic Illness</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="height_cm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Height (cm)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter height in cm" 
                              {...field} 
                            />
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
                            <Input 
                              type="number" 
                              placeholder="Enter weight in kg" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL Slug</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="URL-friendly identifier" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Leave blank to generate automatically from name
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="sm:col-span-2">
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter student description or bio" 
                                className="min-h-[120px]" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Sponsorship Information */}
                <TabsContent value="sponsor" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="sponsor_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sponsor ID</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter sponsor ID" {...field} />
                          </FormControl>
                          <FormDescription>
                            Leave blank if student is not sponsored
                          </FormDescription>
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
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </ScrollArea>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                type="submit" 
                disabled={uploadingImage || form.formState.isSubmitting}
              >
                {uploadingImage 
                  ? "Uploading..." 
                  : form.formState.isSubmitting 
                  ? "Saving..." 
                  : isEditMode 
                  ? "Update Student" 
                  : "Add Student"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
