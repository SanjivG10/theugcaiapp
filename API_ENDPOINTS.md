# API Endpoints Documentation

This document provides a comprehensive overview of all API endpoints available in the application, along with their request and response types.

## Base URL

All API endpoints are prefixed with the base URL from `ENVS.API_URL`.

## Authentication

Most endpoints require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

## Response Format

All API responses follow this standard format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
```

---

## Authentication Endpoints

### POST /api/auth/signup

Create a new user account.

**Request:**

```typescript
interface SignupRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}
```

**Response:**

```typescript
interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  access_token?: string;
  refresh_token?: string;
}
```

### POST /api/auth/login

Authenticate user and get access token.

**Request:**

```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

**Response:**

```typescript
interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  access_token?: string;
  refresh_token?: string;
}
```

### POST /api/auth/forgot-password

Send password reset email.

**Request:**

```typescript
interface ForgotPasswordRequest {
  email: string;
}
```

### POST /api/auth/reset-password

Reset password using access token.

**Request:**

```typescript
interface ResetPasswordRequest {
  access_token: string;
  password: string;
}
```

### GET /api/auth/profile

Get current user profile (requires auth).

**Response:**

```typescript
interface ApiResponse<{ user: User }>
```

### PUT /api/auth/profile

Update current user profile (requires auth).

**Request:**

```typescript
interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
}
```

### POST /api/auth/refresh-token

Refresh access token (requires auth).

**Response:**

```typescript
interface ApiResponse<{ token: string }>
```

### POST /api/auth/logout

Logout user (requires auth).

---

## User Endpoints

### GET /api/users/me

Get current user information (requires auth).

**Response:**

```typescript
interface ApiResponse<{ user: User }>
```

### PUT /api/users/me

Update current user information (requires auth).

**Request:**

```typescript
interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
}
```

### GET /api/users/dashboard

Get user dashboard data (requires auth).

**Response:**

```typescript
interface ApiResponse<DashboardData>
```

### GET /api/users/subscription

Get user subscription information (requires auth).

**Response:**

```typescript
interface ApiResponse<SubscriptionData>
```

### PUT /api/users/subscription

Update user subscription (requires auth).

**Request:**

```typescript
interface UpdateSubscriptionRequest {
  plan_id?: string;
  billing_cycle?: "monthly" | "yearly";
  auto_renew?: boolean;
}
```

### DELETE /api/users/account

Delete user account (requires auth).

---

## Business Endpoints

### GET /api/business

Get business information (requires auth).

**Response:**

```typescript
interface ApiResponse<Business>
```

### PUT /api/business

Update business information (requires auth).

**Request:**

```typescript
interface Partial<Business>
```

### GET /api/business/onboarding

Get onboarding progress (requires auth).

**Response:**

```typescript
interface ApiResponse<{ progress: OnboardingProgress }>
```

### POST /api/business/onboarding/step

Update onboarding step (requires auth).

**Request:**

```typescript
{
  step: number;
  data: OnboardingStepData;
}
```

### POST /api/business/onboarding/skip

Skip onboarding step (requires auth).

**Request:**

```typescript
{
  step: number;
}
```

### POST /api/business/onboarding/complete

Complete onboarding (requires auth).

**Request:**

```typescript
{
  businessData?: BusinessOnboardingData;
}
```

---

## Credits Endpoints

### GET /api/credits

Get credit balance (requires auth).

**Response:**

```typescript
interface ApiResponse<CreditBalance>
```

### GET /api/credits/history

Get credit transaction history (requires auth).

**Query Parameters:**

- `limit?: number`
- `offset?: number`

**Response:**

```typescript
interface ApiResponse<CreditHistoryResponse>
```

### GET /api/credits/analytics

Get credit usage analytics (requires auth).

**Query Parameters:**

- `days?: number`

**Response:**

```typescript
interface ApiResponse<CreditAnalytics>
```

### POST /api/credits/check

Check if user has sufficient credits (requires auth).

**Request:**

```typescript
interface CheckCreditsRequest {
  action: string;
  estimated_credits?: number;
}
```

**Response:**

```typescript
interface ApiResponse<CheckCreditsResponse>
```

### POST /api/credits/consume

Consume credits for an action (requires auth).

**Request:**

```typescript
interface ConsumeCreditsRequest {
  action: string;
  credits: number;
  metadata?: Json;
  campaign_id?: string;
}
```

