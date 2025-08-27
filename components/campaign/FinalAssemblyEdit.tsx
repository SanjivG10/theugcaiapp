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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useCampaign } from "@/contexts/CampaignContext";
import { api } from "@/lib/api";
import {
  Clock,
  Download,
  Film,
  Loader2,
  Music,
  Play,
  Settings,
  Volume2,
  Wand2,
} from "lucide-react";
import toast from "react-hot-toast";

interface FinalAssemblyEditProps {
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

interface VideoSettings {
  resolution: "720p" | "1080p" | "4k";
  aspectRatio: "16:9" | "9:16" | "1:1";
  format: "mp4" | "mov" | "webm";
  quality: "standard" | "high" | "premium";
  frameRate: 24 | 30 | 60;
}

interface AudioSettings {
  includeBackgroundMusic: boolean;
  backgroundMusicVolume: number;
  voiceOverVolume: number;
  musicTrack: "upbeat" | "corporate" | "cinematic" | "none";
  fadeInOut: boolean;
}

export function FinalAssemblyEdit({ onNext, onPrev }: FinalAssemblyEditProps) {
  const { state, dispatch } = useCampaign();
  const totalScenes = state.sceneNumber;

  const [videoSettings, setVideoSettings] = useState<VideoSettings>({
    resolution: "1080p",
    aspectRatio: "16:9",
    format: "mp4",
    quality: "high",
    frameRate: 30,
  });

  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    includeBackgroundMusic: true,
    backgroundMusicVolume: 30,
    voiceOverVolume: 80,
    musicTrack: "upbeat",
    fadeInOut: true,
  });

  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string>("");
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

  // Load existing final video URL if available
  React.useEffect(() => {
    if (state.finalUrl) {
      setVideoUrl(state.finalUrl);
    }
  }, [state.finalUrl]);

  const generateFinalVideo = async () => {
    // Check if all scenes have required data
    const missingData = state.sceneData.filter(
      scene => !scene.scene_script || !scene.image?.url || !scene.video?.prompt
    );

    if (missingData.length > 0) {
      toast.error("All scenes need scripts, images, and video prompts before generating the final video");
      return;
    }

    // Check credits before generating
    try {
      const creditCheckResponse = await api.checkCredits({
        action: "FINAL_VIDEO_ASSEMBLY",
        scenes: totalScenes,
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

    setIsGeneratingVideo(true);
    setGenerationProgress(0);

    try {
      // Start video generation process
      const response = await api.generateFinalVideo({
        campaignId: state.campaignId!,
        videoSettings: videoSettings,
        audioSettings: audioSettings,
        sceneData: state.sceneData,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to start video generation");
      }

      const jobId = response.data?.jobId;
      if (!jobId) {
        throw new Error("No job ID received from video generation API");
      }

      // Poll for progress
      const pollProgress = async () => {
        try {
          const progressResponse = await api.getVideoGenerationProgress(jobId);
          
          if (progressResponse.success && progressResponse.data) {
            const { progress, status, videoUrl: generatedUrl } = progressResponse.data;
            
            setGenerationProgress(progress || 0);

            if (status === "completed" && generatedUrl) {
              setVideoUrl(generatedUrl);
              dispatch({ type: "SET_FINAL_URL", payload: generatedUrl });
              
              // Save to campaign
              await api.updateCampaign(state.campaignId!, {
                final_url: generatedUrl,
                status: "completed",
              });

              setCurrentCredits(prev => prev - 5); // Assuming 5 credits for final video
              toast.success("Final video generated successfully!");
              setIsGeneratingVideo(false);
              return;
            } else if (status === "failed") {
              throw new Error("Video generation failed");
            }

            // Continue polling if still processing
            if (status === "processing") {
              setTimeout(pollProgress, 3000); // Poll every 3 seconds
            }
          }
        } catch (error) {
          console.error("Failed to check video generation progress:", error);
          toast.error("Failed to check generation progress");
          setIsGeneratingVideo(false);
        }
      };

      // Start polling
      setTimeout(pollProgress, 3000);

    } catch (error) {
      console.error("Failed to generate final video:", error);
      toast.error("Failed to generate final video. Please try again.");
      setIsGeneratingVideo(false);
    }
  };

  const downloadVideo = () => {
    if (videoUrl) {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = `${state.campaignName}-final-video.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Video download started");
    }
  };

  const canProceed = !!videoUrl;
  const scenesReady = state.sceneData.filter(
    scene => scene.scene_script && scene.image?.url && scene.video?.prompt
  ).length;

  const getTotalDuration = () => {
    return state.sceneData.reduce((total, scene) => {
      // Assume 3 seconds per scene if no specific duration set
      return total + 3;
    }, 0);
  };

  const handleNext = async () => {
    if (!canProceed) {
      toast.error("Please generate the final video before proceeding");
      return;
    }

    setIsLoading(true);

    try {
      // Update campaign status and current step
      if (state.campaignId) {
        await api.updateCampaign(state.campaignId, {
          current_step: 5, // Next step is Preview & Export
          status: "completed",
        });

        dispatch({ type: "SET_CURRENT_STEP", payload: 5 });
        dispatch({ type: "SET_STATUS", payload: "completed" });
      }

      onNext();
    } catch (error) {
      console.error("Failed to update campaign:", error);
      toast.error("Failed to proceed to next step");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Final Assembly & Edit
        </h2>
        <p className="text-muted-foreground text-sm">
          Configure video settings and generate your final video. This step combines all your scenes, 
          scripts, images, and video prompts into the completed video.
        </p>
      </div>

      {/* Scene Readiness Check */}
      <Card>
        <CardHeader>
          <CardTitle>Scene Readiness</CardTitle>
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
              <div className="text-3xl font-bold text-green-600">
                {scenesReady}
              </div>
              <p className="text-sm text-muted-foreground">Scenes Ready</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">
                {getTotalDuration()}s
              </div>
              <p className="text-sm text-muted-foreground">Est. Duration</p>
            </div>
            <div>
              <div className={`text-3xl font-bold ${videoUrl ? "text-green-600" : "text-gray-400"}`}>
                {videoUrl ? "✓" : "○"}
              </div>
              <p className="text-sm text-muted-foreground">Final Video</p>
            </div>
          </div>

          {scenesReady < totalScenes && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-amber-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-amber-800 font-medium">
                  {totalScenes - scenesReady} scenes still need completion before generating the final video
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Settings */}
        <div className="space-y-6">
          {/* Video Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Video Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Resolution</label>
                  <Select
                    value={videoSettings.resolution}
                    onValueChange={(value: VideoSettings["resolution"]) =>
                      setVideoSettings(prev => ({ ...prev, resolution: value }))
                    }
                    disabled={isGeneratingVideo}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="720p">720p (HD)</SelectItem>
                      <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                      <SelectItem value="4k">4K (Ultra HD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Aspect Ratio</label>
                  <Select
                    value={videoSettings.aspectRatio}
                    onValueChange={(value: VideoSettings["aspectRatio"]) =>
                      setVideoSettings(prev => ({ ...prev, aspectRatio: value }))
                    }
                    disabled={isGeneratingVideo}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                      <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                      <SelectItem value="1:1">1:1 (Square)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Quality</label>
                  <Select
                    value={videoSettings.quality}
                    onValueChange={(value: VideoSettings["quality"]) =>
                      setVideoSettings(prev => ({ ...prev, quality: value }))
                    }
                    disabled={isGeneratingVideo}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Frame Rate</label>
                  <Select
                    value={videoSettings.frameRate.toString()}
                    onValueChange={(value) =>
                      setVideoSettings(prev => ({ ...prev, frameRate: parseInt(value) as VideoSettings["frameRate"] }))
                    }
                    disabled={isGeneratingVideo}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24 FPS</SelectItem>
                      <SelectItem value="30">30 FPS</SelectItem>
                      <SelectItem value="60">60 FPS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audio Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Volume2 className="w-5 h-5" />
                <span>Audio Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Include Background Music</label>
                <Switch
                  checked={audioSettings.includeBackgroundMusic}
                  onCheckedChange={(checked) =>
                    setAudioSettings(prev => ({ ...prev, includeBackgroundMusic: checked }))
                  }
                  disabled={isGeneratingVideo}
                />
              </div>

              {audioSettings.includeBackgroundMusic && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Music Track</label>
                    <Select
                      value={audioSettings.musicTrack}
                      onValueChange={(value: AudioSettings["musicTrack"]) =>
                        setAudioSettings(prev => ({ ...prev, musicTrack: value }))
                      }
                      disabled={isGeneratingVideo}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upbeat">Upbeat & Energetic</SelectItem>
                        <SelectItem value="corporate">Corporate & Professional</SelectItem>
                        <SelectItem value="cinematic">Cinematic & Dramatic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Background Music Volume: {audioSettings.backgroundMusicVolume}%
                    </label>
                    <Slider
                      value={[audioSettings.backgroundMusicVolume]}
                      onValueChange={([value]) =>
                        setAudioSettings(prev => ({ ...prev, backgroundMusicVolume: value }))
                      }
                      max={100}
                      step={5}
                      disabled={isGeneratingVideo}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Voice Over Volume: {audioSettings.voiceOverVolume}%
                </label>
                <Slider
                  value={[audioSettings.voiceOverVolume]}
                  onValueChange={([value]) =>
                    setAudioSettings(prev => ({ ...prev, voiceOverVolume: value }))
                  }
                  max={100}
                  step={5}
                  disabled={isGeneratingVideo}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Fade In/Out Effects</label>
                <Switch
                  checked={audioSettings.fadeInOut}
                  onCheckedChange={(checked) =>
                    setAudioSettings(prev => ({ ...prev, fadeInOut: checked }))
                  }
                  disabled={isGeneratingVideo}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Generation & Preview */}
        <div className="space-y-6">
          {/* Video Generation */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Film className="w-5 h-5" />
                  <span>Final Video Generation</span>
                </CardTitle>
                <CreditDisplay
                  action="FINAL_VIDEO_ASSEMBLY"
                  currentCredits={currentCredits}
                  onPurchaseClick={() => setShowCreditModal(true)}
                  numberOfScenes={1}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!videoUrl && (
                <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No final video generated yet
                  </p>
                  <Button
                    onClick={generateFinalVideo}
                    disabled={scenesReady < totalScenes || isGeneratingVideo}
                    size="lg"
                  >
                    {isGeneratingVideo ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4 mr-2" />
                    )}
                    {isGeneratingVideo ? "Generating Video..." : "Generate Final Video"}
                  </Button>
                </div>
              )}

              {isGeneratingVideo && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Generation Progress</span>
                    <span>{generationProgress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    This may take 5-10 minutes depending on video length and quality
                  </p>
                </div>
              )}

              {videoUrl && (
                <div className="space-y-4">
                  <div className="aspect-video rounded-lg overflow-hidden bg-black">
                    <video
                      src={videoUrl}
                      controls
                      className="w-full h-full"
                      poster="/video-placeholder.jpg"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={downloadVideo}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Video
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => generateFinalVideo()}
                      disabled={isGeneratingVideo}
                    >
                      <Loader2 className="w-4 h-4 mr-2" />
                      Regenerate
                    </Button>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-green-800 font-medium">
                        Final video generated successfully!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Video Info */}
          {videoUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Video Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Resolution:</span>
                  <span>{videoSettings.resolution}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Aspect Ratio:</span>
                  <span>{videoSettings.aspectRatio}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quality:</span>
                  <span className="capitalize">{videoSettings.quality}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration:</span>
                  <span>~{getTotalDuration()}s</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Scenes:</span>
                  <span>{totalScenes}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-border">
        <Button variant="outline" onClick={onPrev}>
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canProceed || isLoading || isGeneratingVideo}
          className="px-8"
        >
          {isLoading ? "Saving..." : "Next: Preview & Export"}
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