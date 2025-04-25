
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SponsorRelative } from "@/types/database";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageUploadCropper } from "@/components/students/ImageUploadCropper";
import { supabase } from "@/integrations/supabase/client";
import { Pencil, Plus, Trash2, User, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface SponsorRelativesSectionProps {
  sponsorId: string;
  relatives: SponsorRelative[];
  isLoading: boolean;
  onAddRelative: (relative: Omit<SponsorRelative, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdateRelative: (relative: Partial<SponsorRelative> & { id: string }) => void;
  onDeleteRelative: (id: string) => void;
}

export function SponsorRelativesSection({
  sponsorId,
  relatives,
  isLoading,
  onAddRelative,
  onUpdateRelative,
  onDeleteRelative,
}: SponsorRelativesSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentRelative, setCurrentRelative] = useState<Partial<SponsorRelative> | null>(null);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const RELATIONSHIP_TYPES = [
    "Spouse",
    "Partner",
    "Child",
    "Parent",
    "Sibling",
    "Friend",
    "Colleague",
    "Other"
  ];

  const resetForm = () => {
    setCurrentRelative(null);
    setIsEditMode(false);
  };

  const handleOpenEditDialog = (relative: SponsorRelative) => {
    setCurrentRelative(relative);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleOpenAddDialog = () => {
    setCurrentRelative({
      sponsor_id: sponsorId,
      name: "",
      relationship: "",
      email: "",
      phone_number: "",
    });
    setIsEditMode(false);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentRelative?.name || !currentRelative?.relationship || !currentRelative?.email) {
      toast.error("Please fill out all required fields");
      return;
    }
    
    if (isEditMode && currentRelative.id) {
      onUpdateRelative({
        id: currentRelative.id,
        name: currentRelative.name,
        relationship: currentRelative.relationship,
        email: currentRelative.email,
        phone_number: currentRelative.phone_number || null,
        photo_url: currentRelative.photo_url,
      });
    } else {
      onAddRelative({
        sponsor_id: sponsorId,
        name: currentRelative.name as string,
        relationship: currentRelative.relationship as string,
        email: currentRelative.email as string,
        phone_number: currentRelative.phone_number || null,
        photo_url: currentRelative.photo_url || null,
      });
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  const handleImageUpload = async (croppedImage: Blob) => {
    try {
      setIsUploading(true);
      
      const fileName = `relative-${Date.now()}.jpg`;
      const filePath = `sponsor-relatives/${fileName}`;
      
      // Upload the image to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('sponsor-images')
        .upload(filePath, croppedImage, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL for the uploaded image
      const { data } = supabase.storage.from('sponsor-images').getPublicUrl(filePath);

      // Update the form with the new image URL
      setCurrentRelative({
        ...currentRelative,
        photo_url: data.publicUrl
      });
      
      setShowImageUploader(false);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Relatives</CardTitle>
        <Button size="sm" onClick={handleOpenAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Relative
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading relatives...</div>
        ) : relatives.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No relatives have been added for this sponsor.
            <div className="mt-4">
              <Button variant="outline" onClick={handleOpenAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Relative
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {relatives.map((relative) => (
              <div
                key={relative.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    {relative.photo_url ? (
                      <AvatarImage src={relative.photo_url} alt={relative.name} />
                    ) : (
                      <AvatarFallback>
                        {relative.name[0]}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{relative.name}</h4>
                    <div className="text-sm text-muted-foreground">
                      <span className="mr-2">{relative.relationship}</span>
                      {relative.email && (
                        <span className="mr-2">• {relative.email}</span>
                      )}
                      {relative.phone_number && (
                        <span>• {relative.phone_number}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEditDialog(relative)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Relative</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this relative? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground"
                          onClick={() => onDeleteRelative(relative.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add/Edit Relative Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setIsDialogOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Relative" : "Add Relative"}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? "Edit the information for this relative."
                : "Enter the information for the new relative."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Profile Photo */}
            <div className="flex flex-col items-center mb-4">
              <Label className="self-center mb-2">Photo (Optional)</Label>
              <div className="relative">
                <Avatar className="h-24 w-24">
                  {currentRelative?.photo_url ? (
                    <AvatarImage src={currentRelative.photo_url} alt="Relative" />
                  ) : (
                    <AvatarFallback>
                      <User className="h-12 w-12 text-muted-foreground" />
                    </AvatarFallback>
                  )}
                </Avatar>
                {currentRelative?.photo_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border"
                    onClick={() => setCurrentRelative({...currentRelative, photo_url: undefined})}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowImageUploader(true)}
                className="mt-2"
              >
                {currentRelative?.photo_url ? "Change Photo" : "Upload Photo"}
              </Button>
            </div>

            <div className="grid gap-4">
              {/* Name */}
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={currentRelative?.name || ""}
                  onChange={(e) => 
                    setCurrentRelative({...currentRelative, name: e.target.value})
                  }
                  placeholder="John Doe"
                  required
                />
              </div>

              {/* Relationship */}
              <div className="grid gap-2">
                <Label htmlFor="relationship">Relationship *</Label>
                <Select
                  value={currentRelative?.relationship || ""}
                  onValueChange={(value) => 
                    setCurrentRelative({...currentRelative, relationship: value})
                  }
                  required
                >
                  <SelectTrigger id="relationship">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Email */}
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={currentRelative?.email || ""}
                  onChange={(e) => 
                    setCurrentRelative({...currentRelative, email: e.target.value})
                  }
                  placeholder="email@example.com"
                  required
                />
              </div>

              {/* Phone */}
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  value={currentRelative?.phone_number || ""}
                  onChange={(e) => 
                    setCurrentRelative({...currentRelative, phone_number: e.target.value})
                  }
                  placeholder="+1 123-456-7890"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditMode ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Upload Dialog */}
      {showImageUploader && (
        <ImageUploadCropper
          aspectRatio={1}
          onImageCropped={handleImageUpload}
          onCancel={() => setShowImageUploader(false)}
          isUploading={isUploading}
        />
      )}
    </Card>
  );
}
