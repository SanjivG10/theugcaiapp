"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ProductImage, useCampaign } from "@/contexts/CampaignContext";
import { api } from "@/lib/api";
import { VoiceData } from "@/types/api";
import { Loader2, Play, Plus, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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

// Remove static VOICE_OPTIONS as we'll fetch from ElevenLabs

export function CampaignSetup({ onNext }: CampaignSetupProps) {
  const { state, dispatch } = useCampaign();
  const [campaignName, setCampaignName] = useState(state.campaignName);
  const [videoDescription, setVideoDescription] = useState(
    state.videoDescription
  );
  const [numberOfScenes, setNumberOfScenes] = useState(state.numberOfScenes);
  const [campaignObjective, setCampaignObjective] = useState(
    state.campaignObjective
  );
  const [selectedVoice, setSelectedVoice] = useState(state?.voice?.voice_id);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Voice-related state
  const [voices, setVoices] = useState<VoiceData[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedVoiceData, setSelectedVoiceData] = useState<VoiceData>(
    state.voice
  );

  // Mount saved values when context updates (only on initial load)
  const [hasInitialized, setHasInitialized] = useState(false);

  // Load voices from ElevenLabs
  useEffect(() => {
    if (!state.voice?.voice_id) return;
    const fetchVoices = async () => {
      try {
        setLoadingVoices(true);
        const response = await api.getVoices();
        if (response.success && response.data) {
          setVoices(response.data);

          // If we have a selected voice, find its data
          if (state.voice?.voice_id) {
            const voiceData = response.data.find(
              (v) => v.voice_id === state.voice?.voice_id
            );
            if (voiceData) {
              setSelectedVoiceData(voiceData);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load voices:", error);
        toast.error("Failed to load voices");
      } finally {
        setLoadingVoices(false);
      }
    };

    fetchVoices();
  }, [state.voice?.voice_id]);

  useEffect(() => {
    if (!hasInitialized && state.campaignId) {
      // Only set values if they exist in state and local state is empty/default
      if (state.campaignName && !campaignName) {
        setCampaignName(state.campaignName);
      }
      if (state.videoDescription && !videoDescription) {
        setVideoDescription(state.videoDescription);
      }
      setNumberOfScenes(state.numberOfScenes || 1);

      if (state.campaignObjective && !campaignObjective) {
        setCampaignObjective(state.campaignObjective);
      }
      if (state.voice?.voice_id && !selectedVoice) {
        setSelectedVoice(state.voice?.voice_id);
      }
      setHasInitialized(true);
    }
  }, [state.campaignId, hasInitialized]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const remainingSlots = 5 - state.productImages.length;
      const filesToProcess = acceptedFiles.slice(0, remainingSlots);

      if (acceptedFiles.length > remainingSlots) {
        toast.error(
          `Maximum 5 images allowed. ${
            acceptedFiles.length - remainingSlots
          } files skipped.`
        );
      }

      // Separate files into new uploads vs existing ones
      const newFiles: File[] = [];
      filesToProcess.forEach((file) => {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image file`);
          return;
        }
        newFiles.push(file);
      });

      if (newFiles.length === 0) return;

      // First add files with temporary URLs to state for immediate UI feedback
      newFiles.forEach((file) => {
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

  const playVoicePreview = async (voiceId: string) => {
    if (playingVoice === voiceId) {
      // Stop playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingVoice(null);
    } else {
      try {
        setPlayingVoice(voiceId);

        // Find the voice data to get the preview URL
        const voiceData = voices.find((v) => v.voice_id === voiceId);

        if (voiceData?.preview_url) {
          if (audioRef.current) {
            audioRef.current.src = voiceData.preview_url;
            audioRef.current.play().catch(() => {
              toast.error("Could not play voice preview");
              setPlayingVoice(null);
            });
          }
        } else {
          toast.error("No preview available for this voice");
          setPlayingVoice(null);
        }
      } catch (error) {
        console.error("Failed to play voice preview:", error);
        toast.error("Failed to play voice preview");
        setPlayingVoice(null);
      }
    }
  };

  const handleNext = async () => {
    setIsLoading(true);
    if (!campaignName.trim()) {
      toast.error("Please enter a campaign name");
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

    // Update state first
    dispatch({ type: "SET_CAMPAIGN_NAME", payload: campaignName.trim() });
    dispatch({
      type: "SET_VIDEO_DESCRIPTION",
      payload: videoDescription.trim(),
    });
    dispatch({ type: "SET_NUMBER_OF_SCENES", payload: numberOfScenes });
    dispatch({ type: "SET_CAMPAIGN_OBJECTIVE", payload: campaignObjective });
    dispatch({ type: "SET_SELECTED_VOICE", payload: selectedVoiceData });

    // Handle image uploads first for new files
    const filesToUpload = state.productImages.filter(
      (img) => img.file && !img.url.startsWith("http")
    );

    const imageUrls = state.productImages
      .filter((img) => img.url.startsWith("http"))
      .map((img) => ({
        id: img.id,
        url: img.url,
        name: img.name,
      }));

    if (filesToUpload.length > 0) {
      try {
        setUploadingImages(true);
        const fileList = new DataTransfer();
        filesToUpload.forEach((img) => {
          if (img.file) fileList.items.add(img.file);
        });

        const uploadResponse = await api.uploadProductImages(
          state.campaignId as string,
          fileList.files
        );
        if (uploadResponse.success && uploadResponse.data) {
          // Update the context with uploaded URLs
          uploadResponse.data.forEach((uploadedFile, index) => {
            const correspondingImage = filesToUpload[index];
            if (correspondingImage) {
              // Update the existing image with the new URL
              imageUrls.push({
                id: uploadedFile.id,
                url: uploadedFile.url,
                name: uploadedFile.name,
              });

              dispatch({
                type: "REMOVE_PRODUCT_IMAGE",
                payload: correspondingImage.id,
              });
              dispatch({
                type: "ADD_PRODUCT_IMAGE",
                payload: {
                  id: uploadedFile.id,
                  url: uploadedFile.url,
                  name: uploadedFile.name,
                },
              });
            }
          });
          toast.success(
            `Successfully uploaded ${uploadResponse.data.length} image${
              uploadResponse.data.length > 1 ? "s" : ""
            }`
          );
        }
      } catch (error) {
        console.error("Failed to upload images:", error);
        toast.error("Failed to upload images");
        setIsLoading(false);
        setUploadingImages(false);
        return;
      } finally {
        setUploadingImages(false);
      }
    }

    // Save campaign settings and step data if we have a campaign ID
    if (state.campaignId) {
      try {
        // Save campaign settings
        const settings = {
          campaignName: campaignName.trim(),
          videoDescription: videoDescription.trim(),
          numberOfScenes: numberOfScenes,
          campaignObjective,
          selectedVoice,
        };

        await api.saveCampaignSettings(state.campaignId, settings);

        // Save product images to step data (step 1 for setup data)
        const stepData = {
          productImages: imageUrls.map((img) => ({
            id: img.id,
            url: img.url,
            name: img.name,
          })),
          numberOfScenes,
          campaignObjective,
          voice: selectedVoiceData,
        };

        await api.saveCampaignStepData(state.campaignId, 1, stepData);
        toast.success("Campaign settings and images saved");
      } catch (error) {
        console.error("Failed to save campaign data:", error);
        toast.error("Failed to save campaign data");
        setIsLoading(false);
        return; // Don't proceed if save failed
      }
    }

    onNext();
    setIsLoading(false);
  };

  const canProceed = campaignName.trim() && campaignObjective && selectedVoice;

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
                    <img
                      src={image.url}
                      alt={image.name}
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
            How many scenes do you want in your video? Each scene is
            approximately 8 seconds.
          </p>
        </div>
        <div className="space-y-6">
          <Slider
            value={[numberOfScenes]}
            onValueChange={(value) => setNumberOfScenes(value[0])}
            max={8}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">1 scene</span>
            <div className="text-center">
              <span className="text-2xl font-bold text-foreground">
                {numberOfScenes}
              </span>
              <p className="text-sm text-muted-foreground">
                scenes (~{numberOfScenes * 8} seconds)
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
            What is the main goal of this campaign? This helps tailor the
            content.
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
            Choose a voice for your video narration from 50+ high-quality AI
            voices. Click to preview.
          </p>
        </div>

        {loadingVoices ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Loading voices...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="overflow-x-auto pb-4">
                <div
                  className="grid gap-3 w-max"
                  style={{
                    gridTemplateRows: "repeat(3, minmax(0, 1fr))",
                    gridAutoFlow: "column",
                    maxHeight: "400px",
                  }}
                >
                  {voices.map((voice) => (
                    <Card
                      key={voice.voice_id}
                      className={`cursor-pointer transition-all hover:shadow-md w-80 ${
                        selectedVoice === voice.voice_id
                          ? "border-primary bg-primary/5 ring-2 ring-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => {
                        setSelectedVoice(voice.voice_id);
                        setSelectedVoiceData(voice);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1 min-w-0 flex-1">
                            <h3 className="font-medium text-foreground truncate">
                              {voice.name}
                            </h3>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              {voice.gender && (
                                <span className="bg-muted px-2 py-1 rounded">
                                  {voice.gender}
                                </span>
                              )}
                              {voice.accent && (
                                <span className="bg-muted px-2 py-1 rounded">
                                  {voice.accent}
                                </span>
                              )}
                              {voice.age && (
                                <span className="bg-muted px-2 py-1 rounded">
                                  {voice.age}
                                </span>
                              )}
                            </div>
                            {voice.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {voice.description}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              playVoicePreview(voice.voice_id);
                            }}
                            disabled={
                              playingVoice === voice.voice_id &&
                              playingVoice !== null
                            }
                            className="shrink-0 ml-3"
                          >
                            {playingVoice === voice.voice_id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Scroll indicator */}
              <p className="text-xs text-muted-foreground text-center">
                ← Scroll horizontally to see more voices →
              </p>
            </div>

            {/* Selected Voice Preview */}
            {selectedVoiceData && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-foreground">
                        Selected Voice
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedVoiceData.name}
                        {selectedVoiceData.gender &&
                          ` • ${selectedVoiceData.gender}`}
                        {selectedVoiceData.accent &&
                          ` • ${selectedVoiceData.accent}`}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        playVoicePreview(selectedVoiceData.voice_id)
                      }
                      disabled={
                        playingVoice === selectedVoiceData.voice_id &&
                        playingVoice !== null
                      }
                    >
                      {playingVoice === selectedVoiceData.voice_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

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
      <div className="flex justify-end pt-6 border-t border-border">
        <Button
          onClick={handleNext}
          disabled={!canProceed || isLoading || uploadingImages}
          className="px-8"
        >
          {isLoading || uploadingImages ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {uploadingImages ? "Uploading Images..." : "Saving..."}
            </>
          ) : (
            "Next: Generate Script"
          )}
        </Button>
      </div>
    </div>
  );
}
