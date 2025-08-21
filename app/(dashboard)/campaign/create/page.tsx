"use client";

import { useState } from "react";
import { CampaignProvider } from "@/contexts/CampaignContext";
import { CampaignSetup } from "@/components/campaign/CampaignSetup";
import { ScriptGeneration } from "@/components/campaign/ScriptGeneration";
import { ImageGeneration } from "@/components/campaign/ImageGeneration";
import { ImageSelection } from "@/components/campaign/ImageSelection";
import { VideoPrompts } from "@/components/campaign/VideoPrompts";
import { VideoGeneration } from "@/components/campaign/VideoGeneration";
import { FinalAssembly } from "@/components/campaign/FinalAssembly";

const STEPS = [
  { id: 1, title: "Campaign Setup", component: CampaignSetup },
  { id: 2, title: "Script Generation", component: ScriptGeneration },
  { id: 3, title: "Image Generation", component: ImageGeneration },
  { id: 4, title: "Image Selection", component: ImageSelection },
  { id: 5, title: "Video Prompts", component: VideoPrompts },
  { id: 6, title: "Video Generation", component: VideoGeneration },
  { id: 7, title: "Final Assembly", component: FinalAssembly },
];

export default function CreateCampaignPage() {
  const [currentStep, setCurrentStep] = useState(1);

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const CurrentStepComponent = STEPS[currentStep - 1].component;

  return (
    <CampaignProvider>
      <div className="min-h-screen bg-background">
        {/* Progress Header */}
        <div className="bg-card border-b border-border">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-foreground">
                {STEPS[currentStep - 1].title}
              </h1>
              <div className="text-sm text-muted-foreground">
                Step {currentStep} of {STEPS.length}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
              />
            </div>

            {/* Step Indicators */}
            <div className="flex justify-between mt-4">
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
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
                      step.id < currentStep
                        ? "bg-primary border-primary text-primary-foreground"
                        : step.id === currentStep
                        ? "border-primary text-primary"
                        : "border-muted-foreground"
                    }`}
                  >
                    {step.id < currentStep ? "✓" : step.id}
                  </div>
                  <span className="text-xs hidden md:block">{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          <CurrentStepComponent
            onNext={nextStep}
            onPrev={prevStep}
            canGoNext={currentStep < STEPS.length}
            canGoPrev={currentStep > 1}
          />
        </div>
      </div>
    </CampaignProvider>
  );
}
