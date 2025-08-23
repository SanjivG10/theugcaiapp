"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Save, Loader2 } from "lucide-react";
import { Campaign } from "@/types/api";

const setupSchema = z.object({
  name: z
    .string()
    .min(1, "Campaign name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
});

type SetupFormData = z.infer<typeof setupSchema>;

interface CampaignSetupProps {
  campaign: Campaign;
  stepData: Record<string, unknown>;
  onNext: (data: Record<string, unknown>) => Promise<void>;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}

export function CampaignSetup({
  campaign,
  stepData,
  onNext,
  onSave,
  saving,
}: CampaignSetupProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
  } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      name: campaign.name || (stepData.name as string) || "",
      description:
        campaign.description || (stepData.description as string) || "",
    },
  });

  const handleNext = async (data: SetupFormData) => {
    await onNext({
      name: data.name,
      description: data.description,
    });
  };

  const handleSave = async () => {
    const formData = watch();
    await onSave({
      name: formData.name,
      description: formData.description,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Campaign Setup</CardTitle>
          <CardDescription>
            Set up the fundamental information for your AI UGC video campaign.
            You can always come back and edit these details later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleNext)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Summer Product Launch Video"
                {...register("name")}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-destructive text-sm">
                  {errors.name.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Choose a descriptive name that helps you identify this campaign
                later.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of what this campaign is about..."
                rows={4}
                {...register("description")}
                className={errors.description ? "border-destructive" : ""}
              />
              {errors.description && (
                <p className="text-destructive text-sm">
                  {errors.description.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Provide context about the goals, target audience, or key
                messages for this campaign.
              </p>
            </div>

            <div className="flex justify-between items-center pt-4">
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
              </div>

              <Button type="submit" disabled={saving}>
                <ArrowRight className="mr-2 h-4 w-4" />
                Continue to Script Generation
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Campaign Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            • Use specific, descriptive names that include the content type or
            purpose
          </p>
          <p>• Include the target audience or platform in your description</p>
          <p>• Mention the main goal or call-to-action you want to achieve</p>
          <p>
            • Consider including the brand or product name for easy
            identification
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
