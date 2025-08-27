"use client";

import { ScriptGeneration } from "@/components/campaign/ScriptGeneration";
import { AssetsSetup } from "@/components/campaign/AssetsSetup";
import { VideoPromptsGeneration } from "@/components/campaign/VideoPromptsGeneration";
import { FinalAssemblyEdit } from "@/components/campaign/FinalAssemblyEdit";
import { PreviewExport } from "@/components/campaign/PreviewExport";
import { Badge } from "@/components/ui/badge";
import { URLS } from "@/constants/urls";
import { CampaignProvider } from "@/contexts/CampaignContext";
import { api } from "@/lib/api";
import { Campaign } from "@/types";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const STEPS = [
  { id: 1, title: "Script Generation", component: ScriptGeneration },
  { id: 2, title: "Assets Setup", component: AssetsSetup },
  { id: 3, title: "Video Prompts", component: VideoPromptsGeneration },
  { id: 4, title: "Final Assembly", component: FinalAssemblyEdit },
  { id: 5, title: "Preview & Export", component: PreviewExport },
];

export default function CampaignEditPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const fetchCampaign = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getCampaign(campaignId);

      if (response.success && response.data) {
        setCampaign(response.data);
        // Start at step 1 (Script Generation) since we removed campaign setup
        setCurrentStep(response.data.current_step || 1);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("Error fetching campaign:", error);
      toast.error("Failed to fetch campaign details");
      router.push(URLS.DASHBOARD.CAMPAIGNS);
    } finally {
      setLoading(false);
    }
  }, [campaignId, router]);

  useEffect(() => {
    if (campaignId) {
      fetchCampaign();
    }
  }, [campaignId, fetchCampaign]);

  const saveProgress = async (stepNumber?: number) => {
    if (!campaign) return;

    try {
      setSaving(true);
      const targetStep = stepNumber ?? currentStep;

      const response = await api.updateCampaign(campaign.id, {
        current_step: targetStep,
      });

      if (response.success) {
        setCurrentStep(targetStep);
        toast.success("Progress saved");
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("Error saving progress:", error);
      toast.error("Failed to save progress");
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      saveProgress(newStep);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      // Don't auto-save when going to previous step
    }
  };

  const renderStep = () => {
    if (!campaign) return null;

    const CurrentStepComponent = STEPS[currentStep - 1].component;

    return (
      <CurrentStepComponent
        onNext={nextStep}
        onPrev={prevStep}
        canGoNext={currentStep < STEPS.length}
        canGoPrev={currentStep > 1}
      />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <h3 className="text-xl font-semibold">Campaign Not Found</h3>
          <p className="text-muted-foreground">
            The requested campaign could not be found.
          </p>
          <Link
            href={URLS.DASHBOARD.CAMPAIGNS}
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  return (
    <CampaignProvider campaignData={campaign}>
      <div className="min-h-screen bg-background">
        {/* Progress Header */}
        <div className="bg-card border-b border-border">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <Link
                href={URLS.DASHBOARD.CAMPAIGNS}
                className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Campaigns
              </Link>
              <Badge
                variant={campaign.status === "draft" ? "secondary" : "default"}
              >
                {campaign.status}
              </Badge>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-foreground">
                {campaign.name}
              </h1>
              <div className="text-sm text-muted-foreground">
                Step {currentStep} of {STEPS.length}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2 mb-4">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
              />
            </div>

            {/* Step Indicators */}
            <div className="flex justify-between">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center space-x-2 ${
                    step.id <= currentStep
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium cursor-pointer ${
                      step.id < currentStep
                        ? "bg-primary border-primary text-primary-foreground"
                        : step.id === currentStep
                        ? "border-primary text-primary"
                        : "border-muted-foreground"
                    }`}
                    onClick={() =>
                      step.id <= currentStep && saveProgress(step.id)
                    }
                  >
                    {step.id < currentStep ? "✓" : step.id}
                  </div>
                  <span className="text-xs hidden md:block">{step.title}</span>
                </div>
              ))}
            </div>

            {saving && (
              <div className="flex items-center justify-center mt-3 gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving progress...
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-6 py-8">{renderStep()}</div>
      </div>
    </CampaignProvider>
  );
}
