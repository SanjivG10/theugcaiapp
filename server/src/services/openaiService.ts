import OpenAI, { toFile } from "openai";
import { env } from "../config/env";
import fs from "fs";

export class OpenAIService {
  private static instance: OpenAIService;
  private client: OpenAI;

  private constructor() {
    this.client = new OpenAI({
      apiKey: env.AI.OPENAI_API_KEY,
    });
  }

  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  /**
   * Generate UGC script for all scenes with streaming
   */
  public async generateScript({
    productName,
    campaignName,
    objective,
    tone,
    style,
    totalScenes,
    customPrompt,
  }: {
    productName: string;
    campaignName: string;
    objective: string;
    tone: string;
    style: string;
    totalScenes: number;
    customPrompt?: string;
  }) {
    const systemPrompt = `You are an expert UGC (User Generated Content) video script writer. Create engaging, authentic scripts that feel like real user testimonials and reviews.

Context:
- Product: ${productName}
- Campaign: ${campaignName}
- Objective: ${objective}
- Tone: ${tone}
- Style: ${style}
- Total Scenes: ${totalScenes}

${customPrompt ? `User's Ad Concept: ${customPrompt}` : ""}

Your task:
1. Create ${totalScenes} scene scripts based on the user's ad concept
2. Each scene should be 8-10 seconds long (10-15 words maximum)
3. Scripts should flow together to create a cohesive story
4. Use a ${tone} tone throughout
5. Follow ${style} structure
6. Make it sound authentic and conversational

IMPORTANT: Return your response as a JSON array of exactly ${totalScenes} strings, like this:
["Scene 1 script here", "Scene 2 script here", "Scene 3 script here"]

Do not include any other text, formatting, or explanations - just the JSON array.`;

    const stream = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Generate ${totalScenes} UGC scene scripts for this ad concept: ${customPrompt}`,
        },
      ],
      stream: true,
    });

    return stream;
  }

  /**
   * Generate image using DALL-E 3
   */
  public async generateImage({
    sceneNumber,
    imageDescription,
    imageUrls,
  }: {
    scriptText?: string;
    sceneNumber: number;
    imageDescription?: string;
    imageUrls: string[];
  }) {
    const imagePrompt = `Transform this image into a professional UGC-style lifestyle photograph for scene ${sceneNumber}. 
${imageDescription ? `User requirements: ${imageDescription}` : ""}


VISUAL REQUIREMENTS:
- Show a real person naturally using or interacting with the product
- Professional lighting with soft, natural illumination
- Authentic, candid moment that feels unposed
- Clean, realistic background appropriate for the product context
- High-quality product photography aesthetic
- Remove any text, logos, or graphic overlays from the image
- Focus on genuine human interaction with the product
- Lifestyle setting that matches the intended use case

STYLE: High-end product photography with authentic UGC feel, natural colors, professional composition, realistic shadows and lighting.`;

    if (imageUrls.length > 0) {
      const imageFiles = await Promise.all(
        imageUrls.map((url) => this.downloadImageAsBuffer(url))
      );
      const images = await Promise.all(
        imageFiles.map(
          async (buffer) =>
            await toFile(buffer, "image.png", {
              type: "image/png",
            })
        )
      );
      const response = await this.client.images.edit({
        model: "gpt-image-1",
        prompt: imagePrompt,
        image: images,
      });
      return response;
    } else {
      const response = await this.client.images.generate({
        model: "gpt-image-1",
        prompt: imagePrompt,
        size: "1024x1024",
        quality: "standard",
        n: 1,
      });
      return response;
    }
  }

  /**
   * Generate a simple image using DALL-E 3 for asset library
   */
  public async generateAssetImage({
    prompt,
    size = "1024x1024",
    quality = "standard",
    style = "vivid",
  }: {
    prompt: string;
    size?: "1024x1024" | "1792x1024" | "1024x1792";
    quality?: "standard" | "hd";
    style?: "vivid" | "natural";
  }) {
    try {
      const response = await this.client.images.generate({
        model: "gpt-image-1",
        prompt,
        size,
        quality,
        style,
        n: 1,
      });

      const imageData = response.data?.[0];
      if (!imageData) {
        throw new Error("No image data returned from OpenAI");
      }

      return {
        success: true,
        data: {
          url: imageData.url || "",
          revisedPrompt: imageData.revised_prompt,
        },
      };
    } catch (error) {
      console.error("Error generating image:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to generate image",
      };
    }
  }

  public async editAssetImage({
    imageUrl,
    prompt,
    size = "1024x1024",
    quality = "auto",
  }: {
    imageUrl: string;
    prompt: string;
    size?:
      | "1024x1024"
      | "auto"
      | "1536x1024"
      | "1024x1536"
      | "256x256"
      | "512x512";
    quality?: "auto" | "low" | "medium" | "high";
  }) {
    try {
      const image = await this.downloadImageAsBuffer(imageUrl);
      const imageFile = await toFile(image, "image.png", {
        type: "image/png",
      });
      const response = await this.client.images.edit({
        image: imageFile,
        model: "gpt-image-1",
        prompt,
        size,
        quality,
        n: 1,
      });

      const imageData = response.data?.[0];
      if (!imageData) {
        throw new Error("No image data returned from OpenAI");
      }

      return {
        success: true,
        data: {
          buffer: Buffer.from(imageData.b64_json || "", "base64"),
          revisedPrompt: imageData.revised_prompt,
        },
      };
    } catch (error) {
      console.error("Error generating image:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to generate image",
      };
    }
  }

  /**
   * Download image from URL and return as Buffer
   */
  public async downloadImageAsBuffer(imageUrl: string): Promise<Buffer> {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

export const openaiService = OpenAIService.getInstance();
