
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarIcon, EditIcon, MapPinIcon, MailIcon, PhoneIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StudentSponsorTabProps {
  student: any;
  sponsor?: any;
  isLoading?: boolean;
  formatDate: (date: string | Date | null | undefined) => string;
  navigate: (path: string) => void;
  toast: any;
}

export function StudentSponsorTab({
  student,
  sponsor,
  isLoading = false,
  formatDate,
  navigate,
  toast
}: StudentSponsorTabProps) {
  return (
    <div className="py-4">
      <Card>
        <CardHeader>
          <CardTitle>Sponsor Information</CardTitle>
          <CardDescription>
            {student.sponsor_id 
              ? "This student is currently sponsored"
              : "This student is not currently sponsored"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : student.sponsor_id && sponsor ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {sponsor.profile_image_url ? (
                    <AvatarImage src={sponsor.profile_image_url} alt={`${sponsor.first_name} ${sponsor.last_name}`} />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {sponsor.first_name?.[0]}{sponsor.last_name?.[0]}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h3 className="text-xl font-medium">
                    {sponsor.first_name} {sponsor.last_name}
                  </h3>
                  <p className="text-muted-foreground">Sponsor since {formatDate(student.sponsored_since)}</p>
                </div>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <MailIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Primary Email:</span>
                      <span className="ml-auto">{sponsor.email}</span>
                    </div>
                    
                    {sponsor.email2 && (
                      <div className="flex items-center space-x-2">
                        <MailIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Secondary Email:</span>
                        <span className="ml-auto">{sponsor.email2}</span>
                      </div>
                    )}
                    
                    {sponsor.phone && (
                      <div className="flex items-center space-x-2">
                        <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="ml-auto">{sponsor.phone}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Started:</span>
                      <span className="ml-auto">{formatDate(sponsor.start_date)}</span>
                    </div>
                    
                    {sponsor.country && (
                      <div className="flex items-center space-x-2">
                        <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Country:</span>
                        <span className="ml-auto">{sponsor.country}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    {sponsor.notes ? (
                      <div className="space-y-2">
                        <h4 className="font-medium">Notes</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{sponsor.notes}</p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No notes available for this sponsor</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/sponsors/${student.sponsor_id}`)}
                >
                  <EditIcon className="mr-2 h-4 w-4" />
                  View Sponsor Details
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">This student is not currently sponsored</p>
              <Button 
                variant="outline"
                onClick={() => navigate("/sponsors")}
              >
                View Available Sponsors
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
