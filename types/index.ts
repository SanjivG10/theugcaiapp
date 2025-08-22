// Type exports for the application
// This file provides a centralized way to import all types

// ============================================================================
// API TYPES
// ============================================================================

export * from "./api";

// ============================================================================
// DATABASE TYPES
// ============================================================================

export * from "./database";

// ============================================================================
// AUTH TYPES
// ============================================================================

export * from "./auth";

// ============================================================================
// BUSINESS TYPES
// ============================================================================

export * from "./business";

// ============================================================================
// COMMON TYPES
// ============================================================================

// Re-export commonly used types for convenience
export type {
  ApiResponse,
  PaginatedResponse,
  Json,
  User,
  Business,
  Campaign,
  Subscription,
  CreditTransaction,
  Feedback,
  VideoProject,
  Template,
} from "./api";

export type {
  UserInsert,
  BusinessInsert,
  CampaignInsert,
  CreditTransactionInsert,
  FeedbackInsert,
  SubscriptionInsert,
  VideoProjectInsert,
  TemplateInsert,
  UserUpdate,
  BusinessUpdate,
  CampaignUpdate,
} from "./database";

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type {
  EntityId,
  Timestamp,
  Status,
  Role,
  Priority,
  FeedbackType,
  TransactionType,
  CampaignStatus,
  SubscriptionStatus,
} from "./database";

export type {
  PaginationParams,
  SortParams,
  FilterParams,
  QueryParams,
} from "./database";

// ============================================================================
// CONSTANTS
// ============================================================================

export { DATABASE_CONSTRAINTS, DATABASE_INDEXES } from "./database";
