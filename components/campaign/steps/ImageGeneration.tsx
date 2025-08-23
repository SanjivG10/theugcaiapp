"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Save, Loader2, Wand2, Image as ImageIcon } from "lucide-react";
import { Campaign } from "@/types/api";

const imageSchema = z.object({
  image_style: z.string().min(1, "Image style is required"),
  image_prompts: z.array(z.string()).min(1, "At least one image prompt is required"),
  aspect_ratio: z.string().min(1, "Aspect ratio is required"),
  generated_images: z.array(z.object({
    id: z.string(),
    url: z.string(),
    prompt: z.string(),
  })).optional(),
});

type ImageFormData = z.infer<typeof imageSchema>;

interface ImageGenerationProps {
  campaign: Campaign;
  stepData: Record<string, unknown>;
  onNext: (data: Record<string, unknown>) => Promise<void>;
  onPrevious: () => Promise<void>;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}

export function ImageGeneration({
  campaign,
  stepData,
  onNext,
  onPrevious,
  onSave,
  saving,
}: ImageGenerationProps) {
  const [generating, setGenerating] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState("");
  
  const {
    handleSubmit,
    formState: { isDirty },
    watch,
    setValue,
  } = useForm<ImageFormData>({
    resolver: zodResolver(imageSchema),
    defaultValues: {
      image_style: (stepData.image_style as string) || "",
      image_prompts: (stepData.image_prompts as string[]) || [],
      aspect_ratio: (stepData.aspect_ratio as string) || "",
      generated_images: (stepData.generated_images as any[]) || [],
    },
  });

  const prompts = watch("image_prompts") || [];
  const generatedImages = watch("generated_images") || [];

  // Auto-generate prompts based on script
  const generatePromptsFromScript = () => {
    const script = stepData.generated_script as string;
    if (!script) return;

    // Simple extraction of key scenes from script
    const mockPrompts = [
      "Professional person presenting product in modern office setting",
      "Close-up product shot with clean white background",
      "Happy customer using the product in real-life scenario",
      "Before and after comparison showing product benefits",
    ];
    
    setValue("image_prompts", mockPrompts);
  };

  const addCustomPrompt = () => {
    if (currentPrompt.trim()) {
      setValue("image_prompts", [...prompts, currentPrompt.trim()]);
      setCurrentPrompt("");
    }
  };

  const removePrompt = (index: number) => {
    const updated = prompts.filter((_, i) => i !== index);
    setValue("image_prompts", updated);
  };

  const handleGenerateImages = async () => {
    setGenerating(true);
    // TODO: Implement actual image generation with AI
    // For now, simulate generation
    setTimeout(() => {
      const mockImages = prompts.map((prompt, i) => ({
        id: `img_${i + 1}`,
        url: `https://picsum.photos/400/600?random=${i + 1}`, // Placeholder images
        prompt,
      }));
      
      setValue("generated_images", mockImages);
      setGenerating(false);
    }, 3000);
  };

  const handleNext = async (data: ImageFormData) => {
    await onNext({
      image_style: data.image_style,
      image_prompts: data.image_prompts,
      aspect_ratio: data.aspect_ratio,
      generated_images: data.generated_images,
    });
  };

  const handleSave = async () => {
    const formData = watch();
    await onSave({
      image_style: formData.image_style,
      image_prompts: formData.image_prompts,
      aspect_ratio: formData.aspect_ratio,
      generated_images: formData.generated_images,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Image Generation</CardTitle>
          <CardDescription>
            Configure image generation settings and create prompts for your video scenes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleNext)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="image_style">Image Style</Label>
                <Select 
                  value={watch("image_style")} 
                  onValueChange={(value) => setValue("image_style", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select image style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photorealistic">Photorealistic</SelectItem>
                    <SelectItem value="illustration">Illustration</SelectItem>
                    <SelectItem value="minimalist">Minimalist</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="lifestyle">Lifestyle</SelectItem>
                    <SelectItem value="artistic">Artistic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aspect_ratio">Aspect Ratio</Label>
                <Select 
                  value={watch("aspect_ratio")} 
                  onValueChange={(value) => setValue("aspect_ratio", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select aspect ratio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                    <SelectItem value="9:16">9:16 (Portrait/Stories)</SelectItem>
                    <SelectItem value="1:1">1:1 (Square)</SelectItem>
                    <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Image Prompts</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generatePromptsFromScript}
                  disabled={!stepData.generated_script}
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate from Script
                </Button>
              </div>

              {prompts.length > 0 && (
                <div className="space-y-2">
                  {prompts.map((prompt, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <span className="text-sm flex-1">{prompt}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePrompt(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Textarea
                  placeholder="Enter a custom image prompt..."
                  value={currentPrompt}
                  onChange={(e) => setCurrentPrompt(e.target.value)}
                  rows={2}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addCustomPrompt}
                  disabled={!currentPrompt.trim()}
                >
                  Add
                </Button>
              </div>
            </div>

            {prompts.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Generated Images</Label>
                  <Button
                    type="button"
                    onClick={handleGenerateImages}
                    disabled={generating || prompts.length === 0}
                  >
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Generate Images ({prompts.length})
                      </>
                    )}
                  </Button>
                </div>

                {generatedImages.length > 0 && (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {generatedImages.map((image, index) => (
                      <Card key={image.id}>
                        <CardContent className="p-3">
                          <img
                            src={image.url}
                            alt={`Generated image ${index + 1}`}
                            className="w-full h-32 object-cover rounded mb-2"
                          />
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {image.prompt}
                          </p>
                          <Badge variant="outline" className="mt-2 text-xs">
                            Image {index + 1}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={onPrevious} disabled={saving}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                {isDirty && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Progress
                      </>
                    )}
                  </Button>
                )}

                <Button 
                  type="submit" 
                  disabled={saving || generatedImages.length === 0}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Continue to Image Selection
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}