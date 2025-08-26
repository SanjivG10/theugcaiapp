// API Types based on server endpoints and database schema
// These types are designed to work with the Supabase database types

import { SceneScript } from "@/contexts/CampaignContext";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Base API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// ============================================================================
// AUTH ENDPOINTS
// ============================================================================

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  access_token?: string;
  refresh_token?: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ResetPasswordRequest {
  access_token: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

// ============================================================================
// USER ENDPOINTS
// ============================================================================

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

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
}

export interface DashboardData {
  user: User;
  business: Business | null;
  onboarding: OnboardingProgress;
  stats: {
    recent_videos: VideoProject[];
    monthly_usage: number;
    videos_generated: number;
  };
}

export interface SubscriptionData {
  id: string;
  plan_name: string;
  status: string;
  monthly_video_credits: number;
  used_video_credits: number;
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  cancelled_at?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

export interface UpdateSubscriptionRequest {
  plan_id?: string;
  billing_cycle?: "monthly" | "yearly";
  auto_renew?: boolean;
}

// ============================================================================
// BUSINESS ENDPOINTS
// ============================================================================

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

export interface BusinessOnboardingData {
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
}

export interface OnboardingProgress {
  completed: boolean;
  current_step: number;
  total_steps: number;
  steps: {
    [key: number]: {
      completed: boolean;
      data?: Json;
    };
  };
}

export interface OnboardingStepData {
  [key: string]: Json;
}

// ============================================================================
// CREDITS ENDPOINTS
// ============================================================================

export interface CreditBalance {
  credits: number;
  subscription_plan: string;
  subscription_status: string;
  subscription_expires_at: string | null;
}

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

export interface CreditHistoryResponse {
  transactions: CreditTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreditAnalytics {
  daily_usage: Array<{
    date: string;
    credits_used: number;
    transactions_count: number;
  }>;
  monthly_summary: {
    total_credits_used: number;
    total_transactions: number;
    average_daily_usage: number;
  };
  top_actions: Array<{
    action: string;
    credits_used: number;
    count: number;
  }>;
}

export interface CheckCreditsRequest {
  action: string;
  estimated_credits?: number;
}

export interface CheckCreditsResponse {
  can_proceed: boolean;
  required_credits: number;
  current_balance: number;
  will_have_sufficient_credits: boolean;
}

export interface ConsumeCreditsRequest {
  action: string;
  campaign_id?: string;
  scenes?: number;
  tone?: string;
  style?: string;
}

export interface ConsumeCreditsResponse {
  success: boolean;
  credits_consumed: number;
  new_balance: number;
  transaction_id: string;
}

export interface CreditPurchaseRequest {
  credits: number;
  successUrl: string;
  cancelUrl: string;
}

export interface CreditPurchaseResponse {
  session_id: string;
  checkout_url: string;
  amount: number;
  credits: number;
}

export interface SubscriptionSessionRequest {
  subscriptionPlan: string;
  successUrl: string;
  cancelUrl: string;
}

export interface SubscriptionSessionResponse {
  session_id: string;
  checkout_url: string;
  plan_name: string;
  monthly_credits: number;
}

export interface BillingPortalRequest {
  returnUrl: string;
}

export interface BillingPortalResponse {
  portal_url: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthly_credits: number;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  is_popular?: boolean;
  is_current?: boolean;
}

// ============================================================================
// CAMPAIGN ENDPOINTS
// ============================================================================

// Campaign Settings Types
export interface CampaignScriptSettings {
  tone: string;
  style: string;
}

export interface CampaignSettings {
  // Basic settings
  videoDescription?: string;
  numberOfScenes?: number;
  campaignObjective?: string;
  selectedVoice?: string;

  // Script settings
  scriptMode?: "ai" | "manual";
  scriptSettings?: CampaignScriptSettings;

  // Additional settings
  animationStyle?: string;
  duration?: number;
  voiceSettings?: {
    speed?: number;
    pitch?: number;
    volume?: number;
  };

  // Video generation settings
  resolution?: string;
  aspectRatio?: string;
  format?: string;
}

// Campaign Step Data Types
export interface ProductImage {
  id: string;
  file?: File;
  url: string;
  name: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  sceneNumber: number;
  prompt: string;
  approved: boolean;
}

export interface VideoPrompt {
  id: string;
  imageId: string;
  prompt: string;
  animationStyle: string;
  duration: number;
}

export interface GeneratedVideo {
  id: string;
  imageId: string;
  url: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress?: number;
}

export interface CampaignStepData {
  // Step 1: Basic Info
  step_1?: {
    productImages?: ProductImage[];
    voice?: VoiceData;
    numberOfScenes?: number;
    campaignObjective?: string;
  };

  // Step 2: Script Generation (matches API response)
  step_2?: {
    script?: string;
    sceneScripts?: SceneScript[];
    scriptSettings?: CampaignScriptSettings;
  };

  // Step 3: Image Generation
  step_3?: {
    generatedImages?: GeneratedImage[];
  };

  // Step 4: Image Selection
  step_4?: {
    selectedImages?: string[];
  };

  // Step 5: Video Prompts
  step_5?: {
    videoPrompts?: VideoPrompt[];
  };

  // Step 6: Video Generation
  step_6?: {
    generatedVideos?: GeneratedVideo[];
  };

