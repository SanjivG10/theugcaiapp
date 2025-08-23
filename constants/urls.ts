export const URLS = {
  HOME: "/",
  AUTH: {
    LOGIN: "/login",
    REGISTER: "/register",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password",
  },
  ONBOARDING: {
    START: "/onboarding",
    STEP: (step: number) => `/onboarding/step-${step}`,
  },
  DASHBOARD: {
    HOME: "/dashboard",
    CAMPAIGNS: "/dashboard/campaigns",
    CAMPAIGNS_QUERY_CREATE: "/dashboard/campaigns?create=true",
    TEMPLATES: "/dashboard/templates",
    ANALYTICS: "/dashboard/analytics",
    SETTINGS: "/dashboard/settings",
    PROFILE: "/dashboard/profile",
  },
  BUSINESS: {
    SETUP: "/business/setup",
    MANAGE: "/business/manage",
  },
  CAMPAIGN: {
    CREATE: "/dashboard/campaigns/create",
    VIEW: (id: string) => `/dashboard/campaigns/${id}`,
  },
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    SIGNUP: "/api/auth/signup",
    LOGOUT: "/api/auth/logout",
    PROFILE: "/api/auth/profile",
    FORGOT_PASSWORD: "/api/auth/forgot-password",
    RESET_PASSWORD: "/api/auth/reset-password",
  },
  USERS: {
    ME: "/api/users/me",
    DASHBOARD: "/api/users/dashboard",
    SUBSCRIPTION: "/api/users/subscription",
  },
  BUSINESS: {
    GET: "/api/business",
    UPDATE: "/api/business",
    ONBOARDING_PROGRESS: "/api/business/onboarding",
    ONBOARDING_STEP: "/api/business/onboarding/step",
    ONBOARDING_SKIP: "/api/business/onboarding/skip",
    ONBOARDING_COMPLETE: "/api/business/onboarding/complete",
  },
  CREDITS: {
    GET: "/api/credits",
    HISTORY: "/api/credits/history",
    ANALYTICS: "/api/credits/analytics",
    CHECK: "/api/credits/check",
    PURCHASE: "/api/credits/purchase",
    SUBSCRIPTION: "/api/credits/subscription",
    BILLING_PORTAL: "/api/credits/billing-portal",
    PLANS: "/api/credits/plans",
    WEBHOOK: "/api/credits/webhook",
  },
  CAMPAIGNS: {
    LIST: "/api/campaigns",
    CREATE: "/api/campaigns",
    GET: (id: string) => `/api/campaigns/${id}`,
    UPDATE: (id: string) => `/api/campaigns/${id}`,
    DELETE: (id: string) => `/api/campaigns/${id}`,
    STATS: "/api/campaigns/stats",
    ANALYTICS: "/api/campaigns/analytics",
    START: (id: string) => `/api/campaigns/${id}/start`,
    COMPLETE: (id: string) => `/api/campaigns/${id}/complete`,
    FAIL: (id: string) => `/api/campaigns/${id}/fail`,
    CANCEL: (id: string) => `/api/campaigns/${id}/cancel`,
  },
  FEEDBACK: {
    CREATE: "/api/feedback",
  },
} as const;
