import { Router } from "express";
import * as businessController from "../controllers/businessController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// All business routes require authentication
router.use(authenticateToken);

// Business profile routes
router.get("/", businessController.getBusiness);
router.put("/", businessController.updateBusiness);

// Onboarding routes
router.get("/onboarding", businessController.getOnboardingProgress);
router.post("/onboarding/step", businessController.updateOnboardingStep);
router.post("/onboarding/skip", businessController.skipOnboardingStep);
router.post("/onboarding/complete", businessController.completeOnboarding);

export { router as businessRoutes };
