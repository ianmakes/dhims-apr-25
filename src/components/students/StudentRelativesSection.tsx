import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Phone, UserCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ImageUploadCropper from "./ImageUploadCropper";
import { useQuery } from "@tanstack/react-query";
import { StudentRelative } from "@/types/database";
import { useAuth } from "@/contexts/AuthContext";

const RELATIONSHIPS = [
  "Father", "Mother", "Grandfather", "Grandmother", "Brother", "Sister", 
  "Uncle", "Aunt", "Guardian", "Other"
];

interface StudentRelativesSectionProps {
  studentId: string;
  studentName: string;
}

export function StudentRelativesSection({ studentId, studentName }: StudentRelativesSectionProps) {
  const [isAddRelativeModalOpen, setIsAddRelativeModalOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newRelative, setNewRelative] = useState({
    name: "",
    relationship: "",
    phone_number: "",
    photo_url: "",
  });
  
  const { 
    data: relatives = [], 
    refetch 
  } = useQuery<StudentRelative[]>({
    queryKey: ['student-relatives', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_relatives')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewRelative(prev => ({ ...prev, [name]: value }));
  };

  const handleRelationshipChange = (value: string) => {
    setNewRelative(prev => ({ ...prev, relationship: value }));
  };

  const handlePhotoChange = (url: string) => {
    setNewRelative(prev => ({ ...prev, photo_url: url }));
  };

  const handleAddRelative = async () => {
    if (!newRelative.name || !newRelative.relationship) {
      toast({
        title: "Missing information",
        description: "Name and relationship are required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('student_relatives')
        .insert({
          student_id: studentId,
          name: newRelative.name,
          relationship: newRelative.relationship,
          phone_number: newRelative.phone_number,
          photo_url: newRelative.photo_url || null
        });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Relative added successfully"
      });
      
      setNewRelative({
        name: "",
        relationship: "",
        phone_number: "",
        photo_url: "",
      });
      
      setIsAddRelativeModalOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add relative",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRelative = async (id: string) => {
    try {
      const { error } = await supabase
        .from('student_relatives')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Relative removed successfully"
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove relative",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Relatives</CardTitle>
        <Button onClick={() => setIsAddRelativeModalOpen(true)} size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Relative
        </Button>
      </CardHeader>
      <CardContent>
        {relatives.length > 0 ? (
          <div className="space-y-4">
            {relatives.map((relative) => (
              <div key={relative.id} className="flex items-center justify-between p-3 border rounded-md bg-background">
                <div className="flex items-center gap-3">
                  {relative.photo_url ? (
                    <img 
                      src={relative.photo_url} 
                      alt={relative.name} 
                      className="h-12 w-12 rounded-full object-cover" 
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <UserCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium">{relative.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {relative.relationship}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {relative.phone_number && (
                    <div className="flex items-center text-sm">
                      <Phone className="h-3 w-3 mr-1" />
                      {relative.phone_number}
                    </div>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeleteRelative(relative.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground mb-4">No relatives added for this student yet</p>
            <Button onClick={() => setIsAddRelativeModalOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add relative here
            </Button>
          </div>
        )}
      </CardContent>

      {/* Add Relative Modal */}
      <Dialog open={isAddRelativeModalOpen} onOpenChange={setIsAddRelativeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Relative</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={newRelative.name}
                onChange={handleInputChange}
                placeholder="Full name of relative"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="relationship">Relationship</Label>
              <Select value={newRelative.relationship} onValueChange={handleRelationshipChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((rel) => (
                    <SelectItem key={rel} value={rel}>{rel}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                name="phone_number"
                value={newRelative.phone_number}
                onChange={handleInputChange}
                placeholder="Contact phone number"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="photo">Photo (Optional)</Label>
              <ImageUploadCropper
                value={newRelative.photo_url}
                onChange={handlePhotoChange}
                label="Relative Photo"
                aspectRatio={1}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddRelativeModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddRelative} 
              disabled={isSubmitting || !newRelative.name || !newRelative.relationship}
            >
              {isSubmitting ? "Adding..." : "Add Relative"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
