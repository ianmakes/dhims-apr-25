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
  phone_number?: string;
  address?: string;
  country?: string;
  photo_url?: string;
  occupation?: string;
  additional_info?: string;
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
