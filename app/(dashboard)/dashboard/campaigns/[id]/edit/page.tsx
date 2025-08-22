"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { API_ENDPOINTS, URLS } from "@/constants/urls";
import { CampaignStepBasics } from "@/components/campaign/steps/CampaignStepBasics";
import { CampaignStepType } from "@/components/campaign/steps/CampaignStepType";
import { CampaignStepContent } from "@/components/campaign/steps/CampaignStepContent";
import { CampaignStepReview } from "@/components/campaign/steps/CampaignStepReview";
import axios from "axios";
import { ArrowLeft, ArrowRight, Save, Play, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: "draft" | "in_progress" | "completed" | "failed" | "cancelled";
  campaign_type?: "video" | "image" | "script";
  prompt?: string;
  settings: Record<string, unknown>;
  credits_used: number;
  estimated_credits: number;
  current_step: number;
  total_steps: number;
  step_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  businesses: {
    name: string;
    id: string;
  };
}

const STEP_TITLES = [
  "Campaign Basics",
  "Content Type",
  "Content Details",
  "Review & Launch",
];

const STEP_DESCRIPTIONS = [
  "Set up your campaign name and description",
  "Choose what type of content to generate",
  "Configure your content settings and prompts",
  "Review everything and launch your campaign",
];

export default function CampaignEditPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepData, setStepData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (campaignId) {
      fetchCampaign();
    }
  }, [campaignId]);

  useEffect(() => {
    if (campaign) {
      setCurrentStep(campaign.current_step);
      setStepData(campaign.step_data || {});
    }
  }, [campaign]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.CAMPAIGNS.GET(campaignId));

      if (response.data.success) {
        setCampaign(response.data.data);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error("Error fetching campaign:", error);
      toast.error("Failed to fetch campaign details");
      router.push(URLS.DASHBOARD.CAMPAIGNS);
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async (
    data: Record<string, unknown>,
    stepNumber?: number
  ) => {
    if (!campaign) return;

    try {
      setSaving(true);

      const updatedStepData = { ...stepData, ...data };
      const targetStep = stepNumber ?? currentStep;

      const response = await axios.put(
        API_ENDPOINTS.CAMPAIGNS.UPDATE(campaign.id),
        {
          current_step: targetStep,
          step_data: updatedStepData,
          ...data, // Include any direct campaign field updates
        }
      );

      if (response.data.success) {
        setStepData(updatedStepData);
        if (stepNumber) {
          setCurrentStep(stepNumber);
        }
        toast.success("Progress saved successfully");
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error("Error saving progress:", error);
      toast.error("Failed to save progress");
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async (data: Record<string, unknown>) => {
    if (currentStep < (campaign?.total_steps || 4)) {
      await saveProgress(data, currentStep + 1);
    }
  };

  const handlePrevious = async () => {
    if (currentStep > 1) {
      await saveProgress({}, currentStep - 1);
    }
  };

  const handleLaunch = async (data: Record<string, unknown>) => {
    if (!campaign) return;

    try {
      setLaunching(true);

      // Save final data
      await saveProgress({ ...data, status: "in_progress" });

      // Start the campaign
      const response = await axios.post(
        API_ENDPOINTS.CAMPAIGNS.START(campaign.id)
      );

      if (response.data.success) {
        toast.success("Campaign launched successfully!");
        router.push(URLS.CAMPAIGN.VIEW(campaign.id));
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error("Error launching campaign:", error);
      toast.error("Failed to launch campaign");
    } finally {
      setLaunching(false);
    }
  };

  const renderStep = () => {
    if (!campaign) return null;

    const commonProps = {
      campaign,
      stepData,
      onNext: handleNext,
      onPrevious: handlePrevious,
      onSave: saveProgress,
      saving,
    };

    switch (currentStep) {
      case 1:
        return <CampaignStepBasics {...commonProps} />;
      case 2:
        return <CampaignStepType {...commonProps} />;
      case 3:
        return <CampaignStepContent {...commonProps} />;
      case 4:
        return (
          <CampaignStepReview
            {...commonProps}
            onLaunch={handleLaunch}
            launching={launching}
          />
        );
      default:
        return <CampaignStepBasics {...commonProps} />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Header title="Campaign Builder" description="Loading campaign..." />
        <div className="p-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="space-y-6">
        <Header
          title="Campaign Not Found"
          description="The requested campaign could not be found"
        />
        <div className="p-6 max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <div className="text-muted-foreground mb-4">
                  Campaign not found
                </div>
                <Button onClick={() => router.push(URLS.DASHBOARD.CAMPAIGNS)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Campaigns
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const progressPercentage = (currentStep / (campaign.total_steps || 4)) * 100;

  return (
    <div className="space-y-6">
      <Header
        title={`${campaign.name} - ${
          STEP_TITLES[currentStep - 1] || "Campaign Builder"
        }`}
        description={
          STEP_DESCRIPTIONS[currentStep - 1] ||
          "Configure your campaign settings"
        }
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(URLS.DASHBOARD.CAMPAIGNS)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(URLS.CAMPAIGN.VIEW(campaign.id))}
            >
              Preview
            </Button>
          </div>
        }
      />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Progress Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Step {currentStep} of {campaign.total_steps || 4}
                  <Badge variant="secondary">{campaign.status}</Badge>
                </CardTitle>
                <CardDescription>
                  {STEP_DESCRIPTIONS[currentStep - 1]}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground mb-1">
                  {Math.round(progressPercentage)}% Complete
                </div>
                <Progress value={progressPercentage} className="w-32" />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Step Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {Array.from(
              { length: campaign.total_steps || 4 },
              (_, i) => i + 1
            ).map((step) => (
              <Button
                key={step}
                variant={
                  step === currentStep
                    ? "default"
                    : step < currentStep
                    ? "secondary"
                    : "outline"
                }
                size="sm"
                className="w-10 h-10 rounded-full p-0"
                onClick={() => step <= currentStep && saveProgress({}, step)}
                disabled={step > currentStep || saving}
              >
                {step}
              </Button>
            ))}
          </div>

          {saving && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </div>
          )}
        </div>

        {/* Step Content */}
        <div className="min-h-[500px]">{renderStep()}</div>
      </div>
    </div>
  );
}
