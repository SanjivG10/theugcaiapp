"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Save, Loader2, Play, RefreshCw, Download } from "lucide-react";
import { Campaign } from "@/types/api";

interface VideoGenerationProps {
  campaign: Campaign;
  stepData: Record<string, unknown>;
  onNext: (data: Record<string, unknown>) => Promise<void>;
  onPrevious: () => Promise<void>;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}

interface GeneratedVideo {
  id: string;
  prompt: string;
  status: "pending" | "generating" | "completed" | "failed";
  progress: number;
  url?: string;
  thumbnail?: string;
  duration: number;
}

export function VideoGeneration({
  campaign,
  stepData,
  onNext,
  onPrevious,
  onSave,
  saving,
}: VideoGenerationProps) {
  const videoPrompts = (stepData.video_prompts as any[]) || [];
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>(
    (stepData.generated_videos as GeneratedVideo[]) || []
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    // Initialize videos if not already done
    if (generatedVideos.length === 0 && videoPrompts.length > 0) {
      const initialVideos = videoPrompts.map((prompt, index) => ({
        id: `video_${index + 1}`,
        prompt: prompt.prompt,
        status: "pending" as const,
        progress: 0,
        duration: prompt.duration,
      }));
      setGeneratedVideos(initialVideos);
    }
  }, [videoPrompts, generatedVideos.length]);

  const startGeneration = async () => {
    setIsGenerating(true);
    setIsDirty(true);

    // Update all videos to generating status
    const updatedVideos = generatedVideos.map(video => ({
      ...video,
      status: "generating" as const,
      progress: 0,
    }));
    setGeneratedVideos(updatedVideos);

    // Simulate video generation process
    for (let i = 0; i < updatedVideos.length; i++) {
      // Simulate generation progress for each video
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        
        setGeneratedVideos(prev => prev.map((video, index) => 
          index === i 
            ? { ...video, progress }
            : video
        ));
      }

      // Mark video as completed with mock data
      setGeneratedVideos(prev => prev.map((video, index) => 
        index === i 
          ? { 
              ...video, 
              status: "completed" as const,
              progress: 100,
              url: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`, // Mock video URL
              thumbnail: `https://picsum.photos/400/225?random=${i + 10}`, // Mock thumbnail
            }
          : video
      ));
    }

    setIsGenerating(false);
  };

  const retryVideo = async (videoId: string) => {
    setGeneratedVideos(prev => prev.map(video => 
      video.id === videoId 
        ? { ...video, status: "generating", progress: 0 }
        : video
    ));

    // Simulate retry
    setTimeout(() => {
      setGeneratedVideos(prev => prev.map(video => 
        video.id === videoId 
          ? { 
              ...video, 
              status: "completed",
              progress: 100,
              url: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4`,
              thumbnail: `https://picsum.photos/400/225?random=${Date.now()}`,
            }
          : video
      ));
    }, 3000);
  };

  const handleNext = async () => {
    await onNext({
      generated_videos: generatedVideos,
      video_generation_completed: true,
    });
  };

  const handleSave = async () => {
    await onSave({
      generated_videos: generatedVideos,
    });
    setIsDirty(false);
  };

  const completedVideos = generatedVideos.filter(v => v.status === "completed");
  const failedVideos = generatedVideos.filter(v => v.status === "failed");
  const generatingVideos = generatedVideos.filter(v => v.status === "generating");

  const overallProgress = generatedVideos.length > 0 
    ? (generatedVideos.reduce((sum, video) => sum + video.progress, 0) / generatedVideos.length)
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Video Generation</CardTitle>
          <CardDescription>
            Generate AI videos based on your prompts. This process may take several minutes depending 
            on the number and complexity of your video scenes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Generation Status */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <Badge variant="outline">
                    {completedVideos.length} of {generatedVideos.length} completed
                  </Badge>
                  {failedVideos.length > 0 && (
                    <Badge variant="destructive">
                      {failedVideos.length} failed
                    </Badge>
                  )}
                  {generatingVideos.length > 0 && (
                    <Badge variant="secondary">
                      {generatingVideos.length} generating
                    </Badge>
                  )}
                </div>
                {isGenerating && (
                  <div className="space-y-2">
                    <Progress value={overallProgress} className="w-64" />
                    <p className="text-sm text-muted-foreground">
                      Generating videos... {Math.round(overallProgress)}% complete
                    </p>
                  </div>
                )}
              </div>

              {!isGenerating && completedVideos.length === 0 && (
                <Button onClick={startGeneration} disabled={generatedVideos.length === 0}>
                  <Play className="mr-2 h-4 w-4" />
                  Start Generation
                </Button>
              )}
            </div>

            {/* Video Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {generatedVideos.map((video, index) => (
                <Card key={video.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          Scene {index + 1}
                        </Label>
                        <Badge 
                          variant={
                            video.status === "completed" ? "default" :
                            video.status === "failed" ? "destructive" :
                            video.status === "generating" ? "secondary" : "outline"
                          }
                        >
                          {video.status}
                        </Badge>
                      </div>

                      {/* Video Preview */}
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                        {video.status === "completed" && video.url ? (
                          <video 
                            controls 
                            poster={video.thumbnail}
                            className="w-full h-full object-cover"
                          >
                            <source src={video.url} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        ) : video.status === "generating" ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center space-y-2">
                              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                              <Progress value={video.progress} className="w-32" />
                              <p className="text-xs text-muted-foreground">
                                {video.progress}% complete
                              </p>
                            </div>
                          </div>
                        ) : video.status === "failed" ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center space-y-2">
                              <p className="text-sm text-destructive">Generation failed</p>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => retryVideo(video.id)}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <Play className="h-8 w-8" />
                          </div>
                        )}
                      </div>

                      {/* Prompt */}
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {video.prompt}
                      </p>

                      {/* Actions */}
                      {video.status === "completed" && (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {generatedVideos.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No video prompts found. Please go back to create video prompts first.
              </div>
            )}

            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={onPrevious} disabled={saving || isGenerating}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                {isDirty && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Progress
                      </>
                    )}
                  </Button>
                )}

                <Button 
                  onClick={handleNext} 
                  disabled={saving || isGenerating || completedVideos.length === 0}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Continue to Final Assembly
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}