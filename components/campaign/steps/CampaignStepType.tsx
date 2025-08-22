"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CREDIT_COSTS } from "@/constants/credits";
import { ArrowLeft, ArrowRight, Save, Loader2, Video, Image, FileText, Zap } from "lucide-react";

type CampaignType = "video" | "image" | "script";

interface CampaignStepTypeProps {
  campaign: {
    id: string;
    campaign_type?: CampaignType;
    current_step: number;
  };
  stepData: Record<string, unknown>;
  onNext: (data: Record<string, unknown>) => Promise<void>;
  onPrevious: () => Promise<void>;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}

const contentTypes = [
  {
    type: "video" as CampaignType,
    icon: Video,
    title: "AI Video",
    description: "Generate engaging video content with AI-powered visuals and narration",
    features: ["Custom scenes and characters", "Professional voiceovers", "Multiple aspect ratios", "HD quality output"],
    credits: CREDIT_COSTS.video,
    popular: true,
  },
  {
    type: "image" as CampaignType,
    icon: Image,
    title: "AI Images",
    description: "Create stunning visual content including photos, illustrations, and graphics",
    features: ["High-resolution images", "Multiple styles and formats", "Brand consistency", "Batch generation"],
    credits: CREDIT_COSTS.image,
    popular: false,
  },
  {
    type: "script" as CampaignType,
    icon: FileText,
    title: "AI Scripts",
    description: "Generate compelling copy and scripts for various marketing purposes",
    features: ["Marketing copy", "Social media posts", "Email templates", "Ad copy"],
    credits: CREDIT_COSTS.script,
    popular: false,
  },
];

export function CampaignStepType({
  campaign,
  stepData,
  onNext,
  onPrevious,
  onSave,
  saving,
}: CampaignStepTypeProps) {
  const [selectedType, setSelectedType] = useState<CampaignType | undefined>(
    campaign.campaign_type || (stepData.campaign_type as CampaignType)
  );

  const handleNext = async () => {
    if (!selectedType) return;
    
    await onNext({
      campaign_type: selectedType,
    });
  };

  const handleSave = async () => {
    if (!selectedType) return;
    
    await onSave({
      campaign_type: selectedType,
    });
  };

  const handleTypeSelect = (type: CampaignType) => {
    setSelectedType(type);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Choose Content Type</CardTitle>
          <CardDescription>
            Select the type of content you want to generate. Each type has different capabilities and credit costs.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {contentTypes.map((contentType) => {
          const Icon = contentType.icon;
          const isSelected = selectedType === contentType.type;
          
          return (
            <Card
              key={contentType.type}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => handleTypeSelect(contentType.type)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Icon className="h-8 w-8 text-primary" />
                  <div className="flex items-center gap-2">
                    {contentType.popular && (
                      <Badge variant="secondary" className="text-xs">
                        Popular
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      {contentType.credits} credits
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-lg">{contentType.title}</CardTitle>
                <CardDescription className="text-sm">
                  {contentType.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {contentType.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <span className="mr-2">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedType && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <div className="flex-shrink-0">
                {(() => {
                  const selectedContent = contentTypes.find(t => t.type === selectedType);
                  const Icon = selectedContent?.icon || FileText;
                  return <Icon className="h-5 w-5 text-primary" />;
                })()}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">
                  {contentTypes.find(t => t.type === selectedType)?.title} Selected
                </h4>
                <p className="text-sm text-muted-foreground">
                  This will cost {contentTypes.find(t => t.type === selectedType)?.credits} credits per generation
                </p>
              </div>
              <Badge variant="outline">
                <Zap className="h-3 w-3 mr-1" />
                {contentTypes.find(t => t.type === selectedType)?.credits} credits
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" onClick={onPrevious} disabled={saving}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {selectedType && (
            <Button
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
            onClick={handleNext} 
            disabled={!selectedType || saving}
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            Continue to Content Details
          </Button>
        </div>
      </div>
    </div>
  );
}