
export interface AcademicYear {
  id: string;
  year_name: string;
  is_current: boolean;
  start_date: string;
  end_date: string;
  created_at?: string;
  updated_at?: string;
}

// Updated Student interface to match the database schema
export interface Student {
  id: string;
  created_at: string;
  updated_at: string;
  name: string; // Changed from first_name/last_name to match DB
  admission_number: string;
  dob?: string;
  gender?: string;
  status: string;
  accommodation_status?: string;
  health_status?: string;
  location?: string;
  description?: string;
  school_level?: string;
  cbc_category?: string;
  current_grade?: string;
  current_academic_year?: number;
  height_cm?: number;
  weight_kg?: number;
  admission_date?: string;
  sponsor_id?: string;
  sponsored_since?: string;
  profile_image_url?: string;
  slug?: string;
  created_by?: string;
  updated_by?: string;
}

export interface User {
  id: string;
  created_at: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  last_login?: string;
  name?: string; // Added for compatibility with existing code
}

// Update UserRole to include all possible values
export type UserRole = 'admin' | 'manager' | 'teacher' | 'viewer' | 'superuser' | 'user';
