
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AssignSponsorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (sponsorId: string) => void;
  studentId: string;
}

export function AssignSponsorModal({ open, onOpenChange, onAssign, studentId }: AssignSponsorModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: sponsors = [], isLoading } = useQuery({
    queryKey: ['sponsors-for-assignment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .order('last_name', { ascending: true });
        
      if (error) throw error;
      return data || [];
    },
    enabled: open
  });

  const filteredSponsors = sponsors.filter(sponsor => 
    sponsor.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sponsor.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sponsor.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Sponsor</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <Input
            placeholder="Search sponsors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-4"
          />
          
          <ScrollArea className="h-[300px] pr-4">
            {isLoading ? (
              <div className="flex justify-center p-4">
                <p>Loading sponsors...</p>
              </div>
            ) : filteredSponsors.length > 0 ? (
              <div className="space-y-2">
                {filteredSponsors.map((sponsor) => (
                  <div 
                    key={sponsor.id}
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-accent cursor-pointer"
                    onClick={() => onAssign(sponsor.id)}
                  >
                    <div>
                      <p className="font-medium">{`${sponsor.first_name} ${sponsor.last_name}`}</p>
                      <p className="text-sm text-muted-foreground">{sponsor.email}</p>
                    </div>
                    <Button size="sm">Assign</Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No sponsors found</p>
              </div>
            )}
          </ScrollArea>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
