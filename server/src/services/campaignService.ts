import { supabaseAdmin } from "../config/supabase";
import { CreditService } from "./creditService";
import {
  Campaign,
  CampaignInsert,
  CampaignUpdate,
  Json,
} from "../types/database";

// Credit costs for different campaign types
const CREDIT_COSTS = {
  video: 10,
  image: 5,
  script: 3,
} as const;

export interface CreateCampaignData {
  name: string;
  description?: string;
  campaign_type?: "video" | "image" | "script";
  prompt?: string;
  settings?: Json;
  business_id: string;
  user_id: string;
}

export interface ProcessCampaignData {
  campaign_id: string;
  output_urls?: string[];
  thumbnail_url?: string;
  actual_credits_used?: number;
  metadata?: Record<string, unknown>;
}

export class CampaignService {
  /**
   * Create a new campaign and estimate credit costs
   */
  static async createCampaign(data: CreateCampaignData): Promise<Campaign> {
    try {
      // For initial creation, we don't estimate credits yet since campaign_type might not be set
      const estimatedCredits = data.campaign_type
        ? this.estimateCredits(data.campaign_type, data.settings)
        : 0;

      // Create campaign without credit checks for initial draft
      const insertData: CampaignInsert = {
        name: data.name,
        description: data.description,
        campaign_type: data.campaign_type || undefined,
        prompt: data.prompt || undefined,
        settings: data.settings || {},
        business_id: data.business_id,
        user_id: data.user_id,
        estimated_credits: estimatedCredits,
        current_step: 1,
        total_steps: 4,
        step_data: {},
        metadata: {},
      };

      const { data: campaign, error: campaignError } = await supabaseAdmin
        .from("campaigns")
        .insert(insertData)
        .select()
        .single();

      if (campaignError) {
        throw new Error(`Failed to create campaign: ${campaignError.message}`);
      }

      return campaign;
    } catch (error) {
      console.error("Error in createCampaign:", error);
      throw error;
    }
  }

