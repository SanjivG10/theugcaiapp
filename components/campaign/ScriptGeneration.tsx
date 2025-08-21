"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCampaign } from "@/contexts/CampaignContext";
import { Loader2, RefreshCw, FileText, Clock, Hash, Edit3, Sparkles } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

interface ScriptGenerationProps {
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

export function ScriptGeneration({ onNext, onPrev }: ScriptGenerationProps) {
  const { state, dispatch } = useCampaign();
  const [script, setScript] = useState(state.script);
  const [isGenerating, setIsGenerating] = useState(false);
  const [scriptMode, setScriptMode] = useState<'ai' | 'manual'>('ai');
  const [scriptSettings, setScriptSettings] = useState({
    tone: "energetic",
    length: state.numberOfScenes.toString(),
    style: "product-showcase",
  });


  const generateScript = useCallback(async () => {
    setIsGenerating(true);
    try {
      // Simulate API call to generate script based on user settings
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Generate script based on number of scenes and campaign info
      const generateSceneScript = (sceneNumber: number, totalScenes: number) => {
        const scenes = [
          `Introducing ${state.campaignName} - the solution you&apos;ve been waiting for.`,
          `Watch how it transforms your daily routine in just seconds.`,
          `With its innovative design, ${state.campaignName} delivers unmatched performance.`,
          `Easy to use, portable, and built to last - this is what you need.`,
          `Thousands of customers are already experiencing the difference.`,
          `Don&apos;t miss out - get yours today with free shipping.`,
          `Order now and see why everyone is talking about ${state.campaignName}.`,
          `Transform your life with ${state.campaignName} - available now.`
        ];
        return scenes.slice(0, totalScenes);
      };

      const sceneLines = generateSceneScript(0, state.numberOfScenes);
      const generatedScript = sceneLines.join('\n\n');

      setScript(generatedScript);
      dispatch({ type: "SET_SCRIPT", payload: generatedScript });
      toast.success(`Script generated with ${state.numberOfScenes} scenes!`);
    } catch (error) {
      toast.error("Failed to generate script. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [state.campaignName, state.numberOfScenes, dispatch]);

  const handleScriptChange = (value: string) => {
    setScript(value);
    dispatch({ type: "SET_SCRIPT", payload: value });
  };

  const estimateScenes = (text: string) => {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    return Math.min(sentences.length, state.productImages.length);
  };

  const estimateDuration = (text: string) => {
    const words = text.split(/\s+/).length;
    const wordsPerMinute = 150;
    const seconds = Math.ceil((words / wordsPerMinute) * 60);
    return seconds;
  };

  const handleNext = () => {
    if (!script.trim()) {
      toast.error("Please generate or enter a script");
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Video Script
        </h2>
        <p className="text-muted-foreground text-sm">
          Generate an AI script based on your campaign details or write your own. 
          The script will be broken down into {state.numberOfScenes} scenes for your video.
        </p>
      </div>

      {/* Script Mode Selection */}
      <div className="grid grid-cols-2 gap-4">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            scriptMode === 'ai' 
              ? "border-primary bg-primary/5 ring-2 ring-primary" 
              : "border-border hover:border-primary/50"
          }`}
          onClick={() => setScriptMode('ai')}
        >
          <CardContent className="p-6 text-center">
            <Sparkles className={`w-8 h-8 mx-auto mb-3 ${
              scriptMode === 'ai' ? 'text-primary' : 'text-muted-foreground'
            }`} />
            <h3 className="font-medium text-foreground mb-2">AI Generated</h3>
            <p className="text-sm text-muted-foreground">
              Let AI create a script based on your campaign details
            </p>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            scriptMode === 'manual' 
              ? "border-primary bg-primary/5 ring-2 ring-primary" 
              : "border-border hover:border-primary/50"
          }`}
          onClick={() => setScriptMode('manual')}
        >
          <CardContent className="p-6 text-center">
            <Edit3 className={`w-8 h-8 mx-auto mb-3 ${
              scriptMode === 'manual' ? 'text-primary' : 'text-muted-foreground'
            }`} />
            <h3 className="font-medium text-foreground mb-2">Write Manually</h3>
            <p className="text-sm text-muted-foreground">
              Write your own custom script from scratch
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Script Editor - Left Panel */}
        <div className="lg:col-span-2 space-y-6">

          {/* AI Script Settings */}
          {scriptMode === 'ai' && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Script Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tone</label>
                    <Select
                      value={scriptSettings.tone}
                      onValueChange={(value: string) =>
                        setScriptSettings((prev) => ({ ...prev, tone: value }))
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
                    <label className="text-sm font-medium mb-2 block">Scenes</label>
                    <Select
                      value={state.numberOfScenes.toString()}
                      onValueChange={(value: string) => {
                        const scenes = parseInt(value);
                        dispatch({ type: "SET_NUMBER_OF_SCENES", payload: scenes });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 scene</SelectItem>
                        <SelectItem value="2">2 scenes</SelectItem>
                        <SelectItem value="3">3 scenes</SelectItem>
                        <SelectItem value="4">4 scenes</SelectItem>
                        <SelectItem value="5">5 scenes</SelectItem>
                        <SelectItem value="6">6 scenes</SelectItem>
                        <SelectItem value="7">7 scenes</SelectItem>
                        <SelectItem value="8">8 scenes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Style</label>
                    <Select
                      value={scriptSettings.style}
                      onValueChange={(value: string) =>
                        setScriptSettings((prev) => ({ ...prev, style: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product-showcase">Product Showcase</SelectItem>
                        <SelectItem value="problem-solution">Problem-Solution</SelectItem>
                        <SelectItem value="testimonial">Testimonial Style</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Script Content */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>{scriptMode === 'ai' ? 'AI Generated Script' : 'Custom Script'}</span>
                </CardTitle>
                {scriptMode === 'ai' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateScript}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    {isGenerating ? "Generating..." : "Generate Script"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                      <p className="text-muted-foreground">
                        Generating your script...
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Creating {state.numberOfScenes} scenes based on your campaign details
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Textarea
                    value={script}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      handleScriptChange(e.target.value)
                    }
                    placeholder={scriptMode === 'ai' 
                      ? `Click "Generate Script" to create a ${state.numberOfScenes}-scene script based on your campaign...` 
                      : `Write your custom script here. Each paragraph will become a scene for your video...`}
                    className="min-h-[300px] text-base leading-relaxed"
                  />

                  {/* Script Stats */}
                  <div className="flex items-center space-x-6 text-sm text-muted-foreground border-t pt-4">
                    <div className="flex items-center space-x-2">
                      <Hash className="w-4 h-4" />
                      <span>
                        {script.split(/\s+/).filter((w) => w).length} words
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>~{estimateDuration(script)}s duration</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>{state.numberOfScenes} target scenes</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Controls - Right Panel */}
        <div className="space-y-6">
          {/* Product Images */}
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {state.productImages.map((image, index) => (
                  <div
                    key={image.id}
                    className="relative aspect-square rounded-lg overflow-hidden"
                  >
                    <Image
                      src={image.url}
                      alt={`Product ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {state.productImages.length} images available for scenes
              </p>
            </CardContent>
          </Card>

          {/* Campaign Details */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Campaign:</span>
                <span className="font-medium">{state.campaignName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Objective:</span>
                <span className="font-medium capitalize">{state.campaignObjective.replace('-', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scenes:</span>
                <span className="font-medium">{state.numberOfScenes} scenes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Voice:</span>
                <span className="font-medium capitalize">{state.selectedVoice}</span>
              </div>
              {state.videoDescription && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Description:</p>
                  <p className="text-sm">{state.videoDescription}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-border">
        <Button variant="outline" onClick={onPrev}>
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={!script.trim()}
          className="px-8"
        >
          Next: Generate Images
        </Button>
      </div>
    </div>
  );
}
