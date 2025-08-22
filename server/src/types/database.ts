// Re-export types from the main database types file
import {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "../database.types";

export type Json =
  Database["public"]["Tables"]["businesses"]["Row"]["business_address"];

// Export table types directly from database.types.ts
export type User = Tables<"users">;
export type UserInsert = TablesInsert<"users">;
export type UserUpdate = TablesUpdate<"users">;

export type Business = Tables<"businesses">;
export type BusinessInsert = TablesInsert<"businesses">;
export type BusinessUpdate = TablesUpdate<"businesses">;

export type BusinessUser = Tables<"business_users">;
export type BusinessUserInsert = TablesInsert<"business_users">;
export type BusinessUserUpdate = TablesUpdate<"business_users">;

export type Campaign = Tables<"campaigns">;
export type CampaignInsert = TablesInsert<"campaigns">;
export type CampaignUpdate = TablesUpdate<"campaigns">;

export type CreditTransaction = Tables<"credit_transactions">;
export type CreditTransactionInsert = TablesInsert<"credit_transactions">;
export type CreditTransactionUpdate = TablesUpdate<"credit_transactions">;

export type CreditUsageLog = Tables<"credit_usage_logs">;
export type CreditUsageLogInsert = TablesInsert<"credit_usage_logs">;
export type CreditUsageLogUpdate = TablesUpdate<"credit_usage_logs">;

export type Feedback = Tables<"feedback">;
export type FeedbackInsert = TablesInsert<"feedback">;
export type FeedbackUpdate = TablesUpdate<"feedback">;

export type Subscription = Tables<"subscriptions">;
export type SubscriptionInsert = TablesInsert<"subscriptions">;
export type SubscriptionUpdate = TablesUpdate<"subscriptions">;

export type SubscriptionHistory = Tables<"subscription_history">;
export type SubscriptionHistoryInsert = TablesInsert<"subscription_history">;
export type SubscriptionHistoryUpdate = TablesUpdate<"subscription_history">;

export type Template = Tables<"templates">;
export type TemplateInsert = TablesInsert<"templates">;
export type TemplateUpdate = TablesUpdate<"templates">;

export type UsageLog = Tables<"usage_logs">;
export type UsageLogInsert = TablesInsert<"usage_logs">;
export type UsageLogUpdate = TablesUpdate<"usage_logs">;

export type VideoProject = Tables<"video_projects">;
export type VideoProjectInsert = TablesInsert<"video_projects">;
export type VideoProjectUpdate = TablesUpdate<"video_projects">;

// Common response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Service interfaces
export interface CreditServiceParams {
  businessId: string;
  amount: number;
  transactionType:
    | "purchase"
    | "usage"
    | "refund"
    | "monthly_allocation"
    | "bonus";
  description?: string;
  metadata?: Json;
  stripePaymentIntentId?: string;
}

export interface CampaignStatusUpdateParams {
  campaignId: string;
  status: "draft" | "in_progress" | "completed" | "failed" | "cancelled";
  creditsUsed?: number;
  outputUrls?: string[];
  thumbnailUrl?: string;
}

// Function return types
export interface UserSubscriptionInfo {
  plan_name: string;
  status: string;
  monthly_credits: number;
  used_credits: number;
  remaining_credits: number;
}