  /**
   * Start processing a campaign (consume estimated credits)
   */
  static async startCampaign(
    campaignId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get campaign details
      const { data: campaign, error: campaignError } = await supabaseAdmin
        .from("campaigns")
        .select("id, business_id, estimated_credits, status, campaign_type")
        .eq("id", campaignId)
        .single();

      if (campaignError || !campaign) {
        throw new Error("Campaign not found");
      }

      if (campaign.status !== "draft") {
        throw new Error("Campaign is not in draft status");
      }

      // Update campaign status
      const { error: updateError } = await supabaseAdmin
        .from("campaigns")
        .update({
          status: "in_progress",
          credits_used: campaign.estimated_credits,
          started_at: new Date().toISOString(),
        })
        .eq("id", campaignId);

      // Consume estimated credits after status update
      if (campaign.estimated_credits > 0) {
        await CreditService.consumeCredits(
          campaign.business_id,
          campaign.estimated_credits,
          `Campaign started: ${campaign.id}`,
          {
            campaign_id: campaign.id,
            action: "campaign_start",
            campaign_type: campaign.campaign_type,
          }
        );
      }

      if (updateError) {
        throw new Error(`Failed to start campaign: ${updateError.message}`);
      }

      return { success: true, message: "Campaign started successfully" };
    } catch (error) {
      console.error("Error in startCampaign:", error);
      throw error;
    }
  }

  /**
   * Complete a campaign (adjust credits if needed)
   */
  static async completeCampaign(
    data: ProcessCampaignData
  ): Promise<{ success: boolean; message: string }> {
    try {
      const {
        campaign_id,
        output_urls,
        thumbnail_url,
        actual_credits_used,
        metadata,
      } = data;

      // Get campaign details
      const { data: campaign, error: campaignError } = await supabaseAdmin
        .from("campaigns")
        .select("id, business_id, estimated_credits, credits_used, status")
        .eq("id", campaign_id)
        .single();

      if (campaignError || !campaign) {
        throw new Error("Campaign not found");
      }

      if (campaign.status !== "in_progress") {
        throw new Error("Campaign is not in progress");
      }

      // Calculate credit adjustment if actual usage differs from estimate
      let creditAdjustment = 0;
      if (
        actual_credits_used !== undefined &&
        actual_credits_used !== campaign.credits_used
      ) {
        creditAdjustment = actual_credits_used - campaign.credits_used;

        // If we need more credits, check availability
        if (creditAdjustment > 0) {
          const { data: business, error: businessError } = await supabaseAdmin
            .from("businesses")
            .select("credits")
            .eq("id", campaign.business_id)
            .single();

          if (businessError || !business) {
            throw new Error("Business not found");
          }

          if (business.credits < creditAdjustment) {
            throw new Error(
              `Insufficient credits for completion. Required: ${creditAdjustment}, Available: ${business.credits}`
            );
          }
        }
      }

      // Update campaign status and output
      const updateData: CampaignUpdate = {
        status: "completed",
        credits_used: actual_credits_used || campaign.credits_used,
        output_urls: output_urls || undefined,
        thumbnail_url: thumbnail_url || undefined,
        completed_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabaseAdmin
        .from("campaigns")
        .update(updateData)
        .eq("id", campaign_id);

      if (updateError) {
        throw new Error(`Failed to complete campaign: ${updateError.message}`);
      }

      // Update metadata if provided
      if (metadata) {
        const { error: metadataError } = await supabaseAdmin
          .from("campaigns")
          .update({ metadata })
          .eq("id", campaign_id);

        if (metadataError) {
          console.error("Failed to update campaign metadata:", metadataError);
        }
      }

      // If we refunded credits, add them back
      if (creditAdjustment < 0) {
        await CreditService.addCredits({
          businessId: campaign.business_id,
          amount: Math.abs(creditAdjustment),
          transactionType: "refund",
          description: `Credit refund for campaign: ${campaign_id}`,
          metadata: {
            campaign_id: campaign_id,
            action: "campaign_refund",
          },
        });
      }

      return { success: true, message: "Campaign completed successfully" };
    } catch (error) {
      console.error("Error in completeCampaign:", error);
      throw error;
    }
  }

  /**
   * Fail a campaign (refund credits if needed)
   */
  static async failCampaign(
    campaignId: string,
    errorMessage?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get campaign details
      const { data: campaign, error: campaignError } = await supabaseAdmin
        .from("campaigns")
        .select("id, business_id, credits_used, status")
        .eq("id", campaignId)
        .single();

      if (campaignError || !campaign) {
        throw new Error("Campaign not found");
      }

      if (campaign.status !== "in_progress") {
        throw new Error("Campaign is not in progress");
      }

      // Update campaign status
      const { error: updateError } = await supabaseAdmin
        .from("campaigns")
        .update({ status: "failed" })
        .eq("id", campaignId);

      if (updateError) {
        throw new Error(
          `Failed to update campaign status: ${updateError.message}`
        );
      }

      // Refund credits if any were used
      if (campaign.credits_used > 0) {
        await CreditService.addCredits({
          businessId: campaign.business_id,
          amount: campaign.credits_used,
          transactionType: "refund",
          description: `Credit refund for failed campaign: ${campaignId}`,
          metadata: {
            campaign_id: campaignId,
            action: "campaign_failure_refund",
            error_message: errorMessage,
          },
        });
      }

      // Update metadata with error information
      const { error: metadataError } = await supabaseAdmin
        .from("campaigns")
        .update({
          metadata: {
            error_message: errorMessage,
            failed_at: new Date().toISOString(),
          },
        })
        .eq("id", campaignId);

      if (metadataError) {
        console.error("Failed to update campaign metadata:", metadataError);
      }

      return {
        success: true,
        message: "Campaign marked as failed and credits refunded",
      };
    } catch (error) {
      console.error("Error in failCampaign:", error);
      throw error;
    }
  }

  /**
   * Cancel a campaign (refund credits if needed)
   */
  static async cancelCampaign(
    campaignId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get campaign details
      const { data: campaign, error: campaignError } = await supabaseAdmin
        .from("campaigns")
        .select("id, business_id, credits_used, status")
        .eq("id", campaignId)
        .single();

      if (campaignError || !campaign) {
        throw new Error("Campaign not found");
      }

      if (campaign.status === "completed") {
        throw new Error("Cannot cancel completed campaign");
      }

      // Update campaign status
      const { error: updateError } = await supabaseAdmin
        .from("campaigns")
        .update({ status: "cancelled" })
        .eq("id", campaignId);

      if (updateError) {
        throw new Error(`Failed to cancel campaign: ${updateError.message}`);
      }

      // Refund credits if any were used
      if (campaign.credits_used > 0) {
        await CreditService.addCredits({
          businessId: campaign.business_id,
          amount: campaign.credits_used,
          transactionType: "refund",
          description: `Credit refund for cancelled campaign: ${campaignId}`,
          metadata: {
            campaign_id: campaignId,
            action: "campaign_cancellation_refund",
          },
        });
      }

      return {
        success: true,
        message: "Campaign cancelled and credits refunded",
      };
    } catch (error) {
      console.error("Error in cancelCampaign:", error);
      throw error;
    }
  }

  /**
   * Estimate credit costs based on campaign type and settings
   */
  private static estimateCredits(
    campaignType: "video" | "image" | "script",
    settings?: Json
  ): number {
    const baseCost =
      CREDIT_COSTS[campaignType as keyof typeof CREDIT_COSTS] || 1;

    // Add additional costs based on settings
    let multiplier = 1;

    if (settings) {
      // Example: Higher quality settings cost more

      if (
        typeof settings === "object" &&
        "quality" in settings &&
        settings.quality === "high"
      ) {
        multiplier *= 1.5;
      } else if (
        typeof settings === "object" &&
        "quality" in settings &&
        settings.quality === "premium"
      ) {
        multiplier *= 2;
      }

      // Example: Longer duration costs more for videos
      if (
        campaignType === "video" &&
        typeof settings === "object" &&
        "duration" in settings
      ) {
        const duration = parseInt(settings.duration as string);
        if (duration > 30) {
          multiplier *= 1.5;
        } else if (duration > 60) {
          multiplier *= 2;
        }
      }

      // Example: Higher resolution costs more for images
      if (
        campaignType === "image" &&
        typeof settings === "object" &&
        "resolution" in settings
      ) {
        if (settings.resolution === "4k") {
          multiplier *= 1.5;
        } else if (settings.resolution === "8k") {
          multiplier *= 2;
        }
      }
    }

    return Math.ceil(baseCost * multiplier);
  }

  /**
   * Get campaign analytics for a business
   */
  static async getCampaignAnalytics(businessId: string, days: number = 30) {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const { data: campaigns, error } = await supabaseAdmin
        .from("campaigns")
        .select(
          "id, status, campaign_type, credits_used, created_at, completed_at"
        )
        .eq("business_id", businessId)
        .gte("created_at", fromDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch campaign analytics: ${error.message}`);
      }

      // Calculate analytics
      const totalCampaigns = campaigns?.length || 0;
      const completedCampaigns =
        campaigns?.filter((c) => c.status === "completed").length || 0;
      const totalCreditsUsed =
        campaigns?.reduce((sum, c) => sum + (c.credits_used || 0), 0) || 0;

      const statusDistribution =
        campaigns?.reduce((acc, campaign) => {
          acc[campaign.status] = (acc[campaign.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

      const typeDistribution =
        campaigns?.reduce((acc, campaign) => {
          acc[campaign.campaign_type] = (acc[campaign.campaign_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

      return {
        totalCampaigns,
        completedCampaigns,
        completionRate:
          totalCampaigns > 0
            ? ((completedCampaigns / totalCampaigns) * 100).toFixed(1)
            : "0",
        totalCreditsUsed,
        statusDistribution,
        typeDistribution,
        campaigns: campaigns || [],
      };
    } catch (error) {
      console.error("Error in getCampaignAnalytics:", error);
      throw error;
    }
  }
}
