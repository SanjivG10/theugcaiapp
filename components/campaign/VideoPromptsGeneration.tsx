"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
  CheckCircle,
  Clock,
  Download,
  Film,
  Loader2,
  Play,
  RefreshCw,
  Sparkles,
  Wand2,
} from "lucide-react";
import toast from "react-hot-toast";

interface VideoPromptsGenerationProps {
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

interface VideoPrompt {
  sceneNumber: number;
  prompt: string;
  animationStyle: string;
  duration: number;
  isProcessing: boolean;
  videoUrl?: string;
  isGeneratingVideo: boolean;
  generationProgress: number;
}

export function VideoPromptsGeneration({ onNext, onPrev }: VideoPromptsGenerationProps) {
  const { state, dispatch } = useCampaign();
  const totalScenes = state.sceneNumber;

  const [videoPrompts, setVideoPrompts] = useState<VideoPrompt[]>(() => {
    return Array.from({ length: totalScenes }, (_, index) => {
      const sceneNumber = index + 1;
      const sceneDataFromContext = state.sceneData.find(s => s.scene_number === sceneNumber);
      return {
        sceneNumber,
        prompt: sceneDataFromContext?.video?.prompt || "",
        animationStyle: "smooth-pan",
        duration: 3,
        isProcessing: false,
        videoUrl: sceneDataFromContext?.video?.url,
        isGeneratingVideo: sceneDataFromContext?.video?.isProcessing || false,
        generationProgress: 0,
      };
    });
  });

  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Credit system states
  const [currentCredits, setCurrentCredits] = useState(0);
  const [subscriptionPlan, setSubscriptionPlan] = useState("free");
  const [showCreditModal, setShowCreditModal] = useState(false);

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

  // Load existing video prompts from backend
  React.useEffect(() => {
    const loadVideoPrompts = async () => {
      if (!state.campaignId) return;

      try {
        const response = await api.getCampaign(state.campaignId);
        if (response.success && response.data?.scene_data) {
          const savedSceneData = response.data.scene_data;

          setVideoPrompts((prev) =>
            prev.map((prompt) => {
              const savedScene = savedSceneData.find(
                (s) => s.scene_number === prompt.sceneNumber
              );
              if (savedScene && savedScene.video) {
                return {
                  ...prompt,
                  prompt: savedScene.video.prompt || "",
                  isProcessing: savedScene.video.isProcessing || false,
                  videoUrl: savedScene.video.url,
                  isGeneratingVideo: savedScene.video.isProcessing || false,
                };
              }
              return prompt;
            })
          );
        }
      } catch (error) {
        console.error("Failed to load video prompts:", error);
      }
    };

    loadVideoPrompts();
  }, [state.campaignId]);

  const updateVideoPrompt = (sceneNumber: number, field: keyof VideoPrompt, value: any) => {
    setVideoPrompts((prev) =>
      prev.map((prompt) =>
        prompt.sceneNumber === sceneNumber
          ? { ...prompt, [field]: value }
          : prompt
      )
    );
  };

  const generateVideoPrompt = async (sceneNumber: number) => {
    const sceneData = state.sceneData.find(s => s.scene_number === sceneNumber);
    if (!sceneData || !sceneData.scene_script) {
      toast.error(`Scene ${sceneNumber} needs a script before generating video prompt`);
      return;
    }

    // Check credits before generating
    try {
      const creditCheckResponse = await api.checkCredits({
        action: "VIDEO_PROMPT_GENERATION",
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

    updateVideoPrompt(sceneNumber, "isProcessing", true);

    try {
      // Generate AI prompt based on scene script and image
      const response = await api.generateVideoPrompt({
        campaignId: state.campaignId!,
        sceneNumber: sceneNumber,
        sceneScript: sceneData.scene_script,
        imageDescription: sceneData.image?.name || "scene image",
        animationStyle: videoPrompts.find(p => p.sceneNumber === sceneNumber)?.animationStyle || "smooth-pan",
        duration: videoPrompts.find(p => p.sceneNumber === sceneNumber)?.duration || 3,
      });

      if (response.success && response.data?.prompt) {
        updateVideoPrompt(sceneNumber, "prompt", response.data.prompt);
        setCurrentCredits(prev => prev - 1);
        toast.success(`Video prompt generated for Scene ${sceneNumber}`);
      } else {
        throw new Error(response.message || "Failed to generate video prompt");
      }
    } catch (error) {
      console.error("Failed to generate video prompt:", error);
      toast.error("Failed to generate video prompt. Please try again.");
    } finally {
      updateVideoPrompt(sceneNumber, "isProcessing", false);
    }
  };

  const generateVideo = async (sceneNumber: number) => {
    const prompt = videoPrompts.find(p => p.sceneNumber === sceneNumber);
    const sceneData = state.sceneData.find(s => s.scene_number === sceneNumber);
    
    if (!prompt || !prompt.prompt.trim()) {
      toast.error(`Scene ${sceneNumber} needs a video prompt before generating video`);
      return;
    }

    if (!sceneData || !sceneData.image?.url) {
      toast.error(`Scene ${sceneNumber} needs an image before generating video`);
      return;
    }

    // Check credits before generating
    try {
      const creditCheckResponse = await api.checkCredits({
        action: "VIDEO_GENERATION",
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

    updateVideoPrompt(sceneNumber, "isGeneratingVideo", true);
    updateVideoPrompt(sceneNumber, "generationProgress", 0);

    try {
      // Start video generation
      const response = await api.generateSceneVideo({
        campaignId: state.campaignId!,
        sceneNumber: sceneNumber,
        imageUrl: sceneData.image.url,
        videoPrompt: prompt.prompt,
        animationStyle: prompt.animationStyle,
        duration: prompt.duration,
      });

      if (!response.success || !response.data?.jobId) {
        throw new Error(response.message || "Failed to start video generation");
      }

      const jobId = response.data.jobId;

      // Poll for progress
      const pollProgress = async () => {
        try {
          const progressResponse = await api.getVideoGenerationProgress(jobId);
          
          if (progressResponse.success && progressResponse.data) {
            const { progress, status, videoUrl: generatedUrl } = progressResponse.data;
            
            updateVideoPrompt(sceneNumber, "generationProgress", progress || 0);

            if (status === "completed" && generatedUrl) {
              updateVideoPrompt(sceneNumber, "videoUrl", generatedUrl);
              updateVideoPrompt(sceneNumber, "isGeneratingVideo", false);
              
              // Update scene data in context
              dispatch({
                type: "UPDATE_SCENE_DATA",
                payload: {
                  sceneNumber: sceneNumber,
                  data: {
                    video: {
                      ...sceneData.video,
                      url: generatedUrl,
                      isProcessing: false,
                    }
                  },
                },
              });

              setCurrentCredits(prev => prev - 2); // Assuming 2 credits for video generation
              toast.success(`Video generated for Scene ${sceneNumber}!`);
              return;
            } else if (status === "failed") {
              throw new Error("Video generation failed");
            }

            // Continue polling if still processing
            if (status === "processing") {
              setTimeout(pollProgress, 3000);
            }
          }
        } catch (error) {
          console.error(`Failed to check video generation progress for scene ${sceneNumber}:`, error);
          toast.error(`Failed to generate video for Scene ${sceneNumber}`);
          updateVideoPrompt(sceneNumber, "isGeneratingVideo", false);
        }
      };

      // Start polling
      setTimeout(pollProgress, 3000);

    } catch (error) {
      console.error(`Failed to generate video for scene ${sceneNumber}:`, error);
      toast.error(`Failed to generate video for Scene ${sceneNumber}. Please try again.`);
      updateVideoPrompt(sceneNumber, "isGeneratingVideo", false);
    }
  };

  const generateAllVideos = async () => {
    const scenesWithoutPrompts = videoPrompts.filter(p => !p.prompt.trim());
    if (scenesWithoutPrompts.length > 0) {
      toast.error("All scenes need video prompts before generating videos");
      return;
    }

    const scenesWithoutImages = state.sceneData.filter(s => !s.image?.url);
    if (scenesWithoutImages.length > 0) {
      toast.error("All scenes need images before generating videos");
      return;
    }

    // Check credits before generating
    try {
      const creditCheckResponse = await api.checkCredits({
        action: "VIDEO_GENERATION",
        estimated_credits: totalScenes * 2,
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

    setIsGeneratingAll(true);

    try {
      // Generate videos for all scenes in sequence (to avoid overwhelming the API)
      for (const prompt of videoPrompts) {
        if (!prompt.videoUrl) { // Only generate if not already generated
          await generateVideo(prompt.sceneNumber);
          // Add small delay between generations
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      toast.success("All videos generation started!");
    } catch (error) {
      console.error("Failed to generate all videos:", error);
      toast.error("Failed to generate videos. Please try again.");
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const generateAllVideoPrompts = async () => {
    // Check if all scenes have scripts
    const scenesWithoutScripts = state.sceneData.filter(s => !s.scene_script);
    if (scenesWithoutScripts.length > 0) {
      toast.error("All scenes need scripts before generating video prompts");
      return;
    }

    // Check credits before generating
    try {
      const creditCheckResponse = await api.checkCredits({
        action: "VIDEO_PROMPT_GENERATION",
        estimated_credits: totalScenes,
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

    setIsGeneratingAll(true);

    try {
      // Generate prompts for all scenes in parallel
      const promises = videoPrompts.map(async (prompt) => {
        const sceneData = state.sceneData.find(s => s.scene_number === prompt.sceneNumber);
        if (!sceneData || !sceneData.scene_script) return;

        updateVideoPrompt(prompt.sceneNumber, "isProcessing", true);

        try {
          const response = await api.generateVideoPrompt({
            campaignId: state.campaignId!,
            sceneNumber: prompt.sceneNumber,
            sceneScript: sceneData.scene_script,
            imageDescription: sceneData.image?.name || "scene image",
            animationStyle: prompt.animationStyle,
            duration: prompt.duration,
          });

          if (response.success && response.data?.prompt) {
            updateVideoPrompt(prompt.sceneNumber, "prompt", response.data.prompt);
          }
        } catch (error) {
          console.error(`Failed to generate prompt for scene ${prompt.sceneNumber}:`, error);
        } finally {
          updateVideoPrompt(prompt.sceneNumber, "isProcessing", false);
        }
      });

      await Promise.all(promises);
      setCurrentCredits(prev => prev - totalScenes);
      toast.success("All video prompts generated!");
    } catch (error) {
      console.error("Failed to generate all video prompts:", error);
      toast.error("Failed to generate video prompts. Please try again.");
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const clearAllPrompts = () => {
    setVideoPrompts(prev => prev.map(prompt => ({ ...prompt, prompt: "" })));
  };

  const getCompletedPromptsCount = () => {
    return videoPrompts.filter(prompt => prompt.prompt.trim()).length;
  };

  const getCompletedVideosCount = () => {
    return videoPrompts.filter(prompt => prompt.videoUrl && !prompt.isGeneratingVideo).length;
  };

  const canProceed = getCompletedVideosCount() >= totalScenes;

  const handleNext = async () => {
    if (!canProceed) {
      toast.error(
        `Please generate videos for all ${totalScenes} scenes to continue`
      );
      return;
    }

    if (!state.campaignId) {
      toast.error("Campaign ID not found");
      return;
    }

    setIsLoading(true);

    try {
      // Update scene data in context with video prompt and URL information
      videoPrompts.forEach((prompt) => {
        dispatch({
          type: "UPDATE_SCENE_DATA",
          payload: {
            sceneNumber: prompt.sceneNumber,
            data: {
              video: {
                prompt: prompt.prompt,
                url: prompt.videoUrl,
                isProcessing: false,
              }
            },
          },
        });
      });

      // Save to database
      const updateData = {
        scene_data: state.sceneData.map((scene) => {
          const prompt = videoPrompts.find(p => p.sceneNumber === scene.scene_number);
          return {
            ...scene,
            video: {
              ...scene.video,
              prompt: prompt?.prompt || scene.video?.prompt || "",
              url: prompt?.videoUrl || scene.video?.url,
              isProcessing: false,
            }
          };
        }),
      };

      const response = await api.updateCampaign(state.campaignId, updateData);
      if (!response.success) {
        throw new Error(response.message || "Failed to save video prompts");
      }

      toast.success("Video prompts and videos saved successfully");
      onNext();
    } catch (error) {
      console.error("Failed to save video prompts:", error);
      toast.error("Failed to save video prompts. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Video Prompts & Generation
        </h2>
        <p className="text-muted-foreground text-sm">
          Create detailed video prompts for each scene and generate AI videos from your images. 
          These prompts will determine how your images are animated and what effects are applied.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Batch Generation Controls - Prompts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generate All Video Prompts</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Auto-generate prompts for all {totalScenes} scenes
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">
                  {getCompletedPromptsCount()}/{totalScenes} prompts created
                </span>
                <CreditDisplay
                  action="VIDEO_PROMPT_GENERATION"
                  currentCredits={currentCredits}
                  onPurchaseClick={() => setShowCreditModal(true)}
                  numberOfScenes={totalScenes}
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  {videoPrompts.some(p => p.prompt.trim()) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllPrompts}
                      disabled={isGeneratingAll}
                    >
                      Clear All
                    </Button>
                  )}
                </div>

                <Button
                  onClick={generateAllVideoPrompts}
                  disabled={isGeneratingAll}
                >
                  {isGeneratingAll ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4 mr-2" />
                  )}
                  {isGeneratingAll
                    ? "Generating..."
                    : "Generate All Prompts"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Batch Generation Controls - Videos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generate All Videos</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Convert all images to videos using prompts
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">
                  {getCompletedVideosCount()}/{totalScenes} videos generated
                </span>
                <CreditDisplay
                  action="VIDEO_GENERATION"
                  currentCredits={currentCredits}
                  onPurchaseClick={() => setShowCreditModal(true)}
                  numberOfScenes={totalScenes}
                />
              </div>

              <Button
                onClick={generateAllVideos}
                disabled={isGeneratingAll || getCompletedPromptsCount() < totalScenes}
                className="w-full"
              >
                {isGeneratingAll ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Film className="w-4 h-4 mr-2" />
                )}
                {isGeneratingAll
                  ? "Generating Videos..."
                  : "Generate All Videos"}
              </Button>

              {getCompletedPromptsCount() < totalScenes && (
                <p className="text-xs text-muted-foreground text-center">
                  Complete all prompts first before generating videos
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scene Video Prompts */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Scene Video Prompts</h3>
          <div className="text-sm text-muted-foreground">
            {getCompletedPromptsCount()}/{totalScenes} prompts completed
          </div>
        </div>

        <div className="grid gap-6">
          {videoPrompts.map((prompt, index) => {
            const sceneData = state.sceneData.find(s => s.scene_number === prompt.sceneNumber);
            
            return (
              <Card key={`${prompt.sceneNumber}-${index}`} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Badge variant="outline">Scene {prompt.sceneNumber}</Badge>
                      <span className="text-base">Scene {prompt.sceneNumber}</span>
                    </CardTitle>
                    <div className="flex items-center space-x-3">
                      {prompt.prompt.trim() && (
                        <div className="flex items-center space-x-1 text-blue-600">
                          <Sparkles className="w-4 h-4" />
                          <span className="text-sm font-medium">Prompt Ready</span>
                        </div>
                      )}
                      {prompt.videoUrl && !prompt.isGeneratingVideo && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Video Generated</span>
                        </div>
                      )}
                      {prompt.isGeneratingVideo && (
                        <div className="flex items-center space-x-1 text-orange-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm font-medium">Generating...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left: Script & Image Preview */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Scene Script:
                        </label>
                        <div className="p-3 bg-muted rounded-lg text-sm max-h-24 overflow-y-auto">
                          {sceneData?.scene_script || "No script available"}
                        </div>
                      </div>

                      {sceneData?.image?.url && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Scene Image:
                          </label>
                          <div className="aspect-square rounded-lg overflow-hidden bg-muted border">
                            <img
                              src={sceneData.image.url}
                              alt={`Scene ${prompt.sceneNumber}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Middle: Video Settings */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Animation Style
                        </label>
                        <Select
                          value={prompt.animationStyle}
                          onValueChange={(value) =>
                            updateVideoPrompt(prompt.sceneNumber, "animationStyle", value)
                          }
                          disabled={prompt.isProcessing}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="smooth-pan">Smooth Pan</SelectItem>
                            <SelectItem value="zoom-in">Zoom In</SelectItem>
                            <SelectItem value="zoom-out">Zoom Out</SelectItem>
                            <SelectItem value="slide-left">Slide Left</SelectItem>
                            <SelectItem value="slide-right">Slide Right</SelectItem>
                            <SelectItem value="fade-transition">Fade Transition</SelectItem>
                            <SelectItem value="dynamic-motion">Dynamic Motion</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Duration (seconds)
                        </label>
                        <Select
                          value={prompt.duration.toString()}
                          onValueChange={(value) =>
                            updateVideoPrompt(prompt.sceneNumber, "duration", parseInt(value))
                          }
                          disabled={prompt.isProcessing}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">2 seconds</SelectItem>
                            <SelectItem value="3">3 seconds</SelectItem>
                            <SelectItem value="4">4 seconds</SelectItem>
                            <SelectItem value="5">5 seconds</SelectItem>
                            <SelectItem value="6">6 seconds</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateVideoPrompt(prompt.sceneNumber)}
                          disabled={
                            prompt.isProcessing || 
                            !sceneData?.scene_script || 
                            isGeneratingAll
                          }
                          className="w-full"
                        >
                          {prompt.isProcessing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4 mr-2" />
                          )}
                          {prompt.isProcessing ? "Generating..." : "Generate Prompt"}
                        </Button>
                      </div>
                    </div>

                    {/* Third: Video Prompt */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Video Prompt
                        </label>
                        <Textarea
                          value={prompt.prompt}
                          onChange={(e) =>
                            updateVideoPrompt(prompt.sceneNumber, "prompt", e.target.value)
                          }
                          placeholder="Describe how the image should be animated and what effects should be applied..."
                          className="min-h-[120px] text-sm"
                          disabled={prompt.isProcessing || prompt.isGeneratingVideo}
                        />
                      </div>

                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateVideo(prompt.sceneNumber)}
                          disabled={
                            !prompt.prompt.trim() || 
                            prompt.isGeneratingVideo || 
                            isGeneratingAll ||
                            !sceneData?.image?.url
                          }
                          className="w-full"
                        >
                          {prompt.isGeneratingVideo ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating ({prompt.generationProgress}%)
                            </>
                          ) : (
                            <>
                              <Film className="w-4 h-4 mr-2" />
                              {prompt.videoUrl ? "Regenerate Video" : "Generate Video"}
                            </>
                          )}
                        </Button>

                        {prompt.isGeneratingVideo && (
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${prompt.generationProgress}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {prompt.prompt && (
                        <div className="text-xs text-muted-foreground border-t pt-3">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{prompt.duration}s duration</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Play className="w-3 h-3" />
                              <span>{prompt.animationStyle}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Fourth: Generated Video Preview */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Generated Video
                        </label>
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted border-2 border-dashed border-muted-foreground/25">
                          {prompt.videoUrl ? (
                            <div className="relative h-full">
                              <video
                                src={prompt.videoUrl}
                                controls
                                className="w-full h-full object-cover"
                                poster={sceneData?.image?.url}
                              >
                                Your browser does not support the video tag.
                              </video>
                              <div className="absolute top-2 right-2">
                                <Badge className="bg-green-600">Generated</Badge>
                              </div>
                            </div>
                          ) : prompt.isGeneratingVideo ? (
                            <div className="flex items-center justify-center h-full text-center">
                              <div>
                                <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                                <p className="text-sm text-muted-foreground">
                                  Generating video...
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {prompt.generationProgress}% complete
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full text-center">
                              <div>
                                <Film className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">
                                  No video generated yet
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Create a prompt and generate video
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {prompt.videoUrl && (
                          <div className="mt-3 space-y-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = prompt.videoUrl!;
                                link.download = `scene-${prompt.sceneNumber}-video.mp4`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="w-full"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Generation Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">
                {totalScenes}
              </div>
              <p className="text-sm text-muted-foreground">Total Scenes</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">
                {getCompletedPromptsCount()}
              </div>
              <p className="text-sm text-muted-foreground">Prompts Created</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">
                {getCompletedVideosCount()}
              </div>
              <p className="text-sm text-muted-foreground">Videos Generated</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">
                {videoPrompts.reduce((total, p) => total + p.duration, 0)}s
              </div>
              <p className="text-sm text-muted-foreground">Total Duration</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Video Prompts Progress</span>
                <span>{getCompletedPromptsCount()}/{totalScenes}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(getCompletedPromptsCount() / totalScenes) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Video Generation Progress</span>
                <span>{getCompletedVideosCount()}/{totalScenes}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(getCompletedVideosCount() / totalScenes) * 100}%`,
                  }}
                />
              </div>
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
          disabled={!canProceed || isLoading || isGeneratingAll}
          className="px-8"
        >
          {isLoading ? "Saving..." : "Next: Final Assembly"}
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