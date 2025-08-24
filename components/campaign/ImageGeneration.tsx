"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  GeneratedImage,
  ProductImage,
  useCampaign,
} from "@/contexts/CampaignContext";
import {
  Check,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Wand2,
  Edit3,
  AlertTriangle,
  Upload,
  X,
  Plus,
} from "lucide-react";
import { CreditDisplay } from "@/components/ui/credit-display";
import { CreditPurchaseModal } from "@/components/ui/credit-purchase-modal";
import Image from "next/image";
import toast from "react-hot-toast";
import { api } from "@/lib/api";

interface ImageGenerationProps {
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

interface SceneImageGeneration {
  sceneNumber: number;
  scriptText: string;
  selectedProductImages: string[];
  imagePrompt: string;
  isGenerating: boolean;
}

interface EditableScript {
  [sceneNumber: number]: string;
}

export function ImageGeneration({ onNext, onPrev }: ImageGenerationProps) {
  const { state, dispatch } = useCampaign();
  const totalScenes = state.numberOfScenes;

  console.log({ state });

  // State for script editing
  const [editableScript, setEditableScript] = useState<EditableScript>({});
  const [scriptEditMode, setScriptEditMode] = useState<{
    [sceneNumber: number]: boolean;
  }>({});

  // State for product image upload
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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

  // Initialize scene generation data
  const scriptParagraphs = state.script.split("\n").filter((p) => p.trim());
  const [sceneGenerations, setSceneGenerations] = useState<
    SceneImageGeneration[]
  >(() => {
    return Array.from({ length: totalScenes }, (_, index) => ({
      sceneNumber: index + 1,
      scriptText: scriptParagraphs[index] || "",
      selectedProductImages: [],
      imagePrompt: "",
      isGenerating: false,
    }));
  });

  React.useEffect(() => {
    if (state.numberOfScenes) {
      setSceneGenerations(
        Array.from({ length: state.numberOfScenes }, (_, index) => ({
          sceneNumber: index + 1,
          scriptText: scriptParagraphs[index] || "",
          selectedProductImages: [],
          imagePrompt: "",
          isGenerating: false,
        }))
      );
    }
  }, [state.numberOfScenes]);

  // Handle product image upload
  const handleProductImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setIsUploadingImage(true);

    try {
      // Create image URL for preview
      const imageUrl = URL.createObjectURL(file);

      // Create new product image
      const newProductImage: ProductImage = {
        id: Math.random().toString(36).substring(2, 9),
        file,
        url: imageUrl,
        name: file.name,
      };

      // Add to campaign context
      dispatch({ type: "ADD_PRODUCT_IMAGE", payload: newProductImage });

      toast.success("Product image uploaded successfully!");
    } catch (error) {
      console.error("Failed to upload image:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploadingImage(false);
      // Reset input
      event.target.value = "";
    }
  };

  // Remove product image
  const removeProductImage = (imageId: string) => {
    dispatch({ type: "REMOVE_PRODUCT_IMAGE", payload: imageId });

    // Also remove from any scene selections
    setSceneGenerations((prev) =>
      prev.map((scene) => ({
        ...scene,
        selectedProductImages: scene.selectedProductImages.filter(
          (id) => id !== imageId
        ),
      }))
    );

    toast.success("Product image removed");
  };

  // Handle script editing
  const toggleScriptEdit = (sceneNumber: number) => {
    setScriptEditMode((prev) => ({
      ...prev,
      [sceneNumber]: !prev[sceneNumber],
    }));
  };

  const updateScriptText = (sceneNumber: number, text: string) => {
    setEditableScript((prev) => ({
      ...prev,
      [sceneNumber]: text,
    }));
  };

  const saveScriptChanges = async (sceneNumber: number) => {
    const newText = editableScript[sceneNumber] || "";

    // Update scene generation
    updateSceneGeneration(sceneNumber, {
      scriptText: newText,
    });

    // Update the campaign script
    const updatedScriptParagraphs = [...scriptParagraphs];
    updatedScriptParagraphs[sceneNumber - 1] = newText;
    const updatedScript = updatedScriptParagraphs.join("\n\n");

    // Update campaign context
    dispatch({ type: "SET_SCRIPT", payload: updatedScript });

    // Save to backend if we have campaign ID
    if (state.campaignId) {
      try {
        const stepData = {
          script: updatedScript,
          scriptMode: state.scriptMode || "ai",
          scriptSettings: state.scriptSettings,
        };

        await api.saveCampaignStepData(state.campaignId, 2, stepData);
        toast.success("Script updated successfully");
      } catch (error) {
        console.error("Failed to save script:", error);
        toast.error("Failed to save script changes");
        return;
      }
    }

    // Exit edit mode
    setScriptEditMode((prev) => ({
      ...prev,
      [sceneNumber]: false,
    }));
  };

  const cancelScriptEdit = (sceneNumber: number) => {
    // Reset to original text
    setEditableScript((prev) => ({
      ...prev,
      [sceneNumber]: scriptParagraphs[sceneNumber - 1] || "",
    }));

    // Exit edit mode
    setScriptEditMode((prev) => ({
      ...prev,
      [sceneNumber]: false,
    }));
  };

  const updateSceneGeneration = (
    sceneNumber: number,
    updates: Partial<SceneImageGeneration>
  ) => {
    setSceneGenerations((prev) =>
      prev.map((scene) =>
        scene.sceneNumber === sceneNumber ? { ...scene, ...updates } : scene
      )
    );
  };

  const toggleProductImage = (sceneNumber: number, imageId: string) => {
    const scene = sceneGenerations.find((s) => s.sceneNumber === sceneNumber);
    if (!scene) return;

    const isSelected = scene.selectedProductImages.includes(imageId);
    let newSelectedImages: string[];

    if (isSelected) {
      // Remove image if already selected
      newSelectedImages = scene.selectedProductImages.filter(
        (id) => id !== imageId
      );
    } else {
      // Add image if not selected
      newSelectedImages = [...scene.selectedProductImages, imageId];
    }

    updateSceneGeneration(sceneNumber, {
      selectedProductImages: newSelectedImages,
    });
  };

  const generateImage = async (sceneNumber: number) => {
    const scene = sceneGenerations.find((s) => s.sceneNumber === sceneNumber);
    if (!scene || scene.selectedProductImages.length === 0) {
      toast.error("Please select at least one product image for this scene");
      return;
    }

    // Check credits before generating
    try {
      const creditCheckResponse = await api.checkCredits({
        action: "IMAGE_GENERATION",
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

    updateSceneGeneration(sceneNumber, { isGenerating: true });

    try {
      // Simulate API call to generate image
      await new Promise((resolve) => setTimeout(resolve, 4000));

      // Create mock generated image
      const generatedImage: GeneratedImage = {
        id: Math.random().toString(36).substring(2, 9),
        url: `/api/placeholder/400/400?scene=${sceneNumber}&t=${Date.now()}`,
        sceneNumber,
        prompt:
          scene.imagePrompt || `${scene.scriptText} featuring the product`,
        approved: false,
      };

      dispatch({ type: "ADD_GENERATED_IMAGE", payload: generatedImage });

      // Consume credits for image generation
      try {
        await api.consumeCredits({
          action: "IMAGE_GENERATION",
          campaign_id: state.campaignId,
        });
        setCurrentCredits((prev) => prev - 2); // Update local state (2 credits for image generation)
      } catch (error) {
        console.error("Failed to consume credits:", error);
      }

      toast.success(`Scene ${sceneNumber} image generated successfully!`);
    } catch (error) {
      toast.error("Failed to generate image. Please try again.");
    } finally {
      updateSceneGeneration(sceneNumber, { isGenerating: false });
    }
  };

  const approveImage = (imageId: string) => {
    dispatch({
      type: "UPDATE_GENERATED_IMAGE",
      payload: { id: imageId, updates: { approved: true } },
    });
    toast.success("Image approved!");
  };

  const regenerateImage = async (imageId: string) => {
    const image = state.generatedImages.find((img) => img.id === imageId);
    if (!image) return;

    updateSceneGeneration(image.sceneNumber, { isGenerating: true });

    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Update with new generated image
      const newUrl = `/api/placeholder/400/400?scene=${
        image.sceneNumber
      }&t=${Date.now()}`;
      dispatch({
        type: "UPDATE_GENERATED_IMAGE",
        payload: { id: imageId, updates: { url: newUrl, approved: false } },
      });

      toast.success("Image regenerated!");
    } catch (error) {
      toast.error("Failed to regenerate image");
    } finally {
      updateSceneGeneration(image.sceneNumber, { isGenerating: false });
    }
  };

  const approvedImages = state.generatedImages.filter((img) => img.approved);
  const canProceed = approvedImages.length >= totalScenes;

  const handleNext = async () => {
    if (!canProceed) {
      toast.error(
        `Please generate and approve at least ${Math.min(
          3,
          totalScenes
        )} images to continue`
      );
      return;
    }

    // Save image generation data if we have a campaign ID
    if (state.campaignId) {
      try {
        const stepData = {
          generatedImages: state.generatedImages,
          sceneGenerations,
        };

        await api.saveCampaignStepData(state.campaignId, 3, stepData);
        toast.success("Images saved");
      } catch (error) {
        console.error("Failed to save images:", error);
        toast.error("Failed to save images");
        return;
      }
    }

    onNext();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Generate Scene Images
        </h2>
        <p className="text-muted-foreground text-sm">
          Generate images for each scene of your video. Upload product images,
          edit scripts, and generate scene-specific images.
        </p>
      </div>

      {/* Product Image Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Product Images</span>
            <div className="flex items-center space-x-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleProductImageUpload}
                disabled={isUploadingImage}
                className="hidden"
                id="product-image-upload"
              />
              <Button
                size="sm"
                onClick={() =>
                  document.getElementById("product-image-upload")?.click()
                }
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {isUploadingImage ? "Uploading..." : "Upload Image"}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {state.productImages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No product images uploaded yet.</p>
              <p className="text-sm">
                Upload images to use in your video scenes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {state.productImages.map((image) => (
                <div key={image.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted border">
                    <img
                      src={image.url}
                      alt={image.name}
                      className="object-cover"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeProductImage(image.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  <p
                    className="text-xs text-center mt-2 truncate"
                    title={image.name}
                  >
                    {image.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scene Generation Cards */}
      <div className="grid gap-6">
        {sceneGenerations.map((scene) => {
          const existingImage = state.generatedImages.find(
            (img) => img.sceneNumber === scene.sceneNumber
          );
          const isGenerating = scene.isGenerating;

          return (
            <Card key={scene.sceneNumber} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Badge variant="outline">Scene {scene.sceneNumber}</Badge>
                    <span className="text-base">
                      Scene {scene.sceneNumber} Image Generation
                    </span>
                  </CardTitle>
                  {existingImage?.approved && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-medium">Approved</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Script and Settings */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">
                          Script for this scene:
                        </label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleScriptEdit(scene.sceneNumber)}
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          {scriptEditMode[scene.sceneNumber]
                            ? "Cancel"
                            : "Edit"}
                        </Button>
                      </div>
                      {scriptEditMode[scene.sceneNumber] ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editableScript[scene.sceneNumber] || ""}
                            onChange={(e) =>
                              updateScriptText(
                                scene.sceneNumber,
                                e.target.value
                              )
                            }
                            className="min-h-[80px]"
                            placeholder="Enter script for this scene..."
                          />
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                saveScriptChanges(scene.sceneNumber)
                              }
                              className="flex-1"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Save Changes
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                cancelScriptEdit(scene.sceneNumber)
                              }
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-muted rounded-lg text-sm min-h-[60px] flex items-center">
                          {scene.scriptText ||
                            "No script content for this scene"}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Product Image:
                      </label>

                      {/* Warning banner for multiple image selection */}
                      {scene.selectedProductImages.length > 1 && (
                        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <p className="font-medium text-amber-800 mb-1">
                                Multiple Images Selected
                              </p>
                              <p className="text-amber-700">
                                Using multiple product images in a single scene
                                may result in lower quality or inconsistent
                                results. Consider using fewer images for better
                                outcomes.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2">
                        {state.productImages.map((image) => (
                          <div
                            key={image.id}
                            className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-colors ${
                              scene.selectedProductImages.includes(image.id)
                                ? "border-primary ring-2 ring-primary/20"
                                : "border-border hover:border-primary/50"
                            }`}
                            onClick={() =>
                              toggleProductImage(scene.sceneNumber, image.id)
                            }
                          >
                            <img
                              src={image.url}
                              alt={image.name}
                              className="object-cover"
                            />
                            {scene.selectedProductImages.includes(image.id) && (
                              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                <Check className="w-5 h-5 text-primary" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Selection count indicator */}
                      {scene.selectedProductImages.length > 0 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {scene.selectedProductImages.length} image
                          {scene.selectedProductImages.length !== 1
                            ? "s"
                            : ""}{" "}
                          selected
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Image Description (optional):
                      </label>
                      <Textarea
                        placeholder="Describe how you want this scene to look..."
                        value={scene.imagePrompt}
                        onChange={(e) =>
                          updateSceneGeneration(scene.sceneNumber, {
                            imagePrompt: e.target.value,
                          })
                        }
                        className="min-h-[80px] resize-none"
                      />
                    </div>

                    <div className="space-y-3">
                      <CreditDisplay
                        action="IMAGE_GENERATION"
                        currentCredits={currentCredits}
                        onPurchaseClick={() => setShowCreditModal(true)}
                      />
                      <Button
                        onClick={() => generateImage(scene.sceneNumber)}
                        disabled={
                          scene.selectedProductImages.length === 0 ||
                          isGenerating ||
                          currentCredits < 2
                        }
                        className="w-full"
                      >
                        {isGenerating ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Wand2 className="w-4 h-4 mr-2" />
                        )}
                        {existingImage ? "Regenerate Image" : "Generate Image"}
                      </Button>
                    </div>
                  </div>

                  {/* Right: Generated Image */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Generated Image:
                    </label>
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted border-2 border-dashed border-muted-foreground/25">
                      {isGenerating ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                            <p className="text-sm text-muted-foreground">
                              Generating image...
                            </p>
                          </div>
                        </div>
                      ) : existingImage ? (
                        <div className="relative h-full">
                          <img
                            src={existingImage.url}
                            alt={`Scene ${scene.sceneNumber}`}
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-center">
                          <div>
                            <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Click generate to create image
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {existingImage && (
                      <div className="flex space-x-2 mt-3">
                        <Button
                          size="sm"
                          variant={
                            existingImage.approved ? "default" : "outline"
                          }
                          onClick={() => approveImage(existingImage.id)}
                          className="flex-1"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          {existingImage.approved ? "Approved" : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => regenerateImage(existingImage.id)}
                          disabled={isGenerating}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Generation Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">
                {totalScenes}
              </div>
              <p className="text-sm text-muted-foreground">Total Scenes</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">
                {state.generatedImages.length}
              </div>
              <p className="text-sm text-muted-foreground">Generated</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">
                {approvedImages.length}
              </div>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
          </div>
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
            <span className="font-medium capitalize">
              {state.campaignObjective?.replace("-", " ") || "Not set"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Scenes:</span>
            <span className="font-medium">{state.numberOfScenes} scenes</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Voice:</span>
            <span className="font-medium capitalize">
              {state.selectedVoice || "Not set"}
            </span>
          </div>
          {state.videoDescription && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Description:</p>
              <p className="text-sm">{state.videoDescription}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-border">
        <Button variant="outline" onClick={onPrev}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={!canProceed} className="px-8">
          Next: Select Images ({approvedImages.length} approved)
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
