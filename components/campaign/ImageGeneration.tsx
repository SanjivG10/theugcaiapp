"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssetLibraryModal } from "@/components/ui/asset-library-modal";
import { useCampaign } from "@/contexts/CampaignContext";
import { Check, Image as ImageIcon, FolderOpen, Edit3 } from "lucide-react";
import { AssetFile } from "@/types/api";
import toast from "react-hot-toast";
import { api } from "@/lib/api";

interface ImageGenerationProps {
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

interface SceneImageData {
  sceneNumber: number;
  scriptText: string;
  selectedImageId?: string;
  selectedImage?: AssetFile;
}

interface EditableScript {
  [sceneNumber: number]: string;
}

export function ImageGeneration({ onNext, onPrev }: ImageGenerationProps) {
  const { state, dispatch } = useCampaign();
  const totalScenes = state.numberOfScenes;

  // State for script editing
  const [editableScript, setEditableScript] = useState<EditableScript>({});
  const [scriptEditMode, setScriptEditMode] = useState<{
    [sceneNumber: number]: boolean;
  }>({});

  // Asset library modal state
  const [assetLibraryOpen, setAssetLibraryOpen] = useState(false);
  const [currentScene, setCurrentScene] = useState<number>(1);

  // Initialize scene data
  const scriptParagraphs = state.script.split("\n").filter((p) => p.trim());
  const [sceneData, setSceneData] = useState<SceneImageData[]>(() => {
    return Array.from({ length: totalScenes }, (_, index) => ({
      sceneNumber: index + 1,
      scriptText: scriptParagraphs[index] || "",
      selectedImageId: undefined,
      selectedImage: undefined,
    }));
  });

  React.useEffect(() => {
    if (state.numberOfScenes) {
      setSceneData(
        Array.from({ length: state.numberOfScenes }, (_, index) => ({
          sceneNumber: index + 1,
          scriptText: scriptParagraphs[index] || "",
          selectedImageId: undefined,
          selectedImage: undefined,
        }))
      );
    }
  }, [state.numberOfScenes]);

  // Load existing scene images from backend
  React.useEffect(() => {
    const loadSceneImages = async () => {
      if (!state.campaignId) return;

      try {
        const response = await api.getCampaign(state.campaignId);
        if (
          response.success &&
          response.data?.step_data?.step_3?.generatedImages
        ) {
          const savedImages = response.data.step_data.step_3.generatedImages;

          // Update scene data with saved images
          setSceneData((prev) =>
            prev.map((scene) => {
              const savedImage = savedImages.find(
                (img) => img.sceneNumber === scene.sceneNumber
              );
              if (savedImage) {
                // Convert GeneratedImage back to AssetFile format for compatibility
                const assetFile: AssetFile = {
                  id: savedImage.id,
                  user_id: "",
                  business_id: "",
                  folder_id: undefined,
                  name: `Scene ${savedImage.sceneNumber} Image`,
                  original_name: `scene_${savedImage.sceneNumber}_image`,
                  file_type: "image",
                  file_size: 0,
                  storage_url: savedImage.url,
                  storage_path: "",
                  thumbnail_url: savedImage.url,
                  is_generated: true,
                  alt_text: savedImage.prompt,
                  tags: [],
                  metadata: {},
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  download_count: 0,
                };
                return {
                  ...scene,
                  selectedImageId: savedImage.id,
                  selectedImage: assetFile,
                };
              }
              return scene;
            })
          );
        }
      } catch (error) {
        console.error("Failed to load scene images:", error);
      }
    };

    loadSceneImages();
  }, [state.campaignId]);

  // Handle scene image selection from asset library
  const handleSceneImageSelect = (sceneNumber: number) => {
    setCurrentScene(sceneNumber);
    setAssetLibraryOpen(true);
  };

  const handleAssetLibrarySelect = (assets: AssetFile[]) => {
    if (assets.length === 0) return;

    const selectedAsset = assets[0]; // Single selection

    // Update scene data
    setSceneData((prev) =>
      prev.map((scene) =>
        scene.sceneNumber === currentScene
          ? {
              ...scene,
              selectedImageId: selectedAsset.id,
              selectedImage: selectedAsset,
            }
          : scene
      )
    );

    toast.success(`Image selected for Scene ${currentScene}`);
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

  const saveScriptChanges = (sceneNumber: number) => {
    const newText = editableScript[sceneNumber] || "";

    // Update scene data
    setSceneData((prev) =>
      prev.map((scene) =>
        scene.sceneNumber === sceneNumber
          ? { ...scene, scriptText: newText }
          : scene
      )
    );

    // Update the campaign script
    const updatedScriptParagraphs = [...scriptParagraphs];
    updatedScriptParagraphs[sceneNumber - 1] = newText;
    const updatedScript = updatedScriptParagraphs.join("\n\n");

    // Update campaign context
    dispatch({ type: "SET_SCRIPT", payload: updatedScript });

    toast.success("Script updated successfully");

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

  // Check if all scenes have images selected
  const scenesWithImages = sceneData.filter((scene) => scene.selectedImage);
  const canProceed = scenesWithImages.length >= totalScenes;

  const handleNext = async () => {
    if (!canProceed) {
      toast.error(
        `Please select images for all ${totalScenes} scenes to continue`
      );
      return;
    }

    if (!state.campaignId) {
      toast.error("Campaign ID not found");
      return;
    }

    try {
      const generatedImages = sceneData
        .filter((scene) => scene.selectedImage)
        .map((scene) => ({
          id: scene.selectedImage!.id,
          url: scene.selectedImage!.storage_url,
          sceneNumber: scene.sceneNumber,
          prompt:
            scene.selectedImage!.alt_text || `Scene ${scene.sceneNumber} image`,
          approved: true, // Auto-approve selected images
        }));

      // Save to backend via step data
      await api.saveCampaignStepData(state.campaignId, 3, {
        generatedImages,
      });

      // Add selected images to context for compatibility with other components
      generatedImages.forEach((generatedImage) => {
        dispatch({ type: "ADD_GENERATED_IMAGE", payload: generatedImage });
      });

      toast.success("Scene images saved successfully");
      onNext();
    } catch (error) {
      console.error("Failed to save scene images:", error);
      toast.error("Failed to save scene images. Please try again.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Scene Image Selection
          </h2>
          <p className="text-muted-foreground text-sm">
            Select an image for each scene from your asset library. You can
            browse existing images, upload new ones, or generate AI images.
          </p>
        </div>

        {/* Recommendation Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg
                className="w-4 h-4 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-1">
                💡 Recommendation
              </h3>
              <p className="text-blue-800 text-sm">
                For best results, we recommend editing custom images for each
                scene using AI from existing product. Click &quot;Select from
                Asset Library&quot; → &quot;Select an image&quot; tab, and
                describe exactly what you want for each scene. This ensures your
                images perfectly match your script and campaign goals.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scene Cards */}
      <div className="grid gap-6">
        {sceneData.map((scene, index) => (
          <Card
            key={`${scene.sceneNumber}-${index}`}
            className="overflow-hidden"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Badge variant="outline">Scene {scene.sceneNumber}</Badge>
                  <span className="text-base">Scene {scene.sceneNumber}</span>
                </CardTitle>
                {scene.selectedImage && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">Image Selected</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Script */}
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
                        {scriptEditMode[scene.sceneNumber] ? "Cancel" : "Edit"}
                      </Button>
                    </div>
                    {scriptEditMode[scene.sceneNumber] ? (
                      <div className="space-y-2">
                        <textarea
                          value={
                            editableScript[scene.sceneNumber] ||
                            scene.scriptText
                          }
                          onChange={(e) =>
                            updateScriptText(scene.sceneNumber, e.target.value)
                          }
                          className="w-full min-h-[80px] p-3 border border-input rounded-lg resize-none"
                          placeholder="Enter script for this scene..."
                        />
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => saveScriptChanges(scene.sceneNumber)}
                            className="flex-1"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Save Changes
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelScriptEdit(scene.sceneNumber)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-muted rounded-lg text-sm min-h-[80px] flex items-center">
                        {scene.scriptText || "No script content for this scene"}
                      </div>
                    )}
                  </div>

                  {/* Image Selection Button */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Scene Image: <span className="text-red-500">*</span>
                    </label>

                    {!scene.selectedImage && (
                      <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <svg
                            className="w-4 h-4 text-amber-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <p className="text-amber-800 text-sm font-medium">
                            Image required to continue
                          </p>
                        </div>
                      </div>
                    )}

                    <Button
                      variant={scene.selectedImage ? "secondary" : "outline"}
                      className={`w-full h-20 border-2 border-dashed transition-all ${
                        scene.selectedImage
                          ? "border-green-300 bg-green-50 hover:bg-green-100"
                          : "border-muted-foreground/25 hover:border-primary/50"
                      }`}
                      onClick={() => handleSceneImageSelect(scene.sceneNumber)}
                    >
                      <div className="text-center">
                        {scene.selectedImage ? (
                          <>
                            <Check className="w-6 h-6 mx-auto mb-1 text-green-600" />
                            <p className="text-sm font-medium text-green-800">
                              Change Selected Image
                            </p>
                            <p className="text-xs text-green-600">
                              {scene.selectedImage.name}
                            </p>
                          </>
                        ) : (
                          <>
                            <FolderOpen className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                            <p className="text-sm font-medium">
                              Select from Asset Library
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Browse • Upload • Generate with AI
                            </p>
                          </>
                        )}
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Right: Selected Image Preview */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Selected Image:
                  </label>
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted border-2 border-dashed border-muted-foreground/25">
                    {scene.selectedImage ? (
                      <div className="relative h-full">
                        <img
                          src={
                            scene.selectedImage.thumbnail_url ||
                            scene.selectedImage.storage_url
                          }
                          alt={
                            scene.selectedImage.alt_text ||
                            scene.selectedImage.name
                          }
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-green-600">Selected</Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-center">
                        <div>
                          <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No image selected
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Click &quot;Select from Asset Library&quot; to
                            choose an image
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {scene.selectedImage && (
                    <div className="mt-3 space-y-2">
                      <div className="text-xs text-muted-foreground">
                        <strong>Name:</strong> {scene.selectedImage.name}
                      </div>
                      {scene.selectedImage.alt_text && (
                        <div className="text-xs text-muted-foreground">
                          <strong>Description:</strong>{" "}
                          {scene.selectedImage.alt_text}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Selection Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">
                {totalScenes}
              </div>
              <p className="text-sm text-muted-foreground">Total Scenes</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">
                {scenesWithImages.length}
              </div>
              <p className="text-sm text-muted-foreground">Images Selected</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(scenesWithImages.length / totalScenes) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {scenesWithImages.length} of {totalScenes} scenes have images
              selected
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-border">
        <Button variant="outline" onClick={onPrev}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={!canProceed} className="px-8">
          Next: Continue ({scenesWithImages.length}/{totalScenes} selected)
        </Button>
      </div>

      {/* Asset Library Modal */}
      <AssetLibraryModal
        isOpen={assetLibraryOpen}
        onClose={() => setAssetLibraryOpen(false)}
        onSelectAssets={handleAssetLibrarySelect}
        multiSelect={false}
        title={`Select Image for Scene ${currentScene}`}
        description="Choose an image from your asset library, upload a new one, or generate with AI"
        acceptedFileTypes={["image/*"]}
        maxFileSize={10 * 1024 * 1024}
      />
    </div>
  );
}
