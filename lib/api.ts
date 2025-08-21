import axios, { AxiosInstance, AxiosResponse } from "axios";
import { ENVS } from "@/constants/envs";
import { User } from "@/types/auth";
import {
  BusinessData,
  BusinessOnboardingData,
  OnboardingProgress,
  OnboardingStepData,
} from "@/types/business";
import { URLS } from "@/constants/urls";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// API Request/Response Types
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

export interface DashboardData {
  stats: {
    total_campaigns: number;
    campaigns_this_month: number;
    active_campaigns: number;
    campaigns_this_week: number;
  };
  recent_campaigns: Array<{
    id: string;
    title: string;
    created_at: string;
    status: string;
  }>;
  usage: {
    current_plan: string;
    campaigns_used: number;
    campaigns_limit: number;
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
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  timezone?: string;
}

export interface UpdateSubscriptionRequest {
  plan_id?: string;
  billing_cycle?: "monthly" | "yearly";
  auto_renew?: boolean;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: ENVS.API_URL,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.removeAuthToken();
          window.location.href = URLS.AUTH.LOGIN;
        }
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token");
    }
    return null;
  }

  private setAuthToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
    }
  }

  private removeAuthToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  }

  // Auth endpoints
  async signup(data: SignupRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await this.client.post("/api/auth/signup", data);
    if (response.data.data?.token || response.data.data?.access_token) {
      this.setAuthToken(
        response.data.data.token || response.data.data.access_token
      );
    }
    return response.data;
  }

  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await this.client.post("/api/auth/login", data);
    if (response.data.data?.token || response.data.data?.access_token) {
      this.setAuthToken(
        response.data.data.token || response.data.data.access_token
      );
    }
    return response.data;
  }

  async logout(): Promise<ApiResponse<void>> {
    this.removeAuthToken();
    return {
      success: true,
      message: "Logged out successfully",
    };
  }

  async forgotPassword(email: string): Promise<ApiResponse<void>> {
    const response = await this.client.post("/api/auth/forgot-password", {
      email,
    });
    return response.data;
  }

  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<void>> {
    const response = await this.client.post("/api/auth/reset-password", data);
    return response.data;
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    const response = await this.client.get("/api/auth/profile");
    return response.data;
  }

  async updateProfile(
    data: Partial<User>
  ): Promise<ApiResponse<{ user: User }>> {
    const response = await this.client.put("/api/auth/profile", data);
    return response.data;
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    const response = await this.client.post("/api/auth/refresh-token");
    if (response.data.data?.token) {
      this.setAuthToken(response.data.data.token);
    }
    return response.data;
  }

  // User endpoints
  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    const response = await this.client.get("/api/users/me");
    return response.data;
  }

  async updateCurrentUser(
    data: UpdateUserRequest
  ): Promise<ApiResponse<{ user: User }>> {
    const response = await this.client.put("/api/users/me", data);
    return response.data;
  }

  async getDashboard(): Promise<ApiResponse<DashboardData>> {
    const response = await this.client.get("/api/users/dashboard");
    return response.data;
  }

  async getSubscription(): Promise<ApiResponse<SubscriptionData>> {
    const response = await this.client.get("/api/users/subscription");
    return response.data;
  }

  async updateSubscription(
    data: UpdateSubscriptionRequest
  ): Promise<ApiResponse<SubscriptionData>> {
    const response = await this.client.put("/api/users/subscription", data);
    return response.data;
  }

  // Business endpoints
  async getBusiness(): Promise<ApiResponse<BusinessData>> {
    const response = await this.client.get("/api/business");
    return response.data;
  }

  async updateBusiness(
    data: Partial<BusinessData>
  ): Promise<ApiResponse<{ business: BusinessData }>> {
    const response = await this.client.put("/api/business", data);
    return response.data;
  }

  async getOnboardingProgress(): Promise<
    ApiResponse<{ progress: OnboardingProgress }>
  > {
    const response = await this.client.get("/api/business/onboarding");
    return response.data;
  }

  async updateOnboardingStep(
    step: number,
    data: OnboardingStepData
  ): Promise<ApiResponse<{ progress: OnboardingProgress }>> {
    const response = await this.client.post("/api/business/onboarding/step", {
      step,
      data,
    });
    return response.data;
  }

  async skipOnboardingStep(
    step: number
  ): Promise<ApiResponse<{ progress: OnboardingProgress }>> {
    const response = await this.client.post("/api/business/onboarding/skip", {
      step,
    });
    return response.data;
  }

  async completeOnboarding(
    businessData?: BusinessOnboardingData
  ): Promise<
    ApiResponse<{ progress: OnboardingProgress; business?: BusinessData }>
  > {
    const response = await this.client.post(
      "/api/business/onboarding/complete",
      businessData ? { businessData } : {}
    );
    return response.data;
  }

  // Health check
  async health(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    const response = await this.client.get("/health");
    return response.data;
  }
}

export const api = new ApiClient();
