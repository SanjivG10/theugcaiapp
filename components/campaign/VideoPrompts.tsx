"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  GeneratedImage,
  useCampaign,
  VideoPrompt,
} from "@/contexts/CampaignContext";
import { Clock, DollarSign, Play, Sparkles, Wand2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface VideoPromptsProps {
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

const ANIMATION_STYLES = [
  { value: "smooth", label: "Smooth Motion", cost: 10 },
  { value: "dramatic", label: "Dramatic", cost: 15 },
  { value: "explosive", label: "Explosive", cost: 20 },
  { value: "zoom", label: "Zoom Effect", cost: 12 },
  { value: "rotation", label: "Rotation", cost: 12 },
  { value: "showcase", label: "Product Showcase", cost: 10 },
];

const DURATION_OPTIONS = [
  { value: 3, label: "3 seconds", cost: 1 },
  { value: 5, label: "5 seconds", cost: 1.5 },
  { value: 10, label: "10 seconds", cost: 2 },
];

const PROMPT_TEMPLATES = {
  "product-showcase":
    "Smooth camera movement showcasing the product with professional lighting",
  explosion:
    "Dynamic explosion effect with particles and debris flying outward",
  zoom: "Dramatic zoom-in effect focusing on key product features",
  rotation: "Elegant 360-degree rotation revealing all angles of the product",
  motion: "Gentle floating motion with subtle background movement",
  transformation: "Product transformation or morphing effect with visual flair",
};

export function VideoPrompts({ onNext, onPrev }: VideoPromptsProps) {
  const { state, dispatch } = useCampaign();
  const [prompts, setPrompts] = useState<VideoPrompt[]>([]);

  const selectedImages = state.generatedImages.filter((img) =>
    state.selectedImages.includes(img.id)
  );

  useEffect(() => {
    // Initialize prompts for selected images if not exists
    if (state.videoPrompts.length === 0) {
      const initialPrompts: VideoPrompt[] = selectedImages.map(
        (image, index) => ({
          id: Math.random().toString(36).substring(2, 9),
          imageId: image.id,
          prompt: generateAutoPrompt(image, index),
          animationStyle: "smooth",
          duration: 5,
        })
      );
      setPrompts(initialPrompts);

      // Auto-save to state
      initialPrompts.forEach((prompt) => {
        dispatch({ type: "ADD_VIDEO_PROMPT", payload: prompt });
      });
    } else {
      setPrompts(state.videoPrompts);
    }
  }, [selectedImages, state.videoPrompts.length]);

  const generateAutoPrompt = (image: GeneratedImage, index: number) => {
    const basePrompts = [
      `Smooth camera movement showcasing the product with cinematic lighting and subtle motion`,
      `Dynamic product reveal with elegant transitions and professional presentation`,
      `Gentle floating motion with the product as the focal point, clean background`,
      `Product transformation with smooth morphing effects and visual appeal`,
      `Dramatic zoom effect highlighting key features with stunning visuals`,
    ];
    return basePrompts[index % basePrompts.length];
  };

  const updatePrompt = (promptId: string, updates: Partial<VideoPrompt>) => {
    const updatedPrompts = prompts.map((p) =>
      p.id === promptId ? { ...p, ...updates } : p
    );
    setPrompts(updatedPrompts);

    dispatch({
      type: "UPDATE_VIDEO_PROMPT",
      payload: { id: promptId, updates },
    });
  };

  const insertTemplate = (
    promptId: string,
    template: keyof typeof PROMPT_TEMPLATES
  ) => {
    const templateText = PROMPT_TEMPLATES[template];
    updatePrompt(promptId, { prompt: templateText });
  };

  const calculateTotalCost = () => {
    return prompts.reduce((total, prompt) => {
      const animationCost =
        ANIMATION_STYLES.find((s) => s.value === prompt.animationStyle)?.cost ||
        10;
      const durationCost =
        DURATION_OPTIONS.find((d) => d.value === prompt.duration)?.cost || 1;
      return total + animationCost * durationCost;
    }, 0);
  };

  const handleNext = () => {
    if (prompts.some((p) => !p.prompt.trim())) {
      toast.error("Please fill in all video prompts");
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Create Video Prompts
        </h2>
        <p className="text-muted-foreground text-sm">
          Define how each image should be animated. Customize prompts and
          animation styles for each scene.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Video Prompts - Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {prompts.map((prompt, index) => {
            const image = selectedImages.find(
              (img) => img.id === prompt.imageId
            );
            if (!image) return null;

            return (
              <Card key={prompt.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <span>Scene {index + 1}</span>
                      <Badge variant="secondary">
                        Scene {image.sceneNumber}
                      </Badge>
                    </CardTitle>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{prompt.duration}s</span>
                      <DollarSign className="w-4 h-4" />
                      <span>
                        $
                        {(ANIMATION_STYLES.find(
                          (s) => s.value === prompt.animationStyle
                        )?.cost || 10) *
                          (DURATION_OPTIONS.find(
                            (d) => d.value === prompt.duration
                          )?.cost || 1)}{" "}
                        credits
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Image Preview */}
                    <div className="space-y-3">
                      <div className="aspect-square rounded-lg overflow-hidden">
                        <Image
                          src={image.url}
                          alt={`Scene ${image.sceneNumber}`}
                          width={200}
                          height={200}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">Original Image</p>
                        <p className="text-xs text-muted-foreground">
                          Scene {image.sceneNumber}
                        </p>
                      </div>
                      
                      {/* Script text */}
                      <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
                        <p className="font-medium mb-1">Script:</p>
                        <p className="text-muted-foreground line-clamp-3">
                          {state.script.split('\n\n')[image.sceneNumber - 1] || 'No script content'}
                        </p>
                      </div>
                    </div>

                    {/* Animation Settings */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Animation Style
                        </label>
                        <Select
                          value={prompt.animationStyle}
                          onValueChange={(value) =>
                            updatePrompt(prompt.id, { animationStyle: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ANIMATION_STYLES.map((style) => (
                              <SelectItem key={style.value} value={style.value}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{style.label}</span>
                                  <Badge variant="outline" className="ml-2">
                                    {style.cost} credits
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Duration
                        </label>
                        <Select
                          value={prompt.duration.toString()}
                          onValueChange={(value) =>
                            updatePrompt(prompt.id, {
                              duration: parseInt(value),
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DURATION_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value.toString()}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span>{option.label}</span>
                                  <Badge variant="outline" className="ml-2">
                                    {option.cost}x
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Mock Preview */}
                    <div className="space-y-3">
                      <div className="aspect-square rounded-lg bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/25">
                        <div className="text-center">
                          <Play className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Preview
                          </p>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">Animation Preview</p>
                        <p className="text-xs text-muted-foreground">
                          {
                            ANIMATION_STYLES.find(
                              (s) => s.value === prompt.animationStyle
                            )?.label
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Prompt Editor */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        Video Prompt
                      </label>
                      <div className="flex space-x-2">
                        {Object.entries(PROMPT_TEMPLATES).map(([key, _]) => (
                          <Button
                            key={key}
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              insertTemplate(
                                prompt.id,
                                key as keyof typeof PROMPT_TEMPLATES
                              )
                            }
                          >
                            <Sparkles className="w-3 h-3 mr-1" />
                            {key.replace("-", " ")}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Textarea
                      value={prompt.prompt}
                      onChange={(e) =>
                        updatePrompt(prompt.id, { prompt: e.target.value })
                      }
                      placeholder="Describe how this image should be animated..."
                      className="min-h-[100px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Be specific about camera movements, effects, and visual
                      style for best results.
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Summary Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generation Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {prompts.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Video Clips</p>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {prompts.reduce((total, p) => total + p.duration, 0)}s
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Total Duration
                  </p>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ${calculateTotalCost()}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Cost</p>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <h4 className="font-medium">Cost Breakdown:</h4>
                {prompts.map((prompt, index) => {
                  const animationCost =
                    ANIMATION_STYLES.find(
                      (s) => s.value === prompt.animationStyle
                    )?.cost || 10;
                  const durationMultiplier =
                    DURATION_OPTIONS.find((d) => d.value === prompt.duration)
                      ?.cost || 1;
                  const totalCost = animationCost * durationMultiplier;

                  return (
                    <div
                      key={prompt.id}
                      className="flex justify-between text-sm"
                    >
                      <span>Scene {index + 1}</span>
                      <span>${totalCost}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>• Use specific camera movements for better results</p>
              <p>• Mention lighting and visual style preferences</p>
              <p>• Keep prompts concise but descriptive</p>
              <p>• Preview costs before proceeding</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-border">
        <Button variant="outline" onClick={onPrev}>
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={prompts.some((p) => !p.prompt.trim())}
          className="px-8"
        >
          <Wand2 className="w-4 h-4 mr-2" />
          Generate Videos (${calculateTotalCost()})
        </Button>
      </div>
    </div>
  );
}
