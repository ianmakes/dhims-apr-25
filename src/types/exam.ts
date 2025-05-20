
import { Database } from "@/integrations/supabase/types";

export type Exam = Database["public"]["Tables"]["exams"]["Row"];
export type StudentExamScore = Database["public"]["Tables"]["student_exam_scores"]["Row"];

export interface ExamWithScores extends Omit<Exam, 'is_active'> {
  studentsTaken?: number;
  averageScore?: number;
  passRate?: number;
  is_active: boolean; // Changed from optional to required to match the Exam type
  student_exam_scores?: StudentExamScoreWithStudent[];
}

export interface StudentExamScoreWithStudent extends StudentExamScore {
  student?: {
    id: string;
    name: string;
    current_grade: string;
    admission_number?: string;
  };
  status?: string;
  exam?: Exam;
}

export interface StudentForExam {
  id: string;
  name: string;
  current_grade?: string;
  admission_number?: string;
  hasScore?: boolean;
  examScoreId?: string;
  score?: number | null;
  didNotSit?: boolean;
}

export enum ExamGrade {
  EXCEEDING = "Exceeding Expectation",
  MEETING = "Meeting Expectation", 
  APPROACHING = "Approaching Expectation",
  BELOW = "Below Expectation"
}
