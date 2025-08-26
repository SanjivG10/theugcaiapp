import { Request, Response } from "express";
import { AssetLibraryService } from "../services/assetLibraryService";
import { z } from "zod";
import multer from "multer";
import { supabaseAdmin } from "../config/supabase";
import { v4 as uuidv4 } from "uuid";
import { openaiService } from "../services/openaiService";
import sharp from "sharp";

// Validation schemas
const createFolderSchema = z.object({
  name: z
    .string()
    .min(1, "Folder name is required")
    .max(255, "Folder name too long"),
  description: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
    .optional(),
  parent_folder_id: z.string().uuid().optional(),
  business_id: z.string().uuid().optional(),
});

const updateFolderSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
    .optional(),
  parent_folder_id: z
    .string()
    .uuid()
    .optional()
    .or(z.literal(null).transform(() => undefined)),
});

const updateFileSchema = z.object({
  folder_id: z
    .string()
    .uuid()
    .optional()
    .or(z.literal(null).transform(() => undefined)),
  name: z.string().min(1).max(255).optional(),
  alt_text: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const getFilesQuerySchema = z.object({
  folder_id: z
    .string()
    .uuid()
    .optional()
    .or(z.literal("null").transform(() => undefined)),
  business_id: z.string().uuid().optional(),
  file_type: z.string().optional(),
  is_generated: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  tags: z
    .string()
    .transform((val) => val.split(","))
    .optional(),
  search: z.string().optional(),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional(),
  limit: z
    .string()
    .transform((val) => Math.min(parseInt(val, 10), 100))
    .optional(),
  sort_by: z
    .enum(["created_at", "name", "file_size", "download_count"])
    .optional(),
  sort_order: z.enum(["asc", "desc"]).optional(),
});

const generateImageSchema = z.object({
  folder_id: z.string().uuid().optional(),
  business_id: z.string().uuid().optional(),
  prompt: z.string().min(1, "Prompt is required"),
  name: z.string().min(1, "Image name is required"),
  alt_text: z.string().optional(),
  tags: z.array(z.string()).optional(),
  size: z.enum(["1024x1024", "1792x1024", "1024x1792"]).default("1024x1024"),
  quality: z.enum(["standard", "hd"]).default("standard"),
  style: z.enum(["vivid", "natural"]).default("vivid"),
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images only
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export class AssetLibraryController {
  // Folder endpoints
  static async createFolder(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const validation = createFolderSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid request data",
          errors: validation.error.issues,
        });
      }

      const result = await AssetLibraryService.createFolder(
        userId,
        validation.data
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      console.error("Error creating folder:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async getFolders(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const { business_id, parent_folder_id } = req.query;

      let parentId: string | null | undefined = undefined;
      if (parent_folder_id === "null") {
        parentId = null;
      } else if (parent_folder_id) {
        parentId = parent_folder_id as string;
      }

      const result = await AssetLibraryService.getFolders(
        userId,
        business_id as string | undefined,
        parentId
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error("Error getting folders:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async updateFolder(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const { folderId } = req.params;

      const validation = updateFolderSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid request data",
          errors: validation.error.issues,
        });
      }

      const result = await AssetLibraryService.updateFolder(
        userId,
        folderId,
        validation.data
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error("Error updating folder:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async deleteFolder(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const { folderId } = req.params;

      const result = await AssetLibraryService.deleteFolder(userId, folderId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error("Error deleting folder:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // File endpoints
  static uploadFile = upload.single("file");

  static async createFileFromUpload(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const { folder_id, business_id, name, alt_text, tags } = req.body;

      // Parse tags if provided
      let parsedTags: string[] = [];
      if (tags) {
        try {
          parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
        } catch (error) {
          console.error("Error parsing tags:", error);
        }
      }

      // Generate unique filename
      const fileExtension = file.originalname.split(".").pop();
      const fileName = name || file.originalname.split(".")[0];
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
      const storagePath = `${userId}/asset-library/${
        folder_id || "root"
      }/${uniqueFileName}`;

      // Get image dimensions using sharp
      let width: number | undefined;
      let height: number | undefined;
      let thumbnailBuffer: Buffer | undefined;

      try {
        const metadata = await sharp(file.buffer).metadata();
        width = metadata.width;
        height = metadata.height;

        // Generate thumbnail (max 300x300)
        thumbnailBuffer = await sharp(file.buffer)
          .resize(300, 300, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();
      } catch (error) {
        console.error("Error processing image with sharp:", error);
      }

      // Upload original file to Supabase Storage
      const { error: uploadError } = await supabaseAdmin.storage
          .from("campaigns")
          .upload(storagePath, file.buffer, {
            contentType: file.mimetype,
            cacheControl: "31536000", // 1 year
          });

      if (uploadError) {
        return res.status(400).json({
          success: false,
          message: `Upload failed: ${uploadError.message}`,
        });
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from("campaigns")
        .getPublicUrl(storagePath);

      let thumbnailUrl: string | undefined;

      // Upload thumbnail if generated
      if (thumbnailBuffer) {
        const thumbnailPath = `${userId}/asset-library/${
          folder_id || "root"
        }/thumbnails/${uniqueFileName}`;
        const { error: thumbnailError } = await supabaseAdmin.storage
          .from("campaigns")
          .upload(thumbnailPath, thumbnailBuffer, {
            contentType: "image/jpeg",
            cacheControl: "31536000",
          });

        if (!thumbnailError) {
          const { data: thumbnailUrlData } = supabaseAdmin.storage
            .from("campaigns")
            .getPublicUrl(thumbnailPath);
          thumbnailUrl = thumbnailUrlData.publicUrl;
        }
      }

      // Create file record in database
      const result = await AssetLibraryService.createFile(userId, {
        folder_id: folder_id || undefined,
        business_id: business_id || undefined,
        name: fileName,
        original_name: file.originalname,
        file_type: file.mimetype,
        file_size: file.size,
        width,
        height,
        storage_url: urlData.publicUrl,
        storage_path: storagePath,
        thumbnail_url: thumbnailUrl,
        alt_text: alt_text || undefined,
        tags: parsedTags,
        metadata: {
          uploaded_at: new Date().toISOString(),
          file_extension: fileExtension,
        },
      });

      if (!result.success) {
        // Clean up uploaded file if database operation failed
        await supabaseAdmin.storage.from("campaigns").remove([storagePath]);
        if (thumbnailUrl) {
          await supabaseAdmin.storage
            .from("campaigns")
            .remove([
              `${userId}/asset-library/${
                folder_id || "root"
              }/thumbnails/${uniqueFileName}`,
            ]);
        }
        return res.status(400).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      console.error("Error uploading file:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async generateImage(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const validation = generateImageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid request data",
          errors: validation.error.issues,
        });
      }

      const {
        folder_id,
        business_id,
        prompt,
        name,
        alt_text,
        tags,
        size,
        quality,
        style,
      } = validation.data;

      // Generate image using OpenAI
      const imageResult = await openaiService.generateAssetImage({
        prompt,
        size,
        quality,
        style,
      });

      if (!imageResult.success || !imageResult.data) {
        return res.status(400).json({
          success: false,
          message: imageResult.message || "Failed to generate image",
        });
      }

      const imageUrl = imageResult.data.url;

      // Download the generated image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        return res.status(400).json({
          success: false,
          message: "Failed to download generated image",
        });
      }

      const imageBuffer = Buffer.from(await response.arrayBuffer());

      // Get image dimensions
      let width: number | undefined;
      let height: number | undefined;
      let thumbnailBuffer: Buffer | undefined;

      try {
        const metadata = await sharp(imageBuffer).metadata();
        width = metadata.width;
        height = metadata.height;

        // Generate thumbnail
        thumbnailBuffer = await sharp(imageBuffer)
          .resize(300, 300, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();
      } catch (error) {
        console.error("Error processing generated image:", error);
      }

      // Upload to storage
      const uniqueFileName = `${uuidv4()}.png`;
      const storagePath = `${userId}/asset-library/${
        folder_id || "root"
      }/generated/${uniqueFileName}`;

      const { error: uploadError } = await supabaseAdmin.storage
          .from("campaigns")
          .upload(storagePath, imageBuffer, {
            contentType: "image/png",
            cacheControl: "31536000",
          });

      if (uploadError) {
        return res.status(400).json({
          success: false,
          message: `Upload failed: ${uploadError.message}`,
        });
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from("campaigns")
        .getPublicUrl(storagePath);

      let thumbnailUrl: string | undefined;

      // Upload thumbnail if generated
      if (thumbnailBuffer) {
        const thumbnailPath = `${userId}/asset-library/${
          folder_id || "root"
        }/thumbnails/${uniqueFileName}`;
        const { error: thumbnailError } = await supabaseAdmin.storage
          .from("campaigns")
          .upload(thumbnailPath, thumbnailBuffer, {
            contentType: "image/jpeg",
            cacheControl: "31536000",
          });

        if (!thumbnailError) {
          const { data: thumbnailUrlData } = supabaseAdmin.storage
            .from("campaigns")
            .getPublicUrl(thumbnailPath);
          thumbnailUrl = thumbnailUrlData.publicUrl;
        }
      }

      // Create file record in database
      const result = await AssetLibraryService.createFile(userId, {
        folder_id: folder_id || undefined,
        business_id: business_id || undefined,
        name,
        original_name: `${name}.png`,
        file_type: "image/png",
        file_size: imageBuffer.length,
        width,
        height,
        storage_url: urlData.publicUrl,
        storage_path: storagePath,
        thumbnail_url: thumbnailUrl,
        is_generated: true,
        generation_prompt: prompt,
        generation_model: "dall-e-3",
        generation_settings: {
          size,
          quality,
          style,
          generated_at: new Date().toISOString(),
        },
        alt_text: alt_text || undefined,
        tags: tags || [],
        metadata: {
          generated_at: new Date().toISOString(),
          openai_revised_prompt: imageResult.data?.revisedPrompt,
        },
      });

      if (!result.success) {
        // Clean up uploaded file if database operation failed
        await supabaseAdmin.storage.from("campaigns").remove([storagePath]);
        if (thumbnailUrl) {
          await supabaseAdmin.storage
            .from("campaigns")
            .remove([
              `${userId}/asset-library/${
                folder_id || "root"
              }/thumbnails/${uniqueFileName}`,
            ]);
        }
        return res.status(400).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      console.error("Error generating image:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async getFiles(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const validation = getFilesQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid query parameters",
          errors: validation.error.issues,
        });
      }

      const result = await AssetLibraryService.getFiles(
        userId,
        validation.data
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error("Error getting files:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async getFile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const { fileId } = req.params;

      const result = await AssetLibraryService.getFile(userId, fileId);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error("Error getting file:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async updateFile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const { fileId } = req.params;

      const validation = updateFileSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid request data",
          errors: validation.error.issues,
        });
      }

      const result = await AssetLibraryService.updateFile(
        userId,
        fileId,
        validation.data
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error("Error updating file:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async deleteFile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const { fileId } = req.params;

      const result = await AssetLibraryService.deleteFile(userId, fileId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error("Error deleting file:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async downloadFile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const { fileId } = req.params;

      // Get file info and increment download count
      const [fileResult] = await Promise.all([
        AssetLibraryService.getFile(userId, fileId),
        AssetLibraryService.incrementDownloadCount(userId, fileId),
      ]);

      if (!fileResult.success || !fileResult.data) {
        return res.status(404).json(fileResult);
      }

      // Redirect to the file URL for download
      return res.redirect(fileResult.data.storage_url);
    } catch (error) {
      console.error("Error downloading file:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
