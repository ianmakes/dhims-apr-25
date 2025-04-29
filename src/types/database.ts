
export interface Student {
  id: string;
  created_at?: string;
  name: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  phone_number?: string;
  email?: string;
  class?: string;
  admission_date?: string;
  photo_url?: string;
  father_name?: string;
  mother_name?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  sponsor_id?: string;
  sponsored_since?: string;
  updated_at?: string;
  updated_by?: string;
}

export interface Sponsor {
  id: string;
  created_at?: string;
  first_name: string;
  last_name: string;
  email: string;
  email2?: string;
  phone?: string;
  address?: string;
  country?: string;
  photo_url?: string;
  profile_image_url?: string;
  occupation?: string;
  additional_info?: string;
  start_date?: string;
  status?: string;
  notes?: string;
  primary_email_for_updates?: string;
  updated_at?: string;
  students?: any[];
}

export interface StudentRelative {
  id: string;
  created_at?: string;
  student_id: string;
  name: string;
  relationship: string;
  phone_number?: string;
  photo_url?: string;
}

export interface Profile {
  id: string;
  updated_at?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  website?: string;
  name?: string;
  role?: string;
}

export interface ImageUploadCropperProps {
  value?: string;
  onChange?: (url: string) => void;
  aspectRatio?: number;
  label?: string;
  onImageCropped?: (croppedImage: Blob) => Promise<void>;
  onCancel?: () => void;
  isUploading?: boolean;
}

export interface SponsorRelative {
  id: string;
  sponsor_id: string;
  name: string;
  relationship: string;
  phone_number?: string;
  photo_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SponsorTimelineEvent {
  id: string;
  sponsor_id: string;
  title: string;
  description?: string;
  type: string;
  date: string;
  created_at?: string;
  updated_at?: string;
  student_id?: string;
}

export interface StudentFormInput {
  id?: string;
  name: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  phone_number?: string;
  email?: string;
  class?: string;
  admission_date?: string;
  photo_url?: string;
  father_name?: string;
  mother_name?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export interface StudentExamScore {
  id: string;
  student_id: string;
  exam_id: string;
  score: number;
  did_not_sit: boolean;
  created_at?: string;
  updated_at?: string;
  student?: {
    id: string;
    name: string;
    admission_number?: string;
  };
}
