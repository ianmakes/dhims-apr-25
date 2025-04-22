export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          name: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          name?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      student_letters: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          date: string | null
          file_url: string | null
          id: string
          student_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          file_url?: string | null
          id?: string
          student_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          file_url?: string | null
          id?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_letters_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          accommodation_status: string | null
          admission_date: string | null
          admission_number: string
          cbc_category: string | null
          created_at: string | null
          created_by: string | null
          current_academic_year: number | null
          current_grade: string | null
          description: string | null
          dob: string | null
          gender: string | null
          health_status: string | null
          height_cm: number | null
          id: string
          location: string | null
          name: string
          profile_image_url: string | null
          school_level: string | null
          slug: string | null
          sponsor_id: string | null
          sponsored_since: string | null
          status: string
          updated_at: string | null
          updated_by: string | null
          weight_kg: number | null
        }
        Insert: {
          accommodation_status?: string | null
          admission_date?: string | null
          admission_number: string
          cbc_category?: string | null
          created_at?: string | null
          created_by?: string | null
          current_academic_year?: number | null
          current_grade?: string | null
          description?: string | null
          dob?: string | null
          gender?: string | null
          health_status?: string | null
          height_cm?: number | null
          id?: string
          location?: string | null
          name: string
          profile_image_url?: string | null
          school_level?: string | null
          slug?: string | null
          sponsor_id?: string | null
          sponsored_since?: string | null
          status?: string
          updated_at?: string | null
          updated_by?: string | null
          weight_kg?: number | null
        }
        Update: {
          accommodation_status?: string | null
          admission_date?: string | null
          admission_number?: string
          cbc_category?: string | null
          created_at?: string | null
          created_by?: string | null
          current_academic_year?: number | null
          current_grade?: string | null
          description?: string | null
          dob?: string | null
          gender?: string | null
          health_status?: string | null
          height_cm?: number | null
          id?: string
          location?: string | null
          name?: string
          profile_image_url?: string | null
          school_level?: string | null
          slug?: string | null
          sponsor_id?: string | null
          sponsored_since?: string | null
          status?: string
          updated_at?: string | null
          updated_by?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      timeline_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string | null
          description: string | null
          id: string
          student_id: string | null
          title: string
          type: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          description?: string | null
          id?: string
          student_id?: string | null
          title: string
          type?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          description?: string | null
          id?: string
          student_id?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
