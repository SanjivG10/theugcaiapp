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
  Edit3,
  FileText,
  Hash,
  Loader2,
  Play,
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
  mode: "ai" | "manual";
  content: string;
  aiPrompt?: string;
  isGenerating?: boolean;
}

export function ScriptGeneration({ onNext, onPrev }: ScriptGenerationProps) {
  const { state, dispatch } = useCampaign();
  const [sceneScripts, setSceneScripts] = useState<SceneScript[]>([]);
  const [globalSettings, setGlobalSettings] = useState({
    tone: "energetic",
    style: "product-showcase",
  });

  // Initialize scene scripts when component loads or number of scenes changes
  React.useEffect(() => {
    if (state.numberOfScenes > 0) {
      const newSceneScripts: SceneScript[] = Array.from(
        { length: state.numberOfScenes },
        (_, index) => {
          const sceneNumber = index + 1;
          const existingScene = sceneScripts.find(
            (s) => s.sceneNumber === sceneNumber
          );

          return (
            existingScene || {
              id: `scene-${sceneNumber}`,
              sceneNumber,
              mode: "ai",
              content: "",
              aiPrompt: "",
              isGenerating: false,
            }
          );
        }
      );

      // Load from saved state if available
      if (state.sceneScripts && state.sceneScripts.length > 0) {
        const savedScripts = state.sceneScripts.slice(0, state.numberOfScenes);
        setSceneScripts(savedScripts);
      } else {
        setSceneScripts(newSceneScripts);
      }
    }
  }, [state.numberOfScenes, state.campaignId]);

  React.useEffect(() => {
    if (state.scriptSettings) {
      setGlobalSettings({
        tone: state.scriptSettings.tone || "energetic",
        style: state.scriptSettings.style || "product-showcase",
      });
    }
  }, [state.scriptSettings]);

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

  const generateSceneScript = useCallback(
    async (sceneIndex: number) => {
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

      // Set generating state for this scene
      setSceneScripts((prev) =>
        prev.map((scene) =>
          scene.sceneNumber === sceneIndex + 1
            ? { ...scene, isGenerating: true, content: "" }
            : scene
        )
      );

      try {
        const currentScene = sceneScripts[sceneIndex];
        const sceneNumber = sceneIndex + 1;

        // Call the streaming script generation API
        const stream = await api.generateScriptStream({
          campaignId: state.campaignId as string,
          sceneNumber,
          productName: state.campaignName || "Product",
          objective: state.campaignObjective || "brand-awareness",
          tone: globalSettings.tone,
          style: globalSettings.style,
          customPrompt: currentScene.aiPrompt,
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
          
          // Update the scene content in real-time
          setSceneScripts((prev) =>
            prev.map((scene) =>
              scene.sceneNumber === sceneNumber
                ? { ...scene, content: generatedContent }
                : scene
            )
          );
        }

        // Final update with generating state false
        setSceneScripts((prev) =>
          prev.map((scene) =>
            scene.sceneNumber === sceneNumber
              ? { ...scene, content: generatedContent, isGenerating: false }
              : scene
          )
        );

        // Consume credits for script generation
        try {
          await api.consumeCredits({
            action: "VIDEO_SCRIPT_GENERATION",
            campaign_id: state.campaignId,
            scenes: 1,
            tone: globalSettings.tone,
            style: globalSettings.style,
          });
          setCurrentCredits((prev) => prev - 1);
        } catch (error) {
          console.error("Failed to consume credits:", error);
        }

        toast.success(`Scene ${sceneNumber} script generated!`);
      } catch (error) {
        console.error("Failed to generate script:", error);
        toast.error("Failed to generate script. Please try again.");
        setSceneScripts((prev) =>
          prev.map((scene) =>
            scene.sceneNumber === sceneIndex + 1
              ? { ...scene, isGenerating: false }
              : scene
          )
        );
      }
    },
    [
      state.campaignName,
      state.campaignObjective,
      state.campaignId,
      globalSettings,
      sceneScripts,
      setCurrentCredits,
      setShowCreditModal,
    ]
  );

  const updateSceneContent = (sceneIndex: number, content: string) => {
    setSceneScripts((prev) =>
      prev.map((scene) =>
        scene.sceneNumber === sceneIndex + 1 ? { ...scene, content } : scene
      )
    );
  };

  const updateSceneMode = (sceneIndex: number, mode: "ai" | "manual") => {
    setSceneScripts((prev) =>
      prev.map((scene) =>
        scene.sceneNumber === sceneIndex + 1
          ? { ...scene, mode, content: mode === "ai" ? scene.content : "" }
          : scene
      )
    );
  };

  const updateScenePrompt = (sceneIndex: number, aiPrompt: string) => {
    setSceneScripts((prev) =>
      prev.map((scene) =>
        scene.sceneNumber === sceneIndex + 1 ? { ...scene, aiPrompt } : scene
      )
    );
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

    if (completedScenes < state.numberOfScenes) {
      toast.error(
        `Please complete all ${state.numberOfScenes} scene scripts (${completedScenes}/${state.numberOfScenes} completed)`
      );
      return;
    }

    setIsLoading(true);

    // Combine all scene scripts into a single script
    const combinedScript = sceneScripts
      .map((scene) => scene.content.trim())
      .filter((content) => content)
      .join("\n\n");

    // Update context first
    dispatch({ type: "SET_SCRIPT", payload: combinedScript });
    dispatch({ type: "SET_SCENE_SCRIPTS", payload: sceneScripts });
    dispatch({ type: "SET_SCRIPT_SETTINGS", payload: globalSettings });

    // Save script data if we have a campaign ID
    if (state.campaignId) {
      try {
        const stepData = {
          script: combinedScript,
          sceneScripts,
          scriptSettings: globalSettings,
        };

        await api.saveCampaignStepData(state.campaignId, 2, stepData);
        toast.success("All scene scripts saved");
      } catch (error) {
        console.error("Failed to save scripts:", error);
        toast.error("Failed to save scripts");
        return;
      }
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
          Create scripts for each of your {state.numberOfScenes} scenes. You can
          use AI generation with custom prompts or write manually for each
          scene.
        </p>
      </div>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Global AI Settings</CardTitle>
              <p className="text-sm text-muted-foreground">
                These settings apply to all AI-generated scenes
              </p>
            </div>
            <CreditDisplay
              action="VIDEO_SCRIPT_GENERATION"
              currentCredits={currentCredits}
              onPurchaseClick={() => setShowCreditModal(true)}
              numberOfScenes={state.numberOfScenes}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tone</label>
              <Select
                value={globalSettings.tone}
                onValueChange={(value: string) =>
                  setGlobalSettings((prev) => ({ ...prev, tone: value }))
                }
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
        </CardContent>
      </Card>

      {/* Scene Scripts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sceneScripts.map((scene, index) => (
          <Card key={scene.id} className="">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    {scene.sceneNumber}
                  </div>
                  <span>Scene {scene.sceneNumber}</span>
                </CardTitle>

                {/* AI/Manual Toggle */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={scene.mode === "ai" ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSceneMode(index, "ai")}
                    className="h-8 px-3 text-xs"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI
                  </Button>
                  <Button
                    variant={scene.mode === "manual" ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSceneMode(index, "manual")}
                    className="h-8 px-3 text-xs"
                  >
                    <Edit3 className="w-3 h-3 mr-1" />
                    Manual
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* AI Mode - Prompt Input */}
              {scene.mode === "ai" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Custom Prompt (Optional)
                    </label>
                    <Textarea
                      value={scene.aiPrompt || ""}
                      onChange={(e) => updateScenePrompt(index, e.target.value)}
                      placeholder="Add specific instructions for this scene (e.g., 'Focus on product benefits', 'Include testimonial', etc.)"
                      className="min-h-[80px] text-sm"
                    />
                  </div>

                  {/* Generate Button */}
                  <div className="flex justify-end">
                    <Button
                      onClick={() => generateSceneScript(index)}
                      disabled={scene.isGenerating}
                      size="sm"
                    >
                      {scene.isGenerating ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      {scene.isGenerating
                        ? "Generating..."
                        : "Generate AI Script"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Script Content */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Script Content
                </label>
                {scene.isGenerating ? (
                  <div className="flex items-center justify-center py-8 border border-dashed rounded-lg">
                    <div className="text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">
                        Generating scene {scene.sceneNumber}...
                      </p>
                    </div>
                  </div>
                ) : (
                  <Textarea
                    value={scene.content}
                    onChange={(e) => updateSceneContent(index, e.target.value)}
                    placeholder={
                      scene.mode === "ai"
                        ? "Click 'Generate AI Script' to create content for this scene"
                        : "Write your custom script for this scene"
                    }
                    className={`text-sm leading-relaxed ${
                      scene.mode === "manual"
                        ? "min-h-[200px]"
                        : "min-h-[120px]"
                    }`}
                  />
                )}
              </div>

              {/* Scene Stats */}
              {scene.content && (
                <div className="flex items-center space-x-4 text-xs text-muted-foreground border-t pt-3">
                  <div className="flex items-center space-x-1">
                    <Hash className="w-3 h-3" />
                    <span>
                      {scene.content.split(/\s+/).filter((w) => w).length} words
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

      {/* Overall Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>
                  {getCompletedScenesCount()}/{state.numberOfScenes} scenes
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
              {getCompletedScenesCount() === state.numberOfScenes ? (
                <span className="text-green-600">All scenes ready!</span>
              ) : (
                <span className="text-amber-600">
                  {state.numberOfScenes - getCompletedScenesCount()} scenes
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
            getCompletedScenesCount() === 0 ||
            isLoading ||
            sceneScripts.some((s) => s.isGenerating)
          }
          className="px-8"
        >
          {isLoading ? "Saving..." : "Next: Generate Images"}
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
