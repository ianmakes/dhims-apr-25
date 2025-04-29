
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StudentFormInput } from "@/types/database";
import { Calendar, MapPin, School, User } from "lucide-react";

interface StudentProfileSidebarProps {
  student: StudentFormInput & {
    [key: string]: any;
  };
  formatDate: (date: string | null | undefined) => string;
}

export function StudentProfileSidebar({ student, formatDate }: StudentProfileSidebarProps) {
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
        <div className="flex flex-col items-center pt-6 pb-2">
          <Avatar className="h-24 w-24 border-4 border-background mb-4">
            <AvatarImage src={student.profile_image_url || undefined} alt={student.name} />
            <AvatarFallback className="text-lg">{getInitials(student.name)}</AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold">{student.name}</h2>
          <div className="mt-2 mb-4">
            <Badge variant={student.status === "Active" ? "default" : "outline"}>
              {student.status}
            </Badge>
          </div>
        </div>

        <CardContent className="px-6 py-0">
          {/* Basic Information */}
          <div className="space-y-3 py-4 border-t border-border">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Gender:</span>
              </div>
              <span className="text-right">{student.gender}</span>
            </div>

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Date of Birth:</span>
              </div>
              <span className="text-right">{formatDate(student.dob)}</span>
            </div>

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <School className="h-4 w-4" />
                <span>Grade:</span>
              </div>
              <span className="text-right">{student.current_grade || "N/A"}</span>
            </div>

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Admission Date:</span>
              </div>
              <span className="text-right">{formatDate(student.admission_date)}</span>
            </div>

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Location:</span>
              </div>
              <span className="text-right">{student.location || "N/A"}</span>
            </div>
          </div>

          {/* Academic Information */}
          <div className="border-t border-border pt-4 pb-4">
            <h3 className="font-semibold mb-3">Academic Information</h3>
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>CBC Category:</span>
                </div>
                <span className="text-right">{student.cbc_category || "N/A"}</span>
              </div>

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>School Level:</span>
                </div>
                <span className="text-right">{student.school_level || "N/A"}</span>
              </div>

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Academic Year:</span>
                </div>
                <span className="text-right">{student.current_academic_year || new Date().getFullYear()}</span>
              </div>

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Accommodation:</span>
                </div>
                <span className="text-right">{student.accommodation_status || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Health Information */}
          <div className="border-t border-border pt-4 pb-4">
            <h3 className="font-semibold mb-3">Health Information</h3>
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Health Status:</span>
                </div>
                <span className="text-right">{student.health_status || "Healthy"}</span>
              </div>

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Height:</span>
                </div>
                <span className="text-right">{student.height_cm ? `${student.height_cm} cm` : "N/A"}</span>
              </div>

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Weight:</span>
                </div>
                <span className="text-right">{student.weight_kg ? `${student.weight_kg} kg` : "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Created/Modified Info */}
          <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
            <div>Created: {formatDate(student.created_at)}</div>
            <div>Last modified: {formatDate(student.updated_at)}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
