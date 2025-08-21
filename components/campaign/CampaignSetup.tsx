"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ProductImage, useCampaign } from "@/contexts/CampaignContext";
import { Plus, Upload, X, Play, Pause } from "lucide-react";
import Image from "next/image";
import { useCallback, useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";

interface CampaignSetupProps {
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

const CAMPAIGN_OBJECTIVES = [
  { value: "brand-awareness", label: "Brand Awareness" },
  { value: "product-launch", label: "Product Launch" },
  { value: "sales-conversion", label: "Sales Conversion" },
  { value: "educational", label: "Educational Content" },
  { value: "testimonial", label: "Customer Testimonial" },
  { value: "social-media", label: "Social Media Content" },
];

const VOICE_OPTIONS = [
  { id: "sarah", name: "Sarah", gender: "Female", accent: "American", preview: "/voices/sarah.mp3" },
  { id: "john", name: "John", gender: "Male", accent: "American", preview: "/voices/john.mp3" },
  { id: "emma", name: "Emma", gender: "Female", accent: "British", preview: "/voices/emma.mp3" },
  { id: "alex", name: "Alex", gender: "Male", accent: "Australian", preview: "/voices/alex.mp3" },
];

export function CampaignSetup({ onNext }: CampaignSetupProps) {
  const { state, dispatch } = useCampaign();
  const [campaignName, setCampaignName] = useState(state.campaignName);
  const [videoDescription, setVideoDescription] = useState(state.videoDescription);
  const [numberOfScenes, setNumberOfScenes] = useState([state.numberOfScenes]);
  const [campaignObjective, setCampaignObjective] = useState(state.campaignObjective);
  const [selectedVoice, setSelectedVoice] = useState(state.selectedVoice);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const remainingSlots = 5 - state.productImages.length;
      const filesToProcess = acceptedFiles.slice(0, remainingSlots);

      if (acceptedFiles.length > remainingSlots) {
        toast.error(
          `Maximum 5 images allowed. ${
            acceptedFiles.length - remainingSlots
          } files skipped.`
        );
      }

      filesToProcess.forEach((file) => {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image file`);
          return;
        }

        const id = Math.random().toString(36).substring(2, 9);
        const url = URL.createObjectURL(file);

        const productImage: ProductImage = {
          id,
          file,
          url,
          name: file.name,
        };

        dispatch({ type: "ADD_PRODUCT_IMAGE", payload: productImage });
      });
    },
    [state.productImages.length, dispatch]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    maxFiles: 5 - state.productImages.length,
    disabled: state.productImages.length >= 5,
  });

  const removeImage = (imageId: string) => {
    const imageToRemove = state.productImages.find((img) => img.id === imageId);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.url);
      dispatch({ type: "REMOVE_PRODUCT_IMAGE", payload: imageId });
    }
  };

  const playVoicePreview = (voiceId: string, previewUrl: string) => {
    if (playingVoice === voiceId) {
      // Stop playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingVoice(null);
    } else {
      // Start playing
      if (audioRef.current) {
        audioRef.current.src = previewUrl;
        audioRef.current.play().catch(() => {
          toast.error("Could not play voice preview");
        });
        setPlayingVoice(voiceId);
      }
    }
  };

  const handleNext = () => {
    if (!campaignName.trim()) {
      toast.error("Please enter a campaign name");
      return;
    }
    if (state.productImages.length === 0) {
      toast.error("Please upload at least one product image");
      return;
    }
    if (!campaignObjective) {
      toast.error("Please select a campaign objective");
      return;
    }
    if (!selectedVoice) {
      toast.error("Please select a voice");
      return;
    }

    dispatch({ type: "SET_CAMPAIGN_NAME", payload: campaignName.trim() });
    dispatch({ type: "SET_VIDEO_DESCRIPTION", payload: videoDescription.trim() });
    dispatch({ type: "SET_NUMBER_OF_SCENES", payload: numberOfScenes[0] });
    dispatch({ type: "SET_CAMPAIGN_OBJECTIVE", payload: campaignObjective });
    dispatch({ type: "SET_SELECTED_VOICE", payload: selectedVoice });
    onNext();
  };

  const canProceed = campaignName.trim() && 
                    state.productImages.length > 0 && 
                    campaignObjective && 
                    selectedVoice;

  return (
    <div className="space-y-8">
      {/* Campaign Name */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Campaign Name
          </h2>
          <p className="text-muted-foreground text-sm">
            Give your campaign a memorable name to help you organize your
            projects.
          </p>
        </div>
        <Input
          placeholder="Enter campaign name..."
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          className="text-lg h-12"
          maxLength={100}
        />
      </div>

      {/* Product Images Upload */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Product Images
          </h2>
          <p className="text-muted-foreground text-sm">
            Upload up to 5 high-quality images of your product. These will be
            used to generate your video scenes.
          </p>
        </div>

        {/* Upload Area */}
        {state.productImages.length < 5 && (
          <Card
            {...getRootProps()}
            className={`border-2 border-dashed transition-colors cursor-pointer ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <CardContent className="p-12 text-center">
              <input {...getInputProps()} />
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-lg font-medium text-foreground">
                    {isDragActive
                      ? "Drop images here"
                      : "Drop images here or click to browse"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    PNG, JPG, JPEG, WEBP up to 10MB each
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Image Thumbnails */}
        {state.productImages.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {state.productImages.map((image) => (
                <Card key={image.id} className="relative group overflow-hidden">
                  <CardContent className="p-0 aspect-square">
                    <Image
                      src={image.url}
                      alt={image.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => removeImage(image.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add More Button */}
              {state.productImages.length < 5 && (
                <Card
                  {...getRootProps()}
                  className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer transition-colors"
                >
                  <CardContent className="p-0 aspect-square flex items-center justify-center">
                    <input {...getInputProps()} />
                    <div className="text-center">
                      <Plus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Add more</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {state.productImages.length} of 5 images uploaded
            </p>
          </div>
        )}
      </div>

      {/* Video Description */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Video Description
          </h2>
          <p className="text-muted-foreground text-sm">
            Describe what you want to achieve with your video. This helps our AI 
            create better content. You can leave this empty if you prefer.
          </p>
        </div>
        <Textarea
          placeholder="e.g., Create an engaging product showcase that highlights the key features and benefits of our new smartwatch, targeting fitness enthusiasts..."
          value={videoDescription}
          onChange={(e) => setVideoDescription(e.target.value)}
          className="min-h-[100px] resize-none"
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground text-right">
          {videoDescription.length}/1000 characters
        </p>
      </div>

      {/* Number of Scenes */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Number of Scenes
          </h2>
          <p className="text-muted-foreground text-sm">
            How many scenes do you want in your video? Each scene is approximately 8 seconds.
          </p>
        </div>
        <div className="space-y-6">
          <Slider
            value={numberOfScenes}
            onValueChange={setNumberOfScenes}
            max={8}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">1 scene</span>
            <div className="text-center">
              <span className="text-2xl font-bold text-foreground">{numberOfScenes[0]}</span>
              <p className="text-sm text-muted-foreground">
                scenes (~{numberOfScenes[0] * 8} seconds)
              </p>
            </div>
            <span className="text-sm text-muted-foreground">8 scenes</span>
          </div>
        </div>
      </div>

      {/* Campaign Objective */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Campaign Objective
          </h2>
          <p className="text-muted-foreground text-sm">
            What is the main goal of this campaign? This helps tailor the content.
          </p>
        </div>
        <Select value={campaignObjective} onValueChange={setCampaignObjective}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Select campaign objective" />
          </SelectTrigger>
          <SelectContent>
            {CAMPAIGN_OBJECTIVES.map((objective) => (
              <SelectItem key={objective.value} value={objective.value}>
                {objective.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Voice Selection */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Voice Selection
          </h2>
          <p className="text-muted-foreground text-sm">
            Choose a voice for your video narration. Click to preview.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {VOICE_OPTIONS.map((voice) => (
            <Card 
              key={voice.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedVoice === voice.id 
                  ? "border-primary bg-primary/5 ring-2 ring-primary" 
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => setSelectedVoice(voice.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium text-foreground">{voice.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {voice.gender} • {voice.accent}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      playVoicePreview(voice.id, voice.preview);
                    }}
                    className="shrink-0"
                  >
                    {playingVoice === voice.id ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <audio 
          ref={audioRef} 
          onEnded={() => setPlayingVoice(null)}
          onError={() => {
            setPlayingVoice(null);
            toast.error("Could not load voice preview");
          }}
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-border">
        <div></div>
        <Button onClick={handleNext} disabled={!canProceed} className="px-8">
          Next: Generate Script
        </Button>
      </div>
    </div>
  );
}