**Response:**

```typescript
interface ApiResponse<ConsumeCreditsResponse>
```

### POST /api/credits/purchase

Create credit purchase session (requires auth).

**Request:**

```typescript
interface CreditPurchaseRequest {
  credits: number;
  successUrl: string;
  cancelUrl: string;
}
```

**Response:**

```typescript
interface ApiResponse<CreditPurchaseResponse>
```

### POST /api/credits/subscription

Create subscription session (requires auth).

**Request:**

```typescript
interface SubscriptionSessionRequest {
  subscriptionPlan: string;
  successUrl: string;
  cancelUrl: string;
}
```

**Response:**

```typescript
interface ApiResponse<SubscriptionSessionResponse>
```

### POST /api/credits/billing-portal

Create billing portal session (requires auth).

**Request:**

```typescript
interface BillingPortalRequest {
  returnUrl: string;
}
```

**Response:**

```typescript
interface ApiResponse<BillingPortalResponse>
```

### GET /api/credits/plans

Get available subscription plans (public).

**Response:**

```typescript
interface ApiResponse<SubscriptionPlan[]>
```

### POST /api/credits/webhook

Stripe webhook handler (public).

**Request:**

```typescript
interface StripeWebhookEvent
```

---

## Campaign Endpoints

### GET /api/campaigns

Get user campaigns (requires auth).

**Query Parameters:**

- `page?: number`

**Response:**

```typescript
interface ApiResponse<CampaignsResponse>
```

### POST /api/campaigns

Create new campaign (requires auth).

**Request:**

```typescript
interface CreateCampaignRequest {
  name: string;
  description?: string;
  campaign_type?: string;
  prompt?: string;
  settings?: Json;
  estimated_credits?: number;
  is_template?: boolean;
}
```

**Response:**

```typescript
interface ApiResponse<Campaign>
```

### GET /api/campaigns/:id

Get campaign by ID (requires auth).

**Response:**

```typescript
interface ApiResponse<Campaign>
```

### PUT /api/campaigns/:id

Update campaign (requires auth).

**Request:**

```typescript
interface UpdateCampaignRequest {
  name?: string;
  description?: string;
  prompt?: string;
  settings?: Json;
  status?: "draft" | "in_progress" | "completed" | "failed" | "cancelled";
}
```

**Response:**

```typescript
interface ApiResponse<Campaign>
```

### DELETE /api/campaigns/:id

Delete campaign (requires auth).

**Response:**

```typescript
interface ApiResponse<void>
```

### GET /api/campaigns/stats

Get campaign statistics (requires auth).

**Response:**

```typescript
interface ApiResponse<CampaignStats>
```

### GET /api/campaigns/analytics

Get campaign analytics (requires auth).

**Response:**

```typescript
interface ApiResponse<CampaignAnalytics>
```

### POST /api/campaigns/:id/start

Start campaign (requires auth).

**Response:**

```typescript
interface ApiResponse<Campaign>
```

### POST /api/campaigns/:id/complete

Complete campaign (requires auth).

**Response:**

```typescript
interface ApiResponse<Campaign>
```

### POST /api/campaigns/:id/fail

Mark campaign as failed (requires auth).

**Response:**

```typescript
interface ApiResponse<Campaign>
```

### POST /api/campaigns/:id/cancel

Cancel campaign (requires auth).

**Response:**

```typescript
interface ApiResponse<Campaign>
```

---

## Feedback Endpoints

### POST /api/feedback

Submit feedback (public).

**Request:**

```typescript
interface FeedbackData {
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
```

**Response:**

```typescript
interface ApiResponse<FeedbackResponse>
```

---

## Health Check

### GET /health

Health check endpoint (public).

**Response:**

```typescript
interface ApiResponse<HealthCheckResponse>
```

---

## Error Handling

All endpoints may return error responses in the following format:

```typescript
interface ApiError {
  success: false;
  message: string;
  error: string;
  code?: string;
  details?: Json;
}
```

Common HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

---

## Rate Limiting

API endpoints may be subject to rate limiting. When rate limited, the response will include:

- HTTP status code `429`
- `Retry-After` header indicating when to retry
- Error message explaining the rate limit

---

## Pagination

Endpoints that return lists support pagination with the following parameters:

- `page`: Page number (1-based)
- `limit`: Number of items per page
- `offset`: Number of items to skip

Paginated responses include pagination metadata:

```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```
