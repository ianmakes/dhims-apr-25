
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, BackpackIcon, MapPin } from "lucide-react";
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
  return <Card className="lg:col-span-2">
      <CardHeader className="text-center">
        <Avatar className="mx-auto h-24 w-24">
          <AvatarImage src={student.profile_image_url} alt={student.name} />
          <AvatarFallback className="text-2xl">
            {student.name ? student.name.charAt(0) : "S"}
          </AvatarFallback>
        </Avatar>
        <CardTitle className="mt-2">{student.name}</CardTitle>
        <div className="flex justify-center">
          <Badge variant={student.status === "Active" ? "default" : student.status === "Inactive" ? "secondary" : student.status === "Graduated" ? "outline" : "destructive"} className={student.status === "Inactive" ? "opacity-60" : ""}>
            {student.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <User className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Gender:</span>
            <span className="ml-auto capitalize">{student.gender}</span>
          </div>
          <div className="flex items-center text-sm">
            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Date of Birth:</span>
            <span className="ml-auto">{formatDate(student.dob)}</span>
          </div>
          <div className="flex items-center text-sm">
            <BackpackIcon className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Grade:</span>
            <span className="ml-auto">{student.current_grade}</span>
          </div>
          <div className="flex items-center text-sm">
            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Admission Date:</span>
            <span className="ml-auto">{formatDate(student.admission_date)}</span>
          </div>
          <div className="flex items-center text-sm">
            <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Location:</span>
            <span className="ml-auto">{student.location || "N/A"}</span>
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          <h3 className="font-medium text-left">Academic Information</h3>
          <div className="flex items-center text-sm">
            <User className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">CBC Category:</span>
            <span className="ml-auto">{student.cbc_category || "N/A"}</span>
          </div>
          <div className="flex items-center text-sm">
            <User className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">School Level:</span>
            <span className="ml-auto">{student.school_level || "N/A"}</span>
          </div>
          <div className="flex items-center text-sm">
            <User className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Academic Year:</span>
            <span className="ml-auto">{student.current_academic_year || new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center text-sm">
            <User className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Accommodation:</span>
            <span className="ml-auto">{student.accommodation_status || "N/A"}</span>
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          <h3 className="font-medium text-left">Health Information</h3>
          <div className="flex items-center text-sm">
            <User className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Health Status:</span>
            <span className="ml-auto">{student.health_status || "Healthy"}</span>
          </div>
          <div className="flex items-center text-sm">
            <User className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Height:</span>
            <span className="ml-auto">{student.height_cm ? `${student.height_cm} cm` : "N/A"}</span>
          </div>
          <div className="flex items-center text-sm">
            <User className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Weight:</span>
            <span className="ml-auto">{student.weight_kg ? `${student.weight_kg} kg` : "N/A"}</span>
          </div>
        </div>
        <Separator />
        <div className="text-xs text-muted-foreground">
          <p>Created: {formatDate(student.created_at)}</p>
          <p>Created by: {student.created_by_name || "System"}</p>
          {student.updated_at && <p>Last modified: {formatDate(student.updated_at)}</p>}
        </div>
      </CardContent>
    </Card>;
}
