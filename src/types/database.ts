
import { Database } from "@/integrations/supabase/types";
import { Json } from "@/integrations/supabase/types";

// Export specific table types for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row'] & {
  name?: string;
  role?: string;
};

export type Student = Database['public']['Tables']['students']['Row'];
export type TimelineEvent = Database['public']['Tables']['timeline_events']['Row'];
export type StudentLetter = Database['public']['Tables']['student_letters']['Row'];
export type StudentPhoto = Database['public']['Tables']['student_photos']['Row'];
export type StudentRelative = Database['public']['Tables']['student_relatives']['Row'];

// Define the StudentExamScore type with proper exam property
export type StudentExamScore = Database['public']['Tables']['student_exam_scores']['Row'] & {
  exam: {
    id: string;
    name: string;
    term: string;
    academic_year: string;
    exam_date: string;
    max_score: number;
    passing_score: number;
  };
};

// Define sponsor-related types for tables
export type SponsorTimelineEvent = {
  id: string;
  sponsor_id: string;
  title: string;
  description?: string | null;
  type: string;
  student_id?: string | null;
  date: string;
  created_at: string;
  updated_at?: string | null;
};

// Define the SponsorRelative type
export type SponsorRelative = {
  id: string;
  sponsor_id: string;
  name: string;
  relationship: string;
  email?: string | null;
  phone_number?: string | null;
  photo_url?: string | null;
  created_at: string;
  updated_at?: string | null;
};

// New student form input type
export interface StudentFormInput {
  name: string;
  admission_number: string;
  dob?: string | null;
  gender: 'Male' | 'Female';
  status: string;
  accommodation_status?: string | null;
  health_status?: string | null;
  location?: string | null;
  description?: string | null;
  school_level?: string | null;
  cbc_category?: string | null;
  current_grade?: string | null;
  current_academic_year?: number | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  admission_date?: string | null;
  sponsor_id?: string | null;
  sponsored_since?: string | null;
  profile_image_url?: string | null;
  slug?: string | null;
}

// Add Sponsor type
export type Sponsor = Database['public']['Tables']['sponsors']['Row'] & {
  students?: Student[];
  profile_image_url?: string | null;
  primary_email_for_updates?: string | null;
  email2?: string | null;
  phone?: string | null;
  start_date?: string | null;
  status?: string | null;
  notes?: string | null;
};

export type AcademicYear = Database['public']['Tables']['academic_years']['Row'];

export type User = {
  id: string;
  email: string;
  name?: string;
  role?: string;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
};
