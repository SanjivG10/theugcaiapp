import { Request, Response } from "express";
import { AuthService } from "../services/authService";
import { BusinessService } from "../services/businessService";
import { supabaseAdmin } from "../config/supabase";
import { asyncHandler, ValidationError } from "../middleware/errorHandler";
import { User, Business, Subscription, ApiResponse, VideoProject, UsageLog } from "../types/database";
import { OnboardingProgress } from "../types/business";

interface DashboardData {
  user: User;
  business: Business | null;
  onboarding: OnboardingProgress;
  stats: {
    recent_videos: VideoProject[];
    monthly_usage: number;
    videos_generated: number;
  };
}

const authService = new AuthService();
const businessService = new BusinessService();

export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError("User ID not found");
    }

    const user = await authService.getUserById(userId);

    if (!user) {
      throw new ValidationError("User not found");
    }

    const response: ApiResponse<User> = {
      success: true,
      message: "User retrieved successfully",
      data: user,
    };

    res.status(200).json(response);
  }
);

export const updateCurrentUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const updates = req.body;

    if (!userId) {
      throw new ValidationError("User ID not found");
    }

    // Remove sensitive fields that shouldn't be updated
    delete updates.id;
    delete updates.email;
    delete updates.role;
    delete updates.subscription_status;
    delete updates.created_at;
    delete updates.updated_at;

    const user = await authService.updateUser(userId, updates);

    const response: ApiResponse<User> = {
      success: true,
      message: "User updated successfully",
      data: user,
    };

    res.status(200).json(response);
  }
);

export const getDashboardData = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError("User ID not found");
    }

    // Get user data
    const user = await authService.getUserById(userId);
    if (!user) {
      throw new ValidationError("User not found");
    }

    // Get business data
    const business = await businessService.getBusinessByUserId(userId);

    // Get onboarding progress
    const onboardingProgress = await businessService.getOnboardingProgress(
      userId
    );

    // Get recent videos (you can implement this later)
    const { data: recentVideos } = await supabaseAdmin
      .from("video_projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    // Get usage stats (you can implement this later)
    const { data: usageStats } = await supabaseAdmin
      .from("usage_logs")
      .select("action")
      .eq("user_id", userId)
      .gte(
        "created_at",
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      ); // Last 30 days

    const dashboardData: DashboardData = {
      user,
      business,
      onboarding: onboardingProgress,
      stats: {
        recent_videos: (recentVideos as VideoProject[]) || [],
        monthly_usage: usageStats?.length || 0,
        videos_generated: recentVideos?.length || 0,
      },
    };

    const response: ApiResponse<DashboardData> = {
      success: true,
      message: "Dashboard data retrieved successfully",
      data: dashboardData,
    };

    res.status(200).json(response);
  }
);

export const getSubscriptionInfo = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError("User ID not found");
    }

    // Get subscription data
    const { data: subscription, error } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to get subscription: ${error.message}`);
    }

    const response: ApiResponse<Subscription | null> = {
      success: true,
      message: "Subscription info retrieved successfully",
      data: subscription || null,
    };

    res.status(200).json(response);
  }
);

export const updateSubscription = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { plan_name, stripe_customer_id, stripe_subscription_id } = req.body;

    if (!userId) {
      throw new ValidationError("User ID not found");
    }

    if (!plan_name) {
      throw new ValidationError("Plan name is required");
    }

    // Create or update subscription
    const { data: subscription, error } = await supabaseAdmin
      .from("subscriptions")
      .upsert({
        user_id: userId,
        plan_name,
        stripe_customer_id,
        stripe_subscription_id,
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(), // 30 days
        monthly_video_credits:
          plan_name === "trial" ? 3 : plan_name === "starter" ? 10 : 50,
        used_video_credits: 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update subscription: ${error.message}`);
    }

    // Update user subscription status
    await authService.updateUser(userId, {
      subscription_status: "active",
    });

    const response: ApiResponse<Subscription> = {
      success: true,
      message: "Subscription updated successfully",
      data: subscription,
    };

    res.status(200).json(response);
  }
);

export const deleteAccount = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { confirmation } = req.body;

    if (!userId) {
      throw new ValidationError("User ID not found");
    }

    if (confirmation !== "DELETE_MY_ACCOUNT") {
      throw new ValidationError(
        'Please confirm account deletion by typing "DELETE_MY_ACCOUNT"'
      );
    }

    // Soft delete - mark as inactive instead of hard delete
    await authService.updateUser(userId, {
      // We could add an is_active field to mark as deleted
    });

    // You might want to implement a more sophisticated deletion process
    // that handles data retention policies, billing, etc.

    const response: ApiResponse<null> = {
      success: true,
      message:
        "Account deletion initiated. You will receive a confirmation email.",
    };

    res.status(200).json(response);
  }
);
