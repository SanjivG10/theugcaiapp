import { supabaseAdmin } from "../config/supabase";
import { Request, Response } from "express";
import { Feedback, FeedbackInsert, ApiResponse } from "../types/database";

export interface FeedbackData {
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

export const submitFeedback = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      subject,
      message,
      feedback_type,
      priority,
    }: FeedbackData = req.body;
    const userId = req.user?.id;

    // Validation
    if (!name || !email || !subject || !message || !feedback_type) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Get user's business ID if they have one
    let businessId = null;
    if (userId) {
      const { data: businessData, error: businessError } = await supabaseAdmin
        .from("businesses")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!businessError && businessData) {
        businessId = businessData.id;
      }
    }

    // Insert feedback into database
    const insertData: FeedbackInsert = {
      user_id: userId,
      business_id: businessId,
      name,
      email,
      subject,
      message,
      feedback_type,
      priority: priority || "medium",
      status: "pending",
    };

    const { data, error } = await supabaseAdmin
      .from("feedback")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error inserting feedback:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to submit feedback",
      });
    }

    // TODO: Send notification email to support team
    // TODO: Send confirmation email to user

    const response: ApiResponse<{ id: string; status: string | null }> = {
      success: true,
      message: "Feedback submitted successfully",
      data: {
        id: data.id,
        status: data.status || "pending",
      },
    };

    return res.status(201).json(response);
  } catch (error) {
    console.error("Error in submitFeedback:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
