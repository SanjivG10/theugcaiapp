import { supabaseAdmin } from "../config/supabase";
import { NotFoundError, ValidationError } from "../middleware/errorHandler";
import {
  BusinessData,
  OnboardingStepData,
  OnboardingProgress,
  OnboardingStep1Data,
  OnboardingStep2Data,
  OnboardingStep3Data,
  OnboardingStep4Data,
} from "../types/business";

export class BusinessService {
  async createBusiness(
    businessData: Partial<BusinessData>
  ): Promise<BusinessData> {
    try {
      const { data, error } = await supabaseAdmin
        .from("businesses")
        .insert({
          ...businessData,
          onboarding_step: 1,
          onboarding_completed: false,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create business: ${error.message}`);
      }

      return data as BusinessData;
    } catch (error) {
      throw new Error(
        `Create business failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getBusinessByUserId(userId: string): Promise<BusinessData | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from("businesses")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "not found"
        throw new Error(`Failed to get business: ${error.message}`);
      }

      return data as BusinessData | null;
    } catch (error) {
      console.error("Get business by user ID error:", error);
      return null;
    }
  }

  async updateBusiness(
    userId: string,
    updates: Partial<BusinessData>
  ): Promise<BusinessData> {
    try {
      // Check if business exists
      const existingBusiness = await this.getBusinessByUserId(userId);
      if (!existingBusiness) {
        throw new NotFoundError("Business not found");
      }

      const { data, error } = await supabaseAdmin
        .from("businesses")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("is_active", true)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update business: ${error.message}`);
      }

      return data as BusinessData;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(
        `Update business failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async updateOnboardingStep(
    userId: string,
    step: number,
    stepData: OnboardingStepData
  ): Promise<BusinessData> {
    try {
      let business = await this.getBusinessByUserId(userId);

      if (!business) {
        // Create new business if it doesn't exist
        business = await this.createBusiness({
          user_id: userId,
          onboarding_step: step,
          ...this.mapStepDataToBusiness(step, stepData),
        });
      } else {
        // Update existing business
        const updateData = {
          onboarding_step: Math.max(business.onboarding_step || 1, step),
          ...this.mapStepDataToBusiness(step, stepData),
        };

        // Mark as completed if this is the final step
        if (step >= 4) {
          updateData.onboarding_completed = true;

          // Also update user onboarding status
          await supabaseAdmin
            .from("users")
            .update({ onboarding_completed: true })
            .eq("id", userId);
        }

        business = await this.updateBusiness(userId, updateData);
      }

      return business;
    } catch (error) {
      throw new Error(
        `Update onboarding step failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private mapStepDataToBusiness(
    step: number,
    stepData: OnboardingStepData
  ): Partial<BusinessData> {
    const mapped: Partial<BusinessData> = {};

    switch (step) {
      case 1:
        // Personal information is stored in users table, not business table
        break;

      case 2: {
        const data = stepData as OnboardingStep2Data;
        mapped.business_name = data.business_name;
        mapped.business_type = data.business_type;
        mapped.business_size = data.business_size;
        if (data.industry) mapped.industry = data.industry;
        break;
      }

      case 3: {
        const data = stepData as OnboardingStep3Data;
        if (data.website_url) mapped.website_url = data.website_url;
        if (data.business_phone) mapped.business_phone = data.business_phone;
        if (data.business_address)
          mapped.business_address = data.business_address;
        if (data.social_media_urls)
          mapped.social_media_urls = data.social_media_urls;
        break;
      }

      case 4: {
        const data = stepData as OnboardingStep4Data;
        mapped.how_heard_about_us = data.how_heard_about_us;
        if (data.referral_source) mapped.referral_source = data.referral_source;
        break;
      }
    }

    return mapped;
  }

  async getOnboardingProgress(userId: string): Promise<OnboardingProgress> {
    try {
      const business = await this.getBusinessByUserId(userId);

      if (!business) {
        return {
          current_step: 1,
          completed: false,
        };
      }

      return {
        current_step: business.onboarding_step || 1,
        completed: business.onboarding_completed || false,
        business_data: business,
      };
    } catch (error) {
      throw new Error(
        `Get onboarding progress failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async validateStepData(
    step: number,
    data: OnboardingStepData
  ): Promise<void> {
    // Basic validation for each step
    switch (step) {
      case 1: {
        const stepData = data as OnboardingStep1Data;
        if (!stepData.first_name) {
          throw new ValidationError("First name is required");
        }
        if (!stepData.last_name) {
          throw new ValidationError("Last name is required");
        }
        break;
      }

      case 2: {
        const stepData = data as OnboardingStep2Data;
        if (!stepData.business_name) {
          throw new ValidationError("Business name is required");
        }
        if (!stepData.business_type) {
          throw new ValidationError("Business type is required");
        }
        if (!stepData.business_size) {
          throw new ValidationError("Business size is required");
        }
        break;
      }

      case 3: {
        // Step 3 is optional - no required validation
        break;
      }

      case 4: {
        const stepData = data as OnboardingStep4Data;
        if (!stepData.how_heard_about_us) {
          throw new ValidationError("Please tell us how you heard about us");
        }
        break;
      }
    }
  }

  async createOrUpdateBusiness(
    userId: string,
    businessData: Partial<BusinessData>
  ): Promise<BusinessData> {
    try {
      const existingBusiness = await this.getBusinessByUserId(userId);
      
      if (existingBusiness) {
        // Update existing business
        return await this.updateBusiness(userId, businessData);
      } else {
        // Create new business
        return await this.createBusiness({
          ...businessData,
          user_id: userId,
        });
      }
    } catch (error) {
      throw new Error(
        `Create or update business failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
