import { Request, Response } from "express";
import { BusinessService } from "../services/businessService";
import { AuthService } from "../services/authService";
import {
  BusinessUpdateRequest,
  OnboardingStep1Data,
  BusinessOnboardingData,
} from "../types/business";
import { asyncHandler, ValidationError } from "../middleware/errorHandler";

const businessService = new BusinessService();
const authService = new AuthService();

export const getBusiness = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError("User ID not found");
    }

    const business = await businessService.getBusinessByUserId(userId);

    res.status(200).json({
      success: true,
      message: "Business retrieved successfully",
      data: business,
    });
  }
);

export const updateBusiness = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const updates = req.body;

    if (!userId) {
      throw new ValidationError("User ID not found");
    }

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.user_id;
    delete updates.created_at;
    delete updates.updated_at;

    const business = await businessService.updateBusiness(userId, updates);

    res.status(200).json({
      success: true,
      message: "Business updated successfully",
      data: business,
    });
  }
);

export const updateOnboardingStep = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { step, data }: BusinessUpdateRequest = req.body;

    if (!userId) {
      throw new ValidationError("User ID not found");
    }

    if (!step || !data) {
      throw new ValidationError("Step and data are required");
    }

    if (step < 1 || step > 7) {
      throw new ValidationError("Step must be between 1 and 7");
    }

    // Validate step data
    await businessService.validateStepData(step, data);

    // For step 1, update user profile as well
    if (step === 1) {
      const step1Data = data as OnboardingStep1Data;
      if (step1Data.first_name || step1Data.last_name) {
        await authService.updateUser(userId, {
          first_name: step1Data.first_name,
          last_name: step1Data.last_name,
        });
      }
    }

    const business = await businessService.updateOnboardingStep(
      userId,
      step,
      data
    );

    res.status(200).json({
      success: true,
      message: `Onboarding step ${step} completed successfully`,
      data: business,
    });
  }
);

export const getOnboardingProgress = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError("User ID not found");
    }

    const progress = await businessService.getOnboardingProgress(userId);

    res.status(200).json({
      success: true,
      message: "Onboarding progress retrieved successfully",
      data: progress,
    });
  }
);

export const skipOnboardingStep = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { step } = req.body;

    if (!userId) {
      throw new ValidationError("User ID not found");
    }

    // Get current business or create minimal one
    let business = await businessService.getBusinessByUserId(userId);

    if (!business) {
      business = await businessService.createBusiness({
        user_id: userId,
        onboarding_step: step + 1,
      });
    } else {
      business = await businessService.updateBusiness(userId, {
        onboarding_step: Math.max(business.onboarding_step || 1, step + 1),
      });
    }

    res.status(200).json({
      success: true,
      message: `Onboarding step ${step} skipped`,
      data: business,
    });
  }
);

export const completeOnboarding = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { businessData }: { businessData?: BusinessOnboardingData } =
      req.body;

    if (!userId) {
      throw new ValidationError("User ID not found");
    }

    let business;

    // If business data is provided, create or update business first
    if (businessData && Object.keys(businessData).length > 0) {
      business = await businessService.createOrUpdateBusiness(userId, {
        ...businessData,
        onboarding_completed: true,
        onboarding_step: 8, // Beyond the last step
      });
    } else {
      // Just mark onboarding as completed without business data
      business = await businessService.updateBusiness(userId, {
        onboarding_completed: true,
        onboarding_step: 8, // Beyond the last step
      });
    }

    // Also update user onboarding status
    await authService.updateUser(userId, {
      onboarding_completed: true,
    });

    res.status(200).json({
      success: true,
      message: "Onboarding completed successfully",
      data: {
        progress: {
          current_step: 8,
          completed: true,
        },
        business,
      },
    });
  }
);
