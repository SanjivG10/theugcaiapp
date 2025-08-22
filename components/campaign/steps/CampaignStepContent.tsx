"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ArrowLeft, ArrowRight, Save, Loader2, Lightbulb } from "lucide-react";

const contentSchema = z.object({
  prompt: z.string().min(10, "Prompt must be at least 10 characters").max(2000, "Prompt must be less than 2000 characters"),
  style: z.string().optional(),
  duration: z.string().optional(),
  resolution: z.string().optional(),
  tone: z.string().optional(),
  target_audience: z.string().optional(),
  additional_instructions: z.string().optional(),
});

type ContentFormData = z.infer<typeof contentSchema>;

interface CampaignStepContentProps {
  campaign: {
    id: string;
    campaign_type?: "video" | "image" | "script";
    prompt?: string;
    settings: Record<string, unknown>;
  };
  stepData: Record<string, unknown>;
  onNext: (data: Record<string, unknown>) => Promise<void>;
  onPrevious: () => Promise<void>;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}

export function CampaignStepContent({
  campaign,
  stepData,
  onNext,
  onPrevious,
  onSave,
  saving,
}: CampaignStepContentProps) {
  const campaignType = campaign.campaign_type || (stepData.campaign_type as string);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
  } = useForm<ContentFormData>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      prompt: campaign.prompt || (stepData.prompt as string) || "",
      style: (campaign.settings?.style as string) || (stepData.style as string) || "",
      duration: (campaign.settings?.duration as string) || (stepData.duration as string) || "",
      resolution: (campaign.settings?.resolution as string) || (stepData.resolution as string) || "",
      tone: (campaign.settings?.tone as string) || (stepData.tone as string) || "",
      target_audience: (campaign.settings?.target_audience as string) || (stepData.target_audience as string) || "",
      additional_instructions: (campaign.settings?.additional_instructions as string) || (stepData.additional_instructions as string) || "",
    },
  });

  const handleNext = async (data: ContentFormData) => {
    await onNext({
      prompt: data.prompt,
      settings: {
        style: data.style,
        duration: data.duration,
        resolution: data.resolution,
        tone: data.tone,
        target_audience: data.target_audience,
        additional_instructions: data.additional_instructions,
      },
    });
  };

  const handleSave = async () => {
    const formData = watch();
    await onSave({
      prompt: formData.prompt,
      settings: {
        style: formData.style,
        duration: formData.duration,
        resolution: formData.resolution,
        tone: formData.tone,
        target_audience: formData.target_audience,
        additional_instructions: formData.additional_instructions,
      },
    });
  };

  const getPromptPlaceholder = () => {
    switch (campaignType) {
      case "video":
        return "Describe the video you want to create. Include scenes, characters, actions, and any specific visual elements...";
      case "image":
        return "Describe the image you want to generate. Include style, composition, colors, and any specific elements...";
      case "script":
        return "Describe the type of content you need. Include the purpose, target audience, and key messages...";
      default:
        return "Describe what you want to create...";
    }
  };

  const getExamplePrompts = () => {
    switch (campaignType) {
      case "video":
        return [
          "A modern product demonstration video showing a smartphone in various lifestyle settings",
          "An animated explainer video about sustainable energy with clean, professional graphics",
          "A testimonial-style video with a person speaking directly to camera in a cozy office setting",
        ];
      case "image":
        return [
          "A minimalist product shot of a coffee mug on a wooden table with natural lighting",
          "An abstract illustration representing teamwork with interconnected geometric shapes",
          "A lifestyle photo of a person using a laptop in a modern cafe environment",
        ];
      case "script":
        return [
          "An engaging social media post announcing a new product launch with excitement and urgency",
          "A professional email template for customer onboarding with clear next steps",
          "A compelling ad copy for a fitness app targeting busy professionals",
        ];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Content Details</CardTitle>
          <CardDescription>
            Configure the specific details for your {campaignType} content. The more specific you are, the better the results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleNext)} className="space-y-6">
            {/* Main Prompt */}
            <div className="space-y-2">
              <Label htmlFor="prompt">Content Description *</Label>
              <Textarea
                id="prompt"
                placeholder={getPromptPlaceholder()}
                rows={6}
                {...register("prompt")}
                className={errors.prompt ? "border-destructive" : ""}
              />
              {errors.prompt && (
                <p className="text-destructive text-sm">{errors.prompt.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Be specific about what you want. Include details about style, mood, colors, and any specific elements.
              </p>
            </div>

            {/* Type-specific settings */}
            <div className="grid gap-4 md:grid-cols-2">
              {campaignType === "video" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Select onValueChange={(value) => setValue("duration", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 seconds</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">1 minute</SelectItem>
                        <SelectItem value="120">2 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="style">Video Style</Label>
                    <Select onValueChange={(value) => setValue("style", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="animated">Animated</SelectItem>
                        <SelectItem value="cinematic">Cinematic</SelectItem>
                        <SelectItem value="documentary">Documentary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {campaignType === "image" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="resolution">Resolution</Label>
                    <Select onValueChange={(value) => setValue("resolution", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select resolution" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1024x1024">Square (1024x1024)</SelectItem>
                        <SelectItem value="1920x1080">Landscape (1920x1080)</SelectItem>
                        <SelectItem value="1080x1920">Portrait (1080x1920)</SelectItem>
                        <SelectItem value="1200x630">Social Media (1200x630)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="style">Image Style</Label>
                    <Select onValueChange={(value) => setValue("style", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="photorealistic">Photorealistic</SelectItem>
                        <SelectItem value="illustration">Illustration</SelectItem>
                        <SelectItem value="minimalist">Minimalist</SelectItem>
                        <SelectItem value="artistic">Artistic</SelectItem>
                        <SelectItem value="abstract">Abstract</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {campaignType === "script" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="tone">Tone</Label>
                    <Select onValueChange={(value) => setValue("tone", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="persuasive">Persuasive</SelectItem>
                        <SelectItem value="informative">Informative</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target_audience">Target Audience</Label>
                    <Input
                      id="target_audience"
                      placeholder="e.g., Young professionals, Parents, Tech enthusiasts"
                      {...register("target_audience")}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Additional Instructions */}
            <div className="space-y-2">
              <Label htmlFor="additional_instructions">Additional Instructions</Label>
              <Textarea
                id="additional_instructions"
                placeholder="Any specific requirements, brand guidelines, or additional details..."
                rows={3}
                {...register("additional_instructions")}
              />
              <p className="text-sm text-muted-foreground">
                Include any brand colors, fonts, specific words to include/avoid, or other requirements.
              </p>
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

                <Button type="submit" disabled={saving}>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Continue to Review
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Example Prompts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Example Prompts for {campaignType?.charAt(0).toUpperCase() + campaignType?.slice(1)} Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {getExamplePrompts().map((example, index) => (
            <div
              key={index}
              className="p-3 bg-muted rounded-lg text-sm cursor-pointer hover:bg-muted/80"
              onClick={() => setValue("prompt", example)}
            >
              &quot;{example}&quot;
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}