"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CREDIT_COSTS } from "@/constants/credits";
import { 
  ArrowLeft, 
  Play, 
  Loader2, 
  Zap, 
  Video, 
  Image, 
  FileText, 
  CheckCircle,
  Edit2,
  AlertTriangle
} from "lucide-react";

import { Campaign } from "@/types/api";

interface CampaignStepReviewProps {
  campaign: Campaign;
  stepData: Record<string, unknown>;
  onPrevious: () => Promise<void>;
  onLaunch: (data: Record<string, unknown>) => Promise<void>;
  launching: boolean;
}

export function CampaignStepReview({
  campaign,
  stepData,
  onPrevious,
  onLaunch,
  launching,
}: CampaignStepReviewProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  // Get final data from stepData or campaign
  const finalData = {
    name: (stepData.name as string) || campaign.name,
    description: (stepData.description as string) || campaign.description,
    campaign_type: (stepData.campaign_type as "video" | "image" | "script") || campaign.campaign_type,
    prompt: (stepData.prompt as string) || campaign.prompt,
    settings: { ...(campaign.settings as Record<string, unknown> || {}), ...(stepData.settings as Record<string, unknown> || {}) },
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case "video":
        return <Video className="h-5 w-5" />;
      case "image":
        return <Image className="h-5 w-5" />;
      case "script":
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case "video":
        return "bg-purple-100 text-purple-800";
      case "image":
        return "bg-pink-100 text-pink-800";
      case "script":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEstimatedCredits = () => {
    const baseCredits = CREDIT_COSTS[finalData.campaign_type as keyof typeof CREDIT_COSTS] || 1;
    let multiplier = 1;

    // Apply multipliers based on settings
    if (finalData.settings.quality === "high") {
      multiplier *= 1.5;
    } else if (finalData.settings.quality === "premium") {
      multiplier *= 2;
    }

    if (finalData.campaign_type === "video" && finalData.settings.duration) {
      const duration = parseInt(finalData.settings.duration as string);
      if (duration > 30) {
        multiplier *= 1.5;
      } else if (duration > 60) {
        multiplier *= 2;
      }
    }

    return Math.ceil(baseCredits * multiplier);
  };

  const handleLaunch = async () => {
    await onLaunch(finalData);
  };

  const isComplete = finalData.name && finalData.campaign_type && finalData.prompt;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review & Launch</CardTitle>
          <CardDescription>
            Review your campaign configuration and launch when ready. You can always edit these settings later.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Campaign Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Campaign Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Campaign Name</Label>
              <p className="text-sm font-medium">{finalData.name}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Content Type</Label>
              <div className="flex items-center gap-2">
                <Badge className={getTypeColor(finalData.campaign_type)}>
                  <div className="flex items-center gap-1">
                    {getTypeIcon(finalData.campaign_type)}
                    <span className="capitalize">{finalData.campaign_type}</span>
                  </div>
                </Badge>
              </div>
            </div>
          </div>

          {finalData.description && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Description</Label>
              <p className="text-sm">{finalData.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Content Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Content Description</Label>
            <div className="mt-1 p-3 bg-muted rounded-lg">
              <p className="text-sm">{finalData.prompt || "No description provided"}</p>
            </div>
          </div>

          {Object.keys(finalData.settings).length > 0 && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Settings</Label>
              <div className="mt-1 grid gap-2 md:grid-cols-2">
                {Object.entries(finalData.settings).map(([key, value]) => {
                  if (!value) return null;
                  return (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground capitalize">
                        {key.replace("_", " ")}:
                      </span>
                      <span className="font-medium">{value as string}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credit Cost */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Credit Cost
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Estimated Credit Cost</p>
              <p className="text-sm text-muted-foreground">
                This campaign will consume approximately {getEstimatedCredits()} credits when launched
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              <Zap className="h-4 w-4 mr-1" />
              {getEstimatedCredits()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Validation */}
      {!isComplete && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-medium">Campaign Incomplete</p>
                <p className="text-sm">
                  Please complete all required fields before launching your campaign.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Launch Confirmation */}
      {isComplete && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="acknowledge"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="acknowledge" className="text-sm">
                  I understand that launching this campaign will consume {getEstimatedCredits()} credits and begin the generation process.
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" onClick={onPrevious} disabled={launching}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            disabled={launching}
          >
            <Edit2 className="mr-2 h-4 w-4" />
            Edit More
          </Button>

          <Button
            onClick={handleLaunch}
            disabled={!isComplete || !acknowledged || launching}
            className="bg-green-600 hover:bg-green-700"
          >
            {launching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Launching...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Launch Campaign
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={className} {...props} />;
}