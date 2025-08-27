"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCampaign } from "@/contexts/CampaignContext";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface CampaignSetupProps {
  onNext: () => void;
}

export function CampaignSetup({ onNext }: CampaignSetupProps) {
  const { state, dispatch } = useCampaign();
  const [campaignName, setCampaignName] = useState(state.campaignName);
  const [description, setDescription] = useState(state.description);
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = async () => {
    setIsLoading(true);

    if (!campaignName.trim()) {
      toast.error("Please enter a campaign name");
      setIsLoading(false);
      return;
    }

    try {
      // Update context state
      dispatch({ type: "SET_CAMPAIGN_NAME", payload: campaignName.trim() });
      dispatch({ type: "SET_DESCRIPTION", payload: description.trim() });

      // Save to database if we have a campaign ID
      if (state.campaignId) {
        const updateData = {
          name: campaignName.trim(),
          description: description.trim(),
        };

        const response = await api.updateCampaign(state.campaignId, updateData);
        if (!response.success) {
          throw new Error(response.message || "Failed to save campaign");
        }

        toast.success("Campaign settings saved");
      }

      onNext();
    } catch (error) {
      console.error("Failed to save campaign data:", error);
      toast.error("Failed to save campaign data");
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = campaignName.trim().length > 0;

  return (
    <div className="space-y-8">
      {/* Campaign Name */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Campaign Name
          </h2>
          <p className="text-muted-foreground text-sm">
            Give your campaign a memorable name to help you organize your
            projects.
          </p>
        </div>
        <Input
          placeholder="Enter campaign name..."
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          className="text-lg h-12"
          maxLength={100}
        />
      </div>

      {/* Campaign Description */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Campaign Description
          </h2>
          <p className="text-muted-foreground text-sm">
            Describe what you want to achieve with your video campaign. This
            helps our AI create better content throughout the process.
          </p>
        </div>
        <Textarea
          placeholder="e.g., Create an engaging product showcase that highlights the key features and benefits of our new smartwatch, targeting fitness enthusiasts..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[100px] resize-none"
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground text-right">
          {description.length}/1000 characters
        </p>
      </div>

      {/* Campaign Info Display */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Campaign Overview
          </h2>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Number of scenes</p>
                <p className="text-lg font-semibold">{state.sceneNumber} scene{state.sceneNumber > 1 ? "s" : ""}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estimated duration</p>
                <p className="text-lg font-semibold">~{state.sceneNumber * 8} seconds</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-6 border-t border-border">
        <Button
          onClick={handleNext}
          disabled={!canProceed || isLoading}
          className="px-8"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Next: Generate Script"
          )}
        </Button>
      </div>
    </div>
  );
}
