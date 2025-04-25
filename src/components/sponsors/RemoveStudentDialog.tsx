
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StudentRemovalForm } from "@/hooks/useSponsorDetails";

interface RemoveStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: StudentRemovalForm) => void;
  studentId: string;
  studentName: string;
}

export function RemoveStudentDialog({
  open,
  onOpenChange,
  onConfirm,
  studentId,
  studentName,
}: RemoveStudentDialogProps) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const removalReasons = [
    "Sponsor financial issues",
    "Student graduated",
    "Student left school",
    "Student transferred to another sponsor",
    "Sponsor not active",
    "Administrative change",
    "Sponsor requested change",
    "Sponsor deceased",
    "Program ended",
    "Other"
  ];

  const handleConfirm = () => {
    onConfirm({
      studentId,
      reason,
      notes: notes.trim() || undefined,
    });
    resetForm();
  };

  const resetForm = () => {
    setReason("");
    setNotes("");
  };

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Student from Sponsorship</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to remove <span className="font-medium">{studentName}</span> from this sponsorship. Please provide a reason for this change.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for removal *</Label>
            <Select
              value={reason}
              onValueChange={setReason}
              required
            >
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {removalReasons.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Additional notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information about this change..."
              className="h-24 resize-none"
            />
          </div>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!reason}
            className="bg-destructive text-destructive-foreground"
          >
            Remove Student
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
