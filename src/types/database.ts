// ─────────────────────────────────────────────────────────────────────────────
// Kumo — Supabase Database Types
//
// IMPORTANT: This file is a hand-authored placeholder for the MVP bootstrap.
// Replace it with the generated version once your Supabase project is live:
//
//   npm run supabase:types
//   # or:
//   supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > src/types/database.ts
//
// The types below match 00001_schema.sql exactly. Keep them in sync until
// you switch to generated types.
//
// NOTE: Update types are intentionally written inline (not Partial<Insert>)
// to avoid TypeScript circular reference resolution producing `never`.
// ─────────────────────────────────────────────────────────────────────────────

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      academies: {
        Row: {
          id: string
          name: string
          slug: string
          owner_id: string
          status: "trialing" | "active" | "past_due" | "suspended" | "cancelled" | "deleted"
          plan: "starter" | "growth" | "pro" | "enterprise"
          timezone: string
          country_code: string
          currency: "BRL" | "EUR" | "USD" | "GBP"
          logo_url: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          max_members: number
          allow_student_self_checkin: boolean
          allow_student_portal: boolean
          block_after_days_overdue: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          owner_id: string
          status?: "trialing" | "active" | "past_due" | "suspended" | "cancelled" | "deleted"
          plan?: "starter" | "growth" | "pro" | "enterprise"
          timezone?: string
          country_code: string
          currency?: "BRL" | "EUR" | "USD" | "GBP"
          logo_url?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          allow_student_self_checkin?: boolean
          allow_student_portal?: boolean
          block_after_days_overdue?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          name?: string
          slug?: string
          owner_id?: string
          status?: "trialing" | "active" | "past_due" | "suspended" | "cancelled" | "deleted"
          plan?: "starter" | "growth" | "pro" | "enterprise"
          timezone?: string
          country_code?: string
          currency?: "BRL" | "EUR" | "USD" | "GBP"
          logo_url?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          allow_student_self_checkin?: boolean
          allow_student_portal?: boolean
          block_after_days_overdue?: number
          created_at?: string
          updated_at?: string
        }
      }
      members: {
        Row: {
          id: string
          academy_id: string
          user_id: string | null
          created_by: string | null
          email: string | null
          full_name: string
          role: "admin" | "instructor" | "student"
          status: "active" | "inactive" | "suspended"
          belt_rank: string
          stripes: number
          has_portal_access: boolean
          avatar_url: string | null
          phone: string | null
          birth_date: string | null
          emergency_contact: string | null
          notes: string | null
          last_check_in: string | null
          total_classes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          user_id?: string | null
          created_by?: string | null
          email?: string | null
          full_name: string
          role?: "admin" | "instructor" | "student"
          status?: "active" | "inactive" | "suspended"
          belt_rank?: string
          stripes?: number
          has_portal_access?: boolean
          avatar_url?: string | null
          phone?: string | null
          birth_date?: string | null
          emergency_contact?: string | null
          notes?: string | null
          last_check_in?: string | null
          total_classes?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          academy_id?: string
          user_id?: string | null
          created_by?: string | null
          email?: string | null
          full_name?: string
          role?: "admin" | "instructor" | "student"
          status?: "active" | "inactive" | "suspended"
          belt_rank?: string
          stripes?: number
          has_portal_access?: boolean
          avatar_url?: string | null
          phone?: string | null
          birth_date?: string | null
          emergency_contact?: string | null
          notes?: string | null
          last_check_in?: string | null
          total_classes?: number
          created_at?: string
          updated_at?: string
        }
      }
      member_belt_history: {
        Row: {
          id: string
          academy_id: string
          member_id: string
          belt_rank: string
          stripes: number
          promoted_by: string | null
          promoted_at: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          member_id: string
          belt_rank: string
          stripes: number
          promoted_by?: string | null
          promoted_at?: string
          notes?: string | null
          created_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          academy_id?: string
          member_id?: string
          belt_rank?: string
          stripes?: number
          promoted_by?: string | null
          promoted_at?: string
          notes?: string | null
          created_at?: string
        }
      }
      invites: {
        Row: {
          id: string
          academy_id: string
          invite_type: "instructor" | "student_activation"
          email: string
          role: "admin" | "instructor" | "student"
          token: string
          invited_by: string
          target_member_id: string | null
          expires_at: string
          accepted_at: string | null
          revoked_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          invite_type: "instructor" | "student_activation"
          email: string
          role?: "admin" | "instructor" | "student"
          token?: string
          invited_by: string
          target_member_id?: string | null
          expires_at?: string
          accepted_at?: string | null
          revoked_at?: string | null
          created_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          academy_id?: string
          invite_type?: "instructor" | "student_activation"
          email?: string
          role?: "admin" | "instructor" | "student"
          token?: string
          invited_by?: string
          target_member_id?: string | null
          expires_at?: string
          accepted_at?: string | null
          revoked_at?: string | null
          created_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          academy_id: string
          name: string
          description: string | null
          class_type: "regular" | "open_mat" | "competition_prep" | "private" | "seminar" | "kids"
          gi_type: "gi" | "nogi" | "both"
          belt_level_min: string | null
          belt_level_max: string | null
          day_of_week: number | null
          start_time: string
          end_time: string
          is_recurring: boolean
          max_students: number | null
          default_instructor_id: string | null
          room: string | null
          tags: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          name: string
          description?: string | null
          class_type?: "regular" | "open_mat" | "competition_prep" | "private" | "seminar" | "kids"
          gi_type?: "gi" | "nogi" | "both"
          belt_level_min?: string | null
          belt_level_max?: string | null
          day_of_week?: number | null
          start_time: string
          end_time: string
          is_recurring?: boolean
          max_students?: number | null
          default_instructor_id?: string | null
          room?: string | null
          tags?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          academy_id?: string
          name?: string
          description?: string | null
          class_type?: "regular" | "open_mat" | "competition_prep" | "private" | "seminar" | "kids"
          gi_type?: "gi" | "nogi" | "both"
          belt_level_min?: string | null
          belt_level_max?: string | null
          day_of_week?: number | null
          start_time?: string
          end_time?: string
          is_recurring?: boolean
          max_students?: number | null
          default_instructor_id?: string | null
          room?: string | null
          tags?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      class_sessions: {
        Row: {
          id: string
          academy_id: string
          class_id: string
          date: string
          start_time: string
          end_time: string
          instructor_id: string | null
          status: "scheduled" | "in_progress" | "completed" | "cancelled"
          attendance_count: number
          notes: string | null
          topic: string | null
          cancelled_by: string | null
          cancel_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          class_id: string
          date: string
          start_time: string
          end_time: string
          instructor_id?: string | null
          status?: "scheduled" | "in_progress" | "completed" | "cancelled"
          attendance_count?: number
          notes?: string | null
          topic?: string | null
          cancelled_by?: string | null
          cancel_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          academy_id?: string
          class_id?: string
          date?: string
          start_time?: string
          end_time?: string
          instructor_id?: string | null
          status?: "scheduled" | "in_progress" | "completed" | "cancelled"
          attendance_count?: number
          notes?: string | null
          topic?: string | null
          cancelled_by?: string | null
          cancel_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          academy_id: string
          session_id: string
          member_id: string
          check_in_method: "manual" | "self" | "qr_code" | "geolocation"
          checked_in_at: string
          checked_in_by: string | null
          latitude: number | null
          longitude: number | null
          rating: number | null
          feedback: string | null
          created_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          session_id: string
          member_id: string
          check_in_method?: "manual" | "self" | "qr_code" | "geolocation"
          checked_in_at?: string
          checked_in_by?: string | null
          latitude?: number | null
          longitude?: number | null
          rating?: number | null
          feedback?: string | null
          created_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          academy_id?: string
          session_id?: string
          member_id?: string
          check_in_method?: "manual" | "self" | "qr_code" | "geolocation"
          checked_in_at?: string
          checked_in_by?: string | null
          latitude?: number | null
          longitude?: number | null
          rating?: number | null
          feedback?: string | null
          created_at?: string
        }
      }
      check_ins: {
        Row: {
          id: string
          academy_id: string
          member_id: string
          session_id: string | null
          checked_in_at: string
          method: "manual" | "qr_code" | "self"
          created_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          member_id: string
          session_id?: string | null
          checked_in_at?: string
          method?: "manual" | "qr_code" | "self"
          created_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          academy_id?: string
          member_id?: string
          session_id?: string | null
          checked_in_at?: string
          method?: "manual" | "qr_code" | "self"
          created_at?: string
        }
      }
      techniques: {
        Row: {
          id: string
          academy_id: string
          name: string
          description: string | null
          position: string
          category: string
          sub_category: string | null
          belt_level: string
          difficulty: number
          instructions: string | null
          key_points: string[] | null
          tags: string[]
          is_published: boolean
          sort_order: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          name: string
          description?: string | null
          position: string
          category: string
          sub_category?: string | null
          belt_level?: string
          difficulty?: number
          instructions?: string | null
          key_points?: string[] | null
          tags?: string[]
          is_published?: boolean
          sort_order?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          academy_id?: string
          name?: string
          description?: string | null
          position?: string
          category?: string
          sub_category?: string | null
          belt_level?: string
          difficulty?: number
          instructions?: string | null
          key_points?: string[] | null
          tags?: string[]
          is_published?: boolean
          sort_order?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      technique_media: {
        Row: {
          id: string
          academy_id: string
          technique_id: string
          media_type: "video" | "image" | "pdf"
          url: string
          title: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          technique_id: string
          media_type: "video" | "image" | "pdf"
          url: string
          title?: string | null
          sort_order?: number
          created_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          academy_id?: string
          technique_id?: string
          media_type?: "video" | "image" | "pdf"
          url?: string
          title?: string | null
          sort_order?: number
          created_at?: string
        }
      }
      session_techniques: {
        Row: {
          id: string
          academy_id: string
          session_id: string
          technique_id: string
          sort_order: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          session_id: string
          technique_id: string
          sort_order?: number
          notes?: string | null
          created_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          academy_id?: string
          session_id?: string
          technique_id?: string
          sort_order?: number
          notes?: string | null
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          academy_id: string
          stripe_subscription_id: string
          stripe_customer_id: string
          status: string
          plan: "starter" | "growth" | "pro"
          billing_interval: "month" | "year"
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          stripe_subscription_id: string
          stripe_customer_id: string
          status: string
          plan: "starter" | "growth" | "pro"
          billing_interval?: "month" | "year"
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          academy_id?: string
          stripe_subscription_id?: string
          stripe_customer_id?: string
          status?: string
          plan?: "starter" | "growth" | "pro"
          billing_interval?: "month" | "year"
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          academy_id: string
          subscription_id: string
          stripe_payment_intent_id: string | null
          stripe_invoice_id: string | null
          amount: number
          currency: string
          status: string
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          subscription_id: string
          stripe_payment_intent_id?: string | null
          stripe_invoice_id?: string | null
          amount: number
          currency: string
          status: string
          paid_at?: string | null
          created_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          academy_id?: string
          subscription_id?: string
          stripe_payment_intent_id?: string | null
          stripe_invoice_id?: string | null
          amount?: number
          currency?: string
          status?: string
          paid_at?: string | null
          created_at?: string
        }
      }
      student_plans: {
        Row: {
          id: string
          academy_id: string
          member_id: string
          name: string
          price: number
          currency: string
          billing_cycle: "monthly" | "quarterly" | "annual" | "one_time"
          payment_method: "cash" | "pix" | "stripe" | "other"
          status: "active" | "paused" | "cancelled"
          start_date: string
          end_date: string | null
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          member_id: string
          name: string
          price: number
          currency: string
          billing_cycle?: "monthly" | "quarterly" | "annual" | "one_time"
          payment_method?: "cash" | "pix" | "stripe" | "other"
          status?: "active" | "paused" | "cancelled"
          start_date: string
          end_date?: string | null
          notes?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          academy_id?: string
          member_id?: string
          name?: string
          price?: number
          currency?: string
          billing_cycle?: "monthly" | "quarterly" | "annual" | "one_time"
          payment_method?: "cash" | "pix" | "stripe" | "other"
          status?: "active" | "paused" | "cancelled"
          start_date?: string
          end_date?: string | null
          notes?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      student_payments: {
        Row: {
          id: string
          academy_id: string
          plan_id: string
          member_id: string
          amount: number
          currency: string
          payment_method: "cash" | "pix" | "stripe" | "other"
          status: "pending" | "paid" | "overdue" | "cancelled"
          due_date: string
          paid_at: string | null
          pix_code: string | null
          pix_qr_data: string | null
          notes: string | null
          recorded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          plan_id: string
          member_id: string
          amount: number
          currency: string
          payment_method?: "cash" | "pix" | "stripe" | "other"
          status?: "pending" | "paid" | "overdue" | "cancelled"
          due_date: string
          paid_at?: string | null
          pix_code?: string | null
          pix_qr_data?: string | null
          notes?: string | null
          recorded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          academy_id?: string
          plan_id?: string
          member_id?: string
          amount?: number
          currency?: string
          payment_method?: "cash" | "pix" | "stripe" | "other"
          status?: "pending" | "paid" | "overdue" | "cancelled"
          due_date?: string
          paid_at?: string | null
          pix_code?: string | null
          pix_qr_data?: string | null
          notes?: string | null
          recorded_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          academy_id: string
          member_id: string
          type: string
          title: string
          body: string
          is_read: boolean
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          member_id: string
          type: string
          title: string
          body: string
          is_read?: boolean
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          academy_id?: string
          member_id?: string
          type?: string
          title?: string
          body?: string
          is_read?: boolean
          metadata?: Json | null
          created_at?: string
        }
      }
      automations: {
        Row: {
          id: string
          academy_id: string
          name: string
          trigger_type: string
          trigger_config: Json
          action_type: string
          action_config: Json
          is_active: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          name: string
          trigger_type: string
          trigger_config?: Json
          action_type: string
          action_config?: Json
          is_active?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          academy_id?: string
          name?: string
          trigger_type?: string
          trigger_config?: Json
          action_type?: string
          action_config?: Json
          is_active?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      automation_runs: {
        Row: {
          id: string
          academy_id: string
          automation_id: string
          status: "pending" | "running" | "completed" | "failed"
          triggered_by: string | null
          started_at: string
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          automation_id: string
          status?: "pending" | "running" | "completed" | "failed"
          triggered_by?: string | null
          started_at?: string
          completed_at?: string | null
          created_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          academy_id?: string
          automation_id?: string
          status?: "pending" | "running" | "completed" | "failed"
          triggered_by?: string | null
          started_at?: string
          completed_at?: string | null
          created_at?: string
        }
      }
      automation_logs: {
        Row: {
          id: string
          academy_id: string
          run_id: string
          member_id: string | null
          message: string
          level: "info" | "warning" | "error"
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          run_id: string
          member_id?: string | null
          message: string
          level?: "info" | "warning" | "error"
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          academy_id?: string
          run_id?: string
          member_id?: string | null
          message?: string
          level?: "info" | "warning" | "error"
          metadata?: Json | null
          created_at?: string
        }
      }
      ai_insights: {
        Row: {
          id: string
          academy_id: string
          member_id: string | null
          insight_type: string
          title: string
          body: string
          severity: "low" | "medium" | "high"
          metadata: Json | null
          is_dismissed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          member_id?: string | null
          insight_type: string
          title: string
          body: string
          severity?: "low" | "medium" | "high"
          metadata?: Json | null
          is_dismissed?: boolean
          created_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          academy_id?: string
          member_id?: string | null
          insight_type?: string
          title?: string
          body?: string
          severity?: "low" | "medium" | "high"
          metadata?: Json | null
          is_dismissed?: boolean
          created_at?: string
        }
      }
      ai_insight_actions: {
        Row: {
          id: string
          academy_id: string
          insight_id: string
          member_id: string
          action: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          insight_id: string
          member_id: string
          action: string
          notes?: string | null
          created_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          academy_id?: string
          insight_id?: string
          member_id?: string
          action?: string
          notes?: string | null
          created_at?: string
        }
      }
      audit_log: {
        Row: {
          id: string
          academy_id: string
          actor_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          metadata: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          actor_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          metadata?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          academy_id?: string
          actor_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          metadata?: Json | null
          ip_address?: string | null
          created_at?: string
        }
      }
      ownership_transfers: {
        Row: {
          id: string
          academy_id: string
          from_user_id: string
          to_user_id: string
          token: string
          status: "pending" | "completed" | "expired" | "cancelled"
          expires_at: string
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          from_user_id: string
          to_user_id: string
          token?: string
          status?: "pending" | "completed" | "expired" | "cancelled"
          expires_at?: string
          completed_at?: string | null
          created_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          academy_id?: string
          from_user_id?: string
          to_user_id?: string
          token?: string
          status?: "pending" | "completed" | "expired" | "cancelled"
          expires_at?: string
          completed_at?: string | null
          created_at?: string
        }
      }
      contracts: {
        Row: {
          id: string
          academy_id: string
          member_id: string
          title: string
          content: string
          status: "draft" | "sent" | "signed" | "expired" | "cancelled"
          signed_at: string | null
          signature_data: string | null
          signer_ip: string | null
          expires_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          member_id: string
          title: string
          content: string
          status?: "draft" | "sent" | "signed" | "expired" | "cancelled"
          signed_at?: string | null
          signature_data?: string | null
          signer_ip?: string | null
          expires_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          academy_id?: string
          member_id?: string
          title?: string
          content?: string
          status?: "draft" | "sent" | "signed" | "expired" | "cancelled"
          signed_at?: string | null
          signature_data?: string | null
          signer_ip?: string | null
          expires_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          academy_id: string
          title: string
          description: string | null
          event_type: "seminar" | "competition" | "social" | "workshop" | "other"
          start_date: string
          end_date: string | null
          start_time: string | null
          end_time: string | null
          location: string | null
          is_public: boolean
          max_participants: number | null
          registration_required: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          title: string
          description?: string | null
          event_type?: "seminar" | "competition" | "social" | "workshop" | "other"
          start_date: string
          end_date?: string | null
          start_time?: string | null
          end_time?: string | null
          location?: string | null
          is_public?: boolean
          max_participants?: number | null
          registration_required?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          academy_id?: string
          title?: string
          description?: string | null
          event_type?: "seminar" | "competition" | "social" | "workshop" | "other"
          start_date?: string
          end_date?: string | null
          start_time?: string | null
          end_time?: string | null
          location?: string | null
          is_public?: boolean
          max_participants?: number | null
          registration_required?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      announcements: {
        Row: {
          id: string
          academy_id: string
          title: string
          content: string
          priority: "normal" | "important" | "urgent"
          pinned: boolean
          author_id: string | null
          published_at: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          title: string
          content: string
          priority?: "normal" | "important" | "urgent"
          pinned?: boolean
          author_id?: string | null
          published_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          academy_id?: string
          title?: string
          content?: string
          priority?: "normal" | "important" | "urgent"
          pinned?: boolean
          author_id?: string | null
          published_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      inventory_items: {
        Row: {
          id: string
          academy_id: string
          name: string
          description: string | null
          category: "kimono" | "belt" | "rashguard" | "shorts" | "accessory" | "other"
          price_cents: number
          currency: string
          stock_quantity: number
          low_stock_threshold: number
          sku: string | null
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          name: string
          description?: string | null
          category?: "kimono" | "belt" | "rashguard" | "shorts" | "accessory" | "other"
          price_cents: number
          currency?: string
          stock_quantity?: number
          low_stock_threshold?: number
          sku?: string | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          academy_id?: string
          name?: string
          description?: string | null
          category?: "kimono" | "belt" | "rashguard" | "shorts" | "accessory" | "other"
          price_cents?: number
          currency?: string
          stock_quantity?: number
          low_stock_threshold?: number
          sku?: string | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      webhooks: {
        Row: {
          id: string
          academy_id: string
          url: string
          secret: string
          events: string[]
          is_active: boolean
          last_triggered_at: string | null
          last_status_code: number | null
          failure_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          url: string
          secret?: string
          events: string[]
          is_active?: boolean
          last_triggered_at?: string | null
          last_status_code?: number | null
          failure_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          academy_id?: string
          url?: string
          secret?: string
          events?: string[]
          is_active?: boolean
          last_triggered_at?: string | null
          last_status_code?: number | null
          failure_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      inventory_transactions: {
        Row: {
          id: string
          academy_id: string
          item_id: string
          member_id: string | null
          type: "sale" | "restock" | "adjustment" | "return"
          quantity: number
          price_cents: number | null
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          item_id: string
          member_id?: string | null
          type: "sale" | "restock" | "adjustment" | "return"
          quantity: number
          price_cents?: number | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          academy_id?: string
          item_id?: string
          member_id?: string | null
          type?: "sale" | "restock" | "adjustment" | "return"
          quantity?: number
          price_cents?: number | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      technique_events: {
        Row: {
          id: string
          academy_id: string
          member_id: string
          technique_slug: string
          event_type: "attempt" | "success" | "submission"
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          member_id: string
          technique_slug: string
          event_type: "attempt" | "success" | "submission"
          notes?: string | null
          created_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          academy_id?: string
          member_id?: string
          technique_slug?: string
          event_type?: "attempt" | "success" | "submission"
          notes?: string | null
          created_at?: string
        }
      }
      member_titles: {
        Row: {
          id: string
          academy_id: string
          member_id: string
          title: string
          competition: string
          category: string | null
          weight_class: string | null
          placement: "gold" | "silver" | "bronze" | "other"
          date: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          member_id: string
          title: string
          competition: string
          category?: string | null
          weight_class?: string | null
          placement?: "gold" | "silver" | "bronze" | "other"
          date: string
          notes?: string | null
          created_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          academy_id?: string
          member_id?: string
          title?: string
          competition?: string
          category?: string | null
          weight_class?: string | null
          placement?: "gold" | "silver" | "bronze" | "other"
          date?: string
          notes?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      academy_public: {
        Row: {
          id: string
          slug: string
          name: string
          logo_url: string | null
          status: "active" | "suspended" | "cancelled" | "deleted"
        }
        Relationships: []
      }
    }
    Functions: {
      get_current_academy_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_academy_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: Record<string, never>
  }
}
