import { Router } from "express";
import * as authController from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Public routes (no authentication required)
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// Protected routes (authentication required)
router.use(authenticateToken);

router.get("/profile", authController.getProfile);
router.put("/profile", authController.updateProfile);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);

export { router as authRoutes };
