import OpenAI, { toFile } from "openai";
import { env } from "../config/env";

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
   * Generate UGC script for a scene with streaming
   */
  public async generateScript({
    productName,
    campaignName,
    objective,
    tone,
    style,
    sceneNumber,
    totalScenes,
    customPrompt,
  }: {
    productName: string;
    campaignName: string;
    objective: string;
    tone: string;
    style: string;
    sceneNumber: number;
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
- Scene Number: ${sceneNumber}
- Total Scenes: ${totalScenes}

${customPrompt ? `Additional Instructions from the user: ${customPrompt}` : ""}

Write a script for scene ${sceneNumber} that:
1. Sounds authentic and conversational (like a real person talking)
2. Is 8-10 seconds long (10-15 words maximum)
3. Focuses on ${objective}
4. Uses a ${tone} tone
5. Follows ${style} structure


Return only the script text, no additional formatting or explanations. Keep it short and punchy.`;

    const response = await this.client.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Generate a UGC script for scene ${sceneNumber}`,
        },
      ],
    });

    return response.output_text;
  }

  /**
   * Generate image using DALL-E 3
   */
  public async generateImage({
    scriptText,
    sceneNumber,
    imageDescription,
    imageUrls,
  }: {
    scriptText: string;
    sceneNumber: number;
    imageDescription?: string;
    imageUrls: string[];
  }) {
    const imagePrompt = `Create a professional UGC-style image for scene ${sceneNumber} based on:

Script: "${scriptText}"
${imageDescription ? `Description: ${imageDescription}` : ""}

Style: High-quality product photography with lifestyle elements
Requirements:
- Professional lighting and composition
- Authentic, user-generated content feel
- Focus on the product in a real-world setting
- ${
      sceneNumber <= 2
        ? "Eye-catching and attention-grabbing"
        : sceneNumber <= 4
        ? "Demonstrative and informative"
        : "Action-oriented and compelling"
    }

Generate an image that complements the script and feels authentic. Show a real person using or interacting with the product in a natural setting.`;

    const images = await Promise.all(
      imageUrls.map(
        async (imageUrl) =>
          await toFile(this.downloadImageAsBuffer(imageUrl), null, {
            type: "image/png",
          })
      )
    );

    const response = await this.client.images.edit({
      model: "gpt-image-1",
      image: images,
      prompt: imagePrompt,
    });

    return response;
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
