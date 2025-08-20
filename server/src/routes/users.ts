import { Router } from "express";
import * as userController from "../controllers/userController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// All user routes require authentication
router.use(authenticateToken);

// User profile routes
router.get("/me", userController.getCurrentUser);
router.put("/me", userController.updateCurrentUser);

// Dashboard data
router.get("/dashboard", userController.getDashboardData);

// Subscription management
router.get("/subscription", userController.getSubscriptionInfo);
router.put("/subscription", userController.updateSubscription);

// Account management
router.delete("/account", userController.deleteAccount);

export { router as userRoutes };
