"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft, 
  Play, 
  Loader2, 
  Download, 
  CheckCircle,
  Music,
  Volume2,
  Settings,
  Eye
} from "lucide-react";
import { Campaign } from "@/types/api";

interface FinalAssemblyProps {
  campaign: Campaign;
  stepData: Record<string, unknown>;
  onPrevious: () => Promise<void>;
  onLaunch: (data: Record<string, unknown>) => Promise<void>;
  launching: boolean;
  saving: boolean;
}

export function FinalAssembly({
  campaign,
  stepData,
  onPrevious,
  onLaunch,
  launching,
}: FinalAssemblyProps) {
  const generatedVideos = (stepData.generated_videos as any[]) || [];
  const [assemblySettings, setAssemblySettings] = useState({
    background_music: (stepData.background_music as string) || "",
    music_volume: (stepData.music_volume as number) || 30,
    add_subtitles: (stepData.add_subtitles as boolean) || true,
    add_branding: (stepData.add_branding as boolean) || true,
    output_quality: (stepData.output_quality as string) || "1080p",
    output_format: (stepData.output_format as string) || "mp4",
  });
  
  const [finalVideo, setFinalVideo] = useState({
    status: "pending", // pending, assembling, completed, failed
    progress: 0,
    url: "",
    thumbnail: "",
    duration: 0,
  });
  
  const [acknowledged, setAcknowledged] = useState(false);

  const updateSetting = (key: string, value: any) => {
    setAssemblySettings(prev => ({ ...prev, [key]: value }));
  };

  const startAssembly = async () => {
    setFinalVideo(prev => ({ ...prev, status: "assembling", progress: 0 }));

    // Simulate assembly process
    for (let progress = 0; progress <= 100; progress += 5) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setFinalVideo(prev => ({ ...prev, progress }));
    }

    // Complete assembly
    setFinalVideo({
      status: "completed",
      progress: 100,
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      thumbnail: "https://picsum.photos/800/450?random=final",
      duration: generatedVideos.reduce((sum, video) => sum + video.duration, 0),
    });
  };

  const handleLaunch = async () => {
    await onLaunch({
      assembly_settings: assemblySettings,
      final_video: finalVideo,
      campaign_completed: true,
    });
  };

  const completedVideos = generatedVideos.filter(v => v.status === "completed");
  const totalDuration = generatedVideos.reduce((sum, video) => sum + video.duration, 0);

  // Check if we have everything needed
  const canAssemble = completedVideos.length > 0;
  const canLaunch = finalVideo.status === "completed" && acknowledged;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Final Assembly & Launch</CardTitle>
          <CardDescription>
            Combine all your generated videos into a final product and configure the output settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Campaign Summary */}
            <div>
              <Label className="text-base font-medium">Campaign Summary</Label>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Campaign Name</p>
                  <p className="text-sm text-muted-foreground">{campaign.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Total Scenes</p>
                  <p className="text-sm text-muted-foreground">{generatedVideos.length} scenes</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Completed Videos</p>
                  <p className="text-sm text-muted-foreground">{completedVideos.length} ready</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Total Duration</p>
                  <p className="text-sm text-muted-foreground">{totalDuration}s</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Video Scenes Preview */}
            <div>
              <Label className="text-base font-medium">Video Scenes</Label>
              <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {generatedVideos.map((video, index) => (
                  <Card key={video.id} className="overflow-hidden">
                    <CardContent className="p-3">
                      <div className="aspect-video bg-muted rounded mb-2 overflow-hidden">
                        {video.status === "completed" && video.thumbnail ? (
                          <img
                            src={video.thumbnail}
                            alt={`Scene ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <Play className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Scene {index + 1}</span>
                        <Badge 
                          variant={video.status === "completed" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {video.duration}s
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            {/* Assembly Settings */}
            <div>
              <Label className="text-base font-medium">Assembly Settings</Label>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="background_music" className="flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    Background Music
                  </Label>
                  <Select 
                    value={assemblySettings.background_music}
                    onValueChange={(value) => updateSetting("background_music", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select music" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No background music</SelectItem>
                      <SelectItem value="upbeat">Upbeat & Energetic</SelectItem>
                      <SelectItem value="corporate">Corporate & Professional</SelectItem>
                      <SelectItem value="calm">Calm & Relaxing</SelectItem>
                      <SelectItem value="modern">Modern & Trendy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Music Volume: {assemblySettings.music_volume}%
                  </Label>
                  <Input
                    type="range"
                    min="0"
                    max="100"
                    value={assemblySettings.music_volume}
                    onChange={(e) => updateSetting("music_volume", parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Output Quality
                  </Label>
                  <Select 
                    value={assemblySettings.output_quality}
                    onValueChange={(value) => updateSetting("output_quality", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="720p">720p HD</SelectItem>
                      <SelectItem value="1080p">1080p Full HD</SelectItem>
                      <SelectItem value="4k">4K Ultra HD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Output Format</Label>
                  <Select 
                    value={assemblySettings.output_format}
                    onValueChange={(value) => updateSetting("output_format", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mp4">MP4 (Recommended)</SelectItem>
                      <SelectItem value="mov">MOV</SelectItem>
                      <SelectItem value="avi">AVI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="subtitles"
                    checked={assemblySettings.add_subtitles}
                    onCheckedChange={(checked) => updateSetting("add_subtitles", checked)}
                  />
                  <Label htmlFor="subtitles" className="text-sm">
                    Add automatic subtitles
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="branding"
                    checked={assemblySettings.add_branding}
                    onCheckedChange={(checked) => updateSetting("add_branding", checked)}
                  />
                  <Label htmlFor="branding" className="text-sm">
                    Add your business branding/logo
                  </Label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Final Video Assembly */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-medium">Final Video</Label>
                {finalVideo.status === "pending" && canAssemble && (
                  <Button onClick={startAssembly}>
                    <Play className="mr-2 h-4 w-4" />
                    Assemble Video
                  </Button>
                )}
              </div>

              <Card>
                <CardContent className="p-6">
                  {finalVideo.status === "pending" && (
                    <div className="text-center py-8">
                      <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Click "Assemble Video" to create your final video
                      </p>
                    </div>
                  )}

                  {finalVideo.status === "assembling" && (
                    <div className="text-center py-8">
                      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                      <p className="font-medium mb-2">Assembling your video...</p>
                      <div className="max-w-xs mx-auto">
                        <div className="w-full bg-secondary rounded-full h-2 mb-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${finalVideo.progress}%` }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {finalVideo.progress}% complete
                        </p>
                      </div>
                    </div>
                  )}

                  {finalVideo.status === "completed" && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Video assembly completed!</span>
                      </div>
                      
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                        <video 
                          controls 
                          poster={finalVideo.thumbnail}
                          className="w-full h-full object-cover"
                        >
                          <source src={finalVideo.url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Duration: {finalVideo.duration}s • Quality: {assemblySettings.output_quality}
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Launch Confirmation */}
            {finalVideo.status === "completed" && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="acknowledge"
                        checked={acknowledged}
                        onCheckedChange={setAcknowledged}
                      />
                      <Label htmlFor="acknowledge" className="text-sm">
                        I confirm that I have reviewed the final video and am ready to launch this campaign.
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={onPrevious} disabled={launching}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              <Button
                onClick={handleLaunch}
                disabled={!canLaunch || launching}
                className="bg-green-600 hover:bg-green-700"
              >
                {launching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Launching Campaign...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Launch Campaign
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}