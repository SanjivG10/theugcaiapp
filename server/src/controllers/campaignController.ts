import { Request, Response } from "express";
import { CampaignService } from "../services/campaignService";
import { openaiService } from "../services/openaiService";
import { Campaign, ApiResponse, PaginatedResponse } from "../types/database";
import { z } from "zod";
import { supabaseAdmin } from "../config/supabase";
import { CreditService } from "../services/creditService";
import { v4 as uuidv4 } from "uuid";

// Type for campaign with business information
type CampaignWithBusiness = Campaign & {
  businesses: {
    name: string;
  } | null;
};

const createCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  scene_number: z.number().int().min(1),
});

const updateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z
    .enum(["draft", "in_progress", "completed", "failed", "cancelled"])
    .optional(),
  output_urls: z.array(z.string()).optional(),
  credits_used: z.number().int().min(0).optional(),
  metadata: z.record(z.any(), z.any()).optional(),
  script: z
    .object({
      tone: z.string().optional(),
      style: z.string().optional(),
      prompt: z.string().optional(),
    })
    .optional(),
  scene_data: z
    .array(
      z.object({
        scene_number: z.number().int().min(1),
        scene_script: z.string().optional(),
        audio: z
          .object({
            previewUrl: z.string().optional(),
            id: z.string().optional(),
            metadata: z.record(z.string(), z.any()).optional(),
          })
          .optional(),
        image: z
          .object({
            name: z.string().optional(),
            url: z.string().optional(),
            isProcessing: z.boolean().optional(),
          })
          .optional(),
        video: z
          .object({
            prompt: z.string().optional(),
            url: z.string().optional(),
            isProcessing: z.boolean().optional(),
          })
          .optional(),
      })
    )
    .optional(),
});

const updateCampaignProgressSchema = z.object({
  campaignId: z.string(),
  current_step: z.number().int().min(1).max(5),
});

const saveCampaignSettingsSchema = z.object({
  settings: z.record(z.any(), z.any()),
});

const saveCampaignStepDataSchema = z.object({
  step: z.number().int().min(1).max(7),
  stepData: z.record(z.any(), z.any()),
});

const generateScriptSchema = z.object({
  campaignId: z.string(),
  sceneNumber: z.number().int().min(1).optional(), // Optional for batch generation
  productName: z.string().min(1),
  objective: z.string().min(1),
  tone: z.string().min(1),
  style: z.string().min(1),
  customPrompt: z.string().optional(),
  totalScenes: z.number().int().min(1),
});

const generateImageSchema = z.object({
  campaignId: z.string(),
  sceneNumber: z.number().int().min(1),
  scriptText: z.string().min(1),
  imageUrls: z.array(z.string()),
  imageDescription: z.string().optional(),
});

