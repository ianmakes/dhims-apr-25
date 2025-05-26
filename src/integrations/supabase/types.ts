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
      academic_years: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_date: string
          id: string
          is_current: boolean | null
          start_date: string
          updated_at: string | null
          updated_by: string | null
          year_name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_date: string
          id?: string
          is_current?: boolean | null
          start_date: string
          updated_at?: string | null
          updated_by?: string | null
          year_name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string
          id?: string
          is_current?: boolean | null
          start_date?: string
          updated_at?: string | null
          updated_by?: string | null
          year_name?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          app_version: string | null
          favicon_url: string | null
          footer_text: string | null
          id: string
          logo_url: string | null
          organization_name: string
          primary_color: string
          secondary_color: string
          theme_mode: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          app_version?: string | null
          favicon_url?: string | null
          footer_text?: string | null
          id: string
          logo_url?: string | null
          organization_name?: string
          primary_color?: string
          secondary_color?: string
          theme_mode?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          app_version?: string | null
          favicon_url?: string | null
          footer_text?: string | null
          id?: string
          logo_url?: string | null
          organization_name?: string
          primary_color?: string
          secondary_color?: string
          theme_mode?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: string | null
          entity: string
          entity_id: string
          id: string
          ip_address: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: string | null
          entity: string
          entity_id: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: string | null
          entity?: string
          entity_id?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      email_settings: {
        Row: {
          from_email: string
          from_name: string
          id: string
          notifications_enabled: boolean | null
          notify_new_sponsor: boolean | null
          notify_new_student: boolean | null
          notify_sponsorship_change: boolean | null
          provider: string
          resend_api_key: string | null
          smtp_host: string | null
          smtp_password: string | null
          smtp_port: string | null
          smtp_username: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          from_email: string
          from_name: string
          id: string
          notifications_enabled?: boolean | null
          notify_new_sponsor?: boolean | null
          notify_new_student?: boolean | null
          notify_sponsorship_change?: boolean | null
          provider?: string
          resend_api_key?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: string | null
          smtp_username?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          from_email?: string
          from_name?: string
          id?: string
          notifications_enabled?: boolean | null
          notify_new_sponsor?: boolean | null
          notify_new_student?: boolean | null
          notify_sponsorship_change?: boolean | null
          provider?: string
          resend_api_key?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: string | null
          smtp_username?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      exams: {
        Row: {
          academic_year: string
          created_at: string | null
          created_by: string | null
          exam_date: string
          id: string
          is_active: boolean | null
          max_score: number
          name: string
          passing_score: number
          term: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          academic_year: string
          created_at?: string | null
          created_by?: string | null
          exam_date: string
          id?: string
          is_active?: boolean | null
          max_score: number
          name: string
          passing_score: number
          term: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          academic_year?: string
          created_at?: string | null
          created_by?: string | null
          exam_date?: string
          id?: string
          is_active?: boolean | null
          max_score?: number
          name?: string
          passing_score?: number
          term?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
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
      sponsors: {
        Row: {
          address: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          email: string
          email2: string | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          phone: string | null
          primary_email_for_updates: string | null
          profile_image_url: string | null
          slug: string | null
          start_date: string
          status: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          email: string
          email2?: string | null
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          phone?: string | null
          primary_email_for_updates?: string | null
          profile_image_url?: string | null
          slug?: string | null
          start_date: string
          status?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string
          email2?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
          primary_email_for_updates?: string | null
          profile_image_url?: string | null
          slug?: string | null
          start_date?: string
          status?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      student_exam_scores: {
        Row: {
          academic_year_recorded: string | null
          created_at: string | null
          created_by: string | null
          did_not_sit: boolean
          exam_id: string | null
          id: string
          is_current_record: boolean | null
          record_date: string | null
          score: number
          student_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          academic_year_recorded?: string | null
          created_at?: string | null
          created_by?: string | null
          did_not_sit?: boolean
          exam_id?: string | null
          id?: string
          is_current_record?: boolean | null
          record_date?: string | null
          score: number
          student_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          academic_year_recorded?: string | null
          created_at?: string | null
          created_by?: string | null
          did_not_sit?: boolean
          exam_id?: string | null
          id?: string
          is_current_record?: boolean | null
          record_date?: string | null
          score?: number
          student_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_exam_scores_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_exam_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_letters: {
        Row: {
          academic_year_recorded: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          date: string | null
          file_url: string | null
          id: string
          is_current_record: boolean | null
          record_date: string | null
          student_id: string | null
          title: string
        }
        Insert: {
          academic_year_recorded?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          file_url?: string | null
          id?: string
          is_current_record?: boolean | null
          record_date?: string | null
          student_id?: string | null
          title?: string
        }
        Update: {
          academic_year_recorded?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          file_url?: string | null
          id?: string
          is_current_record?: boolean | null
          record_date?: string | null
          student_id?: string | null
          title?: string
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
      student_photos: {
        Row: {
          academic_year_recorded: string | null
          caption: string
          created_at: string
          date: string
          id: string
          is_current_record: boolean | null
          location: string | null
          record_date: string | null
          student_id: string | null
          updated_at: string
          url: string
        }
        Insert: {
          academic_year_recorded?: string | null
          caption: string
          created_at?: string
          date?: string
          id?: string
          is_current_record?: boolean | null
          location?: string | null
          record_date?: string | null
          student_id?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          academic_year_recorded?: string | null
          caption?: string
          created_at?: string
          date?: string
          id?: string
          is_current_record?: boolean | null
          location?: string | null
          record_date?: string | null
          student_id?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_photos_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_relatives: {
        Row: {
          created_at: string
          id: string
          name: string
          phone_number: string | null
          photo_url: string | null
          relationship: string
          student_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone_number?: string | null
          photo_url?: string | null
          relationship: string
          student_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone_number?: string | null
          photo_url?: string | null
          relationship?: string
          student_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_relatives_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          academic_year_recorded: string | null
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
          is_current_record: boolean | null
          location: string | null
          name: string
          profile_image_url: string | null
          record_date: string | null
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
          academic_year_recorded?: string | null
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
          is_current_record?: boolean | null
          location?: string | null
          name: string
          profile_image_url?: string | null
          record_date?: string | null
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
          academic_year_recorded?: string | null
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
          is_current_record?: boolean | null
          location?: string | null
          name?: string
          profile_image_url?: string | null
          record_date?: string | null
          school_level?: string | null
          slug?: string | null
          sponsor_id?: string | null
          sponsored_since?: string | null
          status?: string
          updated_at?: string | null
          updated_by?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "students_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_events: {
        Row: {
          academic_year_recorded: string | null
          created_at: string | null
          created_by: string | null
          date: string | null
          description: string | null
          id: string
          is_current_record: boolean | null
          record_date: string | null
          student_id: string | null
          title: string
          type: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          academic_year_recorded?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          description?: string | null
          id?: string
          is_current_record?: boolean | null
          record_date?: string | null
          student_id?: string | null
          title: string
          type?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          academic_year_recorded?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          description?: string | null
          id?: string
          is_current_record?: boolean | null
          record_date?: string | null
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
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          permissions: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          permissions?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          permissions?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
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
