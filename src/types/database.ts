
import { Database } from "@/integrations/supabase/types";

// Export specific table types for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Student = Database['public']['Tables']['students']['Row'];
export type TimelineEvent = Database['public']['Tables']['timeline_events']['Row'];
export type StudentLetter = Database['public']['Tables']['student_letters']['Row'];

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
