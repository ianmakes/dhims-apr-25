
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, BackpackIcon, MapPin, GraduationCap, Heart, Ruler, Weight } from "lucide-react";
import { StudentFormInput } from "@/types/database";

interface StudentProfileSidebarProps {
  student: StudentFormInput & {
    [key: string]: any;
  };
  formatDate: (date: string | Date | null | undefined) => string;
}

export function StudentProfileSidebar({
  student,
  formatDate
}: StudentProfileSidebarProps) {
  return (
    <Card className="lg:col-span-2 overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-0 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-transparent to-purple-100/20 dark:from-blue-900/10 dark:to-purple-900/10"></div>
      
      <CardHeader className="relative text-center pb-6 pt-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-20 scale-110"></div>
          <Avatar className="relative mx-auto h-28 w-28 ring-4 ring-white/50 dark:ring-slate-700/50 shadow-xl">
            <AvatarImage src={student.profile_image_url} alt={student.name} />
            <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {student.name ? student.name.charAt(0) : "S"}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <CardTitle className="mt-4 text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
          {student.name}
        </CardTitle>
        
        <div className="flex justify-center gap-3 mt-4">
          <Badge 
            variant={student.status === "Active" ? "default" : student.status === "Inactive" ? "secondary" : student.status === "Graduated" ? "outline" : "destructive"} 
            className={`px-4 py-1.5 font-medium shadow-sm ${student.status === "Inactive" ? "opacity-60" : ""}`}
          >
            {student.status}
          </Badge>
          <Badge 
            variant={student.sponsor_id ? "default" : "outline"} 
            className="px-4 py-1.5 font-medium shadow-sm"
          >
            {student.sponsor_id ? "Sponsored" : "Not Sponsored"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-6 px-6 pb-6">
        {/* Basic Information */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <User className="h-4 w-4 text-blue-500" />
            Personal Details
          </h3>
          <div className="grid gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                Gender
              </span>
              <span className="font-medium capitalize">{student.gender}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                Date of Birth
              </span>
              <span className="font-medium">{formatDate(student.dob)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                Location
              </span>
              <span className="font-medium">{student.location || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-indigo-500" />
            Academic Information
          </h3>
          <div className="grid gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <BackpackIcon className="h-3.5 w-3.5" />
                Current Grade
              </span>
              <span className="font-medium">{student.current_grade}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                Admission Date
              </span>
              <span className="font-medium">{formatDate(student.admission_date)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">CBC Category</span>
              <span className="font-medium">{student.cbc_category || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">School Level</span>
              <span className="font-medium">{student.school_level || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Academic Year</span>
              <span className="font-medium">{student.current_academic_year || new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Accommodation</span>
              <span className="font-medium">{student.accommodation_status || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Health Information */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500" />
            Health Information
          </h3>
          <div className="grid gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Heart className="h-3.5 w-3.5" />
                Health Status
              </span>
              <span className="font-medium">{student.health_status || "Healthy"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Ruler className="h-3.5 w-3.5" />
                Height
              </span>
              <span className="font-medium">{student.height_cm ? `${student.height_cm} cm` : "N/A"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Weight className="h-3.5 w-3.5" />
                Weight
              </span>
              <span className="font-medium">{student.weight_kg ? `${student.weight_kg} kg` : "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p className="flex justify-between">
              <span>Created:</span>
              <span>{formatDate(student.created_at)}</span>
            </p>
            <p className="flex justify-between">
              <span>Created by:</span>
              <span>{student.created_by_name || "System"}</span>
            </p>
            {student.updated_at && (
              <p className="flex justify-between">
                <span>Last modified:</span>
                <span>{formatDate(student.updated_at)}</span>
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
