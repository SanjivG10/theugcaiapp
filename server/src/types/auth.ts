export interface AuthUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: "user" | "admin" | "business_owner";
  email_verified: boolean;
  onboarding_completed: boolean;
  subscription_status: "trial" | "active" | "cancelled" | "expired";
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user?: AuthUser;
    token?: string;
  };
  error?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}
