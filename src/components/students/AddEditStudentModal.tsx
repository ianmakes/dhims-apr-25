
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import ImageUploadCropper from "./ImageUploadCropper";
import { StudentFormInput } from "@/types/database";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";

const SCHOOL_LEVELS = [
  "SNE",
  "Pre-Primary (Playgroup, PP1 and PP2)",
  "Lower Primary (Grade 1-3)",
  "Upper Primary (Grade 4-6)",
  "Junior School (Grade 7-9)",
  "Senior School (Grade 10-12)",
];

const CBC_GRADES = [
  "Playgroup", "PP1", "PP2", 
  "Grade 1", "Grade 2", "Grade 3", 
  "Grade 4", "Grade 5", "Grade 6", 
  "Grade 7", "Grade 8", "Grade 9", 
  "Grade 10", "Grade 11", "Grade 12", 
  "SNE"
];

const CBC_CATEGORIES = {
  "Playgroup": "Pre-Primary",
  "PP1": "Pre-Primary",
  "PP2": "Pre-Primary",
  "Grade 1": "Lower Primary",
  "Grade 2": "Lower Primary",
  "Grade 3": "Lower Primary",
  "Grade 4": "Upper Primary",
  "Grade 5": "Upper Primary",
  "Grade 6": "Upper Primary",
  "Grade 7": "Junior Secondary",
  "Grade 8": "Junior Secondary",
  "Grade 9": "Junior Secondary",
  "Grade 10": "Senior Secondary",
  "Grade 11": "Senior Secondary",
  "Grade 12": "Senior Secondary",
  "SNE": "Special Needs Education"
};

const ACCOMMODATION = ["Boarder", "Day Scholar"];
const GENDERS = ["Male", "Female"];
const HEALTH_STATUS = ["Healthy", "Disabled", "Cognitive Disorder"];

interface AddEditStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Partial<StudentFormInput>;
  onSubmit: (data: StudentFormInput) => void;
  isLoading?: boolean;
}

