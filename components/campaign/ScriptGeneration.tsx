"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditDisplay } from "@/components/ui/credit-display";
import { CreditPurchaseModal } from "@/components/ui/credit-purchase-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCampaign } from "@/contexts/CampaignContext";
import { api } from "@/lib/api";
import {
  Clock,
  FileText,
  Hash,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import React, {
  useCallback,
  useState as useCreditsState,
  useState,
} from "react";
import toast from "react-hot-toast";

interface ScriptGenerationProps {
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

interface SceneScript {
  id: string;
  sceneNumber: number;
  content: string;
}

export function ScriptGeneration({ onNext, onPrev }: ScriptGenerationProps) {
  const { state, dispatch } = useCampaign();
  const [sceneScripts, setSceneScripts] = useState<SceneScript[]>([]);
  const [adPrompt, setAdPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [globalSettings, setGlobalSettings] = useState({
    tone: "energetic",
    style: "product-showcase",
  });

  // Initialize scene scripts when component loads or number of scenes changes
  React.useEffect(() => {
    if (state.sceneNumber > 0) {
      // Load from saved scene data if available
      if (state.sceneData && state.sceneData.length > 0) {
        const savedScripts = state.sceneData
          .slice(0, state.sceneNumber)
          .map((scene) => ({
            id: `scene-${scene.scene_number}`,
            sceneNumber: scene.scene_number,
            content: scene.scene_script || "",
          }));
        setSceneScripts(savedScripts);
      } else {
        // Initialize empty scripts for each scene
        const newSceneScripts: SceneScript[] = Array.from(
          { length: state.sceneNumber },
          (_, index) => ({
            id: `scene-${index + 1}`,
            sceneNumber: index + 1,
            content: "",
          })
        );
        setSceneScripts(newSceneScripts);
      }
    }
  }, [state.sceneNumber, state.sceneData]);

  React.useEffect(() => {
    if (state.script) {
      setGlobalSettings({
        tone: state.script.tone || "energetic",
        style: state.script.style || "product-showcase",
      });
      if (state.script.prompt) {
        setAdPrompt(state.script.prompt);
      }
    }
  }, [state.script]);

  // Credit system states
  const [currentCredits, setCurrentCredits] = useCreditsState(0);
  const [subscriptionPlan, setSubscriptionPlan] = useCreditsState("free");
  const [showCreditModal, setShowCreditModal] = useCreditsState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch current credits on component mount
  React.useEffect(() => {
    const fetchCredits = async () => {
      try {
        const response = await api.getCredits();
        if (response.success) {
          setCurrentCredits(response.data?.credits || 0);
          setSubscriptionPlan(response.data?.subscription_plan || "free");
        }
      } catch (error) {
        console.error("Failed to fetch credits:", error);
      }
    };
    fetchCredits();
  }, []);

  const generateAllSceneScripts = useCallback(async () => {
    if (!adPrompt.trim()) {
      toast.error("Please enter an ad script prompt");
      return;
    }

    // Check credits before generating
    try {
      const creditCheckResponse = await api.checkCredits({
        action: "VIDEO_SCRIPT_GENERATION",
      });

      if (!creditCheckResponse.data?.can_proceed) {
        setShowCreditModal(true);
        return;
      }
    } catch (error) {
      console.error("Failed to check credits:", error);
      toast.error("Failed to check credits");
      return;
    }

    setIsGenerating(true);

    // Clear existing scene scripts
    setSceneScripts((prev) => prev.map((scene) => ({ ...scene, content: "" })));

    try {
      // Call the streaming script generation API for all scenes
      const stream = await api.generateScriptStream({
        campaignId: state.campaignId as string,
        sceneNumber: 1, // Not used for batch generation
        productName: state.campaignName || "Product",
        objective: state.campaignObjective || "brand-awareness",
        tone: globalSettings.tone,
        style: globalSettings.style,
        customPrompt: adPrompt,
        totalScenes: state.sceneNumber,
      });

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let generatedContent = "";
      // Read the stream
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        generatedContent += chunk;
      }

      // Parse the final result
      let finalScripts: string[];
      try {
        const parsed = JSON.parse(generatedContent);
        if (Array.isArray(parsed) && parsed.length === state.sceneNumber) {
          finalScripts = parsed;
        } else {
          // Fallback: split by double newlines if not proper JSON array
          finalScripts = generatedContent
            .split("\n\n")
            .slice(0, state.sceneNumber);
        }
      } catch {
        // Fallback: split by double newlines
        finalScripts = generatedContent
          .split("\n\n")
          .slice(0, state.sceneNumber);
      }

      // Update scene scripts with parsed content
      setSceneScripts((prev) =>
        prev.map((scene, index) => ({
          ...scene,
          content: finalScripts[index] || "",
        }))
      );

      // Credits are consumed by the API endpoint
      setCurrentCredits((prev) => prev - 1);
      toast.success(`All ${state.sceneNumber} scene scripts generated!`);
    } catch (error) {
      console.error("Failed to generate scripts:", error);
      toast.error("Failed to generate scripts. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [
    adPrompt,
    state.campaignName,
    state.campaignObjective,
    state.campaignId,
    state.sceneNumber,
    globalSettings,
    setCurrentCredits,
    setShowCreditModal,
  ]);

  const updateSceneContent = (sceneIndex: number, content: string) => {
    setSceneScripts((prev) =>
      prev.map((scene) =>
        scene.sceneNumber === sceneIndex + 1 ? { ...scene, content } : scene
      )
    );
  };

  const regenerateAllScripts = () => {
    generateAllSceneScripts();
  };

  const clearAllScripts = () => {
    setSceneScripts((prev) => prev.map((scene) => ({ ...scene, content: "" })));
    setAdPrompt("");
  };

  const estimateDuration = (text: string) => {
    const words = text.split(/\s+/).length;
    const wordsPerMinute = 150;
    const seconds = Math.ceil((words / wordsPerMinute) * 60);
    return seconds;
  };

  const getTotalWords = () => {
    return sceneScripts.reduce((total, scene) => {
      return total + scene.content.split(/\s+/).filter((w) => w).length;
    }, 0);
  };

  const getCompletedScenesCount = () => {
    return sceneScripts.filter((scene) => scene.content.trim()).length;
  };

  const handleNext = async () => {
    const completedScenes = getCompletedScenesCount();

    if (completedScenes === 0) {
      toast.error("Please create at least one scene script");
      return;
    }

    if (completedScenes < state.sceneNumber) {
      toast.error(
        `Please complete all ${state.sceneNumber} scene scripts (${completedScenes}/${state.sceneNumber} completed)`
      );
      return;
    }

    setIsLoading(true);

    try {
      // Update script data in context
      const scriptData = {
        tone: globalSettings.tone,
        style: globalSettings.style,
        prompt: adPrompt,
      };
      dispatch({ type: "SET_SCRIPT", payload: scriptData });

      // Update scene data with scripts
      sceneScripts.forEach((scene) => {
        dispatch({
          type: "UPDATE_SCENE_DATA",
          payload: {
            sceneNumber: scene.sceneNumber,
            data: { scene_script: scene.content.trim() },
          },
        });
      });

      // Save to database if we have a campaign ID
      if (state.campaignId) {
        const updateData = {
          script: scriptData,
          scene_data: sceneScripts.map((scene) => ({
            scene_number: scene.sceneNumber,
            scene_script: scene.content.trim(),
          })),
        };

        const response = await api.updateCampaign(state.campaignId, updateData);
        if (!response.success) {
          throw new Error(response.message || "Failed to save script data");
        }

        toast.success("All scene scripts saved");
      }
    } catch (error) {
      console.error("Failed to save scripts:", error);
      toast.error("Failed to save scripts");
      return;
    }

    setIsLoading(false);
    onNext();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Scene Scripts
        </h2>
        <p className="text-muted-foreground text-sm">
          Create scripts for each of your {state.sceneNumber} scenes. You can
          use AI generation with custom prompts or write manually for each
          scene.
        </p>
      </div>

      {/* Ad Script Generation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Generate Ad Script</CardTitle>
              <p className="text-sm text-muted-foreground">
                Describe your ad concept and AI will create scripts for all{" "}
                {state.sceneNumber} scenes
              </p>
            </div>
            <CreditDisplay
              action="VIDEO_SCRIPT_GENERATION"
              currentCredits={currentCredits}
              onPurchaseClick={() => setShowCreditModal(true)}
              numberOfScenes={1}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Global Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tone</label>
              <Select
                value={globalSettings.tone}
                onValueChange={(value: string) =>
                  setGlobalSettings((prev) => ({ ...prev, tone: value }))
                }
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="energetic">Energetic</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Style</label>
              <Select
                value={globalSettings.style}
                onValueChange={(value: string) =>
                  setGlobalSettings((prev) => ({ ...prev, style: value }))
                }
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product-showcase">
                    Product Showcase
                  </SelectItem>
                  <SelectItem value="problem-solution">
                    Problem-Solution
                  </SelectItem>
                  <SelectItem value="testimonial">Testimonial Style</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ad Prompt Input */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Ad Script Prompt
            </label>
            <Textarea
              value={adPrompt}
              onChange={(e) => setAdPrompt(e.target.value)}
              placeholder="Describe your ad concept (e.g., 'Create a compelling ad for our new fitness tracker that shows how it helps busy professionals stay healthy. Start with a problem, introduce the product, show benefits, and end with a call to action.')"
              className="min-h-[120px] text-sm"
              disabled={isGenerating}
            />
          </div>

          {/* Generate Actions */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              {sceneScripts.some((s) => s.content.trim()) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllScripts}
                  disabled={isGenerating}
                >
                  Clear All
                </Button>
              )}
              {sceneScripts.some((s) => s.content.trim()) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={regenerateAllScripts}
                  disabled={isGenerating || !adPrompt.trim()}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Regenerate
                </Button>
              )}
            </div>

            <Button
              onClick={generateAllSceneScripts}
              disabled={isGenerating || !adPrompt.trim()}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {isGenerating
                ? "Generating Scripts..."
                : "Generate All Scene Scripts"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scene Scripts Display */}
      {sceneScripts.some((s) => s.content.trim()) && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Generated Scene Scripts</h3>
            <div className="text-sm text-muted-foreground">
              {getCompletedScenesCount()}/{state.sceneNumber} scenes
              completed
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sceneScripts.map((scene, index) => (
              <Card key={scene.id}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      {scene.sceneNumber}
                    </div>
                    <span>Scene {scene.sceneNumber}</span>
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Script Content */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Script Content
                    </label>
                    <Textarea
                      value={scene.content}
                      onChange={(e) =>
                        updateSceneContent(index, e.target.value)
                      }
                      placeholder="Scene script will appear here after generation..."
                      className="min-h-[150px] text-sm leading-relaxed"
                    />
                  </div>

                  {/* Scene Stats */}
                  {scene.content && (
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground border-t pt-3">
                      <div className="flex items-center space-x-1">
                        <Hash className="w-3 h-3" />
                        <span>
                          {scene.content.split(/\s+/).filter((w) => w).length}{" "}
                          words
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>~{estimateDuration(scene.content)}s</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Overall Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>
                  {getCompletedScenesCount()}/{state.sceneNumber} scenes
                  completed
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Hash className="w-4 h-4" />
                <span>{getTotalWords()} total words</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>
                  ~
                  {estimateDuration(
                    sceneScripts.map((s) => s.content).join(" ")
                  )}
                  s total duration
                </span>
              </div>
            </div>

            <div className="text-sm font-medium">
              {getCompletedScenesCount() === state.sceneNumber ? (
                <span className="text-green-600">All scenes ready!</span>
              ) : (
                <span className="text-amber-600">
                  {state.sceneNumber - getCompletedScenesCount()} scenes
                  remaining
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-border">
        <Button variant="outline" onClick={onPrev}>
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={
            getCompletedScenesCount() === 0 || isLoading || isGenerating
          }
          className="px-8"
        >
          {isLoading ? "Saving..." : "Next: Assets Setup"}
        </Button>
      </div>

      {/* Credit Purchase Modal */}
      <CreditPurchaseModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        currentCredits={currentCredits}
        subscriptionPlan={subscriptionPlan}
        onPurchaseSuccess={() => {
          // Refresh credits after purchase
          const fetchCredits = async () => {
            try {
              const response = await api.getCredits();
              if (response.success) {
                setCurrentCredits(response.data?.credits || 0);
              }
            } catch (error) {
              console.error("Failed to fetch credits:", error);
            }
          };
          fetchCredits();
          setShowCreditModal(false);
        }}
      />
    </div>
  );
}
