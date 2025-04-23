
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentFormInput } from "@/types/database";

interface StudentDetailsTabProps {
  student: StudentFormInput & { [key: string]: any };
  formatDate: (date: string | Date | null | undefined) => string;
}

export function StudentDetailsTab({ student, formatDate }: StudentDetailsTabProps) {
  return (
    <div className="space-y-6 py-4">
      <Card>
        <CardHeader>
          <CardTitle>Academic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="font-medium">Current Grade</h3>
            <p>{student.current_grade}</p>
          </div>
          <div>
            <h3 className="font-medium">Admission Date</h3>
            <p>{formatDate(student.admission_date)}</p>
          </div>
          <div>
            <h3 className="font-medium">Status</h3>
            <p className="capitalize">{student.status}</p>
          </div>
          <div>
            <h3 className="font-medium">Sponsorship</h3>
            <p>{student.sponsor_id ? "Sponsored" : "Unsponsored"}</p>
          </div>
          <div>
            <h3 className="font-medium">CBC Category</h3>
            <p>{student.cbc_category || "N/A"}</p>
          </div>
          <div>
            <h3 className="font-medium">School Level</h3>
            <p>{student.school_level || "N/A"}</p>
          </div>
          <div>
            <h3 className="font-medium">Academic Year</h3>
            <p>{student.current_academic_year || new Date().getFullYear()}</p>
          </div>
          <div>
            <h3 className="font-medium">Accommodation</h3>
            <p>{student.accommodation_status || "N/A"}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="font-medium">Full Name</h3>
            <p>{student.name}</p>
          </div>
          <div>
            <h3 className="font-medium">Admission Number</h3>
            <p>{student.admission_number}</p>
          </div>
          <div>
            <h3 className="font-medium">Date of Birth</h3>
            <p>{formatDate(student.dob)}</p>
          </div>
          <div>
            <h3 className="font-medium">Gender</h3>
            <p className="capitalize">{student.gender}</p>
          </div>
          <div>
            <h3 className="font-medium">Age</h3>
            <p>
              {student.dob
                ? Math.floor(
                    (new Date().getTime() - new Date(student.dob).getTime()) / 3.15576e10
                  ) + " years"
                : "N/A"}
            </p>
          </div>
          <div>
            <h3 className="font-medium">Health Status</h3>
            <p>{student.health_status || "Healthy"}</p>
          </div>
          <div>
            <h3 className="font-medium">Height</h3>
            <p>{student.height_cm ? `${student.height_cm} cm` : "N/A"}</p>
          </div>
          <div>
            <h3 className="font-medium">Weight</h3>
            <p>{student.weight_kg ? `${student.weight_kg} kg` : "N/A"}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Student Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line">
            {student.description || "No description available."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
