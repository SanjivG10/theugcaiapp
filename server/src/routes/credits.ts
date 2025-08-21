import { Router } from "express";
import { CreditController } from "../controllers/creditController";
import { WebhookController } from "../controllers/webhookController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Protected routes (require authentication)
router.get("/", authenticateToken, CreditController.getCredits);
router.get("/history", authenticateToken, CreditController.getCreditHistory);
router.get(
  "/analytics",
  authenticateToken,
  CreditController.getCreditAnalytics
);
router.post("/check", authenticateToken, CreditController.checkCredits);
router.post("/consume", authenticateToken, CreditController.consumeCredits);
router.post(
  "/purchase",
  authenticateToken,
  CreditController.createCreditPurchaseSession
);
router.post(
  "/subscription",
  authenticateToken,
  CreditController.createSubscriptionSession
);
router.post(
  "/billing-portal",
  authenticateToken,
  CreditController.createBillingPortalSession
);

// Public routes
router.get("/plans", CreditController.getSubscriptionPlans);

// Webhook route (requires raw body for Stripe verification)
router.post("/webhook", WebhookController.handleStripeWebhook);

export default router;
