import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentFormInput } from "@/types/database";
import { StudentRelativesSection } from "./StudentRelativesSection";
interface StudentDetailsTabProps {
  student: StudentFormInput & {
    [key: string]: any;
  };
  formatDate: (date: string | Date | null | undefined) => string;
}
export function StudentDetailsTab({
  student,
  formatDate
}: StudentDetailsTabProps) {
  return <div className="space-y-6 py-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-left">Academic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="font-medium text-left">Current Grade</h3>
            <p className="text-left">{student.current_grade}</p>
          </div>
          <div>
            <h3 className="font-medium text-left">Admission Date</h3>
            <p className="text-left">{formatDate(student.admission_date)}</p>
          </div>
          <div>
            <h3 className="font-medium text-left">Status</h3>
            <p className="capitalize text-left">{student.status}</p>
          </div>
          <div>
            <h3 className="font-medium text-left">Sponsorship</h3>
            <p className="text-left">{student.sponsor_id ? "Sponsored" : "Unsponsored"}</p>
          </div>
          <div>
            <h3 className="font-medium text-left">CBC Category</h3>
            <p className="text-left">{student.cbc_category || "N/A"}</p>
          </div>
          <div>
            <h3 className="font-medium text-left">School Level</h3>
            <p className="text-left">{student.school_level || "N/A"}</p>
          </div>
          <div>
            <h3 className="font-medium text-left">Academic Year</h3>
            <p className="text-left">{student.current_academic_year || new Date().getFullYear()}</p>
          </div>
          <div>
            <h3 className="font-medium text-left">Accommodation</h3>
            <p className="text-left">{student.accommodation_status || "N/A"}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-left">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="font-medium text-left">Full Name</h3>
            <p className="text-left">{student.name}</p>
          </div>
          <div>
            <h3 className="font-medium text-left">Admission Number</h3>
            <p className="text-left">{student.admission_number}</p>
          </div>
          <div>
            <h3 className="font-medium text-left">Date of Birth</h3>
            <p className="text-left">{formatDate(student.dob)}</p>
          </div>
          <div>
            <h3 className="font-medium text-left">Gender</h3>
            <p className="capitalize text-left">{student.gender}</p>
          </div>
          <div>
            <h3 className="font-medium text-left">Age</h3>
            <p className="text-left">
              {student.dob ? Math.floor((new Date().getTime() - new Date(student.dob).getTime()) / 3.15576e10) + " years" : "N/A"}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-left">Health Status</h3>
            <p className="text-left">{student.health_status || "Healthy"}</p>
          </div>
          <div>
            <h3 className="font-medium text-left">Height</h3>
            <p className="text-left">{student.height_cm ? `${student.height_cm} cm` : "N/A"}</p>
          </div>
          <div>
            <h3 className="font-medium text-left">Weight</h3>
            <p className="text-left">{student.weight_kg ? `${student.weight_kg} kg` : "N/A"}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-left">Student Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line text-left">
            {student.description || "No description available."}
          </p>
        </CardContent>
      </Card>
      
      {/* Relatives Section */}
      <StudentRelativesSection studentId={student.id} studentName={student.name} />
    </div>;
}