"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCampaign } from "@/contexts/CampaignContext";
import { api } from "@/lib/api";
import {
  CheckCircle,
  Clock,
  Copy,
  Download,
  Film,
  Heart,
  Link,
  Mail,
  Share2,
  Star,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

interface PreviewExportProps {
  onNext?: () => void;
  onPrev: () => void;
  canGoNext?: boolean;
  canGoPrev: boolean;
}

interface ShareSettings {
  title: string;
  description: string;
  tags: string[];
  isPublic: boolean;
}

interface ExportFormat {
  format: "mp4" | "mov" | "webm" | "gif";
  quality: "standard" | "high" | "premium";
  resolution: "720p" | "1080p" | "4k";
}

export function PreviewExport({ onPrev }: PreviewExportProps) {
  const { state, dispatch } = useCampaign();

  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    title: state.campaignName,
    description: state.description || "",
    tags: [],
    isPublic: false,
  });

  const [newTag, setNewTag] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [selectedExportFormat, setSelectedExportFormat] = useState<ExportFormat>({
    format: "mp4",
    quality: "high",
    resolution: "1080p",
  });
  const [isExporting, setIsExporting] = useState(false);

  const videoUrl = state.finalUrl;
  const totalScenes = state.sceneNumber;

  // Load existing share URL if available
  React.useEffect(() => {
    const loadShareData = async () => {
      if (!state.campaignId) return;

      try {
        const response = await api.getCampaign(state.campaignId);
        if (response.success && response.data?.share_url) {
          setShareUrl(response.data.share_url);
        }
      } catch (error) {
        console.error("Failed to load share data:", error);
      }
    };

    loadShareData();
  }, [state.campaignId]);

  const addTag = () => {
    if (newTag.trim() && !shareSettings.tags.includes(newTag.trim())) {
      setShareSettings(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setShareSettings(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const generateShareLink = async () => {
    if (!videoUrl || !state.campaignId) {
      toast.error("No video available to share");
      return;
    }

    setIsGeneratingShare(true);

    try {
      const response = await api.createVideoShare({
        campaignId: state.campaignId,
        title: shareSettings.title,
        description: shareSettings.description,
        tags: shareSettings.tags,
        isPublic: shareSettings.isPublic,
      });

      if (response.success && response.data?.shareUrl) {
        setShareUrl(response.data.shareUrl);
        toast.success("Share link generated successfully!");
      } else {
        throw new Error(response.message || "Failed to generate share link");
      }
    } catch (error) {
      console.error("Failed to generate share link:", error);
      toast.error("Failed to generate share link. Please try again.");
    } finally {
      setIsGeneratingShare(false);
    }
  };

  const copyShareLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy share link:", error);
      toast.error("Failed to copy share link");
    }
  };

  const downloadVideo = async (customFormat?: ExportFormat) => {
    if (!videoUrl) {
      toast.error("No video available to download");
      return;
    }

    const format = customFormat || selectedExportFormat;
    setIsExporting(true);

    try {
      // If custom format is requested, generate a new export
      if (customFormat && (customFormat.format !== "mp4" || customFormat.quality !== "high")) {
        const response = await api.exportVideo({
          campaignId: state.campaignId!,
          format: format.format,
          quality: format.quality,
          resolution: format.resolution,
        });

        if (response.success && response.data?.downloadUrl) {
          const link = document.createElement('a');
          link.href = response.data.downloadUrl;
          link.download = `${state.campaignName}-${format.quality}.${format.format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          throw new Error(response.message || "Failed to export video");
        }
      } else {
        // Direct download of existing video
        const link = document.createElement('a');
        link.href = videoUrl;
        link.download = `${state.campaignName}-final-video.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast.success("Video download started");
    } catch (error) {
      console.error("Failed to download video:", error);
      toast.error("Failed to download video. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const getCampaignStats = () => {
    const completedScenes = state.sceneData.filter(
      scene => scene.scene_script && scene.image && scene.video?.prompt
    ).length;

    const totalDuration = state.sceneData.reduce((total, scene) => total + 3, 0); // Assuming 3s per scene

    return {
      completedScenes,
      totalDuration,
      scriptsGenerated: state.sceneData.filter(s => s.scene_script).length,
      imagesSelected: state.sceneData.filter(s => s.image).length,
      videoPromptsCreated: state.sceneData.filter(s => s.video?.prompt).length,
    };
  };

  const stats = getCampaignStats();

  const shareToSocial = (platform: "twitter" | "facebook" | "linkedin") => {
    if (!shareUrl) {
      toast.error("Please generate a share link first");
      return;
    }

    const text = encodeURIComponent(`Check out my AI-generated video: ${shareSettings.title}`);
    const url = encodeURIComponent(shareUrl);

    let shareUrlForPlatform = "";

    switch (platform) {
      case "twitter":
        shareUrlForPlatform = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case "facebook":
        shareUrlForPlatform = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case "linkedin":
        shareUrlForPlatform = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
    }

    window.open(shareUrlForPlatform, "_blank", "width=600,height=400");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Preview & Export
        </h2>
        <p className="text-muted-foreground text-sm">
          Preview your completed video, share it with others, and export in different formats.
          Your campaign is now complete!
        </p>
      </div>

      {/* Campaign Completion Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <CardTitle className="text-green-600">Campaign Completed Successfully!</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {stats.completedScenes}
              </div>
              <p className="text-sm text-muted-foreground">Scenes Completed</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalDuration}s
              </div>
              <p className="text-sm text-muted-foreground">Final Duration</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {state.creditsUsed || 0}
              </div>
              <p className="text-sm text-muted-foreground">Credits Used</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {videoUrl ? "✓" : "○"}
              </div>
              <p className="text-sm text-muted-foreground">Video Generated</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="share">Share</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-6 mt-6">
          {/* Video Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Final Video</CardTitle>
            </CardHeader>
            <CardContent>
              {videoUrl ? (
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

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
                    <div>
                      <div className="font-medium">{totalScenes}</div>
                      <div className="text-muted-foreground">Scenes</div>
                    </div>
                    <div>
                      <div className="font-medium">~{stats.totalDuration}s</div>
                      <div className="text-muted-foreground">Duration</div>
                    </div>
                    <div>
                      <div className="font-medium">1080p</div>
                      <div className="text-muted-foreground">Resolution</div>
                    </div>
                    <div>
                      <div className="font-medium">MP4</div>
                      <div className="text-muted-foreground">Format</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <Film className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No video available. Please go back to generate the final video.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scene Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Scene Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {state.sceneData.map((scene) => (
                  <div
                    key={scene.scene_number}
                    className="flex items-center space-x-4 p-4 border rounded-lg"
                  >
                    <Badge variant="outline">Scene {scene.scene_number}</Badge>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground truncate">
                        {scene.scene_script || "No script"}
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      {scene.scene_script && (
                        <Badge variant="secondary" className="text-xs">
                          Script
                        </Badge>
                      )}
                      {scene.image && (
                        <Badge variant="secondary" className="text-xs">
                          Image
                        </Badge>
                      )}
                      {scene.video?.prompt && (
                        <Badge variant="secondary" className="text-xs">
                          Video
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="share" className="space-y-6 mt-6">
          {/* Share Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Share Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  value={shareSettings.title}
                  onChange={(e) =>
                    setShareSettings(prev => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Enter a title for your shared video"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={shareSettings.description}
                  onChange={(e) =>
                    setShareSettings(prev => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Describe your video..."
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {shareSettings.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === "Enter" && addTag()}
                  />
                  <Button onClick={addTag} variant="outline">
                    Add
                  </Button>
                </div>
              </div>

              <Button
                onClick={generateShareLink}
                disabled={isGeneratingShare || !videoUrl}
                className="w-full"
              >
                <Share2 className="w-4 h-4 mr-2" />
                {isGeneratingShare ? "Generating..." : "Generate Share Link"}
              </Button>
            </CardContent>
          </Card>

          {/* Share Link & Social */}
          {shareUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Share Your Video</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Share Link</label>
                  <div className="flex space-x-2">
                    <Input value={shareUrl} readOnly />
                    <Button onClick={copyShareLink} variant="outline">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-3 block">Share on Social Media</label>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => shareToSocial("twitter")}
                      className="flex-1"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Twitter
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => shareToSocial("facebook")}
                      className="flex-1"
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Facebook
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => shareToSocial("linkedin")}
                      className="flex-1"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      LinkedIn
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="export" className="space-y-6 mt-6">
          {/* Quick Download */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Download</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => downloadVideo()}
                disabled={!videoUrl || isExporting}
                size="lg"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? "Downloading..." : "Download Video (MP4, High Quality)"}
              </Button>
            </CardContent>
          </Card>

          {/* Custom Export Options */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Format</label>
                  <div className="space-y-2">
                    {["mp4", "mov", "webm"].map((format) => (
                      <Button
                        key={format}
                        variant={selectedExportFormat.format === format ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedExportFormat(prev => ({ ...prev, format: format as ExportFormat["format"] }))}
                        className="w-full"
                      >
                        {format.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Quality</label>
                  <div className="space-y-2">
                    {["standard", "high", "premium"].map((quality) => (
                      <Button
                        key={quality}
                        variant={selectedExportFormat.quality === quality ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedExportFormat(prev => ({ ...prev, quality: quality as ExportFormat["quality"] }))}
                        className="w-full"
                      >
                        {quality.charAt(0).toUpperCase() + quality.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Resolution</label>
                  <div className="space-y-2">
                    {["720p", "1080p", "4k"].map((resolution) => (
                      <Button
                        key={resolution}
                        variant={selectedExportFormat.resolution === resolution ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedExportFormat(prev => ({ ...prev, resolution: resolution as ExportFormat["resolution"] }))}
                        className="w-full"
                      >
                        {resolution}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => downloadVideo(selectedExportFormat)}
                disabled={!videoUrl || isExporting}
                size="lg"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Custom Format
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Custom exports may take a few moments to process
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-border">
        <Button variant="outline" onClick={onPrev}>
          Back
        </Button>
        <div className="flex items-center space-x-2 text-sm text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span className="font-medium">Campaign Complete!</span>
        </div>
      </div>
    </div>
  );
}