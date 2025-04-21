
// Type definitions for DHIMS

// User roles type
export type UserRole = "superuser" | "admin" | "manager" | "viewer";

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Student interface
export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  gender: "male" | "female" | "other";
  dateOfBirth: Date;
  grade: string;
  enrollmentDate: Date;
  sponsorId?: string;
  profileImage?: string;
  address?: string;
  guardianName?: string;
  guardianContact?: string;
  status: "active" | "inactive" | "graduated";
  createdAt: Date;
  updatedAt: Date;
}

// Sponsor interface
export interface Sponsor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  country?: string;
  startDate: Date;
  status: "active" | "inactive";
  students: string[]; // Array of student IDs
  profileImage?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Exam interface
export interface Exam {
  id: string;
  name: string;
  term: string;
  academicYear: string;
  date: Date;
  grades: ExamGrade[];
  createdAt: Date;
  updatedAt: Date;
}

// Exam grade interface
export interface ExamGrade {
  studentId: string;
  score: number;
  grade: string;
  remarks?: string;
}

// Student letter interface
export interface StudentLetter {
  id: string;
  studentId: string;
  date: Date;
  content: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Student timeline event
export interface TimelineEvent {
  id: string;
  studentId: string;
  date: Date;
  title: string;
  description: string;
  type: "academic" | "sponsor" | "personal" | "other";
  createdAt: Date;
  updatedAt: Date;
}

// Audit log entry
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: "student" | "sponsor" | "exam" | "user" | "settings" | "other";
  entityId: string;
  details: string;
  timestamp: Date;
}

// App settings
export interface AppSettings {
  currentAcademicYear: string;
  currentTerm: string;
  organizationName: string;
  organizationLogo?: string;
  smtpSettings?: SMTPSettings;
  themeSettings?: ThemeSettings;
}

// SMTP settings
export interface SMTPSettings {
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

// Theme settings
export interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  mode: "light" | "dark" | "system";
}
