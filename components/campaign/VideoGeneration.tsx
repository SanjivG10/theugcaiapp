"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { GeneratedVideo, useCampaign } from "@/contexts/CampaignContext";
import {
  CheckCircle,
  Clock,
  Eye,
  Loader2,
  Play,
  RefreshCw,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";

interface VideoGenerationProps {
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

export function VideoGeneration({ onNext, onPrev }: VideoGenerationProps) {
  const { state, dispatch } = useCampaign();
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedImages = state.generatedImages.filter((img) =>
    state.selectedImages.includes(img.id)
  );


  const generateSingleVideo = async (prompt: any) => {
    const existingVideo = state.generatedVideos.find(v => v.imageId === prompt.imageId);
    let videoId;
    
    if (existingVideo) {
      videoId = existingVideo.id;
    } else {
      // Create new video entry
      const newVideo: GeneratedVideo = {
        id: Math.random().toString(36).substr(2, 9),
        imageId: prompt.imageId,
        url: "",
        status: "queued",
        progress: 0,
      };
      dispatch({ type: "ADD_GENERATED_VIDEO", payload: newVideo });
      videoId = newVideo.id;
    }

    try {
      // Update to processing
      dispatch({
        type: "UPDATE_GENERATED_VIDEO",
        payload: {
          id: videoId,
          updates: { status: "processing", progress: 0 },
        },
      });

      // Simulate video generation progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        dispatch({
          type: "UPDATE_GENERATED_VIDEO",
          payload: { id: videoId, updates: { progress } },
        });
      }

      // Complete generation
      const mockVideoUrl = `/api/placeholder/video/${videoId}.mp4`;
      dispatch({
        type: "UPDATE_GENERATED_VIDEO",
        payload: {
          id: videoId,
          updates: {
            status: "completed",
            progress: 100,
            url: mockVideoUrl,
          },
        },
      });

      toast.success("Video generated successfully!");
    } catch (error) {
      dispatch({
        type: "UPDATE_GENERATED_VIDEO",
        payload: { id: videoId, updates: { status: "failed" } },
      });
      toast.error("Failed to generate video");
    }
  };

  const startVideoGeneration = useCallback(async () => {
    setIsGenerating(true);

    // Create initial video entries for all prompts
    const videoEntries: GeneratedVideo[] = state.videoPrompts.map((prompt) => ({
      id: Math.random().toString(36).substr(2, 9),
      imageId: prompt.imageId,
      url: "",
      status: "queued",
      progress: 0,
    }));

    // Add to state
    videoEntries.forEach((video) => {
      dispatch({ type: "ADD_GENERATED_VIDEO", payload: video });
    });

    // Process each video sequentially
    for (let i = 0; i < videoEntries.length; i++) {
      const video = videoEntries[i];
      const prompt = state.videoPrompts.find(
        (p) => p.imageId === video.imageId
      );

      if (!prompt) continue;

      try {
        // Update to processing
        dispatch({
          type: "UPDATE_GENERATED_VIDEO",
          payload: {
            id: video.id,
            updates: { status: "processing", progress: 0 },
          },
        });

        // Simulate video generation progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          dispatch({
            type: "UPDATE_GENERATED_VIDEO",
            payload: { id: video.id, updates: { progress } },
          });
        }

        // Complete generation
        const mockVideoUrl = `/api/placeholder/video/${video.id}.mp4`;
        dispatch({
          type: "UPDATE_GENERATED_VIDEO",
          payload: {
            id: video.id,
            updates: {
              status: "completed",
              progress: 100,
              url: mockVideoUrl,
            },
          },
        });

        toast.success(`Video ${i + 1} generated successfully!`);
      } catch (error) {
        dispatch({
          type: "UPDATE_GENERATED_VIDEO",
          payload: { id: video.id, updates: { status: "failed" } },
        });
        toast.error(`Failed to generate video ${i + 1}`);
      }
    }

    setIsGenerating(false);
  }, [state.videoPrompts, dispatch]);

  const regenerateVideo = async (videoId: string) => {
    const video = state.generatedVideos.find((v) => v.id === videoId);
    if (!video) return;

    dispatch({
      type: "UPDATE_GENERATED_VIDEO",
      payload: { id: videoId, updates: { status: "processing", progress: 0 } },
    });

    try {
      // Simulate regeneration
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        dispatch({
          type: "UPDATE_GENERATED_VIDEO",
          payload: { id: videoId, updates: { progress } },
        });
      }

      const newVideoUrl = `/api/placeholder/video/${videoId}-${Date.now()}.mp4`;
      dispatch({
        type: "UPDATE_GENERATED_VIDEO",
        payload: {
          id: videoId,
          updates: {
            status: "completed",
            progress: 100,
            url: newVideoUrl,
          },
        },
      });

      toast.success("Video regenerated successfully!");
    } catch (error) {
      dispatch({
        type: "UPDATE_GENERATED_VIDEO",
        payload: { id: videoId, updates: { status: "failed" } },
      });
      toast.error("Failed to regenerate video");
    }
  };

  const completedVideos = state.generatedVideos.filter(
    (v) => v.status === "completed"
  );
  const processingVideos = state.generatedVideos.filter(
    (v) => v.status === "processing"
  );
  const failedVideos = state.generatedVideos.filter(
    (v) => v.status === "failed"
  );

  const canProceed =
    completedVideos.length === state.videoPrompts.length &&
    completedVideos.length > 0;

  const getOverallProgress = () => {
    if (state.generatedVideos.length === 0) return 0;
    const totalProgress = state.generatedVideos.reduce(
      (sum, video) => sum + (video.progress || 0),
      0
    );
    return totalProgress / state.generatedVideos.length;
  };

  const estimatedTimeRemaining = () => {
    const remainingVideos = state.videoPrompts.length - completedVideos.length;
    return remainingVideos * 30; // 30 seconds per video estimate
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Generate Videos
        </h2>
        <p className="text-muted-foreground text-sm">
          Your images are being processed by Kling AI. This may take a few
          minutes per video.
        </p>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Generation Progress</CardTitle>
            <Badge variant={canProceed ? "default" : "secondary"}>
              {completedVideos.length} of {state.videoPrompts.length} completed
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Progress</span>
              <span>{Math.round(getOverallProgress())}%</span>
            </div>
            <Progress value={getOverallProgress()} className="h-2" />
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {completedVideos.length}
              </div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {processingVideos.length}
              </div>
              <p className="text-sm text-muted-foreground">Processing</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {failedVideos.length}
              </div>
              <p className="text-sm text-muted-foreground">Failed</p>
            </div>
          </div>

          {processingVideos.length > 0 && (
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Estimated time remaining: {estimatedTimeRemaining()}s</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Generation Queue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {state.videoPrompts.map((prompt, index) => {
          const image = selectedImages.find((img) => img.id === prompt.imageId);
          const video = state.generatedVideos.find(
            (v) => v.imageId === prompt.imageId
          );

          if (!image) return null;

          return (
            <Card key={prompt.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Video {index + 1}</CardTitle>
                  <div className="flex items-center space-x-2">
                    {video?.status === "completed" && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    {video?.status === "processing" && (
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    )}
                    {video?.status === "failed" && (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    {video?.status === "queued" && (
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Image Preview */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Source Image</p>
                    <div className="aspect-square rounded-lg overflow-hidden">
                      <Image
                        src={image.url}
                        alt={`Scene ${image.sceneNumber}`}
                        width={150}
                        height={150}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Generated Video</p>
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted border-2 border-dashed border-muted-foreground/25">
                      {video?.status === "completed" ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <Button variant="ghost" className="h-full w-full">
                            <Play className="w-8 h-8" />
                          </Button>
                        </div>
                      ) : video?.status === "processing" ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                            <p className="text-xs text-muted-foreground">
                              {video.progress}%
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">
                              {video?.status === "queued"
                                ? "Queued"
                                : "Pending"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {video?.status === "processing" && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Generating...</span>
                      <span>{video.progress}%</span>
                    </div>
                    <Progress value={video.progress || 0} className="h-2" />
                  </div>
                )}

                {/* Status Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Animation:</span>
                    <span className="capitalize">{prompt.animationStyle}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{prompt.duration}s</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge
                      variant={
                        video?.status === "completed"
                          ? "default"
                          : video?.status === "processing"
                          ? "secondary"
                          : video?.status === "failed"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {video?.status || "queued"}
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  {video?.status === "completed" && (
                    <>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => regenerateVideo(video.id)}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {video?.status === "failed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => regenerateVideo(video.id)}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Retry
                    </Button>
                  )}
                  {(!video || video?.status === "queued") && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => generateSingleVideo(prompt)}
                      disabled={isGenerating}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Generate Video
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Actions */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Batch Generation</h3>
              <p className="text-muted-foreground text-sm">
                Generate all remaining videos at once
              </p>
            </div>
            <Button 
              onClick={startVideoGeneration} 
              size="lg"
              disabled={isGenerating || completedVideos.length === state.videoPrompts.length}
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Play className="w-5 h-5 mr-2" />
              )}
              {isGenerating ? 'Generating...' : 'Generate All Videos'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-border">
        <Button variant="outline" onClick={onPrev}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!canProceed} className="px-8">
          Next: Assemble Final Video ({completedVideos.length} videos ready)
        </Button>
      </div>
    </div>
  );
}
