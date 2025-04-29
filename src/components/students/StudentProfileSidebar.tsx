
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StudentFormInput } from "@/types/database";

interface StudentProfileSidebarProps {
  student: StudentFormInput & {
    [key: string]: any;
  };
  formatDate: (date: string | null | undefined) => string;
}

export function StudentProfileSidebar({ student, formatDate }: StudentProfileSidebarProps) {
  // Calculate age from date of birth
  const calculateAge = (dob: string | undefined | null) => {
    if (!dob) return "N/A";
    return Math.floor((new Date().getTime() - new Date(dob).getTime()) / 3.15576e10) + " years";
  };

  // Generate initials from student name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="lg:col-span-2 space-y-4">
      {/* Student Profile Card */}
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/30 relative">
          <div className="absolute -bottom-12 left-4">
            <Avatar className="h-24 w-24 border-4 border-background">
              <AvatarImage src={student.profile_image_url || undefined} alt={student.name} />
              <AvatarFallback className="text-lg">{getInitials(student.name)}</AvatarFallback>
            </Avatar>
          </div>
        </div>
        <CardContent className="pt-14 pb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">{student.name}</h2>
              <p className="text-muted-foreground text-sm">{student.admission_number}</p>
            </div>
            <Badge variant={student.status === "Active" ? "default" : "outline"}>
              {student.status}
            </Badge>
          </div>

          {/* Student Details */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <h3 className="font-semibold text-sm">Basic Information</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">CBC Category</p>
                  <p>{student.cbc_category || "N/A"}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">Current Grade</p>
                  <p>{student.current_grade || "N/A"}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">Gender</p>
                  <p>{student.gender}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">Age</p>
                  <p>{calculateAge(student.dob)}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">Date of Birth</p>
                  <p>{formatDate(student.dob)}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">Academic Year</p>
                  <p>{student.current_academic_year || new Date().getFullYear()}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <h3 className="font-semibold text-sm">Physical Details</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">Height</p>
                  <p>{student.height_cm ? `${student.height_cm} cm` : "N/A"}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">Weight</p>
                  <p>{student.weight_kg ? `${student.weight_kg} kg` : "N/A"}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">Health Status</p>
                  <p>{student.health_status || "Healthy"}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">Location</p>
                  <p>{student.location || "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <h3 className="font-semibold text-sm">Enrollment Information</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">Admission Date</p>
                  <p>{formatDate(student.admission_date)}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">Accommodation</p>
                  <p>{student.accommodation_status || "N/A"}</p>
                </div>
                <div className="space-y-0.5 col-span-2">
                  <p className="text-muted-foreground">Sponsorship Status</p>
                  <p>{student.sponsor_id ? "Sponsored" : "Unsponsored"}</p>
                </div>
                {student.sponsor_id && (
                  <div className="space-y-0.5 col-span-2">
                    <p className="text-muted-foreground">Sponsored Since</p>
                    <p>{formatDate(student.sponsored_since)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
