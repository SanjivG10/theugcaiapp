import { Router } from "express";
import { submitFeedback } from "../controllers/feedbackController";

const router = Router();

// Public route for submitting feedback (no auth required)
router.post("/", submitFeedback);

export { router as feedbackRoutes };
