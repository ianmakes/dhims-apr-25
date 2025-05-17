
export interface AcademicYear {
  id: string;
  year_name: string;
  is_current: boolean;
  start_date: string;
  end_date: string;
  created_at?: string;
  updated_at?: string;
}

export interface Student {
  id: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  address: string;
  phone_number: string;
  email: string;
  guardian_name: string;
  guardian_phone_number: string;
  guardian_email: string;
  class_level: string;
  enrollment_date: string;
  previous_school: string | null;
  medical_info: string | null;
  special_needs: string | null;
  notes: string | null;
  sponsor_id: string | null;
  slug: string;
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
}

export type UserRole = 'admin' | 'manager' | 'teacher' | 'user';
