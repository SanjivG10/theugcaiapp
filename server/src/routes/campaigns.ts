import { Router } from "express";
import { CampaignController } from "../controllers/campaignController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// All campaign routes require authentication
router.use(authenticateToken);

// Campaign CRUD routes
router.get("/", CampaignController.getCampaigns);
router.get("/stats", CampaignController.getCampaignStats);
router.get("/analytics", CampaignController.getCampaignAnalytics);
router.get("/:id", CampaignController.getCampaignById);
router.post("/", CampaignController.createCampaign);
router.put("/:id", CampaignController.updateCampaign);
router.delete("/:id", CampaignController.deleteCampaign);

// Campaign workflow routes
router.post("/:id/start", CampaignController.startCampaign);
router.post("/:id/complete", CampaignController.completeCampaign);
router.post("/:id/fail", CampaignController.failCampaign);
router.post("/:id/cancel", CampaignController.cancelCampaign);

// Campaign settings and step data routes
router.patch("/:id/settings", CampaignController.saveCampaignSettings);
router.patch("/:id/step-data", CampaignController.saveCampaignStepData);

// AI Generation routes
router.post("/generate-script", CampaignController.generateScript);
router.post("/generate-image", CampaignController.generateImage);

export default router;
