
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users } from "lucide-react";

interface StudentSponsorTabProps {
  student: { [key: string]: any };
  formatDate: (date: string | Date | null | undefined) => string;
  navigate: (to: string) => void;
  toast: (args: any) => void;
}

export function StudentSponsorTab({ student, formatDate, navigate, toast }: StudentSponsorTabProps) {
  if (student.sponsor_id) {
    return (
      <div className="py-4">
        <Card>
          <CardHeader>
            <CardTitle>Sponsor Information</CardTitle>
            <CardDescription>
              Details about {student.name}'s sponsor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl">SP</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-medium">Sponsor #{student.sponsor_id}</h3>
                <p className="text-muted-foreground">
                  Sponsoring since {formatDate(student.sponsored_since)}
                </p>
              </div>
            </div>
            <div className="flex justify-between">
              <Button
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() =>
                  toast({
                    title: "Sponsorship Removed",
                    description: "The sponsor has been removed from this student.",
                  })
                }
              >
                Remove Sponsorship
              </Button>
              <Button variant="outline" onClick={() => navigate(`/sponsors/${student.sponsor_id}`)}>
                <Users className="mr-2 h-4 w-4" />
                View Sponsor Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-4">
      <Card>
        <CardHeader>
          <CardTitle>No Sponsor Assigned</CardTitle>
          <CardDescription>
            This student currently does not have a sponsor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-6">
            <Button>
              <Users className="mr-2 h-4 w-4" />
              Assign Sponsor
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
