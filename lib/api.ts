import axios, { AxiosInstance, AxiosResponse } from "axios";
import { ENVS } from "@/constants/envs";
import { URLS } from "@/constants/urls";
import {
  ApiResponse,
  AuthResponse,
  SignupRequest,
  LoginRequest,
  ResetPasswordRequest,
  User,
  UpdateUserRequest,
  DashboardData,
  SubscriptionData,
  UpdateSubscriptionRequest,
  Business,
  BusinessOnboardingData,
  OnboardingProgress,
  OnboardingStepData,
  CreditBalance,
  CreditHistoryResponse,
  CreditAnalytics,
  CheckCreditsRequest,
  CheckCreditsResponse,
  ConsumeCreditsRequest,
  ConsumeCreditsResponse,
  CreditPurchaseRequest,
  CreditPurchaseResponse,
  SubscriptionSessionRequest,
  SubscriptionSessionResponse,
  BillingPortalRequest,
  BillingPortalResponse,
  SubscriptionPlan,
  Campaign,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CampaignStats,
  CampaignAnalytics,
  CampaignsResponse,
  FeedbackData,
  FeedbackResponse,
  HealthCheckResponse,
  CampaignSettings,
  CampaignStepData,
  ProductImageUpload,
  VoiceData,
  VoicePreview,
} from "@/types/api";

class ApiClient {
  public client: AxiosInstance;

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

