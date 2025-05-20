
import { ExamGrade } from "@/types/exam";

export const gradeColors = {
  "EE": "#4ade80", // Exceeding Expectation - Green
  "ME": "#3b82f6", // Meeting Expectation - Blue
  "AE": "#f97316", // Approaching Expectation - Orange
  "BE": "#b91c1c"  // Below Expectation - Red
};

// Calculate grade based on percentage
export const calculateGrade = (score: number): "EE" | "ME" | "AE" | "BE" => {
  if (score >= 80) return "EE";
  if (score >= 50) return "ME";
  if (score >= 40) return "AE";
  return "BE";
};

// Get full description of grade
export const getGradeDescription = (grade: string): string => {
  switch (grade) {
    case "EE":
      return "Exceeding Expectation";
    case "ME":
      return "Meeting Expectation";
    case "AE":
      return "Approaching Expectation";
    case "BE":
      return "Below Expectation";
    default:
      return "Unknown";
  }
};

// Get grade category based on score
export const getGradeCategory = (score: number): ExamGrade => {
  if (score >= 80) return ExamGrade.EXCEEDING;
  if (score >= 50) return ExamGrade.MEETING;
  if (score >= 40) return ExamGrade.APPROACHING;
  return ExamGrade.BELOW;
};
