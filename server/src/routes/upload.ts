import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import { supabaseAdmin } from "../config/supabase";
import { authMiddleware } from "../middleware/auth";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

interface UploadedFile {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
}

/**
 * Upload product images for campaigns
 * POST /api/upload/product-images
 */
router.post(
  "/product-images",
  authMiddleware,
  upload.array("images", 10), // Allow up to 10 images
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const campaignId = req.body.campaign_id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
      }

      const uploadedFiles: UploadedFile[] = [];

      // Process each uploaded file
      for (const file of files) {
        try {
          // Generate unique filename
          const fileExtension = path.extname(file.originalname);
          const filename = `${userId}/${campaignId}/${uuidv4()}${fileExtension}`;

          // Upload to Supabase Storage
          const { error } = await supabaseAdmin.storage
            .from("campaigns")
            .upload(filename, file.buffer, {
              contentType: file.mimetype,
              upsert: false,
            });

          if (error) {
            console.error("Supabase storage error:", error);
            continue; // Skip this file and continue with others
          }

          // Get public URL
          const { data: urlData } = supabaseAdmin.storage
            .from("campaigns")
            .getPublicUrl(filename);

          uploadedFiles.push({
            id: uuidv4(),
            url: urlData.publicUrl,
            name: file.originalname,
            size: file.size,
            type: file.mimetype,
          });
        } catch (fileError) {
          console.error("Error processing file:", fileError);
          // Continue with other files
        }
      }

      if (uploadedFiles.length === 0) {
        return res.status(500).json({
          success: false,
          message: "Failed to upload any files",
        });
      }

      return res.json({
        success: true,
        message: `Successfully uploaded ${uploadedFiles.length} file${
          uploadedFiles.length > 1 ? "s" : ""
        }`,
        data: uploadedFiles,
      });
    } catch (error) {
      console.error("Upload error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to upload files",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * Delete uploaded image
 * DELETE /api/upload/product-images/:filename
 */
router.delete(
  "/product-images/:filename",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Delete from Supabase Storage
      const { error } = await supabaseAdmin.storage
        .from("product-images")
        .remove([filename]);

      if (error) {
        console.error("Error deleting file:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to delete file",
        });
      }

      return res.json({
        success: true,
        message: "File deleted successfully",
      });
    } catch (error) {
      console.error("Delete error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete file",
      });
    }
  }
);

export default router;
