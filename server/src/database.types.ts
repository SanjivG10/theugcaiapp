export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4";
  };
  public: {
    Tables: {
      asset_files: {
        Row: {
          alt_text: string | null;
          business_id: string | null;
          created_at: string | null;
          download_count: number | null;
          file_size: number;
          file_type: string;
          folder_id: string | null;
          generation_model: string | null;
          generation_prompt: string | null;
          generation_settings: Json | null;
          height: number | null;
          id: string;
          is_generated: boolean | null;
          last_accessed_at: string | null;
          metadata: Json | null;
          name: string;
          original_name: string;
          storage_path: string;
          storage_url: string;
          tags: string[] | null;
          thumbnail_url: string | null;
          updated_at: string | null;
          user_id: string;
          width: number | null;
        };
        Insert: {
          alt_text?: string | null;
          business_id?: string | null;
          created_at?: string | null;
          download_count?: number | null;
          file_size: number;
          file_type: string;
          folder_id?: string | null;
          generation_model?: string | null;
          generation_prompt?: string | null;
          generation_settings?: Json | null;
          height?: number | null;
          id?: string;
          is_generated?: boolean | null;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name: string;
          original_name: string;
          storage_path: string;
          storage_url: string;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          updated_at?: string | null;
          user_id: string;
          width?: number | null;
        };
        Update: {
          alt_text?: string | null;
          business_id?: string | null;
          created_at?: string | null;
          download_count?: number | null;
          file_size?: number;
          file_type?: string;
          folder_id?: string | null;
          generation_model?: string | null;
          generation_prompt?: string | null;
          generation_settings?: Json | null;
          height?: number | null;
          id?: string;
          is_generated?: boolean | null;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string;
          original_name?: string;
          storage_path?: string;
          storage_url?: string;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          updated_at?: string | null;
          user_id?: string;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "asset_files_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "asset_files_folder_id_fkey";
            columns: ["folder_id"];
            isOneToOne: false;
            referencedRelation: "asset_folders";
            referencedColumns: ["id"];
          }
        ];
      };
      asset_folders: {
        Row: {
          business_id: string | null;
          color: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          name: string;
          parent_folder_id: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          business_id?: string | null;
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          parent_folder_id?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          business_id?: string | null;
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          parent_folder_id?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "asset_folders_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "asset_folders_parent_folder_id_fkey";
            columns: ["parent_folder_id"];
            isOneToOne: false;
            referencedRelation: "asset_folders";
            referencedColumns: ["id"];
          }
        ];
      };
      business_users: {
        Row: {
          business_id: string;
          created_at: string | null;
          id: string;
          invited_at: string | null;
          invited_by: string | null;
          joined_at: string | null;
          permissions: Json | null;
          role: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          business_id: string;
          created_at?: string | null;
          id?: string;
          invited_at?: string | null;
          invited_by?: string | null;
          joined_at?: string | null;
          permissions?: Json | null;
          role?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          business_id?: string;
          created_at?: string | null;
          id?: string;
          invited_at?: string | null;
          invited_by?: string | null;
          joined_at?: string | null;
          permissions?: Json | null;
          role?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_users_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "business_users_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "business_users_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      businesses: {
        Row: {
          business_address: Json | null;
          business_name: string;
          business_phone: string | null;
          business_size: string | null;
          business_type: string | null;
          created_at: string | null;
          credits: number | null;
          how_heard_about_us: string | null;
          id: string;
          industry: string | null;
          is_active: boolean | null;
          onboarding_completed: boolean | null;
          onboarding_step: number | null;
          referral_source: string | null;
          social_media_urls: Json | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_expires_at: string | null;
          subscription_plan: string | null;
          subscription_started_at: string | null;
          subscription_status: string | null;
          updated_at: string | null;
          user_id: string;
          website_url: string | null;
        };
        Insert: {
          business_address?: Json | null;
          business_name: string;
          business_phone?: string | null;
          business_size?: string | null;
          business_type?: string | null;
          created_at?: string | null;
          credits?: number | null;
          how_heard_about_us?: string | null;
          id?: string;
          industry?: string | null;
          is_active?: boolean | null;
          onboarding_completed?: boolean | null;
          onboarding_step?: number | null;
          referral_source?: string | null;
          social_media_urls?: Json | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_expires_at?: string | null;
          subscription_plan?: string | null;
          subscription_started_at?: string | null;
          subscription_status?: string | null;
          updated_at?: string | null;
          user_id: string;
          website_url?: string | null;
        };
        Update: {
          business_address?: Json | null;
          business_name?: string;
          business_phone?: string | null;
          business_size?: string | null;
          business_type?: string | null;
          created_at?: string | null;
          credits?: number | null;
          how_heard_about_us?: string | null;
          id?: string;
          industry?: string | null;
          is_active?: boolean | null;
          onboarding_completed?: boolean | null;
          onboarding_step?: number | null;
          referral_source?: string | null;
          social_media_urls?: Json | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_expires_at?: string | null;
          subscription_plan?: string | null;
          subscription_started_at?: string | null;
          subscription_status?: string | null;
          updated_at?: string | null;
          user_id?: string;
          website_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "businesses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      campaigns: {
        Row: {
          business_id: string | null;
          created_at: string | null;
          credits_used: number | null;
          current_step: number | null;
          description: string | null;
          final_url: string | null;
          id: string;
          name: string;
          scene_data: Json | null;
          scene_number: number;
          script: Json | null;
          status: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          business_id?: string | null;
          created_at?: string | null;
          credits_used?: number | null;
          current_step?: number | null;
          description?: string | null;
          final_url?: string | null;
          id?: string;
          name: string;
          scene_data?: Json | null;
          scene_number?: number;
          script?: Json | null;
          status?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          business_id?: string | null;
          created_at?: string | null;
          credits_used?: number | null;
          current_step?: number | null;
          description?: string | null;
          final_url?: string | null;
          id?: string;
          name?: string;
          scene_data?: Json | null;
          scenes_number?: number;
          script?: Json | null;
          status?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "campaigns_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          }
        ];
      };
      credit_transactions: {
        Row: {
          amount: number;
          balance_after: number;
          business_id: string;
          created_at: string | null;
          description: string | null;
          id: string;
          metadata: Json | null;
          stripe_payment_intent_id: string | null;
          transaction_type: string;
          updated_at: string | null;
        };
        Insert: {
          amount: number;
          balance_after: number;
          business_id: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          stripe_payment_intent_id?: string | null;
          transaction_type: string;
          updated_at?: string | null;
        };
        Update: {
          amount?: number;
          balance_after?: number;
          business_id?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          stripe_payment_intent_id?: string | null;
          transaction_type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "credit_transactions_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          }
        ];
      };
      credit_usage_logs: {
        Row: {
          action_type: string;
          business_id: string;
          campaign_id: string | null;
          created_at: string | null;
          credits_used: number;
          feature_used: string | null;
          id: string;
          user_id: string;
        };
        Insert: {
          action_type: string;
          business_id: string;
          campaign_id?: string | null;
          created_at?: string | null;
          credits_used: number;
          feature_used?: string | null;
          id?: string;
          user_id: string;
        };
        Update: {
          action_type?: string;
          business_id?: string;
          campaign_id?: string | null;
          created_at?: string | null;
          credits_used?: number;
          feature_used?: string | null;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_usage_logs_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_usage_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      feedback: {
        Row: {
          business_id: string | null;
          created_at: string | null;
          email: string;
          feedback_type: string;
          id: string;
          message: string;
          name: string;
          priority: string | null;
          status: string | null;
          subject: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          business_id?: string | null;
          created_at?: string | null;
          email: string;
          feedback_type: string;
          id?: string;
          message: string;
          name: string;
          priority?: string | null;
          status?: string | null;
          subject: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          business_id?: string | null;
          created_at?: string | null;
          email?: string;
          feedback_type?: string;
          id?: string;
          message?: string;
          name?: string;
          priority?: string | null;
          status?: string | null;
          subject?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "feedback_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          }
        ];
      };
      subscription_history: {
        Row: {
          business_id: string;
          change_reason: string | null;
          created_at: string | null;
          effective_date: string | null;
          id: string;
          new_plan: string;
          old_plan: string | null;
          stripe_subscription_id: string | null;
        };
        Insert: {
          business_id: string;
          change_reason?: string | null;
          created_at?: string | null;
          effective_date?: string | null;
          id?: string;
          new_plan: string;
          old_plan?: string | null;
          stripe_subscription_id?: string | null;
        };
        Update: {
          business_id?: string;
          change_reason?: string | null;
          created_at?: string | null;
          effective_date?: string | null;
          id?: string;
          new_plan?: string;
          old_plan?: string | null;
          stripe_subscription_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "subscription_history_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          }
        ];
      };
      subscriptions: {
        Row: {
          business_id: string | null;
          cancelled_at: string | null;
          created_at: string | null;
          current_period_end: string | null;
          current_period_start: string | null;
          id: string;
          monthly_video_credits: number | null;
          plan_name: string;
          status: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          trial_end: string | null;
          updated_at: string | null;
          used_video_credits: number | null;
          user_id: string;
        };
        Insert: {
          business_id?: string | null;
          cancelled_at?: string | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          monthly_video_credits?: number | null;
          plan_name: string;
          status: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_end?: string | null;
          updated_at?: string | null;
          used_video_credits?: number | null;
          user_id: string;
        };
        Update: {
          business_id?: string | null;
          cancelled_at?: string | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          monthly_video_credits?: number | null;
          plan_name?: string;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_end?: string | null;
          updated_at?: string | null;
          used_video_credits?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      templates: {
        Row: {
          category: string | null;
          created_at: string | null;
          default_params: Json | null;
          description: string | null;
          id: string;
          industry: string[] | null;
          is_active: boolean | null;
          is_premium: boolean | null;
          name: string;
          popularity_score: number | null;
          preview_video_url: string | null;
          prompt_template: string;
          thumbnail_url: string | null;
          updated_at: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          default_params?: Json | null;
          description?: string | null;
          id?: string;
          industry?: string[] | null;
          is_active?: boolean | null;
          is_premium?: boolean | null;
          name: string;
          popularity_score?: number | null;
          preview_video_url?: string | null;
          prompt_template: string;
          thumbnail_url?: string | null;
          updated_at?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          default_params?: Json | null;
          description?: string | null;
          id?: string;
          industry?: string[] | null;
          is_active?: boolean | null;
          is_premium?: boolean | null;
          name?: string;
          popularity_score?: number | null;
          preview_video_url?: string | null;
          prompt_template?: string;
          thumbnail_url?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      usage_logs: {
        Row: {
          action: string;
          business_id: string | null;
          created_at: string | null;
          id: string;
          metadata: Json | null;
          resource_id: string | null;
          resource_type: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          business_id?: string | null;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          resource_id?: string | null;
          resource_type?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          business_id?: string | null;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          resource_id?: string | null;
          resource_type?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "usage_logs_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "usage_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      users: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          email: string;
          email_verified: boolean | null;
          first_name: string | null;
          id: string;
          last_name: string | null;
          last_sign_in_at: string | null;
          onboarding_completed: boolean | null;
          phone: string | null;
          role: string | null;
          stripe_customer_id: string | null;
          subscription_status: string | null;
          trial_ends_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          email: string;
          email_verified?: boolean | null;
          first_name?: string | null;
          id: string;
          last_name?: string | null;
          last_sign_in_at?: string | null;
          onboarding_completed?: boolean | null;
          phone?: string | null;
          role?: string | null;
          stripe_customer_id?: string | null;
          subscription_status?: string | null;
          trial_ends_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          email?: string;
          email_verified?: boolean | null;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          last_sign_in_at?: string | null;
          onboarding_completed?: boolean | null;
          phone?: string | null;
          role?: string | null;
          stripe_customer_id?: string | null;
          subscription_status?: string | null;
          trial_ends_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      video_projects: {
        Row: {
          ai_provider: string | null;
          business_id: string | null;
          created_at: string | null;
          description: string | null;
          download_count: number | null;
          duration: number | null;
          generation_cost: number | null;
          generation_params: Json | null;
          id: string;
          prompt: string | null;
          status: string | null;
          template_id: string | null;
          thumbnail_url: string | null;
          title: string;
          updated_at: string | null;
          user_id: string;
          video_url: string | null;
          view_count: number | null;
        };
        Insert: {
          ai_provider?: string | null;
          business_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          download_count?: number | null;
          duration?: number | null;
          generation_cost?: number | null;
          generation_params?: Json | null;
          id?: string;
          prompt?: string | null;
          status?: string | null;
          template_id?: string | null;
          thumbnail_url?: string | null;
          title: string;
          updated_at?: string | null;
          user_id: string;
          video_url?: string | null;
          view_count?: number | null;
        };
        Update: {
          ai_provider?: string | null;
          business_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          download_count?: number | null;
          duration?: number | null;
          generation_cost?: number | null;
          generation_params?: Json | null;
          id?: string;
          prompt?: string | null;
          status?: string | null;
          template_id?: string | null;
          thumbnail_url?: string | null;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
          video_url?: string | null;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "video_projects_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "video_projects_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_user_generate_video: {
        Args: { user_uuid: string };
        Returns: boolean;
      };
      get_user_subscription_info: {
        Args: { user_uuid: string };
        Returns: {
          monthly_credits: number;
          plan_name: string;
          remaining_credits: number;
          status: string;
          used_credits: number;
        }[];
      };
      increment_download_count: {
        Args: { file_uuid: string };
        Returns: undefined;
      };
      update_business_credits: {
        Args: {
          p_amount: number;
          p_business_id: string;
          p_description?: string;
          p_metadata?: Json;
          p_stripe_payment_intent_id?: string;
          p_transaction_type: string;
        };
        Returns: number;
      };
      update_campaign_status: {
        Args: {
          p_campaign_id: string;
          p_credits_used?: number;
          p_output_urls?: string[];
          p_status: string;
          p_thumbnail_url?: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
