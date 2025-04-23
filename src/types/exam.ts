
import { Database } from "@/integrations/supabase/types";

export type Exam = Database["public"]["Tables"]["exams"]["Row"];
export type StudentExamScore = Database["public"]["Tables"]["student_exam_scores"]["Row"];

export interface ExamWithScores extends Exam {
  studentsTaken?: number;
  averageScore?: number;
}
