import { useState, useRef } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon, Image, Upload } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SponsorFormValues } from "@/hooks/useSponsors";
import { RadioGroup, RadioIndicator, RadioItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Define form schema
const sponsorFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  email2: z.string().email({ message: "Please enter a valid email address." }).optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  startDate: z.string(),
  status: z.enum(["active", "inactive"]),
  notes: z.string().optional().or(z.literal("")),
  profileImageUrl: z.string().optional().or(z.literal("")),
  primaryEmailForUpdates: z.string().optional().or(z.literal("")),
});

interface AddEditSponsorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sponsor?: SponsorFormValues;
  onSubmit: (data: SponsorFormValues) => void;
}

export function AddEditSponsorModal({
  open,
  onOpenChange,
  sponsor,
  onSubmit,
}: AddEditSponsorModalProps) {
  const isEditMode = !!sponsor;
  const [date, setDate] = useState<Date | undefined>(
    sponsor ? new Date(sponsor.startDate) : new Date()
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Initialize form with sponsor data or empty values
  const form = useForm<SponsorFormValues>({
    resolver: zodResolver(sponsorFormSchema),
    defaultValues: sponsor
      ? {
          firstName: sponsor.firstName,
          lastName: sponsor.lastName,
          email: sponsor.email,
          email2: sponsor.email2 || "",
          phone: sponsor.phone || "",
          address: sponsor.address || "",
          country: sponsor.country || "",
          startDate: formatDateSafely(sponsor.startDate),
          status: sponsor.status,
          notes: sponsor.notes || "",
          profileImageUrl: sponsor.profileImageUrl || "",
          primaryEmailForUpdates: sponsor.primaryEmailForUpdates || "",
        }
      : {
          firstName: "",
          lastName: "",
          email: "",
          email2: "",
          phone: "",
          address: "",
          country: "",
          startDate: formatDateSafely(new Date()),
          status: "active",
          notes: "",
          profileImageUrl: "",
          primaryEmailForUpdates: "",
        },
  });

  // Direct file upload handling
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setUploadingImage(true);
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      
      const fileName = `sponsor-${Date.now()}.${file.name.split('.').pop()}`;
      const filePath = `${fileName}`;
      
      // Upload the image to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('sponsor-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }

      // Get the public URL for the uploaded image
      const { data } = supabase.storage.from('sponsor-images').getPublicUrl(filePath);

      // Update the form with the new image URL
      form.setValue('profileImageUrl', data.publicUrl);
      toast.success("Image uploaded successfully");
      
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // Handle form submission
  const handleSubmit = (values: SponsorFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  // Steps management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const goToNextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const goToPreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Sponsor" : "Add New Sponsor"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the sponsor's information in the form below."
              : "Fill out the form below to add a new sponsor."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Step indicator */}
            <div className="flex justify-between mb-6">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full flex-1 mx-1 ${
                    currentStep >= index + 1
                      ? "bg-primary"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
            
            {currentStep === 1 && (
              <div className="space-y-4 fade-in">
                <h3 className="text-lg font-medium">Basic Information</h3>
                
                {/* Profile Image - Direct upload using input file */}
                <FormField
                  control={form.control}
                  name="profileImageUrl"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-center space-y-4 mb-6">
                      <FormLabel className="text-center">Profile Image (Optional)</FormLabel>
                      <FormControl>
                        <div className="flex flex-col items-center">
                          {field.value ? (
                            <Avatar className="h-28 w-28 mb-2">
                              <AvatarImage src={field.value} alt="Sponsor" />
                              <AvatarFallback>
                                {form.getValues("firstName")?.[0]}{form.getValues("lastName")?.[0]}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="h-28 w-28 rounded-full bg-muted flex items-center justify-center mb-2">
                              <Image className="h-10 w-10 text-muted-foreground" />
                            </div>
                          )}
                          <div className="mt-2">
                            <input 
                              type="file"
                              id="profile-image"
                              accept="image/*"
                              className="hidden"
                              onChange={handleFileChange}
                              ref={fileInputRef}
                            />
                            <Button 
                              type="button" 
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploadingImage}
                            >
                              {uploadingImage ? (
                                "Uploading..."
                              ) : field.value ? (
                                "Change Image"
                              ) : (
                                "Upload Image"
                              )}
                              <Upload className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* First Name */}
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Last Name */}
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email 2 (Optional) */}
                <FormField
                  control={form.control}
                  name="email2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secondary Email (Optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john.alternate@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Email preferences - Horizontal radio group */}
                <FormField
                  control={form.control}
                  name="primaryEmailForUpdates"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Email to use for student updates</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex flex-wrap gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioItem value={form.getValues("email")} id="primary-email">
                              <RadioIndicator />
                            </RadioItem>
                            <label
                              htmlFor="primary-email"
                              className="text-sm font-medium leading-none cursor-pointer"
                            >
                              Primary Email
                            </label>
                          </div>
                          
                          {form.getValues("email2") && (
                            <div className="flex items-center space-x-2">
                              <RadioItem value={form.getValues("email2")} id="secondary-email">
                                <RadioIndicator />
                              </RadioItem>
                              <label
                                htmlFor="secondary-email"
                                className="text-sm font-medium leading-none cursor-pointer"
                              >
                                Secondary Email
                              </label>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-2">
                            <RadioItem value="both" id="both-emails">
                              <RadioIndicator />
                            </RadioItem>
                            <label
                              htmlFor="both-emails"
                              className="text-sm font-medium leading-none cursor-pointer"
                            >
                              Both Emails
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            {currentStep === 2 && (
              <div className="space-y-4 fade-in">
                <h3 className="text-lg font-medium">Contact Information</h3>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Phone */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 123-456-7890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Country */}
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="United States" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Address */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="123 Main St, City, State, ZIP"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Start Date and Status - Aligned horizontally */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Start Date - Simple calendar picker */}
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(new Date(field.value), "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => {
                                setDate(date);
                                field.onChange(date ? formatDateSafely(date) : "");
                              }}
                              disabled={(date) => 
                                date > new Date()
                              }
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Status */}
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
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
            
            {currentStep === 3 && (
              <div className="space-y-4 fade-in">
                <h3 className="text-lg font-medium">Additional Information</h3>
                
                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional information about the sponsor..."
                          className="resize-none h-60"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={currentStep === 1 ? () => onOpenChange(false) : goToPreviousStep}
              >
                {currentStep === 1 ? "Cancel" : "Back"}
              </Button>
              
              <div className="space-x-2">
                {currentStep < totalSteps ? (
                  <Button type="button" onClick={goToNextStep}>
                    Next
                  </Button>
                ) : (
                  <Button type="submit">
                    {isEditMode ? "Update Sponsor" : "Add Sponsor"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
