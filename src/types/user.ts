
export interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  avatar_url?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  name?: string;
}