export class CampaignController {
  static async getCampaigns(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { page = 1, limit = 10, status, campaign_type, search } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      // Build the query
      let query = supabaseAdmin
        .from("campaigns")
        .select(
          `
          *,
          businesses!inner(name)
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // Apply filters
      if (status) {
        query = query.eq("status", status);
      }

      if (campaign_type) {
        query = query.eq("campaign_type", campaign_type);
      }

      if (search) {
        query = query.or(
          `name.ilike.%${search}%, description.ilike.%${search}%`
        );
      }

      // Get total count
      const { count } = await query.select("*");

      // Get paginated results
      const { data: campaigns, error } = await query.range(
        offset,
        offset + Number(limit) - 1
      );

      if (error) {
        console.error("Error fetching campaigns:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch campaigns",
          error: error.message,
        });
      }

      const response: ApiResponse<PaginatedResponse<CampaignWithBusiness>> = {
        success: true,
        data: {
          data: campaigns || [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: count || 0,
            totalPages: Math.ceil((count || 0) / Number(limit)),
          },
        },
      };

      return res.json(response);
    } catch (error) {
      console.error("Error in getCampaigns:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async getCampaignById(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      console.log({
        userId,
        id,
      });

      const { data: campaign, error } = await supabaseAdmin
        .from("campaigns")
        .select("*, scene_data")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (error || !campaign) {
        return res.status(404).json({
          success: false,
          message: error?.message || "Campaign not found",
        });
      }

      const response: ApiResponse<Campaign> = {
        success: true,
        data: campaign,
      };

      return res.json(response);
    } catch (error) {
      console.error("Error in getCampaignById:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async createCampaign(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const validation = createCampaignSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid input",
          errors: validation.error,
        });
      }

      const campaignData = validation.data;

      // Get user's business
      const { data: business, error: businessError } = await supabaseAdmin
        .from("businesses")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (businessError || !business) {
        return res.status(404).json({
          success: false,
          message: "Business not found",
        });
      }

      // Create campaign using service
      const campaign = await CampaignService.createCampaign({
        ...campaignData,
        business_id: business.id,
        user_id: userId,
      });

      const response: ApiResponse<Campaign> = {
        success: true,
        data: campaign,
      };

      return res.status(201).json(response);
    } catch (error) {
      console.error("Error in createCampaign:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async updateCampaign(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const validation = updateCampaignSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid input",
          errors: validation.error,
        });
      }

      const updateData = validation.data;

      // Check if campaign exists and belongs to user
      const { data: existingCampaign, error: fetchError } = await supabaseAdmin
        .from("campaigns")
        .select("id, status, credits_used")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (fetchError || !existingCampaign) {
        return res.status(404).json({
          success: false,
          message: "Campaign not found",
        });
      }

      // If status is being updated, use the database function for proper credit handling
      if (updateData.status && updateData.status !== existingCampaign.status) {
        const { error: statusUpdateError } = await supabaseAdmin
          .from("campaigns")
          .update({
            status: updateData.status,
            credits_used: updateData.credits_used || null,
            output_urls: updateData.output_urls || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("user_id", userId);

        if (statusUpdateError) {
          console.error("Error updating campaign status:", statusUpdateError);
          return res.status(500).json({
            success: false,
            message: "Failed to update campaign status",
            error: statusUpdateError.message,
          });
        }

        // Remove status-related fields from updateData since they're handled by the function
        const otherUpdates = { ...updateData };
        delete otherUpdates.status;
        delete otherUpdates.credits_used;
        delete otherUpdates.output_urls;

        // Update any remaining fields
        if (Object.keys(otherUpdates).length > 0) {
          const { error: updateError } = await supabaseAdmin
            .from("campaigns")
            .update({
              ...otherUpdates,
              updated_at: new Date().toISOString(),
            })
            .eq("id", id);

          if (updateError) {
            console.error("Error updating campaign:", updateError);
            return res.status(500).json({
              success: false,
              message: "Failed to update campaign",
              error: updateError.message,
            });
          }
        }
      } else {
        // Regular update without status change
        const { error: updateError } = await supabaseAdmin
          .from("campaigns")
          .update({
            ...updateData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);

        if (updateError) {
          console.error("Error updating campaign:", updateError);
          return res.status(500).json({
            success: false,
            message: "Failed to update campaign",
            error: updateError.message,
          });
        }
      }

      // Fetch updated campaign
      const { data: updatedCampaign, error: fetchUpdatedError } =
        await supabaseAdmin.from("campaigns").select("*").eq("id", id).single();

      if (fetchUpdatedError) {
        console.error("Error fetching updated campaign:", fetchUpdatedError);
        return res.status(500).json({
          success: false,
          message: "Campaign updated but failed to fetch updated data",
        });
      }

      const response: ApiResponse<Campaign> = {
        success: true,
        data: updatedCampaign,
      };

      return res.json(response);
    } catch (error) {
      console.error("Error in updateCampaign:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async deleteCampaign(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Check if campaign exists and belongs to user
      const { data: existingCampaign, error: fetchError } = await supabaseAdmin
        .from("campaigns")
        .select("id, status")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (fetchError || !existingCampaign) {
        return res.status(404).json({
          success: false,
          message: "Campaign not found",
        });
      }

      // Prevent deletion of campaigns that are currently in progress
      if (existingCampaign.status === "in_progress") {
        return res.status(400).json({
          success: false,
          message: "Cannot delete campaign that is currently in progress",
        });
      }

      const { error } = await supabaseAdmin
        .from("campaigns")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting campaign:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to delete campaign",
          error: error.message,
        });
      }

      const response: ApiResponse<null> = {
        success: true,
        message: "Campaign deleted successfully",
      };

      return res.json(response);
    } catch (error) {
      console.error("Error in deleteCampaign:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async getCampaignStats(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Get campaign statistics
      const { data: stats, error } = await supabaseAdmin
        .from("campaigns")
        .select("status, credits_used")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching campaign stats:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch campaign statistics",
          error: error.message,
        });
      }

      // Calculate statistics
      const totalCampaigns = stats?.length || 0;
      const totalCreditsUsed =
        stats?.reduce(
          (sum, campaign) => sum + (campaign.credits_used || 0),
          0
        ) || 0;

      const statusCounts =
        stats?.reduce((acc, campaign) => {
          acc[campaign.status] = (acc[campaign.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

      return res.json({
        success: true,
        data: {
          totalCampaigns,
          totalCreditsUsed,
          statusCounts,
          completionRate:
            totalCampaigns > 0
              ? (
                  ((statusCounts.completed || 0) / totalCampaigns) *
                  100
                ).toFixed(1)
              : "0",
        },
      });
    } catch (error) {
      console.error("Error in getCampaignStats:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async startCampaign(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Check if campaign belongs to user
      const { data: campaign, error: fetchError } = await supabaseAdmin
        .from("campaigns")
        .select("id, status")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (fetchError || !campaign) {
        return res.status(404).json({
          success: false,
          message: "Campaign not found",
        });
      }

      const result = await CampaignService.startCampaign(id);

      return res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("Error in startCampaign:", error);
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  static async completeCampaign(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { output_urls, thumbnail_url, actual_credits_used, metadata } =
        req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Check if campaign belongs to user
      const { data: campaign, error: fetchError } = await supabaseAdmin
        .from("campaigns")
        .select("id, status")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (fetchError || !campaign) {
        return res.status(404).json({
          success: false,
          message: "Campaign not found",
        });
      }

      const result = await CampaignService.completeCampaign({
        campaign_id: id,
        output_urls,
        thumbnail_url,
        actual_credits_used,
        metadata,
      });

      return res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("Error in completeCampaign:", error);
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  static async failCampaign(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { error_message } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Check if campaign belongs to user
      const { data: campaign, error: fetchError } = await supabaseAdmin
        .from("campaigns")
        .select("id, status")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (fetchError || !campaign) {
        return res.status(404).json({
          success: false,
          message: "Campaign not found",
        });
      }

      const result = await CampaignService.failCampaign(id, error_message);

      return res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("Error in failCampaign:", error);
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  static async cancelCampaign(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Check if campaign belongs to user
      const { data: campaign, error: fetchError } = await supabaseAdmin
        .from("campaigns")
        .select("id, status")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (fetchError || !campaign) {
        return res.status(404).json({
          success: false,
          message: "Campaign not found",
        });
      }

      const result = await CampaignService.cancelCampaign(id);

      return res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("Error in cancelCampaign:", error);
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  static async getCampaignAnalytics(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { days = 30 } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Get user's business
      const { data: businessUser, error: businessError } = await supabaseAdmin
        .from("business_users")
        .select("business_id")
        .eq("user_id", userId)
        .single();

      if (businessError || !businessUser) {
        return res.status(404).json({
          success: false,
          message: "Business not found",
        });
      }

      const analytics = await CampaignService.getCampaignAnalytics(
        businessUser.business_id,
        Number(days)
      );

      return res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error("Error in getCampaignAnalytics:", error);
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  static async saveCampaignSettings(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const validation = saveCampaignSettingsSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid input",
          errors: validation.error,
        });
      }

      const { settings } = validation.data;

      // Check if campaign exists and belongs to user
      const { data: existingCampaign, error: fetchError } = await supabaseAdmin
        .from("campaigns")
        .select("id, settings")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (fetchError || !existingCampaign) {
        return res.status(404).json({
          success: false,
          message: "Campaign not found",
        });
      }

      // Merge with existing settings
      const mergedSettings = {
        ...((existingCampaign.settings as Record<string, string>) || {}),
        ...settings,
      };

      // Update campaign settings
      const { data: updatedCampaign, error: updateError } = await supabaseAdmin
        .from("campaigns")
        .update({
          settings: mergedSettings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating campaign settings:", updateError);
        return res.status(500).json({
          success: false,
          message: "Failed to update campaign settings",
          error: updateError.message,
        });
      }

      const response: ApiResponse<Campaign> = {
        success: true,
        data: updatedCampaign,
      };

      return res.json(response);
    } catch (error) {
      console.error("Error in saveCampaignSettings:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async saveCampaignStepData(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const validation = saveCampaignStepDataSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid input",
          errors: validation.error,
        });
      }

      const { step, stepData } = validation.data;

      // Check if campaign exists and belongs to user
      const { data: existingCampaign, error: fetchError } = await supabaseAdmin
        .from("campaigns")
        .select("id, step_data")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (fetchError || !existingCampaign) {
        return res.status(404).json({
          success: false,
          message: "Campaign not found",
        });
      }

      // Merge with existing step data
      const currentStepData =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (existingCampaign.step_data as Record<string, any>) || {};

      const mergedStepData = {
        ...currentStepData,
        [`step_${step}`]: {
          ...((currentStepData[`step_${step}`] as Record<string, string>) ||
            {}),
          ...stepData,
        },
      };

      // Update campaign step data
      const { data: updatedCampaign, error: updateError } = await supabaseAdmin
        .from("campaigns")
        .update({
          step_data: mergedStepData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating campaign step data:", updateError);
        return res.status(500).json({
          success: false,
          message: "Failed to update campaign step data",
          error: updateError.message,
        });
      }

      const response: ApiResponse<Campaign> = {
        success: true,
        data: updatedCampaign,
      };

      return res.json(response);
    } catch (error) {
      console.error("Error in saveCampaignStepData:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async generateScript(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const validation = generateScriptSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid input",
          errors: validation.error,
        });
      }

      const {
        campaignId,
        productName,
        objective,
        tone,
        style,
        customPrompt,
        totalScenes,
      } = validation.data;

      // Check if campaign exists and belongs to user
      const { data: campaign, error: fetchError } = await supabaseAdmin
        .from("campaigns")
        .select("id, name, scene_data, business_id")
        .eq("id", campaignId)
        .eq("user_id", userId)
        .single();

      if (fetchError || !campaign) {
        return res.status(404).json({
          success: false,
          message: fetchError?.message || "Campaign not found",
        });
      }

      // Set up SSE headers for streaming
      res.writeHead(200, {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      });

      try {
        // Consume credits first (once for all scenes)
        try {
          await CreditService.consumeCredits(
            campaign.business_id,
            "VIDEO_SCRIPT_GENERATION",
            userId,
            {
              campaign_id: campaignId,
              total_scenes: totalScenes,
            }
          );
        } catch (creditError) {
          console.error("Error consuming credits:", creditError);
          return res.status(400).json({
            success: false,
            message: "Insufficient credits",
          });
        }

        // Generate script using OpenAI streaming
        const stream = await openaiService.generateScript({
          productName,
          campaignName: campaign.name,
          objective,
          tone,
          style,
          totalScenes,
          customPrompt: customPrompt?.trim(),
        });

        let generatedScripts = "";
        for await (const chunk of stream) {
          if (chunk.type === "response.output_text.delta") {
            const content = chunk.delta;
            if (content) {
              generatedScripts += content;
              res.write(content);
            }
          }
        }

        res.end();
      } catch (error) {
        console.error("Error generating script:", error);
        res.write("\n\nError generating script. Please try again.");
        res.end();
      }
    } catch (error) {
      console.error("Error in generateScript:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async generateImage(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const validation = generateImageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid input",
          errors: validation.error,
        });
      }

      const {
        campaignId,
        sceneNumber,
        scriptText,
        imageUrls,
        imageDescription,
      } = validation.data;

      // Check if campaign exists and belongs to user
      const { data: campaign, error: fetchError } = await supabaseAdmin
        .from("campaigns")
        .select("id, name, scene_data, business_id, settings")
        .eq("id", campaignId)
        .eq("user_id", userId)
        .single();

      if (fetchError || !campaign) {
        return res.status(404).json({
          success: false,
          message: "Campaign not found",
        });
      }

      if (imageUrls.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Selected product images not found",
        });
      }

      try {
        // Generate image using OpenAI DALL-E
        const imageResponse = await openaiService.generateImage({
          scriptText,
          sceneNumber,
          imageDescription,
          imageUrls,
        });

        if (!imageResponse.data || imageResponse.data.length === 0) {
          throw new Error("No image generated");
        }

        const generatedImageUrl = imageResponse.data[0].url;
        const generatedImageBuffer = imageResponse.data?.[0]?.b64_json ?? "";
        if (!generatedImageUrl && !generatedImageBuffer) {
          throw new Error("No images");
        }

        // Download the generated image
        const imageBuffer = generatedImageBuffer
          ? Buffer.from(generatedImageBuffer, "base64")
          : generatedImageUrl
          ? await openaiService.downloadImageAsBuffer(generatedImageUrl)
          : null;

        if (!imageBuffer) {
          throw new Error("No image buffer");
        }

        // Upload to Supabase storage
        const filename = `${userId}/${campaignId}/generated/${uuidv4()}.png`;
        const { error: uploadError } = await supabaseAdmin.storage
          .from("campaigns")
          .upload(filename, imageBuffer, {
            contentType: "image/png",
            upsert: true,
          });

        if (uploadError) {
          console.error("Error uploading generated image:", uploadError);
          throw new Error("Failed to save generated image");
        }

        // Get the public URL
        const {
          data: { publicUrl },
        } = supabaseAdmin.storage.from("campaigns").getPublicUrl(filename);

        // Consume credits for image generation
        try {
          await CreditService.consumeCredits(
            campaign.business_id,
            "IMAGE_GENERATION",
            userId,
            {
              campaign_id: campaignId,
              scene_number: sceneNumber,
              prompt: scriptText,
            }
          );
        } catch (error) {
          console.error("Failed to consume credits:", error);
        }

        // Save the generated image to scene_data
        const currentScenesData =
          (campaign.scene_data as Array<{
            index: number;
            script?: string;
            image_url?: string;
            video_url?: string;
            audio_url?: string;
          }>) || [];

        // Find or create the scene data
        const sceneIndex = currentScenesData.findIndex(
          (s) => s.index === sceneNumber
        );

        if (sceneIndex !== -1) {
          // Update existing scene
          currentScenesData[sceneIndex] = {
            ...currentScenesData[sceneIndex],
            image_url: publicUrl,
          };
        } else {
          // Create new scene data
          currentScenesData.push({
            index: sceneNumber,
            image_url: publicUrl,
          });
        }

        // Sort scenes by index
        currentScenesData.sort((a, b) => a.index - b.index);

        await supabaseAdmin
          .from("campaigns")
          .update({
            scene_data: currentScenesData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", campaignId);

        const generatedImageData = {
          id: filename,
          url: publicUrl,
          prompt: imageResponse.data[0].revised_prompt || scriptText,
          sceneNumber,
          imageUrls,
          createdAt: new Date().toISOString(),
          storagePath: filename,
        };

        return res.json({
          success: true,
          data: generatedImageData,
        });
      } catch (error) {
        console.error("Error generating image:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to generate image",
        });
      }
    } catch (error) {
      console.error("Error in generateImage:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async updateCampaignProgress(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const validation = updateCampaignProgressSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid input",
          errors: validation.error,
        });
      }

      const { campaignId, current_step } = validation.data;

      const { data: campaign, error: fetchError } = await supabaseAdmin
        .from("campaigns")
        .select("id, status")
        .eq("id", campaignId)
        .eq("user_id", userId)
        .single();

      if (fetchError || !campaign) {
        return res.status(404).json({
          success: false,
          message: "Campaign not found",
        });
      }

      const { error: updateError } = await supabaseAdmin
        .from("campaigns")
        .update({ current_step })
        .eq("id", campaign.id);

      if (updateError) {
        return res.status(500).json({
          success: false,
          message: "Failed to update campaign progress",
        });
      }

      return res.json({
        success: true,
        message: "Campaign progress updated",
      });
    } catch (error) {
      console.error("Error in updateCampaignProgress:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
