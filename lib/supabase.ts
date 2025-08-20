import { createClient } from '@supabase/supabase-js';
import { ENVS } from '@/constants/envs';

if (!ENVS.SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!ENVS.SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// Create Supabase client for frontend use
export const supabase = createClient(ENVS.SUPABASE_URL, ENVS.SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Database types (you can generate these from Supabase CLI)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          first_name?: string;
          last_name?: string;
          avatar_url?: string;
          phone?: string;
          role: 'user' | 'admin' | 'business_owner';
          email_verified: boolean;
          onboarding_completed: boolean;
          subscription_status: 'trial' | 'active' | 'cancelled' | 'expired';
          trial_ends_at?: string;
          last_sign_in_at?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string;
          last_name?: string;
          avatar_url?: string;
          phone?: string;
          role?: 'user' | 'admin' | 'business_owner';
          email_verified?: boolean;
          onboarding_completed?: boolean;
          subscription_status?: 'trial' | 'active' | 'cancelled' | 'expired';
          trial_ends_at?: string;
          last_sign_in_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          avatar_url?: string;
          phone?: string;
          role?: 'user' | 'admin' | 'business_owner';
          email_verified?: boolean;
          onboarding_completed?: boolean;
          subscription_status?: 'trial' | 'active' | 'cancelled' | 'expired';
          trial_ends_at?: string;
          last_sign_in_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      businesses: {
        Row: {
          id: string;
          user_id: string;
          business_name: string;
          business_type: string;
          industry?: string;
          business_size: string;
          website_url?: string;
          business_phone?: string;
          business_address?: any;
          social_media_urls?: any;
          how_heard_about_us: string;
          referral_source?: string;
          current_video_usage: string;
          video_tools_used?: string[];
          monthly_video_budget: string;
          primary_use_case: string;
          video_goals?: string[];
          target_audience?: string;
          monthly_revenue_range?: string;
          team_size_marketing?: number;
          preferred_video_style: string;
          video_length_preference: string;
          onboarding_step: number;
          onboarding_completed: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_name: string;
          business_type: string;
          industry?: string;
          business_size: string;
          website_url?: string;
          business_phone?: string;
          business_address?: any;
          social_media_urls?: any;
          how_heard_about_us: string;
          referral_source?: string;
          current_video_usage: string;
          video_tools_used?: string[];
          monthly_video_budget: string;
          primary_use_case: string;
          video_goals?: string[];
          target_audience?: string;
          monthly_revenue_range?: string;
          team_size_marketing?: number;
          preferred_video_style: string;
          video_length_preference: string;
          onboarding_step?: number;
          onboarding_completed?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_name?: string;
          business_type?: string;
          industry?: string;
          business_size?: string;
          website_url?: string;
          business_phone?: string;
          business_address?: any;
          social_media_urls?: any;
          how_heard_about_us?: string;
          referral_source?: string;
          current_video_usage?: string;
          video_tools_used?: string[];
          monthly_video_budget?: string;
          primary_use_case?: string;
          video_goals?: string[];
          target_audience?: string;
          monthly_revenue_range?: string;
          team_size_marketing?: number;
          preferred_video_style?: string;
          video_length_preference?: string;
          onboarding_step?: number;
          onboarding_completed?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}