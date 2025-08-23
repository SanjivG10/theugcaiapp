"use client";

import { useState } from "react";
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
import { ArrowLeft, ArrowRight, Save, Loader2, Wand2 } from "lucide-react";
import { Campaign } from "@/types/api";

const scriptSchema = z.object({
  product_name: z.string().min(1, "Product name is required"),
  target_audience: z.string().min(1, "Target audience is required"),
  video_length: z.string().min(1, "Video length is required"),
  tone: z.string().min(1, "Tone is required"),
  key_points: z.string().min(10, "Key points must be at least 10 characters"),
  call_to_action: z.string().min(1, "Call to action is required"),
  generated_script: z.string().optional(),
});

type ScriptFormData = z.infer<typeof scriptSchema>;

interface ScriptGenerationProps {
  campaign: Campaign;
  stepData: Record<string, unknown>;
  onNext: (data: Record<string, unknown>) => Promise<void>;
  onPrevious: () => Promise<void>;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}

export function ScriptGeneration({
  campaign,
  stepData,
  onNext,
  onPrevious,
  onSave,
  saving,
}: ScriptGenerationProps) {
  const [generating, setGenerating] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
  } = useForm<ScriptFormData>({
    resolver: zodResolver(scriptSchema),
    defaultValues: {
      product_name: (stepData.product_name as string) || "",
      target_audience: (stepData.target_audience as string) || "",
      video_length: (stepData.video_length as string) || "",
      tone: (stepData.tone as string) || "",
      key_points: (stepData.key_points as string) || "",
      call_to_action: (stepData.call_to_action as string) || "",
      generated_script: (stepData.generated_script as string) || "",
    },
  });

  const handleNext = async (data: ScriptFormData) => {
    await onNext({
      product_name: data.product_name,
      target_audience: data.target_audience,
      video_length: data.video_length,
      tone: data.tone,
      key_points: data.key_points,
      call_to_action: data.call_to_action,
      generated_script: data.generated_script,
    });
  };

  const handleSave = async () => {
    const formData = watch();
    await onSave({
      product_name: formData.product_name,
      target_audience: formData.target_audience,
      video_length: formData.video_length,
      tone: formData.tone,
      key_points: formData.key_points,
      call_to_action: formData.call_to_action,
      generated_script: formData.generated_script,
    });
  };

  const handleGenerateScript = async () => {
    setGenerating(true);
    // TODO: Implement actual script generation with AI
    // For now, just simulate the generation
    setTimeout(() => {
      const mockScript = `Hook: Are you tired of [problem]? 
      
Introduction: Hi, I&apos;m [name] and I&apos;m here to show you how ${watch("product_name")} can change your life.

Key Points:
${watch("key_points")
  .split("\n")
  .map((point, i) => `${i + 1}. ${point.trim()}`)
  .join("\n")}

Call to Action: ${watch("call_to_action")}

Don&apos;t wait - transform your [relevant area] today!`;
      
      setValue("generated_script", mockScript);
      setGenerating(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Script Generation</CardTitle>
          <CardDescription>
            Provide details about your product and target audience to generate an engaging video script.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleNext)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product_name">Product/Service Name *</Label>
                <Input
                  id="product_name"
                  placeholder="e.g., FitTracker Pro"
                  {...register("product_name")}
                  className={errors.product_name ? "border-destructive" : ""}
                />
                {errors.product_name && (
                  <p className="text-destructive text-sm">
                    {errors.product_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_audience">Target Audience *</Label>
                <Input
                  id="target_audience"
                  placeholder="e.g., Fitness enthusiasts aged 25-40"
                  {...register("target_audience")}
                  className={errors.target_audience ? "border-destructive" : ""}
                />
                {errors.target_audience && (
                  <p className="text-destructive text-sm">
                    {errors.target_audience.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="video_length">Video Length *</Label>
                <Select 
                  value={watch("video_length")} 
                  onValueChange={(value) => setValue("video_length", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="90">90 seconds</SelectItem>
                  </SelectContent>
                </Select>
                {errors.video_length && (
                  <p className="text-destructive text-sm">
                    {errors.video_length.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Tone *</Label>
                <Select 
                  value={watch("tone")} 
                  onValueChange={(value) => setValue("tone", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="energetic">Energetic</SelectItem>
                    <SelectItem value="conversational">Conversational</SelectItem>
                    <SelectItem value="authoritative">Authoritative</SelectItem>
                  </SelectContent>
                </Select>
                {errors.tone && (
                  <p className="text-destructive text-sm">
                    {errors.tone.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="key_points">Key Points to Highlight *</Label>
              <Textarea
                id="key_points"
                placeholder="List the main benefits, features, or points you want to emphasize..."
                rows={4}
                {...register("key_points")}
                className={errors.key_points ? "border-destructive" : ""}
              />
              {errors.key_points && (
                <p className="text-destructive text-sm">
                  {errors.key_points.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="call_to_action">Call to Action *</Label>
              <Input
                id="call_to_action"
                placeholder="e.g., Visit our website, Download the app, Sign up now"
                {...register("call_to_action")}
                className={errors.call_to_action ? "border-destructive" : ""}
              />
              {errors.call_to_action && (
                <p className="text-destructive text-sm">
                  {errors.call_to_action.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="generated_script">Generated Script</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateScript}
                  disabled={generating || !watch("product_name") || !watch("target_audience")}
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Script
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                id="generated_script"
                placeholder="Your generated script will appear here..."
                rows={8}
                {...register("generated_script")}
              />
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

                <Button type="submit" disabled={saving || !watch("generated_script")}>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Continue to Image Generation
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}