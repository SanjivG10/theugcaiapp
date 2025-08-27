import { Router } from "express";
import { AssetLibraryController } from "../controllers/assetLibraryController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Folder routes
router.post("/folders", AssetLibraryController.createFolder);
router.get("/folders", AssetLibraryController.getFolders);
router.put("/folders/:folderId", AssetLibraryController.updateFolder);
router.delete("/folders/:folderId", AssetLibraryController.deleteFolder);

// File routes
router.post("/files/upload", AssetLibraryController.uploadFile, AssetLibraryController.createFileFromUpload);
router.post("/files/generate", AssetLibraryController.generateImage);
router.get("/files", AssetLibraryController.getFiles);
router.get("/files/:fileId", AssetLibraryController.getFile);
router.put("/files/:fileId", AssetLibraryController.updateFile);
router.delete("/files/:fileId", AssetLibraryController.deleteFile);
router.get("/files/:fileId/download", AssetLibraryController.downloadFile);
router.post("/files/:fileId/edit", AssetLibraryController.editImage);

export { router as assetLibraryRoutes };