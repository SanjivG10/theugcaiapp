"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCampaign } from "@/contexts/CampaignContext";
import { Clock, GripVertical, Play, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "react-beautiful-dnd";
import toast from "react-hot-toast";
import { AssetLibraryModal } from "@/components/ui/asset-library-modal";
import { AssetFile } from "@/types/api";
import { api } from "@/lib/api";

interface ImageSelectionProps {
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

export function ImageSelection({ onNext, onPrev }: ImageSelectionProps) {
  const { state, dispatch } = useCampaign();
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>(
    state.selectedImages
  );
  const [orderedImages, setOrderedImages] = useState<string[]>([]);
  const [assetLibraryOpen, setAssetLibraryOpen] = useState(false);
  const [regeneratingImageId, setRegeneratingImageId] = useState<string | null>(
    null
  );

  const approvedImages = state.generatedImages.filter((img) => img.approved);

  useEffect(() => {
    // Initialize with previously selected images only
    if (state.selectedImages.length > 0) {
      setSelectedImageIds(state.selectedImages);
      setOrderedImages(state.selectedImages);
    } else {
      // Don't auto-select all images - let user choose
      setSelectedImageIds([]);
      setOrderedImages([]);
    }
  }, [approvedImages, state.selectedImages]);

  // Load selected images from backend on component mount
  useEffect(() => {
    const loadSelectedImages = async () => {
      if (!state.campaignId) return;

      try {
        const response = await api.getCampaign(state.campaignId);
        if (
          response.success &&
          response.data?.step_data?.step_4?.selectedImages
        ) {
          const savedSelectedImages =
            response.data.step_data.step_4.selectedImages;
          setSelectedImageIds(savedSelectedImages);
          setOrderedImages(savedSelectedImages);
          // Also update context to match backend
          dispatch({
            type: "SET_SELECTED_IMAGES",
            payload: savedSelectedImages,
          });
        }
      } catch (error) {
        console.error("Failed to load selected images:", error);
      }
    };

    loadSelectedImages();
  }, [state.campaignId, dispatch]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newOrderedImages = Array.from(orderedImages);
    const [reorderedImage] = newOrderedImages.splice(result.source.index, 1);
    newOrderedImages.splice(result.destination.index, 0, reorderedImage);

    setOrderedImages(newOrderedImages);
  };

  const estimateDuration = () => {
    return selectedImageIds.length * 3; // 3 seconds per image
  };

  const handleNext = async () => {
    if (selectedImageIds.length === 0) {
      toast.error("Please select at least one image");
      return;
    }

    try {
      // Save selected images to backend to prevent duplicates
      if (state.campaignId) {
        await api.saveCampaignStepData(state.campaignId, 4, {
          selectedImages: orderedImages,
        });
      }

      dispatch({ type: "SET_SELECTED_IMAGES", payload: orderedImages });
      toast.success("Image selection saved successfully");
      onNext();
    } catch (error) {
      console.error("Failed to save image selection:", error);
      toast.error("Failed to save selection. Please try again.");
    }
  };

  const regenerateImage = (imageId: string) => {
    setRegeneratingImageId(imageId);
    setAssetLibraryOpen(true);
  };

  const handleAssetLibrarySelect = async (assets: AssetFile[]) => {
    if (assets.length === 0 || !regeneratingImageId) return;

    const selectedAsset = assets[0];
    const oldImage = approvedImages.find(
      (img) => img.id === regeneratingImageId
    );
    if (!oldImage) return;

    try {
      // Create new generated image with same scene number but new asset
      const newGeneratedImage = {
        id: selectedAsset.id,
        url: selectedAsset.storage_url,
        sceneNumber: oldImage.sceneNumber,
        prompt: selectedAsset.alt_text || `Scene ${oldImage.sceneNumber} image`,
        approved: true,
      };

      // Remove the old image and add the new one
      const updatedGeneratedImages = state.generatedImages.filter(
        (img) => img.id !== regeneratingImageId
      );
      updatedGeneratedImages.push(newGeneratedImage);

      // Update the generated images in context
      dispatch({
        type: "SET_GENERATED_IMAGES",
        payload: updatedGeneratedImages,
      });

      // Update selected and ordered arrays if this image was selected
      if (selectedImageIds.includes(regeneratingImageId)) {
        const newSelectedIds = selectedImageIds.map((id) =>
          id === regeneratingImageId ? selectedAsset.id : id
        );
        const newOrderedIds = orderedImages.map((id) =>
          id === regeneratingImageId ? selectedAsset.id : id
        );
        setSelectedImageIds(newSelectedIds);
        setOrderedImages(newOrderedIds);
      }

      // Save to backend
      if (state.campaignId) {
        await api.saveCampaignStepData(state.campaignId, 3, {
          generatedImages: updatedGeneratedImages,
        });
      }

      toast.success(`Image updated for Scene ${oldImage.sceneNumber}`);
    } catch (error) {
      console.error("Failed to update image:", error);
      toast.error("Failed to update image. Please try again.");
    } finally {
      setRegeneratingImageId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Select & Arrange Images
        </h2>
        <p className="text-muted-foreground text-sm">
          Choose which images to include in your video and arrange them in the
          desired order.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Image Gallery - Left Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Available Images</CardTitle>
                <div className="flex items-center space-x-4">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const allIds = approvedImages.map((img) => img.id);
                        setSelectedImageIds(allIds);
                        setOrderedImages(allIds);
                      }}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedImageIds([]);
                        setOrderedImages([]);
                      }}
                    >
                      Deselect All
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedImageIds.length} of {approvedImages.length} images
                    selected
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {approvedImages.map((image, index) => (
                  <div key={`${image.id}-${index}`} className="space-y-3">
                    <div className="relative">
                      <div
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors cursor-pointer hover:border-primary/50 ${
                          selectedImageIds.includes(image.id)
                            ? "border-primary"
                            : "border-muted"
                        }`}
                        onClick={() => {
                          if (selectedImageIds.includes(image.id)) {
                            // Remove from selection
                            const newSelected = selectedImageIds.filter(
                              (id) => id !== image.id
                            );
                            const newOrdered = orderedImages.filter(
                              (id) => id !== image.id
                            );
                            setSelectedImageIds(newSelected);
                            setOrderedImages(newOrdered);
                          } else {
                            // Add to selection
                            const newSelected = [...selectedImageIds, image.id];
                            const newOrdered = [...orderedImages, image.id];
                            setSelectedImageIds(newSelected);
                            setOrderedImages(newOrdered);
                          }
                        }}
                      >
                        <img
                          src={image.url}
                          alt={`Scene ${image.sceneNumber}`}
                          className="object-cover"
                        />

                        {/* Selection indicator */}
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary">
                            Scene {image.sceneNumber}
                          </Badge>
                        </div>

                        {/* Selection checkmark */}
                        {selectedImageIds.includes(image.id) && (
                          <div className="absolute top-2 right-2">
                            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          </div>
                        )}

                        {/* Order number */}
                        {selectedImageIds.includes(image.id) && (
                          <div className="absolute bottom-2 right-2">
                            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                              {orderedImages.indexOf(image.id) + 1}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Script preview */}
                      <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                        <p className="line-clamp-2 text-muted-foreground">
                          {state.script.split("\n\n")[image.sceneNumber - 1] ||
                            "No script content"}
                        </p>
                      </div>

                      {/* Regenerate option */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => regenerateImage(image.id)}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Regenerate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sequence & Preview - Right Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Video Sequence</CardTitle>
              <p className="text-sm text-muted-foreground">
                Drag to reorder images
              </p>
            </CardHeader>
            <CardContent>
              {selectedImageIds.length === 0 ? (
                <div className="text-center py-8">
                  <Play className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Select images to preview sequence
                  </p>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="sequence">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-3"
                      >
                        {orderedImages.map((imageId, index) => {
                          const image = approvedImages.find(
                            (img) => img.id === imageId
                          );
                          if (!image) return null;

                          return (
                            <Draggable
                              key={imageId}
                              draggableId={imageId}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`flex items-center space-x-3 p-2 rounded-lg border ${
                                    snapshot.isDragging
                                      ? "border-primary bg-primary/5"
                                      : "border-muted"
                                  }`}
                                >
                                  <div {...provided.dragHandleProps}>
                                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                                  </div>

                                  <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                                    <img
                                      src={image.url}
                                      alt={`Scene ${image.sceneNumber}`}
                                      width={48}
                                      height={48}
                                      className="object-cover"
                                    />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">
                                      Scene {image.sceneNumber}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Position {index + 1}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Video Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {selectedImageIds.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Scenes</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {estimateDuration()}s
                  </div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Estimated duration
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        (estimateDuration() / 60) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {estimateDuration()}s of recommended 30-60s
                </p>
              </div>
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
          disabled={selectedImageIds.length === 0}
          className="px-8"
        >
          Next: Create Video Prompts ({selectedImageIds.length} selected)
        </Button>
      </div>

      {/* Asset Library Modal for Regenerating Images */}
      <AssetLibraryModal
        isOpen={assetLibraryOpen}
        onClose={() => {
          setAssetLibraryOpen(false);
          setRegeneratingImageId(null);
        }}
        onSelectAssets={handleAssetLibrarySelect}
        multiSelect={false}
        title={regeneratingImageId ? `Replace Image for Scene` : "Select Image"}
        description="Choose a different image from your asset library, upload a new one, or generate with AI"
        acceptedFileTypes={["image/*"]}
        maxFileSize={10 * 1024 * 1024}
      />
    </div>
  );
}
