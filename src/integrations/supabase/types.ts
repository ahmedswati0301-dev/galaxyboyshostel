export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          created_at: string
          id: string
          message: string
          ref_room: string | null
          ref_student: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          ref_room?: string | null
          ref_student?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          ref_room?: string | null
          ref_student?: string | null
          type?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          month: string
          notes: string | null
          paid_at: string
          receipt_no: string
          student_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          month: string
          notes?: string | null
          paid_at?: string
          receipt_no: string
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          month?: string
          notes?: string | null
          paid_at?: string
          receipt_no?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      room_types: {
        Row: {
          capacity: number
          created_at: string
          default_rent: number
          id: string
          name: string
        }
        Insert: {
          capacity: number
          created_at?: string
          default_rent: number
          id?: string
          name: string
        }
        Update: {
          capacity?: number
          created_at?: string
          default_rent?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          created_at: string
          floor: number
          id: string
          notes: string | null
          number: string
          rent_per_seat: number | null
          room_type_id: string
        }
        Insert: {
          created_at?: string
          floor: number
          id?: string
          notes?: string | null
          number: string
          rent_per_seat?: number | null
          room_type_id: string
        }
        Update: {
          created_at?: string
          floor?: number
          id?: string
          notes?: string | null
          number?: string
          rent_per_seat?: number | null
          room_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      students: {
        Row: {
          address: string | null
          admission_date: string
          cnic: string | null
          created_at: string
          department: string | null
          emergency_contact: string | null
          father_name: string | null
          id: string
          monthly_rent: number
          name: string
          notes: string | null
          phone: string | null
          photo_url: string | null
          room_id: string | null
          seat_number: number | null
          status: Database["public"]["Enums"]["student_status"]
          university: string | null
          updated_at: string
          vacated_at: string | null
        }
        Insert: {
          address?: string | null
          admission_date?: string
          cnic?: string | null
          created_at?: string
          department?: string | null
          emergency_contact?: string | null
          father_name?: string | null
          id?: string
          monthly_rent: number
          name: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          room_id?: string | null
          seat_number?: number | null
          status?: Database["public"]["Enums"]["student_status"]
          university?: string | null
          updated_at?: string
          vacated_at?: string | null
        }
        Update: {
          address?: string | null
          admission_date?: string
          cnic?: string | null
          created_at?: string
          department?: string | null
          emergency_contact?: string | null
          father_name?: string | null
          id?: string
          monthly_rent?: number
          name?: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          room_id?: string | null
          seat_number?: number | null
          status?: Database["public"]["Enums"]["student_status"]
          university?: string | null
          updated_at?: string
          vacated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_occupancy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      room_occupancy: {
        Row: {
          available: number | null
          capacity: number | null
          floor: number | null
          id: string | null
          number: string | null
          occupied: number | null
          rent_per_seat: number | null
          room_type: string | null
          room_type_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      payment_method: "cash" | "bank" | "jazzcash" | "easypaisa"
      student_status: "active" | "vacated"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      payment_method: ["cash", "bank", "jazzcash", "easypaisa"],
      student_status: ["active", "vacated"],
    },
  },
} as const
