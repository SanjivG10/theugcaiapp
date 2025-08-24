"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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

  const approvedImages = state.generatedImages.filter((img) => img.approved);

  useEffect(() => {
    // Initialize with previously selected images or all approved images
    if (state.selectedImages.length > 0) {
      setSelectedImageIds(state.selectedImages);
      setOrderedImages(state.selectedImages);
    } else {
      const allApprovedIds = approvedImages.map((img) => img.id);
      setSelectedImageIds(allApprovedIds);
      setOrderedImages(allApprovedIds);
    }
  }, [approvedImages]);

  const handleImageToggle = (imageId: string, checked: boolean) => {
    if (checked) {
      // Only add if not already selected
      if (!selectedImageIds.includes(imageId)) {
        const newSelected = [...selectedImageIds, imageId];
        setSelectedImageIds(newSelected);
        setOrderedImages((prev) => [...prev, imageId]);
      }
    } else {
      // Remove from both selected and ordered arrays
      const newSelected = selectedImageIds.filter((id) => id !== imageId);
      setSelectedImageIds(newSelected);
      setOrderedImages((prev) => prev.filter((id) => id !== imageId));
    }
  };

  const handleSelectAll = () => {
    const allIds = approvedImages.map((img) => img.id);
    setSelectedImageIds(allIds);
    setOrderedImages(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedImageIds([]);
    setOrderedImages([]);
  };

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

  const handleNext = () => {
    if (selectedImageIds.length === 0) {
      toast.error("Please select at least one image");
      return;
    }

    dispatch({ type: "SET_SELECTED_IMAGES", payload: orderedImages });
    onNext();
  };

  const regenerateImage = async (imageId: string) => {
    // This would trigger image regeneration
    toast.success("Image regeneration started");
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
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAll}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedImageIds.length} of {approvedImages.length} images
                selected
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {approvedImages.map((image) => (
                  <div key={image.id} className="space-y-3">
                    <div className="relative">
                      <div
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                          selectedImageIds.includes(image.id)
                            ? "border-primary"
                            : "border-muted"
                        }`}
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

                        {/* Selection checkbox */}
                        <div className="absolute top-2 right-2">
                          <Checkbox
                            checked={selectedImageIds.includes(image.id)}
                            onCheckedChange={(checked) =>
                              handleImageToggle(image.id, checked === true)
                            }
                            className="bg-white"
                          />
                        </div>

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
    </div>
  );
}
