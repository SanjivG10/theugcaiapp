"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssetLibraryModal } from "@/components/ui/asset-library-modal";
import { useCampaign } from "@/contexts/CampaignContext";
import {
  Check,
  Image as ImageIcon,
  FolderOpen,
  Edit3,
  GripVertical,
  Play,
  RefreshCw,
  Clock,
} from "lucide-react";
import { AssetFile } from "@/types/api";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "react-beautiful-dnd";
import { SceneData } from "./ScriptGeneration";

interface AssetsSetupProps {
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

export function AssetsSetup({ onNext, onPrev }: AssetsSetupProps) {
  const { state, dispatch } = useCampaign();
  const totalScenes = state.sceneNumber;

  // Asset library modal state
  const [assetLibraryOpen, setAssetLibraryOpen] = useState(false);
  const [currentScene, setCurrentScene] = useState<number>(1);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [orderedImages, setOrderedImages] = useState<string[]>([]);

  const [sceneData, setSceneData] = useState<SceneData[]>(() => {
    return state.sceneData.map((scene) => ({
      scene_number: scene.scene_number,
      scene_script: scene.scene_script,
      image: {
        name: scene.image?.name ?? "",
        url: scene.image?.url ?? "",
        isProcessing: scene.image?.isProcessing ?? false,
      },
      audio: {
        previewUrl: scene.audio?.previewUrl ?? "",
        id: scene.audio?.id ?? "",
        metadata: scene.audio?.metadata ?? {},
      },
      video: {
        prompt: scene.video?.prompt ?? "",
        url: scene.video?.url ?? "",
        isProcessing: scene.video?.isProcessing ?? false,
      },
    }));
  });

  // Helper function to validate if an image is actually valid (has a non-empty URL)
  const isValidImage = (
    image: { url?: string; name?: string } | null | undefined
  ): boolean => {
    return Boolean(
      image &&
        image.url &&
        typeof image.url === "string" &&
        image.url.trim() !== "" &&
        image.url !== "undefined" &&
        image.url !== "null"
    );
  };

  // Helper function to validate if an AssetFile is actually valid
  const isValidAssetFile = (asset: AssetFile | undefined): boolean => {
    return Boolean(
      asset &&
        asset.storage_url &&
        typeof asset.storage_url === "string" &&
        asset.storage_url.trim() !== "" &&
        asset.storage_url !== "undefined" &&
        asset.storage_url !== "null"
    );
  };

  // Initialize scene data from campaign context

  // Load existing scene images from backend
  React.useEffect(() => {
    const loadSceneImages = async () => {
      if (!state.campaignId) return;

      try {
        const response = await api.getCampaign(state.campaignId);
        if (response.success && response.data?.scene_data) {
          console.log("response.data.scene_data", response.data.scene_data);
          const savedSceneData = response.data.scene_data;

          setSceneData(savedSceneData as SceneData[]);

          const imagesWithAssets = savedSceneData
            .filter((s) => s.image && isValidImage(s.image))
            .map((s) => `scene-${s.scene_number}-image`);
          setSelectedImageIds(imagesWithAssets);
          setOrderedImages(imagesWithAssets);
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

    const selectedAsset = assets[0];

    // Update scene data
    setSceneData((prev) =>
      prev.map((scene) =>
        scene.scene_number === currentScene
          ? {
              ...scene,
              image: {
                name: selectedAsset.name,
                url: selectedAsset.storage_url,
                isProcessing: false,
              },
            }
          : scene
      )
    );

    // Update selected images for sequence view
    const newImageId = selectedAsset.id;
    const oldImageId = sceneData.find((s) => s.scene_number === currentScene)
      ?.image?.url;

    if (oldImageId && selectedImageIds.includes(oldImageId)) {
      // Replace existing image
      setSelectedImageIds((prev) =>
        prev.map((id) => (id === oldImageId ? newImageId : id))
      );
      setOrderedImages((prev) =>
        prev.map((id) => (id === oldImageId ? newImageId : id))
      );
    } else {
      // Add new image
      setSelectedImageIds((prev) => [...prev, newImageId]);
      setOrderedImages((prev) => [...prev, newImageId]);
    }

    toast.success(`Image selected for Scene ${currentScene}`);
  };

  const scenesWithImages = sceneData.filter(
    (scene) => scene.image && isValidImage(scene.image)
  );
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
      // Update scene data in context with image information
      sceneData.forEach((scene) => {
        if (scene.image && isValidImage(scene.image)) {
          dispatch({
            type: "UPDATE_SCENE_DATA",
            payload: {
              sceneNumber: scene.scene_number,
              data: {
                image: {
                  name: scene.image.name,
                  url: scene.image.url,
                  isProcessing: false,
                },
                audio: {
                  previewUrl: scene.audio.previewUrl ?? "",
                  id: scene.audio.id ?? "",
                  metadata: scene.audio.metadata ?? {},
                },
                video: {
                  prompt: scene.video.prompt ?? "",
                  url: scene.video.url ?? "",
                  isProcessing: scene.video.isProcessing ?? false,
                },
                scene_script: scene.scene_script,
              },
            },
          });
        }
      });

      // Save to database
      const updateData = {
        scene_data: sceneData.map((scene) => ({
          scene_number: scene.scene_number,
          scene_script: scene.scene_script,
          image:
            scene.image && isValidImage(scene.image)
              ? {
                  name: scene.image.name,
                  url: scene.image.url,
                  isProcessing: false,
                }
              : undefined,
        })),
      };

      const response = await api.updateCampaign(state.campaignId, updateData);
      if (!response.success) {
        throw new Error(response.message || "Failed to save scene assets");
      }

      toast.success("Scene assets saved successfully");
      onNext();
    } catch (error) {
      console.error("Failed to save scene assets:", error);
      toast.error("Failed to save scene assets. Please try again.");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Assets Setup
        </h2>
        <p className="text-muted-foreground text-sm">
          Select and arrange images for your {totalScenes} scenes. You can
          browse existing assets, upload new ones, or generate AI images.
        </p>
      </div>

      <Tabs defaultValue="selection" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="selection">Image Selection</TabsTrigger>
          <TabsTrigger
            value="sequence"
            disabled={scenesWithImages.length === 0}
          >
            Sequence & Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="selection" className="space-y-6 mt-6">
          {/* Scene Cards for Image Selection */}
          <div className="grid gap-6">
            {sceneData.map((scene, index) => (
              <Card
                key={`${scene.scene_number}-${index}`}
                className="overflow-hidden"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Badge variant="outline">
                        Scene {scene.scene_number}
                      </Badge>
                      <span className="text-base">
                        Scene {scene.scene_number}
                      </span>
                    </CardTitle>
                    {scene.image && isValidImage(scene.image) && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <Check className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Image Selected
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Script */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block text-muted-foreground">
                          Script for Scene {scene.scene_number}
                        </label>
                        <div className="p-4 bg-card border rounded-lg text-sm  whitespace-pre-wrap leading-relaxed relative">
                          {scene.scene_script ? (
                            <div className="flex gap-1">
                              <p className="flex-1">{scene.scene_script}</p>
                            </div>
                          ) : (
                            <div className="text-muted-foreground italic flex items-center justify-center h-full">
                              No script content available for this scene
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Image Selection Button */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Scene Image: <span className="text-red-500">*</span>
                        </label>

                        {!isValidImage(scene.image) && (
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
                          variant={
                            scene.image && isValidImage(scene.image)
                              ? "secondary"
                              : "outline"
                          }
                          className={`w-full h-20 border-2 border-dashed transition-all ${
                            scene.image && isValidImage(scene.image)
                              ? "border-green-300 bg-green-50 hover:bg-green-100"
                              : "border-muted-foreground/25 hover:border-primary/50"
                          }`}
                          onClick={() =>
                            handleSceneImageSelect(scene.scene_number)
                          }
                        >
                          <div className="text-center">
                            {scene.image && isValidImage(scene.image) ? (
                              <>
                                <Check className="w-6 h-6 mx-auto mb-1 text-green-600" />
                                <p className="text-sm font-medium text-green-800">
                                  Change Selected Image
                                </p>
                                <p className="text-xs text-green-600">
                                  {scene.image.name}
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
                        {scene.image && isValidImage(scene.image) ? (
                          <div className="relative h-full">
                            <img
                              src={scene.image.url}
                              alt={scene.image.name || scene.image.name}
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sequence" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Selected Images Gallery - Left Panel */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Selected Images</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {selectedImageIds.length} of {totalScenes} images selected
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {scenesWithImages.map((scene, index) => (
                      <div
                        key={`${scene.image.url}-${index}`}
                        className="space-y-3"
                      >
                        <div className="relative">
                          <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary">
                            <img
                              src={scene.image.url}
                              alt={`Scene ${scene.scene_number}`}
                              className="object-cover w-full h-full"
                            />

                            {/* Scene indicator */}
                            <div className="absolute top-2 left-2">
                              <Badge variant="secondary">
                                Scene {scene.scene_number}
                              </Badge>
                            </div>
                          </div>

                          {/* Script preview */}
                          <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                            <p className="line-clamp-2 text-muted-foreground">
                              {scene.scene_script || "No script content"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

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
          Next: Video Prompts ({scenesWithImages.length}/{totalScenes} selected)
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
