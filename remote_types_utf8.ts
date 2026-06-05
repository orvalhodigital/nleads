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
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
      admin_audit_logs: {
        Row: {
          action: string | null
          admin_id: string | null
          changes: Json | null
          created_at: string | null
          id: string
          resource_id: string | null
          resource_name: string | null
          resource_type: string | null
        }
        Insert: {
          action?: string | null
          admin_id?: string | null
          changes?: Json | null
          created_at?: string | null
          id?: string
          resource_id?: string | null
          resource_name?: string | null
          resource_type?: string | null
        }
        Update: {
          action?: string | null
          admin_id?: string | null
          changes?: Json | null
          created_at?: string | null
          id?: string
          resource_id?: string | null
          resource_name?: string | null
          resource_type?: string | null
        }
        Relationships: []
      }
      broadcast_history: {
        Row: {
          admin_id: string | null
          created_at: string | null
          id: string
          message: string
          sent_count: number | null
          target_filter: string | null
          title: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          sent_count?: number | null
          target_filter?: string | null
          title: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          sent_count?: number | null
          target_filter?: string | null
          title?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          is_active: boolean | null
          name: string
          plan_id: string | null
          promo_price: number
          promo_text: string | null
          start_date: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          name: string
          plan_id?: string | null
          promo_price?: number
          promo_text?: string | null
          start_date: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          name?: string
          plan_id?: string | null
          promo_price?: number
          promo_text?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      guarantee_configs: {
        Row: {
          conditions: Json | null
          created_at: string | null
          days_warranty: number
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conditions?: Json | null
          created_at?: string | null
          days_warranty: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conditions?: Json | null
          created_at?: string | null
          days_warranty?: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          admin_id: string
          created_at: string | null
          email: string
          id: string
          status: string | null
        }
        Insert: {
          admin_id: string
          created_at?: string | null
          email: string
          id?: string
          status?: string | null
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          email?: string
          id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_communications: {
        Row: {
          contact_name: string
          contact_phone: string
          created_at: string | null
          email_user: string | null
          id: string
          is_sent: string | null
          lead_id: string | null
          message_body: string
          vehicle_id: string | null
        }
        Insert: {
          contact_name: string
          contact_phone: string
          created_at?: string | null
          email_user?: string | null
          id?: string
          is_sent?: string | null
          lead_id?: string | null
          message_body: string
          vehicle_id?: string | null
        }
        Update: {
          contact_name?: string
          contact_phone?: string
          created_at?: string | null
          email_user?: string | null
          id?: string
          is_sent?: string | null
          lead_id?: string | null
          message_body?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_communications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_communications_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          admin_id: string | null
          carro_motorizacao: string[] | null
          carro_transmissao: string[] | null
          carro_valor_max: number | null
          carro_valor_min: number | null
          carro_valormax: number | null
          created_at: string | null
          delivery_date: string | null
          disqualification_notes: string | null
          disqualification_reasons: string[] | null
          email: string | null
          follow_up_data: Json | null
          foto_url: string | null
          funnel_history: Json | null
          guarantee_ends_at: string | null
          guarantee_id: string | null
          id: string
          interaction_history: Json | null
          interesse_carro: boolean | null
          interesse_moto: boolean | null
          last_update: string | null
          marcas: string[] | null
          marcas_moto: string[] | null
          marketing_metadata: Json | null
          modelos: string[] | null
          modelos_moto: string[] | null
          moto__valormax: number | null
          moto_motorizacao: string[] | null
          moto_transmissao: string[] | null
          moto_valor_max: number | null
          moto_valor_min: number | null
          motorizacao: string[] | null
          name: string
          notes: string | null
          observacoes_adicionais: string | null
          phase: string
          phone: string | null
          possui_entrada: boolean | null
          possui_troca: boolean | null
          post_sale_notes: string | null
          presented_vehicles: string[] | null
          sale_date: string | null
          sale_status: string | null
          scheduling_data: Json | null
          simulation_data: Json | null
          source: string | null
          tags: string[] | null
          temperature: string
          tipos_moto: string[] | null
          tipos_veiculo: string[] | null
          transmissao: string[] | null
          user_id: string | null
          valor_entrada: number | null
          valor_maximo: number | null
          valor_minimo: number | null
          veiculo_troca: string | null
          visit_date: string | null
          visit_status: string | null
        }
        Insert: {
          admin_id?: string | null
          carro_motorizacao?: string[] | null
          carro_transmissao?: string[] | null
          carro_valor_max?: number | null
          carro_valor_min?: number | null
          carro_valormax?: number | null
          created_at?: string | null
          delivery_date?: string | null
          disqualification_notes?: string | null
          disqualification_reasons?: string[] | null
          email?: string | null
          follow_up_data?: Json | null
          foto_url?: string | null
          funnel_history?: Json | null
          guarantee_ends_at?: string | null
          guarantee_id?: string | null
          id?: string
          interaction_history?: Json | null
          interesse_carro?: boolean | null
          interesse_moto?: boolean | null
          last_update?: string | null
          marcas?: string[] | null
          marcas_moto?: string[] | null
          marketing_metadata?: Json | null
          modelos?: string[] | null
          modelos_moto?: string[] | null
          moto__valormax?: number | null
          moto_motorizacao?: string[] | null
          moto_transmissao?: string[] | null
          moto_valor_max?: number | null
          moto_valor_min?: number | null
          motorizacao?: string[] | null
          name: string
          notes?: string | null
          observacoes_adicionais?: string | null
          phase?: string
          phone?: string | null
          possui_entrada?: boolean | null
          possui_troca?: boolean | null
          post_sale_notes?: string | null
          presented_vehicles?: string[] | null
          sale_date?: string | null
          sale_status?: string | null
          scheduling_data?: Json | null
          simulation_data?: Json | null
          source?: string | null
          tags?: string[] | null
          temperature?: string
          tipos_moto?: string[] | null
          tipos_veiculo?: string[] | null
          transmissao?: string[] | null
          user_id?: string | null
          valor_entrada?: number | null
          valor_maximo?: number | null
          valor_minimo?: number | null
          veiculo_troca?: string | null
          visit_date?: string | null
          visit_status?: string | null
        }
        Update: {
          admin_id?: string | null
          carro_motorizacao?: string[] | null
          carro_transmissao?: string[] | null
          carro_valor_max?: number | null
          carro_valor_min?: number | null
          carro_valormax?: number | null
          created_at?: string | null
          delivery_date?: string | null
          disqualification_notes?: string | null
          disqualification_reasons?: string[] | null
          email?: string | null
          follow_up_data?: Json | null
          foto_url?: string | null
          funnel_history?: Json | null
          guarantee_ends_at?: string | null
          guarantee_id?: string | null
          id?: string
          interaction_history?: Json | null
          interesse_carro?: boolean | null
          interesse_moto?: boolean | null
          last_update?: string | null
          marcas?: string[] | null
          marcas_moto?: string[] | null
          marketing_metadata?: Json | null
          modelos?: string[] | null
          modelos_moto?: string[] | null
          moto__valormax?: number | null
          moto_motorizacao?: string[] | null
          moto_transmissao?: string[] | null
          moto_valor_max?: number | null
          moto_valor_min?: number | null
          motorizacao?: string[] | null
          name?: string
          notes?: string | null
          observacoes_adicionais?: string | null
          phase?: string
          phone?: string | null
          possui_entrada?: boolean | null
          possui_troca?: boolean | null
          post_sale_notes?: string | null
          presented_vehicles?: string[] | null
          sale_date?: string | null
          sale_status?: string | null
          scheduling_data?: Json | null
          simulation_data?: Json | null
          source?: string | null
          tags?: string[] | null
          temperature?: string
          tipos_moto?: string[] | null
          tipos_veiculo?: string[] | null
          transmissao?: string[] | null
          user_id?: string | null
          valor_entrada?: number | null
          valor_maximo?: number | null
          valor_minimo?: number | null
          veiculo_troca?: string | null
          visit_date?: string | null
          visit_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_guarantee_id_fkey"
            columns: ["guarantee_id"]
            isOneToOne: false
            referencedRelation: "guarantee_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenances: {
        Row: {
          client_name: string
          client_phone: string
          created_at: string | null
          device_imei: string | null
          device_model: string
          estimated_price: number | null
          id: string
          notes: string | null
          problem_description: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          client_name: string
          client_phone: string
          created_at?: string | null
          device_imei?: string | null
          device_model: string
          estimated_price?: number | null
          id?: string
          notes?: string | null
          problem_description?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          client_name?: string
          client_phone?: string
          created_at?: string | null
          device_imei?: string | null
          device_model?: string
          estimated_price?: number | null
          id?: string
          notes?: string | null
          problem_description?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      motivation_quotes: {
        Row: {
          author: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          quote: string
        }
        Insert: {
          author?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          quote: string
        }
        Update: {
          author?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          quote?: string
        }
        Relationships: []
      }
      motorcycles: {
        Row: {
          admin_id: string | null
          brake_type: string | null
          brand: string
          category: string
          color: string
          cooling: string | null
          created_at: string | null
          description: string | null
          engine: string
          fipe_price: number | null
          fuel_system: string | null
          gallery_images: string[] | null
          has_owner_manual: boolean | null
          has_spare_key: boolean | null
          has_warranty: boolean | null
          id: string
          image_url: string | null
          is_ipva_paid: boolean | null
          is_single_owner: boolean | null
          mileage: number
          model: string
          model_year: number | null
          optionals: string[] | null
          plate: string | null
          price: number
          sale_details: Json | null
          short_description: string | null
          show_on_website: boolean
          start_type: string | null
          status: string | null
          user_id: string | null
          year: number
        }
        Insert: {
          admin_id?: string | null
          brake_type?: string | null
          brand: string
          category: string
          color: string
          cooling?: string | null
          created_at?: string | null
          description?: string | null
          engine: string
          fipe_price?: number | null
          fuel_system?: string | null
          gallery_images?: string[] | null
          has_owner_manual?: boolean | null
          has_spare_key?: boolean | null
          has_warranty?: boolean | null
          id?: string
          image_url?: string | null
          is_ipva_paid?: boolean | null
          is_single_owner?: boolean | null
          mileage?: number
          model: string
          model_year?: number | null
          optionals?: string[] | null
          plate?: string | null
          price?: number
          sale_details?: Json | null
          short_description?: string | null
          show_on_website?: boolean
          start_type?: string | null
          status?: string | null
          user_id?: string | null
          year: number
        }
        Update: {
          admin_id?: string | null
          brake_type?: string | null
          brand?: string
          category?: string
          color?: string
          cooling?: string | null
          created_at?: string | null
          description?: string | null
          engine?: string
          fipe_price?: number | null
          fuel_system?: string | null
          gallery_images?: string[] | null
          has_owner_manual?: boolean | null
          has_spare_key?: boolean | null
          has_warranty?: boolean | null
          id?: string
          image_url?: string | null
          is_ipva_paid?: boolean | null
          is_single_owner?: boolean | null
          mileage?: number
          model?: string
          model_year?: number | null
          optionals?: string[] | null
          plate?: string | null
          price?: number
          sale_details?: Json | null
          short_description?: string | null
          show_on_website?: boolean
          start_type?: string | null
          status?: string | null
          user_id?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "motorcycles_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_rules: {
        Row: {
          active: boolean | null
          category: string | null
          created_at: string | null
          delay_minutes: number | null
          id: string
          message: string
          target_plan: string | null
          target_status: string | null
          title: string
          trigger_event: string
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          delay_minutes?: number | null
          id?: string
          message: string
          target_plan?: string | null
          target_status?: string | null
          title: string
          trigger_event: string
        }
        Update: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          delay_minutes?: number | null
          id?: string
          message?: string
          target_plan?: string | null
          target_status?: string | null
          title?: string
          trigger_event?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          message: string
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          message: string
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          message?: string
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      onboarding_sessions: {
        Row: {
          created_at: string | null
          followup_date: string | null
          id: string
          notes: string | null
          review_30d_date: string | null
          satisfaction_score: number | null
          step_educational_materials: boolean | null
          step_first_activation: boolean | null
          step_followup_success: boolean | null
          step_pixel_configured: boolean | null
          step_referral_request: boolean | null
          step_technical_setup: boolean | null
          step_traffic_setup: boolean | null
          step_welcome_meeting: boolean | null
          updated_at: string | null
          user_id: string | null
          welcome_meeting_date: string | null
        }
        Insert: {
          created_at?: string | null
          followup_date?: string | null
          id?: string
          notes?: string | null
          review_30d_date?: string | null
          satisfaction_score?: number | null
          step_educational_materials?: boolean | null
          step_first_activation?: boolean | null
          step_followup_success?: boolean | null
          step_pixel_configured?: boolean | null
          step_referral_request?: boolean | null
          step_technical_setup?: boolean | null
          step_traffic_setup?: boolean | null
          step_welcome_meeting?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          welcome_meeting_date?: string | null
        }
        Update: {
          created_at?: string | null
          followup_date?: string | null
          id?: string
          notes?: string | null
          review_30d_date?: string | null
          satisfaction_score?: number | null
          step_educational_materials?: boolean | null
          step_first_activation?: boolean | null
          step_followup_success?: boolean | null
          step_pixel_configured?: boolean | null
          step_referral_request?: boolean | null
          step_technical_setup?: boolean | null
          step_traffic_setup?: boolean | null
          step_welcome_meeting?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          welcome_meeting_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      phones: {
        Row: {
          battery_health: number | null
          brand: string
          capacity: string | null
          color: string | null
          condition: string | null
          created_at: string | null
          id: string
          image_url: string | null
          imei: string | null
          model: string
          price: number
          sale_details: Json | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          battery_health?: number | null
          brand: string
          capacity?: string | null
          color?: string | null
          condition?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          imei?: string | null
          model: string
          price?: number
          sale_details?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          battery_health?: number | null
          brand?: string
          capacity?: string | null
          color?: string | null
          condition?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          imei?: string | null
          model?: string
          price?: number
          sale_details?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string | null
          description: string | null
          duration_days: number | null
          features: Json | null
          id: string
          interval: string | null
          is_active: boolean | null
          name: string
          price: number
          slug: string
          stripe_url: string | null
          style: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_days?: number | null
          features?: Json | null
          id?: string
          interval?: string | null
          is_active?: boolean | null
          name: string
          price?: number
          slug: string
          stripe_url?: string | null
          style?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_days?: number | null
          features?: Json | null
          id?: string
          interval?: string | null
          is_active?: boolean | null
          name?: string
          price?: number
          slug?: string
          stripe_url?: string | null
          style?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_hours: Json | null
          business_type: string | null
          company_logo: string | null
          company_name: string | null
          created_at: string | null
          custom_domain: string | null
          custom_domain_status: string | null
          dns_records: Json | null
          email: string | null
          enable_cars: boolean | null
          enable_manual_vehicles: boolean | null
          enable_motorcycles: boolean | null
          full_name: string | null
          id: string
          monthly_leads_goal: number | null
          monthly_revenue_goal: number | null
          monthly_sales_goal: number | null
          monthly_visits_goal: number | null
          parent_id: string | null
          phone: string | null
          plan: string | null
          plan_status: string | null
          preset_messages: Json | null
          role: string | null
          trial_ends_at: string | null
          use_company_number: boolean | null
          webhook_url: string | null
          website_about_text: string | null
          website_active: boolean | null
          website_background_color: string | null
          website_bg_color2: string | null
          website_bg_gradient: boolean | null
          website_branding: Json | null
          website_business_hours: string | null
          website_card_style: string | null
          website_city: string | null
          website_contact: Json | null
          website_content: Json | null
          website_cta_text: string | null
          website_diff1_active: boolean | null
          website_diff1_icon: string | null
          website_diff1_sub: string | null
          website_diff1_subtitle: string | null
          website_diff1_title: string | null
          website_diff2_active: boolean | null
          website_diff2_icon: string | null
          website_diff2_sub: string | null
          website_diff2_subtitle: string | null
          website_diff2_title: string | null
          website_diff3_active: boolean | null
          website_diff3_icon: string | null
          website_diff3_sub: string | null
          website_diff3_subtitle: string | null
          website_diff3_title: string | null
          website_diff4_active: boolean | null
          website_diff4_icon: string | null
          website_diff4_sub: string | null
          website_diff4_title: string | null
          website_facebook: string | null
          website_google_maps: string | null
          website_hero_button_text: string | null
          website_hero_image: string | null
          website_hero_images: string[] | null
          website_hero_subtitle: string | null
          website_hero_text: string | null
          website_instagram: string | null
          website_optimization: Json | null
          website_primary_color: string | null
          website_privacy_policy: string | null
          website_secondary_color: string | null
          website_sections: Json | null
          website_show_filters: boolean | null
          website_show_sold: boolean | null
          website_slug: string | null
          website_terms_of_use: string | null
          website_text_color: string | null
          website_theme: string | null
          website_tiktok: string | null
          website_title_color: string | null
          website_typography: string | null
          website_use_gradient: boolean | null
          website_video_url: string | null
          website_whatsapp: string | null
          website_youtube: string | null
          whatsapp_webhook_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          business_hours?: Json | null
          business_type?: string | null
          company_logo?: string | null
          company_name?: string | null
          created_at?: string | null
          custom_domain?: string | null
          custom_domain_status?: string | null
          dns_records?: Json | null
          email?: string | null
          enable_cars?: boolean | null
          enable_manual_vehicles?: boolean | null
          enable_motorcycles?: boolean | null
          full_name?: string | null
          id: string
          monthly_leads_goal?: number | null
          monthly_revenue_goal?: number | null
          monthly_sales_goal?: number | null
          monthly_visits_goal?: number | null
          parent_id?: string | null
          phone?: string | null
          plan?: string | null
          plan_status?: string | null
          preset_messages?: Json | null
          role?: string | null
          trial_ends_at?: string | null
          use_company_number?: boolean | null
          webhook_url?: string | null
          website_about_text?: string | null
          website_active?: boolean | null
          website_background_color?: string | null
          website_bg_color2?: string | null
          website_bg_gradient?: boolean | null
          website_branding?: Json | null
          website_business_hours?: string | null
          website_card_style?: string | null
          website_city?: string | null
          website_contact?: Json | null
          website_content?: Json | null
          website_cta_text?: string | null
          website_diff1_active?: boolean | null
          website_diff1_icon?: string | null
          website_diff1_sub?: string | null
          website_diff1_subtitle?: string | null
          website_diff1_title?: string | null
          website_diff2_active?: boolean | null
          website_diff2_icon?: string | null
          website_diff2_sub?: string | null
          website_diff2_subtitle?: string | null
          website_diff2_title?: string | null
          website_diff3_active?: boolean | null
          website_diff3_icon?: string | null
          website_diff3_sub?: string | null
          website_diff3_subtitle?: string | null
          website_diff3_title?: string | null
          website_diff4_active?: boolean | null
          website_diff4_icon?: string | null
          website_diff4_sub?: string | null
          website_diff4_title?: string | null
          website_facebook?: string | null
          website_google_maps?: string | null
          website_hero_button_text?: string | null
          website_hero_image?: string | null
          website_hero_images?: string[] | null
          website_hero_subtitle?: string | null
          website_hero_text?: string | null
          website_instagram?: string | null
          website_optimization?: Json | null
          website_primary_color?: string | null
          website_privacy_policy?: string | null
          website_secondary_color?: string | null
          website_sections?: Json | null
          website_show_filters?: boolean | null
          website_show_sold?: boolean | null
          website_slug?: string | null
          website_terms_of_use?: string | null
          website_text_color?: string | null
          website_theme?: string | null
          website_tiktok?: string | null
          website_title_color?: string | null
          website_typography?: string | null
          website_use_gradient?: boolean | null
          website_video_url?: string | null
          website_whatsapp?: string | null
          website_youtube?: string | null
          whatsapp_webhook_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          business_hours?: Json | null
          business_type?: string | null
          company_logo?: string | null
          company_name?: string | null
          created_at?: string | null
          custom_domain?: string | null
          custom_domain_status?: string | null
          dns_records?: Json | null
          email?: string | null
          enable_cars?: boolean | null
          enable_manual_vehicles?: boolean | null
          enable_motorcycles?: boolean | null
          full_name?: string | null
          id?: string
          monthly_leads_goal?: number | null
          monthly_revenue_goal?: number | null
          monthly_sales_goal?: number | null
          monthly_visits_goal?: number | null
          parent_id?: string | null
          phone?: string | null
          plan?: string | null
          plan_status?: string | null
          preset_messages?: Json | null
          role?: string | null
          trial_ends_at?: string | null
          use_company_number?: boolean | null
          webhook_url?: string | null
          website_about_text?: string | null
          website_active?: boolean | null
          website_background_color?: string | null
          website_bg_color2?: string | null
          website_bg_gradient?: boolean | null
          website_branding?: Json | null
          website_business_hours?: string | null
          website_card_style?: string | null
          website_city?: string | null
          website_contact?: Json | null
          website_content?: Json | null
          website_cta_text?: string | null
          website_diff1_active?: boolean | null
          website_diff1_icon?: string | null
          website_diff1_sub?: string | null
          website_diff1_subtitle?: string | null
          website_diff1_title?: string | null
          website_diff2_active?: boolean | null
          website_diff2_icon?: string | null
          website_diff2_sub?: string | null
          website_diff2_subtitle?: string | null
          website_diff2_title?: string | null
          website_diff3_active?: boolean | null
          website_diff3_icon?: string | null
          website_diff3_sub?: string | null
          website_diff3_subtitle?: string | null
          website_diff3_title?: string | null
          website_diff4_active?: boolean | null
          website_diff4_icon?: string | null
          website_diff4_sub?: string | null
          website_diff4_title?: string | null
          website_facebook?: string | null
          website_google_maps?: string | null
          website_hero_button_text?: string | null
          website_hero_image?: string | null
          website_hero_images?: string[] | null
          website_hero_subtitle?: string | null
          website_hero_text?: string | null
          website_instagram?: string | null
          website_optimization?: Json | null
          website_primary_color?: string | null
          website_privacy_policy?: string | null
          website_secondary_color?: string | null
          website_sections?: Json | null
          website_show_filters?: boolean | null
          website_show_sold?: boolean | null
          website_slug?: string | null
          website_terms_of_use?: string | null
          website_text_color?: string | null
          website_theme?: string | null
          website_tiktok?: string | null
          website_title_color?: string | null
          website_typography?: string | null
          website_use_gradient?: boolean | null
          website_video_url?: string | null
          website_whatsapp?: string | null
          website_youtube?: string | null
          whatsapp_webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          attachments: string[] | null
          category: string | null
          created_at: string | null
          description: string
          id: string
          priority: string | null
          status: string | null
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attachments?: string[] | null
          category?: string | null
          created_at?: string | null
          description: string
          id?: string
          priority?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attachments?: string[] | null
          category?: string | null
          created_at?: string | null
          description?: string
          id?: string
          priority?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string | null
          key: string
          value: string | null
        }
        Insert: {
          created_at?: string | null
          key: string
          value?: string | null
        }
        Update: {
          created_at?: string | null
          key?: string
          value?: string | null
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          attachments: string[] | null
          created_at: string | null
          id: string
          message: string
          sender_id: string
          sender_role: string | null
          ticket_id: string
        }
        Insert: {
          attachments?: string[] | null
          created_at?: string | null
          id?: string
          message: string
          sender_id: string
          sender_role?: string | null
          ticket_id: string
        }
        Update: {
          attachments?: string[] | null
          created_at?: string | null
          id?: string
          message?: string
          sender_id?: string
          sender_role?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          admin_id: string | null
          brand: string
          chassis: string | null
          color: string
          created_at: string | null
          description: string | null
          doors: number | null
          engine: string
          fipe_price: number | null
          fuel_type: string | null
          gallery_images: string[] | null
          has_owner_manual: boolean | null
          has_spare_key: boolean | null
          has_warranty: boolean | null
          id: string
          image_url: string | null
          is_ipva_paid: boolean | null
          is_service_history_complete: boolean | null
          is_single_owner: boolean | null
          mileage: number
          model: string
          model_year: number | null
          optionals: string[] | null
          plate: string | null
          price: number
          sale_details: Json | null
          sale_phase: string | null
          short_description: string | null
          show_on_website: boolean
          status: string | null
          transmission: string
          type: string
          user_id: string | null
          year: number
        }
        Insert: {
          admin_id?: string | null
          brand: string
          chassis?: string | null
          color: string
          created_at?: string | null
          description?: string | null
          doors?: number | null
          engine: string
          fipe_price?: number | null
          fuel_type?: string | null
          gallery_images?: string[] | null
          has_owner_manual?: boolean | null
          has_spare_key?: boolean | null
          has_warranty?: boolean | null
          id?: string
          image_url?: string | null
          is_ipva_paid?: boolean | null
          is_service_history_complete?: boolean | null
          is_single_owner?: boolean | null
          mileage?: number
          model: string
          model_year?: number | null
          optionals?: string[] | null
          plate?: string | null
          price?: number
          sale_details?: Json | null
          sale_phase?: string | null
          short_description?: string | null
          show_on_website?: boolean
          status?: string | null
          transmission: string
          type: string
          user_id?: string | null
          year: number
        }
        Update: {
          admin_id?: string | null
          brand?: string
          chassis?: string | null
          color?: string
          created_at?: string | null
          description?: string | null
          doors?: number | null
          engine?: string
          fipe_price?: number | null
          fuel_type?: string | null
          gallery_images?: string[] | null
          has_owner_manual?: boolean | null
          has_spare_key?: boolean | null
          has_warranty?: boolean | null
          id?: string
          image_url?: string | null
          is_ipva_paid?: boolean | null
          is_service_history_complete?: boolean | null
          is_single_owner?: boolean | null
          mileage?: number
          model?: string
          model_year?: number | null
          optionals?: string[] | null
          plate?: string | null
          price?: number
          sale_details?: Json | null
          sale_phase?: string | null
          short_description?: string | null
          show_on_website?: boolean
          status?: string | null
          transmission?: string
          type?: string
          user_id?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_update_user_password: {
        Args: { new_password: string; target_user_id: string }
        Returns: boolean
      }
      append_lead_interaction: {
        Args: { p_interaction: Json; p_lead_id: string }
        Returns: {
          admin_id: string | null
          carro_motorizacao: string[] | null
          carro_transmissao: string[] | null
          carro_valor_max: number | null
          carro_valor_min: number | null
          carro_valormax: number | null
          created_at: string | null
          delivery_date: string | null
          disqualification_notes: string | null
          disqualification_reasons: string[] | null
          email: string | null
          follow_up_data: Json | null
          foto_url: string | null
          funnel_history: Json | null
          guarantee_ends_at: string | null
          guarantee_id: string | null
          id: string
          interaction_history: Json | null
          interesse_carro: boolean | null
          interesse_moto: boolean | null
          last_update: string | null
          marcas: string[] | null
          marcas_moto: string[] | null
          marketing_metadata: Json | null
          modelos: string[] | null
          modelos_moto: string[] | null
          moto__valormax: number | null
          moto_motorizacao: string[] | null
          moto_transmissao: string[] | null
          moto_valor_max: number | null
          moto_valor_min: number | null
          motorizacao: string[] | null
          name: string
          notes: string | null
          observacoes_adicionais: string | null
          phase: string
          phone: string | null
          possui_entrada: boolean | null
          possui_troca: boolean | null
          post_sale_notes: string | null
          presented_vehicles: string[] | null
          sale_date: string | null
          sale_status: string | null
          scheduling_data: Json | null
          simulation_data: Json | null
          source: string | null
          tags: string[] | null
          temperature: string
          tipos_moto: string[] | null
          tipos_veiculo: string[] | null
          transmissao: string[] | null
          user_id: string | null
          valor_entrada: number | null
          valor_maximo: number | null
          valor_minimo: number | null
          veiculo_troca: string | null
          visit_date: string | null
          visit_status: string | null
        }
        SetofOptions: {
          from: "*"
          to: "leads"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      check_has_admins: { Args: never; Returns: boolean }
      claim_first_admin: { Args: never; Returns: boolean }
      create_vehicle_v4: {
        Args: {
          p_brand: string
          p_color: string
          p_engine: string
          p_has_warranty: boolean
          p_image_url: string
          p_is_ipva_paid: boolean
          p_is_service_history_complete: boolean
          p_is_single_owner: boolean
          p_mileage: number
          p_model: string
          p_model_year: number
          p_optionals: string[]
          p_price: number
          p_status: string
          p_transmission: string
          p_type: string
          p_year: number
        }
        Returns: Json
      }
      get_my_parent_id: { Args: never; Returns: string }
      is_current_user_admin: { Args: never; Returns: boolean }
      is_empresa_of: { Args: { target_admin_id: string }; Returns: boolean }
      is_vendedor_of: { Args: { target_admin_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
