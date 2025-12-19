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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      account_activities: {
        Row: {
          account_id: string
          activity_date: string
          activity_type: string
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          outcome: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          account_id: string
          activity_date?: string
          activity_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          outcome?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          activity_date?: string
          activity_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          outcome?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_activities_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          account_owner: string | null
          company_name: string
          company_type: string | null
          contact_count: number | null
          country: string | null
          created_at: string | null
          created_by: string | null
          deal_count: number | null
          email: string | null
          id: string
          industry: string | null
          last_activity_date: string | null
          modified_by: string | null
          notes: string | null
          phone: string | null
          region: string | null
          score: number | null
          segment: string | null
          status: string | null
          tags: string[] | null
          total_revenue: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          account_owner?: string | null
          company_name: string
          company_type?: string | null
          contact_count?: number | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_count?: number | null
          email?: string | null
          id?: string
          industry?: string | null
          last_activity_date?: string | null
          modified_by?: string | null
          notes?: string | null
          phone?: string | null
          region?: string | null
          score?: number | null
          segment?: string | null
          status?: string | null
          tags?: string[] | null
          total_revenue?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          account_owner?: string | null
          company_name?: string
          company_type?: string | null
          contact_count?: number | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_count?: number | null
          email?: string | null
          id?: string
          industry?: string | null
          last_activity_date?: string | null
          modified_by?: string | null
          notes?: string | null
          phone?: string | null
          region?: string | null
          score?: number | null
          segment?: string | null
          status?: string | null
          tags?: string[] | null
          total_revenue?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      backups: {
        Row: {
          backup_type: string
          created_at: string
          created_by: string | null
          file_name: string
          file_path: string
          id: string
          manifest: Json | null
          records_count: number | null
          size_bytes: number | null
          status: string
          tables_count: number | null
        }
        Insert: {
          backup_type?: string
          created_at?: string
          created_by?: string | null
          file_name: string
          file_path: string
          id?: string
          manifest?: Json | null
          records_count?: number | null
          size_bytes?: number | null
          status?: string
          tables_count?: number | null
        }
        Update: {
          backup_type?: string
          created_at?: string
          created_by?: string | null
          file_name?: string
          file_path?: string
          id?: string
          manifest?: Json | null
          records_count?: number | null
          size_bytes?: number | null
          status?: string
          tables_count?: number | null
        }
        Relationships: []
      }
      contact_activities: {
        Row: {
          activity_date: string
          activity_type: string
          contact_id: string
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          outcome: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          activity_date?: string
          activity_type: string
          contact_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          outcome?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          activity_date?: string
          activity_type?: string
          contact_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          outcome?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          account_id: string | null
          communication_preferences: Json | null
          company_name: string | null
          contact_name: string
          contact_owner: string | null
          contact_source: string | null
          created_by: string | null
          created_time: string | null
          description: string | null
          email: string | null
          email_clicks: number | null
          email_opens: number | null
          engagement_score: number | null
          id: string
          industry: string | null
          last_contacted_at: string | null
          linkedin: string | null
          modified_by: string | null
          modified_time: string | null
          phone_no: string | null
          position: string | null
          region: string | null
          score: number | null
          segment: string | null
          tags: string[] | null
          website: string | null
        }
        Insert: {
          account_id?: string | null
          communication_preferences?: Json | null
          company_name?: string | null
          contact_name: string
          contact_owner?: string | null
          contact_source?: string | null
          created_by?: string | null
          created_time?: string | null
          description?: string | null
          email?: string | null
          email_clicks?: number | null
          email_opens?: number | null
          engagement_score?: number | null
          id?: string
          industry?: string | null
          last_contacted_at?: string | null
          linkedin?: string | null
          modified_by?: string | null
          modified_time?: string | null
          phone_no?: string | null
          position?: string | null
          region?: string | null
          score?: number | null
          segment?: string | null
          tags?: string[] | null
          website?: string | null
        }
        Update: {
          account_id?: string | null
          communication_preferences?: Json | null
          company_name?: string | null
          contact_name?: string
          contact_owner?: string | null
          contact_source?: string | null
          created_by?: string | null
          created_time?: string | null
          description?: string | null
          email?: string | null
          email_clicks?: number | null
          email_opens?: number | null
          engagement_score?: number | null
          id?: string
          industry?: string | null
          last_contacted_at?: string | null
          linkedin?: string | null
          modified_by?: string | null
          modified_time?: string | null
          phone_no?: string | null
          position?: string | null
          region?: string | null
          score?: number | null
          segment?: string | null
          tags?: string[] | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_custom_fields: {
        Row: {
          created_at: string
          created_by: string | null
          display_order: number | null
          entity_type: string
          field_label: string
          field_name: string
          field_options: Json | null
          field_type: string
          id: string
          is_required: boolean | null
          is_visible: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_order?: number | null
          entity_type: string
          field_label: string
          field_name: string
          field_options?: Json | null
          field_type?: string
          id?: string
          is_required?: boolean | null
          is_visible?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_order?: number | null
          entity_type?: string
          field_label?: string
          field_name?: string
          field_options?: Json | null
          field_type?: string
          id?: string
          is_required?: boolean | null
          is_visible?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      dashboard_preferences: {
        Row: {
          card_order: Json | null
          created_at: string | null
          id: string
          layout_view: string | null
          updated_at: string | null
          user_id: string
          visible_widgets: Json | null
        }
        Insert: {
          card_order?: Json | null
          created_at?: string | null
          id?: string
          layout_view?: string | null
          updated_at?: string | null
          user_id: string
          visible_widgets?: Json | null
        }
        Update: {
          card_order?: Json | null
          created_at?: string | null
          id?: string
          layout_view?: string | null
          updated_at?: string | null
          user_id?: string
          visible_widgets?: Json | null
        }
        Relationships: []
      }
      deal_action_items: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          deal_id: string
          due_date: string | null
          id: string
          next_action: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          deal_id: string
          due_date?: string | null
          id?: string
          next_action: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string
          due_date?: string | null
          id?: string
          next_action?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_action_items_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          action_items: string | null
          budget: string | null
          business_value: string | null
          closing: string | null
          created_at: string | null
          created_by: string | null
          currency_type: string | null
          current_status: string | null
          customer_challenges: string | null
          customer_name: string | null
          customer_need: string | null
          deal_name: string
          decision_maker_level: string | null
          drop_reason: string | null
          end_date: string | null
          expected_closing_date: string | null
          handoff_status: string | null
          id: string
          implementation_start_date: string | null
          internal_comment: string | null
          is_recurring: string | null
          lead_name: string | null
          lead_owner: string | null
          lost_reason: string | null
          modified_at: string | null
          modified_by: string | null
          need_improvement: string | null
          priority: number | null
          probability: number | null
          project_duration: number | null
          project_name: string | null
          proposal_due_date: string | null
          quarterly_revenue_q1: number | null
          quarterly_revenue_q2: number | null
          quarterly_revenue_q3: number | null
          quarterly_revenue_q4: number | null
          region: string | null
          relationship_strength: string | null
          rfq_received_date: string | null
          rfq_status: string | null
          signed_contract_date: string | null
          stage: string
          start_date: string | null
          total_contract_value: number | null
          total_revenue: number | null
          won_reason: string | null
        }
        Insert: {
          action_items?: string | null
          budget?: string | null
          business_value?: string | null
          closing?: string | null
          created_at?: string | null
          created_by?: string | null
          currency_type?: string | null
          current_status?: string | null
          customer_challenges?: string | null
          customer_name?: string | null
          customer_need?: string | null
          deal_name: string
          decision_maker_level?: string | null
          drop_reason?: string | null
          end_date?: string | null
          expected_closing_date?: string | null
          handoff_status?: string | null
          id?: string
          implementation_start_date?: string | null
          internal_comment?: string | null
          is_recurring?: string | null
          lead_name?: string | null
          lead_owner?: string | null
          lost_reason?: string | null
          modified_at?: string | null
          modified_by?: string | null
          need_improvement?: string | null
          priority?: number | null
          probability?: number | null
          project_duration?: number | null
          project_name?: string | null
          proposal_due_date?: string | null
          quarterly_revenue_q1?: number | null
          quarterly_revenue_q2?: number | null
          quarterly_revenue_q3?: number | null
          quarterly_revenue_q4?: number | null
          region?: string | null
          relationship_strength?: string | null
          rfq_received_date?: string | null
          rfq_status?: string | null
          signed_contract_date?: string | null
          stage?: string
          start_date?: string | null
          total_contract_value?: number | null
          total_revenue?: number | null
          won_reason?: string | null
        }
        Update: {
          action_items?: string | null
          budget?: string | null
          business_value?: string | null
          closing?: string | null
          created_at?: string | null
          created_by?: string | null
          currency_type?: string | null
          current_status?: string | null
          customer_challenges?: string | null
          customer_name?: string | null
          customer_need?: string | null
          deal_name?: string
          decision_maker_level?: string | null
          drop_reason?: string | null
          end_date?: string | null
          expected_closing_date?: string | null
          handoff_status?: string | null
          id?: string
          implementation_start_date?: string | null
          internal_comment?: string | null
          is_recurring?: string | null
          lead_name?: string | null
          lead_owner?: string | null
          lost_reason?: string | null
          modified_at?: string | null
          modified_by?: string | null
          need_improvement?: string | null
          priority?: number | null
          probability?: number | null
          project_duration?: number | null
          project_name?: string | null
          proposal_due_date?: string | null
          quarterly_revenue_q1?: number | null
          quarterly_revenue_q2?: number | null
          quarterly_revenue_q3?: number | null
          quarterly_revenue_q4?: number | null
          region?: string | null
          relationship_strength?: string | null
          rfq_received_date?: string | null
          rfq_status?: string | null
          signed_contract_date?: string | null
          stage?: string
          start_date?: string | null
          total_contract_value?: number | null
          total_revenue?: number | null
          won_reason?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      import_export_settings: {
        Row: {
          created_at: string
          default_values: Json | null
          entity_type: string
          field_mappings: Json | null
          id: string
          skip_duplicates: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_values?: Json | null
          entity_type: string
          field_mappings?: Json | null
          id?: string
          skip_duplicates?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_values?: Json | null
          entity_type?: string
          field_mappings?: Json | null
          id?: string
          skip_duplicates?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      integration_settings: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          integration_name: string
          is_enabled: boolean | null
          last_sync_at: string | null
          sync_status: string | null
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          integration_name: string
          is_enabled?: boolean | null
          last_sync_at?: string | null
          sync_status?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          integration_name?: string
          is_enabled?: boolean | null
          last_sync_at?: string | null
          sync_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      keep_alive: {
        Row: {
          "Able to read DB": string | null
          created_at: string
          id: number
        }
        Insert: {
          "Able to read DB"?: string | null
          created_at?: string
          id?: number
        }
        Update: {
          "Able to read DB"?: string | null
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      lead_action_items: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          due_date: string | null
          id: string
          lead_id: string
          next_action: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          lead_id: string
          next_action: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string
          next_action?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_statuses: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          is_converted_status: boolean | null
          status_color: string | null
          status_name: string
          status_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_converted_status?: boolean | null
          status_color?: string | null
          status_name: string
          status_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_converted_status?: boolean | null
          status_color?: string | null
          status_name?: string
          status_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          account_id: string | null
          company_name: string | null
          contact_owner: string | null
          contact_source: string | null
          country: string | null
          created_by: string | null
          created_time: string | null
          description: string | null
          email: string | null
          id: string
          industry: string | null
          lead_name: string
          lead_status: string | null
          linkedin: string | null
          modified_by: string | null
          modified_time: string | null
          phone_no: string | null
          position: string | null
          website: string | null
        }
        Insert: {
          account_id?: string | null
          company_name?: string | null
          contact_owner?: string | null
          contact_source?: string | null
          country?: string | null
          created_by?: string | null
          created_time?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          lead_name: string
          lead_status?: string | null
          linkedin?: string | null
          modified_by?: string | null
          modified_time?: string | null
          phone_no?: string | null
          position?: string | null
          website?: string | null
        }
        Update: {
          account_id?: string | null
          company_name?: string | null
          contact_owner?: string | null
          contact_source?: string | null
          country?: string | null
          created_by?: string | null
          created_time?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          lead_name?: string
          lead_status?: string | null
          linkedin?: string | null
          modified_by?: string | null
          modified_time?: string | null
          phone_no?: string | null
          position?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_follow_ups: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          meeting_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          meeting_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          meeting_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_follow_ups_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_reminders: {
        Row: {
          created_at: string
          id: string
          meeting_id: string
          remind_15min: boolean
          remind_1day: boolean
          remind_1hr: boolean
          sent_15min: boolean
          sent_1day: boolean
          sent_1hr: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_id: string
          remind_15min?: boolean
          remind_1day?: boolean
          remind_1hr?: boolean
          sent_15min?: boolean
          sent_1day?: boolean
          sent_1hr?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          meeting_id?: string
          remind_15min?: boolean
          remind_1day?: boolean
          remind_1hr?: boolean
          sent_15min?: boolean
          sent_1day?: boolean
          sent_1hr?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_reminders_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: true
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          attendees: Json | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_time: string
          id: string
          join_url: string | null
          lead_id: string | null
          notes: string | null
          outcome: string | null
          start_time: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          attendees?: Json | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time: string
          id?: string
          join_url?: string | null
          lead_id?: string | null
          notes?: string | null
          outcome?: string | null
          start_time: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          attendees?: Json | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string
          id?: string
          join_url?: string | null
          lead_id?: string | null
          notes?: string | null
          outcome?: string | null
          start_time?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          deal_updates: boolean | null
          email_notifications: boolean | null
          id: string
          in_app_notifications: boolean | null
          lead_assigned: boolean | null
          meeting_reminders: boolean | null
          push_notifications: boolean | null
          task_reminders: boolean | null
          updated_at: string
          user_id: string
          weekly_digest: boolean | null
        }
        Insert: {
          created_at?: string
          deal_updates?: boolean | null
          email_notifications?: boolean | null
          id?: string
          in_app_notifications?: boolean | null
          lead_assigned?: boolean | null
          meeting_reminders?: boolean | null
          push_notifications?: boolean | null
          task_reminders?: boolean | null
          updated_at?: string
          user_id: string
          weekly_digest?: boolean | null
        }
        Update: {
          created_at?: string
          deal_updates?: boolean | null
          email_notifications?: boolean | null
          id?: string
          in_app_notifications?: boolean | null
          lead_assigned?: boolean | null
          meeting_reminders?: boolean | null
          push_notifications?: boolean | null
          task_reminders?: boolean | null
          updated_at?: string
          user_id?: string
          weekly_digest?: boolean | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_item_id: string | null
          created_at: string
          id: string
          lead_id: string | null
          message: string
          notification_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_item_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          message: string
          notification_type?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_item_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          message?: string
          notification_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      page_permissions: {
        Row: {
          admin_access: boolean
          created_at: string
          description: string | null
          id: string
          manager_access: boolean
          page_name: string
          route: string
          updated_at: string
          user_access: boolean
        }
        Insert: {
          admin_access?: boolean
          created_at?: string
          description?: string | null
          id?: string
          manager_access?: boolean
          page_name: string
          route: string
          updated_at?: string
          user_access?: boolean
        }
        Update: {
          admin_access?: boolean
          created_at?: string
          description?: string | null
          id?: string
          manager_access?: boolean
          page_name?: string
          route?: string
          updated_at?: string
          user_access?: boolean
        }
        Relationships: []
      }
      pipeline_stages: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          is_lost_stage: boolean | null
          is_won_stage: boolean | null
          stage_color: string | null
          stage_name: string
          stage_order: number
          stage_probability: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_lost_stage?: boolean | null
          is_won_stage?: boolean | null
          stage_color?: string | null
          stage_name: string
          stage_order?: number
          stage_probability?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_lost_stage?: boolean | null
          is_won_stage?: boolean | null
          stage_color?: string | null
          stage_name?: string
          stage_order?: number
          stage_probability?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          "Email ID": string | null
          full_name: string | null
          id: string
          phone: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          "Email ID"?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          "Email ID"?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      saved_filters: {
        Row: {
          created_at: string
          filter_type: string
          filters: Json
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filter_type?: string
          filters: Json
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          filter_type?: string
          filters?: Json
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      task_subtasks: {
        Row: {
          created_at: string
          id: string
          is_completed: boolean
          order_index: number
          task_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_completed?: boolean
          order_index?: number
          task_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_completed?: boolean
          order_index?: number
          task_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          account_id: string | null
          assigned_to: string | null
          category: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          description: string | null
          due_date: string | null
          due_time: string | null
          id: string
          lead_id: string | null
          parent_task_id: string | null
          priority: string
          recurrence: string | null
          recurrence_end_date: string | null
          reminder_date: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          lead_id?: string | null
          parent_task_id?: string | null
          priority?: string
          recurrence?: string | null
          recurrence_end_date?: string | null
          reminder_date?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          lead_id?: string | null
          parent_task_id?: string | null
          priority?: string
          recurrence?: string | null
          recurrence_end_date?: string | null
          reminder_date?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string | null
          currency: string | null
          date_format: string | null
          default_module: string | null
          id: string
          language: string | null
          theme: string | null
          time_format: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          date_format?: string | null
          default_module?: string | null
          id?: string
          language?: string | null
          theme?: string | null
          time_format?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          date_format?: string | null
          default_module?: string | null
          id?: string
          language?: string | null
          theme?: string | null
          time_format?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          device_info: Json | null
          expires_at: string | null
          id: string
          ip_address: unknown
          is_active: boolean | null
          last_active_at: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_active_at?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_active_at?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      yearly_revenue_targets: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          total_target: number
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          total_target?: number
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          total_target?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_account_score: {
        Args: { p_account_id: string }
        Returns: number
      }
      calculate_contact_score: {
        Args: { p_contact_id: string }
        Returns: number
      }
      get_user_role: { Args: { p_user_id: string }; Returns: string }
      is_current_user_admin: { Args: never; Returns: boolean }
      is_current_user_admin_by_metadata: { Args: never; Returns: boolean }
      is_user_admin: { Args: { user_id?: string }; Returns: boolean }
      log_data_access: {
        Args: {
          p_operation: string
          p_record_id?: string
          p_table_name: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_resource_id?: string
          p_resource_type: string
        }
        Returns: undefined
      }
      update_account_stats: {
        Args: { p_account_id: string }
        Returns: undefined
      }
      update_contact_stats: {
        Args: { p_contact_id: string }
        Returns: undefined
      }
      update_user_role: {
        Args: { p_role: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      task_priority: "high" | "medium" | "low"
      task_recurrence: "none" | "daily" | "weekly" | "monthly" | "yearly"
      task_status: "open" | "in_progress" | "completed" | "deferred"
      user_role: "admin" | "manager" | "user"
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
      task_priority: ["high", "medium", "low"],
      task_recurrence: ["none", "daily", "weekly", "monthly", "yearly"],
      task_status: ["open", "in_progress", "completed", "deferred"],
      user_role: ["admin", "manager", "user"],
    },
  },
} as const
