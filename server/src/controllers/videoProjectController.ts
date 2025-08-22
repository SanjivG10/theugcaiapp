import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { z } from "zod";
import { VideoProject, VideoProjectInsert, ApiResponse, PaginatedResponse } from "../types/database";

const createVideoProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  prompt: z.string().optional(),
  ai_provider: z.string().optional(),
  generation_params: z.record(z.unknown()).optional(),
  template_id: z.string().uuid().optional(),
});

const updateVideoProjectSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  prompt: z.string().optional(),
  status: z.enum(["draft", "generating", "completed", "failed"]).optional(),
  ai_provider: z.string().optional(),
  generation_params: z.record(z.unknown()).optional(),
  generation_cost: z.number().optional(),
  video_url: z.string().url().optional(),
  thumbnail_url: z.string().url().optional(),
  duration: z.number().optional(),
  template_id: z.string().uuid().optional(),
});

export class VideoProjectController {
  static async getVideoProjects(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { 
        page = 1, 
        limit = 10, 
        status, 
        search 
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      // Build the query
      let query = supabaseAdmin
        .from("video_projects")
        .select(`
          *,
          businesses(name),
          templates(name, category)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // Apply filters
      if (status) {
        query = query.eq("status", status);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%, description.ilike.%${search}%`);
      }

      // Get total count
      const { count } = await query.select("*", { count: "exact", head: true });

      // Get paginated results
      const { data: projects, error } = await query
        .range(offset, offset + Number(limit) - 1);

      if (error) {
        console.error("Error fetching video projects:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch video projects",
          error: error.message,
        });
      }

      const response: ApiResponse<PaginatedResponse<VideoProject>> = {
        success: true,
        data: {
          data: projects || [],
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
      console.error("Error in getVideoProjects:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async getVideoProjectById(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { data: project, error } = await supabaseAdmin
        .from("video_projects")
        .select(`
          *,
          businesses(name, id),
          templates(name, category, description)
        `)
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (error || !project) {
        return res.status(404).json({
          success: false,
          message: "Video project not found",
        });
      }

      const response: ApiResponse<VideoProject> = {
        success: true,
        data: project,
      };

      return res.json(response);
    } catch (error) {
      console.error("Error in getVideoProjectById:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async createVideoProject(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const validation = createVideoProjectSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid input",
          error: validation.error.errors,
        });
      }

      const projectData = validation.data;

      // Get user's business
      const { data: businessUser, error: businessError } = await supabaseAdmin
        .from("business_users")
        .select("business_id")
        .eq("user_id", userId)
        .single();

      const insertData: VideoProjectInsert = {
        ...projectData,
        user_id: userId,
        business_id: businessUser?.business_id || null,
        status: "draft",
        view_count: 0,
        download_count: 0,
      };

      const { data: project, error } = await supabaseAdmin
        .from("video_projects")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("Error creating video project:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to create video project",
          error: error.message,
        });
      }

      const response: ApiResponse<VideoProject> = {
        success: true,
        data: project,
      };

      return res.status(201).json(response);
    } catch (error) {
      console.error("Error in createVideoProject:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async updateVideoProject(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const validation = updateVideoProjectSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid input",
          error: validation.error.errors,
        });
      }

      const updateData = validation.data;

      // Check if project exists and belongs to user
      const { data: existingProject, error: fetchError } = await supabaseAdmin
        .from("video_projects")
        .select("id, status")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (fetchError || !existingProject) {
        return res.status(404).json({
          success: false,
          message: "Video project not found",
        });
      }

      const { data: updatedProject, error: updateError } = await supabaseAdmin
        .from("video_projects")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating video project:", updateError);
        return res.status(500).json({
          success: false,
          message: "Failed to update video project",
          error: updateError.message,
        });
      }

      const response: ApiResponse<VideoProject> = {
        success: true,
        data: updatedProject,
      };

      return res.json(response);
    } catch (error) {
      console.error("Error in updateVideoProject:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async deleteVideoProject(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Check if project exists and belongs to user
      const { data: existingProject, error: fetchError } = await supabaseAdmin
        .from("video_projects")
        .select("id, status")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (fetchError || !existingProject) {
        return res.status(404).json({
          success: false,
          message: "Video project not found",
        });
      }

      // Prevent deletion of projects that are currently generating
      if (existingProject.status === "generating") {
        return res.status(400).json({
          success: false,
          message: "Cannot delete project that is currently generating",
        });
      }

      const { error } = await supabaseAdmin
        .from("video_projects")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting video project:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to delete video project",
          error: error.message,
        });
      }

      const response: ApiResponse<null> = {
        success: true,
        message: "Video project deleted successfully",
      };

      return res.json(response);
    } catch (error) {
      console.error("Error in deleteVideoProject:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async incrementViewCount(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const { error } = await supabaseAdmin
        .from("video_projects")
        .update({ 
          view_count: supabaseAdmin.sql`view_count + 1` 
        })
        .eq("id", id);

      if (error) {
        console.error("Error incrementing view count:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to increment view count",
        });
      }

      const response: ApiResponse<null> = {
        success: true,
        message: "View count updated",
      };

      return res.json(response);
    } catch (error) {
      console.error("Error in incrementViewCount:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async incrementDownloadCount(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const { error } = await supabaseAdmin
        .from("video_projects")
        .update({ 
          download_count: supabaseAdmin.sql`download_count + 1` 
        })
        .eq("id", id);

      if (error) {
        console.error("Error incrementing download count:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to increment download count",
        });
      }

      const response: ApiResponse<null> = {
        success: true,
        message: "Download count updated",
      };

      return res.json(response);
    } catch (error) {
      console.error("Error in incrementDownloadCount:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}