  // Step 7: Final Assembly
  step_7?: {
    finalVideoUrl?: string;
    exportSettings?: {
      format?: string;
      quality?: string;
      watermark?: boolean;
    };
  };
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  campaign_type?: "video" | "image" | "script";
  prompt?: string;
  status?: "draft" | "in_progress" | "completed" | "failed" | "cancelled";
  current_step?: number;
  total_steps?: number;
  step_data?: CampaignStepData;
  settings?: CampaignSettings;
  scenes_data?: Array<{
    index: number;
    script?: string;
    image_url?: string;
    video_url?: string;
    audio_url?: string;
  }>;
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

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  campaign_type?: "video" | "image" | "script";
  prompt?: string;
  settings?: CampaignSettings;
  estimated_credits?: number;
  is_template?: boolean;
}

export interface UpdateCampaignRequest {
  name?: string;
  description?: string;
  campaign_type?: "video" | "image" | "script";
  prompt?: string;
  settings?: CampaignSettings;
  status?: "draft" | "in_progress" | "completed" | "failed" | "cancelled";
  current_step?: number;
  step_data?: CampaignStepData;
}

export interface CampaignStats {
  total_campaigns: number;
  campaigns_this_month: number;
  active_campaigns: number;
  completed_campaigns: number;
  failed_campaigns: number;
  total_credits_used: number;
  average_completion_time: number;
}

export interface CampaignAnalytics {
  daily_campaigns: Array<{
    date: string;
    campaigns_created: number;
    campaigns_completed: number;
    credits_used: number;
  }>;
  campaign_types: Array<{
    type: string;
    count: number;
    success_rate: number;
  }>;
  performance_metrics: {
    average_completion_time: number;
    success_rate: number;
    average_credits_per_campaign: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type CampaignWithBusiness = Campaign & {
  businesses: {
    name: string;
  } | null;
};

export type CampaignsResponse = PaginatedResponse<CampaignWithBusiness>;

// ============================================================================
// FEEDBACK ENDPOINTS
// ============================================================================

export interface FeedbackData {
  name: string;
  email: string;
  subject: string;
  message: string;
  feedback_type:
    | "bug_report"
    | "feature_request"
    | "general_feedback"
    | "support_request";
  priority: "low" | "medium" | "high" | "urgent";
}

export interface FeedbackResponse {
  id: string;
  status: string;
  created_at: string;
}

// ============================================================================
// VIDEO PROJECT ENDPOINTS
// ============================================================================

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
// TEMPLATE ENDPOINTS
// ============================================================================

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

// ============================================================================
// USAGE LOGS ENDPOINTS
// ============================================================================

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

// ============================================================================
// SUBSCRIPTION ENDPOINTS
// ============================================================================

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

// ============================================================================
// BUSINESS USER ENDPOINTS
// ============================================================================

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

// ============================================================================
// PAGINATION TYPES
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

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ApiError {
  success: false;
  message: string;
  error: string;
  code?: string;
  details?: Json;
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

export interface StripeWebhookEvent {
  id: string;
  object: string;
  api_version: string;
  created: number;
  data: {
    object: Json;
  };
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string;
    idempotency_key: string;
  };
  type: string;
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  version?: string;
  environment?: string;
}

// ============================================================================
// UPLOAD ENDPOINTS
// ============================================================================

export interface ProductImageUpload {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
}

// ============================================================================
// VOICE ENDPOINTS
// ============================================================================

export interface VoiceData {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
  gender?: string;
  age?: string;
  accent?: string;
  use_case?: string;
  preview_url?: string;
}

export interface VoicePreview {
  audio_url: string;
  voice_id: string;
  text: string;
}

// ============================================================================
// ASSET LIBRARY ENDPOINTS
// ============================================================================

export interface AssetFolder {
  id: string;
  user_id: string;
  business_id?: string;
  name: string;
  description?: string;
  color: string;
  parent_folder_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AssetFile {
  id: string;
  user_id: string;
  business_id?: string;
  folder_id?: string;
  name: string;
  original_name: string;
  file_type: string;
  file_size: number;
  width?: number;
  height?: number;
  storage_url: string;
  storage_path: string;
  thumbnail_url?: string;
  is_generated: boolean;
  generation_prompt?: string;
  generation_model?: string;
  generation_settings?: Record<string, any>;
  alt_text?: string;
  tags: string[];
  metadata: Record<string, any>;
  download_count: number;
  last_accessed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AssetFileShare {
  id: string;
  file_id: string;
  shared_by_user_id: string;
  shared_with_user_id?: string;
  shared_with_business_id?: string;
  permission: 'view' | 'download' | 'edit';
  expires_at?: string;
  created_at: string;
}

export interface CreateAssetFolderRequest {
  name: string;
  description?: string;
  color?: string;
  parent_folder_id?: string;
  business_id?: string;
}

export interface UpdateAssetFolderRequest {
  name?: string;
  description?: string;
  color?: string;
  parent_folder_id?: string;
}

export interface CreateAssetFileRequest {
  folder_id?: string;
  business_id?: string;
  name: string;
  original_name: string;
  file_type: string;
  file_size: number;
  width?: number;
  height?: number;
  storage_url: string;
  storage_path: string;
  thumbnail_url?: string;
  is_generated?: boolean;
  generation_prompt?: string;
  generation_model?: string;
  generation_settings?: Record<string, any>;
  alt_text?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateAssetFileRequest {
  folder_id?: string;
  name?: string;
  alt_text?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface GetAssetFilesOptions {
  folder_id?: string | null;
  business_id?: string;
  file_type?: string;
  is_generated?: boolean;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'name' | 'file_size' | 'download_count';
  sort_order?: 'asc' | 'desc';
}

export interface AssetFilesResponse {
  files: AssetFile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GenerateAssetImageRequest {
  folder_id?: string;
  business_id?: string;
  prompt: string;
  name: string;
  alt_text?: string;
  tags?: string[];
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
}

export interface GenerateAssetImageResponse {
  success: boolean;
  data?: {
    url: string;
    revisedPrompt?: string;
  };
  message?: string;
}