export function AddEditStudentModal({
  open,
  onOpenChange,
  student,
  onSubmit,
  isLoading,
}: AddEditStudentModalProps) {
  const [form, setForm] = useState<StudentFormInput>(
    student ? {
      name: student.name || "",
      admission_number: student.admission_number || "",
      dob: student.dob || "",
      gender: (student.gender as "Male" | "Female") || "Male",
      status: student.status || "Active",
      accommodation_status: student.accommodation_status || ACCOMMODATION[0],
      health_status: student.health_status || "Healthy",
      location: student.location || "",
      description: student.description || "",
      school_level: student.school_level || "",
      cbc_category: student.cbc_category || "",
      current_grade: student.current_grade || "",
      current_academic_year: student.current_academic_year || null,
      height_cm: student.height_cm || null,
      weight_kg: student.weight_kg || null,
      admission_date: student.admission_date || "",
      sponsor_id: student.sponsor_id || null,
      sponsored_since: student.sponsored_since || null,
      profile_image_url: student.profile_image_url || "",
      slug: student.slug || "",
    } : {
      name: "",
      admission_number: "",
      dob: "",
      gender: "Male",
      status: "Active",
      accommodation_status: ACCOMMODATION[0],
      health_status: "Healthy",
      location: "",
      description: "",
      school_level: "",
      cbc_category: "",
      current_grade: "",
      current_academic_year: null,
      height_cm: null,
      weight_kg: null,
      admission_date: "",
      sponsor_id: null,
      sponsored_since: null,
      profile_image_url: "",
      slug: "",
    }
  );
  
  const [currentStep, setCurrentStep] = useState(0);
  const steps = ["Basic Info", "Academic Info", "Additional Info"];
  
  const containerFixedHeight = "h-[500px]";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePickGender = (value: "Male" | "Female") => setForm(f => ({ ...f, gender: value }));
  const handlePickHealthStatus = (value: string) => setForm(f => ({ ...f, health_status: value }));
  const handlePickGrade = (value: string) => setForm(f => ({ 
    ...f, 
    current_grade: value,
    cbc_category: CBC_CATEGORIES[value as keyof typeof CBC_CATEGORIES] || ""
  }));
  const handleImageChange = (url: string) => setForm((f) => ({ ...f, profile_image_url: url }));

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSubmit(form);
  };

  const nextStep = () => setCurrentStep((current) => Math.min(current + 1, steps.length - 1));
  const prevStep = () => setCurrentStep((current) => Math.max(current - 1, 0));
  
  // Determine if the form is valid for the current step
  const isStepValid = (step: number) => {
    switch(step) {
      case 0: // Basic Info
        return !!form.name && !!form.admission_number;
      case 1: // Academic Info
        return !!form.current_grade;
      case 2: // Additional Info
        return true; // No required fields in the additional info step
      default:
        return false;
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{student ? "Edit Student" : "Add Student"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => {
          e.preventDefault();
          // Only submit the form if we're on the last step
          if (currentStep === steps.length - 1) {
            handleSubmit();
          } else {
            nextStep();
          }
        }} className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <div className="space-x-1">
              {steps.map((step, index) => (
                <React.Fragment key={step}>
                  <Button 
                    type="button"
                    variant={currentStep === index ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentStep(index)}
                    className={`rounded-full px-3 ${currentStep === index ? "" : "text-gray-400"}`}
                  >
                    {index + 1}
                  </Button>
                  {index < steps.length - 1 && (
                    <span className="text-gray-300">—</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="text-sm font-medium">{steps[currentStep]}</div>
          </div>
          
          <Tabs value={steps[currentStep].toLowerCase().replace(/\s+/g, '-')} className="w-full">
            <div className={`overflow-y-auto ${containerFixedHeight}`}>
              <TabsContent value="basic-info" className={currentStep === 0 ? "block" : "hidden"}>
                <Card className="p-4 border rounded-lg shadow-sm">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="admission_number">Admission Number <span className="text-red-500">*</span></Label>
                      <Input 
                        name="admission_number" 
                        value={form.admission_number || ""} 
                        onChange={handleChange} 
                        required 
                        className="mt-1" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                      <Input 
                        name="name" 
                        value={form.name || ""} 
                        onChange={handleChange} 
                        required 
                        className="mt-1" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input 
                        name="dob" 
                        type="date" 
                        value={form.dob?.toString().substring(0, 10) || ""} 
                        onChange={handleChange} 
                        className="mt-1" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender <span className="text-red-500">*</span></Label>
                      <Select value={form.gender || "Male"} onValueChange={handlePickGender}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {GENDERS.map(g => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="profile_image_url">Profile Image</Label>
                      <div className="mt-2">
                        <ImageUploadCropper
                          value={form.profile_image_url || ""}
                          onChange={handleImageChange}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
              
              <TabsContent value="academic-info" className={currentStep === 1 ? "block" : "hidden"}>
                <Card className="p-4 border rounded-lg shadow-sm">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="school_level">School Level</Label>
                      <Select 
                        value={form.school_level || ""} 
                        onValueChange={v => setForm(f => ({...f, school_level: v}))}
                        disabled={!!form.current_grade} // Disabled if grade is selected
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {SCHOOL_LEVELS.map((l) => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="current_grade">Grade <span className="text-red-500">*</span></Label>
                      <Select 
                        value={form.current_grade || ""} 
                        onValueChange={handlePickGrade}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select Grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {CBC_GRADES.map((grade) => (
                            <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="cbc_category">CBC Category</Label>
                      <Input 
                        name="cbc_category" 
                        value={form.cbc_category || ""} 
                        disabled 
                        className="mt-1 bg-gray-50" 
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        This is automatically determined by the Grade selection
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="admission_date">Admission Date</Label>
                      <Input 
                        name="admission_date" 
                        type="date" 
                        value={form.admission_date?.toString().substring(0, 10) || ""} 
                        onChange={handleChange} 
                        className="mt-1" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={form.status || "Active"} onValueChange={v => setForm(f => ({...f, status: v}))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                          <SelectItem value="Graduated">Graduated</SelectItem>
                          <SelectItem value="Transferred">Transferred</SelectItem>
                          <SelectItem value="Suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              </TabsContent>
              
              <TabsContent value="additional-info" className={currentStep === 2 ? "block" : "hidden"}>
                <Card className="p-4 border rounded-lg shadow-sm">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="accommodation_status">Accommodation</Label>
                      <Select value={form.accommodation_status || ""} onValueChange={v => setForm(f => ({...f, accommodation_status: v}))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select accommodation" />
                        </SelectTrigger>
                        <SelectContent>
                          {ACCOMMODATION.map((a) => (
                            <SelectItem key={a} value={a}>{a}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="health_status">Health Status</Label>
                      <Select value={form.health_status || "Healthy"} onValueChange={handlePickHealthStatus}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select health status" />
                        </SelectTrigger>
                        <SelectContent>
                          {HEALTH_STATUS.map((status) => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input name="location" value={form.location || ""} onChange={handleChange} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input name="description" value={form.description || ""} onChange={handleChange} className="mt-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="height_cm">Height (cm)</Label>
                        <Input name="height_cm" type="number" value={form.height_cm || ""} onChange={handleChange} className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="weight_kg">Weight (kg)</Label>
                        <Input name="weight_kg" type="number" value={form.weight_kg || ""} onChange={handleChange} className="mt-1" />
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
          
          <div className="flex justify-between mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={prevStep} 
              disabled={currentStep === 0}
              className="flex items-center"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button 
                type="button" 
                onClick={nextStep}
                className="flex items-center"
                disabled={!isStepValid(currentStep)}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex items-center"
              >
                {isLoading ? "Saving..." : (
                  <>
                    <Save className="w-4 h-4 mr-1" /> 
                    {student ? "Update Student" : "Add Student"}
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
