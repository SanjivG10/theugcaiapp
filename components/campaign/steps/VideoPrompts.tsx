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
import { ArrowLeft, ArrowRight, Save, Loader2, Wand2, Plus, X } from "lucide-react";
import { Campaign } from "@/types/api";

const videoPromptsSchema = z.object({
  video_style: z.string().min(1, "Video style is required"),
  transition_style: z.string().min(1, "Transition style is required"),
  video_prompts: z.array(z.object({
    id: z.string(),
    prompt: z.string().min(1, "Prompt is required"),
    image_id: z.string().optional(),
    duration: z.number().min(1).max(30),
  })).min(1, "At least one video prompt is required"),
});

type VideoPromptsFormData = z.infer<typeof videoPromptsSchema>;

interface VideoPromptsProps {
  campaign: Campaign;
  stepData: Record<string, unknown>;
  onNext: (data: Record<string, unknown>) => Promise<void>;
  onPrevious: () => Promise<void>;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}

export function VideoPrompts({
  campaign,
  stepData,
  onNext,
  onPrevious,
  onSave,
  saving,
}: VideoPromptsProps) {
  const selectedImages = (stepData.selected_image_data as any[]) || [];
  const generatedScript = stepData.generated_script as string;
  
  const {
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
  } = useForm<VideoPromptsFormData>({
    resolver: zodResolver(videoPromptsSchema),
    defaultValues: {
      video_style: (stepData.video_style as string) || "",
      transition_style: (stepData.transition_style as string) || "",
      video_prompts: (stepData.video_prompts as any[]) || [],
    },
  });

  const videoPrompts = watch("video_prompts") || [];

  const generatePromptsFromScript = () => {
    if (!generatedScript) return;

    // Extract scenes from script and match with selected images
    const mockPrompts = selectedImages.map((image, index) => ({
      id: `prompt_${index + 1}`,
      prompt: `Create a dynamic video scene: ${image.prompt}. Camera should slowly zoom in while maintaining focus on the subject. Add subtle movement and professional lighting.`,
      image_id: image.id,
      duration: 5,
    }));

    // Add intro and outro prompts
    const introPrompt = {
      id: "prompt_intro",
      prompt: "Create an engaging opening scene with bold text overlay and smooth entrance animation",
      duration: 3,
    };

    const outroPrompt = {
      id: "prompt_outro", 
      prompt: "Create a compelling call-to-action scene with contact information and closing animation",
      duration: 4,
    };

    setValue("video_prompts", [introPrompt, ...mockPrompts, outroPrompt]);
  };

  const addCustomPrompt = () => {
    const newPrompt = {
      id: `prompt_${Date.now()}`,
      prompt: "",
      duration: 5,
    };
    setValue("video_prompts", [...videoPrompts, newPrompt]);
  };

  const updatePrompt = (index: number, field: string, value: any) => {
    const updated = videoPrompts.map((prompt, i) => 
      i === index ? { ...prompt, [field]: value } : prompt
    );
    setValue("video_prompts", updated);
  };

  const removePrompt = (index: number) => {
    const updated = videoPrompts.filter((_, i) => i !== index);
    setValue("video_prompts", updated);
  };

  const handleNext = async (data: VideoPromptsFormData) => {
    await onNext({
      video_style: data.video_style,
      transition_style: data.transition_style,
      video_prompts: data.video_prompts,
    });
  };

  const handleSave = async () => {
    const formData = watch();
    await onSave({
      video_style: formData.video_style,
      transition_style: formData.transition_style,
      video_prompts: formData.video_prompts,
    });
  };

  const totalDuration = videoPrompts.reduce((sum, prompt) => sum + prompt.duration, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Video Prompts</CardTitle>
          <CardDescription>
            Create specific prompts for each video scene. These will guide the AI in generating 
            your video segments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleNext)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="video_style">Video Style</Label>
                <Select 
                  value={watch("video_style")} 
                  onValueChange={(value) => setValue("video_style", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select video style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cinematic">Cinematic</SelectItem>
                    <SelectItem value="documentary">Documentary</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transition_style">Transition Style</Label>
                <Select 
                  value={watch("transition_style")} 
                  onValueChange={(value) => setValue("transition_style", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select transition style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smooth">Smooth Fade</SelectItem>
                    <SelectItem value="quick">Quick Cut</SelectItem>
                    <SelectItem value="slide">Slide</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="wipe">Wipe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Video Scene Prompts</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generatePromptsFromScript}
                    disabled={!generatedScript || selectedImages.length === 0}
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate from Script
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCustomPrompt}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Custom
                  </Button>
                </div>
              </div>

              {videoPrompts.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">
                      {videoPrompts.length} scenes
                    </Badge>
                    <Badge variant="outline">
                      {totalDuration}s total duration
                    </Badge>
                  </div>

                  {videoPrompts.map((prompt, index) => {
                    const linkedImage = selectedImages.find(img => img.id === prompt.image_id);
                    
                    return (
                      <Card key={prompt.id}>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">
                                Scene {index + 1}
                              </Label>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs">Duration:</Label>
                                  <Select 
                                    value={prompt.duration.toString()}
                                    onValueChange={(value) => 
                                      updatePrompt(index, "duration", parseInt(value))
                                    }
                                  >
                                    <SelectTrigger className="w-20">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {[1,2,3,4,5,6,7,8,9,10].map(duration => (
                                        <SelectItem key={duration} value={duration.toString()}>
                                          {duration}s
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removePrompt(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {linkedImage && (
                              <div className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
                                <img
                                  src={linkedImage.url}
                                  alt="Linked"
                                  className="w-8 h-8 object-cover rounded"
                                />
                                <span className="text-muted-foreground">
                                  Linked to: {linkedImage.prompt.slice(0, 50)}...
                                </span>
                              </div>
                            )}

                            <Textarea
                              placeholder="Describe what should happen in this video scene..."
                              value={prompt.prompt}
                              onChange={(e) => updatePrompt(index, "prompt", e.target.value)}
                              rows={3}
                            />

                            {selectedImages.length > 0 && (
                              <div className="space-y-2">
                                <Label className="text-xs">Link to Image (optional):</Label>
                                <Select
                                  value={prompt.image_id || ""}
                                  onValueChange={(value) => 
                                    updatePrompt(index, "image_id", value || undefined)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select an image" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="">No image</SelectItem>
                                    {selectedImages.map((image, imgIndex) => (
                                      <SelectItem key={image.id} value={image.id}>
                                        Image {imgIndex + 1}: {image.prompt.slice(0, 30)}...
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {videoPrompts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No video prompts yet. Click "Generate from Script" or "Add Custom" to get started.
                </div>
              )}
            </div>

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
                  disabled={saving || videoPrompts.length === 0}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Continue to Video Generation
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}