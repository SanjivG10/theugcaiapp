"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useCampaign } from "@/contexts/CampaignContext";
import {
  Play,
  Download,
  Loader2,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  CheckCircle,
  ArrowLeft,
  Share2,
  Copy,
  Trophy,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { URLS } from "@/constants/urls";
import toast from "react-hot-toast";

interface FinalAssemblyProps {
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

const TRANSITION_STYLES = [
  { value: "fade", label: "Fade" },
  { value: "cut", label: "Cut" },
  { value: "slide", label: "Slide" },
  { value: "zoom", label: "Zoom" },
  { value: "dissolve", label: "Dissolve" },
];

const EXPORT_FORMATS = [
  {
    value: "mp4",
    label: "MP4 (Recommended)",
    description: "Best compatibility",
  },
  { value: "mov", label: "MOV", description: "High quality" },
  { value: "webm", label: "WEBM", description: "Smallest size" },
];

const ASPECT_RATIOS = [
  {
    value: "16:9",
    label: "16:9 (YouTube, Facebook)",
    width: 1920,
    height: 1080,
  },
  {
    value: "9:16",
    label: "9:16 (TikTok, Instagram Stories)",
    width: 1080,
    height: 1920,
  },
  { value: "1:1", label: "1:1 (Instagram Square)", width: 1080, height: 1080 },
  { value: "4:5", label: "4:5 (Instagram Feed)", width: 1080, height: 1350 },
];

const QUALITY_OPTIONS = [
  {
    value: "720p",
    label: "720p HD",
    description: "Good quality, smaller file",
  },
  {
    value: "1080p",
    label: "1080p Full HD",
    description: "High quality (recommended)",
  },
  {
    value: "4k",
    label: "4K Ultra HD",
    description: "Highest quality, large file",
  },
];

export function FinalAssembly({ onPrev }: FinalAssemblyProps) {
  const { state, dispatch } = useCampaign();
  const router = useRouter();
  const [isAssembling, setIsAssembling] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [assemblySettings, setAssemblySettings] = useState({
    transition: "fade",
    musicEnabled: true,
    musicVolume: 50,
    format: "mp4",
    aspectRatio: "16:9",
    quality: "1080p",
  });

  const completedVideos = state.generatedVideos.filter(
    (v) => v.status === "completed"
  );
  const totalDuration = state.videoPrompts.reduce(
    (sum, prompt) => sum + prompt.duration,
    0
  );

  useEffect(() => {
    // Auto-assemble video if not already done
    if (!state.finalVideoUrl && completedVideos.length > 0) {
      assembleVideo();
    }
  }, [completedVideos.length, state.finalVideoUrl, assembleVideo]);

  const assembleVideo = useCallback(async () => {
    setIsAssembling(true);
    try {
      // Simulate video assembly process
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const finalVideoUrl = `/api/placeholder/final-video/${state.campaignName.replace(
        /\s+/g,
        "-"
      )}.mp4`;
      dispatch({ type: "SET_FINAL_VIDEO_URL", payload: finalVideoUrl });
      
      // Generate shareable link
      const shareableUrl = `${window.location.origin}/share/${state.campaignName.replace(/\s+/g, '-').toLowerCase()}`;
      setShareUrl(shareableUrl);

      toast.success("Video assembled successfully!");
    } catch (error) {
      toast.error("Failed to assemble video. Please try again.");
    } finally {
      setIsAssembling(false);
    }
  }, [state.campaignName, dispatch]);

  const exportVideo = async () => {
    if (!state.finalVideoUrl) {
      toast.error("Please assemble the video first");
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate export progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setExportProgress(progress);
      }

      // Trigger download
      const link = document.createElement("a");
      link.href = state.finalVideoUrl;
      link.download = `${state.campaignName}-final.${assemblySettings.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Video exported successfully!");
      setShowCongratulations(true);
    } catch (error) {
      toast.error("Failed to export video");
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const createNewCampaign = () => {
    router.push(URLS.CAMPAIGN.CREATE);
  };

  const goToDashboard = () => {
    router.push(URLS.DASHBOARD.HOME);
  };

  const shareVideo = () => {
    if (navigator.share && shareUrl) {
      navigator.share({
        title: `${state.campaignName} - AI Generated Video`,
        text: `Check out my AI-generated video: ${state.campaignName}`,
        url: shareUrl,
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast.success('Share link copied to clipboard!');
      }).catch(() => {
        toast.error('Failed to copy link');
      });
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success('Link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  return (
    <div className="space-y-8">
      {/* Congratulations Modal */}
      {showCongratulations && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="text-center py-8">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Trophy className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      🎉 Congratulations!
                    </h3>
                    <p className="text-muted-foreground">
                      Your AI-generated video &apos;{state.campaignName}&apos; has been successfully created and exported!
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="font-medium">{completedVideos.length}</div>
                      <div className="text-muted-foreground">Scenes</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="font-medium">{totalDuration}s</div>
                      <div className="text-muted-foreground">Duration</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button onClick={() => setShowCongratulations(false)} className="w-full">
                    Continue Editing
                  </Button>
                  <Button variant="outline" onClick={createNewCampaign} className="w-full">
                    Create New Campaign
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      <div>
        <div className="flex items-center space-x-3 mb-2">
          <h2 className="text-xl font-semibold text-foreground">
            Final Video Assembly
          </h2>
          {state.finalVideoUrl && (
            <div className="flex items-center space-x-1 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Ready</span>
            </div>
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          Preview your final video and customize export settings before downloading.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video Player - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Video Preview</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{totalDuration}s duration</Badge>
                  <Badge variant="secondary">
                    {completedVideos.length} clips
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Video Player Mockup */}
                <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                  {isAssembling ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
                        <p className="text-lg font-medium">
                          Assembling your video...
                        </p>
                        <p className="text-sm opacity-75">
                          Combining {completedVideos.length} clips
                        </p>
                      </div>
                    </div>
                  ) : state.finalVideoUrl ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        size="lg"
                        variant="secondary"
                        className="rounded-full p-6"
                      >
                        <Play className="w-8 h-8" />
                      </Button>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium opacity-75">
                          Video not ready
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Video Controls */}
                  {state.finalVideoUrl && !isAssembling && (
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-black/50 rounded-lg p-4">
                        <div className="flex items-center space-x-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-white"
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                          <div className="flex-1 bg-white/20 rounded-full h-1">
                            <div className="bg-white rounded-full h-1 w-0"></div>
                          </div>
                          <span className="text-white text-sm">
                            0:00 / {totalDuration}s
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-white"
                          >
                            {assemblySettings.musicEnabled ? (
                              <Volume2 className="w-4 h-4" />
                            ) : (
                              <VolumeX className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-white"
                          >
                            <Maximize className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-3">Video Timeline</h4>
                  <div className="flex space-x-2">
                    {state.videoPrompts.map((prompt, index) => {
                      const video = completedVideos.find(
                        (v) => v.imageId === prompt.imageId
                      );
                      const image = state.generatedImages.find(
                        (img) => img.id === prompt.imageId
                      );

                      return (
                        <div
                          key={prompt.id}
                          className="flex-1 bg-primary/10 rounded p-2 text-center"
                          style={{
                            minWidth: `${
                              (prompt.duration / totalDuration) * 100
                            }%`,
                          }}
                        >
                          <div className="text-xs font-medium">
                            Scene {index + 1}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {prompt.duration}s
                          </div>
                          {video && (
                            <CheckCircle className="w-3 h-3 text-green-600 mx-auto mt-1" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Assembly Options</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Transition Style
                </label>
                <Select
                  value={assemblySettings.transition}
                  onValueChange={(value) =>
                    setAssemblySettings((prev) => ({
                      ...prev,
                      transition: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSITION_STYLES.map((style) => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Background Music
                  </label>
                  <Switch
                    checked={assemblySettings.musicEnabled}
                    onCheckedChange={(checked) =>
                      setAssemblySettings((prev) => ({
                        ...prev,
                        musicEnabled: checked,
                      }))
                    }
                  />
                </div>

                {assemblySettings.musicEnabled && (
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Music Volume: {assemblySettings.musicVolume}%
                    </label>
                    <Slider
                      value={[assemblySettings.musicVolume]}
                      onValueChange={(value) =>
                        setAssemblySettings((prev) => ({
                          ...prev,
                          musicVolume: value[0],
                        }))
                      }
                      max={100}
                      step={10}
                    />
                  </div>
                )}
              </div>

              {!state.finalVideoUrl && (
                <Button
                  onClick={assembleVideo}
                  disabled={isAssembling || completedVideos.length === 0}
                  className="w-full"
                >
                  {isAssembling ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  {isAssembling ? "Assembling..." : "Assemble Video"}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Format</label>
                <Select
                  value={assemblySettings.format}
                  onValueChange={(value) =>
                    setAssemblySettings((prev) => ({ ...prev, format: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPORT_FORMATS.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        <div>
                          <div>{format.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {format.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Aspect Ratio
                </label>
                <Select
                  value={assemblySettings.aspectRatio}
                  onValueChange={(value) =>
                    setAssemblySettings((prev) => ({
                      ...prev,
                      aspectRatio: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASPECT_RATIOS.map((ratio) => (
                      <SelectItem key={ratio.value} value={ratio.value}>
                        <div>
                          <div>{ratio.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {ratio.width}×{ratio.height}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Quality
                </label>
                <Select
                  value={assemblySettings.quality}
                  onValueChange={(value) =>
                    setAssemblySettings((prev) => ({ ...prev, quality: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUALITY_OPTIONS.map((quality) => (
                      <SelectItem key={quality.value} value={quality.value}>
                        <div>
                          <div>{quality.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {quality.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isExporting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Exporting...</span>
                    <span>{exportProgress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={exportVideo}
                disabled={!state.finalVideoUrl || isExporting}
                className="w-full"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {isExporting
                  ? `Exporting... ${exportProgress}%`
                  : "Download Video"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-border">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={goToDashboard}>
            Go to Dashboard
          </Button>
          <Button onClick={createNewCampaign}>Create New Campaign</Button>
        </div>
      </div>
    </div>
  );
}
