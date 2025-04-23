
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import ImageUploadCropper from "./ImageUploadCropper";
import { StudentFormInput } from "@/types/database";

const SCHOOL_LEVELS = [
  "SNE",
  "Pre-Primary (Playgroup, PP1 and PP2)",
  "Lower Primary (Grade 1-3)",
  "Upper Primary (Grade 4-6)",
  "Junior School (Grade 7-9)",
  "Senior School (Grade 10-12)",
];
const CBC_CATEGORIES = [
  "Playgroup", "PP1", "PP2", "Grade 1", "Grade 2", "Grade 3",
  "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", 
  "Grade 10", "Grade 11", "Grade 12", "SNE"
];
const ACCOMMODATION = ["Boarder", "Day Scholar"];
const GENDERS = ["Male", "Female"];

interface AddEditStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Partial<StudentFormInput>;
  onSubmit: (data: StudentFormInput) => void;
  isLoading?: boolean;
}

const STEP_TITLES = ["Basic Info", "Academic Info", "Additional Info"];

export function AddEditStudentModal({
  open,
  onOpenChange,
  student,
  onSubmit,
  isLoading,
}: AddEditStudentModalProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<StudentFormInput>(
    student ? {
      name: student.name || "",
      admission_number: student.admission_number || "",
      dob: student.dob || "",
      gender: (student.gender as "Male" | "Female") || "Male",
      status: student.status || "Active",
      accommodation_status: student.accommodation_status || ACCOMMODATION[0],
      health_status: student.health_status || "",
      location: student.location || "",
      description: student.description || "",
      school_level: student.school_level || "",
      cbc_category: student.cbc_category || "",
      current_grade: student.current_grade || "",
      current_academic_year: student.current_academic_year || null,
      height_cm: student.height_cm || null,
      weight_kg: student.weight_kg || null,
      admission_date: student.admission_date || "",
      sponsor_id: student.sponsor_id || "",
      sponsored_since: student.sponsored_since || "",
      profile_image_url: student.profile_image_url || "",
      slug: student.slug || "",
    } : {
      name: "",
      admission_number: "",
      dob: "",
      gender: "Male",
      status: "Active",
      accommodation_status: ACCOMMODATION[0],
      health_status: "",
      location: "",
      description: "",
      school_level: "",
      cbc_category: "",
      current_grade: "",
      current_academic_year: null,
      height_cm: null,
      weight_kg: null,
      admission_date: "",
      sponsor_id: "",
      sponsored_since: "",
      profile_image_url: "",
      slug: "",
    }
  );
  // Ensure modal has a fixed height for all steps
  const containerFixedHeight = "h-[500px]";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePickGender = (value: "Male" | "Female") => setForm(f => ({ ...f, gender: value }));

  const handleImageChange = (url: string) => setForm((f) => ({ ...f, profile_image_url: url }));

  const next = () => setStep((s) => Math.min(2, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{student ? "Edit Student" : "Add Student"}</DialogTitle>
            <div className="flex justify-center gap-4 my-2">
              {STEP_TITLES.map((title, i) => (
                <span key={i} className={`text-xs font-medium ${i === step ? "text-primary underline" : "text-muted-foreground"}`}>
                  {title}
                </span>
              ))}
            </div>
          </DialogHeader>
          <div className={`overflow-y-auto ${containerFixedHeight} transition-all px-2 pt-2`}>
            {step === 0 && (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="admission_number">Admission Number</Label>
                  <Input name="admission_number" value={form.admission_number} onChange={handleChange} required />
                </div>
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input name="name" value={form.name} onChange={handleChange} required />
                </div>
                <div>
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input name="dob" type="date" value={form.dob ?? ""} onChange={handleChange} required />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={form.gender || ""} onValueChange={handlePickGender}>
                    <SelectTrigger>
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
                  <ImageUploadCropper
                    value={form.profile_image_url || ""}
                    onChange={handleImageChange}
                  />
                </div>
              </div>
            )}
            {step === 1 && (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="school_level">School Level</Label>
                  <Select value={form.school_level || ""} onValueChange={v => setForm(f => ({...f, school_level: v}))}>
                    <SelectTrigger>
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
                  <Label htmlFor="cbc_category">CBC Category</Label>
                  <Select value={form.cbc_category || ""} onValueChange={v => setForm(f => ({...f, cbc_category: v}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select CBC" />
                    </SelectTrigger>
                    <SelectContent>
                      {CBC_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="current_grade">Current Grade</Label>
                  <Input name="current_grade" value={form.current_grade || ""} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="admission_date">Admission Date</Label>
                  <Input name="admission_date" type="date" value={form.admission_date || ""} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
                    <SelectTrigger>
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
            )}
            {step === 2 && (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="accommodation_status">Accommodation</Label>
                  <Select value={form.accommodation_status || ""} onValueChange={v => setForm(f => ({...f, accommodation_status: v}))}>
                    <SelectTrigger>
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
                  <Input name="health_status" value={form.health_status || ""} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input name="location" value={form.location || ""} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input name="description" value={form.description || ""} onChange={handleChange} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="height_cm">Height (cm)</Label>
                    <Input name="height_cm" type="number" value={form.height_cm || ""} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="weight_kg">Weight (kg)</Label>
                    <Input name="weight_kg" type="number" value={form.weight_kg || ""} onChange={handleChange} />
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            {step > 0 && (
              <Button type="button" variant="outline" onClick={prev}>
                Previous
              </Button>
            )}
            {step < 2 && (
              <Button type="button" onClick={next}>
                Next
              </Button>
            )}
            {step === 2 && (
              <Button type="submit" className="ml-auto" disabled={isLoading}>
                {isLoading ? "Saving..." : student ? "Update Student" : "Add Student"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