  public getAuthToken(): string | null {
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
  async getBusiness(): Promise<ApiResponse<Business>> {
    const response = await this.client.get("/api/business");
    return response.data;
  }

  async updateBusiness(
    data: Partial<Business>
  ): Promise<ApiResponse<{ business: Business }>> {
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
    ApiResponse<{ progress: OnboardingProgress; business?: Business }>
  > {
    const response = await this.client.post(
      "/api/business/onboarding/complete",
      businessData ? { businessData } : {}
    );
    return response.data;
  }

  // Credits endpoints
  async getCredits(): Promise<ApiResponse<CreditBalance>> {
    const response = await this.client.get("/api/credits");
    return response.data;
  }

  async getCreditHistory(
    limit?: number,
    offset?: number
  ): Promise<ApiResponse<CreditHistoryResponse>> {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());
    const response = await this.client.get(
      `/api/credits/history?${params.toString()}`
    );
    return response.data;
  }

  async getCreditAnalytics(
    days?: number
  ): Promise<ApiResponse<CreditAnalytics>> {
    const params = days ? `?days=${days}` : "";
    const response = await this.client.get(`/api/credits/analytics${params}`);
    return response.data;
  }

  async checkCredits(
    data: CheckCreditsRequest
  ): Promise<ApiResponse<CheckCreditsResponse>> {
    const response = await this.client.post("/api/credits/check", data);
    return response.data;
  }

  async consumeCredits(
    data: ConsumeCreditsRequest
  ): Promise<ApiResponse<ConsumeCreditsResponse>> {
    const response = await this.client.post("/api/credits/consume", data);
    return response.data;
  }

  async createCreditPurchaseSession(
    data: CreditPurchaseRequest
  ): Promise<ApiResponse<CreditPurchaseResponse>> {
    const response = await this.client.post("/api/credits/purchase", data);
    return response.data;
  }

  async createSubscriptionSession(
    data: SubscriptionSessionRequest
  ): Promise<ApiResponse<SubscriptionSessionResponse>> {
    const response = await this.client.post("/api/credits/subscription", data);
    return response.data;
  }

  async createBillingPortalSession(
    data: BillingPortalRequest
  ): Promise<ApiResponse<BillingPortalResponse>> {
    const response = await this.client.post(
      "/api/credits/billing-portal",
      data
    );
    return response.data;
  }

  async getSubscriptionPlans(): Promise<ApiResponse<SubscriptionPlan[]>> {
    const response = await this.client.get("/api/credits/plans");
    return response.data;
  }

  // Campaign endpoints
  async getCampaigns(page?: number): Promise<ApiResponse<CampaignsResponse>> {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    const response = await this.client.get(
      `/api/campaigns?${params.toString()}`
    );
    return response.data;
  }

  async createCampaign(
    data: CreateCampaignRequest
  ): Promise<ApiResponse<Campaign>> {
    const response = await this.client.post("/api/campaigns", data);
    return response.data;
  }

  async getCampaign(id: string): Promise<ApiResponse<Campaign>> {
    const response = await this.client.get(`/api/campaigns/${id}`);
    return response.data;
  }

  async updateCampaign(
    id: string,
    data: UpdateCampaignRequest
  ): Promise<ApiResponse<Campaign>> {
    const response = await this.client.put(`/api/campaigns/${id}`, data);
    return response.data;
  }

  async deleteCampaign(id: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete(`/api/campaigns/${id}`);
    return response.data;
  }

  async getCampaignStats(): Promise<ApiResponse<CampaignStats>> {
    const response = await this.client.get("/api/campaigns/stats");
    return response.data;
  }

  async getCampaignAnalytics(): Promise<ApiResponse<CampaignAnalytics>> {
    const response = await this.client.get("/api/campaigns/analytics");
    return response.data;
  }

  async startCampaign(id: string): Promise<ApiResponse<Campaign>> {
    const response = await this.client.post(`/api/campaigns/${id}/start`);
    return response.data;
  }

  async completeCampaign(id: string): Promise<ApiResponse<Campaign>> {
    const response = await this.client.post(`/api/campaigns/${id}/complete`);
    return response.data;
  }

  async failCampaign(id: string): Promise<ApiResponse<Campaign>> {
    const response = await this.client.post(`/api/campaigns/${id}/fail`);
    return response.data;
  }

  async cancelCampaign(id: string): Promise<ApiResponse<Campaign>> {
    const response = await this.client.post(`/api/campaigns/${id}/cancel`);
    return response.data;
  }

  async saveCampaignSettings(
    id: string,
    settings: CampaignSettings
  ): Promise<ApiResponse<Campaign>> {
    const response = await this.client.patch(`/api/campaigns/${id}/settings`, {
      settings,
    });
    return response.data;
  }

  async saveCampaignStepData(
    id: string,
    step: number,
    stepData: CampaignStepData[keyof CampaignStepData]
  ): Promise<ApiResponse<Campaign>> {
    const response = await this.client.patch(`/api/campaigns/${id}/step-data`, {
      step,
      stepData,
    });
    return response.data;
  }

  // Health check
  async health(): Promise<ApiResponse<HealthCheckResponse>> {
    const response = await this.client.get("/health");
    return response.data;
  }

  // Upload endpoints
  async uploadProductImages(
    campaignId: string,
    files: FileList
  ): Promise<ApiResponse<ProductImageUpload[]>> {
    const formData = new FormData();
    formData.append("campaign_id", campaignId);
    Array.from(files).forEach((file) => {
      formData.append("images", file);
    });

    const response = await this.client.post(
      "/api/upload/product-images",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  }

  async deleteProductImage(filename: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete(
      `/api/upload/product-images/${filename}`
    );
    return response.data;
  }

  // Voice endpoints
  async getVoices(): Promise<ApiResponse<VoiceData[]>> {
    const response = await this.client.get("/api/voices");
    return response.data;
  }

  async getVoice(voiceId: string): Promise<ApiResponse<VoiceData>> {
    const response = await this.client.get(`/api/voices/${voiceId}`);
    return response.data;
  }

  async generateVoicePreview(
    voiceId: string,
    text: string
  ): Promise<ApiResponse<VoicePreview>> {
    const response = await this.client.post("/api/voices/preview", {
      voice_id: voiceId,
      text,
    });
    return response.data;
  }

  // Feedback endpoints
  async submitFeedback(
    data: FeedbackData
  ): Promise<ApiResponse<FeedbackResponse>> {
    const response = await this.client.post("/api/feedback", data);
    return response.data;
  }

  // AI Generation endpoints
  async generateScriptStream(data: {
    campaignId: string;
    sceneNumber: number;
    productName: string;
    objective: string;
    tone: string;
    style: string;
    customPrompt?: string;
  }): Promise<ReadableStream> {
    const response = await fetch(`${this.client.defaults.baseURL}/api/campaigns/generate-script`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.body as ReadableStream;
  }

  async generateImage(data: {
    campaignId: string;
    sceneNumber: number;
    scriptText: string;
    selectedImageIds: string[];
    imageDescription?: string;
  }): Promise<ApiResponse<any>> {
    const response = await this.client.post("/api/campaigns/generate-image", data);
    return response.data;
  }

}

// Create and export the API client instance
export const api = new ApiClient();

// Also export the axios instance for direct use if needed
export const axiosInstance = api.client;
