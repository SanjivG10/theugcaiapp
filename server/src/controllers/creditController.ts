import { Request, Response } from "express";
import { CreditService } from "../services/creditService";
import {
  CREDIT_COSTS,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
} from "../config/credits";
import { BusinessService } from "../services/businessService";

const businessService = new BusinessService();

export class CreditController {
  /**
   * Get current credit balance and subscription info
   */
  static async getCredits(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error("User ID not found");
      }
      const business = await businessService.getBusinessByUserId(userId);
      if (!business?.id) {
        throw new Error("Business ID not found");
      }

      const credits = await CreditService.getBusinessCredits(business.id);

      res.json({
        success: true,
        data: credits,
      });
    } catch (error) {
      console.error("Get credits error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get credits",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get credit transaction history
   */
  static async getCreditHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error("User ID not found");
      }
      const business = await businessService.getBusinessByUserId(userId);
      if (!business?.id) {
        throw new Error("Business ID not found");
      }
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const history = await CreditService.getCreditHistory(
        business.id,
        limit,
        offset
      );

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      console.error("Get credit history error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get credit history",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Create checkout session for credit purchase
   */
  static async createCreditPurchaseSession(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error("User ID not found");
      }
      const business = await businessService.getBusinessByUserId(userId);
      if (!business?.id) {
        throw new Error("Business ID not found");
      }
      const { credits, successUrl, cancelUrl } = req.body;

      if (!credits || credits <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid credit amount",
        });
      }

      if (!successUrl || !cancelUrl) {
        return res.status(400).json({
          success: false,
          message: "Success and cancel URLs are required",
        });
      }

      const session = await CreditService.createCreditPurchaseSession(
        business.id,
        credits,
        successUrl,
        cancelUrl
      );

      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      console.error("Create credit purchase session error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create checkout session",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Create checkout session for subscription
   */
  static async createSubscriptionSession(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error("User ID not found");
      }
      const business = await businessService.getBusinessByUserId(userId);
      if (!business?.id) {
        throw new Error("Business ID not found");
      }
      const { subscriptionPlan, successUrl, cancelUrl } = req.body;

      if (
        !subscriptionPlan ||
        !SUBSCRIPTION_PLANS[subscriptionPlan as SubscriptionPlan]
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid subscription plan",
        });
      }

      if (!successUrl || !cancelUrl) {
        return res.status(400).json({
          success: false,
          message: "Success and cancel URLs are required",
        });
      }

      const session = await CreditService.createSubscriptionSession(
        business.id,
        subscriptionPlan as SubscriptionPlan,
        successUrl,
        cancelUrl
      );

      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      console.error("Create subscription session error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create subscription session",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Check if user has sufficient credits for an action
   */
  static async checkCredits(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error("User ID not found");
      }
      const business = await businessService.getBusinessByUserId(userId);
      if (!business?.id) {
        throw new Error("Business ID not found");
      }
      const { action } = req.body;

      if (!action) {
        return res.status(400).json({
          success: false,
          message: "Action is required",
        });
      }

      const hasSufficient = await CreditService.hasSufficientCredits(
        business.id,
        action
      );
      const credits = await CreditService.getBusinessCredits(business.id);

      res.json({
        success: true,
        data: {
          hasSufficientCredits: hasSufficient,
          currentCredits: credits.credits,
          requiredCredits: CREDIT_COSTS[action as keyof typeof CREDIT_COSTS],
        },
      });
    } catch (error) {
      console.error("Check credits error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to check credits",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Consume credits for an action
   */
  static async consumeCredits(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error("User ID not found");
      }
      const business = await businessService.getBusinessByUserId(userId);
      if (!business?.id) {
        throw new Error("Business ID not found");
      }
      const { action, metadata } = req.body;

      if (!action) {
        return res.status(400).json({
          success: false,
          message: "Action is required",
        });
      }

      const newBalance = await CreditService.consumeCredits(
        business.id,
        action,
        userId,
        metadata
      );

      res.json({
        success: true,
        data: {
          newBalance,
          creditsConsumed: CREDIT_COSTS[action as keyof typeof CREDIT_COSTS],
        },
      });
    } catch (error) {
      console.error("Consume credits error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to consume credits",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get credit usage analytics
   */
  static async getCreditAnalytics(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error("User ID not found");
      }
      const business = await businessService.getBusinessByUserId(userId);
      if (!business?.id) {
        throw new Error("Business ID not found");
      }
      const days = parseInt(req.query.days as string) || 30;

      const analytics = await CreditService.getCreditAnalytics(
        business.id,
        days
      );

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error("Get credit analytics error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get credit analytics",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Create Stripe billing portal session
   */
  static async createBillingPortalSession(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error("User ID not found");
      }
      const business = await businessService.getBusinessByUserId(userId);
      if (!business?.id) {
        throw new Error("Business ID not found");
      }

      const { returnUrl } = req.body;

      if (!returnUrl) {
        return res.status(400).json({
          success: false,
          message: "Return URL is required",
        });
      }

      const session = await CreditService.createBillingPortalSession(
        business.id,
        returnUrl
      );

      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      console.error("Create billing portal session error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create billing portal session",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get available subscription plans
   */
  static async getSubscriptionPlans(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        data: SUBSCRIPTION_PLANS,
      });
    } catch (error) {
      console.error("Get subscription plans error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get subscription plans",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
