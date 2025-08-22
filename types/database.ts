// Database types based on Supabase schema
// This file provides type-safe access to database entities

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============================================================================
// CORE DATABASE TYPES
// ============================================================================

// User entity
export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  phone?: string;
  role?: string;
  email_verified?: boolean;
  onboarding_completed?: boolean;
  subscription_status?: string;
  trial_ends_at?: string;
  created_at?: string;
  updated_at?: string;
  last_sign_in_at?: string;
}

// Business entity
export interface Business {
  id: string;
  business_name: string;
  business_phone?: string;
  business_size?: string;
  business_type?: string;
  industry?: string;
  website_url?: string;
  business_address?: Json;
  social_media_urls?: Json;
  how_heard_about_us?: string;
  referral_source?: string;
  credits?: number;
  is_active?: boolean;
  onboarding_completed?: boolean;
  onboarding_step?: number;
  subscription_plan?: string;
  subscription_status?: string;
  subscription_started_at?: string;
  subscription_expires_at?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

// Business User relationship
export interface BusinessUser {
  id: string;
  business_id: string;
  user_id: string;
  role?: string;
  permissions?: Json;
  invited_at?: string;
  invited_by?: string;
  joined_at?: string;
  created_at?: string;
  updated_at?: string;
}

// Campaign entity
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  campaign_type?: string;
  prompt?: string;
  status?: "draft" | "in_progress" | "completed" | "failed" | "cancelled";
  current_step?: number;
  total_steps?: number;
  step_data?: Json;
  settings?: Json;
  metadata?: Json;
  estimated_credits?: number;
  credits_used?: number;
  output_urls?: string[];
  thumbnail_url?: string;
  is_template?: boolean;
  started_at?: string;
  completed_at?: string;
  business_id: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

// Credit Transaction entity
export interface CreditTransaction {
  id: string;
  amount: number;
  balance_after: number;
  business_id: string;
  transaction_type:
    | "purchase"
    | "usage"
    | "refund"
    | "monthly_allocation"
    | "bonus";
  description?: string;
  metadata?: Json;
  stripe_payment_intent_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Credit Usage Log entity
export interface CreditUsageLog {
  id: string;
  action_type: string;
  credits_used: number;
  feature_used?: string;
  campaign_id?: string;
  business_id: string;
  user_id: string;
  created_at?: string;
}

// Feedback entity
export interface Feedback {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  feedback_type:
    | "bug_report"
    | "feature_request"
    | "general_feedback"
    | "support_request";
  priority?: "low" | "medium" | "high" | "urgent";
  status?: string;
  business_id?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Subscription entity
export interface Subscription {
  id: string;
  plan_name: string;
  status: string;
  monthly_video_credits?: number;
  used_video_credits?: number;
  current_period_start?: string;
  current_period_end?: string;
  trial_end?: string;
  cancelled_at?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  business_id?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

// Subscription History entity
export interface SubscriptionHistory {
  id: string;
  business_id: string;
  old_plan?: string;
  new_plan: string;
  change_reason?: string;
  effective_date?: string;
  stripe_subscription_id?: string;
  created_at?: string;
}

// Template entity
export interface Template {
  id: string;
  name: string;
  description?: string;
  category?: string;
  prompt_template: string;
  default_params?: Json;
  industry?: string[];
  is_active?: boolean;
  is_premium?: boolean;
  popularity_score?: number;
  preview_video_url?: string;
  thumbnail_url?: string;
  created_at?: string;
  updated_at?: string;
}

// Usage Log entity
export interface UsageLog {
  id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  metadata?: Json;
  business_id?: string;
  user_id?: string;
  created_at?: string;
}

// Video Project entity
export interface VideoProject {
  id: string;
  title: string;
  description?: string;
  prompt?: string;
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  generation_params?: Json;
  generation_cost?: number;
  status?: string;
  download_count?: number;
  view_count?: number;
  ai_provider?: string;
  template_id?: string;
  business_id?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// INSERT TYPES (for creating new records)
// ============================================================================

export interface UserInsert {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  phone?: string;
  role?: string;
  email_verified?: boolean;
  onboarding_completed?: boolean;
  subscription_status?: string;
  trial_ends_at?: string;
}

export interface BusinessInsert {
  business_name: string;
  business_phone?: string;
  business_size?: string;
  business_type?: string;
  industry?: string;
  website_url?: string;
  business_address?: Json;
  social_media_urls?: Json;
  how_heard_about_us?: string;
  referral_source?: string;
  credits?: number;
  is_active?: boolean;
  onboarding_completed?: boolean;
  onboarding_step?: number;
  subscription_plan?: string;
  subscription_status?: string;
  subscription_started_at?: string;
  subscription_expires_at?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  user_id: string;
}

export interface CampaignInsert {
  name: string;
  description?: string;
  campaign_type?: string;
  prompt?: string;
  status?: "draft" | "in_progress" | "completed" | "failed" | "cancelled";
  current_step?: number;
  total_steps?: number;
  step_data?: Json;
  settings?: Json;
  metadata?: Json;
  estimated_credits?: number;
  credits_used?: number;
  output_urls?: string[];
  thumbnail_url?: string;
  is_template?: boolean;
  started_at?: string;
  completed_at?: string;
  business_id: string;
  user_id: string;
}

export interface CreditTransactionInsert {
  amount: number;
  balance_after: number;
  business_id: string;
  transaction_type:
    | "purchase"
    | "usage"
    | "refund"
    | "monthly_allocation"
    | "bonus";
  description?: string;
  metadata?: Json;
  stripe_payment_intent_id?: string;
}

export interface CreditUsageLogInsert {
  action_type: string;
  credits_used: number;
  feature_used?: string;
  campaign_id?: string;
  business_id: string;
  user_id: string;
}

export interface FeedbackInsert {
  name: string;
  email: string;
  subject: string;
  message: string;
  feedback_type:
    | "bug_report"
    | "feature_request"
    | "general_feedback"
    | "support_request";
  priority?: "low" | "medium" | "high" | "urgent";
  status?: string;
  business_id?: string;
  user_id?: string;
}

export interface SubscriptionInsert {
  plan_name: string;
  status: string;
  monthly_video_credits?: number;
  used_video_credits?: number;
  current_period_start?: string;
  current_period_end?: string;
  trial_end?: string;
  cancelled_at?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  business_id?: string;
  user_id: string;
}

export interface TemplateInsert {
  name: string;
  description?: string;
  category?: string;
  prompt_template: string;
  default_params?: Json;
  industry?: string[];
  is_active?: boolean;
  is_premium?: boolean;
  popularity_score?: number;
  preview_video_url?: string;
  thumbnail_url?: string;
}

export interface VideoProjectInsert {
  title: string;
  description?: string;
  prompt?: string;
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  generation_params?: Json;
  generation_cost?: number;
  status?: string;
  download_count?: number;
  view_count?: number;
  ai_provider?: string;
  template_id?: string;
  business_id?: string;
  user_id: string;
}

// ============================================================================
// UPDATE TYPES (for updating existing records)
// ============================================================================

export interface UserUpdate {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  phone?: string;
  role?: string;
  email_verified?: boolean;
  onboarding_completed?: boolean;
  subscription_status?: string;
  trial_ends_at?: string;
}

export interface BusinessUpdate {
  business_name?: string;
  business_phone?: string;
  business_size?: string;
  business_type?: string;
  industry?: string;
  website_url?: string;
  business_address?: Json;
  social_media_urls?: Json;
  how_heard_about_us?: string;
  referral_source?: string;
  credits?: number;
  is_active?: boolean;
  onboarding_completed?: boolean;
  onboarding_step?: number;
  subscription_plan?: string;
  subscription_status?: string;
  subscription_started_at?: string;
  subscription_expires_at?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

export interface CampaignUpdate {
  name?: string;
  description?: string;
  campaign_type?: string;
  prompt?: string;
  status?: "draft" | "in_progress" | "completed" | "failed" | "cancelled";
  current_step?: number;
  total_steps?: number;
  step_data?: Json;
  settings?: Json;
  metadata?: Json;
  estimated_credits?: number;
  credits_used?: number;
  output_urls?: string[];
  thumbnail_url?: string;
  is_template?: boolean;
  started_at?: string;
  completed_at?: string;
}

// ============================================================================
// RELATIONSHIP TYPES
// ============================================================================

export interface UserWithBusiness extends User {
  business?: Business;
}

export interface BusinessWithUsers extends Business {
  users?: BusinessUser[];
}

export interface CampaignWithDetails extends Campaign {
  business?: Business;
  user?: User;
}

export interface UserWithSubscriptions extends User {
  subscriptions?: Subscription[];
}

export interface BusinessWithTransactions extends Business {
  credit_transactions?: CreditTransaction[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type EntityId = string;

export type Timestamp = string;

export type Status =
  | "active"
  | "inactive"
  | "pending"
  | "completed"
  | "failed"
  | "cancelled";

export type Role = "user" | "admin" | "business_owner" | "team_member";

export type Priority = "low" | "medium" | "high" | "urgent";

export type FeedbackType =
  | "bug_report"
  | "feature_request"
  | "general_feedback"
  | "support_request";

export type TransactionType =
  | "purchase"
  | "usage"
  | "refund"
  | "monthly_allocation"
  | "bonus";

export type CampaignStatus =
  | "draft"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled";

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "unpaid"
  | "trialing";

// ============================================================================
// QUERY TYPES
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface FilterParams {
  status?: string;
  type?: string;
  date_from?: string;
  date_to?: string;
  user_id?: string;
  business_id?: string;
}

export interface QueryParams
  extends PaginationParams,
    SortParams,
    FilterParams {}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// ============================================================================
// DATABASE CONSTRAINTS
// ============================================================================

export const DATABASE_CONSTRAINTS = {
  MAX_STRING_LENGTH: 255,
  MAX_TEXT_LENGTH: 10000,
  MAX_JSON_SIZE: 1000000,
  MIN_CREDITS: 0,
  MAX_CREDITS: 999999,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  VALID_EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// ============================================================================
// DATABASE INDEXES
// ============================================================================

export const DATABASE_INDEXES = {
  USERS_EMAIL: "users_email_idx",
  USERS_ROLE: "users_role_idx",
  BUSINESSES_USER_ID: "businesses_user_id_idx",
  BUSINESSES_STRIPE_CUSTOMER: "businesses_stripe_customer_idx",
  CAMPAIGNS_BUSINESS_ID: "campaigns_business_id_idx",
  CAMPAIGNS_USER_ID: "campaigns_user_id_idx",
  CAMPAIGNS_STATUS: "campaigns_status_idx",
  CREDIT_TRANSACTIONS_BUSINESS_ID: "credit_transactions_business_id_idx",
  CREDIT_TRANSACTIONS_TYPE: "credit_transactions_type_idx",
  FEEDBACK_EMAIL: "feedback_email_idx",
  FEEDBACK_TYPE: "feedback_type_idx",
  SUBSCRIPTIONS_USER_ID: "subscriptions_user_id_idx",
  SUBSCRIPTIONS_STATUS: "subscriptions_status_idx",
  VIDEO_PROJECTS_USER_ID: "video_projects_user_id_idx",
  VIDEO_PROJECTS_BUSINESS_ID: "video_projects_business_id_idx",
} as const;
