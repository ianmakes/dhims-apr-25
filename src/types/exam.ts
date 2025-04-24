
import { Database } from "@/integrations/supabase/types";

export type Exam = Database["public"]["Tables"]["exams"]["Row"];
export type StudentExamScore = Database["public"]["Tables"]["student_exam_scores"]["Row"];

export interface ExamWithScores extends Exam {
  studentsTaken?: number;
  averageScore?: number;
  student_exam_scores?: StudentExamScoreWithStudent[];
}

export interface StudentExamScoreWithStudent extends StudentExamScore {
  student?: {
    id: string;
    name: string;
    current_grade: string;
  };
  status?: string;
}

export interface StudentForExam {
  id: string;
  name: string;
  current_grade?: string;
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
