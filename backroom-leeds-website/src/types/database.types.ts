export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          failed_login_attempts: number | null
          id: string
          is_active: boolean | null
          locked_until: string | null
          password_hash: string
          role: Database["public"]["Enums"]["user_role"]
          totp_enabled: boolean | null
          totp_secret: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          failed_login_attempts?: number | null
          id?: string
          is_active?: boolean | null
          locked_until?: string | null
          password_hash: string
          role?: Database["public"]["Enums"]["user_role"]
          totp_enabled?: boolean | null
          totp_secret?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          failed_login_attempts?: number | null
          id?: string
          is_active?: boolean | null
          locked_until?: string | null
          password_hash?: string
          role?: Database["public"]["Enums"]["user_role"]
          totp_enabled?: boolean | null
          totp_secret?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          arrival_time: string
          booking_date: string
          booking_ref: string
          cancelled_at: string | null
          checked_in_at: string | null
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          deposit_amount: number
          drinks_package: Json | null
          id: string
          package_amount: number | null
          party_size: number
          refund_eligible: boolean | null
          remaining_balance: number | null
          special_requests: Json | null
          status: Database["public"]["Enums"]["booking_status"] | null
          stripe_payment_intent_id: string | null
          table_ids: number[]
          updated_at: string | null
        }
        Insert: {
          arrival_time: string
          booking_date: string
          booking_ref: string
          cancelled_at?: string | null
          checked_in_at?: string | null
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          deposit_amount?: number
          drinks_package?: Json | null
          id?: string
          package_amount?: number | null
          party_size: number
          refund_eligible?: boolean | null
          remaining_balance?: number | null
          special_requests?: Json | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          stripe_payment_intent_id?: string | null
          table_ids: number[]
          updated_at?: string | null
        }
        Update: {
          arrival_time?: string
          booking_date?: string
          booking_ref?: string
          cancelled_at?: string | null
          checked_in_at?: string | null
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          deposit_amount?: number
          drinks_package?: Json | null
          id?: string
          package_amount?: number | null
          party_size?: number
          refund_eligible?: boolean | null
          remaining_balance?: number | null
          special_requests?: Json | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          stripe_payment_intent_id?: string | null
          table_ids?: number[]
          updated_at?: string | null
        }
        Relationships: []
      }
      email_notifications: {
        Row: {
          body_html: string | null
          body_text: string | null
          booking_id: string | null
          cc_emails: string[] | null
          created_at: string | null
          error_message: string | null
          failed_at: string | null
          id: string
          max_retries: number | null
          recipient_email: string
          retry_count: number | null
          scheduled_for: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"] | null
          subject: string
          template_data: Json | null
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string | null
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          booking_id?: string | null
          cc_emails?: string[] | null
          created_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          max_retries?: number | null
          recipient_email: string
          retry_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"] | null
          subject: string
          template_data?: Json | null
          type: Database["public"]["Enums"]["notification_type"]
          updated_at?: string | null
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          booking_id?: string | null
          cc_emails?: string[] | null
          created_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          max_retries?: number | null
          recipient_email?: string
          retry_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"] | null
          subject?: string
          template_data?: Json | null
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          day_of_week: number
          description: string | null
          dj_lineup: string[] | null
          end_time: string
          id: string
          image_url: string | null
          is_active: boolean | null
          is_recurring: boolean | null
          music_genres: string[] | null
          name: string
          slug: string
          start_time: string
          ticket_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          description?: string | null
          dj_lineup?: string[] | null
          end_time: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_recurring?: boolean | null
          music_genres?: string[] | null
          name: string
          slug: string
          start_time: string
          ticket_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          description?: string | null
          dj_lineup?: string[] | null
          end_time?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_recurring?: boolean | null
          music_genres?: string[] | null
          name?: string
          slug?: string
          start_time?: string
          ticket_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      report_recipients: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string | null
          report_types:
            | Database["public"]["Enums"]["notification_type"][]
            | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          report_types?:
            | Database["public"]["Enums"]["notification_type"][]
            | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          report_types?:
            | Database["public"]["Enums"]["notification_type"][]
            | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scheduled_jobs: {
        Row: {
          created_at: string | null
          description: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          job_name: string
          last_run: string | null
          next_run: string | null
          result_data: Json | null
          schedule_cron: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          job_name: string
          last_run?: string | null
          next_run?: string | null
          result_data?: Json | null
          schedule_cron?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          job_name?: string
          last_run?: string | null
          next_run?: string | null
          result_data?: Json | null
          schedule_cron?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      venue_tables: {
        Row: {
          can_combine_with: number[] | null
          capacity_max: number
          capacity_min: number
          created_at: string | null
          description: string | null
          features: string[] | null
          floor: Database["public"]["Enums"]["floor_type"]
          id: number
          is_active: boolean | null
          table_number: number
        }
        Insert: {
          can_combine_with?: number[] | null
          capacity_max: number
          capacity_min: number
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          floor: Database["public"]["Enums"]["floor_type"]
          id?: number
          is_active?: boolean | null
          table_number: number
        }
        Update: {
          can_combine_with?: number[] | null
          capacity_max?: number
          capacity_min?: number
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          floor?: Database["public"]["Enums"]["floor_type"]
          id?: number
          is_active?: boolean | null
          table_number?: number
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          arrival_time: string
          booking_date: string
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          expires_at: string
          id: string
          notified_at: string | null
          party_size: number
          table_preferences: number[] | null
        }
        Insert: {
          arrival_time: string
          booking_date: string
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          expires_at: string
          id?: string
          notified_at?: string | null
          party_size: number
          table_preferences?: number[] | null
        }
        Update: {
          arrival_time?: string
          booking_date?: string
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          expires_at?: string
          id?: string
          notified_at?: string | null
          party_size?: number
          table_preferences?: number[] | null
        }
        Relationships: []
      }
    }
    Views: {
      available_tables: {
        Row: {
          can_combine_with: number[] | null
          capacity_max: number | null
          capacity_min: number | null
          created_at: string | null
          description: string | null
          features: string[] | null
          floor: Database["public"]["Enums"]["floor_type"] | null
          id: number | null
          is_active: boolean | null
          is_available: boolean | null
          table_number: number | null
        }
        Insert: {
          can_combine_with?: number[] | null
          capacity_max?: number | null
          capacity_min?: number | null
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          floor?: Database["public"]["Enums"]["floor_type"] | null
          id?: number | null
          is_active?: boolean | null
          is_available?: never
          table_number?: number | null
        }
        Update: {
          can_combine_with?: number[] | null
          capacity_max?: number | null
          capacity_min?: number | null
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          floor?: Database["public"]["Enums"]["floor_type"] | null
          id?: number | null
          is_active?: boolean | null
          is_available?: never
          table_number?: number | null
        }
        Relationships: []
      }
      booking_dashboard_stats: {
        Row: {
          arrived_today: number | null
          confirmed_today: number | null
          current_waitlist_count: number | null
          no_show_today: number | null
          pending_notifications: number | null
          pending_today: number | null
          report_date: string | null
          tables_occupied_today: number | null
          total_bookings_today: number | null
          total_guests_today: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_table_availability: {
        Args: {
          check_date: string
          party_size_param: number
        }
        Returns: {
          table_number: number
          floor: Database["public"]["Enums"]["floor_type"]
          capacity_min: number
          capacity_max: number
          description: string
          features: string[]
          is_available: boolean
          can_accommodate: boolean
        }[]
      }
      check_table_combination: {
        Args: {
          party_size_param: number
          requested_tables: number[]
        }
        Returns: {
          should_combine: boolean
          recommended_tables: number[]
          total_capacity: number
          description: string
        }[]
      }
      create_booking_confirmation_email: {
        Args: {
          booking_record: unknown
        }
        Returns: string
      }
      create_cancellation_notification: {
        Args: {
          booking_record: unknown
        }
        Returns: string
      }
      generate_booking_ref: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_daily_summary: {
        Args: {
          report_date?: string
        }
        Returns: Json
      }
      get_booking_stats: {
        Args: {
          start_date?: string
          end_date?: string
        }
        Returns: {
          total_bookings: number
          confirmed_bookings: number
          pending_bookings: number
          cancelled_bookings: number
          total_revenue: number
          average_party_size: number
        }[]
      }
      send_daily_summary_report: {
        Args: {
          report_date?: string
        }
        Returns: number
      }
      test_database_functionality: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      booking_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "arrived"
        | "no_show"
      floor_type: "upstairs" | "downstairs"
      job_status: "pending" | "running" | "completed" | "failed" | "cancelled"
      notification_status: "pending" | "sent" | "failed" | "cancelled"
      notification_type:
        | "booking_confirmation"
        | "cancellation_confirmation"
        | "refund_request"
        | "waitlist_notification"
        | "daily_summary"
        | "weekly_summary"
      user_role: "super_admin" | "manager" | "door_staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

