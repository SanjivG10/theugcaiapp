import express, { Request, Response } from "express";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import NodeCache from "node-cache";
import { authMiddleware } from "../middleware/auth";
import { env } from "../config/env";
import { Voice } from "@elevenlabs/elevenlabs-js/api";

const router = express.Router();

// Initialize cache with 1 hour TTL
const voicesCache = new NodeCache({ stdTTL: 3600 });

// Initialize ElevenLabs client
const elevenlabs = new ElevenLabsClient({
  apiKey: env.AI.ELEVENLABS_API_KEY || "",
});

interface VoiceData {
  voice_id: string;
  name?: string;
  category: string;
  description?: string;
  gender?: string;
  age?: string;
  accent?: string;
  use_case?: string;
  preview_url?: string;
}

/**
 * Get available voices from ElevenLabs
 * GET /api/voices
 */
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Check cache first
    const cachedVoices = voicesCache.get("all_voices") as VoiceData[];
    if (cachedVoices) {
      return res.json({
        success: true,
        data: cachedVoices.slice(0, 50), // Limit to 50 voices as requested
        cached: true,
      });
    }

    // If not in cache, fetch from ElevenLabs
    const voices = await elevenlabs.voices.getAll();

    const formattedVoices: VoiceData[] = voices.voices.map((voice: Voice) => ({
      voice_id: voice.voiceId,
      name: voice.name,
      category: voice.category || "general",
      description: voice.description,
      gender: voice.labels?.gender,
      age: voice.labels?.age,
      accent: voice.labels?.accent,
      use_case: voice.labels?.use_case,
      preview_url: voice.previewUrl,
    }));

    // Cache the voices for 1 hour
    voicesCache.set("all_voices", formattedVoices);

    return res.json({
      success: true,
      data: formattedVoices.slice(0, 50), // Limit to 50 voices as requested
      cached: false,
    });
  } catch (error) {
    console.error("Error fetching voices:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch voices",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Generate voice preview
 * POST /api/voices/preview
 */
// router.post("/preview", authMiddleware, async (req: Request, res: Response) => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized",
//       });
//     }

//     const { voice_id, text } = req.body;

//     if (!voice_id) {
//       return res.status(400).json({
//         success: false,
//         message: "Voice ID is required",
//       });
//     }

//     if (!text || typeof text !== "string" || text.trim().length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Text is required for preview generation",
//       });
//     }

//     // Limit preview text length to prevent abuse
//     const previewText = text.slice(0, 200);

//     // Check cache for this specific preview
//     const cacheKey = `preview_${voice_id}_${Buffer.from(previewText)
//       .toString("base64")
//       .slice(0, 20)}`;
//     const cachedPreview = voicesCache.get(cacheKey) as string;

//     if (cachedPreview) {
//       return res.json({
//         success: true,
//         data: {
//           audio_url: cachedPreview,
//           voice_id,
//           text: previewText,
//         },
//         cached: true,
//       });
//     }

//     // Generate speech using ElevenLabs
//     const audioStream = await elevenlabs.textToSpeech.convert(voice_id, {
//       text: previewText,
//       modelId: "eleven_multilingual_v2",
//     });

//     // Convert stream to buffer
//     const chunks: Buffer[] = [];
//     for await (const chunk of audioStream) {
//       chunks.push(Buffer.from(chunk));
//     }
//     const audioBuffer = Buffer.concat(chunks);

//     // Convert to base64 for easy transmission
//     const audioBase64 = `data:audio/mpeg;base64,${audioBuffer.toString(
//       "base64"
//     )}`;

//     // Cache for 24 hours
//     voicesCache.set(cacheKey, audioBase64, 86400);

//     return res.json({
//       success: true,
//       data: {
//         audio_url: audioBase64,
//         voice_id,
//         text: previewText,
//       },
//       cached: false,
//     });
//   } catch (error) {
//     console.error("Error generating voice preview:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to generate voice preview",
//       error: error instanceof Error ? error.message : "Unknown error",
//     });
//   }
// });

/**
 * Get voice details by ID
 * GET /api/voices/:voice_id
 */
router.get(
  "/:voice_id",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { voice_id } = req.params;

      // Check cache first
      const cacheKey = `voice_${voice_id}`;
      const cachedVoice = voicesCache.get(cacheKey) as VoiceData;
      if (cachedVoice) {
        return res.json({
          success: true,
          data: cachedVoice,
          cached: true,
        });
      }

      // Fetch from ElevenLabs
      const voice = await elevenlabs.voices.get(voice_id);

      const formattedVoice: VoiceData = {
        voice_id: voice.voiceId,
        name: voice.name,
        category: voice.category || "general",
        description: voice.description,
        gender: voice.labels?.gender,
        age: voice.labels?.age,
        accent: voice.labels?.accent,
        use_case: voice.labels?.use_case,
        preview_url: voice.previewUrl,
      };

      // Cache for 1 hour
      voicesCache.set(cacheKey, formattedVoice);

      return res.json({
        success: true,
        data: formattedVoice,
        cached: false,
      });
    } catch (error) {
      console.error("Error fetching voice details:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch voice details",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;
